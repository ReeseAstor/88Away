import sharp from 'sharp';

/**
 * Vercel Serverless Optimized Image Upscaler
 * 
 * Constraints addressed:
 * - No filesystem access (base64 only)
 * - Memory limit: 1024MB default, 3008MB max
 * - Execution time: 10s default, 60s max (Pro)
 * - Payload size: 4.5MB request body limit
 */

// Vercel-optimized limits
const VERCEL_LIMITS = {
  maxInputSizeMB: 4, // Stay under 4.5MB payload limit
  maxOutputDimension: 4096, // Reduced for memory efficiency
  maxScale: 3, // Cap scale to prevent memory issues
  timeoutMs: 25000, // Leave buffer before Vercel timeout
} as const;

export interface UpscaleRequest {
  imageBase64: string; // Required - no filesystem on Vercel
  scale?: number; // 1.5x, 2x, 3x (max)
  width?: number;
  height?: number;
  quality?: number; // 1-100
  format?: 'jpeg' | 'png' | 'webp';
  enhanceSharpness?: boolean;
  denoise?: boolean;
}

export interface UpscaleResponse {
  success: boolean;
  imageBase64?: string;
  metadata: {
    originalWidth: number;
    originalHeight: number;
    newWidth: number;
    newHeight: number;
    scale: number;
    format: string;
    processingTime: number;
    fileSizeBytes?: number;
  };
  error?: string;
}

/**
 * Validate input size for Vercel limits
 */
function validateInputSize(base64Data: string): void {
  const sizeInBytes = Buffer.byteLength(base64Data, 'base64');
  const sizeInMB = sizeInBytes / (1024 * 1024);
  
  if (sizeInMB > VERCEL_LIMITS.maxInputSizeMB) {
    throw new Error(`Image too large (${sizeInMB.toFixed(2)}MB). Maximum size is ${VERCEL_LIMITS.maxInputSizeMB}MB for serverless deployment.`);
  }
}

/**
 * Calculate safe dimensions for Vercel memory limits
 */
function calculateSafeDimensions(
  originalWidth: number,
  originalHeight: number,
  requestedScale: number,
  requestedWidth?: number,
  requestedHeight?: number
): { width: number; height: number; actualScale: number } {
  // Cap scale to Vercel-safe maximum
  const safeScale = Math.min(requestedScale, VERCEL_LIMITS.maxScale);
  
  let targetWidth = requestedWidth || Math.round(originalWidth * safeScale);
  let targetHeight = requestedHeight || Math.round(originalHeight * safeScale);
  
  // Cap to max dimension
  const maxDim = VERCEL_LIMITS.maxOutputDimension;
  if (targetWidth > maxDim || targetHeight > maxDim) {
    const ratio = Math.min(maxDim / targetWidth, maxDim / targetHeight);
    targetWidth = Math.round(targetWidth * ratio);
    targetHeight = Math.round(targetHeight * ratio);
  }
  
  // Estimate memory usage (4 bytes per pixel RGBA * 2 for input/output)
  const estimatedMemoryMB = (targetWidth * targetHeight * 4 * 2) / (1024 * 1024);
  const maxMemoryMB = 512; // Conservative limit for serverless
  
  if (estimatedMemoryMB > maxMemoryMB) {
    const reductionRatio = Math.sqrt(maxMemoryMB / estimatedMemoryMB);
    targetWidth = Math.round(targetWidth * reductionRatio);
    targetHeight = Math.round(targetHeight * reductionRatio);
  }
  
  return {
    width: targetWidth,
    height: targetHeight,
    actualScale: targetWidth / originalWidth,
  };
}

/**
 * Upscale an image using sharp - optimized for Vercel serverless
 */
export async function upscaleImage(request: UpscaleRequest): Promise<UpscaleResponse> {
  const startTime = Date.now();

  try {
    // Validate input
    if (!request.imageBase64) {
      throw new Error('imageBase64 is required for serverless deployment');
    }

    // Remove data URL prefix if present
    const base64Data = request.imageBase64.replace(/^data:image\/\w+;base64,/, '');
    
    // Validate size for Vercel limits
    validateInputSize(base64Data);
    
    // Convert to buffer
    const inputBuffer = Buffer.from(base64Data, 'base64');

    // Configure sharp for serverless (limit concurrency and cache)
    sharp.cache({ memory: 50, files: 0, items: 0 });
    sharp.concurrency(1);

    // Get original image metadata
    const originalMetadata = await sharp(inputBuffer).metadata();
    const originalWidth = originalMetadata.width || 0;
    const originalHeight = originalMetadata.height || 0;

    if (!originalWidth || !originalHeight) {
      throw new Error('Could not determine image dimensions');
    }

    // Calculate safe dimensions
    const { width: targetWidth, height: targetHeight, actualScale } = calculateSafeDimensions(
      originalWidth,
      originalHeight,
      request.scale || 2,
      request.width,
      request.height
    );

    // Set output format and quality
    const format = request.format || (originalMetadata.format as 'jpeg' | 'png' | 'webp') || 'jpeg';
    const quality = request.quality || 85; // Slightly lower default for faster processing

    // Build optimized sharp pipeline
    let pipeline = sharp(inputBuffer, {
      limitInputPixels: 268402689, // ~16384x16384
      sequentialRead: true, // Memory optimization
    })
      .resize(targetWidth, targetHeight, {
        kernel: sharp.kernel.lanczos3,
        fit: 'fill',
        fastShrinkOnLoad: true, // Faster processing
      });

    // Apply optional enhancements (lighter settings for speed)
    if (request.enhanceSharpness) {
      pipeline = pipeline.sharpen({
        sigma: 0.8,
        m1: 0.8,
        m2: 0.4,
      });
    }

    if (request.denoise) {
      pipeline = pipeline.median(3);
    }

    // Apply format-specific settings optimized for speed
    switch (format) {
      case 'jpeg':
        pipeline = pipeline.jpeg({ 
          quality, 
          mozjpeg: false, // Faster than mozjpeg
          chromaSubsampling: '4:2:0',
        });
        break;
      case 'png':
        pipeline = pipeline.png({ 
          compressionLevel: 4, // Faster compression
          adaptiveFiltering: false,
        });
        break;
      case 'webp':
        pipeline = pipeline.webp({ 
          quality, 
          effort: 2, // Faster encoding
          smartSubsample: false,
        });
        break;
    }

    // Check timeout before processing
    if (Date.now() - startTime > VERCEL_LIMITS.timeoutMs) {
      throw new Error('Processing timeout - image may be too complex');
    }

    // Process image
    const outputBuffer = await pipeline.toBuffer();
    const outputBase64 = outputBuffer.toString('base64');

    const processingTime = Date.now() - startTime;

    return {
      success: true,
      imageBase64: `data:image/${format};base64,${outputBase64}`,
      metadata: {
        originalWidth,
        originalHeight,
        newWidth: targetWidth,
        newHeight: targetHeight,
        scale: actualScale,
        format,
        processingTime,
        fileSizeBytes: outputBuffer.length,
      },
    };
  } catch (error) {
    console.error('Image upscaling failed:', error);
    return {
      success: false,
      metadata: {
        originalWidth: 0,
        originalHeight: 0,
        newWidth: 0,
        newHeight: 0,
        scale: 0,
        format: '',
        processingTime: Date.now() - startTime,
      },
      error: error instanceof Error ? error.message : 'Unknown error during upscaling',
    };
  }
}

/**
 * Batch upscale multiple images - limited for Vercel
 * Max 3 images per batch to stay within execution time limits
 */
export async function batchUpscaleImages(
  requests: UpscaleRequest[]
): Promise<UpscaleResponse[]> {
  const results: UpscaleResponse[] = [];
  const maxBatchSize = 3; // Vercel-safe batch size

  // Limit batch size
  const limitedRequests = requests.slice(0, maxBatchSize);

  // Process images sequentially to manage memory
  for (const request of limitedRequests) {
    const result = await upscaleImage(request);
    results.push(result);
    
    // Clear sharp cache between images
    sharp.cache(false);
    sharp.cache({ memory: 50, files: 0, items: 0 });
  }

  return results;
}

/**
 * Get supported upscale options - Vercel optimized
 */
export function getUpscaleOptions() {
  return {
    scales: [1.5, 2, 2.5, 3], // Max 3x for Vercel
    formats: ['jpeg', 'png', 'webp'],
    maxInputSizeMB: VERCEL_LIMITS.maxInputSizeMB,
    maxOutputDimension: VERCEL_LIMITS.maxOutputDimension,
    maxBatchSize: 3,
    qualityRange: { min: 50, max: 100, default: 85 },
    enhancements: ['sharpness', 'denoise'],
    serverless: true,
  };
}
