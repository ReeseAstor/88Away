import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Sidebar from "@/components/sidebar";
import { 
  MessageSquare,
  Plus, 
  Send, 
  Trash2, 
  Eye,
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader2
} from "lucide-react";
import { Sms, insertSmsSchema } from "@shared/schema";

const sendSmsFormSchema = insertSmsSchema.extend({
  recipient: z.string().min(1, "Recipient phone number is required"),
  message: z.string().min(1, "Message is required").max(160, "Message must be 160 characters or less"),
}).omit({ userId: true, status: true, brevoMessageId: true, error: true, sentAt: true });

type SendSmsFormData = {
  recipient: string;
  message: string;
  sender?: string;
};

type BatchSmsEntry = {
  recipient: string;
  message: string;
};

function getStatusBadgeVariant(status: string) {
  switch (status) {
    case 'sent':
      return 'default';
    case 'failed':
      return 'destructive';
    default:
      return 'outline';
  }
}

export default function SmsPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedTab, setSelectedTab] = useState("send");
  
  // Batch send state
  const [batchMessages, setBatchMessages] = useState<BatchSmsEntry[]>([{ recipient: "", message: "" }]);
  
  // SMS history state
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSms, setSelectedSms] = useState<Sms | null>(null);
  const [showSmsDetail, setShowSmsDetail] = useState(false);
  const pageLimit = 10;

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

  // Send SMS Form
  const sendSmsForm = useForm<SendSmsFormData>({
    resolver: zodResolver(sendSmsFormSchema),
    defaultValues: {
      recipient: "",
      message: "",
      sender: "",
    },
  });

  // Query for SMS history
  const { data: smsData, isLoading: smsLoading } = useQuery<{ sms: Sms[], totalPages: number, currentPage: number }>({
    queryKey: ['/api/sms', { status: statusFilter === 'all' ? undefined : statusFilter, page: currentPage, limit: pageLimit }],
    enabled: isAuthenticated && selectedTab === "history",
    retry: false,
  });

  const smsList = smsData?.sms || [];
  const totalPages = smsData?.totalPages || 1;

  // Send SMS Mutation
  const sendSmsMutation = useMutation({
    mutationFn: async (data: SendSmsFormData) => {
      await apiRequest("POST", "/api/sms/send", {
        recipient: data.recipient,
        message: data.message,
        sender: data.sender || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sms'] });
      sendSmsForm.reset();
      toast({
        title: "Success",
        description: "SMS sent successfully!",
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
        description: "Failed to send SMS. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Batch Send Mutation
  const batchSendMutation = useMutation({
    mutationFn: async (messages: BatchSmsEntry[]) => {
      const response = await apiRequest("POST", "/api/sms/batch", {
        messages: messages.map(m => ({
          recipient: m.recipient,
          message: m.message,
        }))
      });
      return response;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/sms'] });
      setBatchMessages([{ recipient: "", message: "" }]);
      
      const successCount = data.results?.filter((r: any) => r.success).length || 0;
      const failureCount = data.results?.filter((r: any) => !r.success).length || 0;
      
      toast({
        title: "Batch Send Complete",
        description: `Successfully sent ${successCount} messages. ${failureCount > 0 ? `${failureCount} failed.` : ''}`,
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
        description: "Failed to send batch SMS. Please try again.",
        variant: "destructive",
      });
    },
  });

  // View SMS Details Mutation
  const viewSmsMutation = useMutation({
    mutationFn: async (smsId: number) => {
      const response = await fetch(`/api/sms/${smsId}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
    onSuccess: (data) => {
      setSelectedSms(data);
      setShowSmsDetail(true);
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
        description: "Failed to load SMS details.",
        variant: "destructive",
      });
    },
  });

  const handleSendSms = (data: SendSmsFormData) => {
    sendSmsMutation.mutate(data);
  };

  const handleBatchSend = () => {
    const validMessages = batchMessages.filter(m => m.recipient && m.message);
    if (validMessages.length === 0) {
      toast({
        title: "Error",
        description: "Please fill in at least one complete SMS entry.",
        variant: "destructive",
      });
      return;
    }
    batchSendMutation.mutate(validMessages);
  };

  const addBatchEntry = () => {
    setBatchMessages([...batchMessages, { recipient: "", message: "" }]);
  };

  const removeBatchEntry = (index: number) => {
    if (batchMessages.length > 1) {
      setBatchMessages(batchMessages.filter((_, i) => i !== index));
    }
  };

  const updateBatchEntry = (index: number, field: keyof BatchSmsEntry, value: string) => {
    const updated = [...batchMessages];
    updated[index][field] = value;
    setBatchMessages(updated);
  };

  const handleViewSms = (smsId: number) => {
    viewSmsMutation.mutate(smsId);
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
        currentPath="/sms"
      />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <MessageSquare className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-semibold text-card-foreground" data-testid="text-page-title">
                SMS Management
              </h1>
            </div>
          </div>
        </header>

        {/* SMS Management Content */}
        <div className="flex-1 overflow-auto p-6">
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full" data-testid="tabs-sms-management">
            <TabsList className="grid w-full max-w-2xl grid-cols-3 mb-6" data-testid="tabs-list">
              <TabsTrigger value="send" data-testid="tab-send-sms">
                <Send className="h-4 w-4 mr-2" />
                Send SMS
              </TabsTrigger>
              <TabsTrigger value="batch" data-testid="tab-batch-send">
                <MessageSquare className="h-4 w-4 mr-2" />
                Batch Send
              </TabsTrigger>
              <TabsTrigger value="history" data-testid="tab-sms-history">
                <Filter className="h-4 w-4 mr-2" />
                History
              </TabsTrigger>
            </TabsList>

            {/* Send SMS Tab */}
            <TabsContent value="send" data-testid="content-send-sms">
              <Card>
                <CardHeader>
                  <CardTitle>Send SMS</CardTitle>
                  <CardDescription>Send a single SMS to a recipient</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...sendSmsForm}>
                    <form onSubmit={sendSmsForm.handleSubmit(handleSendSms)} className="space-y-4">
                      <FormField
                        control={sendSmsForm.control}
                        name="recipient"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Recipient Phone Number</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="+1234567890" 
                                {...field}
                                data-testid="input-recipient"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={sendSmsForm.control}
                        name="sender"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sender (optional)</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Your Name or Number" 
                                {...field}
                                data-testid="input-sender"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={sendSmsForm.control}
                        name="message"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Message (max 160 characters)</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Your SMS message" 
                                rows={4}
                                maxLength={160}
                                {...field}
                                data-testid="textarea-message"
                              />
                            </FormControl>
                            <div className="text-sm text-muted-foreground">
                              {field.value?.length || 0}/160 characters
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button 
                        type="submit" 
                        disabled={sendSmsMutation.isPending}
                        data-testid="button-send-sms"
                      >
                        {sendSmsMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 h-4 w-4" />
                            Send SMS
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Batch Send Tab */}
            <TabsContent value="batch" data-testid="content-batch-send">
              <Card>
                <CardHeader>
                  <CardTitle>Batch Send SMS</CardTitle>
                  <CardDescription>Send multiple SMS messages at once</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {batchMessages.map((msg, index) => (
                    <Card key={index} className="p-4" data-testid={`card-batch-sms-${index}`}>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-medium">Message {index + 1}</h3>
                          {batchMessages.length > 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeBatchEntry(index)}
                              data-testid={`button-remove-batch-${index}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        <div>
                          <Label htmlFor={`batch-recipient-${index}`}>Recipient Phone Number</Label>
                          <Input
                            id={`batch-recipient-${index}`}
                            value={msg.recipient}
                            onChange={(e) => updateBatchEntry(index, 'recipient', e.target.value)}
                            placeholder="+1234567890"
                            data-testid={`input-batch-recipient-${index}`}
                          />
                        </div>

                        <div>
                          <Label htmlFor={`batch-message-${index}`}>Message (max 160 characters)</Label>
                          <Textarea
                            id={`batch-message-${index}`}
                            value={msg.message}
                            onChange={(e) => updateBatchEntry(index, 'message', e.target.value)}
                            placeholder="SMS message"
                            rows={3}
                            maxLength={160}
                            data-testid={`textarea-batch-message-${index}`}
                          />
                          <div className="text-sm text-muted-foreground mt-1">
                            {msg.message?.length || 0}/160 characters
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={addBatchEntry}
                      data-testid="button-add-batch-entry"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Another Message
                    </Button>

                    <Button
                      onClick={handleBatchSend}
                      disabled={batchSendMutation.isPending}
                      data-testid="button-send-batch"
                    >
                      {batchSendMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Send All Messages
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* SMS History Tab */}
            <TabsContent value="history" data-testid="content-sms-history">
              <Card>
                <CardHeader>
                  <CardTitle>SMS History</CardTitle>
                  <CardDescription>View and filter your sent SMS messages</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="status-filter">Status:</Label>
                      <Select 
                        value={statusFilter} 
                        onValueChange={setStatusFilter}
                      >
                        <SelectTrigger className="w-[180px]" id="status-filter" data-testid="select-status-filter">
                          <SelectValue placeholder="All statuses" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all" data-testid="filter-all">All</SelectItem>
                          <SelectItem value="sent" data-testid="filter-sent">Sent</SelectItem>
                          <SelectItem value="failed" data-testid="filter-failed">Failed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {smsLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : smsList.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No SMS messages found
                    </div>
                  ) : (
                    <>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Recipient</TableHead>
                            <TableHead>Message</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Sent At</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {smsList.map((sms) => (
                            <TableRow key={sms.id} data-testid={`row-sms-${sms.id}`}>
                              <TableCell className="font-medium" data-testid={`cell-recipient-${sms.id}`}>
                                {sms.recipient}
                              </TableCell>
                              <TableCell className="max-w-md truncate" data-testid={`cell-message-${sms.id}`}>
                                {sms.message}
                              </TableCell>
                              <TableCell>
                                <Badge variant={getStatusBadgeVariant(sms.status)} data-testid={`badge-status-${sms.id}`}>
                                  {sms.status}
                                </Badge>
                              </TableCell>
                              <TableCell data-testid={`cell-sent-at-${sms.id}`}>
                                {sms.sentAt ? new Date(sms.sentAt).toLocaleString() : '-'}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewSms(sms.id)}
                                  data-testid={`button-view-${sms.id}`}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>

                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4">
                          <div className="text-sm text-muted-foreground">
                            Page {currentPage} of {totalPages}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                              disabled={currentPage === 1}
                              data-testid="button-prev-page"
                            >
                              <ChevronLeft className="h-4 w-4 mr-1" />
                              Previous
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                              disabled={currentPage === totalPages}
                              data-testid="button-next-page"
                            >
                              Next
                              <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* SMS Detail Dialog */}
      <Dialog open={showSmsDetail} onOpenChange={setShowSmsDetail}>
        <DialogContent data-testid="dialog-sms-detail">
          <DialogHeader>
            <DialogTitle>SMS Details</DialogTitle>
            <DialogDescription>View complete SMS information</DialogDescription>
          </DialogHeader>
          {selectedSms && (
            <div className="space-y-4">
              <div>
                <Label className="font-semibold">Recipient</Label>
                <p className="mt-1" data-testid="detail-recipient">{selectedSms.recipient}</p>
              </div>
              {selectedSms.sender && (
                <div>
                  <Label className="font-semibold">Sender</Label>
                  <p className="mt-1" data-testid="detail-sender">{selectedSms.sender}</p>
                </div>
              )}
              <div>
                <Label className="font-semibold">Message</Label>
                <p className="mt-1 whitespace-pre-wrap" data-testid="detail-message">{selectedSms.message}</p>
              </div>
              <div>
                <Label className="font-semibold">Status</Label>
                <div className="mt-1">
                  <Badge variant={getStatusBadgeVariant(selectedSms.status)} data-testid="detail-status">
                    {selectedSms.status}
                  </Badge>
                </div>
              </div>
              {selectedSms.sentAt && (
                <div>
                  <Label className="font-semibold">Sent At</Label>
                  <p className="mt-1" data-testid="detail-sent-at">
                    {new Date(selectedSms.sentAt).toLocaleString()}
                  </p>
                </div>
              )}
              {selectedSms.error && (
                <div>
                  <Label className="font-semibold text-destructive">Error</Label>
                  <p className="mt-1 text-destructive" data-testid="detail-error">{selectedSms.error}</p>
                </div>
              )}
              {selectedSms.brevoMessageId && (
                <div>
                  <Label className="font-semibold">Brevo Message ID</Label>
                  <p className="mt-1 text-sm font-mono" data-testid="detail-brevo-id">
                    {selectedSms.brevoMessageId}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
