import { DatabaseStorage } from "./storage";
import { InsertNotification } from "@shared/schema";

export async function notifyProjectCollaborators(
  storage: DatabaseStorage,
  projectId: string,
  actorId: string,
  notification: Omit<InsertNotification, "userId" | "projectId">
) {
  // Get project with collaborators
  const project = await storage.getProject(projectId);
  
  if (!project) {
    return;
  }
  
  // Get all collaborator user IDs
  const collaboratorIds = project.collaborators.map(c => c.userId);
  
  // Build list of recipients: owner + collaborators, excluding the actor
  const recipientIds = new Set<string>();
  
  // Add project owner if not the actor
  if (project.ownerId !== actorId) {
    recipientIds.add(project.ownerId);
  }
  
  // Add collaborators if not the actor
  collaboratorIds.forEach(id => {
    if (id !== actorId) {
      recipientIds.add(id);
    }
  });
  
  // Create notification for each recipient
  const promises = Array.from(recipientIds).map(userId =>
    storage.createNotification({
      ...notification,
      userId,
      projectId,
    })
  );
  
  await Promise.all(promises);
}
