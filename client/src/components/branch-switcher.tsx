import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { GitBranch, Plus, Check, Clock, User } from "lucide-react";
import { useStore } from "@/lib/store";
import { format } from "date-fns";

interface Branch {
  id: string;
  name: string;
  description?: string;
  parentBranchId?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  isDefault?: boolean;
  lastCommitMessage?: string;
}

interface BranchSwitcherProps {
  branches: Branch[];
  currentBranch: Branch | null;
  onSwitchBranch: (branchId: string) => void;
  onCreateBranch: () => void;
  disabled?: boolean;
  userRole?: string | null;
}

export default function BranchSwitcher({
  branches,
  currentBranch,
  onSwitchBranch,
  onCreateBranch,
  disabled = false,
  userRole
}: BranchSwitcherProps) {
  const { setCurrentBranch } = useStore();
  const canCreateBranch = userRole && ['owner', 'editor'].includes(userRole);

  const handleSwitchBranch = (branchId: string) => {
    setCurrentBranch(branchId);
    onSwitchBranch(branchId);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          data-testid="branch-switcher"
          className="flex items-center space-x-2"
        >
          <GitBranch className="h-4 w-4" />
          <span>{currentBranch?.name || 'main'}</span>
          {currentBranch?.isDefault && (
            <Badge variant="secondary" className="ml-1 text-xs">
              Default
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="flex items-center justify-between">
          Branches
          {canCreateBranch && (
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onCreateBranch();
              }}
              data-testid="button-create-branch"
              className="h-6 px-2"
            >
              <Plus className="h-3 w-3 mr-1" />
              New
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {branches.map((branch) => (
          <DropdownMenuItem
            key={branch.id}
            onClick={() => handleSwitchBranch(branch.id)}
            className="flex flex-col items-start space-y-1 py-2 cursor-pointer"
            data-testid={`branch-item-${branch.id}`}
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-2">
                {currentBranch?.id === branch.id && (
                  <Check className="h-3 w-3 text-primary" />
                )}
                <span className="font-medium">{branch.name}</span>
                {branch.isDefault && (
                  <Badge variant="outline" className="text-xs px-1 py-0">
                    Default
                  </Badge>
                )}
              </div>
            </div>
            {branch.description && (
              <span className="text-xs text-muted-foreground ml-5 line-clamp-1">
                {branch.description}
              </span>
            )}
            <div className="flex items-center space-x-3 text-xs text-muted-foreground ml-5">
              <span className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>{format(new Date(branch.updatedAt), 'MMM d')}</span>
              </span>
              <span className="flex items-center space-x-1">
                <User className="h-3 w-3" />
                <span>{branch.createdBy}</span>
              </span>
            </div>
            {branch.lastCommitMessage && (
              <span className="text-xs text-muted-foreground ml-5 italic line-clamp-1">
                "{branch.lastCommitMessage}"
              </span>
            )}
          </DropdownMenuItem>
        ))}
        {branches.length === 0 && (
          <DropdownMenuItem disabled>
            <span className="text-muted-foreground">No branches available</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}