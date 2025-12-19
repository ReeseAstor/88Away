import { db } from './db';
import { 
  projects, 
  documents, 
  documentVersions,
  characters, 
  worldbuildingEntries, 
  timelineEvents,
  aiGenerations,
  writingSessions,
  activityLogs,
  projectCollaborators,
  users,
  coverDesigns,
  bookBlurbs,
  kdpMetadata,
  revenueEntries,
} from '@shared/schema';
import { sql, and, eq, gte, desc, count, sum, avg } from 'drizzle-orm';
import { computePromotionAttribution, computePublishingReadiness } from './publishingPromotionAnalytics';

export interface ProjectAnalytics {
  overview: {
    totalProjects: number;
    totalDocuments: number;
    totalWordCount: number;
    totalCharacters: number;
    totalWorldbuildingEntries: number;
    totalTimelineEvents: number;
    aiGenerationsCount: number;
  };
  writingProgress: {
    daily: Array<{ date: string; words: number; sessions: number }>;
    weekly: Array<{ week: string; words: number; sessions: number }>;
    monthly: Array<{ month: string; words: number; sessions: number }>;
    streak: {
      currentStreak: number;
      longestStreak: number;
      lastActiveDate: string;
    };
    weeklyStats: {
      totalWords: number;
      averageDaily: number;
      mostProductiveDay: string;
    };
    monthlyStats: {
      totalWords: number;
      averageDaily: number;
    };
  };
  aiUsage: {
    totalGenerations: number;
    byPersona: Array<{ persona: string; count: number }>;
    recent: Array<{
      id: string;
      persona: string;
      prompt: string;
      createdAt: string;
      metadata?: any;
    }>;
    tokenUsageOverTime?: Array<{ date: string; tokens: number; cost: number }>;
    totalTokensUsed?: number;
    estimatedCost?: number;
  };
  collaboration: {
    totalCollaborators: number;
    activeCollaborators: number;
    recentActivity: Array<{
      id: string;
      userName: string;
      action: string;
      entityType: string;
      createdAt: string;
    }>;
  };
  productivity: {
    averageSessionDuration: number;
    totalWritingTime: number;
    mostProductiveHour: number;
    consistencyScore: number;
  };
  publishingPromotion?: {
    readiness: {
      score: number;
      missing: string[];
      nextSteps: string[];
      breakdown: Array<{ name: string; score: number; max: number }>;
    };
    kdp: {
      hasMetadata: boolean;
      asin?: string | null;
      kdpStatus?: string | null;
      lastSynced?: string | null;
      publicationDate?: string | null;
      priceCents?: number | null;
      royaltyRate?: number | null;
      keywordCount: number;
      categoryCount: number;
    };
    promotion: {
      byChannel: Array<{
        channel: string;
        revenueCents: number;
        spendCents: number;
        netCents: number;
        roas: number | null;
        transactions: number;
      }>;
      byCampaign: Array<{
        campaign: string;
        revenueCents: number;
        spendCents: number;
        netCents: number;
        roas: number | null;
        transactions: number;
      }>;
      timeline: Array<{
        date: string;
        revenueCents: number;
        spendCents: number;
        netCents: number;
      }>;
    };
  };
}

export class AnalyticsService {
  static async getProjectAnalytics(projectId: string, userId: string): Promise<ProjectAnalytics> {
    // Verify user has access to this project
    const projectAccess = await db
      .select()
      .from(projects)
      .leftJoin(projectCollaborators, eq(projects.id, projectCollaborators.projectId))
      .where(
        and(
          eq(projects.id, projectId),
          sql`(${projects.ownerId} = ${userId} OR ${projectCollaborators.userId} = ${userId})`
        )
      )
      .limit(1);

    if (!projectAccess.length) {
      throw new Error('Access denied - not authorized for this project');
    }

    const [overview, writingProgress, aiUsage, collaboration, productivity, publishingPromotion] = await Promise.all([
      this.getOverviewMetrics(projectId),
      this.getWritingProgressMetrics(projectId),
      this.getAiUsageMetrics(projectId),
      this.getCollaborationMetrics(projectId),
      this.getProductivityMetrics(projectId),
      this.getPublishingPromotionMetrics(projectId),
    ]);

    return {
      overview,
      writingProgress,
      aiUsage,
      collaboration,
      productivity,
      publishingPromotion,
    };
  }

  private static async getOverviewMetrics(projectId: string) {
    const [
      projectCount,
      documentStats,
      characterCount,
      worldbuildingCount,
      timelineCount,
      aiCount,
    ] = await Promise.all([
      db.select({ count: count() }).from(projects).where(eq(projects.id, projectId)),
      db.select({ 
        count: count(),
        totalWords: sum(documents.wordCount)
      }).from(documents).where(eq(documents.projectId, projectId)),
      db.select({ count: count() }).from(characters).where(eq(characters.projectId, projectId)),
      db.select({ count: count() }).from(worldbuildingEntries).where(eq(worldbuildingEntries.projectId, projectId)),
      db.select({ count: count() }).from(timelineEvents).where(eq(timelineEvents.projectId, projectId)),
      db.select({ count: count() }).from(aiGenerations).where(eq(aiGenerations.projectId, projectId)),
    ]);

    return {
      totalProjects: projectCount[0]?.count || 0,
      totalDocuments: documentStats[0]?.count || 0,
      totalWordCount: Number(documentStats[0]?.totalWords) || 0,
      totalCharacters: characterCount[0]?.count || 0,
      totalWorldbuildingEntries: worldbuildingCount[0]?.count || 0,
      totalTimelineEvents: timelineCount[0]?.count || 0,
      aiGenerationsCount: aiCount[0]?.count || 0,
    };
  }

  private static async getWritingProgressMetrics(projectId: string) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Daily progress for last 30 days
    const dailyProgress = await db
      .select({
        date: sql<string>`DATE(${writingSessions.createdAt})`,
        words: sum(writingSessions.wordsWritten),
        sessions: count(writingSessions.id),
      })
      .from(writingSessions)
      .where(
        and(
          eq(writingSessions.projectId, projectId),
          gte(writingSessions.createdAt, thirtyDaysAgo)
        )
      )
      .groupBy(sql`DATE(${writingSessions.createdAt})`)
      .orderBy(sql`DATE(${writingSessions.createdAt})`);

    // Weekly progress for last 12 weeks
    const weeklyProgress = await db
      .select({
        week: sql<string>`DATE_TRUNC('week', ${writingSessions.createdAt})`,
        words: sum(writingSessions.wordsWritten),
        sessions: count(writingSessions.id),
      })
      .from(writingSessions)
      .where(
        and(
          eq(writingSessions.projectId, projectId),
          gte(writingSessions.createdAt, new Date(now.getTime() - 12 * 7 * 24 * 60 * 60 * 1000))
        )
      )
      .groupBy(sql`DATE_TRUNC('week', ${writingSessions.createdAt})`)
      .orderBy(sql`DATE_TRUNC('week', ${writingSessions.createdAt})`);

    // Monthly progress for last 12 months
    const monthlyProgress = await db
      .select({
        month: sql<string>`DATE_TRUNC('month', ${writingSessions.createdAt})`,
        words: sum(writingSessions.wordsWritten),
        sessions: count(writingSessions.id),
      })
      .from(writingSessions)
      .where(
        and(
          eq(writingSessions.projectId, projectId),
          gte(writingSessions.createdAt, new Date(now.getTime() - 12 * 30 * 24 * 60 * 60 * 1000))
        )
      )
      .groupBy(sql`DATE_TRUNC('month', ${writingSessions.createdAt})`)
      .orderBy(sql`DATE_TRUNC('month', ${writingSessions.createdAt})`);

    // Calculate writing streaks from document updates
    const streak = await this.calculateWritingStreak(projectId);

    // Calculate weekly stats
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weeklyData = await db
      .select({
        date: sql<string>`DATE(${writingSessions.createdAt})`,
        words: sum(writingSessions.wordsWritten),
      })
      .from(writingSessions)
      .where(
        and(
          eq(writingSessions.projectId, projectId),
          gte(writingSessions.createdAt, sevenDaysAgo)
        )
      )
      .groupBy(sql`DATE(${writingSessions.createdAt})`);

    const weeklyTotalWords = weeklyData.reduce((acc, row) => acc + (Number(row.words) || 0), 0);
    const weeklyAverageDaily = weeklyData.length > 0 ? Math.round(weeklyTotalWords / 7) : 0;
    
    // Find most productive day this week
    let mostProductiveDay = 'N/A';
    let maxWords = 0;
    for (const row of weeklyData) {
      const words = Number(row.words) || 0;
      if (words > maxWords) {
        maxWords = words;
        mostProductiveDay = new Date(row.date).toLocaleDateString('en-US', { weekday: 'long' });
      }
    }

    // Calculate monthly stats
    const thirtyOneDaysAgo = new Date(now.getTime() - 31 * 24 * 60 * 60 * 1000);
    const monthlyData = await db
      .select({
        words: sum(writingSessions.wordsWritten),
      })
      .from(writingSessions)
      .where(
        and(
          eq(writingSessions.projectId, projectId),
          gte(writingSessions.createdAt, thirtyOneDaysAgo)
        )
      );

    const monthlyTotalWords = Number(monthlyData[0]?.words) || 0;
    const monthlyAverageDaily = Math.round(monthlyTotalWords / 31);

    return {
      daily: dailyProgress.map(row => ({
        date: row.date,
        words: Number(row.words) || 0,
        sessions: Number(row.sessions) || 0,
      })),
      weekly: weeklyProgress.map(row => ({
        week: row.week,
        words: Number(row.words) || 0,
        sessions: Number(row.sessions) || 0,
      })),
      monthly: monthlyProgress.map(row => ({
        month: row.month,
        words: Number(row.words) || 0,
        sessions: Number(row.sessions) || 0,
      })),
      streak,
      weeklyStats: {
        totalWords: weeklyTotalWords,
        averageDaily: weeklyAverageDaily,
        mostProductiveDay,
      },
      monthlyStats: {
        totalWords: monthlyTotalWords,
        averageDaily: monthlyAverageDaily,
      },
    };
  }

  private static async calculateWritingStreak(projectId: string): Promise<{
    currentStreak: number;
    longestStreak: number;
    lastActiveDate: string;
  }> {
    // Get all unique dates when documents were updated or versions were created
    const [documentDates, versionDates] = await Promise.all([
      db
        .select({ date: sql<string>`DATE(${documents.updatedAt})` })
        .from(documents)
        .where(eq(documents.projectId, projectId))
        .groupBy(sql`DATE(${documents.updatedAt})`),
      db
        .select({ date: sql<string>`DATE(${documentVersions.createdAt})` })
        .from(documentVersions)
        .innerJoin(documents, eq(documentVersions.documentId, documents.id))
        .where(eq(documents.projectId, projectId))
        .groupBy(sql`DATE(${documentVersions.createdAt})`),
    ]);

    // Combine and deduplicate dates
    const allDatesSet = new Set<string>();
    documentDates.forEach(row => allDatesSet.add(row.date));
    versionDates.forEach(row => allDatesSet.add(row.date));

    // Convert to sorted array
    const sortedDates = Array.from(allDatesSet)
      .map(dateStr => new Date(dateStr))
      .sort((a, b) => a.getTime() - b.getTime());

    if (sortedDates.length === 0) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        lastActiveDate: '',
      };
    }

    const lastActiveDate = sortedDates[sortedDates.length - 1].toISOString().split('T')[0];

    // Helper function to check if two dates are consecutive
    const isConsecutive = (date1: Date, date2: Date): boolean => {
      const diffMs = date2.getTime() - date1.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      return diffDays === 1;
    };

    // Calculate longest streak
    let longestStreak = 1;
    let currentStreakCount = 1;

    for (let i = 1; i < sortedDates.length; i++) {
      if (isConsecutive(sortedDates[i - 1], sortedDates[i])) {
        currentStreakCount++;
        longestStreak = Math.max(longestStreak, currentStreakCount);
      } else {
        currentStreakCount = 1;
      }
    }

    // Calculate current streak (counting backward from most recent date)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const mostRecentDate = sortedDates[sortedDates.length - 1];
    mostRecentDate.setHours(0, 0, 0, 0);

    // Check if the most recent writing was today or yesterday
    const daysSinceLastWrite = Math.round((today.getTime() - mostRecentDate.getTime()) / (1000 * 60 * 60 * 24));
    
    let currentStreak = 0;
    if (daysSinceLastWrite <= 1) {
      // Start from the most recent date and count backward
      currentStreak = 1;
      for (let i = sortedDates.length - 2; i >= 0; i--) {
        if (isConsecutive(sortedDates[i], sortedDates[i + 1])) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    return {
      currentStreak,
      longestStreak,
      lastActiveDate,
    };
  }

  private static async getAiUsageMetrics(projectId: string) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [totalCount, byPersona, recent, allGenerations] = await Promise.all([
      db.select({ count: count() }).from(aiGenerations).where(eq(aiGenerations.projectId, projectId)),
      db.select({
        persona: aiGenerations.persona,
        count: count(),
      })
        .from(aiGenerations)
        .where(eq(aiGenerations.projectId, projectId))
        .groupBy(aiGenerations.persona),
      db.select({
        id: aiGenerations.id,
        persona: aiGenerations.persona,
        prompt: aiGenerations.prompt,
        createdAt: aiGenerations.createdAt,
        metadata: aiGenerations.metadata,
      })
        .from(aiGenerations)
        .where(eq(aiGenerations.projectId, projectId))
        .orderBy(desc(aiGenerations.createdAt))
        .limit(10),
      db.select({
        createdAt: aiGenerations.createdAt,
        metadata: aiGenerations.metadata,
      })
        .from(aiGenerations)
        .where(
          and(
            eq(aiGenerations.projectId, projectId),
            gte(aiGenerations.createdAt, thirtyDaysAgo)
          )
        )
        .orderBy(aiGenerations.createdAt),
    ]);

    // Calculate token usage over time
    const tokenUsageByDate = new Map<string, { tokens: number; cost: number }>();
    let totalTokensUsed = 0;

    for (const gen of allGenerations) {
      if (gen.metadata && typeof gen.metadata === 'object') {
        const metadata = gen.metadata as any;
        const tokensIn = metadata.tokens_in || 0;
        const tokensOut = metadata.tokens_out || 0;
        const totalTokens = tokensIn + tokensOut;
        totalTokensUsed += totalTokens;

        const date = gen.createdAt?.toISOString().split('T')[0] || '';
        const existing = tokenUsageByDate.get(date) || { tokens: 0, cost: 0 };
        const cost = (totalTokens / 1000) * 0.002; // $0.002 per 1K tokens estimate
        
        tokenUsageByDate.set(date, {
          tokens: existing.tokens + totalTokens,
          cost: existing.cost + cost,
        });
      }
    }

    const tokenUsageOverTime = Array.from(tokenUsageByDate.entries()).map(([date, data]) => ({
      date,
      tokens: data.tokens,
      cost: data.cost,
    }));

    const estimatedCost = (totalTokensUsed / 1000) * 0.002;

    return {
      totalGenerations: totalCount[0]?.count || 0,
      byPersona: byPersona.map(row => ({
        persona: row.persona,
        count: Number(row.count),
      })),
      recent: recent.map(row => ({
        id: row.id,
        persona: row.persona,
        prompt: row.prompt.substring(0, 100) + '...',
        createdAt: row.createdAt?.toISOString() || '',
        metadata: row.metadata,
      })),
      tokenUsageOverTime,
      totalTokensUsed,
      estimatedCost,
    };
  }

  private static async getCollaborationMetrics(projectId: string) {
    const [collaboratorCount, activityData] = await Promise.all([
      db.select({ count: count() }).from(projectCollaborators).where(eq(projectCollaborators.projectId, projectId)),
      db.select({
        id: activityLogs.id,
        userName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
        action: activityLogs.action,
        entityType: activityLogs.entityType,
        createdAt: activityLogs.createdAt,
      })
        .from(activityLogs)
        .innerJoin(users, eq(activityLogs.userId, users.id))
        .where(eq(activityLogs.projectId, projectId))
        .orderBy(desc(activityLogs.createdAt))
        .limit(20),
    ]);

    // Calculate active collaborators (those who have done something in last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const activeCollaborators = await db
      .select({ count: sql<number>`COUNT(DISTINCT ${activityLogs.userId})` })
      .from(activityLogs)
      .where(
        and(
          eq(activityLogs.projectId, projectId),
          gte(activityLogs.createdAt, sevenDaysAgo)
        )
      );

    return {
      totalCollaborators: collaboratorCount[0]?.count || 0,
      activeCollaborators: Number(activeCollaborators[0]?.count) || 0,
      recentActivity: activityData.map(row => ({
        id: row.id,
        userName: row.userName || 'Unknown User',
        action: row.action,
        entityType: row.entityType,
        createdAt: row.createdAt?.toISOString() || '',
      })),
    };
  }

  private static async getProductivityMetrics(projectId: string) {
    const [avgDuration, totalTime, hourlyData] = await Promise.all([
      db.select({ avg: avg(writingSessions.duration) })
        .from(writingSessions)
        .where(eq(writingSessions.projectId, projectId)),
      db.select({ total: sum(writingSessions.duration) })
        .from(writingSessions)
        .where(eq(writingSessions.projectId, projectId)),
      db.select({
        hour: sql<number>`EXTRACT(HOUR FROM ${writingSessions.startTime})`,
        sessions: count(),
        words: sum(writingSessions.wordsWritten),
      })
        .from(writingSessions)
        .where(eq(writingSessions.projectId, projectId))
        .groupBy(sql`EXTRACT(HOUR FROM ${writingSessions.startTime})`)
        .orderBy(desc(count())),
    ]);

    // Find most productive hour
    const mostProductiveHour = hourlyData.length > 0 ? Number(hourlyData[0].hour) : 0;

    // Calculate consistency score (percentage of days with writing activity in last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const activeDays = await db
      .select({ count: sql<number>`COUNT(DISTINCT DATE(${writingSessions.createdAt}))` })
      .from(writingSessions)
      .where(
        and(
          eq(writingSessions.projectId, projectId),
          gte(writingSessions.createdAt, thirtyDaysAgo)
        )
      );

    const consistencyScore = Math.round((Number(activeDays[0]?.count) || 0) / 30 * 100);

    return {
      averageSessionDuration: Math.round(Number(avgDuration[0]?.avg) || 0),
      totalWritingTime: Number(totalTime[0]?.total) || 0,
      mostProductiveHour,
      consistencyScore,
    };
  }

  private static async getPublishingPromotionMetrics(projectId: string) {
    const [projectRow, kdpRow, coverRow, blurbRow, revenueRows] = await Promise.all([
      db
        .select({
          currentWordCount: projects.currentWordCount,
          targetWordCount: projects.targetWordCount,
          publicationStatus: projects.publicationStatus,
        })
        .from(projects)
        .where(eq(projects.id, projectId))
        .limit(1),
      db
        .select({
          asin: kdpMetadata.asin,
          categories: kdpMetadata.categories,
          keywords: kdpMetadata.keywords,
          price: kdpMetadata.price,
          royaltyRate: kdpMetadata.royaltyRate,
          publicationDate: kdpMetadata.publicationDate,
          lastSynced: kdpMetadata.lastSynced,
          kdpStatus: kdpMetadata.kdpStatus,
          updatedAt: kdpMetadata.updatedAt,
        })
        .from(kdpMetadata)
        .where(eq(kdpMetadata.projectId, projectId))
        .orderBy(desc(kdpMetadata.updatedAt))
        .limit(1),
      db
        .select({ id: coverDesigns.id })
        .from(coverDesigns)
        .where(and(eq(coverDesigns.projectId, projectId), eq(coverDesigns.isSelected, true)))
        .limit(1),
      db
        .select({ id: bookBlurbs.id })
        .from(bookBlurbs)
        .where(and(eq(bookBlurbs.projectId, projectId), eq(bookBlurbs.isActive, true)))
        .limit(1),
      db
        .select({
          amount: revenueEntries.amount,
          source: revenueEntries.source,
          transactionDate: revenueEntries.transactionDate,
          metadata: revenueEntries.metadata,
        })
        .from(revenueEntries)
        .where(eq(revenueEntries.projectId, projectId)),
    ]);

    const project = projectRow[0];
    const kdp = kdpRow[0];

    const keywordCount = (kdp?.keywords?.length ?? 0) as number;
    const categoryCount = (kdp?.categories?.length ?? 0) as number;

    const readiness = computePublishingReadiness({
      currentWordCount: project?.currentWordCount ?? null,
      targetWordCount: project?.targetWordCount ?? null,
      publicationStatus: (project?.publicationStatus as any) ?? null,
      hasSelectedCover: coverRow.length > 0,
      hasActiveBlurb: blurbRow.length > 0,
      keywordCount,
      categoryCount,
      hasPrice: typeof kdp?.price === 'number',
      hasPublicationDate: !!kdp?.publicationDate,
    });

    const promotion = computePromotionAttribution(
      revenueRows.map((r) => ({
        amount: Number(r.amount) || 0,
        source: r.source,
        transactionDate: r.transactionDate ?? new Date(),
        metadata: r.metadata,
      }))
    );

    return {
      readiness,
      kdp: {
        hasMetadata: !!kdp,
        asin: kdp?.asin ?? null,
        kdpStatus: kdp?.kdpStatus ?? null,
        lastSynced: kdp?.lastSynced ? kdp.lastSynced.toISOString() : null,
        publicationDate: kdp?.publicationDate ? kdp.publicationDate.toISOString() : null,
        priceCents: typeof kdp?.price === 'number' ? kdp.price : null,
        royaltyRate: typeof kdp?.royaltyRate === 'number' ? kdp.royaltyRate : null,
        keywordCount,
        categoryCount,
      },
      promotion: {
        byChannel: promotion.byChannel.map((r) => ({
          channel: r.key,
          revenueCents: r.revenueCents,
          spendCents: r.spendCents,
          netCents: r.netCents,
          roas: r.roas,
          transactions: r.transactions,
        })),
        byCampaign: promotion.byCampaign.map((r) => ({
          campaign: r.key,
          revenueCents: r.revenueCents,
          spendCents: r.spendCents,
          netCents: r.netCents,
          roas: r.roas,
          transactions: r.transactions,
        })),
        timeline: promotion.timeline,
      },
    };
  }

  // Used by legacy romance routes; keep lightweight to avoid breaking builds.
  static async getRomanceAnalytics(_projectId: string, _userId: string) {
    return {
      genreBreakdown: [],
      tropeUsage: [],
      heatLevelDistribution: [],
      seriesMetrics: {
        totalSeries: 0,
        avgBooksPerSeries: 0,
        completionRate: 0,
      },
      marketPerformance: {
        bestsellers: 0,
        avgRating: 0,
        totalReviews: 0,
        readerEngagement: 0,
      },
      characterDynamics: [],
      seasonalTrends: [],
    };
  }

  static async logActivity(
    projectId: string,
    userId: string,
    action: string,
    entityType: string,
    entityId?: string,
    details?: any
  ) {
    await db.insert(activityLogs).values({
      projectId,
      userId,
      action,
      entityType,
      entityId,
      details,
    });
  }

  static async startWritingSession(
    projectId: string,
    userId: string,
    documentId?: string
  ) {
    const [session] = await db.insert(writingSessions).values({
      projectId,
      userId,
      documentId,
      sessionType: 'writing',
    }).returning();

    return session.id;
  }

  static async endWritingSession(
    sessionId: string,
    wordsWritten: number,
    duration: number
  ) {
    await db.update(writingSessions)
      .set({
        wordsWritten,
        duration,
        endTime: new Date(),
      })
      .where(eq(writingSessions.id, sessionId));
  }
}