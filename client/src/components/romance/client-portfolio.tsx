import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Building2, Users, BookOpen, DollarSign, TrendingUp, Calendar, Mail, Phone, Plus, Edit, Eye, Download, BarChart3, FileText, Heart, Star } from 'lucide-react';

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  type: 'author' | 'publisher' | 'agency';
  status: 'active' | 'inactive' | 'pending';
  joinDate: Date;
  totalBooks: number;
  totalRevenue: number;
  activeProjects: number;
  contractEndDate?: Date;
  preferredGenres: string[];
  communicationPreference: 'email' | 'phone' | 'slack' | 'teams';
  notes: string;
}

interface Project {
  id: string;
  clientId: string;
  title: string;
  status: 'planning' | 'writing' | 'editing' | 'publishing' | 'marketed' | 'completed';
  progress: number;
  deadline: Date;
  revenue: number;
  genre: string;
  heatLevel: number;
  assignedTeam: string[];
  lastUpdate: Date;
}

interface ClientPortfolioProps {
  onClientSelect?: (client: Client) => void;
  onProjectUpdate?: (project: Project) => void;
}

const mockClients: Client[] = [
  {
    id: '1',
    name: 'Sarah Martinez',
    email: 'sarah@romanceauthor.com',
    phone: '+1-555-0123',
    type: 'author',
    status: 'active',
    joinDate: new Date('2023-01-15'),
    totalBooks: 12,
    totalRevenue: 45800,
    activeProjects: 3,
    contractEndDate: new Date('2024-12-31'),
    preferredGenres: ['Contemporary Romance', 'Romantic Suspense'],
    communicationPreference: 'email',
    notes: 'Specializes in billionaire romance. Very responsive to feedback.'
  },
  {
    id: '2',
    name: 'Midnight Publishing',
    email: 'contact@midnightpub.com',
    phone: '+1-555-0124',
    type: 'publisher',
    status: 'active',
    joinDate: new Date('2022-08-10'),
    totalBooks: 156,
    totalRevenue: 298500,
    activeProjects: 24,
    preferredGenres: ['Paranormal Romance', 'Dark Romance', 'Erotic Romance'],
    communicationPreference: 'slack',
    notes: 'Large publisher focusing on steamy romance. Quarterly review meetings.'
  },
  {
    id: '3',
    name: 'Elena Rodriguez',
    email: 'elena@heartstrings.com',
    phone: '+1-555-0125',
    type: 'author',
    status: 'active',
    joinDate: new Date('2023-06-20'),
    totalBooks: 8,
    totalRevenue: 28900,
    activeProjects: 2,
    contractEndDate: new Date('2025-06-20'),
    preferredGenres: ['Historical Romance', 'Clean Romance'],
    communicationPreference: 'phone',
    notes: 'Award-winning historical romance author. Prefers detailed editorial feedback.'
  }
];

const mockProjects: Project[] = [
  {
    id: '1',
    clientId: '1',
    title: 'CEO\'s Second Chance',
    status: 'editing',
    progress: 75,
    deadline: new Date('2024-03-15'),
    revenue: 8500,
    genre: 'Contemporary Romance',
    heatLevel: 4,
    assignedTeam: ['Editor: Jake', 'Cover: Maria'],
    lastUpdate: new Date('2024-01-20')
  },
  {
    id: '2',
    clientId: '1',
    title: 'Bodyguard\'s Desire',
    status: 'writing',
    progress: 40,
    deadline: new Date('2024-05-01'),
    revenue: 9200,
    genre: 'Romantic Suspense',
    heatLevel: 5,
    assignedTeam: ['Ghostwriter: Alex'],
    lastUpdate: new Date('2024-01-18')
  },
  {
    id: '3',
    clientId: '2',
    title: 'Vampire\'s Awakening',
    status: 'publishing',
    progress: 90,
    deadline: new Date('2024-02-28'),
    revenue: 15000,
    genre: 'Paranormal Romance',
    heatLevel: 5,
    assignedTeam: ['KDP Specialist: Sam', 'Marketing: Lisa'],
    lastUpdate: new Date('2024-01-22')
  }
];

export const ClientPortfolio: React.FC<ClientPortfolioProps> = ({
  onClientSelect,
  onProjectUpdate
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [clients, setClients] = useState<Client[]>(mockClients);
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showAddClientDialog, setShowAddClientDialog] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [newClient, setNewClient] = useState<Partial<Client>>({
    name: '',
    email: '',
    phone: '',
    type: 'author',
    status: 'pending',
    preferredGenres: [],
    communicationPreference: 'email',
    notes: ''
  });

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || client.status === filterStatus;
    const matchesType = filterType === 'all' || client.type === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  const getClientProjects = (clientId: string) => {
    return projects.filter(project => project.clientId === clientId);
  };

  const calculateClientStats = () => {
    const totalRevenue = clients.reduce((sum, client) => sum + client.totalRevenue, 0);
    const totalBooks = clients.reduce((sum, client) => sum + client.totalBooks, 0);
    const activeClients = clients.filter(client => client.status === 'active').length;
    const activeProjects = projects.filter(project => project.status !== 'completed').length;

    return { totalRevenue, totalBooks, activeClients, activeProjects };
  };

  const handleAddClient = () => {
    const client: Client = {
      id: Date.now().toString(),
      ...newClient as Client,
      joinDate: new Date(),
      totalBooks: 0,
      totalRevenue: 0,
      activeProjects: 0
    };
    
    setClients(prev => [...prev, client]);
    setShowAddClientDialog(false);
    setNewClient({
      name: '',
      email: '',
      phone: '',
      type: 'author',
      status: 'pending',
      preferredGenres: [],
      communicationPreference: 'email',
      notes: ''
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProjectStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-blue-100 text-blue-800';
      case 'writing': return 'bg-purple-100 text-purple-800';
      case 'editing': return 'bg-orange-100 text-orange-800';
      case 'publishing': return 'bg-green-100 text-green-800';
      case 'marketed': return 'bg-pink-100 text-pink-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const stats = calculateClientStats();

  return (
    <div className="space-y-6">
      <Card className="border-romance-primary/20">
        <CardHeader className="bg-gradient-to-r from-romance-primary/5 to-romance-secondary/5">
          <CardTitle className="flex items-center gap-2 text-romance-text">
            <Building2 className="h-5 w-5 text-romance-accent" />
            Client Portfolio Management
          </CardTitle>
          <div className="grid grid-cols-4 gap-4 mt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-romance-primary">{stats.activeClients}</div>
              <div className="text-sm text-romance-muted">Active Clients</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-romance-primary">{stats.activeProjects}</div>
              <div className="text-sm text-romance-muted">Active Projects</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-romance-primary">{stats.totalBooks}</div>
              <div className="text-sm text-romance-muted">Total Books</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-romance-primary">${stats.totalRevenue.toLocaleString()}</div>
              <div className="text-sm text-romance-muted">Total Revenue</div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="clients">Clients</TabsTrigger>
              <TabsTrigger value="projects">Projects</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-romance-accent/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Recent Client Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {clients.slice(0, 5).map((client) => (
                      <div key={client.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={client.avatar} />
                            <AvatarFallback>{client.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-sm">{client.name}</div>
                            <div className="text-xs text-romance-muted">{client.type}</div>
                          </div>
                        </div>
                        <Badge className={`text-xs ${getStatusColor(client.status)}`}>
                          {client.status}
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="border-romance-accent/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      Active Projects
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {projects.filter(p => p.status !== 'completed').slice(0, 5).map((project) => (
                      <div key={project.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="font-medium text-sm">{project.title}</div>
                          <Badge className={`text-xs ${getProjectStatusColor(project.status)}`}>
                            {project.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={project.progress} className="flex-1 h-2" />
                          <span className="text-xs text-romance-muted">{project.progress}%</span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="clients" className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex gap-3">
                  <Input
                    placeholder="Search clients..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="author">Authors</SelectItem>
                      <SelectItem value="publisher">Publishers</SelectItem>
                      <SelectItem value="agency">Agencies</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Dialog open={showAddClientDialog} onOpenChange={setShowAddClientDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-romance-primary hover:bg-romance-primary/90">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Client
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Client</DialogTitle>
                      <DialogDescription>Create a new client profile for your romance publishing portfolio.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="name">Name</Label>
                          <Input
                            id="name"
                            value={newClient.name}
                            onChange={(e) => setNewClient(prev => ({ ...prev, name: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="type">Type</Label>
                          <Select value={newClient.type} onValueChange={(value: any) => setNewClient(prev => ({ ...prev, type: value }))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="author">Author</SelectItem>
                              <SelectItem value="publisher">Publisher</SelectItem>
                              <SelectItem value="agency">Agency</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={newClient.email}
                            onChange={(e) => setNewClient(prev => ({ ...prev, email: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="phone">Phone</Label>
                          <Input
                            id="phone"
                            value={newClient.phone}
                            onChange={(e) => setNewClient(prev => ({ ...prev, phone: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                          id="notes"
                          value={newClient.notes}
                          onChange={(e) => setNewClient(prev => ({ ...prev, notes: e.target.value }))}
                          rows={3}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleAddClient} className="bg-romance-primary hover:bg-romance-primary/90">
                        Add Client
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid gap-4">
                {filteredClients.map((client) => (
                  <Card 
                    key={client.id} 
                    className="border-romance-accent/20 hover:border-romance-primary/50 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedClient(client);
                      onClientSelect?.(client);
                    }}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={client.avatar} />
                            <AvatarFallback>{client.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold text-lg">{client.name}</h3>
                            <div className="flex items-center gap-4 text-sm text-romance-muted">
                              <div className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {client.email}
                              </div>
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {client.phone}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={`mb-2 ${getStatusColor(client.status)}`}>
                            {client.status}
                          </Badge>
                          <div className="text-sm text-romance-muted capitalize">{client.type}</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-4 mt-4">
                        <div className="text-center">
                          <div className="text-lg font-semibold text-romance-primary">{client.totalBooks}</div>
                          <div className="text-xs text-romance-muted">Books</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-romance-primary">${client.totalRevenue.toLocaleString()}</div>
                          <div className="text-xs text-romance-muted">Revenue</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-romance-primary">{client.activeProjects}</div>
                          <div className="text-xs text-romance-muted">Active</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-romance-primary">{client.preferredGenres.length}</div>
                          <div className="text-xs text-romance-muted">Genres</div>
                        </div>
                      </div>
                      
                      {client.preferredGenres.length > 0 && (
                        <div className="mt-3">
                          <div className="flex flex-wrap gap-2">
                            {client.preferredGenres.slice(0, 3).map((genre, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {genre}
                              </Badge>
                            ))}
                            {client.preferredGenres.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{client.preferredGenres.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="projects" className="space-y-6">
              <div className="grid gap-4">
                {projects.map((project) => {
                  const client = clients.find(c => c.id === project.clientId);
                  return (
                    <Card key={project.id} className="border-romance-accent/20">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="font-semibold text-lg">{project.title}</h3>
                            <p className="text-sm text-romance-muted">Client: {client?.name}</p>
                          </div>
                          <div className="text-right">
                            <Badge className={`mb-1 ${getProjectStatusColor(project.status)}`}>
                              {project.status}
                            </Badge>
                            <div className="text-sm text-romance-muted">{project.genre}</div>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span>Progress</span>
                              <span>{project.progress}%</span>
                            </div>
                            <Progress value={project.progress} />
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-romance-muted">Deadline:</span>
                              <div className="font-medium">{project.deadline.toLocaleDateString()}</div>
                            </div>
                            <div>
                              <span className="text-romance-muted">Revenue:</span>
                              <div className="font-medium">${project.revenue.toLocaleString()}</div>
                            </div>
                            <div>
                              <span className="text-romance-muted">Heat Level:</span>
                              <div className="font-medium flex items-center gap-1">
                                {Array.from({ length: project.heatLevel }, (_, i) => (
                                  <Heart key={i} className="h-3 w-3 fill-romance-accent text-romance-accent" />
                                ))}
                              </div>
                            </div>
                          </div>
                          
                          {project.assignedTeam.length > 0 && (
                            <div>
                              <span className="text-sm text-romance-muted">Team:</span>
                              <div className="flex flex-wrap gap-2 mt-1">
                                {project.assignedTeam.map((member, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {member}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-romance-accent/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Revenue by Client Type
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {['author', 'publisher', 'agency'].map((type) => {
                        const typeClients = clients.filter(c => c.type === type);
                        const typeRevenue = typeClients.reduce((sum, c) => sum + c.totalRevenue, 0);
                        const percentage = stats.totalRevenue > 0 ? (typeRevenue / stats.totalRevenue) * 100 : 0;
                        
                        return (
                          <div key={type}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="capitalize">{type}s</span>
                              <span>${typeRevenue.toLocaleString()}</span>
                            </div>
                            <Progress value={percentage} />
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-romance-accent/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Project Status Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {['planning', 'writing', 'editing', 'publishing', 'marketed', 'completed'].map((status) => {
                        const statusProjects = projects.filter(p => p.status === status);
                        const percentage = projects.length > 0 ? (statusProjects.length / projects.length) * 100 : 0;
                        
                        return (
                          <div key={status}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="capitalize">{status}</span>
                              <span>{statusProjects.length} projects</span>
                            </div>
                            <Progress value={percentage} />
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};