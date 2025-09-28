import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/sidebar";
import RichTextEditor from "@/components/rich-text-editor";
import AiAssistantModal from "@/components/ai-assistant-modal";
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
  Calendar
} from "lucide-react";
import { Project as ProjectType, Document, ProjectWithCollaborators } from "@shared/schema";

export default function Project() {
  const { id } = useParams();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
  const [documentContent, setDocumentContent] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

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
                        <span>Due {new Date(project.deadline).toLocaleDateString()}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {project.targetWordCount && (
                <div className="flex items-center space-x-2">
                  <Progress value={progress} className="w-20" />
                  <span className="text-sm text-muted-foreground">{progress}%</span>
                </div>
              )}
              
              <Button variant="outline" size="sm" data-testid="button-share">
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
              
              <Button variant="outline" size="sm" data-testid="button-export">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              
              <Button 
                size="sm"
                onClick={() => setShowAiModal(true)}
                data-testid="button-ai-assistant"
              >
                <Zap className="mr-2 h-4 w-4" />
                AI Assistant
              </Button>
            </div>
          </div>
        </header>

        {/* Project Content */}
        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <div className="border-b border-border px-6">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
                <TabsTrigger value="documents" data-testid="tab-documents">Documents</TabsTrigger>
                <TabsTrigger value="characters" data-testid="tab-characters">Characters</TabsTrigger>
                <TabsTrigger value="worldbuilding" data-testid="tab-worldbuilding">World</TabsTrigger>
                <TabsTrigger value="timeline" data-testid="tab-timeline">Timeline</TabsTrigger>
              </TabsList>
            </div>
            
            <div className="flex-1 overflow-auto">
              <TabsContent value="overview" className="p-6 mt-0">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <Card>
                      <CardHeader>
                        <CardTitle>Project Overview</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {project.description && (
                          <div>
                            <h4 className="font-medium mb-2">Description</h4>
                            <p className="text-muted-foreground">{project.description}</p>
                          </div>
                        )}
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium mb-2">Progress</h4>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>Current Words</span>
                                <span>{(project.currentWordCount || 0).toLocaleString()}</span>
                              </div>
                              {project.targetWordCount && (
                                <>
                                  <div className="flex justify-between text-sm">
                                    <span>Target Words</span>
                                    <span>{project.targetWordCount.toLocaleString()}</span>
                                  </div>
                                  <Progress value={progress} />
                                </>
                              )}
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="font-medium mb-2">Quick Stats</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span>Characters</span>
                                <span>{project.characters?.length || 0}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Documents</span>
                                <span>{documents.length}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Collaborators</span>
                                <span>{project.collaborators?.length || 1}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Recent Activity</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-start space-x-3">
                            <div className="w-2 h-2 bg-chart-1 rounded-full mt-2"></div>
                            <div>
                              <p className="text-sm text-card-foreground">Project created</p>
                              <p className="text-xs text-muted-foreground">
                                {project.createdAt ? new Date(project.createdAt).toLocaleDateString() : 'Unknown'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start space-x-3">
                            <div className="w-2 h-2 bg-accent rounded-full mt-2"></div>
                            <div>
                              <p className="text-sm text-card-foreground">Last updated</p>
                              <p className="text-xs text-muted-foreground">
                                {project.updatedAt ? new Date(project.updatedAt).toLocaleDateString() : 'Unknown'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="documents" className="mt-0 h-full">
                <div className="h-full flex">
                  {/* Document List */}
                  <div className="w-80 border-r border-border bg-card">
                    <div className="p-4 border-b border-border">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">Documents</h3>
                        <Button 
                          size="sm" 
                          onClick={handleCreateDocument}
                          data-testid="button-create-document"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="p-4 space-y-2">
                      {documents.length === 0 ? (
                        <div className="text-center py-8">
                          <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">No documents yet</p>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={handleCreateDocument}
                            className="mt-2"
                          >
                            Create your first document
                          </Button>
                        </div>
                      ) : (
                        documents.map((doc: any) => (
                          <div
                            key={doc.id}
                            className={`p-3 rounded-lg cursor-pointer transition-colors ${
                              selectedDocument === doc.id 
                                ? 'bg-accent/20 border border-accent' 
                                : 'hover:bg-muted/50'
                            }`}
                            onClick={() => setSelectedDocument(doc.id)}
                            data-testid={`document-${doc.id}`}
                          >
                            <div className="flex items-center space-x-2">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium text-sm">{doc.title}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {doc.wordCount || 0} words
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  
                  {/* Document Editor */}
                  <div className="flex-1 flex flex-col">
                    {selectedDocument ? (
                      <>
                        <div className="p-4 border-b border-border bg-card">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold">{selectedDocumentData?.title}</h3>
                            <div className="flex items-center space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={handleSaveDocument}
                                disabled={saveDocumentMutation.isPending || documentContent === selectedDocumentData?.content}
                                data-testid="button-save-document"
                              >
                                <Save className="mr-2 h-4 w-4" />
                                {saveDocumentMutation.isPending ? "Saving..." : "Save"}
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                data-testid="button-preview-document"
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                Preview
                              </Button>
                            </div>
                          </div>
                        </div>
                        <div className="flex-1 p-4">
                          <RichTextEditor
                            content={documentContent}
                            onChange={setDocumentContent}
                            placeholder="Start writing your story..."
                            className="h-full"
                          />
                        </div>
                      </>
                    ) : (
                      <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                          <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-card-foreground mb-2">
                            Select a document to edit
                          </h3>
                          <p className="text-muted-foreground">
                            Choose a document from the sidebar or create a new one to start writing.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="characters" className="p-6 mt-0">
                <div className="text-center py-8">
                  <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-card-foreground mb-2">Character Management</h3>
                  <p className="text-muted-foreground mb-4">
                    Manage your story's characters, their backgrounds, and relationships.
                  </p>
                  <Button data-testid="button-add-character">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Character
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="worldbuilding" className="p-6 mt-0">
                <div className="text-center py-8">
                  <Globe className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-card-foreground mb-2">World Building</h3>
                  <p className="text-muted-foreground mb-4">
                    Create and organize locations, cultures, and world systems.
                  </p>
                  <Button data-testid="button-add-world-entry">
                    <Plus className="mr-2 h-4 w-4" />
                    Add World Entry
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="timeline" className="p-6 mt-0">
                <div className="text-center py-8">
                  <Clock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-card-foreground mb-2">Timeline</h3>
                  <p className="text-muted-foreground mb-4">
                    Track important events and story chronology.
                  </p>
                  <Button data-testid="button-add-timeline-event">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Event
                  </Button>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </main>

      <AiAssistantModal
        open={showAiModal}
        onClose={() => setShowAiModal(false)}
        projects={[project]}
      />
    </div>
  );
}
