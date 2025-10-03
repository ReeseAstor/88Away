/**
 * Language Packages for Expert Modes
 * Provides domain-specific terminology, prompts, and validation for different professional fields
 */

export type ExpertMode = 'academic' | 'finance' | 'law' | 'marketing';

export interface LanguagePackage {
  mode: ExpertMode;
  displayName: string;
  description: string;
  terminology: {
    common: string[];
    advanced: string[];
  };
  systemPrompts: {
    ocr: string;
    writing: string;
    editing: string;
  };
  validationRules: {
    requiredElements?: string[];
    forbiddenPatterns?: RegExp[];
    styleGuidelines?: string[];
  };
  examples: {
    input: string;
    output: string;
  }[];
}

/**
 * Academic Language Package
 * For scholarly writing, research papers, and academic publications
 */
export const academicPackage: LanguagePackage = {
  mode: 'academic',
  displayName: 'Academic',
  description: 'Scholarly writing with academic rigor and citation standards',
  terminology: {
    common: [
      'hypothesis', 'methodology', 'literature review', 'findings', 'conclusion',
      'abstract', 'introduction', 'discussion', 'references', 'citation',
      'peer review', 'empirical', 'theoretical', 'analysis', 'synthesis'
    ],
    advanced: [
      'epistemology', 'ontology', 'hermeneutics', 'phenomenology', 'positivism',
      'constructivism', 'meta-analysis', 'systematic review', 'grounded theory',
      'mixed methods', 'quantitative', 'qualitative', 'reliability', 'validity',
      'triangulation', 'saturation', 'generalizability', 'confounding variables'
    ]
  },
  systemPrompts: {
    ocr: `You are an academic text extraction specialist. When processing academic documents:
- Preserve citation formats (APA, MLA, Chicago, Harvard, etc.)
- Accurately transcribe mathematical formulas and equations
- Maintain reference numbering and footnotes
- Preserve table and figure captions
- Keep section headings and numbering intact
- Recognize and format bibliographic entries correctly
- Maintain academic formatting conventions`,
    
    writing: `You are an expert academic writer. Your writing should:
- Use precise, formal academic language
- Structure arguments logically with clear thesis statements
- Support claims with evidence and citations
- Maintain objectivity and scholarly tone
- Use discipline-specific terminology appropriately
- Follow academic writing conventions
- Construct well-reasoned arguments with proper evidence
- Include appropriate transitions between ideas
- Avoid colloquialisms and informal language`,
    
    editing: `You are an academic editor. When editing academic texts:
- Ensure clarity and precision in academic language
- Verify proper citation format consistency
- Check for logical flow and argument structure
- Maintain formal academic tone throughout
- Identify gaps in evidence or reasoning
- Suggest improvements for clarity without sacrificing rigor
- Ensure terminology is used correctly and consistently
- Check that claims are properly supported by evidence`
  },
  validationRules: {
    requiredElements: ['introduction', 'methodology', 'results', 'conclusion', 'references'],
    styleGuidelines: [
      'Use third person perspective',
      'Maintain formal academic tone',
      'Support all claims with citations',
      'Use present tense for general statements',
      'Use past tense for specific studies'
    ]
  },
  examples: [
    {
      input: 'We found that the thing worked pretty well',
      output: 'The analysis revealed a statistically significant positive correlation (r = 0.78, p < 0.001) between the variables examined.'
    },
    {
      input: 'A lot of researchers think this is important',
      output: 'Numerous studies in the literature have established the significance of this phenomenon (Smith, 2020; Jones, 2021; Williams et al., 2022).'
    }
  ]
};

/**
 * Finance Language Package
 * For financial reports, analysis, and business documents
 */
export const financePackage: LanguagePackage = {
  mode: 'finance',
  displayName: 'Finance',
  description: 'Professional financial writing with accurate terminology and numerical precision',
  terminology: {
    common: [
      'revenue', 'profit', 'loss', 'assets', 'liabilities', 'equity',
      'balance sheet', 'income statement', 'cash flow', 'ROI', 'EBITDA',
      'dividend', 'interest rate', 'portfolio', 'investment', 'valuation'
    ],
    advanced: [
      'amortization', 'arbitrage', 'beta coefficient', 'capital adequacy ratio',
      'debt-to-equity ratio', 'discounted cash flow', 'hurdle rate', 'NPV',
      'IRR', 'WACC', 'enterprise value', 'free cash flow', 'operating leverage',
      'market capitalization', 'derivative', 'hedge', 'securitization',
      'cost of capital', 'earnings per share', 'price-to-earnings ratio'
    ]
  },
  systemPrompts: {
    ocr: `You are a financial document OCR specialist. When processing financial documents:
- Extract numerical data with absolute precision
- Preserve currency symbols and formatting ($, €, £, ¥, etc.)
- Maintain decimal places and percentage signs
- Keep table structures for financial statements intact
- Preserve date formats used in financial reporting
- Accurately transcribe account names and categories
- Maintain alignment of numerical columns
- Recognize and format financial ratios correctly`,
    
    writing: `You are an expert financial writer. Your writing should:
- Use precise financial terminology correctly
- Present numerical data clearly and accurately
- Structure financial reports logically (executive summary, analysis, recommendations)
- Use industry-standard formatting for financial statements
- Explain complex financial concepts clearly for the target audience
- Include appropriate disclaimers and qualifications
- Maintain professional, objective tone
- Support financial projections with sound reasoning
- Use consistent currency and date formats throughout`,
    
    editing: `You are a financial editor. When editing financial documents:
- Verify numerical accuracy and consistency
- Check calculation correctness
- Ensure proper use of financial terminology
- Validate currency and unit consistency
- Check for proper citation of data sources
- Ensure compliance with financial reporting standards
- Verify that financial statements balance correctly
- Check that percentages and ratios are calculated correctly
- Ensure appropriate use of disclaimers and risk warnings`
  },
  validationRules: {
    requiredElements: ['executive summary', 'financial analysis', 'key metrics', 'recommendations'],
    forbiddenPatterns: [
      /\$\d+(?!\.\d{2})(?=\s|$)/g, // Currency without cents where appropriate
    ],
    styleGuidelines: [
      'Always include currency symbols with monetary amounts',
      'Use consistent decimal precision (typically 2 places for currency)',
      'Present percentages with % symbol',
      'Include time periods for all financial metrics',
      'Use thousand separators for large numbers',
      'Include units for all numerical values'
    ]
  },
  examples: [
    {
      input: 'The company made about 5 million last quarter',
      output: 'The company reported Q3 2024 revenue of $5.2 million, representing a year-over-year increase of 12.4%.'
    },
    {
      input: 'Profits are up and things are looking good',
      output: 'Net income increased to $1.8 million (GAAP) in the reporting period, with EBITDA margins expanding to 22.5%, indicating improved operational efficiency.'
    }
  ]
};

/**
 * Law Language Package
 * For legal documents, contracts, and legal analysis
 */
export const lawPackage: LanguagePackage = {
  mode: 'law',
  displayName: 'Law',
  description: 'Legal writing with proper terminology, citations, and formal structure',
  terminology: {
    common: [
      'plaintiff', 'defendant', 'jurisdiction', 'statute', 'precedent',
      'litigation', 'contract', 'liability', 'indemnity', 'tort',
      'negligence', 'damages', 'remedy', 'injunction', 'hearing'
    ],
    advanced: [
      'res judicata', 'stare decisis', 'habeas corpus', 'voir dire', 'mens rea',
      'actus reus', 'prima facie', 'de facto', 'de jure', 'ex parte',
      'in rem', 'in personam', 'quantum meruit', 'estoppel', 'subpoena',
      'deposition', 'interrogatory', 'summary judgment', 'motion to dismiss',
      'class action', 'arbitration', 'mediation', 'discovery'
    ]
  },
  systemPrompts: {
    ocr: `You are a legal document OCR specialist. When processing legal documents:
- Preserve exact legal citations (case names, statute references, court reports)
- Maintain section numbering and subsection hierarchy
- Keep legal formatting conventions (defined terms in quotes, cross-references)
- Preserve signatures and date lines exactly
- Maintain "WHEREAS" clauses and formal legal structure
- Accurately transcribe party names and titles
- Keep exhibit and schedule references intact
- Preserve legal boilerplate text exactly as written`,
    
    writing: `You are an expert legal writer. Your writing should:
- Use precise legal terminology correctly
- Follow formal legal document structure
- Include all necessary legal clauses and provisions
- Use clear, unambiguous language
- Maintain proper legal citation format
- Include appropriate definitions and cross-references
- Use consistent party designations throughout
- Follow jurisdiction-specific requirements
- Include necessary legal disclaimers and qualifications
- Maintain formal, professional tone appropriate for legal documents`,
    
    editing: `You are a legal editor. When editing legal documents:
- Verify accuracy of legal citations and references
- Check for internal consistency in definitions and terms
- Ensure all cross-references are correct
- Verify proper legal terminology usage
- Check for ambiguity that could cause disputes
- Ensure compliance with jurisdictional requirements
- Verify that all necessary clauses are included
- Check that party names are used consistently
- Ensure proper numbering and formatting of sections
- Verify dates and time periods are correct and consistent`
  },
  validationRules: {
    requiredElements: ['parties', 'recitals', 'operative provisions', 'signatures', 'date'],
    styleGuidelines: [
      'Use shall for obligations, not will or must',
      'Define all key terms on first use',
      'Number all sections and subsections',
      'Use consistent party designations',
      'Include jurisdiction and governing law',
      'Capitalize defined terms',
      'Use gender-neutral language where possible'
    ]
  },
  examples: [
    {
      input: 'Both parties agree to keep information secret',
      output: 'The Parties agree to maintain the confidentiality of all Confidential Information (as defined in Section 1.1) and shall not disclose such information to any third party without prior written consent of the disclosing Party.'
    },
    {
      input: 'If someone breaks this contract, they have to pay damages',
      output: 'In the event of a material breach of this Agreement, the non-breaching Party shall be entitled to seek all remedies available at law or in equity, including but not limited to monetary damages, specific performance, and injunctive relief.'
    }
  ]
};

/**
 * Marketing Language Package
 * For marketing materials, advertising copy, and promotional content
 */
export const marketingPackage: LanguagePackage = {
  mode: 'marketing',
  displayName: 'Marketing',
  description: 'Persuasive marketing copy with compelling messaging and brand voice',
  terminology: {
    common: [
      'brand', 'campaign', 'audience', 'engagement', 'conversion',
      'lead generation', 'CTA', 'value proposition', 'USP', 'ROI',
      'targeting', 'segmentation', 'positioning', 'messaging', 'awareness'
    ],
    advanced: [
      'attribution', 'customer lifetime value', 'churn rate', 'cohort analysis',
      'A/B testing', 'multivariate testing', 'funnel optimization', 'retargeting',
      'programmatic advertising', 'growth hacking', 'viral coefficient',
      'net promoter score', 'customer acquisition cost', 'marketing automation',
      'omnichannel', 'personalization', 'dynamic content', 'behavioral targeting'
    ]
  },
  systemPrompts: {
    ocr: `You are a marketing content OCR specialist. When processing marketing materials:
- Preserve brand names and trademarks exactly (including capitalization and symbols)
- Maintain taglines and slogans exactly as written
- Keep emphasized text and stylistic formatting
- Preserve call-to-action buttons and links
- Maintain headline hierarchy and structure
- Accurately transcribe contact information and URLs
- Keep promotional terms and offers exact
- Preserve disclaimer and legal text`,
    
    writing: `You are an expert marketing copywriter. Your writing should:
- Use persuasive, engaging language that resonates with the target audience
- Include clear, compelling calls-to-action
- Highlight benefits over features
- Create emotional connections with readers
- Use power words and active voice
- Maintain consistent brand voice and tone
- Address customer pain points and desires
- Include social proof when appropriate
- Create urgency and scarcity when relevant
- Use storytelling techniques to engage readers
- Keep copy concise and scannable
- Optimize for conversion and engagement`,
    
    editing: `You are a marketing copy editor. When editing marketing content:
- Ensure messaging is clear and compelling
- Verify brand voice consistency
- Check that CTAs are strong and visible
- Ensure benefits are clearly communicated
- Verify all claims are accurate and supportable
- Check for appropriate use of persuasive techniques
- Ensure legal compliance (disclaimers, disclosures)
- Verify links and contact information
- Check for appropriate tone for target audience
- Ensure copy is optimized for the medium (web, print, social, etc.)
- Remove jargon that audience won't understand
- Tighten copy for maximum impact`
  },
  validationRules: {
    requiredElements: ['headline', 'value proposition', 'call-to-action', 'contact information'],
    styleGuidelines: [
      'Use active voice for stronger impact',
      'Focus on benefits, not just features',
      'Include clear calls-to-action',
      'Use specific, concrete language',
      'Create urgency where appropriate',
      'Maintain consistent brand voice',
      'Use power words strategically'
    ]
  },
  examples: [
    {
      input: 'Our product is good and you should buy it',
      output: 'Transform your workflow in just 5 minutes with our intuitive platform. Join 50,000+ professionals who\'ve already boosted their productivity by 40%. Start your free trial today—no credit card required.'
    },
    {
      input: 'We have lots of features that make things better',
      output: 'Say goodbye to tedious manual work. Our AI-powered automation handles repetitive tasks instantly, giving you 10+ hours back each week to focus on what matters most. See the difference for yourself—get started in seconds.'
    }
  ]
};

/**
 * Get language package by expert mode
 */
export function getLanguagePackage(mode: ExpertMode): LanguagePackage {
  switch (mode) {
    case 'academic':
      return academicPackage;
    case 'finance':
      return financePackage;
    case 'law':
      return lawPackage;
    case 'marketing':
      return marketingPackage;
    default:
      throw new Error(`Unknown expert mode: ${mode}`);
  }
}

/**
 * Get all available language packages
 */
export function getAllLanguagePackages(): LanguagePackage[] {
  return [
    academicPackage,
    financePackage,
    lawPackage,
    marketingPackage
  ];
}

/**
 * Validate text against expert mode guidelines
 */
export function validateExpertModeText(text: string, mode: ExpertMode): {
  valid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
} {
  const pkg = getLanguagePackage(mode);
  const errors: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  // Check forbidden patterns
  if (pkg.validationRules.forbiddenPatterns) {
    for (const pattern of pkg.validationRules.forbiddenPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        errors.push(`Found forbidden pattern: ${matches[0]}`);
      }
    }
  }

  // Check for style guideline adherence
  if (pkg.validationRules.styleGuidelines) {
    for (const guideline of pkg.validationRules.styleGuidelines) {
      suggestions.push(`Style guideline: ${guideline}`);
    }
  }

  // Mode-specific validations
  switch (mode) {
    case 'finance':
      // Check for currency symbols
      if (text.match(/\d+\.\d{2}/) && !text.match(/[$€£¥]/)) {
        warnings.push('Numerical values found without currency symbols');
      }
      break;
    
    case 'law':
      // Check for defined terms
      if (text.includes('shall') && !text.match(/[A-Z][a-z]+ \(/)) {
        suggestions.push('Consider defining key terms in parentheses on first use');
      }
      break;
    
    case 'academic':
      // Check for citation marks
      if (text.match(/research|study|found|showed/) && !text.match(/\(\d{4}\)|et al\./)) {
        warnings.push('Claims found without apparent citations');
      }
      break;
    
    case 'marketing':
      // Check for CTA
      if (text.length > 200 && !text.match(/start|try|get|sign up|learn more|buy now|contact/i)) {
        warnings.push('No clear call-to-action found');
      }
      break;
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    suggestions
  };
}

/**
 * Enhance text for specific expert mode
 */
export function enhanceForExpertMode(text: string, mode: ExpertMode): string {
  const pkg = getLanguagePackage(mode);
  let enhanced = text;

  // Apply mode-specific enhancements
  switch (mode) {
    case 'academic':
      // Add more formal academic language
      enhanced = enhanced.replace(/\bwe think\b/gi, 'it is hypothesized that');
      enhanced = enhanced.replace(/\bshows that\b/gi, 'demonstrates that');
      enhanced = enhanced.replace(/\bsays\b/gi, 'indicates');
      break;
    
    case 'finance':
      // Ensure numerical precision
      enhanced = enhanced.replace(/(\$\d+)(?!\.\d)/g, '$1.00');
      break;
    
    case 'law':
      // Add legal formality
      enhanced = enhanced.replace(/\bwill\b/g, 'shall');
      enhanced = enhanced.replace(/\bmust\b/g, 'shall');
      break;
    
    case 'marketing':
      // Add more active, engaging language
      enhanced = enhanced.replace(/\bcan\b/gi, 'will');
      enhanced = enhanced.replace(/\byou can\b/gi, "you'll");
      break;
  }

  return enhanced;
}
