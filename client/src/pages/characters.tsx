import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/sidebar";
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  User,
  Heart,
  MapPin
} from "lucide-react";
import { Project, Character, type OnboardingProgress } from "@shared/schema";

export default function Characters() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showCharacterModal, setShowCharacterModal] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    background: "",
    personality: "",
    appearance: "",
    notes: ""
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

  // For now, get characters from all projects - in a real app, this would be filtered by project
  const { data: characters = [], isLoading: charactersLoading } = useQuery<Character[]>({
    queryKey: ['/api/characters'],
    enabled: isAuthenticated && projects.length > 0,
    queryFn: async () => {
      // Get characters from first project for demo
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
        notes: ""
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingCharacter) {
      updateCharacterMutation.mutate({
        id: editingCharacter.id,
        updates: formData
      });
    } else {
      createCharacterMutation.mutate(formData);
    }
  };

  const handleEdit = (character: Character) => {
    setEditingCharacter(character);
    setFormData({
      name: character.name,
      description: character.description || "",
      background: character.background || "",
      personality: character.personality || "",
      appearance: character.appearance || "",
      notes: character.notes || ""
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
    setFormData({
      name: "",
      description: "",
      background: "",
      personality: "",
      appearance: "",
      notes: ""
    });
  };

  const filteredCharacters = characters.filter((character: Character) =>
    character.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    character.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-semibold text-card-foreground" data-testid="text-characters-title">
                Characters
              </h1>
              <Badge variant="secondary" data-testid="badge-character-count">
                {characters.length} characters
              </Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search characters..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                  data-testid="input-search-characters"
                />
              </div>
              
              <Button 
                onClick={() => setShowCharacterModal(true)}
                data-testid="button-add-character"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Character
              </Button>
            </div>
          </div>
        </header>

        {/* Characters Content */}
        <div className="flex-1 overflow-auto p-6">
          {charactersLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
          ) : filteredCharacters.length === 0 ? (
            <div className="text-center py-16" data-testid="empty-characters-state">
              <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-card-foreground mb-2">
                {searchTerm ? "No characters found" : "No characters yet"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm 
                  ? "Try adjusting your search terms."
                  : "Create your first character to bring your story to life."
                }
              </p>
              {!searchTerm && (
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCharacters.map((character: Character) => (
                <Card key={character.id} className="hover:shadow-lg transition-shadow" data-testid={`card-character-${character.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-chart-1/10 rounded-lg flex items-center justify-center">
                          <User className="h-6 w-6 text-chart-1" />
                        </div>
                        <div>
                          <CardTitle className="text-lg" data-testid={`text-character-name-${character.id}`}>
                            {character.name}
                          </CardTitle>
                          {character.description && (
                            <CardDescription className="text-sm">
                              {character.description}
                            </CardDescription>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
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
                  <CardContent className="space-y-3">
                    {character.personality && (
                      <div>
                        <h4 className="text-sm font-medium text-card-foreground mb-1">Personality</h4>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {character.personality}
                        </p>
                      </div>
                    )}
                    
                    {character.appearance && (
                      <div>
                        <h4 className="text-sm font-medium text-card-foreground mb-1">Appearance</h4>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {character.appearance}
                        </p>
                      </div>
                    )}

                    {character.background && (
                      <div>
                        <h4 className="text-sm font-medium text-card-foreground mb-1">Background</h4>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {character.background}
                        </p>
                      </div>
                    )}

                    <div className="pt-2 border-t border-border">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Created {character.createdAt ? new Date(character.createdAt).toLocaleDateString() : 'Unknown'}</span>
                        <span>Updated {character.updatedAt ? new Date(character.updatedAt).toLocaleDateString() : 'Unknown'}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Character Modal */}
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
