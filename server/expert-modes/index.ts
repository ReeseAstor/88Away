export { AcademicExpert } from './academic';
export { FinanceExpert } from './finance';
export { LawExpert } from './law';
export { MarketingExpert } from './marketing';

export type ExpertMode = 'academic' | 'finance' | 'law' | 'marketing';

export interface ExpertAnalysis {
  mode: ExpertMode;
  summary: string;
  keyPoints: string[];
  entities: string[];
  insights: string[];
  recommendations: string[];
  confidence: number;
  processingTime: number;
}