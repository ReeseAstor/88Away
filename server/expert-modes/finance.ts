import { ExpertMode, ExpertAnalysis } from './index';

export class FinanceExpert {
  static mode: ExpertMode = 'finance';

  static analyze(text: string): ExpertAnalysis {
    const startTime = Date.now();

    // Finance-specific analysis patterns
    const patterns = {
      financialTerms: /\b(profit|loss|revenue|earnings|dividend|stock|bond|portfolio|investment|ROI|IRR|CAGR|EBITDA|cash\s+flow|P&L|balance\s+sheet|income\s+statement)\b/i,
      currencies: /\$\d+(\.\d+)?|€\d+(\.\d+)?|£\d+(\.\d+)?|\d+\s*(USD|EUR|GBP|dollars?|euros?|pounds?)\b/i,
      percentages: /\b\d+(\.\d+)?%/,
      ratios: /\b\d+(\.\d+)?:\d+(\.\d+)?|ratio|margin|leverage\b/i,
      timeframes: /\b(Q\d+|FY\d+|annual|quarterly|monthly|yearly|forecast|projection)\b/i,
      riskTerms: /\b(risk|volatility|hedge|diversification|beta|alpha|sharpe|treynor)\b/i,
      institutions: /\b(bank|financial\s+institution|fed|central\s+bank|federal\s+reserve|SEC|FINRA)\b/i
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

    // Extract financial institutions
    const institutionMatches = text.match(new RegExp(patterns.institutions.source, 'gi'));
    if (institutionMatches) {
      entities.push(...institutionMatches);
    }

    // Extract currency amounts
    const currencyMatches = text.match(new RegExp(patterns.currencies.source, 'gi'));
    if (currencyMatches) {
      entities.push(...currencyMatches);
    }

    // Extract key financial terms
    const financialMatches = text.match(new RegExp(patterns.financialTerms.source, 'gi'));
    if (financialMatches) {
      entities.push(...financialMatches);
    }

    return Array.from(new Set(entities)).slice(0, 10);
  }

  private static extractKeyPoints(text: string, patterns: any): string[] {
    const keyPoints: string[] = [];

    // Look for financial statements
    if (/\b(balance\s+sheet|income\s+statement|P&L|cash\s+flow)\b/i.test(text)) {
      keyPoints.push('Contains financial statement references');
    }

    // Look for investment terms
    if (/\b(portfolio|investment|dividend|stock|bond)\b/i.test(text)) {
      keyPoints.push('Investment-related content detected');
    }

    // Look for performance metrics
    if (/\b(ROI|IRR|CAGR|EBITDA|margin)\b/i.test(text)) {
      keyPoints.push('Financial performance metrics identified');
    }

    // Look for risk analysis
    if (patterns.riskTerms.test(text)) {
      keyPoints.push('Risk assessment elements present');
    }

    // Look for time-based analysis
    if (patterns.timeframes.test(text)) {
      keyPoints.push('Time-series or forecasting content detected');
    }

    return keyPoints.slice(0, 5);
  }

  private static generateInsights(text: string, patterns: any): string[] {
    const insights: string[] = [];

    // Analyze financial health indicators
    const profitMentions = (text.match(/\bprofit|revenue|earnings\b/gi) || []).length;
    const lossMentions = (text.match(/\bloss|decline|decrease\b/gi) || []).length;

    if (profitMentions > lossMentions * 2) {
      insights.push('Document suggests positive financial performance');
    } else if (lossMentions > profitMentions * 2) {
      insights.push('Document indicates financial challenges');
    }

    // Check for comprehensive financial analysis
    if (patterns.financialTerms.test(text) && patterns.currencies.test(text)) {
      insights.push('Comprehensive financial data and terminology present');
    }

    // Look for investment strategy indicators
    if (/\b(diversification|hedge|portfolio|allocation)\b/i.test(text)) {
      insights.push('Investment strategy or portfolio management discussed');
    }

    // Check for regulatory compliance mentions
    if (/\b(compliance|regulation|SEC|audit)\b/i.test(text)) {
      insights.push('Regulatory or compliance considerations mentioned');
    }

    return insights.slice(0, 5);
  }

  private static generateRecommendations(text: string, patterns: any): string[] {
    const recommendations: string[] = [];

    if (!patterns.currencies.test(text) && patterns.financialTerms.test(text)) {
      recommendations.push('Include specific monetary amounts for clarity');
    }

    if (!patterns.timeframes.test(text) && patterns.financialTerms.test(text)) {
      recommendations.push('Specify relevant time periods for financial data');
    }

    if (!patterns.riskTerms.test(text) && /\b(investment|portfolio)\b/i.test(text)) {
      recommendations.push('Consider including risk assessment');
    }

    if (text.length < 300) {
      recommendations.push('Expand financial analysis with supporting data');
    }

    return recommendations.slice(0, 4);
  }

  private static generateSummary(text: string, patterns: any): string {
    const wordCount = text.split(/\s+/).length;
    const financialTerms = (text.match(new RegExp(patterns.financialTerms.source, 'gi')) || []).length;

    if (financialTerms > 5) {
      return `Financial document (${wordCount} words) with ${financialTerms} financial terms and concepts`;
    } else if (patterns.financialTerms.test(text)) {
      return `Financial content (${wordCount} words) with basic financial terminology`;
    } else {
      return `Document with financial relevance (${wordCount} words) - consider adding financial details`;
    }
  }

  private static calculateConfidence(text: string, patterns: any): number {
    let confidence = 0.3; // Base confidence

    if (patterns.financialTerms.test(text)) confidence += 0.25;
    if (patterns.currencies.test(text)) confidence += 0.2;
    if (patterns.institutions.test(text)) confidence += 0.15;
    if (patterns.percentages.test(text)) confidence += 0.1;
    if (patterns.riskTerms.test(text)) confidence += 0.1;

    return Math.min(confidence, 0.95);
  }
}