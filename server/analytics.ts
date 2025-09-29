import { db } from './db';
import { 
  projects, 
  documents, 
  characters, 
  worldbuildingEntries, 
  timelineEvents,
  aiGenerations,
  writingSessions,
  activityLogs,
  projectCollaborators,
  users
} from '@shared/schema';
import { sql, and, eq, gte, desc, count, sum, avg } from 'drizzle-orm';

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
  };
  aiUsage: {
    totalGenerations: number;
    byPersona: Array<{ persona: string; count: number }>;
    recent: Array<{
      id: string;
      persona: string;
      prompt: string;
      createdAt: string;
    }>;
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

    const [overview, writingProgress, aiUsage, collaboration, productivity] = await Promise.all([
      this.getOverviewMetrics(projectId),
      this.getWritingProgressMetrics(projectId),
      this.getAiUsageMetrics(projectId),
      this.getCollaborationMetrics(projectId),
      this.getProductivityMetrics(projectId),
    ]);

    return {
      overview,
      writingProgress,
      aiUsage,
      collaboration,
      productivity,
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
    };
  }

  private static async getAiUsageMetrics(projectId: string) {
    const [totalCount, byPersona, recent] = await Promise.all([
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
      })
        .from(aiGenerations)
        .where(eq(aiGenerations.projectId, projectId))
        .orderBy(desc(aiGenerations.createdAt))
        .limit(10),
    ]);

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
      })),
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