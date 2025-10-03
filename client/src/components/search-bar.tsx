import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { 
  Search, 
  FileText, 
  Users, 
  Globe, 
  Clock,
  ArrowRight
} from "lucide-react";
import { SearchResult } from "@shared/schema";

export function SearchBar() {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [, navigate] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch search results
  const { data: results = [], isLoading } = useQuery<SearchResult[]>({
    queryKey: [`/api/search?q=${debouncedQuery}&limit=5`],
    enabled: debouncedQuery.length >= 2,
  });

  // Get icon based on result type
  const getIcon = (type: string) => {
    switch (type) {
      case "document":
        return <FileText className="h-4 w-4" />;
      case "character":
        return <Users className="h-4 w-4" />;
      case "worldbuilding":
        return <Globe className="h-4 w-4" />;
      case "timeline":
        return <Clock className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  // Navigate to result
  const handleSelect = (result: SearchResult) => {
    setOpen(false);
    setSearchQuery("");
    
    // Navigate based on result type
    switch (result.type) {
      case "document":
        navigate(`/projects/${result.projectId}/documents/${result.id}`);
        break;
      case "character":
        navigate(`/projects/${result.projectId}?tab=characters`);
        break;
      case "worldbuilding":
        navigate(`/projects/${result.projectId}?tab=worldbuilding`);
        break;
      case "timeline":
        navigate(`/projects/${result.projectId}?tab=timeline`);
        break;
    }
  };

  // Navigate to full search results
  const handleViewAll = () => {
    setOpen(false);
    navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
  };

  // Keyboard shortcuts (Cmd/Ctrl+K)
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <div className="relative w-full max-w-sm" data-testid="search-bar-container">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        ref={inputRef}
        type="text"
        placeholder="Search... (⌘K)"
        value={searchQuery}
        onChange={(e) => {
          setSearchQuery(e.target.value);
          setOpen(e.target.value.length >= 2);
        }}
        onFocus={() => searchQuery.length >= 2 && setOpen(true)}
        className="pl-9 pr-4"
        data-testid="input-search"
      />
      
      {open && searchQuery.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-popover border rounded-md shadow-lg">
          <Command>
            <CommandList>
              {isLoading && (
                <CommandEmpty>Searching...</CommandEmpty>
              )}
              {!isLoading && results.length === 0 && (
                <CommandEmpty data-testid="text-no-results">No results found</CommandEmpty>
              )}
              {!isLoading && results.length > 0 && (
                <>
                  <CommandGroup heading="Quick Results">
                    {results.map((result) => (
                      <CommandItem
                        key={`${result.type}-${result.id}`}
                        onSelect={() => handleSelect(result)}
                        className="cursor-pointer"
                        data-testid={`search-result-${result.id}`}
                      >
                        <div className="flex items-center gap-3 w-full">
                          {getIcon(result.type)}
                          <div className="flex-1 overflow-hidden">
                            <div className="font-medium truncate">{result.title}</div>
                            <div className="text-xs text-muted-foreground truncate">
                              {result.projectTitle}
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground capitalize">
                            {result.type}
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  <div className="border-t">
                    <CommandItem
                      onSelect={handleViewAll}
                      className="cursor-pointer justify-center text-sm text-primary"
                      data-testid="button-view-all-results"
                    >
                      <span>View all results</span>
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </CommandItem>
                  </div>
                </>
              )}
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  );
}
