import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Upload, Download, ZoomIn, Sparkles, Image as ImageIcon, RefreshCw } from 'lucide-react';

interface UpscaleResult {
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

interface ImageUpscalerProps {
  onUpscaleComplete?: (result: UpscaleResult) => void;
  initialImage?: string;
  className?: string;
}

export function ImageUpscaler({ onUpscaleComplete, initialImage, className }: ImageUpscalerProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [sourceImage, setSourceImage] = useState<string | null>(initialImage || null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // Upscale settings
  const [scale, setScale] = useState(2);
  const [quality, setQuality] = useState(90);
  const [format, setFormat] = useState<'jpeg' | 'png' | 'webp'>('jpeg');
  const [enhanceSharpness, setEnhanceSharpness] = useState(true);
  const [denoise, setDenoise] = useState(false);
  
  // Metadata
  const [originalDimensions, setOriginalDimensions] = useState<{ width: number; height: number } | null>(null);
  const [resultMetadata, setResultMetadata] = useState<UpscaleResult['metadata'] | null>(null);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select an image file (JPEG, PNG, or WebP)',
        variant: 'destructive',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setSourceImage(base64);
      setResultImage(null);
      setResultMetadata(null);

      // Get original dimensions
      const img = new window.Image();
      img.onload = () => {
        setOriginalDimensions({ width: img.width, height: img.height });
      };
      img.src = base64;
    };
    reader.readAsDataURL(file);
  }, [toast]);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        setSourceImage(base64);
        setResultImage(null);
        setResultMetadata(null);

        const img = new window.Image();
        img.onload = () => {
          setOriginalDimensions({ width: img.width, height: img.height });
        };
        img.src = base64;
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }, []);

  const handleUpscale = async () => {
    if (!sourceImage) return;

    setIsProcessing(true);
    setProgress(10);

    try {
      // Remove data URL prefix for API
      const base64Data = sourceImage.replace(/^data:image\/\w+;base64,/, '');
      
      setProgress(30);

      const response = await fetch('/api/upscale', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64: base64Data,
          scale,
          quality,
          format,
          enhanceSharpness,
          denoise,
        }),
      });

      setProgress(70);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upscaling failed');
      }

      const result: UpscaleResult = await response.json();
      
      setProgress(90);

      if (result.success && result.imageBase64) {
        setResultImage(result.imageBase64);
        setResultMetadata(result.metadata);
        onUpscaleComplete?.(result);
        
        toast({
          title: 'Image upscaled successfully',
          description: `${result.metadata.originalWidth}x${result.metadata.originalHeight} → ${result.metadata.newWidth}x${result.metadata.newHeight}`,
        });
      } else {
        throw new Error(result.error || 'Upscaling failed');
      }

      setProgress(100);
    } catch (error) {
      console.error('Upscale error:', error);
      toast({
        title: 'Upscaling failed',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
      setTimeout(() => setProgress(0), 500);
    }
  };

  const handleDownload = () => {
    if (!resultImage) return;

    const link = document.createElement('a');
    link.href = resultImage;
    link.download = `upscaled-${Date.now()}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleReset = () => {
    setSourceImage(null);
    setResultImage(null);
    setResultMetadata(null);
    setOriginalDimensions(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ZoomIn className="h-5 w-5 text-romance-burgundy-600" />
                Image Upscaler
              </CardTitle>
              <CardDescription>
                Enhance image resolution with AI-powered upscaling
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-romance-burgundy-600 border-romance-burgundy-300">
              <Sparkles className="h-3 w-3 mr-1" />
              Pro Feature
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Upload Area */}
          {!sourceImage ? (
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-romance-burgundy-400 transition-colors"
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium text-gray-700 mb-2">
                Drop an image here or click to upload
              </p>
              <p className="text-sm text-gray-500">
                Supports JPEG, PNG, and WebP formats
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          ) : (
            <>
              {/* Image Preview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Original Image */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Original</Label>
                  <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={sourceImage}
                      alt="Original"
                      className="w-full h-full object-contain"
                    />
                    {originalDimensions && (
                      <Badge className="absolute bottom-2 right-2 bg-black/70">
                        {originalDimensions.width} x {originalDimensions.height}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Result Image */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Upscaled</Label>
                  <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                    {resultImage ? (
                      <>
                        <img
                          src={resultImage}
                          alt="Upscaled"
                          className="w-full h-full object-contain"
                        />
                        {resultMetadata && (
                          <Badge className="absolute bottom-2 right-2 bg-romance-burgundy-600">
                            {resultMetadata.newWidth} x {resultMetadata.newHeight}
                          </Badge>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        <ImageIcon className="h-12 w-12" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-lg">
                {/* Scale */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Scale Factor</Label>
                    <span className="text-sm font-medium text-romance-burgundy-600">{scale}x</span>
                  </div>
                  <Slider
                    value={[scale]}
                    onValueChange={([value]) => setScale(value)}
                    min={1.5}
                    max={4}
                    step={0.5}
                    className="w-full"
                  />
                  {originalDimensions && (
                    <p className="text-xs text-gray-500">
                      Output: {Math.round(originalDimensions.width * scale)} x {Math.round(originalDimensions.height * scale)}
                    </p>
                  )}
                </div>

                {/* Quality */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Quality</Label>
                    <span className="text-sm font-medium text-romance-burgundy-600">{quality}%</span>
                  </div>
                  <Slider
                    value={[quality]}
                    onValueChange={([value]) => setQuality(value)}
                    min={50}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                </div>

                {/* Format */}
                <div className="space-y-2">
                  <Label>Output Format</Label>
                  <Select value={format} onValueChange={(v) => setFormat(v as 'jpeg' | 'png' | 'webp')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="jpeg">JPEG (smaller file)</SelectItem>
                      <SelectItem value="png">PNG (lossless)</SelectItem>
                      <SelectItem value="webp">WebP (modern)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Enhancements */}
                <div className="space-y-4">
                  <Label>Enhancements</Label>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Sharpen</span>
                      <Switch
                        checked={enhanceSharpness}
                        onCheckedChange={setEnhanceSharpness}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Denoise</span>
                      <Switch
                        checked={denoise}
                        onCheckedChange={setDenoise}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress */}
              {isProcessing && (
                <div className="space-y-2">
                  <Progress value={progress} className="h-2" />
                  <p className="text-sm text-center text-gray-500">Processing image...</p>
                </div>
              )}

              {/* Result Metadata */}
              {resultMetadata && (
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="font-medium text-green-800 mb-2">Upscale Complete</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Scale:</span>
                      <span className="ml-1 font-medium">{resultMetadata.scale.toFixed(1)}x</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Format:</span>
                      <span className="ml-1 font-medium uppercase">{resultMetadata.format}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Size:</span>
                      <span className="ml-1 font-medium">
                        {resultMetadata.fileSizeBytes ? formatFileSize(resultMetadata.fileSizeBytes) : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Time:</span>
                      <span className="ml-1 font-medium">{resultMetadata.processingTime}ms</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={handleUpscale}
                  disabled={isProcessing}
                  className="bg-romance-burgundy-600 hover:bg-romance-burgundy-700"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <ZoomIn className="h-4 w-4 mr-2" />
                      Upscale Image
                    </>
                  )}
                </Button>

                {resultImage && (
                  <Button onClick={handleDownload} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                )}

                <Button onClick={handleReset} variant="ghost">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default ImageUpscaler;
