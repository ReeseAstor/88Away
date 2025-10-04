import { ExpertMode, ExpertAnalysis } from './index';

export class LawExpert {
  static mode: ExpertMode = 'law';

  static analyze(text: string): ExpertAnalysis {
    const startTime = Date.now();

    // Law-specific analysis patterns
    const patterns = {
      legalTerms: /\b(contract|agreement|litigation|court|judge|jury|plaintiff|defendant|attorney|lawyer|counsel|legal|law|act|statute|regulation|ordinance|code|section|paragraph|clause|provision)\b/i,
      caseLaw: /\b(v\.|versus|case|precedent|holding|ruling|decision|judgment|opinion|appeal|supreme\s+court|district\s+court|circuit\s+court)\b/i,
      parties: /\b(party|parties|respondent|appellant|petitioner|claimant|respondent|defendant|plaintiff)\b/i,
      remedies: /\b(damages|injunction|specific\s+performance|restitution|equitable|relief|compensation|penalty|sanction)\b/i,
      procedures: /\b(procedure|process|hearing|trial|motion|brief|pleading|discovery|deposition|interrogatory|subpoena)\b/i,
      jurisdictions: /\b(jurisdiction|venue|forum|state\s+law|federal\s+law|common\s+law|civil\s+law|criminal\s+law|administrative\s+law)\b/i,
      dates: /\b(dated?|executed?|entered?|filed?)\s+\d{1,2}\/\d{1,2}\/\d{2,4}/i
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

    // Extract legal parties
    const partyMatches = text.match(new RegExp(patterns.parties.source, 'gi'));
    if (partyMatches) {
      entities.push(...partyMatches);
    }

    // Extract case references
    const caseMatches = text.match(new RegExp(patterns.caseLaw.source, 'gi'));
    if (caseMatches) {
      entities.push(...caseMatches);
    }

    // Extract legal terms
    const legalMatches = text.match(new RegExp(patterns.legalTerms.source, 'gi'));
    if (legalMatches) {
      entities.push(...legalMatches);
    }

    return [...new Set(entities)].slice(0, 10);
  }

  private static extractKeyPoints(text: string, patterns: any): string[] {
    const keyPoints: string[] = [];

    // Look for legal document types
    if (/\b(contract|agreement|will|trust|deed)\b/i.test(text)) {
      keyPoints.push('Legal agreement or contract identified');
    }

    // Look for litigation elements
    if (/\b(litigation|court|trial|hearing)\b/i.test(text)) {
      keyPoints.push('Litigation or court proceedings mentioned');
    }

    // Look for remedies sought
    if (patterns.remedies.test(text)) {
      keyPoints.push('Legal remedies or relief discussed');
    }

    // Look for procedural elements
    if (patterns.procedures.test(text)) {
      keyPoints.push('Legal procedures or processes described');
    }

    // Look for jurisdictional references
    if (patterns.jurisdictions.test(text)) {
      keyPoints.push('Jurisdictional considerations present');
    }

    return keyPoints.slice(0, 5);
  }

  private static generateInsights(text: string, patterns: any): string[] {
    const insights: string[] = [];

    // Analyze legal document complexity
    const legalTerms = (text.match(new RegExp(patterns.legalTerms.source, 'gi')) || []).length;
    const wordCount = text.split(/\s+/).length;

    if (legalTerms > 15) {
      insights.push('Complex legal document with extensive legal terminology');
    } else if (legalTerms > 5) {
      insights.push('Moderate legal complexity with key legal concepts');
    }

    // Check for case law references
    if (patterns.caseLaw.test(text)) {
      insights.push('Case law precedents or judicial decisions referenced');
    }

    // Look for party relationships
    if (patterns.parties.test(text)) {
      const partyCount = (text.match(new RegExp(patterns.parties.source, 'gi')) || []).length;
      if (partyCount > 3) {
        insights.push('Multiple parties or complex party relationships');
      }
    }

    // Check for procedural posture
    if (patterns.procedures.test(text) && /\b(appeal|review|motion)\b/i.test(text)) {
      insights.push('Procedural or appellate context identified');
    }

    return insights.slice(0, 5);
  }

  private static generateRecommendations(text: string, patterns: any): string[] {
    const recommendations: string[] = [];

    if (!patterns.dates.test(text) && /\b(contract|agreement)\b/i.test(text)) {
      recommendations.push('Include execution or effective dates');
    }

    if (!patterns.parties.test(text) && patterns.legalTerms.test(text)) {
      recommendations.push('Clearly identify all parties involved');
    }

    if (!patterns.jurisdictions.test(text) && /\b(litigation|court)\b/i.test(text)) {
      recommendations.push('Specify relevant jurisdiction or venue');
    }

    if (text.length < 200) {
      recommendations.push('Expand legal analysis with supporting case law');
    }

    return recommendations.slice(0, 4);
  }

  private static generateSummary(text: string, patterns: any): string {
    const wordCount = text.split(/\s+/).length;
    const legalTerms = (text.match(new RegExp(patterns.legalTerms.source, 'gi')) || []).length;

    if (/\b(contract|agreement)\b/i.test(text)) {
      return `Legal agreement (${wordCount} words) with ${legalTerms} legal terms`;
    } else if (/\b(litigation|court)\b/i.test(text)) {
      return `Legal proceeding document (${wordCount} words) with ${legalTerms} legal references`;
    } else if (legalTerms > 5) {
      return `Legal document (${wordCount} words) with ${legalTerms} legal concepts`;
    } else {
      return `Document with legal relevance (${wordCount} words) - consider legal review`;
    }
  }

  private static calculateConfidence(text: string, patterns: any): number {
    let confidence = 0.3; // Base confidence

    if (patterns.legalTerms.test(text)) confidence += 0.25;
    if (patterns.caseLaw.test(text)) confidence += 0.2;
    if (patterns.parties.test(text)) confidence += 0.15;
    if (patterns.remedies.test(text)) confidence += 0.1;
    if (patterns.procedures.test(text)) confidence += 0.1;

    return Math.min(confidence, 0.95);
  }
}