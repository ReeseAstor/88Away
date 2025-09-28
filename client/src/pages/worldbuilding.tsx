import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/sidebar";
import { 
  Globe, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  MapPin,
  Mountain,
  Building,
  Crown,
  Scroll,
  Sparkles
} from "lucide-react";
import { Project, WorldbuildingEntry, WorldbuildingDetails } from "@shared/schema";

const entryTypes = [
  { value: "location", label: "Location", icon: MapPin, color: "text-chart-1" },
  { value: "culture", label: "Culture", icon: Crown, color: "text-chart-2" },
  { value: "organization", label: "Organization", icon: Building, color: "text-accent" },
  { value: "magic_system", label: "Magic System", icon: Sparkles, color: "text-chart-5" },
  { value: "technology", label: "Technology", icon: Scroll, color: "text-chart-4" },
  { value: "history", label: "History", icon: Mountain, color: "text-destructive" },
  { value: "other", label: "Other", icon: Globe, color: "text-muted-foreground" }
];

export default function Worldbuilding() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<WorldbuildingEntry | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [formData, setFormData] = useState({
    title: "",
    type: "",
    description: "",
    details: "",
    tags: ""
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

  const { data: entries = [], isLoading: entriesLoading } = useQuery<WorldbuildingEntry[]>({
    queryKey: ['/api/worldbuilding'],
    enabled: isAuthenticated && projects.length > 0,
    queryFn: async () => {
      if (projects.length > 0) {
        const response = await fetch(`/api/projects/${projects[0].id}/worldbuilding`, {
          credentials: "include",
        });
        if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
        return response.json();
      }
      return [];
    },
    retry: false,
  });

  const createEntryMutation = useMutation({
    mutationFn: async (entryData: any) => {
      if (projects.length === 0) throw new Error("No project available");
      await apiRequest("POST", `/api/projects/${projects[0].id}/worldbuilding`, entryData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/worldbuilding'] });
      setShowEntryModal(false);
      setFormData({
        title: "",
        type: "",
        description: "",
        details: "",
        tags: ""
      });
      toast({
        title: "Success",
        description: "Worldbuilding entry created successfully!",
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
        description: "Failed to create entry. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateEntryMutation = useMutation({
    mutationFn: async (data: { id: string; updates: any }) => {
      await apiRequest("PUT", `/api/worldbuilding/${data.id}`, data.updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/worldbuilding'] });
      setShowEntryModal(false);
      setEditingEntry(null);
      toast({
        title: "Success",
        description: "Entry updated successfully!",
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
        description: "Failed to update entry. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteEntryMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/worldbuilding/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/worldbuilding'] });
      toast({
        title: "Success",
        description: "Entry deleted successfully!",
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
        description: "Failed to delete entry. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      title: formData.title,
      type: formData.type,
      description: formData.description || undefined,
      details: formData.details ? { content: formData.details } : undefined,
      tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : undefined
    };

    if (editingEntry) {
      updateEntryMutation.mutate({
        id: editingEntry.id,
        updates: submitData
      });
    } else {
      createEntryMutation.mutate(submitData);
    }
  };

  const handleEdit = (entry: WorldbuildingEntry) => {
    setEditingEntry(entry);
    setFormData({
      title: entry.title,
      type: entry.type,
      description: entry.description || "",
      details: entry.details && typeof entry.details === 'object' && 'content' in entry.details && typeof entry.details.content === 'string' ? entry.details.content : "",
      tags: entry.tags?.join(', ') || ""
    });
    setShowEntryModal(true);
  };

  const handleDelete = (entry: WorldbuildingEntry) => {
    if (confirm(`Are you sure you want to delete "${entry.title}"?`)) {
      deleteEntryMutation.mutate(entry.id);
    }
  };

  const handleCloseModal = () => {
    setShowEntryModal(false);
    setEditingEntry(null);
    setFormData({
      title: "",
      type: "",
      description: "",
      details: "",
      tags: ""
    });
  };

  const filteredEntries = entries.filter((entry: WorldbuildingEntry) => {
    const matchesSearch = entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || entry.type === filterType;
    return matchesSearch && matchesType;
  });

  const getTypeInfo = (type: string) => {
    return entryTypes.find(t => t.value === type) || entryTypes[entryTypes.length - 1];
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
        currentPath="/worldbuilding"
      />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-semibold text-card-foreground" data-testid="text-worldbuilding-title">
                World Building
              </h1>
              <Badge variant="secondary" data-testid="badge-entry-count">
                {entries.length} entries
              </Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-40" data-testid="select-filter-type">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {entryTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search entries..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                    data-testid="input-search-entries"
                  />
                </div>
              </div>
              
              <Button 
                onClick={() => setShowEntryModal(true)}
                data-testid="button-add-entry"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Entry
              </Button>
            </div>
          </div>
        </header>

        {/* Worldbuilding Content */}
        <div className="flex-1 overflow-auto p-6">
          {entriesLoading ? (
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
          ) : filteredEntries.length === 0 ? (
            <div className="text-center py-16" data-testid="empty-entries-state">
              <Globe className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-card-foreground mb-2">
                {searchTerm || filterType !== "all" ? "No entries found" : "No worldbuilding entries yet"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || filterType !== "all"
                  ? "Try adjusting your search or filter."
                  : "Start building your world with locations, cultures, and systems."
                }
              </p>
              {!searchTerm && filterType === "all" && (
                <Button 
                  onClick={() => setShowEntryModal(true)}
                  data-testid="button-create-first-entry"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Entry
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEntries.map((entry: WorldbuildingEntry) => {
                const typeInfo = getTypeInfo(entry.type);
                const IconComponent = typeInfo.icon;
                
                return (
                  <Card key={entry.id} className="hover:shadow-lg transition-shadow" data-testid={`card-entry-${entry.id}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                            <IconComponent className={`h-6 w-6 ${typeInfo.color}`} />
                          </div>
                          <div>
                            <CardTitle className="text-lg" data-testid={`text-entry-title-${entry.id}`}>
                              {entry.title}
                            </CardTitle>
                            <Badge variant="outline" className="mt-1">
                              {typeInfo.label}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(entry)}
                            data-testid={`button-edit-entry-${entry.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(entry)}
                            data-testid={`button-delete-entry-${entry.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {entry.description && (
                        <div>
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {entry.description}
                          </p>
                        </div>
                      )}
                      
                      {entry.details && typeof entry.details === 'object' && 'content' in entry.details && entry.details.content && (
                        <div>
                          <h4 className="text-sm font-medium text-card-foreground mb-1">Details</h4>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {entry.details && typeof entry.details === 'object' && 'content' in entry.details && typeof entry.details.content === 'string' ? entry.details.content : ''}
                          </p>
                        </div>
                      )}

                      {entry.tags && entry.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {entry.tags.slice(0, 3).map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {entry.tags.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{entry.tags.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}

                      <div className="pt-2 border-t border-border">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Created {entry.createdAt ? new Date(entry.createdAt).toLocaleDateString() : 'Unknown'}</span>
                          <span>Updated {entry.updatedAt ? new Date(entry.updatedAt).toLocaleDateString() : 'Unknown'}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Entry Modal */}
      <Dialog open={showEntryModal} onOpenChange={handleCloseModal}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto" data-testid="modal-worldbuilding-entry">
          <DialogHeader>
            <DialogTitle>
              {editingEntry ? "Edit World Entry" : "Create New World Entry"}
            </DialogTitle>
            <DialogDescription>
              {editingEntry ? "Update your worldbuilding entry." : "Add a new element to your world."}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter entry title"
                required
                data-testid="input-entry-title"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger data-testid="select-entry-type">
                  <SelectValue placeholder="Select entry type" />
                </SelectTrigger>
                <SelectContent>
                  {entryTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of this world element..."
                className="resize-none h-20"
                data-testid="input-entry-description"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="details">Detailed Information</Label>
              <Textarea
                id="details"
                value={formData.details}
                onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                placeholder="Detailed information, history, rules, or characteristics..."
                className="resize-none h-32"
                data-testid="input-entry-details"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="Enter tags separated by commas"
                data-testid="input-entry-tags"
              />
              <p className="text-xs text-muted-foreground">
                Use tags to organize and categorize your entries (e.g., "capital city, trade hub, ancient")
              </p>
            </div>
            
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-border">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCloseModal}
                disabled={createEntryMutation.isPending || updateEntryMutation.isPending}
                data-testid="button-cancel-entry"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createEntryMutation.isPending || updateEntryMutation.isPending || !formData.title.trim() || !formData.type}
                data-testid="button-save-entry"
              >
                {createEntryMutation.isPending || updateEntryMutation.isPending
                  ? "Saving..." 
                  : editingEntry ? "Update Entry" : "Create Entry"
                }
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
