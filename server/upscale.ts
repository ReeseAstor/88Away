import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

export interface UpscaleRequest {
  imageBase64?: string;
  imagePath?: string;
  scale?: number; // 2x, 3x, 4x
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
 * Upscale an image using sharp with optional enhancements
 */
export async function upscaleImage(request: UpscaleRequest): Promise<UpscaleResponse> {
  const startTime = Date.now();

  try {
    // Validate input
    if (!request.imageBase64 && !request.imagePath) {
      throw new Error('Either imageBase64 or imagePath must be provided');
    }

    // Get image buffer
    let inputBuffer: Buffer;
    if (request.imageBase64) {
      // Remove data URL prefix if present
      const base64Data = request.imageBase64.replace(/^data:image\/\w+;base64,/, '');
      inputBuffer = Buffer.from(base64Data, 'base64');
    } else if (request.imagePath) {
      if (!fs.existsSync(request.imagePath)) {
        throw new Error('Image file not found');
      }
      inputBuffer = fs.readFileSync(request.imagePath);
    } else {
      throw new Error('No image data provided');
    }

    // Get original image metadata
    const originalMetadata = await sharp(inputBuffer).metadata();
    const originalWidth = originalMetadata.width || 0;
    const originalHeight = originalMetadata.height || 0;

    if (!originalWidth || !originalHeight) {
      throw new Error('Could not determine image dimensions');
    }

    // Calculate target dimensions
    const scale = request.scale || 2;
    let targetWidth = request.width || Math.round(originalWidth * scale);
    let targetHeight = request.height || Math.round(originalHeight * scale);

    // Cap maximum dimensions to prevent memory issues
    const maxDimension = 8192;
    if (targetWidth > maxDimension) {
      const ratio = maxDimension / targetWidth;
      targetWidth = maxDimension;
      targetHeight = Math.round(targetHeight * ratio);
    }
    if (targetHeight > maxDimension) {
      const ratio = maxDimension / targetHeight;
      targetHeight = maxDimension;
      targetWidth = Math.round(targetWidth * ratio);
    }

    // Set output format and quality
    const format = request.format || (originalMetadata.format as 'jpeg' | 'png' | 'webp') || 'jpeg';
    const quality = request.quality || 90;

    // Build sharp pipeline
    let pipeline = sharp(inputBuffer)
      .resize(targetWidth, targetHeight, {
        kernel: sharp.kernel.lanczos3, // High-quality upscaling
        fit: 'fill',
      });

    // Apply optional enhancements
    if (request.enhanceSharpness) {
      pipeline = pipeline.sharpen({
        sigma: 1.0,
        m1: 1.0,
        m2: 0.5,
      });
    }

    if (request.denoise) {
      pipeline = pipeline.median(3);
    }

    // Apply format-specific settings
    switch (format) {
      case 'jpeg':
        pipeline = pipeline.jpeg({ quality, mozjpeg: true });
        break;
      case 'png':
        pipeline = pipeline.png({ quality, compressionLevel: 6 });
        break;
      case 'webp':
        pipeline = pipeline.webp({ quality, effort: 4 });
        break;
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
        scale: targetWidth / originalWidth,
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
 * Batch upscale multiple images
 */
export async function batchUpscaleImages(
  requests: UpscaleRequest[]
): Promise<UpscaleResponse[]> {
  const results: UpscaleResponse[] = [];

  // Process images sequentially to manage memory
  for (const request of requests) {
    const result = await upscaleImage(request);
    results.push(result);
  }

  return results;
}

/**
 * Get supported upscale options
 */
export function getUpscaleOptions() {
  return {
    scales: [1.5, 2, 3, 4],
    formats: ['jpeg', 'png', 'webp'],
    maxDimension: 8192,
    qualityRange: { min: 1, max: 100, default: 90 },
    enhancements: ['sharpness', 'denoise'],
  };
}
