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
  Clock, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Calendar,
  MapPin,
  Users,
  Star,
  ChevronDown,
  ChevronRight
} from "lucide-react";

interface TimelineEvent {
  id: string;
  title: string;
  description?: string;
  date: string;
  importance: number;
  tags?: string[];
  relatedCharacters?: string[];
  relatedLocations?: string[];
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

const importanceLevels = [
  { value: 1, label: "Minor", color: "bg-muted" },
  { value: 2, label: "Notable", color: "bg-chart-3" },
  { value: 3, label: "Significant", color: "bg-chart-2" },
  { value: 4, label: "Major", color: "bg-chart-1" },
  { value: 5, label: "Critical", color: "bg-destructive" }
];

export default function Timeline() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterImportance, setFilterImportance] = useState("all");
  const [expandedYears, setExpandedYears] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    importance: 3,
    tags: "",
    relatedCharacters: "",
    relatedLocations: ""
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

  const { data: projects = [] } = useQuery({
    queryKey: ['/api/projects'],
    enabled: isAuthenticated,
    retry: false,
  });

  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['/api/timeline'],
    enabled: isAuthenticated && projects.length > 0,
    queryFn: async () => {
      if (projects.length > 0) {
        const response = await fetch(`/api/projects/${projects[0].id}/timeline`, {
          credentials: "include",
        });
        if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
        return response.json();
      }
      return [];
    },
    retry: false,
  });

  const createEventMutation = useMutation({
    mutationFn: async (eventData: any) => {
      if (projects.length === 0) throw new Error("No project available");
      await apiRequest("POST", `/api/projects/${projects[0].id}/timeline`, eventData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/timeline'] });
      setShowEventModal(false);
      setFormData({
        title: "",
        description: "",
        date: "",
        importance: 3,
        tags: "",
        relatedCharacters: "",
        relatedLocations: ""
      });
      toast({
        title: "Success",
        description: "Timeline event created successfully!",
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
        description: "Failed to create event. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: async (data: { id: string; updates: any }) => {
      await apiRequest("PUT", `/api/timeline/${data.id}`, data.updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/timeline'] });
      setShowEventModal(false);
      setEditingEvent(null);
      toast({
        title: "Success",
        description: "Event updated successfully!",
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
        description: "Failed to update event. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/timeline/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/timeline'] });
      toast({
        title: "Success",
        description: "Event deleted successfully!",
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
        description: "Failed to delete event. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      title: formData.title,
      description: formData.description || undefined,
      date: formData.date,
      importance: formData.importance,
      tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : undefined,
      relatedCharacters: formData.relatedCharacters ? formData.relatedCharacters.split(',').map(char => char.trim()).filter(Boolean) : undefined,
      relatedLocations: formData.relatedLocations ? formData.relatedLocations.split(',').map(loc => loc.trim()).filter(Boolean) : undefined
    };

    if (editingEvent) {
      updateEventMutation.mutate({
        id: editingEvent.id,
        updates: submitData
      });
    } else {
      createEventMutation.mutate(submitData);
    }
  };

  const handleEdit = (event: TimelineEvent) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description || "",
      date: event.date,
      importance: event.importance,
      tags: event.tags?.join(', ') || "",
      relatedCharacters: event.relatedCharacters?.join(', ') || "",
      relatedLocations: event.relatedLocations?.join(', ') || ""
    });
    setShowEventModal(true);
  };

  const handleDelete = (event: TimelineEvent) => {
    if (confirm(`Are you sure you want to delete "${event.title}"?`)) {
      deleteEventMutation.mutate(event.id);
    }
  };

  const handleCloseModal = () => {
    setShowEventModal(false);
    setEditingEvent(null);
    setFormData({
      title: "",
      description: "",
      date: "",
      importance: 3,
      tags: "",
      relatedCharacters: "",
      relatedLocations: ""
    });
  };

  const filteredEvents = events.filter((event: TimelineEvent) => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesImportance = filterImportance === "all" || event.importance.toString() === filterImportance;
    return matchesSearch && matchesImportance;
  });

  // Group events by year/era
  const groupedEvents = filteredEvents.reduce((acc: { [key: string]: TimelineEvent[] }, event: TimelineEvent) => {
    const year = event.date || "Undated";
    if (!acc[year]) {
      acc[year] = [];
    }
    acc[year].push(event);
    return acc;
  }, {});

  // Sort years/eras
  const sortedYears = Object.keys(groupedEvents).sort((a, b) => {
    if (a === "Undated") return 1;
    if (b === "Undated") return -1;
    return a.localeCompare(b);
  });

  const getImportanceInfo = (importance: number) => {
    return importanceLevels.find(level => level.value === importance) || importanceLevels[2];
  };

  const toggleYear = (year: string) => {
    const newExpanded = new Set(expandedYears);
    if (newExpanded.has(year)) {
      newExpanded.delete(year);
    } else {
      newExpanded.add(year);
    }
    setExpandedYears(newExpanded);
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
        currentPath="/timeline"
      />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-semibold text-card-foreground" data-testid="text-timeline-title">
                Timeline
              </h1>
              <Badge variant="secondary" data-testid="badge-event-count">
                {events.length} events
              </Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Select value={filterImportance} onValueChange={setFilterImportance}>
                  <SelectTrigger className="w-40" data-testid="select-filter-importance">
                    <SelectValue placeholder="Filter by importance" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    {importanceLevels.map((level) => (
                      <SelectItem key={level.value} value={level.value.toString()}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search events..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                    data-testid="input-search-events"
                  />
                </div>
              </div>
              
              <Button 
                onClick={() => setShowEventModal(true)}
                data-testid="button-add-event"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Event
              </Button>
            </div>
          </div>
        </header>

        {/* Timeline Content */}
        <div className="flex-1 overflow-auto p-6">
          {eventsLoading ? (
            <div className="space-y-6">
              {[1, 2, 3].map(i => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-muted rounded w-1/4 mb-4"></div>
                    <div className="space-y-4">
                      {[1, 2].map(j => (
                        <div key={j} className="flex space-x-4">
                          <div className="w-12 h-12 bg-muted rounded-lg"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-muted rounded w-1/2"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-16" data-testid="empty-events-state">
              <Clock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-card-foreground mb-2">
                {searchTerm || filterImportance !== "all" ? "No events found" : "No timeline events yet"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || filterImportance !== "all"
                  ? "Try adjusting your search or filter."
                  : "Start building your story's chronology with important events."
                }
              </p>
              {!searchTerm && filterImportance === "all" && (
                <Button 
                  onClick={() => setShowEventModal(true)}
                  data-testid="button-create-first-event"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Event
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {sortedYears.map((year) => {
                const yearEvents = groupedEvents[year].sort((a, b) => b.importance - a.importance);
                const isExpanded = expandedYears.has(year);
                
                return (
                  <Card key={year} data-testid={`card-year-${year}`}>
                    <CardHeader 
                      className="cursor-pointer hover:bg-muted/30 transition-colors"
                      onClick={() => toggleYear(year)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {isExpanded ? (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          )}
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-5 w-5 text-accent" />
                            <CardTitle className="text-xl">{year}</CardTitle>
                          </div>
                        </div>
                        <Badge variant="outline">
                          {yearEvents.length} event{yearEvents.length !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    {isExpanded && (
                      <CardContent className="space-y-4">
                        <div className="relative">
                          <div className="absolute left-6 top-0 bottom-0 w-px bg-border"></div>
                          <div className="space-y-6">
                            {yearEvents.map((event, index) => {
                              const importanceInfo = getImportanceInfo(event.importance);
                              
                              return (
                                <div key={event.id} className="relative flex space-x-4" data-testid={`card-event-${event.id}`}>
                                  <div className={`w-12 h-12 ${importanceInfo.color} rounded-lg flex items-center justify-center z-10`}>
                                    <Clock className="h-6 w-6 text-white" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-center space-x-2 mb-1">
                                          <h4 className="font-semibold text-card-foreground" data-testid={`text-event-title-${event.id}`}>
                                            {event.title}
                                          </h4>
                                          <Badge variant="outline" className={importanceInfo.color}>
                                            {importanceInfo.label}
                                          </Badge>
                                        </div>
                                        {event.description && (
                                          <p className="text-muted-foreground text-sm mb-2">
                                            {event.description}
                                          </p>
                                        )}
                                        
                                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                          {event.relatedCharacters && event.relatedCharacters.length > 0 && (
                                            <div className="flex items-center space-x-1">
                                              <Users className="h-3 w-3" />
                                              <span>{event.relatedCharacters.join(', ')}</span>
                                            </div>
                                          )}
                                          {event.relatedLocations && event.relatedLocations.length > 0 && (
                                            <div className="flex items-center space-x-1">
                                              <MapPin className="h-3 w-3" />
                                              <span>{event.relatedLocations.join(', ')}</span>
                                            </div>
                                          )}
                                        </div>
                                        
                                        {event.tags && event.tags.length > 0 && (
                                          <div className="flex flex-wrap gap-1 mt-2">
                                            {event.tags.map((tag, tagIndex) => (
                                              <Badge key={tagIndex} variant="secondary" className="text-xs">
                                                {tag}
                                              </Badge>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                      
                                      <div className="flex items-center space-x-1 ml-4">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleEdit(event)}
                                          data-testid={`button-edit-event-${event.id}`}
                                        >
                                          <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleDelete(event)}
                                          data-testid={`button-delete-event-${event.id}`}
                                        >
                                          <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Event Modal */}
      <Dialog open={showEventModal} onOpenChange={handleCloseModal}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto" data-testid="modal-timeline-event">
          <DialogHeader>
            <DialogTitle>
              {editingEvent ? "Edit Timeline Event" : "Create New Timeline Event"}
            </DialogTitle>
            <DialogDescription>
              {editingEvent ? "Update your timeline event." : "Add a new event to your story's chronology."}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Event Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter event title"
                required
                data-testid="input-event-title"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date/Era</Label>
                <Input
                  id="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  placeholder="e.g., 1485, Age of Dragons"
                  data-testid="input-event-date"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="importance">Importance *</Label>
                <Select value={formData.importance.toString()} onValueChange={(value) => setFormData({ ...formData, importance: parseInt(value) })}>
                  <SelectTrigger data-testid="select-event-importance">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {importanceLevels.map((level) => (
                      <SelectItem key={level.value} value={level.value.toString()}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what happened during this event..."
                className="resize-none h-24"
                data-testid="input-event-description"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="relatedCharacters">Related Characters</Label>
              <Input
                id="relatedCharacters"
                value={formData.relatedCharacters}
                onChange={(e) => setFormData({ ...formData, relatedCharacters: e.target.value })}
                placeholder="Character names separated by commas"
                data-testid="input-event-characters"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="relatedLocations">Related Locations</Label>
              <Input
                id="relatedLocations"
                value={formData.relatedLocations}
                onChange={(e) => setFormData({ ...formData, relatedLocations: e.target.value })}
                placeholder="Location names separated by commas"
                data-testid="input-event-locations"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="Tags separated by commas"
                data-testid="input-event-tags"
              />
            </div>
            
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-border">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCloseModal}
                disabled={createEventMutation.isPending || updateEventMutation.isPending}
                data-testid="button-cancel-event"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createEventMutation.isPending || updateEventMutation.isPending || !formData.title.trim()}
                data-testid="button-save-event"
              >
                {createEventMutation.isPending || updateEventMutation.isPending
                  ? "Saving..." 
                  : editingEvent ? "Update Event" : "Create Event"
                }
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
