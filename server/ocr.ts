import OpenAI from "openai";
import type { ExpertMode } from "./languages";

// OCR service using OpenAI Vision API
let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key is not configured. Please set the OPENAI_API_KEY environment variable.");
    }
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
}

export interface OCRRequest {
  imageUrl?: string;
  imageBase64?: string;
  expertMode?: ExpertMode;
  extractTables?: boolean;
  extractFormatting?: boolean;
  language?: string;
}

export interface OCRResponse {
  success: boolean;
  text: string;
  tables?: Array<{
    headers: string[];
    rows: string[][];
  }>;
  metadata: {
    expertMode?: ExpertMode;
    language?: string;
    processingTime: number;
    confidence?: number;
  };
  warnings?: string[];
}

/**
 * Extract text from an image using OCR
 * Supports expert modes for domain-specific terminology and formatting
 */
export async function performOCR(request: OCRRequest): Promise<OCRResponse> {
  const startTime = Date.now();
  const client = getOpenAIClient();
  
  try {
    // Validate input
    if (!request.imageUrl && !request.imageBase64) {
      throw new Error("Either imageUrl or imageBase64 must be provided");
    }

    // Prepare the image content
    let imageContent: any;
    if (request.imageBase64) {
      // Handle base64 encoded image
      imageContent = {
        type: "image_url",
        image_url: {
          url: `data:image/jpeg;base64,${request.imageBase64}`
        }
      };
    } else {
      // Handle image URL
      imageContent = {
        type: "image_url",
        image_url: {
          url: request.imageUrl
        }
      };
    }

    // Build the prompt based on expert mode
    const prompt = buildOCRPrompt(request);

    // Call OpenAI Vision API
    const response = await client.chat.completions.create({
      model: "gpt-4o", // GPT-4 Vision model
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt
            },
            imageContent
          ]
        }
      ],
      max_tokens: 4096
    });

    const extractedText = response.choices[0].message.content || "";
    
    // Extract tables if requested
    let tables: Array<{headers: string[], rows: string[][]}> | undefined;
    if (request.extractTables) {
      tables = extractTablesFromText(extractedText);
    }

    const processingTime = Date.now() - startTime;

    return {
      success: true,
      text: extractedText,
      tables,
      metadata: {
        expertMode: request.expertMode,
        language: request.language || 'en',
        processingTime,
        confidence: estimateConfidence(extractedText)
      }
    };
  } catch (error) {
    console.error("OCR processing failed:", error);
    throw new Error(`OCR failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Build the OCR prompt based on expert mode and options
 */
function buildOCRPrompt(request: OCRRequest): string {
  let prompt = "Extract all text from this image accurately. ";

  // Add expert mode specific instructions
  if (request.expertMode) {
    switch (request.expertMode) {
      case 'academic':
        prompt += "Pay special attention to academic terminology, citations, mathematical formulas, and scientific notation. Preserve equation formatting and reference styles. ";
        break;
      case 'finance':
        prompt += "Pay special attention to financial terminology, numbers, currency symbols, percentages, and financial tables. Preserve monetary values and numerical precision. ";
        break;
      case 'law':
        prompt += "Pay special attention to legal terminology, case citations, statute references, and legal formatting. Preserve section numbers and legal document structure. ";
        break;
      case 'marketing':
        prompt += "Pay special attention to marketing terminology, brand names, taglines, and promotional content. Preserve emphasis and stylistic elements. ";
        break;
    }
  }

  // Add table extraction instructions
  if (request.extractTables) {
    prompt += "If the image contains tables, clearly format them with headers and rows separated by line breaks and use | to separate columns. ";
  }

  // Add formatting instructions
  if (request.extractFormatting) {
    prompt += "Preserve the original formatting including bold text (use **bold**), italic text (use *italic*), headings, bullet points, and paragraph structure. ";
  }

  // Add language instructions
  if (request.language && request.language !== 'en') {
    prompt += `The text is in ${request.language}. `;
  }

  prompt += "Return only the extracted text without any additional commentary.";

  return prompt;
}

/**
 * Extract tables from OCR text
 */
function extractTablesFromText(text: string): Array<{headers: string[], rows: string[][]}> {
  const tables: Array<{headers: string[], rows: string[][]}> = [];
  const lines = text.split('\n');
  
  let currentTable: {headers: string[], rows: string[][]} | null = null;
  
  for (const line of lines) {
    // Check if line contains table separator (|)
    if (line.includes('|')) {
      const cells = line.split('|').map(cell => cell.trim()).filter(cell => cell.length > 0);
      
      if (cells.length > 0) {
        if (!currentTable) {
          // Start new table with headers
          currentTable = {
            headers: cells,
            rows: []
          };
        } else if (!line.includes('---')) {
          // Add row to current table (skip separator lines)
          currentTable.rows.push(cells);
        }
      }
    } else if (currentTable && currentTable.rows.length > 0) {
      // End of current table
      tables.push(currentTable);
      currentTable = null;
    }
  }
  
  // Add last table if exists
  if (currentTable && currentTable.rows.length > 0) {
    tables.push(currentTable);
  }
  
  return tables;
}

/**
 * Estimate confidence level of OCR extraction
 */
function estimateConfidence(text: string): number {
  // Simple heuristic based on text characteristics
  let confidence = 100;
  
  // Reduce confidence for very short text
  if (text.length < 10) {
    confidence -= 30;
  }
  
  // Reduce confidence for excessive special characters
  const specialCharRatio = (text.match(/[^a-zA-Z0-9\s]/g) || []).length / text.length;
  if (specialCharRatio > 0.3) {
    confidence -= 20;
  }
  
  // Reduce confidence for excessive whitespace
  const whitespaceRatio = (text.match(/\s/g) || []).length / text.length;
  if (whitespaceRatio > 0.5) {
    confidence -= 15;
  }
  
  return Math.max(0, Math.min(100, confidence));
}

/**
 * Batch OCR processing for multiple images
 */
export async function performBatchOCR(
  requests: OCRRequest[]
): Promise<OCRResponse[]> {
  const results: OCRResponse[] = [];
  
  // Process images sequentially to avoid rate limits
  for (const request of requests) {
    try {
      const result = await performOCR(request);
      results.push(result);
    } catch (error) {
      console.error("Batch OCR item failed:", error);
      results.push({
        success: false,
        text: "",
        metadata: {
          expertMode: request.expertMode,
          language: request.language || 'en',
          processingTime: 0
        },
        warnings: [error instanceof Error ? error.message : 'Unknown error']
      });
    }
  }
  
  return results;
}
