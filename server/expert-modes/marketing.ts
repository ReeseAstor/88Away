import { ExpertMode, ExpertAnalysis } from './index';

export class MarketingExpert {
  static mode: ExpertMode = 'marketing';

  static analyze(text: string): ExpertAnalysis {
    const startTime = Date.now();

    // Marketing-specific analysis patterns
    const patterns = {
      marketingTerms: /\b(marketing|advertising|branding|campaign|promotion|strategy|target|audience|customer|consumer|market|segment|positioning|differentiation|USP|value\s+proposition)\b/i,
      metrics: /\b(ROI|conversion|click|impression|engagement|reach|traffic|leads|sales|revenue|growth|CPC|CPA|CTR|bounce\s+rate|acquisition|retention|churn)\b/i,
      channels: /\b(social\s+media|email|SEO|SEM|PPC|content|blog|website|mobile|app|TV|radio|print|outdoor|influencer|affiliate|partnership)\b/i,
      demographics: /\b(demographic|age|gender|income|education|location|geographic|psychographic|behavioral|lifestyle|persona|segment)\b/i,
      strategies: /\b(content\s+marketing|inbound|outbound|push|pull|viral|guerrilla|sniper|relationship|experiential|cause|green|sustainable)\b/i,
      analysis: /\b(SWAOT|analysis|research|study|survey|focus\s+group|interview|A/B\s+test|split\s+test|multivariate|analytics|insights)\b/i,
      budgets: /\b(budget|spend|investment|cost|expense|allocation|media\s+buy|CPM|CPC|ROI)\b/i
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

    // Extract marketing channels
    const channelMatches = text.match(new RegExp(patterns.channels.source, 'gi'));
    if (channelMatches) {
      entities.push(...channelMatches);
    }

    // Extract key marketing terms
    const marketingMatches = text.match(new RegExp(patterns.marketingTerms.source, 'gi'));
    if (marketingMatches) {
      entities.push(...marketingMatches);
    }

    // Extract metrics
    const metricMatches = text.match(new RegExp(patterns.metrics.source, 'gi'));
    if (metricMatches) {
      entities.push(...metricMatches);
    }

    return [...new Set(entities)].slice(0, 10);
  }

  private static extractKeyPoints(text: string, patterns: any): string[] {
    const keyPoints: string[] = [];

    // Look for marketing strategy elements
    if (patterns.strategies.test(text)) {
      keyPoints.push('Marketing strategy framework identified');
    }

    // Look for target audience definition
    if (patterns.demographics.test(text)) {
      keyPoints.push('Target audience or market segmentation discussed');
    }

    // Look for marketing channels
    if (patterns.channels.test(text)) {
      keyPoints.push('Marketing channels or media mix specified');
    }

    // Look for measurement and analytics
    if (/\b(ROI|analytics|metrics|measurement)\b/i.test(text)) {
      keyPoints.push('Performance measurement or ROI analysis present');
    }

    // Look for budget considerations
    if (patterns.budgets.test(text)) {
      keyPoints.push('Budget allocation or financial planning included');
    }

    return keyPoints.slice(0, 5);
  }

  private static generateInsights(text: string, patterns: any): string[] {
    const insights: string[] = [];

    // Analyze marketing sophistication
    const marketingTerms = (text.match(new RegExp(patterns.marketingTerms.source, 'gi')) || []).length;
    const strategyTerms = (text.match(new RegExp(patterns.strategies.source, 'gi')) || []).length;

    if (strategyTerms > 3 && marketingTerms > 10) {
      insights.push('Comprehensive marketing strategy with multiple tactical approaches');
    } else if (marketingTerms > 5) {
      insights.push('Strategic marketing approach with clear objectives');
    }

    // Check for data-driven marketing
    if (patterns.metrics.test(text) && patterns.analysis.test(text)) {
      insights.push('Data-driven marketing with analytics and research');
    }

    // Look for multi-channel approach
    const channelCount = (text.match(new RegExp(patterns.channels.source, 'gi')) || []).length;
    if (channelCount > 3) {
      insights.push('Multi-channel marketing approach identified');
    }

    // Check for customer-centric focus
    if (/\b(customer|consumer|audience|persona)\b/i.test(text) && patterns.demographics.test(text)) {
      insights.push('Customer-centric marketing with audience insights');
    }

    return insights.slice(0, 5);
  }

  private static generateRecommendations(text: string, patterns: any): string[] {
    const recommendations: string[] = [];

    if (!patterns.demographics.test(text) && patterns.marketingTerms.test(text)) {
      recommendations.push('Define target audience and customer segments');
    }

    if (!patterns.channels.test(text) && patterns.marketingTerms.test(text)) {
      recommendations.push('Specify marketing channels and media mix');
    }

    if (!patterns.metrics.test(text) && patterns.marketingTerms.test(text)) {
      recommendations.push('Include success metrics and measurement criteria');
    }

    if (!patterns.budgets.test(text) && patterns.strategies.test(text)) {
      recommendations.push('Consider budget allocation and ROI projections');
    }

    if (text.length < 300) {
      recommendations.push('Expand marketing strategy with tactical details');
    }

    return recommendations.slice(0, 4);
  }

  private static generateSummary(text: string, patterns: any): string {
    const wordCount = text.split(/\s+/).length;
    const marketingTerms = (text.match(new RegExp(patterns.marketingTerms.source, 'gi')) || []).length;
    const strategyTerms = (text.match(new RegExp(patterns.strategies.source, 'gi')) || []).length;

    if (strategyTerms > 2 && marketingTerms > 8) {
      return `Comprehensive marketing strategy (${wordCount} words) with ${marketingTerms} marketing concepts`;
    } else if (marketingTerms > 5) {
      return `Marketing document (${wordCount} words) with ${marketingTerms} marketing terms`;
    } else if (patterns.marketingTerms.test(text)) {
      return `Marketing content (${wordCount} words) requiring strategic development`;
    } else {
      return `Document with marketing potential (${wordCount} words) - consider marketing framework`;
    }
  }

  private static calculateConfidence(text: string, patterns: any): number {
    let confidence = 0.3; // Base confidence

    if (patterns.marketingTerms.test(text)) confidence += 0.25;
    if (patterns.strategies.test(text)) confidence += 0.2;
    if (patterns.channels.test(text)) confidence += 0.15;
    if (patterns.metrics.test(text)) confidence += 0.1;
    if (patterns.demographics.test(text)) confidence += 0.1;

    return Math.min(confidence, 0.95);
  }
}