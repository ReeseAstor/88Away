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
import { Switch } from '@/components/ui/switch';
import { Users, UserPlus, MessageCircle, FileText, Clock, CheckCircle, AlertCircle, Shield, Edit, Trash2, Heart, Star } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'editor' | 'writer' | 'cover_designer' | 'marketer' | 'client';
  status: 'active' | 'inactive' | 'pending';
  permissions: string[];
  joinDate: Date;
  lastActive: Date;
  specialties: string[];
  workload: number; // 0-100
}

interface Project {
  id: string;
  name: string;
  client: string;
  status: 'planning' | 'active' | 'review' | 'completed';
  deadline: Date;
  progress: number;
  assignedMembers: string[];
  genre: string;
  heatLevel: number;
}

interface Activity {
  id: string;
  userId: string;
  userName: string;
  action: string;
  target: string;
  timestamp: Date;
  type: 'edit' | 'comment' | 'approval' | 'assignment' | 'milestone';
}

interface TeamCollaborationProps {
  projectId?: string;
  onMemberAdd?: (member: TeamMember) => void;
  onProjectUpdate?: (project: Project) => void;
}

const rolePermissions = {
  admin: ['all'],
  editor: ['edit_content', 'review_drafts', 'approve_changes', 'manage_deadlines'],
  writer: ['edit_content', 'upload_drafts', 'view_feedback'],
  cover_designer: ['upload_covers', 'edit_graphics', 'view_briefs'],
  marketer: ['create_campaigns', 'manage_metadata', 'track_performance'],
  client: ['view_progress', 'approve_final', 'request_changes']
};

const mockTeamMembers: TeamMember[] = [
  {
    id: '1',
    name: 'Sarah Chen',
    email: 'sarah@romanceteam.com',
    role: 'admin',
    status: 'active',
    permissions: ['all'],
    joinDate: new Date('2023-01-15'),
    lastActive: new Date('2024-01-22'),
    specialties: ['Project Management', 'Romance Publishing'],
    workload: 85
  },
  {
    id: '2',
    name: 'Marcus Rodriguez',
    email: 'marcus@romanceteam.com',
    role: 'editor',
    status: 'active',
    permissions: ['edit_content', 'review_drafts', 'approve_changes'],
    joinDate: new Date('2023-03-10'),
    lastActive: new Date('2024-01-21'),
    specialties: ['Contemporary Romance', 'Line Editing'],
    workload: 72
  },
  {
    id: '3',
    name: 'Emma Thompson',
    email: 'emma@romanceteam.com',
    role: 'writer',
    status: 'active',
    permissions: ['edit_content', 'upload_drafts'],
    joinDate: new Date('2023-06-20'),
    lastActive: new Date('2024-01-20'),
    specialties: ['Paranormal Romance', 'Ghostwriting'],
    workload: 90
  },
  {
    id: '4',
    name: 'Alex Kim',
    email: 'alex@romanceteam.com',
    role: 'cover_designer',
    status: 'active',
    permissions: ['upload_covers', 'edit_graphics'],
    joinDate: new Date('2023-09-05'),
    lastActive: new Date('2024-01-19'),
    specialties: ['Romance Covers', 'Digital Art'],
    workload: 60
  }
];

const mockProjects: Project[] = [
  {
    id: '1',
    name: 'CEO\'s Second Chance',
    client: 'Sarah Martinez',
    status: 'active',
    deadline: new Date('2024-03-15'),
    progress: 75,
    assignedMembers: ['2', '3'],
    genre: 'Contemporary Romance',
    heatLevel: 4
  },
  {
    id: '2',
    name: 'Vampire\'s Awakening',
    client: 'Midnight Publishing',
    status: 'review',
    deadline: new Date('2024-02-28'),
    progress: 90,
    assignedMembers: ['2', '4'],
    genre: 'Paranormal Romance',
    heatLevel: 5
  }
];

const mockActivities: Activity[] = [
  {
    id: '1',
    userId: '2',
    userName: 'Marcus Rodriguez',
    action: 'completed editing of Chapter 12',
    target: 'CEO\'s Second Chance',
    timestamp: new Date('2024-01-22T14:30:00'),
    type: 'milestone'
  },
  {
    id: '2',
    userId: '3',
    userName: 'Emma Thompson',
    action: 'uploaded draft for review',
    target: 'Vampire\'s Awakening',
    timestamp: new Date('2024-01-22T12:15:00'),
    type: 'edit'
  },
  {
    id: '3',
    userId: '4',
    userName: 'Alex Kim',
    action: 'submitted cover design v3',
    target: 'CEO\'s Second Chance',
    timestamp: new Date('2024-01-22T10:45:00'),
    type: 'edit'
  }
];

export const TeamCollaboration: React.FC<TeamCollaborationProps> = ({
  projectId,
  onMemberAdd,
  onProjectUpdate
}) => {
  const [activeTab, setActiveTab] = useState('team');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(mockTeamMembers);
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [activities, setActivities] = useState<Activity[]>(mockActivities);
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [newMember, setNewMember] = useState<Partial<TeamMember>>({
    name: '',
    email: '',
    role: 'writer',
    specialties: [],
    permissions: []
  });

  const handleAddMember = () => {
    const member: TeamMember = {
      id: Date.now().toString(),
      ...newMember,
      status: 'pending',
      permissions: rolePermissions[newMember.role as keyof typeof rolePermissions] || [],
      joinDate: new Date(),
      lastActive: new Date(),
      workload: 0
    } as TeamMember;
    
    setTeamMembers(prev => [...prev, member]);
    onMemberAdd?.(member);
    setShowAddMemberDialog(false);
    setNewMember({
      name: '',
      email: '',
      role: 'writer',
      specialties: [],
      permissions: []
    });
  };

  const handleMemberUpdate = (memberId: string, updates: Partial<TeamMember>) => {
    setTeamMembers(prev => prev.map(member => 
      member.id === memberId ? { ...member, ...updates } : member
    ));
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
      case 'active': return 'bg-green-100 text-green-800';
      case 'review': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="h-4 w-4" />;
      case 'editor': return <Edit className="h-4 w-4" />;
      case 'writer': return <FileText className="h-4 w-4" />;
      case 'cover_designer': return <Star className="h-4 w-4" />;
      case 'marketer': return <MessageCircle className="h-4 w-4" />;
      case 'client': return <Users className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'edit': return <Edit className="h-4 w-4 text-blue-500" />;
      case 'comment': return <MessageCircle className="h-4 w-4 text-green-500" />;
      case 'approval': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'assignment': return <Users className="h-4 w-4 text-purple-500" />;
      case 'milestone': return <Star className="h-4 w-4 text-yellow-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getWorkloadColor = (workload: number) => {
    if (workload >= 90) return 'text-red-600';
    if (workload >= 75) return 'text-orange-600';
    if (workload >= 50) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="space-y-6">
      <Card className="border-romance-primary/20">
        <CardHeader className="bg-gradient-to-r from-romance-primary/5 to-romance-secondary/5">
          <CardTitle className="flex items-center gap-2 text-romance-text">
            <Users className="h-5 w-5 text-romance-accent" />
            Team Collaboration Hub
          </CardTitle>
          <div className="grid grid-cols-4 gap-4 mt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-romance-primary">{teamMembers.length}</div>
              <div className="text-sm text-romance-muted">Team Members</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-romance-primary">{projects.length}</div>
              <div className="text-sm text-romance-muted">Active Projects</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-romance-primary">
                {teamMembers.filter(m => m.status === 'active').length}
              </div>
              <div className="text-sm text-romance-muted">Online Now</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-romance-primary">
                {Math.round(teamMembers.reduce((sum, m) => sum + m.workload, 0) / teamMembers.length)}%
              </div>
              <div className="text-sm text-romance-muted">Avg Workload</div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="team">Team</TabsTrigger>
              <TabsTrigger value="projects">Projects</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="permissions">Permissions</TabsTrigger>
            </TabsList>

            <TabsContent value="team" className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-romance-text">Team Members</h3>
                
                <Dialog open={showAddMemberDialog} onOpenChange={setShowAddMemberDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-romance-primary hover:bg-romance-primary/90">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Member
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Team Member</DialogTitle>
                      <DialogDescription>Invite a new member to join your romance publishing team.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="name">Name</Label>
                          <Input
                            id="name"
                            value={newMember.name}
                            onChange={(e) => setNewMember(prev => ({ ...prev, name: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={newMember.email}
                            onChange={(e) => setNewMember(prev => ({ ...prev, email: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="role">Role</Label>
                        <Select value={newMember.role} onValueChange={(value: any) => setNewMember(prev => ({ ...prev, role: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="writer">Writer</SelectItem>
                            <SelectItem value="editor">Editor</SelectItem>
                            <SelectItem value="cover_designer">Cover Designer</SelectItem>
                            <SelectItem value="marketer">Marketer</SelectItem>
                            <SelectItem value="client">Client</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="specialties">Specialties (comma-separated)</Label>
                        <Input
                          id="specialties"
                          placeholder="Contemporary Romance, Line Editing"
                          onChange={(e) => setNewMember(prev => ({ 
                            ...prev, 
                            specialties: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                          }))}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleAddMember} className="bg-romance-primary hover:bg-romance-primary/90">
                        Send Invitation
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid gap-4">
                {teamMembers.map((member) => (
                  <Card key={member.id} className="border-romance-accent/20 hover:border-romance-primary/50 transition-colors">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={member.avatar} />
                            <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold text-lg">{member.name}</h3>
                            <div className="flex items-center gap-2 text-sm text-romance-muted">
                              {getRoleIcon(member.role)}
                              <span className="capitalize">{member.role.replace('_', ' ')}</span>
                              <span>•</span>
                              <span>{member.email}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={`mb-2 ${getStatusColor(member.status)}`}>
                            {member.status}
                          </Badge>
                          <div className="text-sm text-romance-muted">
                            Last active: {member.lastActive.toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 mt-4">
                        <div>
                          <div className="text-sm text-romance-muted mb-1">Workload</div>
                          <div className={`text-lg font-semibold ${getWorkloadColor(member.workload)}`}>
                            {member.workload}%
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-romance-muted mb-1">Projects</div>
                          <div className="text-lg font-semibold text-romance-primary">
                            {projects.filter(p => p.assignedMembers.includes(member.id)).length}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-romance-muted mb-1">Member Since</div>
                          <div className="text-sm font-medium">
                            {member.joinDate.toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      
                      {member.specialties.length > 0 && (
                        <div className="mt-3">
                          <div className="text-sm text-romance-muted mb-2">Specialties:</div>
                          <div className="flex flex-wrap gap-2">
                            {member.specialties.map((specialty, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {specialty}
                              </Badge>
                            ))}
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
                {projects.map((project) => (
                  <Card key={project.id} className="border-romance-accent/20">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-lg">{project.name}</h3>
                          <p className="text-sm text-romance-muted">Client: {project.client}</p>
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
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-romance-primary h-2 rounded-full transition-all duration-300"
                              style={{ width: `${project.progress}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-romance-muted">Deadline:</span>
                            <div className="font-medium">{project.deadline.toLocaleDateString()}</div>
                          </div>
                          <div>
                            <span className="text-romance-muted">Team Size:</span>
                            <div className="font-medium">{project.assignedMembers.length} members</div>
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
                        
                        <div>
                          <span className="text-sm text-romance-muted">Assigned Team:</span>
                          <div className="flex items-center gap-2 mt-1">
                            {project.assignedMembers.map((memberId) => {
                              const member = teamMembers.find(m => m.id === memberId);
                              return member ? (
                                <div key={memberId} className="flex items-center gap-1">
                                  <Avatar className="h-6 w-6">
                                    <AvatarImage src={member.avatar} />
                                    <AvatarFallback className="text-xs">
                                      {member.name.split(' ').map(n => n[0]).join('')}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-xs">{member.name.split(' ')[0]}</span>
                                </div>
                              ) : null;
                            })}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="activity" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-romance-text">Recent Activity</h3>
                
                {activities.map((activity) => (
                  <Card key={activity.id} className="border-romance-accent/20">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{activity.userName}</span>
                            <span className="text-sm text-romance-muted">{activity.action}</span>
                          </div>
                          <div className="text-sm text-romance-muted">
                            Project: <span className="font-medium">{activity.target}</span>
                          </div>
                        </div>
                        <div className="text-xs text-romance-muted">
                          {activity.timestamp.toLocaleString()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="permissions" className="space-y-6">
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-romance-text">Role-Based Permissions</h3>
                
                {Object.entries(rolePermissions).map(([role, permissions]) => (
                  <Card key={role} className="border-romance-accent/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 capitalize">
                        {getRoleIcon(role)}
                        {role.replace('_', ' ')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {permissions[0] === 'all' ? (
                          <div className="col-span-2">
                            <Badge className="bg-romance-primary/20 text-romance-primary">
                              Full Administrative Access
                            </Badge>
                          </div>
                        ) : (
                          permissions.map((permission, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="text-sm capitalize">
                                {permission.replace('_', ' ')}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                      
                      <div className="mt-4">
                        <div className="text-sm text-romance-muted">Team members with this role:</div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {teamMembers
                            .filter(member => member.role === role)
                            .map((member) => (
                              <Badge key={member.id} variant="outline" className="text-xs">
                                {member.name}
                              </Badge>
                            ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};