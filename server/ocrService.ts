import { createWorker } from 'tesseract.js';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface OCRResult {
  text: string;
  confidence: number;
  language: string;
  processingTime: number;
}

export interface OCRDocument {
  id: string;
  filename: string;
  content: string;
  metadata: {
    pageCount: number;
    languages: string[];
    confidence: number;
    processingTime: number;
  };
  createdAt: Date;
}

export class OCRService {
  private worker: Tesseract.Worker | null = null;

  async initialize(): Promise<void> {
    if (!this.worker) {
      this.worker = await createWorker();
      await this.worker.loadLanguage('eng');
      await this.worker.initialize('eng');
    }
  }

  async processImage(imagePath: string, language: string = 'eng'): Promise<OCRResult> {
    if (!this.worker) {
      await this.initialize();
    }

    const startTime = Date.now();

    try {
      // Load language if different from current
      if (language !== 'eng') {
        await this.worker!.loadLanguage(language);
        await this.worker!.initialize(language);
      }

      const { data } = await this.worker!.recognize(imagePath);
      const processingTime = Date.now() - startTime;

      return {
        text: data.text,
        confidence: data.confidence,
        language,
        processingTime
      };
    } catch (error) {
      console.error('OCR processing failed:', error);
      throw new Error(`Failed to process image: ${error}`);
    }
  }

  async processPDF(pdfPath: string): Promise<OCRResult[]> {
    // For PDF processing, we'd need additional libraries like pdf2pic or pdf-parse
    // For now, return a placeholder that indicates PDF processing is not implemented
    throw new Error('PDF processing not yet implemented. Please convert PDF to images first.');
  }

  async processDocument(filePath: string, language: string = 'eng'): Promise<OCRResult | OCRResult[]> {
    const ext = path.extname(filePath).toLowerCase();

    if (ext === '.pdf') {
      return this.processPDF(filePath);
    } else if (['.jpg', '.jpeg', '.png', '.bmp', '.tiff'].includes(ext)) {
      return this.processImage(filePath, language);
    } else {
      throw new Error(`Unsupported file type: ${ext}`);
    }
  }

  async cleanup(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }
}

// Singleton instance
export const ocrService = new OCRService();