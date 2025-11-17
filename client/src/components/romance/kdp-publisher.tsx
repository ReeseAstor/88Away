import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Upload, BookOpen, Globe, DollarSign, Clock, CheckCircle, AlertTriangle, Eye, Download, ArrowRight, FileText, Image, Settings } from 'lucide-react';

interface KDPMetadata {
  title: string;
  subtitle: string;
  description: string;
  keywords: string[];
  categories: string[];
  language: string;
  ageRange: string;
}

interface PublicationStatus {
  step: 'draft' | 'review' | 'publishing' | 'live' | 'error';
  progress: number;
  estimatedTime: string;
  messages: string[];
  kdpAsin?: string;
}

interface KDPPublisherProps {
  bookId?: string;
  initialData?: Partial<KDPMetadata>;
  onPublishComplete?: (status: PublicationStatus) => void;
}

const romanceCategories = [
  'Romance > Contemporary Romance',
  'Romance > Historical Romance',
  'Romance > Paranormal Romance',
  'Romance > Romantic Suspense',
  'Romance > Erotic Romance',
  'Romance > Western Romance',
  'Romance > Military Romance',
  'Romance > Sports Romance',
  'Romance > Holiday Romance',
  'Romance > New Adult Romance',
  'Romance > Clean & Wholesome Romance',
  'Romance > LGBTQ+ Romance',
  'Romance > Billionaire Romance',
  'Romance > Small Town Romance',
  'Romance > Office Romance'
];

export const KDPPublisher: React.FC<KDPPublisherProps> = ({
  bookId,
  initialData,
  onPublishComplete
}) => {
  const [activeTab, setActiveTab] = useState('metadata');
  const [metadata, setMetadata] = useState<KDPMetadata>({
    title: '',
    subtitle: '',
    description: '',
    keywords: [],
    categories: [],
    language: 'English',
    ageRange: 'Adult',
    ...initialData
  });
  
  const [interiorFile, setInteriorFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [price, setPrice] = useState(4.99);
  const [enrollKU, setEnrollKU] = useState(true);
  
  const [publicationStatus, setPublicationStatus] = useState<PublicationStatus>({
    step: 'draft',
    progress: 0,
    estimatedTime: '',
    messages: []
  });
  
  const [isPublishing, setIsPublishing] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const handleKeywordAdd = (keyword: string) => {
    if (keyword.trim() && !metadata.keywords.includes(keyword.trim()) && metadata.keywords.length < 7) {
      setMetadata(prev => ({
        ...prev,
        keywords: [...prev.keywords, keyword.trim()]
      }));
    }
  };

  const handleKeywordRemove = (index: number) => {
    setMetadata(prev => ({
      ...prev,
      keywords: prev.keywords.filter((_, i) => i !== index)
    }));
  };

  const handleCategoryToggle = (category: string) => {
    if (metadata.categories.includes(category)) {
      setMetadata(prev => ({
        ...prev,
        categories: prev.categories.filter(c => c !== category)
      }));
    } else if (metadata.categories.length < 3) {
      setMetadata(prev => ({
        ...prev,
        categories: [...prev.categories, category]
      }));
    }
  };

  const validateData = (): string[] => {
    const errors: string[] = [];
    
    if (!metadata.title.trim()) errors.push('Book title is required');
    if (!metadata.description.trim()) errors.push('Book description is required');
    if (metadata.keywords.length === 0) errors.push('At least one keyword is required');
    if (metadata.categories.length === 0) errors.push('At least one category is required');
    if (!interiorFile) errors.push('Interior manuscript file is required');
    if (!coverFile) errors.push('Cover file is required');
    if (price <= 0) errors.push('Price must be greater than 0');
    
    return errors;
  };

  const simulatePublishing = async () => {
    setIsPublishing(true);
    
    const steps = [
      { step: 'review', progress: 25, message: 'Validating manuscript format...', time: '5 minutes' },
      { step: 'review', progress: 50, message: 'Processing files...', time: '3 minutes' },
      { step: 'publishing', progress: 75, message: 'Publishing to KDP...', time: '2 minutes' },
      { step: 'live', progress: 100, message: 'Book published successfully!', time: 'Complete' }
    ];

    for (const stepData of steps) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setPublicationStatus(prev => ({
        ...prev,
        step: stepData.step as any,
        progress: stepData.progress,
        estimatedTime: stepData.time,
        messages: [...prev.messages, stepData.message]
      }));
    }

    setPublicationStatus(prev => ({
      ...prev,
      kdpAsin: 'B' + Math.random().toString(36).substr(2, 9).toUpperCase()
    }));

    setIsPublishing(false);
    onPublishComplete?.(publicationStatus);
  };

  const handlePublish = () => {
    const errors = validateData();
    setValidationErrors(errors);
    
    if (errors.length === 0) {
      setShowConfirmDialog(true);
    }
  };

  const getStepIcon = (step: string) => {
    switch (step) {
      case 'draft': return <FileText className="h-5 w-5" />;
      case 'review': return <Eye className="h-5 w-5" />;
      case 'publishing': return <Upload className="h-5 w-5" />;
      case 'live': return <CheckCircle className="h-5 w-5" />;
      case 'error': return <AlertTriangle className="h-5 w-5" />;
      default: return <Clock className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-romance-primary/20">
        <CardHeader className="bg-gradient-to-r from-romance-primary/5 to-romance-secondary/5">
          <CardTitle className="flex items-center gap-2 text-romance-text">
            <BookOpen className="h-5 w-5 text-romance-accent" />
            KDP Publisher - Romance Edition
          </CardTitle>
          <div className="flex items-center gap-4 text-sm text-romance-muted">
            <div className="flex items-center gap-2">
              {getStepIcon(publicationStatus.step)}
              <span className="capitalize">{publicationStatus.step}</span>
            </div>
            {publicationStatus.progress > 0 && (
              <div className="flex items-center gap-2">
                <Progress value={publicationStatus.progress} className="w-20" />
                <span>{publicationStatus.progress}%</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="metadata">Details</TabsTrigger>
              <TabsTrigger value="files">Files</TabsTrigger>
              <TabsTrigger value="pricing">Pricing</TabsTrigger>
              <TabsTrigger value="publish">Publish</TabsTrigger>
            </TabsList>

            <TabsContent value="metadata" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Book Title *</Label>
                    <Input
                      id="title"
                      value={metadata.title}
                      onChange={(e) => setMetadata(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter your book title"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="subtitle">Subtitle</Label>
                    <Input
                      id="subtitle"
                      value={metadata.subtitle}
                      onChange={(e) => setMetadata(prev => ({ ...prev, subtitle: e.target.value }))}
                      placeholder="Optional subtitle"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={metadata.description}
                      onChange={(e) => setMetadata(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Compelling book description..."
                      rows={6}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Keywords (up to 7) *</Label>
                    <Input
                      placeholder="Enter keyword and press Enter"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleKeywordAdd(e.currentTarget.value);
                          e.currentTarget.value = '';
                        }
                      }}
                    />
                    <div className="flex flex-wrap gap-2 mt-2">
                      {metadata.keywords.map((keyword, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="cursor-pointer"
                          onClick={() => handleKeywordRemove(index)}
                        >
                          {keyword} ×
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <Label>Categories (up to 3) *</Label>
                    <div className="max-h-32 overflow-y-auto space-y-2 mt-2 border rounded-lg p-3">
                      {romanceCategories.slice(0, 10).map((category) => (
                        <div key={category} className="flex items-center space-x-2">
                          <Checkbox
                            checked={metadata.categories.includes(category)}
                            onCheckedChange={() => handleCategoryToggle(category)}
                            disabled={!metadata.categories.includes(category) && metadata.categories.length >= 3}
                          />
                          <Label className="text-sm">{category}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="files" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Interior File</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="border-2 border-dashed rounded-lg p-6 text-center">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm mb-2">Upload manuscript (PDF, DOC, DOCX)</p>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => setInteriorFile(e.target.files?.[0] || null)}
                        className="hidden"
                        id="interior-upload"
                      />
                      <Label htmlFor="interior-upload" className="cursor-pointer">
                        <Button variant="outline">Choose File</Button>
                      </Label>
                    </div>
                    {interiorFile && (
                      <p className="text-sm mt-2">{interiorFile.name}</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Cover File</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="border-2 border-dashed rounded-lg p-6 text-center">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm mb-2">Upload cover (JPG, PNG)</p>
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png"
                        onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                        className="hidden"
                        id="cover-upload"
                      />
                      <Label htmlFor="cover-upload" className="cursor-pointer">
                        <Button variant="outline">Choose File</Button>
                      </Label>
                    </div>
                    {coverFile && (
                      <p className="text-sm mt-2">{coverFile.name}</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="pricing" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Pricing & Distribution</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="price">eBook Price (USD)</Label>
                      <Input
                        id="price"
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                        min="0.99"
                        step="0.01"
                      />
                    </div>
                    <div className="flex items-center space-x-2 pt-6">
                      <Checkbox
                        id="ku"
                        checked={enrollKU}
                        onCheckedChange={setEnrollKU}
                      />
                      <Label htmlFor="ku">Enroll in Kindle Unlimited</Label>
                    </div>
                  </div>
                  
                  <div className="bg-romance-background/50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Estimated Royalty</h4>
                    <p className="text-lg font-semibold text-romance-primary">
                      ${(price * 0.70).toFixed(2)} per sale
                    </p>
                    <p className="text-sm text-romance-muted">70% royalty rate for $2.99-$9.99 pricing</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="publish" className="space-y-6">
              {validationErrors.length > 0 && (
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="p-4">
                    <h4 className="font-medium text-red-800 mb-2">Please fix these issues:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
                      {validationErrors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {publicationStatus.messages.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Publication Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {publicationStatus.messages.map((message, index) => (
                        <p key={index} className="text-sm">{message}</p>
                      ))}
                      {publicationStatus.kdpAsin && (
                        <div className="mt-4 p-4 bg-green-50 rounded-lg">
                          <p className="font-medium text-green-800">
                            Success! ASIN: {publicationStatus.kdpAsin}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={handlePublish}
                  disabled={isPublishing}
                  className="bg-romance-primary hover:bg-romance-primary/90"
                >
                  {isPublishing ? 'Publishing...' : 'Publish to KDP'}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Publication</AlertDialogTitle>
            <AlertDialogDescription>
              Are you ready to publish "{metadata.title}" to Amazon KDP? This will make your book available for purchase.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={simulatePublishing}>
              Publish Now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};