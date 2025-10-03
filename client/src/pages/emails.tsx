import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/sidebar";
import { 
  Mail, 
  Plus, 
  Send, 
  Clock, 
  Trash2, 
  Eye,
  Calendar,
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader2
} from "lucide-react";
import { Email, insertEmailSchema } from "@shared/schema";

const sendEmailFormSchema = insertEmailSchema.extend({
  to: z.string().min(1, "At least one recipient is required"),
  cc: z.string().optional(),
  bcc: z.string().optional(),
}).omit({ userId: true, status: true, brevoMessageId: true, error: true, sentAt: true, scheduledAt: true, templateId: true, templateParams: true });

const scheduleEmailFormSchema = sendEmailFormSchema.extend({
  scheduledAt: z.string().min(1, "Scheduled date is required").refine((val) => {
    const scheduledDate = new Date(val);
    const now = new Date();
    return scheduledDate > now;
  }, "Scheduled date must be in the future")
});

type SendEmailFormData = {
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
};

type ScheduleEmailFormData = SendEmailFormData & {
  scheduledAt: string;
};

type BatchEmailEntry = {
  to: string;
  subject: string;
  htmlContent: string;
};

function getStatusBadgeVariant(status: string) {
  switch (status) {
    case 'sent':
      return 'default';
    case 'scheduled':
      return 'secondary';
    case 'failed':
      return 'destructive';
    case 'draft':
      return 'outline';
    default:
      return 'outline';
  }
}

export default function Emails() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedTab, setSelectedTab] = useState("send");
  
  // Batch send state
  const [batchEmails, setBatchEmails] = useState<BatchEmailEntry[]>([{ to: "", subject: "", htmlContent: "" }]);
  
  // Email history state
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [showEmailDetail, setShowEmailDetail] = useState(false);
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

  // Send Email Form
  const sendEmailForm = useForm<SendEmailFormData>({
    resolver: zodResolver(sendEmailFormSchema),
    defaultValues: {
      to: "",
      cc: "",
      bcc: "",
      subject: "",
      htmlContent: "",
      textContent: "",
    },
  });

  // Schedule Email Form
  const scheduleEmailForm = useForm<ScheduleEmailFormData>({
    resolver: zodResolver(scheduleEmailFormSchema),
    defaultValues: {
      to: "",
      cc: "",
      bcc: "",
      subject: "",
      htmlContent: "",
      textContent: "",
      scheduledAt: "",
    },
  });

  // Query for email history
  const { data: emailsData, isLoading: emailsLoading } = useQuery<{ emails: Email[], totalPages: number }>({
    queryKey: ['/api/emails', { status: statusFilter === 'all' ? undefined : statusFilter, page: currentPage, limit: pageLimit }],
    enabled: isAuthenticated && selectedTab === "history",
    retry: false,
  });

  const emails = emailsData?.emails || [];
  const totalPages = emailsData?.totalPages || 1;

  // Send Email Mutation
  const sendEmailMutation = useMutation({
    mutationFn: async (data: SendEmailFormData) => {
      await apiRequest("POST", "/api/emails/send", {
        to: data.to.split(',').map(e => e.trim()),
        cc: data.cc ? data.cc.split(',').map(e => e.trim()) : undefined,
        bcc: data.bcc ? data.bcc.split(',').map(e => e.trim()) : undefined,
        subject: data.subject,
        htmlContent: data.htmlContent,
        textContent: data.textContent || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/emails'] });
      sendEmailForm.reset();
      toast({
        title: "Success",
        description: "Email sent successfully!",
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
        description: "Failed to send email. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Batch Send Mutation
  const batchSendMutation = useMutation({
    mutationFn: async (emails: BatchEmailEntry[]) => {
      const response = await apiRequest("POST", "/api/emails/batch", {
        emails: emails.map(e => ({
          to: e.to.split(',').map(email => email.trim()),
          subject: e.subject,
          htmlContent: e.htmlContent,
        }))
      });
      return response;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/emails'] });
      setBatchEmails([{ to: "", subject: "", htmlContent: "" }]);
      
      const successCount = data.results?.filter((r: any) => r.success).length || 0;
      const failureCount = data.results?.filter((r: any) => !r.success).length || 0;
      
      toast({
        title: "Batch Send Complete",
        description: `Successfully sent ${successCount} emails. ${failureCount > 0 ? `${failureCount} failed.` : ''}`,
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
        description: "Failed to send batch emails. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Schedule Email Mutation
  const scheduleEmailMutation = useMutation({
    mutationFn: async (data: ScheduleEmailFormData) => {
      await apiRequest("POST", "/api/emails/schedule", {
        to: data.to.split(',').map(e => e.trim()),
        cc: data.cc ? data.cc.split(',').map(e => e.trim()) : undefined,
        bcc: data.bcc ? data.bcc.split(',').map(e => e.trim()) : undefined,
        subject: data.subject,
        htmlContent: data.htmlContent,
        textContent: data.textContent || undefined,
        scheduledAt: new Date(data.scheduledAt).toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/emails'] });
      scheduleEmailForm.reset();
      toast({
        title: "Success",
        description: "Email scheduled successfully!",
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
        description: "Failed to schedule email. Please try again.",
        variant: "destructive",
      });
    },
  });

  // View Email Details Mutation
  const viewEmailMutation = useMutation({
    mutationFn: async (emailId: string) => {
      const response = await fetch(`/api/emails/${emailId}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
    onSuccess: (data) => {
      setSelectedEmail(data);
      setShowEmailDetail(true);
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
        description: "Failed to load email details.",
        variant: "destructive",
      });
    },
  });

  const handleSendEmail = (data: SendEmailFormData) => {
    sendEmailMutation.mutate(data);
  };

  const handleScheduleEmail = (data: ScheduleEmailFormData) => {
    scheduleEmailMutation.mutate(data);
  };

  const handleBatchSend = () => {
    const validEmails = batchEmails.filter(e => e.to && e.subject && e.htmlContent);
    if (validEmails.length === 0) {
      toast({
        title: "Error",
        description: "Please fill in at least one complete email entry.",
        variant: "destructive",
      });
      return;
    }
    batchSendMutation.mutate(validEmails);
  };

  const addBatchEntry = () => {
    setBatchEmails([...batchEmails, { to: "", subject: "", htmlContent: "" }]);
  };

  const removeBatchEntry = (index: number) => {
    if (batchEmails.length > 1) {
      setBatchEmails(batchEmails.filter((_, i) => i !== index));
    }
  };

  const updateBatchEntry = (index: number, field: keyof BatchEmailEntry, value: string) => {
    const updated = [...batchEmails];
    updated[index][field] = value;
    setBatchEmails(updated);
  };

  const handleViewEmail = (emailId: string) => {
    viewEmailMutation.mutate(emailId);
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
        currentPath="/emails"
      />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Mail className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-semibold text-card-foreground" data-testid="text-page-title">
                Email Management
              </h1>
            </div>
          </div>
        </header>

        {/* Email Management Content */}
        <div className="flex-1 overflow-auto p-6">
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full" data-testid="tabs-email-management">
            <TabsList className="grid w-full max-w-2xl grid-cols-4 mb-6" data-testid="tabs-list">
              <TabsTrigger value="send" data-testid="tab-send-email">
                <Send className="h-4 w-4 mr-2" />
                Send Email
              </TabsTrigger>
              <TabsTrigger value="batch" data-testid="tab-batch-send">
                <Mail className="h-4 w-4 mr-2" />
                Batch Send
              </TabsTrigger>
              <TabsTrigger value="schedule" data-testid="tab-schedule-email">
                <Clock className="h-4 w-4 mr-2" />
                Schedule
              </TabsTrigger>
              <TabsTrigger value="history" data-testid="tab-email-history">
                <Calendar className="h-4 w-4 mr-2" />
                History
              </TabsTrigger>
            </TabsList>

            {/* Send Email Tab */}
            <TabsContent value="send" data-testid="content-send-email">
              <Card>
                <CardHeader>
                  <CardTitle>Send Email</CardTitle>
                  <CardDescription>Send a single email to one or more recipients</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...sendEmailForm}>
                    <form onSubmit={sendEmailForm.handleSubmit(handleSendEmail)} className="space-y-4">
                      <FormField
                        control={sendEmailForm.control}
                        name="to"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>To (comma-separated)</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="recipient1@example.com, recipient2@example.com" 
                                {...field}
                                data-testid="input-to"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={sendEmailForm.control}
                          name="cc"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>CC (optional)</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="cc@example.com" 
                                  {...field}
                                  data-testid="input-cc"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={sendEmailForm.control}
                          name="bcc"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>BCC (optional)</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="bcc@example.com" 
                                  {...field}
                                  data-testid="input-bcc"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={sendEmailForm.control}
                        name="subject"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Subject</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Email subject" 
                                {...field}
                                data-testid="input-subject"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={sendEmailForm.control}
                        name="htmlContent"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>HTML Content</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Email content (HTML supported)" 
                                rows={8}
                                {...field}
                                data-testid="textarea-html-content"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={sendEmailForm.control}
                        name="textContent"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Text Content (optional)</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Plain text version (optional)" 
                                rows={4}
                                {...field}
                                data-testid="textarea-text-content"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button 
                        type="submit" 
                        disabled={sendEmailMutation.isPending}
                        data-testid="button-send-email"
                      >
                        {sendEmailMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 h-4 w-4" />
                            Send Email
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
                  <CardTitle>Batch Send Emails</CardTitle>
                  <CardDescription>Send multiple emails at once</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {batchEmails.map((email, index) => (
                    <Card key={index} className="p-4" data-testid={`card-batch-email-${index}`}>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-medium">Email {index + 1}</h3>
                          {batchEmails.length > 1 && (
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
                          <Label htmlFor={`batch-to-${index}`}>To (comma-separated)</Label>
                          <Input
                            id={`batch-to-${index}`}
                            value={email.to}
                            onChange={(e) => updateBatchEntry(index, 'to', e.target.value)}
                            placeholder="recipient@example.com"
                            data-testid={`input-batch-to-${index}`}
                          />
                        </div>

                        <div>
                          <Label htmlFor={`batch-subject-${index}`}>Subject</Label>
                          <Input
                            id={`batch-subject-${index}`}
                            value={email.subject}
                            onChange={(e) => updateBatchEntry(index, 'subject', e.target.value)}
                            placeholder="Email subject"
                            data-testid={`input-batch-subject-${index}`}
                          />
                        </div>

                        <div>
                          <Label htmlFor={`batch-content-${index}`}>HTML Content</Label>
                          <Textarea
                            id={`batch-content-${index}`}
                            value={email.htmlContent}
                            onChange={(e) => updateBatchEntry(index, 'htmlContent', e.target.value)}
                            placeholder="Email content"
                            rows={4}
                            data-testid={`textarea-batch-content-${index}`}
                          />
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
                      Add Another Email
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
                          Send All Emails
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Schedule Email Tab */}
            <TabsContent value="schedule" data-testid="content-schedule-email">
              <Card>
                <CardHeader>
                  <CardTitle>Schedule Email</CardTitle>
                  <CardDescription>Schedule an email to be sent at a future date and time</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...scheduleEmailForm}>
                    <form onSubmit={scheduleEmailForm.handleSubmit(handleScheduleEmail)} className="space-y-4">
                      <FormField
                        control={scheduleEmailForm.control}
                        name="to"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>To (comma-separated)</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="recipient1@example.com, recipient2@example.com" 
                                {...field}
                                data-testid="input-schedule-to"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={scheduleEmailForm.control}
                          name="cc"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>CC (optional)</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="cc@example.com" 
                                  {...field}
                                  data-testid="input-schedule-cc"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={scheduleEmailForm.control}
                          name="bcc"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>BCC (optional)</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="bcc@example.com" 
                                  {...field}
                                  data-testid="input-schedule-bcc"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={scheduleEmailForm.control}
                        name="subject"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Subject</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Email subject" 
                                {...field}
                                data-testid="input-schedule-subject"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={scheduleEmailForm.control}
                        name="scheduledAt"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Schedule Date & Time</FormLabel>
                            <FormControl>
                              <Input 
                                type="datetime-local"
                                {...field}
                                data-testid="input-scheduled-at"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={scheduleEmailForm.control}
                        name="htmlContent"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>HTML Content</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Email content (HTML supported)" 
                                rows={8}
                                {...field}
                                data-testid="textarea-schedule-html-content"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={scheduleEmailForm.control}
                        name="textContent"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Text Content (optional)</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Plain text version (optional)" 
                                rows={4}
                                {...field}
                                data-testid="textarea-schedule-text-content"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button 
                        type="submit" 
                        disabled={scheduleEmailMutation.isPending}
                        data-testid="button-schedule-email"
                      >
                        {scheduleEmailMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Scheduling...
                          </>
                        ) : (
                          <>
                            <Clock className="mr-2 h-4 w-4" />
                            Schedule Email
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Email History Tab */}
            <TabsContent value="history" data-testid="content-email-history">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Email History</CardTitle>
                      <CardDescription>View and manage your sent and scheduled emails</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-muted-foreground" />
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[150px]" data-testid="select-status-filter">
                          <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all" data-testid="filter-all">All</SelectItem>
                          <SelectItem value="draft" data-testid="filter-draft">Draft</SelectItem>
                          <SelectItem value="scheduled" data-testid="filter-scheduled">Scheduled</SelectItem>
                          <SelectItem value="sent" data-testid="filter-sent">Sent</SelectItem>
                          <SelectItem value="failed" data-testid="filter-failed">Failed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {emailsLoading ? (
                    <div className="flex items-center justify-center py-8" data-testid="loading-emails">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : emails.length === 0 ? (
                    <div className="text-center py-8" data-testid="text-no-emails">
                      <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-card-foreground mb-2">No emails found</h3>
                      <p className="text-muted-foreground">Send your first email to see it here</p>
                    </div>
                  ) : (
                    <>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Recipient</TableHead>
                            <TableHead>Subject</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {emails.map((email: Email) => (
                            <TableRow key={email.id} data-testid={`row-email-${email.id}`}>
                              <TableCell className="font-medium" data-testid={`cell-recipient-${email.id}`}>
                                {Array.isArray(email.to) ? email.to[0] : email.to}
                                {Array.isArray(email.to) && email.to.length > 1 && (
                                  <span className="text-xs text-muted-foreground ml-1">
                                    +{email.to.length - 1} more
                                  </span>
                                )}
                              </TableCell>
                              <TableCell data-testid={`cell-subject-${email.id}`}>
                                {email.subject}
                              </TableCell>
                              <TableCell>
                                <Badge variant={getStatusBadgeVariant(email.status)} data-testid={`badge-status-${email.id}`}>
                                  {email.status}
                                </Badge>
                              </TableCell>
                              <TableCell data-testid={`cell-date-${email.id}`}>
                                {email.sentAt 
                                  ? new Date(email.sentAt).toLocaleString()
                                  : email.scheduledAt
                                  ? new Date(email.scheduledAt).toLocaleString()
                                  : email.createdAt
                                  ? new Date(email.createdAt).toLocaleString()
                                  : 'N/A'
                                }
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewEmail(email.id)}
                                  data-testid={`button-view-${email.id}`}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>

                      {/* Pagination */}
                      <div className="flex items-center justify-between mt-4">
                        <p className="text-sm text-muted-foreground" data-testid="text-pagination-info">
                          Page {currentPage} of {totalPages}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            data-testid="button-previous-page"
                          >
                            <ChevronLeft className="h-4 w-4" />
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
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Email Detail Modal */}
      <Dialog open={showEmailDetail} onOpenChange={setShowEmailDetail}>
        <DialogContent className="max-w-2xl" data-testid="dialog-email-detail">
          <DialogHeader>
            <DialogTitle>Email Details</DialogTitle>
            <DialogDescription>View complete email information</DialogDescription>
          </DialogHeader>
          {selectedEmail && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Status</Label>
                <div className="mt-1">
                  <Badge variant={getStatusBadgeVariant(selectedEmail.status)} data-testid="detail-status">
                    {selectedEmail.status}
                  </Badge>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">To</Label>
                <p className="text-sm mt-1" data-testid="detail-to">
                  {Array.isArray(selectedEmail.to) ? selectedEmail.to.join(', ') : selectedEmail.to}
                </p>
              </div>

              {selectedEmail.cc && selectedEmail.cc.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">CC</Label>
                  <p className="text-sm mt-1" data-testid="detail-cc">
                    {Array.isArray(selectedEmail.cc) ? selectedEmail.cc.join(', ') : selectedEmail.cc}
                  </p>
                </div>
              )}

              {selectedEmail.bcc && selectedEmail.bcc.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">BCC</Label>
                  <p className="text-sm mt-1" data-testid="detail-bcc">
                    {Array.isArray(selectedEmail.bcc) ? selectedEmail.bcc.join(', ') : selectedEmail.bcc}
                  </p>
                </div>
              )}

              <div>
                <Label className="text-sm font-medium">Subject</Label>
                <p className="text-sm mt-1" data-testid="detail-subject">{selectedEmail.subject}</p>
              </div>

              <div>
                <Label className="text-sm font-medium">Content</Label>
                <div 
                  className="text-sm mt-1 p-4 bg-muted rounded-lg max-h-64 overflow-auto"
                  dangerouslySetInnerHTML={{ __html: selectedEmail.htmlContent }}
                  data-testid="detail-content"
                />
              </div>

              {selectedEmail.scheduledAt && (
                <div>
                  <Label className="text-sm font-medium">Scheduled At</Label>
                  <p className="text-sm mt-1" data-testid="detail-scheduled-at">
                    {new Date(selectedEmail.scheduledAt).toLocaleString()}
                  </p>
                </div>
              )}

              {selectedEmail.sentAt && (
                <div>
                  <Label className="text-sm font-medium">Sent At</Label>
                  <p className="text-sm mt-1" data-testid="detail-sent-at">
                    {new Date(selectedEmail.sentAt).toLocaleString()}
                  </p>
                </div>
              )}

              {selectedEmail.error && (
                <div>
                  <Label className="text-sm font-medium text-destructive">Error</Label>
                  <p className="text-sm mt-1 text-destructive" data-testid="detail-error">
                    {selectedEmail.error}
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
