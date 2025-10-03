import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  FileText,
  Users,
  Globe,
  Clock,
  UserPlus,
  UserMinus,
  Pencil,
  Trash2,
  Plus
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Activity {
  id: string;
  type: string;
  description: string;
  entityType?: string | null;
  entityId?: string | null;
  entityName?: string | null;
  createdAt: string;
  userId: string;
  metadata?: any;
}

interface ActivityFeedProps {
  projectId?: string; // If provided, shows project-specific activities
  limit?: number;
  className?: string;
}

export function ActivityFeed({ projectId, limit = 20, className = "" }: ActivityFeedProps) {
  // Fetch activities - either for specific project or all user activities
  const endpoint = projectId 
    ? `/api/projects/${projectId}/activities?limit=${limit}`
    : `/api/activities?limit=${limit}`;
    
  const { data: activities = [], isLoading } = useQuery<Activity[]>({
    queryKey: [endpoint],
    refetchInterval: 60000, // Refetch every minute
  });

  // Get icon based on activity type
  const getActivityIcon = (type: string) => {
    if (type.includes("document")) return <FileText className="h-4 w-4" />;
    if (type.includes("character")) return <Users className="h-4 w-4" />;
    if (type.includes("worldbuilding")) return <Globe className="h-4 w-4" />;
    if (type.includes("timeline")) return <Clock className="h-4 w-4" />;
    if (type.includes("collaborator_added")) return <UserPlus className="h-4 w-4" />;
    if (type.includes("collaborator_removed")) return <UserMinus className="h-4 w-4" />;
    return <Pencil className="h-4 w-4" />;
  };

  // Get color based on activity type
  const getActivityColor = (type: string) => {
    if (type.includes("created")) return "text-green-600 dark:text-green-400";
    if (type.includes("updated")) return "text-blue-600 dark:text-blue-400";
    if (type.includes("deleted")) return "text-red-600 dark:text-red-400";
    if (type.includes("collaborator")) return "text-purple-600 dark:text-purple-400";
    return "text-gray-600 dark:text-gray-400";
  };

  if (isLoading) {
    return (
      <Card className={className} data-testid="card-activity-feed">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Loading activities...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className={className} data-testid="card-activity-feed">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>
          {projectId ? "Project activity timeline" : "Your recent activity across all projects"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          {activities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground" data-testid="text-no-activities">
              No recent activity
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex gap-4 pb-4 border-b last:border-0"
                  data-testid={`activity-item-${activity.id}`}
                >
                  <div className={`mt-1 ${getActivityColor(activity.type)}`}>
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {activity.description}
                    </p>
                    {activity.entityName && (
                      <p className="text-sm text-muted-foreground">
                        {activity.entityName}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
