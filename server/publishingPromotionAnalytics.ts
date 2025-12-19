export type MoneyCents = number;

export type RevenueEntryLike = {
  amount: MoneyCents;
  source?: string | null;
  transactionDate: Date | string;
  metadata?: any;
};

export type PromotionGroupRow = {
  key: string;
  revenueCents: MoneyCents;
  spendCents: MoneyCents;
  netCents: MoneyCents;
  roas: number | null;
  transactions: number;
};

export type PromotionTimelineRow = {
  date: string; // YYYY-MM-DD
  revenueCents: MoneyCents;
  spendCents: MoneyCents;
  netCents: MoneyCents;
};

export type PromotionAttribution = {
  byChannel: PromotionGroupRow[];
  byCampaign: PromotionGroupRow[];
  timeline: PromotionTimelineRow[];
};

function safeDateKey(d: Date | string): string {
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function normalizeKey(v: unknown, fallback: string): string {
  if (typeof v !== 'string') return fallback;
  const trimmed = v.trim();
  return trimmed.length ? trimmed : fallback;
}

function calcRoas(revenueCents: number, spendCents: number): number | null {
  if (!spendCents) return null;
  // ROAS = revenue / spend
  return revenueCents / spendCents;
}

export function computePromotionAttribution(entries: RevenueEntryLike[]): PromotionAttribution {
  const channelMap = new Map<string, PromotionGroupRow>();
  const campaignMap = new Map<string, PromotionGroupRow>();
  const timelineMap = new Map<string, PromotionTimelineRow>();

  const upsertGroup = (map: Map<string, PromotionGroupRow>, key: string) => {
    const existing = map.get(key);
    if (existing) return existing;
    const row: PromotionGroupRow = {
      key,
      revenueCents: 0,
      spendCents: 0,
      netCents: 0,
      roas: null,
      transactions: 0,
    };
    map.set(key, row);
    return row;
  };

  const upsertTimeline = (date: string) => {
    const existing = timelineMap.get(date);
    if (existing) return existing;
    const row: PromotionTimelineRow = {
      date,
      revenueCents: 0,
      spendCents: 0,
      netCents: 0,
    };
    timelineMap.set(date, row);
    return row;
  };

  for (const entry of entries) {
    const meta = (entry?.metadata && typeof entry.metadata === 'object') ? entry.metadata : {};

    const channel = normalizeKey(
      meta.channel ?? meta.utm_source ?? entry.source,
      'unknown'
    );
    const campaign = normalizeKey(
      meta.campaign ?? meta.utm_campaign ?? meta.campaignName,
      'unattributed'
    );

    const date = safeDateKey(entry.transactionDate);
    const amount = Number(entry.amount) || 0;

    const isSpend = amount < 0 || meta.type === 'expense' || meta.kind === 'spend';
    const revenueCents = isSpend ? 0 : amount;
    const spendCents = isSpend ? Math.abs(amount) : 0;

    const channelRow = upsertGroup(channelMap, channel);
    channelRow.revenueCents += revenueCents;
    channelRow.spendCents += spendCents;
    channelRow.transactions += 1;

    const campaignRow = upsertGroup(campaignMap, campaign);
    campaignRow.revenueCents += revenueCents;
    campaignRow.spendCents += spendCents;
    campaignRow.transactions += 1;

    if (date) {
      const t = upsertTimeline(date);
      t.revenueCents += revenueCents;
      t.spendCents += spendCents;
    }
  }

  const finalizeGroups = (rows: PromotionGroupRow[]) => {
    for (const row of rows) {
      row.netCents = row.revenueCents - row.spendCents;
      row.roas = calcRoas(row.revenueCents, row.spendCents);
    }
    rows.sort((a, b) => (b.netCents - a.netCents) || (b.revenueCents - a.revenueCents));
    return rows;
  };

  const byChannel = finalizeGroups(Array.from(channelMap.values()));
  const byCampaign = finalizeGroups(Array.from(campaignMap.values()));

  const timeline = Array.from(timelineMap.values())
    .map((row) => ({
      ...row,
      netCents: row.revenueCents - row.spendCents,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return { byChannel, byCampaign, timeline };
}

export type PublishingInputs = {
  currentWordCount?: number | null;
  targetWordCount?: number | null;
  publicationStatus?: string | null;
  hasSelectedCover: boolean;
  hasActiveBlurb: boolean;
  keywordCount: number;
  categoryCount: number;
  hasPrice: boolean;
  hasPublicationDate: boolean;
};

export type PublishingReadiness = {
  score: number; // 0-100
  missing: string[];
  nextSteps: string[];
  breakdown: Array<{ name: string; score: number; max: number }>;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function computePublishingReadiness(input: PublishingInputs): PublishingReadiness {
  const breakdown: PublishingReadiness['breakdown'] = [];
  const missing: string[] = [];
  const nextSteps: string[] = [];

  // Weights (sum to 100)
  const WEIGHTS = {
    manuscript: 20,
    cover: 15,
    blurb: 15,
    keywords: 15,
    categories: 10,
    pricing: 10,
    publicationDate: 5,
    status: 10,
  } as const;

  // Manuscript readiness: current / target (if target exists), else neutral 50%
  const current = Number(input.currentWordCount) || 0;
  const target = Number(input.targetWordCount) || 0;
  const manuscriptPct =
    target > 0 ? clamp(Math.round((current / target) * 100), 0, 100) : 50;
  const manuscriptScore = Math.round((manuscriptPct / 100) * WEIGHTS.manuscript);
  breakdown.push({ name: 'Manuscript', score: manuscriptScore, max: WEIGHTS.manuscript });
  if (target > 0 && manuscriptPct < 90) {
    missing.push('Manuscript below target word count');
    nextSteps.push('Push the manuscript closer to your target word count before launch.');
  }

  const coverScore = input.hasSelectedCover ? WEIGHTS.cover : 0;
  breakdown.push({ name: 'Cover', score: coverScore, max: WEIGHTS.cover });
  if (!input.hasSelectedCover) {
    missing.push('No selected cover');
    nextSteps.push('Design/upload a cover and mark it as selected.');
  }

  const blurbScore = input.hasActiveBlurb ? WEIGHTS.blurb : 0;
  breakdown.push({ name: 'Blurb', score: blurbScore, max: WEIGHTS.blurb });
  if (!input.hasActiveBlurb) {
    missing.push('No active blurb');
    nextSteps.push('Create an Amazon description blurb and set it active.');
  }

  const keywordScore =
    clamp(Math.round((clamp(input.keywordCount, 0, 7) / 7) * WEIGHTS.keywords), 0, WEIGHTS.keywords);
  breakdown.push({ name: 'Keywords', score: keywordScore, max: WEIGHTS.keywords });
  if (input.keywordCount < 7) {
    missing.push('Fewer than 7 keywords');
    nextSteps.push('Add/optimize KDP keywords (aim for 7).');
  }

  const categoryScore =
    clamp(Math.round((clamp(input.categoryCount, 0, 2) / 2) * WEIGHTS.categories), 0, WEIGHTS.categories);
  breakdown.push({ name: 'Categories', score: categoryScore, max: WEIGHTS.categories });
  if (input.categoryCount < 2) {
    missing.push('Fewer than 2 categories');
    nextSteps.push('Select at least 2 strong KDP categories.');
  }

  const pricingScore = input.hasPrice ? WEIGHTS.pricing : 0;
  breakdown.push({ name: 'Pricing', score: pricingScore, max: WEIGHTS.pricing });
  if (!input.hasPrice) {
    missing.push('No price set');
    nextSteps.push('Set launch pricing and royalty rate assumptions.');
  }

  const pubDateScore = input.hasPublicationDate ? WEIGHTS.publicationDate : 0;
  breakdown.push({ name: 'Publication Date', score: pubDateScore, max: WEIGHTS.publicationDate });
  if (!input.hasPublicationDate) {
    missing.push('No publication date');
    nextSteps.push('Set a publication / preorder date to anchor your launch plan.');
  }

  const status = normalizeKey(input.publicationStatus, 'draft');
  const statusScore = status !== 'draft' ? WEIGHTS.status : Math.round(WEIGHTS.status * 0.3);
  breakdown.push({ name: 'Status', score: statusScore, max: WEIGHTS.status });
  if (status === 'draft') {
    missing.push('Project status is still draft');
    nextSteps.push('Move the project into in_progress / ready_for_review as you approach launch.');
  }

  const score = clamp(breakdown.reduce((acc, b) => acc + b.score, 0), 0, 100);

  return {
    score,
    missing: Array.from(new Set(missing)),
    nextSteps: Array.from(new Set(nextSteps)).slice(0, 8),
    breakdown,
  };
}

