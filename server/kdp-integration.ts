import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import { storage } from './storage';

export interface KDPBookMetadata {
  title: string;
  subtitle?: string;
  authors: string[];
  description: string;
  keywords: string[];
  categories: string[];
  language: string;
  publicationDate?: Date;
  isbn?: string;
  price: number;
  territory: string[];
  ageRange?: {
    min: number;
    max: number;
  };
  contentRating: 'general' | 'teen' | 'mature';
  seriesInfo?: {
    name: string;
    number: number;
  };
}

export interface KDPCoverRequirements {
  minWidth: number;
  minHeight: number;
  maxFileSize: number; // in MB
  allowedFormats: string[];
  aspectRatio: string;
}

export interface KDPPublishingStatus {
  bookId: string;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'published';
  submittedAt?: Date;
  reviewNotes?: string;
  publishedAt?: Date;
  amazonUrl?: string;
  asin?: string;
}

export class KDPIntegrationService {
  private apiKey: string;
  private baseUrl: string;
  private vendorId: string;

  constructor() {
    this.apiKey = process.env.KDP_API_KEY || '';
    this.baseUrl = process.env.KDP_API_BASE_URL || 'https://kdp-api.amazon.com/v1';
    this.vendorId = process.env.KDP_VENDOR_ID || '';
  }

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'X-Amz-Vendor-Id': this.vendorId,
    };
  }

  async validateCredentials(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/account/status`, {
        headers: this.getHeaders()
      });
      return response.status === 200;
    } catch (error) {
      console.error('KDP credentials validation failed:', error);
      return false;
    }
  }

  async getCoverRequirements(format: 'paperback' | 'ebook'): Promise<KDPCoverRequirements> {
    // Standard KDP cover requirements
    if (format === 'ebook') {
      return {
        minWidth: 1563,
        minHeight: 2500,
        maxFileSize: 50,
        allowedFormats: ['JPEG', 'TIFF', 'PDF'],
        aspectRatio: '1.6:1'
      };
    } else {
      return {
        minWidth: 2550,
        minHeight: 3300,
        maxFileSize: 40,
        allowedFormats: ['PDF'],
        aspectRatio: 'varies by page count'
      };
    }
  }

  async validateCover(coverPath: string, format: 'paperback' | 'ebook'): Promise<{valid: boolean, errors: string[]}> {
    const requirements = await this.getCoverRequirements(format);
    const errors: string[] = [];

    try {
      const stats = fs.statSync(coverPath);
      const fileSizeMB = stats.size / (1024 * 1024);

      if (fileSizeMB > requirements.maxFileSize) {
        errors.push(`File size ${fileSizeMB.toFixed(2)}MB exceeds maximum ${requirements.maxFileSize}MB`);
      }

      const fileExtension = coverPath.split('.').pop()?.toUpperCase();
      if (!requirements.allowedFormats.includes(fileExtension || '')) {
        errors.push(`File format ${fileExtension} not supported. Allowed: ${requirements.allowedFormats.join(', ')}`);
      }

      return { valid: errors.length === 0, errors };
    } catch (error) {
      return { valid: false, errors: ['File not found or inaccessible'] };
    }
  }

  async createBook(metadata: KDPBookMetadata): Promise<{success: boolean, bookId?: string, errors?: string[]}> {
    try {
      const bookData = {
        title: metadata.title,
        subtitle: metadata.subtitle,
        contributors: metadata.authors.map(author => ({
          name: author,
          role: 'AUTHOR'
        })),
        description: metadata.description,
        keywords: metadata.keywords.slice(0, 7), // KDP allows max 7 keywords
        categories: metadata.categories.slice(0, 2), // KDP allows max 2 categories
        language: metadata.language,
        publication_date: metadata.publicationDate?.toISOString(),
        isbn: metadata.isbn,
        territories: metadata.territory,
        age_range: metadata.ageRange,
        content_rating: metadata.contentRating,
        series: metadata.seriesInfo
      };

      const response = await axios.post(`${this.baseUrl}/books`, bookData, {
        headers: this.getHeaders()
      });

      if (response.status === 201) {
        const bookId = response.data.book_id;
        
        // Store in our database
        await storage.createKDPMetadata({
          bookId,
          projectId: '', // Will be set by calling function
          kdpBookId: bookId,
          status: 'draft',
          metadata: bookData,
          createdAt: new Date(),
          updatedAt: new Date()
        });

        return { success: true, bookId };
      } else {
        return { success: false, errors: ['Failed to create book on KDP'] };
      }
    } catch (error: any) {
      console.error('KDP book creation failed:', error);
      return { 
        success: false, 
        errors: [error.response?.data?.message || 'Unknown error occurred'] 
      };
    }
  }

  async uploadCover(bookId: string, coverPath: string, format: 'paperback' | 'ebook'): Promise<{success: boolean, errors?: string[]}> {
    try {
      // Validate cover first
      const validation = await this.validateCover(coverPath, format);
      if (!validation.valid) {
        return { success: false, errors: validation.errors };
      }

      const formData = new FormData();
      formData.append('cover', fs.createReadStream(coverPath));
      formData.append('format', format);

      const response = await axios.post(`${this.baseUrl}/books/${bookId}/cover`, formData, {
        headers: {
          ...this.getHeaders(),
          ...formData.getHeaders()
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });

      return { success: response.status === 200 };
    } catch (error: any) {
      console.error('KDP cover upload failed:', error);
      return { 
        success: false, 
        errors: [error.response?.data?.message || 'Cover upload failed'] 
      };
    }
  }

  async uploadManuscript(bookId: string, manuscriptPath: string): Promise<{success: boolean, errors?: string[]}> {
    try {
      const formData = new FormData();
      formData.append('manuscript', fs.createReadStream(manuscriptPath));

      const response = await axios.post(`${this.baseUrl}/books/${bookId}/manuscript`, formData, {
        headers: {
          ...this.getHeaders(),
          ...formData.getHeaders()
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });

      return { success: response.status === 200 };
    } catch (error: any) {
      console.error('KDP manuscript upload failed:', error);
      return { 
        success: false, 
        errors: [error.response?.data?.message || 'Manuscript upload failed'] 
      };
    }
  }

  async setPricing(bookId: string, pricing: {territory: string, price: number, currency: string}[]): Promise<{success: boolean, errors?: string[]}> {
    try {
      const response = await axios.put(`${this.baseUrl}/books/${bookId}/pricing`, { pricing }, {
        headers: this.getHeaders()
      });

      return { success: response.status === 200 };
    } catch (error: any) {
      console.error('KDP pricing update failed:', error);
      return { 
        success: false, 
        errors: [error.response?.data?.message || 'Pricing update failed'] 
      };
    }
  }

  async submitForReview(bookId: string): Promise<{success: boolean, errors?: string[]}> {
    try {
      const response = await axios.post(`${this.baseUrl}/books/${bookId}/submit`, {}, {
        headers: this.getHeaders()
      });

      if (response.status === 200) {
        // Update status in our database
        await storage.updateKDPMetadata(bookId, {
          status: 'submitted',
          submittedAt: new Date(),
          updatedAt: new Date()
        });

        return { success: true };
      } else {
        return { success: false, errors: ['Failed to submit book for review'] };
      }
    } catch (error: any) {
      console.error('KDP submission failed:', error);
      return { 
        success: false, 
        errors: [error.response?.data?.message || 'Submission failed'] 
      };
    }
  }

  async getPublishingStatus(bookId: string): Promise<KDPPublishingStatus | null> {
    try {
      const response = await axios.get(`${this.baseUrl}/books/${bookId}/status`, {
        headers: this.getHeaders()
      });

      if (response.status === 200) {
        const data = response.data;
        const status: KDPPublishingStatus = {
          bookId,
          status: data.status,
          submittedAt: data.submitted_at ? new Date(data.submitted_at) : undefined,
          reviewNotes: data.review_notes,
          publishedAt: data.published_at ? new Date(data.published_at) : undefined,
          amazonUrl: data.amazon_url,
          asin: data.asin
        };

        // Update our database
        await storage.updateKDPMetadata(bookId, {
          status: status.status,
          publishedAt: status.publishedAt,
          amazonUrl: status.amazonUrl,
          asin: status.asin,
          updatedAt: new Date()
        });

        return status;
      }
      return null;
    } catch (error) {
      console.error('Failed to get KDP status:', error);
      return null;
    }
  }

  async getSalesData(bookId: string, startDate: Date, endDate: Date): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/books/${bookId}/sales`, {
        headers: this.getHeaders(),
        params: {
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0]
        }
      });

      return response.data;
    } catch (error) {
      console.error('Failed to get sales data:', error);
      return null;
    }
  }

  async generateOptimizedKeywords(genre: string, subgenres: string[], tropes: string[]): Promise<string[]> {
    // Romance-specific keyword optimization based on KDP best practices
    const baseKeywords = [];
    
    // Add main genre
    baseKeywords.push(`${genre} romance`);
    
    // Add subgenres
    subgenres.forEach(subgenre => {
      baseKeywords.push(`${subgenre} romance`);
      baseKeywords.push(subgenre);
    });
    
    // Add trope-based keywords
    tropes.slice(0, 3).forEach(trope => {
      baseKeywords.push(trope);
      baseKeywords.push(`${trope} romance`);
    });
    
    // Add performance-based keywords for romance
    const performanceKeywords = [
      'steamy romance',
      'romantic suspense',
      'contemporary romance',
      'happily ever after',
      'alpha hero',
      'enemies to lovers'
    ];
    
    return [...baseKeywords, ...performanceKeywords].slice(0, 7);
  }

  async validateMetadata(metadata: KDPBookMetadata): Promise<{valid: boolean, errors: string[]}> {
    const errors: string[] = [];

    if (!metadata.title || metadata.title.length < 1) {
      errors.push('Title is required');
    }

    if (!metadata.authors || metadata.authors.length === 0) {
      errors.push('At least one author is required');
    }

    if (!metadata.description || metadata.description.length < 20) {
      errors.push('Description must be at least 20 characters');
    }

    if (metadata.description && metadata.description.length > 4000) {
      errors.push('Description cannot exceed 4000 characters');
    }

    if (!metadata.keywords || metadata.keywords.length === 0) {
      errors.push('At least one keyword is required');
    }

    if (metadata.keywords && metadata.keywords.length > 7) {
      errors.push('Maximum 7 keywords allowed');
    }

    if (!metadata.categories || metadata.categories.length === 0) {
      errors.push('At least one category is required');
    }

    if (metadata.categories && metadata.categories.length > 2) {
      errors.push('Maximum 2 categories allowed');
    }

    if (!metadata.price || metadata.price < 0.99) {
      errors.push('Minimum price is $0.99');
    }

    return { valid: errors.length === 0, errors };
  }
}

export const kdpService = new KDPIntegrationService();