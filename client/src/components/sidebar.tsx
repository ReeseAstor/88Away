import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Globe,
  Clock,
  Bot,
  Settings,
  CreditCard,
  LogOut,
  Menu,
  Plus,
  Edit3
} from "lucide-react";

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  currentPath: string;
}

interface ToolItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  current: boolean;
  disabled?: boolean;
  onClick?: boolean;
}

export default function Sidebar({ collapsed, onToggleCollapse, currentPath }: SidebarProps) {
  const { user } = useAuth();
  const [location] = useLocation();

  const navigation = [
    {
      name: "Dashboard",
      href: "/",
      icon: LayoutDashboard,
      current: location === "/"
    }
  ];

  // Extract project ID from current path if we're in a project
  const projectMatch = currentPath.match(/^\/projects\/([^\/]+)/);
  const currentProjectId = projectMatch ? projectMatch[1] : null;

  const tools: ToolItem[] = currentProjectId ? [
    {
      name: "Characters",
      href: `/projects/${currentProjectId}/characters`,
      icon: Users,
      current: location.startsWith(`/projects/${currentProjectId}/characters`)
    },
    {
      name: "World Building",
      href: `/projects/${currentProjectId}/worldbuilding`,
      icon: Globe,
      current: location.startsWith(`/projects/${currentProjectId}/worldbuilding`)
    },
    {
      name: "Timeline",
      href: `/projects/${currentProjectId}/timeline`,
      icon: Clock,
      current: location.startsWith(`/projects/${currentProjectId}/timeline`)
    },
    {
      name: "AI Assistant",
      href: "#",
      icon: Bot,
      current: false,
      onClick: true // This will be handled differently
    }
  ] : [
    {
      name: "Characters",
      href: "/characters",
      icon: Users,
      current: location.startsWith("/characters"),
      disabled: true
    },
    {
      name: "World Building",
      href: "/worldbuilding",
      icon: Globe,
      current: location.startsWith("/worldbuilding"),
      disabled: true
    },
    {
      name: "Timeline",
      href: "/timeline",
      icon: Clock,
      current: location.startsWith("/timeline"),
      disabled: true
    },
    {
      name: "AI Assistant",
      href: "/ai",
      icon: Bot,
      current: location.startsWith("/ai"),
      disabled: true
    }
  ];

  const getUserInitials = () => {
    if (!user) return "?";
    const firstName = user.firstName || "";
    const lastName = user.lastName || "";
    return (firstName[0] || "") + (lastName[0] || "");
  };

  const getUserName = () => {
    if (!user) return "Guest";
    return `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email || "User";
  };

  return (
    <aside 
      className={cn(
        "bg-primary text-primary-foreground flex flex-col transition-all duration-300 ease-in-out border-r border-secondary/20",
        collapsed ? "w-16" : "w-64"
      )}
      data-testid="sidebar"
    >
      {/* Sidebar Header */}
      <div className="p-4 border-b border-secondary/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
              <Edit3 className="h-4 w-4 text-accent-foreground" />
            </div>
            {!collapsed && (
              <div>
                <h1 className="text-lg font-semibold">WriteCraft Pro</h1>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            className="p-1 h-8 w-8 hover:bg-secondary/20 text-primary-foreground"
            data-testid="button-toggle-sidebar"
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* User Profile */}
      <div className="p-4 border-b border-secondary/20">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10" data-testid="avatar-user">
            <AvatarImage src={user?.profileImageUrl || undefined} />
            <AvatarFallback className="bg-accent text-accent-foreground">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" data-testid="text-user-name">
                {getUserName()}
              </p>
              <div className="flex items-center space-x-2">
                <Badge 
                  variant="secondary" 
                  className="text-xs bg-chart-1/20 text-chart-1 border-chart-1/30"
                  data-testid="badge-user-plan"
                >
                  Pro Plan
                </Badge>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <div className="space-y-1">
          {navigation.map((item) => (
            <Link key={item.name} href={item.href}>
              <div
                className={cn(
                  "flex items-center px-3 py-2 rounded-lg transition-colors group",
                  item.current
                    ? "bg-accent/20 text-accent-foreground"
                    : "hover:bg-secondary/20"
                )}
                data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {!collapsed && (
                  <span className="ml-3 text-sm font-medium">{item.name}</span>
                )}
              </div>
            </Link>
          ))}

          {!collapsed && (
            <div className="pt-4">
              <h3 className="text-xs font-semibold text-primary-foreground/70 uppercase tracking-wider mb-2 px-3">
                Projects
              </h3>
              <div className="space-y-1">
                <div className="flex items-center px-3 py-2 hover:bg-secondary/20 rounded-lg transition-colors">
                  <BookOpen className="h-4 w-4" />
                  <span className="ml-3 text-sm">No projects yet</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start px-3 py-2 h-auto font-normal hover:bg-secondary/20"
                  data-testid="button-sidebar-new-project"
                >
                  <Plus className="h-4 w-4" />
                  <span className="ml-3 text-sm">New Project</span>
                </Button>
              </div>
            </div>
          )}

          {!collapsed && (
            <div className="pt-4">
              <h3 className="text-xs font-semibold text-primary-foreground/70 uppercase tracking-wider mb-2 px-3">
                Tools
              </h3>
              <div className="space-y-1">
                {tools.map((item) => {
                  if (item.disabled) {
                    return (
                      <div
                        key={item.name}
                        className="flex items-center px-3 py-2 rounded-lg opacity-50 cursor-not-allowed"
                        data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        <item.icon className="h-4 w-4" />
                        <span className="ml-3 text-sm">{item.name}</span>
                      </div>
                    );
                  }
                  
                  return (
                    <Link key={item.name} href={item.href}>
                      <div
                        className={cn(
                          "flex items-center px-3 py-2 rounded-lg transition-colors",
                          item.current
                            ? "bg-accent/20 text-accent-foreground"
                            : "hover:bg-secondary/20"
                        )}
                        data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        <item.icon className="h-4 w-4" />
                        <span className="ml-3 text-sm">{item.name}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-secondary/20 space-y-2">
        <Link href="/settings">
          <div className="flex items-center px-3 py-2 hover:bg-secondary/20 rounded-lg transition-colors">
            <Settings className="h-4 w-4" />
            {!collapsed && <span className="ml-3 text-sm">Settings</span>}
          </div>
        </Link>
        <Link href="/subscription">
          <div className="flex items-center px-3 py-2 hover:bg-secondary/20 rounded-lg transition-colors">
            <CreditCard className="h-4 w-4" />
            {!collapsed && <span className="ml-3 text-sm">Billing</span>}
          </div>
        </Link>
        <a href="/api/logout">
          <div 
            className="flex items-center px-3 py-2 hover:bg-secondary/20 rounded-lg transition-colors"
            data-testid="button-sign-out"
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span className="ml-3 text-sm">Sign Out</span>}
          </div>
        </a>
      </div>
    </aside>
  );
}
