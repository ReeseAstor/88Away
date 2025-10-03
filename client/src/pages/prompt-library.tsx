import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Search, 
  Star, 
  Sparkles, 
  PenTool, 
  Target, 
  TrendingUp
} from "lucide-react";
import { useLocation } from "wouter";
import { useAiModalStore } from "@/stores/ai-modal-store";
import type { Prompt } from "@shared/schema";

export default function PromptLibraryPage() {
  const [, navigate] = useLocation();
  const { openWithPrompt } = useAiModalStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [persona, setPersona] = useState("all");
  const [targetRole, setTargetRole] = useState("all");
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch prompts based on filters
  const { data: allPrompts = [], isLoading } = useQuery<Prompt[]>({
    queryKey: debouncedQuery ? [`/api/prompts/search?q=${debouncedQuery}`] : ["/api/prompts"],
  });

  // Fetch user favorites
  const { data: favoritePrompts = [] } = useQuery<Prompt[]>({
    queryKey: ["/api/user/favorite-prompts"],
  });

  const favoriteIds = new Set(favoritePrompts.map(p => p.id));

  // Filter prompts client-side
  const filteredPrompts = allPrompts.filter(prompt => {
    if (category !== "all" && prompt.category !== category) return false;
    if (persona !== "all" && prompt.persona !== persona && prompt.persona !== "any") return false;
    if (targetRole !== "all" && prompt.targetRole !== targetRole && prompt.targetRole !== "all") return false;
    if (featuredOnly && !prompt.isFeatured) return false;
    if (favoritesOnly && !favoriteIds.has(prompt.id)) return false;
    return true;
  });

  // Toggle favorite mutation
  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({ promptId, isFavorited }: { promptId: number; isFavorited: boolean }) => {
      if (isFavorited) {
        await apiRequest("DELETE", `/api/user/favorite-prompts/${promptId}`);
      } else {
        await apiRequest("POST", `/api/user/favorite-prompts/${promptId}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/favorite-prompts"] });
    },
  });

  // Use prompt mutation (track usage and navigate to AI)
  const usePromptMutation = useMutation({
    mutationFn: async (promptId: number) => {
      await apiRequest("POST", `/api/prompts/${promptId}/use`);
    },
  });

  const handleUsePrompt = (prompt: Prompt) => {
    usePromptMutation.mutate(prompt.id);
    
    const persona = prompt.persona === "any" ? "muse" : prompt.persona as "muse" | "editor" | "coach";
    
    openWithPrompt({
      persona,
      prompt: prompt.content
    });
    
    navigate("/");
  };

  const getPersonaIcon = (persona: string) => {
    switch (persona) {
      case "muse": return <Sparkles className="h-4 w-4" />;
      case "editor": return <PenTool className="h-4 w-4" />;
      case "coach": return <Target className="h-4 w-4" />;
      default: return null;
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Prompt Library</h1>
        <p className="text-muted-foreground">
          1000+ Expert Writing Prompts for Writers, Editors & Publishers
        </p>
      </div>

      {/* Search */}
      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search prompts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
          data-testid="input-search-prompts"
        />
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger data-testid="select-category">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="Character Development">Character Development</SelectItem>
            <SelectItem value="Plot & Story Structure">Plot & Story</SelectItem>
            <SelectItem value="Dialogue & Voice">Dialogue</SelectItem>
            <SelectItem value="Scene Writing & Description">Scene Writing</SelectItem>
            <SelectItem value="Worldbuilding">Worldbuilding</SelectItem>
            <SelectItem value="Editing & Revision">Editing</SelectItem>
            <SelectItem value="Genre-Specific">Genre-Specific</SelectItem>
            <SelectItem value="Ghostwriting">Ghostwriting</SelectItem>
            <SelectItem value="Self-Publishing & Marketing">Marketing</SelectItem>
            <SelectItem value="Publishing Prep">Publishing Prep</SelectItem>
          </SelectContent>
        </Select>

        <Select value={persona} onValueChange={setPersona}>
          <SelectTrigger data-testid="select-persona">
            <SelectValue placeholder="AI Persona" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Personas</SelectItem>
            <SelectItem value="muse">Muse (Creative)</SelectItem>
            <SelectItem value="editor">Editor (Polish)</SelectItem>
            <SelectItem value="coach">Coach (Planning)</SelectItem>
          </SelectContent>
        </Select>

        <Select value={targetRole} onValueChange={setTargetRole}>
          <SelectTrigger data-testid="select-role">
            <SelectValue placeholder="Target Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="writer">Writer</SelectItem>
            <SelectItem value="ghostwriter">Ghostwriter</SelectItem>
            <SelectItem value="editor">Editor</SelectItem>
            <SelectItem value="publisher">Publisher</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center space-x-2">
          <Switch
            id="featured"
            checked={featuredOnly}
            onCheckedChange={setFeaturedOnly}
            data-testid="switch-featured"
          />
          <Label htmlFor="featured">Featured Only</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="favorites"
            checked={favoritesOnly}
            onCheckedChange={setFavoritesOnly}
            data-testid="switch-favorites"
          />
          <Label htmlFor="favorites">My Favorites</Label>
        </div>
      </div>

      {/* Results count */}
      <div className="mb-4 text-sm text-muted-foreground">
        Showing {filteredPrompts.length} prompts
      </div>

      {/* Prompts grid */}
      {isLoading ? (
        <div className="text-center py-12">Loading prompts...</div>
      ) : filteredPrompts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No prompts found matching your criteria</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPrompts.map((prompt) => (
            <Card key={prompt.id} data-testid={`prompt-card-${prompt.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getPersonaIcon(prompt.persona)}
                    <Badge variant="outline">{prompt.category}</Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleFavoriteMutation.mutate({
                      promptId: prompt.id,
                      isFavorited: favoriteIds.has(prompt.id)
                    })}
                    data-testid={`button-favorite-${prompt.id}`}
                  >
                    <Star className={`h-4 w-4 ${favoriteIds.has(prompt.id) ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                  </Button>
                </div>
                <CardTitle className="text-base">{prompt.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                  {prompt.content}
                </p>
                {prompt.tags && prompt.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {prompt.tags.slice(0, 3).map((tag, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    {prompt.usageCount || 0} uses
                  </span>
                  <Button
                    size="sm"
                    onClick={() => handleUsePrompt(prompt)}
                    data-testid={`button-use-prompt-${prompt.id}`}
                  >
                    Use This Prompt
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
