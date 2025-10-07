import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RomanceCard, RomanceButton, RomanceIcon } from './index';
import { cn } from '@/lib/utils';

interface Character {
  id: string;
  name: string;
  role: 'protagonist' | 'antagonist' | 'supporting' | 'minor';
  description: string;
  romanticArchetype?: string;
  attractionFactors?: string[];
  romanticGoals?: string;
  x?: number; // For visual positioning
  y?: number;
}

interface Relationship {
  id: string;
  character1Id: string;
  character2Id: string;
  type: 'romantic_interest' | 'ex_lover' | 'family' | 'friend' | 'rival' | 'mentor' | 'ally' | 'enemy' | 'colleague';
  intensity: number; // 1-10 scale
  dynamics: string;
  tension: string;
  development: string;
  notes?: string;
}

interface CharacterRelationshipMapperProps {
  characters?: Character[];
  relationships?: Relationship[];
  onCharacterUpdate?: (characterId: string, updates: Partial<Character>) => void;
  onRelationshipAdd?: (relationship: Omit<Relationship, 'id'>) => void;
  onRelationshipUpdate?: (relationshipId: string, updates: Partial<Relationship>) => void;
  onRelationshipDelete?: (relationshipId: string) => void;
}

const RELATIONSHIP_TYPES = {
  romantic_interest: { label: 'Romantic Interest', color: '#ec4899', icon: '💕' },
  ex_lover: { label: 'Ex-Lover', color: '#be185d', icon: '💔' },
  family: { label: 'Family', color: '#059669', icon: '👨‍👩‍👧‍👦' },
  friend: { label: 'Friend', color: '#0891b2', icon: '🤝' },
  rival: { label: 'Rival', color: '#dc2626', icon: '⚔️' },
  mentor: { label: 'Mentor', color: '#7c3aed', icon: '👨‍🏫' },
  ally: { label: 'Ally', color: '#059669', icon: '🤜🤛' },
  enemy: { label: 'Enemy', color: '#dc2626', icon: '⚡' },
  colleague: { label: 'Colleague', color: '#6366f1', icon: '💼' }
};

const ROMANTIC_ARCHETYPES = [
  'Alpha Hero', 'Beta Hero', 'Cinnamon Roll', 'Bad Boy', 'Good Guy',
  'Strong Heroine', 'Innocent Heroine', 'Feisty Heroine', 'Damaged Hero',
  'Rake', 'Virgin', 'Experienced', 'Single Parent', 'Protector'
];

export function CharacterRelationshipMapper({
  characters = [],
  relationships = [],
  onCharacterUpdate,
  onRelationshipAdd,
  onRelationshipUpdate,
  onRelationshipDelete
}: CharacterRelationshipMapperProps) {
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [selectedRelationship, setSelectedRelationship] = useState<Relationship | null>(null);
  const [isAddingRelationship, setIsAddingRelationship] = useState(false);
  const [draggedCharacter, setDraggedCharacter] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'visual' | 'list'>('visual');
  const mapRef = useRef<SVGSVGElement>(null);

  const [relationshipForm, setRelationshipForm] = useState({
    character1Id: '',
    character2Id: '',
    type: 'romantic_interest' as Relationship['type'],
    intensity: 5,
    dynamics: '',
    tension: '',
    development: '',
    notes: ''
  });

  // Position characters in a circle if they don't have positions
  const positionedCharacters = useMemo(() => {
    return characters.map((char, index) => {
      if (char.x !== undefined && char.y !== undefined) {
        return char;
      }
      
      const angle = (index * 2 * Math.PI) / characters.length;
      const radius = Math.min(200, 50 + characters.length * 15);
      const centerX = 300;
      const centerY = 250;
      
      return {
        ...char,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
      };
    });
  }, [characters]);

  // Get relationships for a specific character
  const getCharacterRelationships = (characterId: string) => {
    return relationships.filter(rel => 
      rel.character1Id === characterId || rel.character2Id === characterId
    );
  };

  // Get relationship between two characters
  const getRelationshipBetween = (char1Id: string, char2Id: string) => {
    return relationships.find(rel => 
      (rel.character1Id === char1Id && rel.character2Id === char2Id) ||
      (rel.character1Id === char2Id && rel.character2Id === char1Id)
    );
  };

  // Calculate relationship dynamics stats
  const relationshipStats = useMemo(() => {
    const romanticCount = relationships.filter(r => r.type === 'romantic_interest').length;
    const conflictCount = relationships.filter(r => ['rival', 'enemy', 'ex_lover'].includes(r.type)).length;
    const supportCount = relationships.filter(r => ['friend', 'ally', 'mentor', 'family'].includes(r.type)).length;
    
    const averageIntensity = relationships.length > 0 ? 
      relationships.reduce((sum, r) => sum + r.intensity, 0) / relationships.length : 0;

    return {
      total: relationships.length,
      romantic: romanticCount,
      conflict: conflictCount,
      support: supportCount,
      averageIntensity: Math.round(averageIntensity * 10) / 10
    };
  }, [relationships]);

  const handleCharacterDrag = (characterId: string, newX: number, newY: number) => {
    if (onCharacterUpdate) {
      onCharacterUpdate(characterId, { x: newX, y: newY });
    }
  };

  const handleAddRelationship = () => {
    if (onRelationshipAdd && relationshipForm.character1Id && relationshipForm.character2Id) {
      onRelationshipAdd(relationshipForm);
      setRelationshipForm({
        character1Id: '',
        character2Id: '',
        type: 'romantic_interest',
        intensity: 5,
        dynamics: '',
        tension: '',
        development: '',
        notes: ''
      });
      setIsAddingRelationship(false);
    }
  };

  const getIntensityColor = (intensity: number) => {
    if (intensity <= 3) return '#6b7280'; // Gray
    if (intensity <= 6) return '#f59e0b'; // Yellow
    if (intensity <= 8) return '#f97316'; // Orange
    return '#dc2626'; // Red
  };

  const getIntensityLabel = (intensity: number) => {
    if (intensity <= 3) return 'Low';
    if (intensity <= 6) return 'Medium';
    if (intensity <= 8) return 'High';
    return 'Intense';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-semibold text-romance-burgundy-800">
            Character Relationship Mapper
          </h2>
          <p className="text-muted-foreground mt-1">
            Visualize and manage romantic dynamics between characters
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1 bg-white border border-romance-burgundy-200 rounded-lg p-1">
            <Button
              variant={viewMode === 'visual' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('visual')}
              className={viewMode === 'visual' ? 'bg-romance-burgundy-600 text-white' : ''}
            >
              <RomanceIcon name="diamond" className="mr-1" />
              Visual
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className={viewMode === 'list' ? 'bg-romance-burgundy-600 text-white' : ''}
            >
              <RomanceIcon name="book" className="mr-1" />
              List
            </Button>
          </div>
          <RomanceButton
            variant="primary"
            onClick={() => setIsAddingRelationship(true)}
          >
            <RomanceIcon name="plus" className="mr-2" />
            Add Relationship
          </RomanceButton>
        </div>
      </div>

      {/* Relationship Stats */}
      <div className="grid grid-cols-5 gap-4">
        <RomanceCard className="text-center p-4">
          <div className="text-2xl font-bold text-romance-burgundy-800">
            {relationshipStats.total}
          </div>
          <div className="text-sm text-muted-foreground">Total Relationships</div>
        </RomanceCard>
        <RomanceCard className="text-center p-4">
          <div className="text-2xl font-bold text-romance-burgundy-600">
            {relationshipStats.romantic}
          </div>
          <div className="text-sm text-muted-foreground">Romantic</div>
        </RomanceCard>
        <RomanceCard className="text-center p-4">
          <div className="text-2xl font-bold text-yellow-600">
            {relationshipStats.conflict}
          </div>
          <div className="text-sm text-muted-foreground">Conflict</div>
        </RomanceCard>
        <RomanceCard className="text-center p-4">
          <div className="text-2xl font-bold text-green-600">
            {relationshipStats.support}
          </div>
          <div className="text-sm text-muted-foreground">Support</div>
        </RomanceCard>
        <RomanceCard className="text-center p-4">
          <div className="text-2xl font-bold text-romance-burgundy-700">
            {relationshipStats.averageIntensity}
          </div>
          <div className="text-sm text-muted-foreground">Avg. Intensity</div>
        </RomanceCard>
      </div>

      {viewMode === 'visual' ? (
        /* Visual Relationship Map */
        <RomanceCard className="p-6">
          <div className="w-full" style={{ height: '500px' }}>
            <svg
              ref={mapRef}
              width="100%"
              height="100%"
              viewBox="0 0 600 500"
              className="border border-romance-burgundy-200 rounded-lg bg-gradient-to-br from-romance-champagne-50 to-romance-blush-50"
            >
              {/* Relationship Lines */}
              {relationships.map(relationship => {
                const char1 = positionedCharacters.find(c => c.id === relationship.character1Id);
                const char2 = positionedCharacters.find(c => c.id === relationship.character2Id);
                
                if (!char1 || !char2) return null;
                
                const config = RELATIONSHIP_TYPES[relationship.type];
                const strokeWidth = Math.max(1, relationship.intensity / 2);
                
                return (
                  <line
                    key={relationship.id}
                    x1={char1.x}
                    y1={char1.y}
                    x2={char2.x}
                    y2={char2.y}
                    stroke={config.color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={relationship.type === 'ex_lover' ? '5,5' : 'none'}
                    className="cursor-pointer hover:stroke-width-4 transition-all"
                    onClick={() => setSelectedRelationship(relationship)}
                  />
                );
              })}
              
              {/* Character Nodes */}
              {positionedCharacters.map(character => {
                const charRelationships = getCharacterRelationships(character.id);
                const romanticRelationships = charRelationships.filter(r => r.type === 'romantic_interest');
                const isMainCharacter = character.role === 'protagonist';
                
                return (
                  <g key={character.id}>
                    <circle
                      cx={character.x}
                      cy={character.y}
                      r={isMainCharacter ? 25 : 20}
                      fill={isMainCharacter ? '#ec4899' : '#f9a8d4'}
                      stroke={romanticRelationships.length > 0 ? '#be185d' : '#d1d5db'}
                      strokeWidth={romanticRelationships.length > 0 ? 3 : 1}
                      className="cursor-pointer hover:stroke-width-4 transition-all"
                      onClick={() => setSelectedCharacter(character)}
                    />
                    <text
                      x={character.x}
                      y={character.y + 35}
                      textAnchor="middle"
                      className="text-xs font-medium fill-romance-burgundy-800 cursor-pointer"
                      onClick={() => setSelectedCharacter(character)}
                    >
                      {character.name}
                    </text>
                    {character.romanticArchetype && (
                      <text
                        x={character.x}
                        y={character.y + 48}
                        textAnchor="middle"
                        className="text-xs fill-muted-foreground"
                      >
                        {character.romanticArchetype}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
          
          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            {Object.entries(RELATIONSHIP_TYPES).map(([type, config]) => (
              <div key={type} className="flex items-center space-x-2">
                <div
                  className="w-4 h-1 rounded"
                  style={{ backgroundColor: config.color }}
                />
                <span>{config.icon}</span>
                <span>{config.label}</span>
              </div>
            ))}
          </div>
        </RomanceCard>
      ) : (
        /* List View */
        <div className="space-y-4">
          {characters.map(character => {
            const charRelationships = getCharacterRelationships(character.id);
            
            return (
              <RomanceCard key={character.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-3">
                      <div className={cn(
                        "w-3 h-3 rounded-full",
                        character.role === 'protagonist' ? 'bg-romance-burgundy-600' : 'bg-romance-blush-400'
                      )} />
                      <span>{character.name}</span>
                      <Badge variant="outline">
                        {character.role}
                      </Badge>
                      {character.romanticArchetype && (
                        <Badge variant="outline" className="bg-romance-champagne-100 text-romance-champagne-800">
                          {character.romanticArchetype}
                        </Badge>
                      )}
                    </CardTitle>
                    <RomanceButton
                      variant="secondary"
                      size="sm"
                      onClick={() => setSelectedCharacter(character)}
                    >
                      <RomanceIcon name="edit-pencil" />
                    </RomanceButton>
                  </div>
                </CardHeader>
                <CardContent>
                  {charRelationships.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">
                      No relationships defined
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {charRelationships.map(relationship => {
                        const otherCharacterId = relationship.character1Id === character.id ? 
                          relationship.character2Id : relationship.character1Id;
                        const otherCharacter = characters.find(c => c.id === otherCharacterId);
                        const config = RELATIONSHIP_TYPES[relationship.type];
                        
                        return (
                          <div
                            key={relationship.id}
                            className="flex items-center justify-between p-3 bg-white border border-romance-burgundy-100 rounded-lg cursor-pointer hover:bg-romance-blush-25"
                            onClick={() => setSelectedRelationship(relationship)}
                          >
                            <div className="flex items-center space-x-3">
                              <span>{config.icon}</span>
                              <div>
                                <div className="font-medium text-romance-burgundy-800">
                                  {config.label} with {otherCharacter?.name}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  Intensity: {getIntensityLabel(relationship.intensity)} ({relationship.intensity}/10)
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: getIntensityColor(relationship.intensity) }}
                              />
                              <RomanceIcon name="chevron-right" size="sm" className="text-muted-foreground" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </RomanceCard>
            );
          })}
        </div>
      )}

      {/* Character Details Dialog */}
      <Dialog open={!!selectedCharacter} onOpenChange={() => setSelectedCharacter(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Character Details: {selectedCharacter?.name}</DialogTitle>
            <DialogDescription>
              Manage character information and romantic characteristics
            </DialogDescription>
          </DialogHeader>
          {selectedCharacter && (
            <div className="space-y-4">
              <div>
                <Label>Romantic Archetype</Label>
                <Select 
                  value={selectedCharacter.romanticArchetype || ''} 
                  onValueChange={(value) => onCharacterUpdate?.(selectedCharacter.id, { romanticArchetype: value })}
                >
                  <SelectTrigger className="romance-input">
                    <SelectValue placeholder="Select archetype..." />
                  </SelectTrigger>
                  <SelectContent>
                    {ROMANTIC_ARCHETYPES.map(archetype => (
                      <SelectItem key={archetype} value={archetype}>
                        {archetype}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Romantic Goals</Label>
                <Textarea
                  value={selectedCharacter.romanticGoals || ''}
                  onChange={(e) => onCharacterUpdate?.(selectedCharacter.id, { romanticGoals: e.target.value })}
                  className="romance-input"
                  rows={3}
                  placeholder="What does this character want in love?"
                />
              </div>

              <div>
                <Label>Attraction Factors</Label>
                <Input
                  value={selectedCharacter.attractionFactors?.join(', ') || ''}
                  onChange={(e) => onCharacterUpdate?.(selectedCharacter.id, { 
                    attractionFactors: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  })}
                  className="romance-input"
                  placeholder="What makes them attractive? (comma-separated)"
                />
              </div>

              <div className="bg-romance-blush-50 p-4 rounded-lg">
                <h4 className="font-medium text-romance-burgundy-800 mb-2">
                  Relationships ({getCharacterRelationships(selectedCharacter.id).length})
                </h4>
                <div className="space-y-2">
                  {getCharacterRelationships(selectedCharacter.id).map(relationship => {
                    const otherCharacterId = relationship.character1Id === selectedCharacter.id ? 
                      relationship.character2Id : relationship.character1Id;
                    const otherCharacter = characters.find(c => c.id === otherCharacterId);
                    const config = RELATIONSHIP_TYPES[relationship.type];
                    
                    return (
                      <div key={relationship.id} className="flex items-center justify-between">
                        <span className="text-sm">
                          {config.icon} {config.label} with {otherCharacter?.name}
                        </span>
                        <Badge variant="outline" style={{ backgroundColor: config.color + '20', color: config.color }}>
                          {relationship.intensity}/10
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Relationship Dialog */}
      <Dialog open={isAddingRelationship} onOpenChange={setIsAddingRelationship}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Character Relationship</DialogTitle>
            <DialogDescription>
              Define a new relationship between characters
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>First Character</Label>
                <Select value={relationshipForm.character1Id} onValueChange={(value) => setRelationshipForm({ ...relationshipForm, character1Id: value })}>
                  <SelectTrigger className="romance-input">
                    <SelectValue placeholder="Select character..." />
                  </SelectTrigger>
                  <SelectContent>
                    {characters.map(character => (
                      <SelectItem key={character.id} value={character.id}>
                        {character.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Second Character</Label>
                <Select value={relationshipForm.character2Id} onValueChange={(value) => setRelationshipForm({ ...relationshipForm, character2Id: value })}>
                  <SelectTrigger className="romance-input">
                    <SelectValue placeholder="Select character..." />
                  </SelectTrigger>
                  <SelectContent>
                    {characters.filter(c => c.id !== relationshipForm.character1Id).map(character => (
                      <SelectItem key={character.id} value={character.id}>
                        {character.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Relationship Type</Label>
              <Select value={relationshipForm.type} onValueChange={(value: Relationship['type']) => setRelationshipForm({ ...relationshipForm, type: value })}>
                <SelectTrigger className="romance-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(RELATIONSHIP_TYPES).map(([type, config]) => (
                    <SelectItem key={type} value={type}>
                      {config.icon} {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Intensity ({relationshipForm.intensity}/10)</Label>
              <Slider
                value={[relationshipForm.intensity]}
                onValueChange={(value) => setRelationshipForm({ ...relationshipForm, intensity: value[0] })}
                max={10}
                min={1}
                step={1}
                className="mt-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Mild</span>
                <span>Moderate</span>
                <span>Intense</span>
              </div>
            </div>

            <div>
              <Label>Relationship Dynamics</Label>
              <Textarea
                value={relationshipForm.dynamics}
                onChange={(e) => setRelationshipForm({ ...relationshipForm, dynamics: e.target.value })}
                className="romance-input"
                rows={2}
                placeholder="Describe how they interact..."
              />
            </div>

            <div>
              <Label>Tension & Conflict</Label>
              <Textarea
                value={relationshipForm.tension}
                onChange={(e) => setRelationshipForm({ ...relationshipForm, tension: e.target.value })}
                className="romance-input"
                rows={2}
                placeholder="What creates tension between them?"
              />
            </div>

            <div>
              <Label>Relationship Development</Label>
              <Textarea
                value={relationshipForm.development}
                onChange={(e) => setRelationshipForm({ ...relationshipForm, development: e.target.value })}
                className="romance-input"
                rows={2}
                placeholder="How does this relationship evolve?"
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsAddingRelationship(false)}>
                Cancel
              </Button>
              <RomanceButton
                variant="primary"
                onClick={handleAddRelationship}
                disabled={!relationshipForm.character1Id || !relationshipForm.character2Id}
              >
                Add Relationship
              </RomanceButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}