import { ExpertMode, ExpertAnalysis } from './index';

export class AcademicExpert {
  static mode: ExpertMode = 'academic';

  static analyze(text: string): ExpertAnalysis {
    const startTime = Date.now();

    // Academic-specific analysis patterns
    const patterns = {
      citations: /\(\w+\s+\d{4}\)|[\w\s]+\(\d{4}\)|References?|Bibliography/i,
      methodology: /methodology|research\s+design|data\s+collection|analysis|results/i,
      hypothesis: /hypothesis|research\s+question|objective|aim/i,
      statistics: /\b(p\s*<\s*0\.\d+|t\s*=\s*-?\d+\.\d+|χ²\s*=\s*\d+\.\d+|F\s*=\s*\d+\.\d+)\b/i,
      academicTerms: /\b(thesis|dissertation|peer\s+review|scholarly|academic|publication)\b/i,
      institutions: /\b(university|college|institute|department|faculty|school)\b/i
    };

    const entities = this.extractEntities(text, patterns);
    const keyPoints = this.extractKeyPoints(text, patterns);
    const insights = this.generateInsights(text, patterns);
    const recommendations = this.generateRecommendations(text, patterns);

    const processingTime = Date.now() - startTime;

    return {
      mode: this.mode,
      summary: this.generateSummary(text, patterns),
      keyPoints,
      entities,
      insights,
      recommendations,
      confidence: this.calculateConfidence(text, patterns),
      processingTime
    };
  }

  private static extractEntities(text: string, patterns: any): string[] {
    const entities: string[] = [];

    // Extract academic institutions
    const institutionMatches = text.match(new RegExp(patterns.institutions.source, 'gi'));
    if (institutionMatches) {
      entities.push(...institutionMatches);
    }

    // Extract citations
    const citationMatches = text.match(new RegExp(patterns.citations.source, 'gi'));
    if (citationMatches) {
      entities.push(...citationMatches);
    }

    return Array.from(new Set(entities)).slice(0, 10);
  }

  private static extractKeyPoints(text: string, patterns: any): string[] {
    const keyPoints: string[] = [];

    // Look for methodology sections
    if (patterns.methodology.test(text)) {
      keyPoints.push('Contains research methodology discussion');
    }

    // Look for hypothesis/research questions
    if (patterns.hypothesis.test(text)) {
      keyPoints.push('Includes research objectives or hypotheses');
    }

    // Look for statistical analysis
    if (patterns.statistics.test(text)) {
      keyPoints.push('Contains statistical analysis or results');
    }

    // Look for academic terms
    if (patterns.academicTerms.test(text)) {
      keyPoints.push('Academic or scholarly content detected');
    }

    // Look for citations
    if (patterns.citations.test(text)) {
      keyPoints.push('Includes citations or references');
    }

    return keyPoints.slice(0, 5);
  }

  private static generateInsights(text: string, patterns: any): string[] {
    const insights: string[] = [];

    const wordCount = text.split(/\s+/).length;
    const sentenceCount = text.split(/[.!?]+/).length;

    if (wordCount > 1000) {
      insights.push('Document appears to be a substantial academic work');
    }

    if (sentenceCount > 50) {
      insights.push('Complex academic writing style detected');
    }

    if (patterns.methodology.test(text) && patterns.statistics.test(text)) {
      insights.push('This appears to be empirical research with data analysis');
    }

    if (patterns.citations.test(text)) {
      const citationCount = (text.match(new RegExp(patterns.citations.source, 'gi')) || []).length;
      if (citationCount > 10) {
        insights.push('Extensive citation usage suggests comprehensive literature review');
      }
    }

    return insights.slice(0, 5);
  }

  private static generateRecommendations(text: string, patterns: any): string[] {
    const recommendations: string[] = [];

    if (!patterns.citations.test(text)) {
      recommendations.push('Consider adding academic citations for credibility');
    }

    if (!patterns.methodology.test(text) && patterns.academicTerms.test(text)) {
      recommendations.push('Include research methodology section for academic rigor');
    }

    if (patterns.statistics.test(text) && !patterns.hypothesis.test(text)) {
      recommendations.push('Clarify research objectives or hypotheses');
    }

    if (text.length < 500) {
      recommendations.push('Expand content for comprehensive academic coverage');
    }

    return recommendations.slice(0, 4);
  }

  private static generateSummary(text: string, patterns: any): string {
    const wordCount = text.split(/\s+/).length;

    if (patterns.methodology.test(text) && patterns.statistics.test(text)) {
      return `Academic research document (${wordCount} words) with empirical methodology and statistical analysis`;
    } else if (patterns.citations.test(text)) {
      return `Scholarly work (${wordCount} words) with academic citations and references`;
    } else if (patterns.academicTerms.test(text)) {
      return `Academic content (${wordCount} words) requiring further scholarly development`;
    } else {
      return `Document with academic potential (${wordCount} words) - consider adding research elements`;
    }
  }

  private static calculateConfidence(text: string, patterns: any): number {
    let confidence = 0.3; // Base confidence

    if (patterns.academicTerms.test(text)) confidence += 0.2;
    if (patterns.citations.test(text)) confidence += 0.2;
    if (patterns.methodology.test(text)) confidence += 0.2;
    if (patterns.statistics.test(text)) confidence += 0.1;
    if (patterns.institutions.test(text)) confidence += 0.1;

    return Math.min(confidence, 0.95);
  }
}