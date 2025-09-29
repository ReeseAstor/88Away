import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/sidebar";
import RichTextEditor from "@/components/rich-text-editor";
import AiAssistantModal from "@/components/ai-assistant-modal";
import AdvancedAnalysisModal from "@/components/advanced-analysis-modal";
import ExportMenu from "@/components/export-menu";
import { CollaborationProvider, useCollaboration } from "@/components/collaboration-provider";
import CommentSidebar from "@/components/comment-sidebar";
import PresenceIndicator from "@/components/presence-indicator";
import {
  useDocumentComments,
  useCreateComment,
  useUpdateComment,
  useDeleteComment,
  useResolveComment,
  useCommentSubscription
} from "@/hooks/useComments";
import { 
  BookOpen, 
  Users, 
  Globe, 
  Clock, 
  FileText, 
  Plus,
  Settings,
  Share2,
  Download,
  Zap,
  Edit3,
  Save,
  Eye,
  Calendar,
  BarChart3,
  Brain,
  MessageSquare,
  Circle
} from "lucide-react";
import { Project as ProjectType, Document, ProjectWithCollaborators, Character, DocumentComment as Comment } from "@shared/schema";

// Inner component that uses collaboration context
function ProjectContent() {
  const { id } = useParams();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Collaboration context
  const { ydoc, awareness, isConnected, onlineUsers, sendComment, userColor, userRole, xmlFragment } = useCollaboration();
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [showAdvancedAnalysisModal, setShowAdvancedAnalysisModal] = useState(false);
  const [showCommentSidebar, setShowCommentSidebar] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
  const [documentContent, setDocumentContent] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [showCharacterModal, setShowCharacterModal] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [characterFormData, setCharacterFormData] = useState({
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

  const { data: project, isLoading: projectLoading } = useQuery<ProjectWithCollaborators>({
    queryKey: ['/api/projects', id],
    enabled: !!id && isAuthenticated,
    retry: false,
  });

  const { data: documents = [] } = useQuery<Document[]>({
    queryKey: ['/api/projects', id, 'documents'],
    enabled: !!id && isAuthenticated,
    retry: false,
  });

  const { data: selectedDocumentData } = useQuery<Document>({
    queryKey: ['/api/documents', selectedDocument],
    enabled: !!selectedDocument && isAuthenticated,
    retry: false,
  });

  const { data: characters = [] } = useQuery<Character[]>({
    queryKey: ['/api/projects', id, 'characters'],
    enabled: !!id && isAuthenticated,
    retry: false,
  });

  // Comment hooks
  const { data: comments = [] } = useDocumentComments(selectedDocument);
  const createCommentMutation = useCreateComment(selectedDocument || '');
  const updateCommentMutation = useUpdateComment(selectedDocument || '');
  const deleteCommentMutation = useDeleteComment(selectedDocument || '');
  const resolveCommentMutation = useResolveComment(selectedDocument || '');
  
  // Subscribe to real-time comment updates
  useCommentSubscription(selectedDocument, isConnected);

  // Load document content when selected
  useEffect(() => {
    if (selectedDocumentData?.content) {
      setDocumentContent(selectedDocumentData.content);
    }
  }, [selectedDocumentData]);

  const saveDocumentMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!selectedDocument) throw new Error("No document selected");
      return apiRequest("PUT", `/api/documents/${selectedDocument}`, {
        content
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents', selectedDocument] });
      queryClient.invalidateQueries({ queryKey: ['/api/projects', id, 'documents'] });
      toast({
        title: "Saved",
        description: "Document saved successfully.",
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
        description: "Failed to save document.",
        variant: "destructive",
      });
    },
  });

  const createDocumentMutation = useMutation({
    mutationFn: async (data: { title: string; type: string }) => {
      return apiRequest("POST", `/api/projects/${id}/documents`, {
        title: data.title,
        type: data.type,
        content: "",
        orderIndex: documents.length
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects', id, 'documents'] });
      toast({
        title: "Created",
        description: "New document created successfully.",
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
        description: "Failed to create document.",
        variant: "destructive",
      });
    },
  });

  const handleSaveDocument = () => {
    if (selectedDocument && documentContent !== selectedDocumentData?.content) {
      saveDocumentMutation.mutate(documentContent);
    }
  };

  const handleCreateDocument = () => {
    const title = prompt("Document title:");
    if (title) {
      createDocumentMutation.mutate({
        title,
        type: "chapter"
      });
    }
  };

  const createCharacterMutation = useMutation({
    mutationFn: async (characterData: any) => {
      return apiRequest("POST", `/api/projects/${id}/characters`, characterData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects', id, 'characters'] });
      setShowCharacterModal(false);
      setCharacterFormData({
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

  const handleCharacterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createCharacterMutation.mutate(characterFormData);
  };

  const handleCloseCharacterModal = () => {
    setShowCharacterModal(false);
    setEditingCharacter(null);
    setCharacterFormData({
      name: "",
      description: "",
      background: "",
      personality: "",
      appearance: "",
      notes: ""
    });
  };

  // Handle comment actions
  const handleAddComment = (content: string, range?: { start: number; end: number }) => {
    if (selectedDocument) {
      createCommentMutation.mutate({ content, range });
    }
  };

  const handleUpdateComment = (commentId: string, content: string) => {
    updateCommentMutation.mutate({ commentId, content });
  };

  const handleDeleteComment = (commentId: string) => {
    deleteCommentMutation.mutate(commentId);
  };

  const handleResolveComment = (commentId: string) => {
    resolveCommentMutation.mutate({ commentId, resolved: true });
  };

  const handleReplyToComment = (parentId: string, content: string) => {
    if (selectedDocument) {
      createCommentMutation.mutate({ content, parentId });
    }
  };

  // Determine user's role in the project
  const getUserRole = () => {
    if (!project || !user) return null;
    if (project.ownerId === user.id) return 'owner';
    const collaborator = project.collaborators?.find(c => c.userId === user.id);
    return collaborator?.role || userRole;
  };

  const currentUserRole = getUserRole();

  if (!isAuthenticated || isLoading || projectLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Project Not Found</h1>
          <p className="text-muted-foreground">The project you're looking for doesn't exist or you don't have access to it.</p>
        </div>
      </div>
    );
  }

  const progress = project.targetWordCount 
    ? Math.round(((project.currentWordCount || 0) / project.targetWordCount) * 100)
    : 0;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        currentPath={`/projects/${id}`}
      />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Project Header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-2xl font-semibold text-card-foreground" data-testid="text-project-title">
                  {project.title}
                </h1>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <span data-testid="text-word-count">
                    {(project.currentWordCount || 0).toLocaleString()} words
                  </span>
                  {project.genre && (
                    <>
                      <span>•</span>
                      <Badge variant="secondary">{project.genre}</Badge>
                    </>
                  )}
                  {project.deadline && (
                    <>
                      <span>•</span>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          Due {new Date(project.deadline).toLocaleDateString()}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Connection Status */}
              <div className="flex items-center space-x-2">
                <Circle 
                  className={`h-3 w-3 fill-current ${isConnected ? 'text-green-500' : 'text-gray-400'}`} 
                  data-testid="connection-status"
                />
                <span className="text-sm text-muted-foreground">
                  {isConnected ? 'Connected' : 'Offline'}
                </span>
              </div>

              {/* Presence Indicator */}
              <PresenceIndicator 
                onlineUsers={onlineUsers} 
                currentUser={user}
              />

              {/* Comment Toggle */}
              {selectedDocument && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCommentSidebar(!showCommentSidebar)}
                  data-testid="button-toggle-comments"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Comments
                  {comments.length > 0 && (
                    <Badge className="ml-2" variant="secondary">
                      {comments.length}
                    </Badge>
                  )}
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAiModal(true)}
                data-testid="button-ai-assistant"
              >
                <Zap className="h-4 w-4 mr-2" />
                AI Assistant
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdvancedAnalysisModal(true)}
                data-testid="button-advanced-analysis"
              >
                <Brain className="h-4 w-4 mr-2" />
                Analyze
              </Button>
              <ExportMenu
                projectId={id}
                projectTitle={project.title}
                documents={documents}
              />
            </div>
          </div>

          {/* Progress Bar */}
          {project.targetWordCount && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-1">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
        </header>

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
          <div className={`flex-1 p-6 overflow-y-auto ${showCommentSidebar ? 'mr-96' : ''}`}>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="overview" data-testid="tab-overview">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="documents" data-testid="tab-documents">
                  <FileText className="h-4 w-4 mr-2" />
                  Documents
                </TabsTrigger>
                <TabsTrigger value="characters" data-testid="tab-characters">
                  <Users className="h-4 w-4 mr-2" />
                  Characters
                </TabsTrigger>
                <TabsTrigger value="worldbuilding" data-testid="tab-worldbuilding">
                  <Globe className="h-4 w-4 mr-2" />
                  World
                </TabsTrigger>
                <TabsTrigger value="timeline" data-testid="tab-timeline">
                  <Clock className="h-4 w-4 mr-2" />
                  Timeline
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Project Details</CardTitle>
                    <CardDescription>
                      Manage your writing project and track your progress.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Description</Label>
                      <p className="text-sm text-muted-foreground">
                        {project.description || "No description provided"}
                      </p>
                    </div>
                    {project.collaborators && project.collaborators.length > 0 && (
                      <div>
                        <Label>Collaborators</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {project.collaborators.map((collab) => (
                            <Badge key={collab.userId} variant="secondary">
                              {collab.user?.firstName} {collab.user?.lastName}
                              <span className="ml-1 text-xs opacity-70">({collab.role})</span>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-3 gap-4 pt-4">
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-2xl font-semibold">
                            {documents.length}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Documents
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-2xl font-semibold">
                            {characters.length}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Characters
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-2xl font-semibold">
                            {project.currentWordCount || 0}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Total Words
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Documents Tab */}
              <TabsContent value="documents" className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Documents</h2>
                  <Button
                    onClick={handleCreateDocument}
                    data-testid="button-create-document"
                    disabled={currentUserRole === 'reader'}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Document
                  </Button>
                </div>

                {documents.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        No documents yet. Create your first document to start writing.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Select a document</Label>
                      <div className="space-y-2 max-h-[400px] overflow-y-auto">
                        {documents.map((doc) => (
                          <Card
                            key={doc.id}
                            className={`cursor-pointer transition-colors hover:bg-accent ${
                              selectedDocument === doc.id ? 'border-primary' : ''
                            }`}
                            onClick={() => setSelectedDocument(doc.id)}
                            data-testid={`document-card-${doc.id}`}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-medium">{doc.title}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    {doc.wordCount || 0} words
                                  </p>
                                </div>
                                <Badge variant="outline">{doc.type}</Badge>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>

                    {selectedDocument && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Edit Document</Label>
                          <div className="flex items-center space-x-2">
                            {currentUserRole && currentUserRole !== 'reader' && (
                              <Button
                                size="sm"
                                onClick={handleSaveDocument}
                                disabled={documentContent === selectedDocumentData?.content}
                                data-testid="button-save-document"
                              >
                                <Save className="h-4 w-4 mr-2" />
                                Save
                              </Button>
                            )}
                          </div>
                        </div>
                        <RichTextEditor
                          content={documentContent}
                          onChange={setDocumentContent}
                          ydoc={ydoc}
                          awareness={awareness}
                          xmlFragment={xmlFragment}
                          isCollaborative={isConnected}
                          readOnly={currentUserRole === 'reader'}
                          onlineUsers={onlineUsers}
                          userColor={userColor}
                          userRole={currentUserRole}
                          userName={user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email : 'Anonymous'}
                          onCommentClick={() => setShowCommentSidebar(true)}
                        />
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              {/* Characters Tab */}
              <TabsContent value="characters" className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Characters</h2>
                  <Button
                    onClick={() => setShowCharacterModal(true)}
                    data-testid="button-create-character"
                    disabled={currentUserRole === 'reader'}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Character
                  </Button>
                </div>

                {characters.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        No characters yet. Create your first character to bring your story to life.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {characters.map((character) => (
                      <Card key={character.id} data-testid={`character-card-${character.id}`}>
                        <CardHeader>
                          <CardTitle className="text-lg">{character.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {character.description && (
                            <p className="text-sm text-muted-foreground line-clamp-3">
                              {character.description}
                            </p>
                          )}
                          <div className="flex items-center justify-between pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingCharacter(character);
                                setCharacterFormData({
                                  name: character.name,
                                  description: character.description || "",
                                  background: character.background || "",
                                  personality: character.personality || "",
                                  appearance: character.appearance || "",
                                  notes: character.notes || ""
                                });
                                setShowCharacterModal(true);
                              }}
                              disabled={currentUserRole === 'reader'}
                              data-testid={`button-edit-character-${character.id}`}
                            >
                              <Edit3 className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              data-testid={`button-view-character-${character.id}`}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Worldbuilding Tab */}
              <TabsContent value="worldbuilding">
                <Card>
                  <CardHeader>
                    <CardTitle>World Building</CardTitle>
                    <CardDescription>
                      Create and organize the world of your story
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center py-8">
                    <Globe className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      World building features coming soon!
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Timeline Tab */}
              <TabsContent value="timeline">
                <Card>
                  <CardHeader>
                    <CardTitle>Timeline</CardTitle>
                    <CardDescription>
                      Track events and plot points in your story
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center py-8">
                    <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      Timeline features coming soon!
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Comment Sidebar */}
          {showCommentSidebar && selectedDocument && (
            <div className="fixed right-0 top-0 h-full w-96 bg-background shadow-xl z-20">
              <CommentSidebar
                documentId={selectedDocument}
                comments={comments}
                currentUser={user}
                userRole={currentUserRole}
                onClose={() => setShowCommentSidebar(false)}
                onAddComment={handleAddComment}
                onUpdateComment={handleUpdateComment}
                onDeleteComment={handleDeleteComment}
                onResolveComment={handleResolveComment}
                onReplyToComment={handleReplyToComment}
              />
            </div>
          )}
        </div>
      </main>

      {/* AI Assistant Modal */}
      {showAiModal && project && (
        <AiAssistantModal
          isOpen={showAiModal}
          onClose={() => setShowAiModal(false)}
          projectId={project.id}
          projectTitle={project.title}
          documents={documents}
          characters={characters}
        />
      )}

      {/* Advanced Analysis Modal */}
      {showAdvancedAnalysisModal && project && (
        <AdvancedAnalysisModal
          isOpen={showAdvancedAnalysisModal}
          onClose={() => setShowAdvancedAnalysisModal(false)}
          projectId={project.id}
          projectTitle={project.title}
          documents={documents}
        />
      )}

      {/* Character Modal */}
      <Dialog open={showCharacterModal} onOpenChange={handleCloseCharacterModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingCharacter ? 'Edit Character' : 'Create New Character'}
            </DialogTitle>
            <DialogDescription>
              Add details about your character
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCharacterSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={characterFormData.name}
                onChange={(e) => setCharacterFormData({...characterFormData, name: e.target.value})}
                placeholder="Character name"
                required
                data-testid="input-character-name"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={characterFormData.description}
                onChange={(e) => setCharacterFormData({...characterFormData, description: e.target.value})}
                placeholder="Brief description of the character"
                className="min-h-[80px]"
                data-testid="textarea-character-description"
              />
            </div>
            <div>
              <Label htmlFor="personality">Personality</Label>
              <Textarea
                id="personality"
                value={characterFormData.personality}
                onChange={(e) => setCharacterFormData({...characterFormData, personality: e.target.value})}
                placeholder="Character traits, behaviors, and quirks"
                className="min-h-[80px]"
                data-testid="textarea-character-personality"
              />
            </div>
            <div>
              <Label htmlFor="background">Background</Label>
              <Textarea
                id="background"
                value={characterFormData.background}
                onChange={(e) => setCharacterFormData({...characterFormData, background: e.target.value})}
                placeholder="Character's history and backstory"
                className="min-h-[80px]"
                data-testid="textarea-character-background"
              />
            </div>
            <div>
              <Label htmlFor="appearance">Appearance</Label>
              <Textarea
                id="appearance"
                value={characterFormData.appearance}
                onChange={(e) => setCharacterFormData({...characterFormData, appearance: e.target.value})}
                placeholder="Physical description"
                className="min-h-[80px]"
                data-testid="textarea-character-appearance"
              />
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={characterFormData.notes}
                onChange={(e) => setCharacterFormData({...characterFormData, notes: e.target.value})}
                placeholder="Additional notes or reminders"
                className="min-h-[80px]"
                data-testid="textarea-character-notes"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCloseCharacterModal}
                data-testid="button-cancel-character"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={!characterFormData.name}
                data-testid="button-save-character"
              >
                {editingCharacter ? 'Update' : 'Create'} Character
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Main component with CollaborationProvider wrapper
export default function Project() {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  
  if (!id || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Wrap the entire project page with collaboration provider
  return (
    <CollaborationProvider documentId={id} projectId={id}>
      <ProjectContent />
    </CollaborationProvider>
  );
}