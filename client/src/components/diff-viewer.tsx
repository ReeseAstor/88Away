import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  FileText,
  Plus,
  Minus,
  GitBranch,
  ArrowLeftRight,
  ChevronUp,
  ChevronDown,
  Eye,
  Layers,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { format } from "date-fns";

interface DiffLine {
  lineNumber: number;
  content: string;
  type: 'added' | 'removed' | 'unchanged' | 'modified';
  oldLineNumber?: number;
  newLineNumber?: number;
}

interface DiffSection {
  startLine: number;
  endLine: number;
  title: string;
  changes: DiffLine[];
  summary: {
    additions: number;
    deletions: number;
    modifications: number;
  };
}

interface Version {
  id: string;
  branchId: string;
  branchName: string;
  versionNumber: number;
  message: string;
  content: string;
  wordCount: number;
  authorName: string;
  createdAt: Date;
}

interface DiffViewerProps {
  leftVersion: Version;
  rightVersion: Version;
  onClose?: () => void;
  viewMode?: 'side-by-side' | 'unified' | 'inline';
}

export default function DiffViewer({
  leftVersion,
  rightVersion,
  onClose,
  viewMode: initialViewMode = 'side-by-side'
}: DiffViewerProps) {
  const [viewMode, setViewMode] = useState<'side-by-side' | 'unified' | 'inline'>(initialViewMode);
  const [currentChangeIndex, setCurrentChangeIndex] = useState(0);
  const [showOnlyChanges, setShowOnlyChanges] = useState(false);

  // Generate diff data
  const diffData = useMemo(() => {
    const leftLines = leftVersion.content.split('\n');
    const rightLines = rightVersion.content.split('\n');
    const sections: DiffSection[] = [];
    let currentSection: DiffSection | null = null;
    
    const maxLines = Math.max(leftLines.length, rightLines.length);
    const allChanges: number[] = [];
    
    for (let i = 0; i < maxLines; i++) {
      const leftLine = leftLines[i] || '';
      const rightLine = rightLines[i] || '';
      const isChanged = leftLine !== rightLine;
      
      if (isChanged) {
        allChanges.push(i);
        
        if (!currentSection) {
          currentSection = {
            startLine: i,
            endLine: i,
            title: `Lines ${i + 1}`,
            changes: [],
            summary: { additions: 0, deletions: 0, modifications: 0 }
          };
        }
        
        let changeType: DiffLine['type'] = 'unchanged';
        if (!leftLine && rightLine) {
          changeType = 'added';
          currentSection.summary.additions++;
        } else if (leftLine && !rightLine) {
          changeType = 'removed';
          currentSection.summary.deletions++;
        } else {
          changeType = 'modified';
          currentSection.summary.modifications++;
        }
        
        currentSection.changes.push({
          lineNumber: i + 1,
          content: rightLine || leftLine,
          type: changeType,
          oldLineNumber: leftLine ? i + 1 : undefined,
          newLineNumber: rightLine ? i + 1 : undefined
        });
        
        currentSection.endLine = i;
      } else if (currentSection) {
        // End current section
        currentSection.title = `Lines ${currentSection.startLine + 1}-${currentSection.endLine + 1}`;
        sections.push(currentSection);
        currentSection = null;
      }
      
      if (!isChanged && !showOnlyChanges) {
        sections.push({
          startLine: i,
          endLine: i,
          title: `Line ${i + 1}`,
          changes: [{
            lineNumber: i + 1,
            content: leftLine,
            type: 'unchanged',
            oldLineNumber: i + 1,
            newLineNumber: i + 1
          }],
          summary: { additions: 0, deletions: 0, modifications: 0 }
        });
      }
    }
    
    if (currentSection) {
      currentSection.title = `Lines ${currentSection.startLine + 1}-${currentSection.endLine + 1}`;
      sections.push(currentSection);
    }
    
    const totalChanges = {
      additions: sections.reduce((sum, s) => sum + s.summary.additions, 0),
      deletions: sections.reduce((sum, s) => sum + s.summary.deletions, 0),
      modifications: sections.reduce((sum, s) => sum + s.summary.modifications, 0)
    };
    
    return {
      sections,
      totalChanges,
      changeIndices: allChanges,
      leftLines,
      rightLines
    };
  }, [leftVersion.content, rightVersion.content, showOnlyChanges]);

  const navigateToChange = (direction: 'next' | 'prev') => {
    const { changeIndices } = diffData;
    if (changeIndices.length === 0) return;
    
    if (direction === 'next') {
      setCurrentChangeIndex((prev) => (prev + 1) % changeIndices.length);
    } else {
      setCurrentChangeIndex((prev) => (prev - 1 + changeIndices.length) % changeIndices.length);
    }
  };

  const getLineClass = (type: DiffLine['type']) => {
    switch (type) {
      case 'added':
        return 'bg-green-50 dark:bg-green-950 text-green-900 dark:text-green-100';
      case 'removed':
        return 'bg-red-50 dark:bg-red-950 text-red-900 dark:text-red-100';
      case 'modified':
        return 'bg-yellow-50 dark:bg-yellow-950 text-yellow-900 dark:text-yellow-100';
      default:
        return '';
    }
  };

  const renderSideBySide = () => (
    <div className="grid grid-cols-2 divide-x">
      <div className="flex flex-col">
        <div className="p-3 bg-muted/50 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <GitBranch className="h-4 w-4" />
              <span className="font-medium">{leftVersion.branchName}</span>
              <Badge variant="outline">v{leftVersion.versionNumber}</Badge>
            </div>
            <span className="text-xs text-muted-foreground">
              {format(new Date(leftVersion.createdAt), 'MMM d, HH:mm')}
            </span>
          </div>
        </div>
        <ScrollArea className="h-[500px]">
          <div className="font-mono text-sm">
            {diffData.leftLines.map((line, index) => {
              const rightLine = diffData.rightLines[index];
              const isChanged = line !== rightLine;
              return (
                <div
                  key={index}
                  className={`px-3 py-1 ${isChanged ? (line && !rightLine ? getLineClass('removed') : line ? getLineClass('modified') : '') : ''}`}
                  data-testid={`left-line-${index}`}
                >
                  <span className="text-muted-foreground mr-3 select-none">
                    {index + 1}
                  </span>
                  {line || '\u00A0'}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>
      
      <div className="flex flex-col">
        <div className="p-3 bg-muted/50 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <GitBranch className="h-4 w-4" />
              <span className="font-medium">{rightVersion.branchName}</span>
              <Badge variant="outline">v{rightVersion.versionNumber}</Badge>
            </div>
            <span className="text-xs text-muted-foreground">
              {format(new Date(rightVersion.createdAt), 'MMM d, HH:mm')}
            </span>
          </div>
        </div>
        <ScrollArea className="h-[500px]">
          <div className="font-mono text-sm">
            {diffData.rightLines.map((line, index) => {
              const leftLine = diffData.leftLines[index];
              const isChanged = line !== leftLine;
              return (
                <div
                  key={index}
                  className={`px-3 py-1 ${isChanged ? (line && !leftLine ? getLineClass('added') : line ? getLineClass('modified') : '') : ''}`}
                  data-testid={`right-line-${index}`}
                >
                  <span className="text-muted-foreground mr-3 select-none">
                    {index + 1}
                  </span>
                  {line || '\u00A0'}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </div>
  );

  const renderUnified = () => (
    <ScrollArea className="h-[600px]">
      <div className="font-mono text-sm">
        {diffData.sections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="mb-2">
            {section.changes.map((change, changeIndex) => (
              <div
                key={changeIndex}
                className={`px-3 py-1 ${getLineClass(change.type)}`}
                data-testid={`unified-line-${sectionIndex}-${changeIndex}`}
              >
                <span className="text-muted-foreground mr-3 select-none">
                  {change.type === 'added' && '+'} 
                  {change.type === 'removed' && '-'}
                  {change.type === 'modified' && '~'}
                  {change.type === 'unchanged' && ' '}
                </span>
                <span className="text-muted-foreground mr-3 select-none">
                  {change.lineNumber}
                </span>
                {change.content || '\u00A0'}
              </div>
            ))}
          </div>
        ))}
      </div>
    </ScrollArea>
  );

  const hasChanges = diffData.totalChanges.additions > 0 || 
                    diffData.totalChanges.deletions > 0 || 
                    diffData.totalChanges.modifications > 0;

  return (
    <Card className="h-full flex flex-col" data-testid="diff-viewer">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <ArrowLeftRight className="h-5 w-5 mr-2" />
              Version Comparison
            </CardTitle>
            <CardDescription>
              Comparing changes between versions
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            {hasChanges ? (
              <div className="flex items-center space-x-4 text-sm">
                <Badge variant="outline" className="text-green-600">
                  <Plus className="h-3 w-3 mr-1" />
                  {diffData.totalChanges.additions}
                </Badge>
                <Badge variant="outline" className="text-red-600">
                  <Minus className="h-3 w-3 mr-1" />
                  {diffData.totalChanges.deletions}
                </Badge>
                <Badge variant="outline" className="text-yellow-600">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {diffData.totalChanges.modifications}
                </Badge>
              </div>
            ) : (
              <Badge variant="secondary" className="text-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                No Changes
              </Badge>
            )}
            {onClose && (
              <Button size="sm" variant="ghost" onClick={onClose}>
                Close
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <div className="p-4 border-b bg-muted/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Select value={viewMode} onValueChange={(value) => setViewMode(value as any)}>
              <SelectTrigger className="w-40" data-testid="select-view-mode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="side-by-side">
                  <div className="flex items-center">
                    <Layers className="h-4 w-4 mr-2" />
                    Side by Side
                  </div>
                </SelectItem>
                <SelectItem value="unified">
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    Unified
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              size="sm"
              variant={showOnlyChanges ? "default" : "outline"}
              onClick={() => setShowOnlyChanges(!showOnlyChanges)}
            >
              <Eye className="h-4 w-4 mr-1" />
              {showOnlyChanges ? 'Show All' : 'Changes Only'}
            </Button>
          </div>
          
          {diffData.changeIndices.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">
                Change {currentChangeIndex + 1} of {diffData.changeIndices.length}
              </span>
              <div className="flex items-center space-x-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigateToChange('prev')}
                        data-testid="button-prev-change"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Previous Change</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigateToChange('next')}
                        data-testid="button-next-change"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Next Change</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          )}
        </div>
      </div>

      <CardContent className="flex-1 p-0">
        {viewMode === 'side-by-side' && renderSideBySide()}
        {viewMode === 'unified' && renderUnified()}
      </CardContent>
    </Card>
  );
}