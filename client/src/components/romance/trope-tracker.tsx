import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RomanceCard, RomanceButton, RomanceIcon, TropeBadge, TropeList, type TropeCategory } from './index';
import { cn } from '@/lib/utils';

interface Trope {
  id: string;
  name: string;
  category: TropeCategory;
  description: string;
  isCore: boolean;
  conflictsWith: string[];
  notes?: string;
}

interface TropeConflict {
  trope1: string;
  trope2: string;
  reason: string;
  severity: 'warning' | 'error';
}

interface TropeTrackerProps {
  projectTropes?: Trope[];
  onTropeAdd?: (trope: Omit<Trope, 'id'>) => void;
  onTropeUpdate?: (tropeId: string, updates: Partial<Trope>) => void;
  onTropeRemove?: (tropeId: string) => void;
  availableTropes?: Trope[];
}

// Predefined romance tropes database
const ROMANCE_TROPES_DATABASE = {
  relationship: [
    { name: 'Enemies to Lovers', description: 'Characters start as enemies and fall in love', conflicts: ['instant_love'] },
    { name: 'Friends to Lovers', description: 'Best friends who realize they love each other', conflicts: ['enemies_to_lovers'] },
    { name: 'Fake Relationship', description: 'Pretend dating/marriage that becomes real', conflicts: [] },
    { name: 'Second Chance Romance', description: 'Ex-lovers getting back together', conflicts: ['virgin_hero', 'virgin_heroine'] },
    { name: 'Forbidden Love', description: 'Love that goes against society/family', conflicts: [] },
    { name: 'Arranged Marriage', description: 'Marriage arranged by others', conflicts: ['meet_cute'] },
    { name: 'Marriage of Convenience', description: 'Marriage for practical reasons', conflicts: ['instant_love'] },
    { name: 'Instant Love', description: 'Love at first sight', conflicts: ['enemies_to_lovers', 'slow_burn'] },
    { name: 'Slow Burn', description: 'Gradually building romantic tension', conflicts: ['instant_love'] },
    { name: 'Age Gap', description: 'Significant age difference between lovers', conflicts: [] },
    { name: 'Secret Identity', description: 'One character hides their true identity', conflicts: [] },
    { name: 'Workplace Romance', description: 'Romance between colleagues', conflicts: [] }
  ],
  plot: [
    { name: 'Mistaken Identity', description: 'Character is mistaken for someone else', conflicts: [] },
    { name: 'Amnesia', description: 'Character loses memory', conflicts: [] },
    { name: 'Rescue Romance', description: 'One character saves the other', conflicts: [] },
    { name: 'Revenge Romance', description: 'Romance motivated by revenge', conflicts: ['innocent_heroine'] },
    { name: 'Kidnapping', description: 'One character kidnaps the other', conflicts: ['meet_cute'] },
    { name: 'Stranded Together', description: 'Forced proximity in isolation', conflicts: [] },
    { name: 'Bodyguard Romance', description: 'Protector falls for the protected', conflicts: [] },
    { name: 'Road Trip Romance', description: 'Love develops during travel', conflicts: [] },
    { name: 'Reunion Romance', description: 'Childhood sweethearts reunite', conflicts: [] },
    { name: 'Fish Out of Water', description: 'Character in unfamiliar environment', conflicts: [] }
  ],
  character: [
    { name: 'Alpha Hero', description: 'Dominant, controlling male lead', conflicts: ['beta_hero'] },
    { name: 'Beta Hero', description: 'Gentle, supportive male lead', conflicts: ['alpha_hero'] },
    { name: 'Virgin Hero', description: 'Inexperienced male lead', conflicts: ['rake_hero'] },
    { name: 'Virgin Heroine', description: 'Inexperienced female lead', conflicts: ['experienced_heroine'] },
    { name: 'Experienced Heroine', description: 'Sexually experienced female lead', conflicts: ['virgin_heroine'] },
    { name: 'Rake Hero', description: 'Promiscuous male lead who reforms', conflicts: ['virgin_hero'] },
    { name: 'Innocent Heroine', description: 'Naive, sheltered female lead', conflicts: ['experienced_heroine'] },
    { name: 'Strong Heroine', description: 'Independent, capable female lead', conflicts: [] },
    { name: 'Damaged Hero', description: 'Hero with emotional trauma', conflicts: [] },
    { name: 'Single Parent', description: 'Character with children', conflicts: [] },
    { name: 'Bad Boy', description: 'Rebellious, dangerous male lead', conflicts: ['good_guy'] },
    { name: 'Good Guy', description: 'Moral, upstanding male lead', conflicts: ['bad_boy'] }
  ],
  setting: [
    { name: 'Small Town', description: 'Romance in a close-knit community', conflicts: ['big_city'] },
    { name: 'Big City', description: 'Urban romance setting', conflicts: ['small_town'] },
    { name: 'Historical Setting', description: 'Period romance', conflicts: ['contemporary'] },
    { name: 'Contemporary', description: 'Modern-day romance', conflicts: ['historical_setting'] },
    { name: 'Workplace', description: 'Office or professional setting', conflicts: [] },
    { name: 'College/University', description: 'Academic setting', conflicts: [] },
    { name: 'Military', description: 'Armed forces setting', conflicts: [] },
    { name: 'Medical', description: 'Hospital/medical setting', conflicts: [] },
    { name: 'Ranch/Farm', description: 'Rural agricultural setting', conflicts: [] },
    { name: 'Beach/Coastal', description: 'Seaside romance', conflicts: [] },
    { name: 'Mountain', description: 'Mountain or ski resort setting', conflicts: [] },
    { name: 'International', description: 'Foreign or exotic location', conflicts: [] }
  ]
};

export function TropeTracker({
  projectTropes = [],
  onTropeAdd,
  onTropeUpdate,
  onTropeRemove,
  availableTropes = []
}: TropeTrackerProps) {
  const [isAddingTrope, setIsAddingTrope] = useState(false);
  const [editingTrope, setEditingTrope] = useState<Trope | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<TropeCategory>('relationship');
  const [searchTerm, setSearchTerm] = useState('');
  const [customTropeForm, setCustomTropeForm] = useState({
    name: '',
    category: 'relationship' as TropeCategory,
    description: '',
    isCore: false,
    notes: ''
  });

  // Detect trope conflicts
  const tropeConflicts = useMemo(() => {
    const conflicts: TropeConflict[] = [];
    
    projectTropes.forEach(trope1 => {
      projectTropes.forEach(trope2 => {
        if (trope1.id !== trope2.id && trope1.conflictsWith.includes(trope2.name.toLowerCase().replace(/\s+/g, '_'))) {
          conflicts.push({
            trope1: trope1.name,
            trope2: trope2.name,
            reason: `${trope1.name} typically conflicts with ${trope2.name}`,
            severity: trope1.isCore || trope2.isCore ? 'error' : 'warning'
          });
        }
      });
    });
    
    return conflicts;
  }, [projectTropes]);

  // Get available tropes for current category
  const availableTropesForCategory = useMemo(() => {
    const categoryTropes = ROMANCE_TROPES_DATABASE[selectedCategory] || [];
    const projectTropeNames = projectTropes.map(t => t.name.toLowerCase());
    
    return categoryTropes
      .filter(trope => !projectTropeNames.includes(trope.name.toLowerCase()))
      .filter(trope => 
        searchTerm === '' || 
        trope.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trope.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [selectedCategory, projectTropes, searchTerm]);

  // Group project tropes by category
  const tropesByCategory = useMemo(() => {
    return projectTropes.reduce((acc, trope) => {
      if (!acc[trope.category]) acc[trope.category] = [];
      acc[trope.category].push(trope);
      return acc;
    }, {} as Record<TropeCategory, Trope[]>);
  }, [projectTropes]);

  const handleAddPredefinedTrope = (predefinedTrope: any) => {
    if (onTropeAdd) {
      onTropeAdd({
        name: predefinedTrope.name,
        category: selectedCategory,
        description: predefinedTrope.description,
        isCore: false,
        conflictsWith: predefinedTrope.conflicts,
        notes: ''
      });
    }
  };

  const handleAddCustomTrope = () => {
    if (onTropeAdd && customTropeForm.name.trim()) {
      onTropeAdd({
        ...customTropeForm,
        conflictsWith: []
      });
      setCustomTropeForm({
        name: '',
        category: 'relationship',
        description: '',
        isCore: false,
        notes: ''
      });
      setIsAddingTrope(false);
    }
  };

  const handleToggleCore = (tropeId: string, isCore: boolean) => {
    if (onTropeUpdate) {
      onTropeUpdate(tropeId, { isCore });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-semibold text-romance-burgundy-800">
            Romance Trope Tracker
          </h2>
          <p className="text-muted-foreground mt-1">
            Manage the romantic tropes that define your story
          </p>
        </div>
        <RomanceButton
          variant="primary"
          onClick={() => setIsAddingTrope(true)}
        >
          <RomanceIcon name="plus" className="mr-2" />
          Add Trope
        </RomanceButton>
      </div>

      {/* Conflict Warnings */}
      {tropeConflicts.length > 0 && (
        <Alert className={tropeConflicts.some(c => c.severity === 'error') ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'}>
          <RomanceIcon name="warning" className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium mb-2">
              {tropeConflicts.some(c => c.severity === 'error') ? 'Trope Conflicts Detected' : 'Potential Trope Conflicts'}
            </div>
            <ul className="space-y-1 text-sm">
              {tropeConflicts.map((conflict, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className={conflict.severity === 'error' ? 'text-red-600' : 'text-yellow-600'}>•</span>
                  <span>{conflict.reason}</span>
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Current Tropes by Category */}
      <div className="grid gap-6">
        {Object.entries(tropesByCategory).map(([category, tropes]) => (
          <RomanceCard key={category} variant="elegant">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <RomanceIcon 
                    name={
                      category === 'relationship' ? 'couple' :
                      category === 'plot' ? 'book' :
                      category === 'character' ? 'person' : 'castle'
                    } 
                  />
                  <span className="capitalize">{category} Tropes</span>
                  <Badge variant="outline" className="ml-2">
                    {tropes.length}
                  </Badge>
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {tropes.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">
                  No {category} tropes added yet
                </p>
              ) : (
                <div className="space-y-3">
                  {tropes.map(trope => (
                    <div key={trope.id} className="flex items-start justify-between p-3 bg-white rounded-lg border border-romance-burgundy-100">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <TropeBadge
                            name={trope.name}
                            category={trope.category}
                            isCore={trope.isCore}
                          />
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`core-${trope.id}`}
                              checked={trope.isCore}
                              onCheckedChange={(checked) => handleToggleCore(trope.id, !!checked)}
                            />
                            <Label htmlFor={`core-${trope.id}`} className="text-sm text-muted-foreground">
                              Core Trope
                            </Label>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {trope.description}
                        </p>
                        {trope.notes && (
                          <p className="text-xs text-muted-foreground bg-romance-blush-50 p-2 rounded">
                            <strong>Notes:</strong> {trope.notes}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-1 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingTrope(trope)}
                        >
                          <RomanceIcon name="edit-pencil" size="sm" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onTropeRemove?.(trope.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <RomanceIcon name="trash" size="sm" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </RomanceCard>
        ))}
      </div>

      {/* Empty State */}
      {projectTropes.length === 0 && (
        <RomanceCard className="text-center p-8">
          <RomanceIcon name="heart" size="xl" className="mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold text-romance-burgundy-800 mb-2">
            No Tropes Selected
          </h3>
          <p className="text-muted-foreground mb-4">
            Start building your romance by selecting the tropes that define your story
          </p>
          <RomanceButton
            variant="primary"
            onClick={() => setIsAddingTrope(true)}
          >
            Browse Romance Tropes
          </RomanceButton>
        </RomanceCard>
      )}

      {/* Add Trope Dialog */}
      <Dialog open={isAddingTrope} onOpenChange={setIsAddingTrope}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Romance Tropes</DialogTitle>
            <DialogDescription>
              Choose from popular romance tropes or create your own custom trope
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Category Selection */}
            <div className="space-y-2">
              <Label>Trope Category</Label>
              <div className="flex space-x-2">
                {(['relationship', 'plot', 'character', 'setting'] as TropeCategory[]).map(category => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    className={selectedCategory === category ? 'bg-romance-burgundy-600 text-white' : ''}
                  >
                    <RomanceIcon 
                      name={
                        category === 'relationship' ? 'couple' :
                        category === 'plot' ? 'book' :
                        category === 'character' ? 'person' : 'castle'
                      } 
                      className="mr-1" 
                    />
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="trope-search">Search Tropes</Label>
              <div className="relative">
                <RomanceIcon name="search" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="trope-search"
                  placeholder="Search by name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 romance-input"
                />
              </div>
            </div>

            {/* Available Tropes */}
            <div className="space-y-3">
              <h4 className="font-medium text-romance-burgundy-800">
                Popular {selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Tropes
              </h4>
              <div className="grid gap-3 max-h-60 overflow-y-auto">
                {availableTropesForCategory.map((trope, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-romance-burgundy-200 rounded-lg hover:bg-romance-blush-50 transition-colors">
                    <div className="flex-1">
                      <div className="font-medium text-romance-burgundy-800 mb-1">
                        {trope.name}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {trope.description}
                      </p>
                      {trope.conflicts.length > 0 && (
                        <p className="text-xs text-yellow-600 mt-1">
                          ⚠️ May conflict with: {trope.conflicts.join(', ')}
                        </p>
                      )}
                    </div>
                    <RomanceButton
                      variant="secondary"
                      size="sm"
                      onClick={() => handleAddPredefinedTrope(trope)}
                    >
                      Add
                    </RomanceButton>
                  </div>
                ))}
              </div>
            </div>

            {/* Custom Trope Form */}
            <div className="border-t pt-4 space-y-4">
              <h4 className="font-medium text-romance-burgundy-800">
                Create Custom Trope
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="custom-name">Trope Name</Label>
                  <Input
                    id="custom-name"
                    value={customTropeForm.name}
                    onChange={(e) => setCustomTropeForm({ ...customTropeForm, name: e.target.value })}
                    className="romance-input"
                    placeholder="Enter trope name..."
                  />
                </div>
                <div>
                  <Label htmlFor="custom-category">Category</Label>
                  <Select value={customTropeForm.category} onValueChange={(value: TropeCategory) => setCustomTropeForm({ ...customTropeForm, category: value })}>
                    <SelectTrigger className="romance-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relationship">Relationship</SelectItem>
                      <SelectItem value="plot">Plot</SelectItem>
                      <SelectItem value="character">Character</SelectItem>
                      <SelectItem value="setting">Setting</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="custom-description">Description</Label>
                <Textarea
                  id="custom-description"
                  value={customTropeForm.description}
                  onChange={(e) => setCustomTropeForm({ ...customTropeForm, description: e.target.value })}
                  className="romance-input"
                  rows={2}
                  placeholder="Describe this trope..."
                />
              </div>
              <div>
                <Label htmlFor="custom-notes">Notes (Optional)</Label>
                <Textarea
                  id="custom-notes"
                  value={customTropeForm.notes}
                  onChange={(e) => setCustomTropeForm({ ...customTropeForm, notes: e.target.value })}
                  className="romance-input"
                  rows={2}
                  placeholder="Any additional notes about how this trope applies to your story..."
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="custom-core"
                  checked={customTropeForm.isCore}
                  onCheckedChange={(checked) => setCustomTropeForm({ ...customTropeForm, isCore: !!checked })}
                />
                <Label htmlFor="custom-core">Mark as Core Trope</Label>
              </div>
              <RomanceButton
                variant="primary"
                onClick={handleAddCustomTrope}
                disabled={!customTropeForm.name.trim() || !customTropeForm.description.trim()}
              >
                Add Custom Trope
              </RomanceButton>
            </div>

            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setIsAddingTrope(false)}>
                Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}