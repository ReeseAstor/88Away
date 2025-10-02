import { useEffect, useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import Sidebar from "@/components/sidebar";
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  User,
  Heart,
  Star,
  Grid,
  List,
  Eye,
  Brain,
  X
} from "lucide-react";
import { Project, Character, type OnboardingProgress } from "@shared/schema";

function getRoleBadgeColor(role: string) {
  const colors = {
    protagonist: 'border-blue-500 text-blue-500',
    antagonist: 'border-red-500 text-red-500',
    supporting: 'border-green-500 text-green-500',
    minor: 'border-gray-500 text-gray-500',
    other: 'border-purple-500 text-purple-500',
  };
  return colors[role as keyof typeof colors] || '';
}

export default function Characters() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showCharacterModal, setShowCharacterModal] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<'name-asc' | 'name-desc' | 'newest' | 'oldest' | 'updated'>('name-asc');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('characterViewMode') as 'grid' | 'list') || 'grid';
    }
    return 'grid';
  });
  const [tagInput, setTagInput] = useState("");
  
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    background: string;
    personality: string;
    appearance: string;
    notes: string;
    role: Character["role"];
    importance: number;
    tags: string[];
  }>({
    name: "",
    description: "",
    background: "",
    personality: "",
    appearance: "",
    notes: "",
    role: null,
    importance: 3,
    tags: []
  });

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
    enabled: isAuthenticated,
    retry: false,
  });

  const { data: characters = [], isLoading: charactersLoading } = useQuery<Character[]>({
    queryKey: ['/api/characters'],
    enabled: isAuthenticated && projects.length > 0,
    queryFn: async () => {
      if (projects.length > 0) {
        const response = await fetch(`/api/projects/${projects[0].id}/characters`, {
          credentials: "include",
        });
        if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
        return response.json();
      }
      return [];
    },
    retry: false,
  });

  const { data: onboardingProgress } = useQuery<OnboardingProgress>({
    queryKey: ['/api/user/onboarding'],
    enabled: isAuthenticated,
    retry: false,
  });

  const updateOnboardingMutation = useMutation({
    mutationFn: async (progress: Partial<OnboardingProgress>) => {
      await apiRequest("PATCH", "/api/user/onboarding", progress);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/onboarding'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    },
  });

  const createCharacterMutation = useMutation({
    mutationFn: async (characterData: any) => {
      if (projects.length === 0) throw new Error("No project available");
      await apiRequest("POST", `/api/projects/${projects[0].id}/characters`, characterData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/characters'] });
      setShowCharacterModal(false);
      setFormData({
        name: "",
        description: "",
        background: "",
        personality: "",
        appearance: "",
        notes: "",
        role: null,
        importance: 3,
        tags: []
      });
      toast({
        title: "Success",
        description: "Character created successfully!",
      });
      
      if (user && !user.hasCompletedOnboarding && onboardingProgress && !onboardingProgress.steps.addCharacter) {
        updateOnboardingMutation.mutate({
          steps: { ...onboardingProgress.steps, addCharacter: true }
        });
      }
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create character. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateCharacterMutation = useMutation({
    mutationFn: async (data: { id: string; updates: any }) => {
      await apiRequest("PUT", `/api/characters/${data.id}`, data.updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/characters'] });
      setShowCharacterModal(false);
      setEditingCharacter(null);
      toast({
        title: "Success",
        description: "Character updated successfully!",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update character. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteCharacterMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/characters/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/characters'] });
      toast({
        title: "Success",
        description: "Character deleted successfully!",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to delete character. Please try again.",
        variant: "destructive",
      });
    },
  });

  const filteredAndSortedCharacters = useMemo(() => {
    let result = characters.filter((char: Character) => 
      char.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      char.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    if (roleFilter !== 'all') {
      result = result.filter((char: Character) => char.role === roleFilter);
    }
    
    result.sort((a: Character, b: Character) => {
      switch(sortBy) {
        case 'name-asc': return a.name.localeCompare(b.name);
        case 'name-desc': return b.name.localeCompare(a.name);
        case 'newest': return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        case 'oldest': return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        case 'updated': return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
        default: return 0;
      }
    });
    
    return result;
  }, [characters, searchTerm, roleFilter, sortBy]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const dataToSubmit = {
      ...formData,
      role: formData.role ?? null,
      tags: formData.tags.length > 0 ? formData.tags : null
    };
    
    if (editingCharacter) {
      updateCharacterMutation.mutate({
        id: editingCharacter.id,
        updates: dataToSubmit
      });
    } else {
      createCharacterMutation.mutate(dataToSubmit);
    }
  };

  const handleEdit = (character: Character) => {
    setEditingCharacter(character);
    setFormData({
      name: character.name,
      description: character.description ?? "",
      background: character.background ?? "",
      personality: character.personality ?? "",
      appearance: character.appearance ?? "",
      notes: character.notes ?? "",
      role: character.role ?? null,
      importance: character.importance ?? 3,
      tags: character.tags ?? []
    });
    setShowCharacterModal(true);
  };

  const handleDelete = (character: Character) => {
    if (confirm(`Are you sure you want to delete ${character.name}?`)) {
      deleteCharacterMutation.mutate(character.id);
    }
  };

  const handleCloseModal = () => {
    setShowCharacterModal(false);
    setEditingCharacter(null);
    setTagInput("");
    setFormData({
      name: "",
      description: "",
      background: "",
      personality: "",
      appearance: "",
      notes: "",
      role: null,
      importance: 3,
      tags: []
    });
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(tag => tag !== tagToRemove) });
  };

  if (!isAuthenticated || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        currentPath="/characters"
      />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-semibold text-card-foreground" data-testid="text-characters-title">
                Characters
              </h1>
              <Badge variant="secondary" data-testid="badge-character-count">
                {filteredAndSortedCharacters.length} characters
              </Badge>
            </div>
            
            <Button 
              onClick={() => setShowCharacterModal(true)}
              data-testid="button-add-character"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Character
            </Button>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search characters..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-characters"
              />
            </div>
            
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px]" data-testid="select-role-filter">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="protagonist">Protagonist</SelectItem>
                <SelectItem value="antagonist">Antagonist</SelectItem>
                <SelectItem value="supporting">Supporting</SelectItem>
                <SelectItem value="minor">Minor</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-[180px]" data-testid="select-sort-by">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="updated">Recently Updated</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => {
                const newMode = viewMode === 'grid' ? 'list' : 'grid';
                setViewMode(newMode);
                if (typeof window !== 'undefined') {
                  localStorage.setItem('characterViewMode', newMode);
                }
              }}
              data-testid="button-view-toggle"
            >
              {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6">
          {charactersLoading ? (
            <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/2 mb-4"></div>
                    <div className="space-y-2">
                      <div className="h-3 bg-muted rounded"></div>
                      <div className="h-3 bg-muted rounded w-5/6"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredAndSortedCharacters.length === 0 ? (
            <div className="text-center py-16" data-testid="empty-characters-state">
              <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-card-foreground mb-2">
                {searchTerm || roleFilter !== 'all' ? "No characters found" : "No characters yet"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || roleFilter !== 'all'
                  ? "Try adjusting your filters or search terms."
                  : "Create your first character to bring your story to life."
                }
              </p>
              {!searchTerm && roleFilter === 'all' && (
                <Button 
                  onClick={() => setShowCharacterModal(true)}
                  data-testid="button-create-first-character"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Character
                </Button>
              )}
            </div>
          ) : (
            <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
              {filteredAndSortedCharacters.map((character: Character) => (
                <Card 
                  key={character.id} 
                  className={cn(
                    "hover:border-primary transition-all",
                    viewMode === 'list' && "flex"
                  )} 
                  data-testid={`card-character-${character.id}`}
                >
                  <CardHeader className={cn("pb-3", viewMode === 'list' && "flex-1")}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <User className="h-6 w-6 text-primary" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <CardTitle className="text-lg" data-testid={`text-character-name-${character.id}`}>
                              {character.name}
                            </CardTitle>
                            {character.role && (
                              <Badge variant="outline" className={getRoleBadgeColor(character.role)}>
                                {character.role}
                              </Badge>
                            )}
                          </div>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <div className="flex gap-0.5">
                              {Array.from({length: 5}).map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={cn(
                                    "w-3 h-3",
                                    i < (character.importance ?? 3) ? "fill-yellow-500 text-yellow-500" : "text-muted"
                                  )} 
                                />
                              ))}
                            </div>
                            {character.relationships && typeof character.relationships === 'object' && character.relationships !== null && Object.keys(character.relationships as Record<string, unknown>).length > 0 ? (
                              <span className="text-xs flex items-center gap-1">
                                <Heart className="w-3 h-3" />
                                {Object.keys(character.relationships as Record<string, unknown>).length}
                              </span>
                            ) : null}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(character)}
                          data-testid={`button-edit-character-${character.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(character)}
                          data-testid={`button-delete-character-${character.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className={cn("space-y-3", viewMode === 'list' && "flex-1")}>
                    {character.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {character.description}
                      </p>
                    )}
                    
                    {character.tags && character.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {character.tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    <div className="space-y-1 text-xs">
                      {character.personality && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Brain className="w-3 h-3 flex-shrink-0" />
                          <span className="line-clamp-1">{character.personality}</span>
                        </div>
                      )}
                      {character.appearance && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Eye className="w-3 h-3 flex-shrink-0" />
                          <span className="line-clamp-1">{character.appearance}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <Dialog open={showCharacterModal} onOpenChange={handleCloseModal}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto" data-testid="modal-character">
          <DialogHeader>
            <DialogTitle>
              {editingCharacter ? "Edit Character" : "Create New Character"}
            </DialogTitle>
            <DialogDescription>
              {editingCharacter ? "Update your character's details." : "Add a new character to your story."}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Character Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter character name"
                required
                data-testid="input-character-name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Brief Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Quick character description"
                data-testid="input-character-description"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={formData.role ?? undefined} onValueChange={(value) => setFormData({ ...formData, role: value as Character["role"] })}>
                <SelectTrigger data-testid="select-character-role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="protagonist">Protagonist</SelectItem>
                  <SelectItem value="antagonist">Antagonist</SelectItem>
                  <SelectItem value="supporting">Supporting</SelectItem>
                  <SelectItem value="minor">Minor</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="importance">Importance: {formData.importance}/5</Label>
              <Slider
                id="importance"
                min={1}
                max={5}
                step={1}
                value={[formData.importance]}
                onValueChange={(value) => setFormData({ ...formData, importance: value[0] })}
                data-testid="slider-character-importance"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Minor</span>
                <span>Critical</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <div className="flex gap-2">
                <Input
                  id="tags"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Add a tag"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  data-testid="input-character-tags"
                />
                <Button type="button" variant="outline" onClick={handleAddTag} data-testid="button-add-tag">
                  Add
                </Button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs flex items-center gap-1">
                      {tag}
                      <X 
                        className="w-3 h-3 cursor-pointer" 
                        onClick={() => handleRemoveTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="personality">Personality</Label>
              <Textarea
                id="personality"
                value={formData.personality}
                onChange={(e) => setFormData({ ...formData, personality: e.target.value })}
                placeholder="Describe their personality traits, quirks, and behavior..."
                className="resize-none h-20"
                data-testid="input-character-personality"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="appearance">Appearance</Label>
              <Textarea
                id="appearance"
                value={formData.appearance}
                onChange={(e) => setFormData({ ...formData, appearance: e.target.value })}
                placeholder="Physical description, clothing style, distinctive features..."
                className="resize-none h-20"
                data-testid="input-character-appearance"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="background">Background</Label>
              <Textarea
                id="background"
                value={formData.background}
                onChange={(e) => setFormData({ ...formData, background: e.target.value })}
                placeholder="Character history, origin story, important events..."
                className="resize-none h-20"
                data-testid="input-character-background"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any other important details, relationships, or notes..."
                className="resize-none h-20"
                data-testid="input-character-notes"
              />
            </div>
            
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-border">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCloseModal}
                disabled={createCharacterMutation.isPending || updateCharacterMutation.isPending}
                data-testid="button-cancel-character"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createCharacterMutation.isPending || updateCharacterMutation.isPending || !formData.name.trim()}
                data-testid="button-save-character"
              >
                {createCharacterMutation.isPending || updateCharacterMutation.isPending
                  ? "Saving..." 
                  : editingCharacter ? "Update Character" : "Create Character"
                }
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
