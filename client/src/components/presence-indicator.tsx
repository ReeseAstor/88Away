import { useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { 
  Users, 
  Circle, 
  Edit3, 
  Eye, 
  MessageCircle,
  UserCheck
} from "lucide-react";
import type { User, CollaborationPresence } from '@shared/schema';

interface PresenceIndicatorProps {
  onlineUsers: Map<number, any>;
  currentUser?: User | null;
  className?: string;
}

export default function PresenceIndicator({
  onlineUsers,
  currentUser,
  className = ""
}: PresenceIndicatorProps) {
  // Filter out current user and format presence data
  const otherUsers = useMemo(() => {
    const users: any[] = [];
    onlineUsers.forEach((state, clientId) => {
      if (state?.user && state.user.id !== currentUser?.id) {
        users.push({
          ...state.user,
          clientId,
          cursor: state.cursor,
        });
      }
    });
    return users;
  }, [onlineUsers, currentUser]);

  const getUserInitials = (user: any) => {
    if (user?.name) {
      const parts = user.name.split(' ');
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return user.name[0].toUpperCase();
    }
    return 'U';
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'default';
      case 'editor':
        return 'secondary';
      case 'reviewer':
        return 'outline';
      case 'reader':
        return 'ghost';
      default:
        return 'secondary';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <UserCheck className="h-3 w-3" />;
      case 'editor':
        return <Edit3 className="h-3 w-3" />;
      case 'reviewer':
        return <MessageCircle className="h-3 w-3" />;
      case 'reader':
        return <Eye className="h-3 w-3" />;
      default:
        return null;
    }
  };

  if (otherUsers.length === 0) {
    return (
      <div className={`flex items-center space-x-2 text-muted-foreground ${className}`} data-testid="presence-indicator-empty">
        <Users className="h-4 w-4" />
        <span className="text-sm">No one else online</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-3 ${className}`} data-testid="presence-indicator">
      <div className="flex items-center space-x-2">
        <Users className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">
          {otherUsers.length} {otherUsers.length === 1 ? 'person' : 'people'} online
        </span>
      </div>

      {/* Avatar Stack */}
      <div className="flex -space-x-2">
        {otherUsers.slice(0, 5).map((user, index) => (
          <HoverCard key={`user-${user.clientId || index}`}>
            <HoverCardTrigger>
              <div 
                className="relative"
                data-testid={`presence-avatar-${user.id}`}
              >
                <Avatar 
                  className="h-8 w-8 border-2 border-background"
                  style={{
                    borderColor: user.color || '#808080',
                    boxShadow: `0 0 0 2px ${user.color || '#808080'}20`
                  }}
                >
                  {user.profileImageUrl && (
                    <AvatarImage src={user.profileImageUrl} />
                  )}
                  <AvatarFallback
                    style={{ 
                      backgroundColor: `${user.color || '#808080'}20`,
                      color: user.color || '#808080'
                    }}
                  >
                    {getUserInitials(user)}
                  </AvatarFallback>
                </Avatar>
                
                {/* Online Status Indicator */}
                <div className="absolute -bottom-0.5 -right-0.5">
                  <Circle 
                    className="h-3 w-3 fill-green-500 text-green-500"
                    data-testid={`status-indicator-${user.id}`}
                  />
                </div>
              </div>
            </HoverCardTrigger>
            
            <HoverCardContent className="w-64" align="center">
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-10 w-10">
                      {user.profileImageUrl && (
                        <AvatarImage src={user.profileImageUrl} />
                      )}
                      <AvatarFallback>{getUserInitials(user)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{user.name}</p>
                      <div className="flex items-center space-x-1 mt-1">
                        <Circle className="h-2 w-2 fill-green-500 text-green-500" />
                        <span className="text-xs text-muted-foreground">Active now</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {user.role && (
                  <Badge 
                    variant={getRoleBadgeColor(user.role) as any}
                    className="capitalize"
                  >
                    {getRoleIcon(user.role)}
                    <span className="ml-1">{user.role}</span>
                  </Badge>
                )}
                
                {user.cursor && (
                  <div className="text-xs text-muted-foreground">
                    <span>Editing at position {user.cursor.from}</span>
                  </div>
                )}
              </div>
            </HoverCardContent>
          </HoverCard>
        ))}
        
        {otherUsers.length > 5 && (
          <div 
            className="flex h-8 w-8 items-center justify-center rounded-full bg-muted border-2 border-background"
            data-testid="presence-overflow-count"
          >
            <span className="text-xs font-medium">+{otherUsers.length - 5}</span>
          </div>
        )}
      </div>
    </div>
  );
}