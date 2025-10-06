import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RomanceCard, RomanceButton, RomanceIcon, HeatLevelBadge, type HeatLevel } from './index';
import { cn } from '@/lib/utils';

interface Book {
  id: string;
  title: string;
  bookNumber: number;
  status: 'draft' | 'in_progress' | 'ready_for_review' | 'published';
  wordCount: number;
  targetWordCount: number;
  heatLevel: HeatLevel;
  description?: string;
  publishedDate?: string;
}

interface Series {
  id: string;
  title: string;
  description: string;
  subgenre: string;
  heatLevel: HeatLevel;
  plannedBooks: number;
  publishedBooks: number;
  seriesArc: string;
  books: Book[];
}

interface SeriesManagementPanelProps {
  series?: Series;
  onSeriesUpdate?: (series: Series) => void;
  onBookAdd?: (book: Omit<Book, 'id'>) => void;
  onBookUpdate?: (bookId: string, updates: Partial<Book>) => void;
  onBookDelete?: (bookId: string) => void;
}

const statusConfig = {
  draft: { label: 'Draft', className: 'publishing-status-draft bg-gray-100 text-gray-800', icon: 'edit-pencil' },
  in_progress: { label: 'In Progress', className: 'publishing-status-in-progress bg-romance-champagne-100 text-romance-champagne-800', icon: 'writing' },
  ready_for_review: { label: 'Ready for Review', className: 'publishing-status-ready bg-romance-rose-gold-100 text-romance-rose-gold-800', icon: 'book' },
  published: { label: 'Published', className: 'publishing-status-published bg-green-100 text-green-800', icon: 'star' }
};

export function SeriesManagementPanel({
  series,
  onSeriesUpdate,
  onBookAdd,
  onBookUpdate,
  onBookDelete
}: SeriesManagementPanelProps) {
  const [isEditingSeriesInfo, setIsEditingSeriesInfo] = useState(false);
  const [isAddingBook, setIsAddingBook] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);

  const [seriesForm, setSeriesForm] = useState({
    title: series?.title || '',
    description: series?.description || '',
    subgenre: series?.subgenre || '',
    heatLevel: series?.heatLevel || 'warm' as HeatLevel,
    plannedBooks: series?.plannedBooks || 3,
    seriesArc: series?.seriesArc || ''
  });

  const [bookForm, setBookForm] = useState({
    title: '',
    bookNumber: series?.books?.length ? Math.max(...series.books.map(b => b.bookNumber)) + 1 : 1,
    status: 'draft' as Book['status'],
    wordCount: 0,
    targetWordCount: 80000,
    heatLevel: series?.heatLevel || 'warm' as HeatLevel,
    description: ''
  });

  const handleSeriesSubmit = () => {
    if (series && onSeriesUpdate) {
      onSeriesUpdate({
        ...series,
        ...seriesForm
      });
    }
    setIsEditingSeriesInfo(false);
  };

  const handleBookSubmit = () => {
    if (onBookAdd) {
      onBookAdd(bookForm);
      setBookForm({
        title: '',
        bookNumber: series?.books?.length ? Math.max(...series.books.map(b => b.bookNumber)) + 1 : 1,
        status: 'draft',
        wordCount: 0,
        targetWordCount: 80000,
        heatLevel: series?.heatLevel || 'warm',
        description: ''
      });
    }
    setIsAddingBook(false);
  };

  const getCompletionPercentage = (book: Book) => {
    return Math.min(100, Math.round((book.wordCount / book.targetWordCount) * 100));
  };

  if (!series) {
    return (
      <RomanceCard className="text-center p-8">
        <RomanceIcon name="book-stack" size="xl" className="mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-romance-burgundy-800 mb-2">
          No Series Selected
        </h3>
        <p className="text-muted-foreground mb-4">
          Create or select a series to manage your romance books
        </p>
        <RomanceButton variant="primary">
          Create New Series
        </RomanceButton>
      </RomanceCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* Series Overview */}
      <RomanceCard variant="elegant">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h2 className="text-2xl font-serif font-semibold text-romance-burgundy-800 mb-2">
              {series.title}
            </h2>
            <div className="flex items-center space-x-4 mb-3">
              <HeatLevelBadge level={series.heatLevel} />
              <Badge variant="outline" className="text-romance-burgundy-700">
                <RomanceIcon name="book" className="mr-1" />
                {series.subgenre}
              </Badge>
              <Badge variant="outline" className="text-romance-burgundy-700">
                {series.publishedBooks}/{series.plannedBooks} published
              </Badge>
            </div>
            <p className="text-muted-foreground mb-4">{series.description}</p>
            {series.seriesArc && (
              <div className="bg-romance-blush-50 p-3 rounded-lg border border-romance-blush-200">
                <Label className="text-sm font-medium text-romance-burgundy-800">Series Arc:</Label>
                <p className="text-sm text-romance-burgundy-700 mt-1">{series.seriesArc}</p>
              </div>
            )}
          </div>
          <RomanceButton
            variant="secondary"
            size="sm"
            onClick={() => setIsEditingSeriesInfo(true)}
          >
            <RomanceIcon name="edit-pencil" className="mr-1" />
            Edit
          </RomanceButton>
        </div>
      </RomanceCard>

      {/* Books in Series */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-serif font-semibold text-romance-burgundy-800">
            Books in Series
          </h3>
          <RomanceButton
            variant="primary"
            size="sm"
            onClick={() => setIsAddingBook(true)}
          >
            <RomanceIcon name="plus" className="mr-1" />
            Add Book
          </RomanceButton>
        </div>

        <div className="grid gap-4">
          {series.books
            .sort((a, b) => a.bookNumber - b.bookNumber)
            .map((book, index) => (
              <RomanceCard key={book.id} className="relative">
                {index < series.books.length - 1 && (
                  <div className="series-book-connector" />
                )}
                
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <Badge variant="outline" className="font-mono text-xs">
                        #{book.bookNumber}
                      </Badge>
                      <h4 className="font-semibold text-romance-burgundy-800">
                        {book.title}
                      </h4>
                      <Badge 
                        variant="outline" 
                        className={statusConfig[book.status].className}
                      >
                        <RomanceIcon 
                          name={statusConfig[book.status].icon} 
                          className="mr-1" 
                        />
                        {statusConfig[book.status].label}
                      </Badge>
                      <HeatLevelBadge level={book.heatLevel} />
                    </div>
                    
                    {book.description && (
                      <p className="text-sm text-muted-foreground mb-3">
                        {book.description}
                      </p>
                    )}
                    
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <span className="text-muted-foreground">Progress:</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-romance-burgundy-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${getCompletionPercentage(book)}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium">
                            {getCompletionPercentage(book)}%
                          </span>
                        </div>
                      </div>
                      <div className="text-muted-foreground">
                        {book.wordCount.toLocaleString()} / {book.targetWordCount.toLocaleString()} words
                      </div>
                      {book.publishedDate && (
                        <div className="text-muted-foreground">
                          Published: {new Date(book.publishedDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <RomanceButton
                      variant="secondary"
                      size="sm"
                      onClick={() => setEditingBook(book)}
                    >
                      <RomanceIcon name="edit-pencil" />
                    </RomanceButton>
                    <RomanceButton
                      variant="secondary"
                      size="sm"
                      onClick={() => onBookDelete?.(book.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <RomanceIcon name="trash" />
                    </RomanceButton>
                  </div>
                </div>
              </RomanceCard>
            ))}
        </div>
      </div>

      {/* Edit Series Dialog */}
      <Dialog open={isEditingSeriesInfo} onOpenChange={setIsEditingSeriesInfo}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Series Information</DialogTitle>
            <DialogDescription>
              Update the details for your romance series
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="series-title">Series Title</Label>
              <Input
                id="series-title"
                value={seriesForm.title}
                onChange={(e) => setSeriesForm({ ...seriesForm, title: e.target.value })}
                className="romance-input"
              />
            </div>
            <div>
              <Label htmlFor="series-description">Description</Label>
              <Textarea
                id="series-description"
                value={seriesForm.description}
                onChange={(e) => setSeriesForm({ ...seriesForm, description: e.target.value })}
                className="romance-input"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="series-subgenre">Subgenre</Label>
                <Select value={seriesForm.subgenre} onValueChange={(value) => setSeriesForm({ ...seriesForm, subgenre: value })}>
                  <SelectTrigger className="romance-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contemporary">Contemporary</SelectItem>
                    <SelectItem value="historical">Historical</SelectItem>
                    <SelectItem value="paranormal">Paranormal</SelectItem>
                    <SelectItem value="fantasy">Fantasy</SelectItem>
                    <SelectItem value="sci_fi">Sci-Fi</SelectItem>
                    <SelectItem value="romantic_suspense">Romantic Suspense</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="series-heat-level">Heat Level</Label>
                <Select value={seriesForm.heatLevel} onValueChange={(value: HeatLevel) => setSeriesForm({ ...seriesForm, heatLevel: value })}>
                  <SelectTrigger className="romance-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sweet">Sweet</SelectItem>
                    <SelectItem value="warm">Warm</SelectItem>
                    <SelectItem value="steamy">Steamy</SelectItem>
                    <SelectItem value="scorching">Scorching</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="planned-books">Planned Books</Label>
              <Input
                id="planned-books"
                type="number"
                min={1}
                value={seriesForm.plannedBooks}
                onChange={(e) => setSeriesForm({ ...seriesForm, plannedBooks: parseInt(e.target.value) || 1 })}
                className="romance-input"
              />
            </div>
            <div>
              <Label htmlFor="series-arc">Series Arc</Label>
              <Textarea
                id="series-arc"
                value={seriesForm.seriesArc}
                onChange={(e) => setSeriesForm({ ...seriesForm, seriesArc: e.target.value })}
                className="romance-input"
                rows={3}
                placeholder="Describe the overarching storyline that connects all books..."
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditingSeriesInfo(false)}>
                Cancel
              </Button>
              <RomanceButton variant="primary" onClick={handleSeriesSubmit}>
                Save Changes
              </RomanceButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Book Dialog */}
      <Dialog open={isAddingBook} onOpenChange={setIsAddingBook}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Book to Series</DialogTitle>
            <DialogDescription>
              Create a new book in the "{series.title}" series
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="book-title">Book Title</Label>
                <Input
                  id="book-title"
                  value={bookForm.title}
                  onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
                  className="romance-input"
                />
              </div>
              <div>
                <Label htmlFor="book-number">Book Number</Label>
                <Input
                  id="book-number"
                  type="number"
                  min={1}
                  value={bookForm.bookNumber}
                  onChange={(e) => setBookForm({ ...bookForm, bookNumber: parseInt(e.target.value) || 1 })}
                  className="romance-input"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="book-description">Description</Label>
              <Textarea
                id="book-description"
                value={bookForm.description}
                onChange={(e) => setBookForm({ ...bookForm, description: e.target.value })}
                className="romance-input"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="book-status">Status</Label>
                <Select value={bookForm.status} onValueChange={(value: Book['status']) => setBookForm({ ...bookForm, status: value })}>
                  <SelectTrigger className="romance-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="ready_for_review">Ready for Review</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="book-heat-level">Heat Level</Label>
                <Select value={bookForm.heatLevel} onValueChange={(value: HeatLevel) => setBookForm({ ...bookForm, heatLevel: value })}>
                  <SelectTrigger className="romance-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sweet">Sweet</SelectItem>
                    <SelectItem value="warm">Warm</SelectItem>
                    <SelectItem value="steamy">Steamy</SelectItem>
                    <SelectItem value="scorching">Scorching</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="target-word-count">Target Word Count</Label>
                <Input
                  id="target-word-count"
                  type="number"
                  min={1000}
                  step={1000}
                  value={bookForm.targetWordCount}
                  onChange={(e) => setBookForm({ ...bookForm, targetWordCount: parseInt(e.target.value) || 80000 })}
                  className="romance-input"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsAddingBook(false)}>
                Cancel
              </Button>
              <RomanceButton variant="primary" onClick={handleBookSubmit}>
                Add Book
              </RomanceButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}