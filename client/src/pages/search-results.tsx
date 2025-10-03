import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  FileText, 
  Users, 
  Globe, 
  Clock,
  ChevronRight
} from "lucide-react";
import { SearchResult } from "@shared/schema";

export default function SearchResultsPage() {
  const [location, navigate] = useLocation();
  const searchParams = new URLSearchParams(location.split('?')[1] || '');
  const initialQuery = searchParams.get('q') || '';
  
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      // Update URL
      if (searchQuery) {
        navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, navigate]);

  // Fetch search results
  const { data: results = [], isLoading } = useQuery<SearchResult[]>({
    queryKey: [`/api/search?q=${debouncedQuery}&limit=100`],
    enabled: debouncedQuery.length >= 2,
  });

  // Categorize results
  const documents = results.filter(r => r.type === 'document');
  const characters = results.filter(r => r.type === 'character');
  const worldbuilding = results.filter(r => r.type === 'worldbuilding');
  const timeline = results.filter(r => r.type === 'timeline');

  const allCount = results.length;
  const counts = {
    documents: documents.length,
    characters: characters.length,
    worldbuilding: worldbuilding.length,
    timeline: timeline.length,
  };

  // Get navigation path for result
  const getResultPath = (result: SearchResult) => {
    switch (result.type) {
      case "document":
        return `/projects/${result.projectId}/documents/${result.id}`;
      case "character":
        return `/projects/${result.projectId}?tab=characters`;
      case "worldbuilding":
        return `/projects/${result.projectId}?tab=worldbuilding`;
      case "timeline":
        return `/projects/${result.projectId}?tab=timeline`;
      default:
        return `/projects/${result.projectId}`;
    }
  };

  // Truncate content for preview
  const truncateContent = (content: string, maxLength: number = 150) => {
    const stripped = content.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').trim();
    if (stripped.length <= maxLength) return stripped;
    return stripped.substring(0, maxLength).trim() + '...';
  };

  // Result card component
  const ResultCard = ({ result }: { result: SearchResult }) => (
    <Link href={getResultPath(result)}>
      <Card className="cursor-pointer hover:bg-accent/50 transition-colors" data-testid={`search-result-card-${result.id}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <div className="mt-1">
                {result.type === 'document' && <FileText className="h-5 w-5 text-blue-500" />}
                {result.type === 'character' && <Users className="h-5 w-5 text-purple-500" />}
                {result.type === 'worldbuilding' && <Globe className="h-5 w-5 text-green-500" />}
                {result.type === 'timeline' && <Clock className="h-5 w-5 text-orange-500" />}
              </div>
              <div className="flex-1">
                <CardTitle className="text-base">{result.title}</CardTitle>
                <CardDescription className="mt-1">
                  {result.projectTitle}
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="capitalize">
              {result.type}
            </Badge>
          </div>
        </CardHeader>
        {result.content && (
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground line-clamp-2">
              {truncateContent(result.content)}
            </p>
          </CardContent>
        )}
      </Card>
    </Link>
  );

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-4">Search</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search across all your projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            autoFocus
            data-testid="input-search-page"
          />
        </div>
      </div>

      {debouncedQuery.length < 2 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Enter at least 2 characters to search</p>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p>Searching...</p>
          </CardContent>
        </Card>
      ) : results.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground" data-testid="text-no-search-results">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No results found for "{debouncedQuery}"</p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all" data-testid="tab-all">
              All ({allCount})
            </TabsTrigger>
            <TabsTrigger value="documents" data-testid="tab-documents">
              Documents ({counts.documents})
            </TabsTrigger>
            <TabsTrigger value="characters" data-testid="tab-characters">
              Characters ({counts.characters})
            </TabsTrigger>
            <TabsTrigger value="worldbuilding" data-testid="tab-worldbuilding">
              Worldbuilding ({counts.worldbuilding})
            </TabsTrigger>
            <TabsTrigger value="timeline" data-testid="tab-timeline">
              Timeline ({counts.timeline})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6 space-y-4">
            {results.map(result => (
              <ResultCard key={`${result.type}-${result.id}`} result={result} />
            ))}
          </TabsContent>

          <TabsContent value="documents" className="mt-6 space-y-4">
            {documents.length > 0 ? (
              documents.map(result => (
                <ResultCard key={result.id} result={result} />
              ))
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No documents found
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="characters" className="mt-6 space-y-4">
            {characters.length > 0 ? (
              characters.map(result => (
                <ResultCard key={result.id} result={result} />
              ))
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No characters found
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="worldbuilding" className="mt-6 space-y-4">
            {worldbuilding.length > 0 ? (
              worldbuilding.map(result => (
                <ResultCard key={result.id} result={result} />
              ))
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No worldbuilding entries found
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="timeline" className="mt-6 space-y-4">
            {timeline.length > 0 ? (
              timeline.map(result => (
                <ResultCard key={result.id} result={result} />
              ))
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No timeline events found
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
