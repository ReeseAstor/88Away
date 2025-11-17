import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { RomanceCard, RomanceButton, RomanceIcon, HeatLevelBadge, type HeatLevel } from './index';
import { cn } from '@/lib/utils';

interface CoverDesign {
  id: string;
  title: string;
  template: string;
  style: string;
  colorScheme: string;
  typography: string;
  imageUrl?: string;
  designData: {
    title: string;
    subtitle?: string;
    authorName: string;
    series?: string;
    heatLevel: HeatLevel;
    subgenre: string;
    mood: string;
    dominantColors: string[];
  };
  isSelected: boolean;
  version: number;
  createdAt: Date;
}

interface CoverDesignStudioProps {
  projectId: string;
  projectTitle: string;
  authorName: string;
  heatLevel: HeatLevel;
  subgenre?: string;
  series?: string;
  onCoverCreated?: (cover: CoverDesign) => void;
  onCoverSelected?: (coverId: string) => void;
  existingCovers?: CoverDesign[];
}

const ROMANCE_TEMPLATES = {
  contemporary: {
    name: 'Contemporary Romance',
    styles: ['Modern Minimalist', 'Urban Chic', 'Lifestyle', 'Professional'],
    colors: ['Soft Pink & Gray', 'Navy & Rose Gold', 'Coral & Cream', 'Burgundy & White']
  },
  historical: {
    name: 'Historical Romance',
    styles: ['Period Elegant', 'Victorian Gothic', 'Regency Classic', 'Medieval Fantasy'],
    colors: ['Deep Purple & Gold', 'Emerald & Cream', 'Burgundy & Silver', 'Royal Blue & Gold']
  },
  paranormal: {
    name: 'Paranormal Romance',
    styles: ['Dark Gothic', 'Mystical Fantasy', 'Supernatural Edge', 'Urban Fantasy'],
    colors: ['Black & Red', 'Purple & Silver', 'Dark Blue & Gold', 'Green & Black']
  },
  fantasy: {
    name: 'Fantasy Romance',
    styles: ['Epic Fantasy', 'Magical Realism', 'Fairy Tale', 'High Fantasy'],
    colors: ['Forest Green & Gold', 'Deep Purple & Silver', 'Midnight Blue & Stars', 'Rose & Gold']
  }
};

const TYPOGRAPHY_STYLES = [
  'Elegant Serif', 'Modern Sans', 'Script Romantic', 'Bold Display', 'Classic Roman', 'Handwritten'
];

const MOOD_OPTIONS = [
  'Passionate', 'Tender', 'Steamy', 'Sweet', 'Dark', 'Bright', 'Mysterious', 'Playful', 'Intense', 'Dreamy'
];

export function CoverDesignStudio({
  projectId,
  projectTitle,
  authorName,
  heatLevel,
  subgenre = 'contemporary',
  series,
  onCoverCreated,
  onCoverSelected,
  existingCovers = []
}: CoverDesignStudioProps) {
  const [activeTab, setActiveTab] = useState('create');
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewCover, setPreviewCover] = useState<CoverDesign | null>(null);

  const [designForm, setDesignForm] = useState({
    title: projectTitle,
    subtitle: '',
    authorName: authorName,
    series: series || '',
    template: subgenre,
    style: ROMANCE_TEMPLATES[subgenre as keyof typeof ROMANCE_TEMPLATES]?.styles[0] || 'Modern Minimalist',
    colorScheme: ROMANCE_TEMPLATES[subgenre as keyof typeof ROMANCE_TEMPLATES]?.colors[0] || 'Soft Pink & Gray',
    typography: 'Elegant Serif',
    mood: 'Passionate',
    customInstructions: ''
  });

  const handleGeneratePreview = async () => {
    setIsGenerating(true);
    try {
      // This would call the cover generation API
      const mockCover: CoverDesign = {
        id: `cover_${Date.now()}`,
        title: `${designForm.title} Cover`,
        template: designForm.template,
        style: designForm.style,
        colorScheme: designForm.colorScheme,
        typography: designForm.typography,
        imageUrl: '/api/covers/preview/placeholder', // Mock preview URL
        designData: {
          title: designForm.title,
          subtitle: designForm.subtitle,
          authorName: designForm.authorName,
          series: designForm.series,
          heatLevel: heatLevel,
          subgenre: designForm.template,
          mood: designForm.mood,
          dominantColors: designForm.colorScheme.split(' & ')
        },
        isSelected: false,
        version: 1,
        createdAt: new Date()
      };

      setPreviewCover(mockCover);
      setActiveTab('preview');
    } catch (error) {
      console.error('Cover generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveCover = () => {
    if (previewCover) {
      onCoverCreated?.(previewCover);
      setActiveTab('gallery');
    }
  };

  const handleSelectCover = (coverId: string) => {
    onCoverSelected?.(coverId);
  };

  const renderMockCover = (cover: CoverDesign) => (
    <div className="relative bg-gradient-to-br from-romance-burgundy-600 to-romance-burgundy-800 rounded-lg p-6 text-white shadow-lg aspect-[2/3] flex flex-col justify-between">
      <div className="text-center">
        <div className="text-xs uppercase tracking-wide opacity-80 mb-2">
          {cover.designData.series}
        </div>
        <h1 className="text-xl font-serif font-bold leading-tight mb-1">
          {cover.designData.title}
        </h1>
        {cover.designData.subtitle && (
          <p className="text-sm opacity-90">{cover.designData.subtitle}</p>
        )}
      </div>
      
      <div className="flex-1 flex items-center justify-center">
        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
          <RomanceIcon name="heart" size="xl" />
        </div>
      </div>
      
      <div className="text-center">
        <div className="text-lg font-sans font-medium">
          {cover.designData.authorName}
        </div>
        <div className="flex justify-center mt-2">
          <HeatLevelBadge level={cover.designData.heatLevel} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-semibold text-romance-burgundy-800">
            Cover Design Studio
          </h2>
          <p className="text-muted-foreground mt-1">
            Create stunning romance book covers with AI assistance
          </p>
        </div>
        <Badge variant="outline" className="romance-badge">
          <RomanceIcon name="diamond" className="mr-1" />
          Professional Design
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="create">Design Cover</TabsTrigger>
          <TabsTrigger value="preview" disabled={!previewCover}>Preview</TabsTrigger>
          <TabsTrigger value="gallery">Cover Gallery</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-6">
          {/* Book Information */}
          <RomanceCard>
            <CardHeader>
              <CardTitle>Book Information</CardTitle>
              <CardDescription>
                Basic details that will appear on your cover
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Book Title</Label>
                  <Input
                    id="title"
                    value={designForm.title}
                    onChange={(e) => setDesignForm({ ...designForm, title: e.target.value })}
                    className="romance-input"
                  />
                </div>
                <div>
                  <Label htmlFor="subtitle">Subtitle (Optional)</Label>
                  <Input
                    id="subtitle"
                    value={designForm.subtitle}
                    onChange={(e) => setDesignForm({ ...designForm, subtitle: e.target.value })}
                    className="romance-input"
                    placeholder="A love story..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="author">Author Name</Label>
                  <Input
                    id="author"
                    value={designForm.authorName}
                    onChange={(e) => setDesignForm({ ...designForm, authorName: e.target.value })}
                    className="romance-input"
                  />
                </div>
                <div>
                  <Label htmlFor="series">Series Name (Optional)</Label>
                  <Input
                    id="series"
                    value={designForm.series}
                    onChange={(e) => setDesignForm({ ...designForm, series: e.target.value })}
                    className="romance-input"
                    placeholder="Hearts of..."
                  />
                </div>
              </div>
            </CardContent>
          </RomanceCard>

          {/* Design Options */}
          <RomanceCard>
            <CardHeader>
              <CardTitle>Design Style</CardTitle>
              <CardDescription>
                Choose the visual style for your romance cover
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Romance Subgenre</Label>
                <Select 
                  value={designForm.template} 
                  onValueChange={(value) => setDesignForm({ 
                    ...designForm, 
                    template: value,
                    style: ROMANCE_TEMPLATES[value as keyof typeof ROMANCE_TEMPLATES]?.styles[0] || 'Modern Minimalist',
                    colorScheme: ROMANCE_TEMPLATES[value as keyof typeof ROMANCE_TEMPLATES]?.colors[0] || 'Soft Pink & Gray'
                  })}
                >
                  <SelectTrigger className="romance-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ROMANCE_TEMPLATES).map(([key, template]) => (
                      <SelectItem key={key} value={key}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Cover Style</Label>
                  <Select 
                    value={designForm.style} 
                    onValueChange={(value) => setDesignForm({ ...designForm, style: value })}
                  >
                    <SelectTrigger className="romance-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROMANCE_TEMPLATES[designForm.template as keyof typeof ROMANCE_TEMPLATES]?.styles.map(style => (
                        <SelectItem key={style} value={style}>
                          {style}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Color Scheme</Label>
                  <Select 
                    value={designForm.colorScheme} 
                    onValueChange={(value) => setDesignForm({ ...designForm, colorScheme: value })}
                  >
                    <SelectTrigger className="romance-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROMANCE_TEMPLATES[designForm.template as keyof typeof ROMANCE_TEMPLATES]?.colors.map(color => (
                        <SelectItem key={color} value={color}>
                          {color}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Typography Style</Label>
                  <Select 
                    value={designForm.typography} 
                    onValueChange={(value) => setDesignForm({ ...designForm, typography: value })}
                  >
                    <SelectTrigger className="romance-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TYPOGRAPHY_STYLES.map(style => (
                        <SelectItem key={style} value={style}>
                          {style}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Mood</Label>
                  <Select 
                    value={designForm.mood} 
                    onValueChange={(value) => setDesignForm({ ...designForm, mood: value })}
                  >
                    <SelectTrigger className="romance-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MOOD_OPTIONS.map(mood => (
                        <SelectItem key={mood} value={mood}>
                          {mood}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="custom-instructions">Custom Instructions (Optional)</Label>
                <Textarea
                  id="custom-instructions"
                  value={designForm.customInstructions}
                  onChange={(e) => setDesignForm({ ...designForm, customInstructions: e.target.value })}
                  className="romance-input"
                  rows={3}
                  placeholder="Any specific elements, imagery, or style notes you'd like included..."
                />
              </div>
            </CardContent>
          </RomanceCard>

          {/* Generate Button */}
          <div className="flex justify-center">
            <RomanceButton
              variant="primary"
              size="lg"
              onClick={handleGeneratePreview}
              disabled={isGenerating || !designForm.title.trim()}
              className="px-8"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Generating Cover...
                </>
              ) : (
                <>
                  <RomanceIcon name="diamond" className="mr-2" />
                  Generate Cover Design
                </>
              )}
            </RomanceButton>
          </div>
        </TabsContent>

        <TabsContent value="preview" className="space-y-6">
          {previewCover && (
            <>
              <RomanceCard>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Cover Preview</CardTitle>
                      <CardDescription>
                        Your generated romance book cover
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RomanceButton
                        variant="secondary"
                        size="sm"
                        onClick={() => setActiveTab('create')}
                      >
                        <RomanceIcon name="edit-pencil" className="mr-1" />
                        Modify
                      </RomanceButton>
                      <RomanceButton
                        variant="primary"
                        size="sm"
                        onClick={handleSaveCover}
                      >
                        <RomanceIcon name="save" className="mr-1" />
                        Save Cover
                      </RomanceButton>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Cover Preview */}
                    <div className="flex-shrink-0">
                      <div className="w-64 mx-auto">
                        {renderMockCover(previewCover)}
                      </div>
                    </div>

                    {/* Cover Details */}
                    <div className="flex-1 space-y-4">
                      <div>
                        <h3 className="font-semibold text-romance-burgundy-800 mb-2">
                          Design Specifications
                        </h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Template:</span>
                            <div className="font-medium">{previewCover.template}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Style:</span>
                            <div className="font-medium">{previewCover.style}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Colors:</span>
                            <div className="font-medium">{previewCover.colorScheme}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Typography:</span>
                            <div className="font-medium">{previewCover.typography}</div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="font-semibold text-romance-burgundy-800 mb-2">
                          Book Information
                        </h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Title:</span>
                            <span className="font-medium">{previewCover.designData.title}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Author:</span>
                            <span className="font-medium">{previewCover.designData.authorName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Heat Level:</span>
                            <HeatLevelBadge level={previewCover.designData.heatLevel} />
                          </div>
                          {previewCover.designData.series && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Series:</span>
                              <span className="font-medium">{previewCover.designData.series}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </RomanceCard>
            </>
          )}
        </TabsContent>

        <TabsContent value="gallery" className="space-y-6">
          <RomanceCard>
            <CardHeader>
              <CardTitle>Cover Gallery</CardTitle>
              <CardDescription>
                All your romance book covers ({existingCovers.length})
              </CardDescription>
            </CardHeader>
            <CardContent>
              {existingCovers.length === 0 ? (
                <div className="text-center py-12">
                  <RomanceIcon name="diamond" size="xl" className="mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold text-romance-burgundy-800 mb-2">
                    No covers created yet
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first romance book cover design
                  </p>
                  <RomanceButton
                    variant="primary"
                    onClick={() => setActiveTab('create')}
                  >
                    Create First Cover
                  </RomanceButton>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {existingCovers.map(cover => (
                    <div key={cover.id} className="space-y-3">
                      <div className="w-full max-w-48 mx-auto">
                        {renderMockCover(cover)}
                      </div>
                      <div className="text-center space-y-2">
                        <h4 className="font-medium text-romance-burgundy-800">
                          {cover.title}
                        </h4>
                        <div className="flex justify-center space-x-2">
                          <RomanceButton
                            variant={cover.isSelected ? "primary" : "secondary"}
                            size="sm"
                            onClick={() => handleSelectCover(cover.id)}
                          >
                            {cover.isSelected ? "Selected" : "Select"}
                          </RomanceButton>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </RomanceCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}