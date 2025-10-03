# OCR Function & Expert Mode Languages Documentation

This document describes the OCR (Optical Character Recognition) feature and expert mode language packages that have been added to the 88away platform.

## Overview

The OCR system allows users to extract text from images with domain-specific processing for different professional fields. It integrates with OpenAI's GPT-4 Vision API and provides specialized language packages for academic, finance, law, and marketing content.

## Features

### 1. OCR Service (`server/ocr.ts`)

The OCR service provides:
- Text extraction from images using OpenAI GPT-4 Vision
- Support for both image URLs and base64-encoded images
- Expert mode processing for domain-specific terminology
- Table extraction from images
- Formatting preservation
- Batch processing (up to 10 images)
- Confidence estimation

### 2. Expert Mode Language Packages (`server/languages.ts`)

Four specialized language packages:

#### Academic
- Scholarly writing with academic rigor
- Citation format preservation (APA, MLA, Chicago, Harvard)
- Mathematical formula recognition
- Research paper structure
- Terminology: hypothesis, methodology, literature review, empirical, theoretical, etc.

#### Finance
- Financial document processing
- Currency and numerical precision
- Financial statement recognition
- Terminology: revenue, EBITDA, ROI, NPV, IRR, balance sheet, etc.
- Proper handling of monetary values and percentages

#### Law
- Legal document processing
- Citation and statute reference preservation
- Contract structure recognition
- Terminology: plaintiff, defendant, jurisdiction, res judicata, habeas corpus, etc.
- Formal legal language formatting

#### Marketing
- Marketing copy processing
- Brand name and trademark preservation
- Call-to-action recognition
- Terminology: brand, campaign, conversion, engagement, CTA, USP, etc.
- Persuasive language optimization

## API Endpoints

### Extract Text from Image

**POST** `/api/ocr/extract`

Request body:
```json
{
  "imageUrl": "https://example.com/image.jpg",
  // OR
  "imageBase64": "base64_encoded_image_data",
  
  "expertMode": "academic", // "finance", "law", "marketing", or omit
  "extractTables": true,
  "extractFormatting": true,
  "language": "en",
  "projectId": "project-id-optional"
}
```

Response:
```json
{
  "success": true,
  "text": "Extracted text content...",
  "tables": [
    {
      "headers": ["Column 1", "Column 2"],
      "rows": [["Value 1", "Value 2"]]
    }
  ],
  "metadata": {
    "expertMode": "academic",
    "language": "en",
    "processingTime": 1234,
    "confidence": 95
  }
}
```

### Batch OCR Processing

**POST** `/api/ocr/batch`

Request body:
```json
{
  "requests": [
    {
      "imageUrl": "https://example.com/image1.jpg",
      "expertMode": "finance"
    },
    {
      "imageUrl": "https://example.com/image2.jpg",
      "expertMode": "law"
    }
  ],
  "projectId": "project-id-optional"
}
```

Response:
```json
{
  "results": [
    {
      "success": true,
      "text": "...",
      "metadata": {...}
    },
    {
      "success": true,
      "text": "...",
      "metadata": {...}
    }
  ]
}
```

### Get OCR History

**GET** `/api/ocr/history?projectId=xxx&limit=50`

Returns OCR processing history for the authenticated user.

### Get Expert Modes

**GET** `/api/expert-modes`

Returns list of available expert modes with descriptions and terminology samples.

Response:
```json
[
  {
    "mode": "academic",
    "displayName": "Academic",
    "description": "Scholarly writing with academic rigor and citation standards",
    "terminology": {
      "commonCount": 15,
      "advancedCount": 18,
      "examples": ["hypothesis", "methodology", "literature review", ...]
    }
  },
  ...
]
```

### Validate Text for Expert Mode

**POST** `/api/expert-modes/validate`

Request body:
```json
{
  "text": "Your text to validate...",
  "mode": "finance"
}
```

Response:
```json
{
  "valid": true,
  "errors": [],
  "warnings": ["Numerical values found without currency symbols"],
  "suggestions": ["Style guideline: Always include currency symbols..."]
}
```

### Enhance Text for Expert Mode

**POST** `/api/expert-modes/enhance`

Request body:
```json
{
  "text": "Original text...",
  "mode": "academic"
}
```

Response:
```json
{
  "enhanced": "Enhanced text with domain-specific improvements..."
}
```

## Database Schema

### OCR Records Table

```sql
CREATE TABLE ocr_records (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id VARCHAR REFERENCES projects(id) ON DELETE CASCADE,
  expert_mode expert_mode_enum,
  extracted_text TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TYPE expert_mode_enum AS ENUM ('academic', 'finance', 'law', 'marketing');
```

## Usage Limits

OCR extractions count against the user's monthly AI generation limit:
- **Free**: 20 generations/month
- **Starter**: 100 generations/month
- **Professional**: 500 generations/month
- **Enterprise**: Unlimited

## Examples

### Example 1: Academic Paper OCR

```typescript
const response = await fetch('/api/ocr/extract', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    imageUrl: 'https://example.com/research-paper-page.jpg',
    expertMode: 'academic',
    extractTables: true,
    extractFormatting: true
  })
});

const result = await response.json();
console.log(result.text); // Extracted text with citations preserved
```

### Example 2: Financial Statement OCR

```typescript
const response = await fetch('/api/ocr/extract', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    imageBase64: base64ImageData,
    expertMode: 'finance',
    extractTables: true
  })
});

const result = await response.json();
console.log(result.tables); // Extracted financial tables
```

### Example 3: Legal Document OCR

```typescript
const response = await fetch('/api/ocr/extract', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    imageUrl: 'https://example.com/contract-page.jpg',
    expertMode: 'law',
    extractFormatting: true,
    projectId: 'my-project-id'
  })
});

const result = await response.json();
// Text will preserve legal citations, section numbers, and formal structure
```

### Example 4: Marketing Copy OCR

```typescript
const response = await fetch('/api/ocr/extract', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    imageUrl: 'https://example.com/ad-copy.jpg',
    expertMode: 'marketing'
  })
});

const result = await response.json();
// Text will preserve brand names, taglines, and CTAs
```

## Integration with AI Writing Assistant

The OCR-extracted text can be fed into the AI writing assistant:

```typescript
// 1. Extract text from image
const ocrResult = await fetch('/api/ocr/extract', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    imageUrl: imageUrl,
    expertMode: 'academic'
  })
});

const { text } = await ocrResult.json();

// 2. Use extracted text with AI assistant
const aiResult = await fetch('/api/ai/editor', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    projectId: 'my-project',
    editData: {
      originalText: text,
      goals: {
        concise: true,
        preserve_voice: true,
        remove_passive: false
      }
    }
  })
});
```

## Error Handling

All endpoints return appropriate HTTP status codes:
- `200`: Success
- `400`: Bad request (missing parameters)
- `403`: Forbidden (usage limit exceeded or subscription required)
- `500`: Server error

Error response format:
```json
{
  "message": "Error description",
  "requiresUpgrade": true // if applicable
}
```

## Performance Considerations

- OCR processing typically takes 2-5 seconds per image
- Batch processing is sequential to avoid rate limits
- Results are cached when associated with a project
- Analysis cache expires after 24 hours

## Future Enhancements

Potential future additions:
- Additional expert modes (medical, technical, scientific)
- PDF multi-page processing
- Handwriting recognition
- Formula and equation parsing
- Language translation integration
- Custom terminology dictionaries
- OCR quality improvement feedback loop

## Support

For issues or questions:
- Check the OCR history for processing details
- Verify subscription plan supports OCR features
- Ensure image URLs are publicly accessible
- Check image quality (minimum 300 DPI recommended)
- Contact support for persistent issues
