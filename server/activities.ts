import { DatabaseStorage } from "./storage";
import { InsertActivity } from "@shared/schema";

export async function logActivity(
  storage: DatabaseStorage,
  projectId: string,
  userId: string,
  activity: Omit<InsertActivity, "projectId" | "userId">
) {
  try {
    await storage.createActivity({
      ...activity,
      projectId,
      userId,
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
}

export function getUserDisplayName(user: { firstName?: string | null; lastName?: string | null; email?: string | null } | undefined): string {
  if (!user) {
    return 'A user';
  }
  if (user.firstName || user.lastName) {
    return `${user.firstName || ''} ${user.lastName || ''}`.trim();
  }
  return user.email || 'A user';
}
