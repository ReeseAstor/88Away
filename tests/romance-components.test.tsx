import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

// Mock the API calls
vi.mock('../src/lib/queryClient', () => ({
  queryClient: new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  }),
}));

// Romance Components
import { SeriesManagementPanel } from '../src/components/romance/series-management-panel';
import { TropeTracker } from '../src/components/romance/trope-tracker';
import { HeatLevelManager } from '../src/components/romance/heat-level-manager';
import { CharacterRelationshipMapper } from '../src/components/romance/character-relationship-mapper';
import { RomanceMarketTrends } from '../src/components/romance/romance-market-trends';
import { ROICalculator } from '../src/components/romance/roi-calculator';

// Test utilities
const createTestWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        {children}
      </MemoryRouter>
    </QueryClientProvider>
  );
};

// Mock data
const mockRomanceSeries = {
  id: '1',
  title: 'Test Romance Series',
  authorId: 'user1',
  genre: 'contemporary',
  subgenre: 'billionaire',
  totalBooks: 3,
  publishedBooks: 2,
  heatLevel: 'steamy',
  tropes: ['enemies-to-lovers', 'second-chance'],
  status: 'active',
  description: 'A test romance series',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockTropes = [
  {
    id: '1',
    name: 'enemies-to-lovers',
    category: 'relationship',
    popularity: 95,
    description: 'Characters start as enemies but fall in love',
    compatibleWith: ['second-chance', 'fake-dating'],
    conflictsWith: ['instalove'],
  },
  {
    id: '2',
    name: 'fake-dating',
    category: 'situation',
    popularity: 87,
    description: 'Characters pretend to date for mutual benefit',
    compatibleWith: ['enemies-to-lovers'],
    conflictsWith: ['arranged-marriage'],
  },
];

const mockCharacterRelationships = [
  {
    id: '1',
    character1Id: 'char1',
    character2Id: 'char2',
    relationshipType: 'romantic',
    intensity: 8,
    development: 'developing',
    conflicts: ['trust-issues'],
    milestones: ['first-meeting', 'first-kiss'],
  },
];

describe('Romance Components', () => {
  let queryClient: QueryClient;
  
  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    
    // Mock fetch
    global.fetch = vi.fn();
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('SeriesManagementPanel', () => {
    it('renders series list correctly', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [mockRomanceSeries],
      });
      
      const Wrapper = createTestWrapper();
      render(
        <Wrapper>
          <SeriesManagementPanel projectId=\"test-project\" />
        </Wrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByText('Test Romance Series')).toBeInTheDocument();
      });
      
      expect(screen.getByText('contemporary')).toBeInTheDocument();
      expect(screen.getByText('steamy')).toBeInTheDocument();
    });
    
    it('allows creating new series', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockRomanceSeries,
        });
      
      const Wrapper = createTestWrapper();
      render(
        <Wrapper>
          <SeriesManagementPanel projectId=\"test-project\" />
        </Wrapper>
      );
      
      const createButton = screen.getByText(/create.*series/i);
      fireEvent.click(createButton);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/series title/i)).toBeInTheDocument();
      });
      
      fireEvent.change(screen.getByLabelText(/series title/i), {
        target: { value: 'New Series' },
      });
      
      fireEvent.click(screen.getByText(/save/i));
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/romance/series'),
          expect.objectContaining({
            method: 'POST',
          })
        );
      });
    });
    
    it('displays series statistics', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [mockRomanceSeries],
      });
      
      const Wrapper = createTestWrapper();
      render(
        <Wrapper>
          <SeriesManagementPanel projectId=\"test-project\" />
        </Wrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByText('2/3 Published')).toBeInTheDocument();
      });
    });
  });

  describe('TropeTracker', () => {
    it('renders trope list with compatibility analysis', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTropes,
      });
      
      const Wrapper = createTestWrapper();
      render(
        <Wrapper>
          <TropeTracker projectId=\"test-project\" selectedTropes={['enemies-to-lovers']} />
        </Wrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByText('enemies-to-lovers')).toBeInTheDocument();
      });
      
      expect(screen.getByText('fake-dating')).toBeInTheDocument();
    });
    
    it('shows trope conflicts', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTropes,
      });
      
      const Wrapper = createTestWrapper();
      render(
        <Wrapper>
          <TropeTracker 
            projectId=\"test-project\" 
            selectedTropes={['enemies-to-lovers', 'instalove']} 
          />
        </Wrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByText(/conflict detected/i)).toBeInTheDocument();
      });
    });
    
    it('allows adding and removing tropes', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTropes,
      });
      
      const mockOnTropesChange = vi.fn();
      
      const Wrapper = createTestWrapper();
      render(
        <Wrapper>
          <TropeTracker 
            projectId=\"test-project\" 
            selectedTropes={[]} 
            onTropesChange={mockOnTropesChange}
          />
        </Wrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByText('enemies-to-lovers')).toBeInTheDocument();
      });
      
      const addButton = screen.getByTestId('add-trope-enemies-to-lovers');
      fireEvent.click(addButton);
      
      expect(mockOnTropesChange).toHaveBeenCalledWith(['enemies-to-lovers']);
    });
  });

  describe('HeatLevelManager', () => {
    it('renders heat level options', () => {
      const Wrapper = createTestWrapper();
      render(
        <Wrapper>
          <HeatLevelManager currentLevel=\"steamy\" onLevelChange={vi.fn()} />
        </Wrapper>
      );
      
      expect(screen.getByText('sweet')).toBeInTheDocument();
      expect(screen.getByText('steamy')).toBeInTheDocument();
      expect(screen.getByText('spicy')).toBeInTheDocument();
    });
    
    it('calls onLevelChange when level is selected', () => {
      const mockOnLevelChange = vi.fn();
      
      const Wrapper = createTestWrapper();
      render(
        <Wrapper>
          <HeatLevelManager currentLevel=\"sweet\" onLevelChange={mockOnLevelChange} />
        </Wrapper>
      );
      
      fireEvent.click(screen.getByText('steamy'));
      expect(mockOnLevelChange).toHaveBeenCalledWith('steamy');
    });
    
    it('shows consistency warnings', () => {
      const Wrapper = createTestWrapper();
      render(
        <Wrapper>
          <HeatLevelManager 
            currentLevel=\"sweet\" 
            sceneAnalysis={[
              { scene: 'Scene 1', detectedLevel: 'spicy', confidence: 0.9 }
            ]}
            onLevelChange={vi.fn()} 
          />
        </Wrapper>
      );
      
      expect(screen.getByText(/inconsistency detected/i)).toBeInTheDocument();
    });
  });

  describe('CharacterRelationshipMapper', () => {
    it('renders relationship graph', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockCharacterRelationships,
      });
      
      const Wrapper = createTestWrapper();
      render(
        <Wrapper>
          <CharacterRelationshipMapper projectId=\"test-project\" />
        </Wrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByTestId('relationship-graph')).toBeInTheDocument();
      });
    });
    
    it('allows editing relationship intensity', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockCharacterRelationships,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ ...mockCharacterRelationships[0], intensity: 9 }),
        });
      
      const Wrapper = createTestWrapper();
      render(
        <Wrapper>
          <CharacterRelationshipMapper projectId=\"test-project\" />
        </Wrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('8')).toBeInTheDocument();
      });
      
      const intensitySlider = screen.getByDisplayValue('8');
      fireEvent.change(intensitySlider, { target: { value: '9' } });
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/romance/relationships'),
          expect.objectContaining({
            method: 'PUT',
          })
        );
      });
    });
  });

  describe('RomanceMarketTrends', () => {
    it('renders market trend charts', async () => {
      const mockTrendData = {
        genres: [
          { name: 'contemporary', growth: 15, popularity: 85 },
          { name: 'paranormal', growth: -5, popularity: 65 },
        ],
        tropes: [
          { name: 'enemies-to-lovers', mentions: 1250, growth: 20 },
          { name: 'fake-dating', mentions: 980, growth: 12 },
        ],
      };
      
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTrendData,
      });
      
      const Wrapper = createTestWrapper();
      render(
        <Wrapper>
          <RomanceMarketTrends timeframe=\"quarter\" region=\"global\" />
        </Wrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByText('contemporary')).toBeInTheDocument();
        expect(screen.getByText('15%')).toBeInTheDocument();
      });
    });
  });

  describe('ROICalculator', () => {
    it('calculates profitability correctly', async () => {
      const Wrapper = createTestWrapper();
      render(
        <Wrapper>
          <ROICalculator />
        </Wrapper>
      );
      
      // Input production costs
      fireEvent.change(screen.getByLabelText(/production cost/i), {
        target: { value: '1000' },
      });
      
      // Input expected sales
      fireEvent.change(screen.getByLabelText(/expected sales/i), {
        target: { value: '500' },
      });
      
      // Input price
      fireEvent.change(screen.getByLabelText(/price/i), {
        target: { value: '4.99' },
      });
      
      fireEvent.click(screen.getByText(/calculate/i));
      
      await waitFor(() => {
        expect(screen.getByText(/roi.*149/i)).toBeInTheDocument();
      });
    });
    
    it('shows break-even analysis', async () => {
      const Wrapper = createTestWrapper();
      render(
        <Wrapper>
          <ROICalculator />
        </Wrapper>
      );
      
      fireEvent.change(screen.getByLabelText(/production cost/i), {
        target: { value: '1000' },
      });
      
      fireEvent.change(screen.getByLabelText(/price/i), {
        target: { value: '2.99' },
      });
      
      fireEvent.click(screen.getByText(/calculate/i));
      
      await waitFor(() => {
        expect(screen.getByText(/break-even.*334/i)).toBeInTheDocument();
      });
    });
  });
});

// Integration Tests
describe('Romance Component Integration', () => {
  it('integrates series management with trope tracking', async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [mockRomanceSeries],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockTropes,
      });
    
    const Wrapper = createTestWrapper();
    render(
      <Wrapper>
        <div>
          <SeriesManagementPanel projectId=\"test-project\" />
          <TropeTracker 
            projectId=\"test-project\" 
            selectedTropes={mockRomanceSeries.tropes}
          />
        </div>
      </Wrapper>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Test Romance Series')).toBeInTheDocument();
      expect(screen.getByText('enemies-to-lovers')).toBeInTheDocument();
    });
  });
  
  it('validates heat level consistency across components', async () => {
    const Wrapper = createTestWrapper();
    render(
      <Wrapper>
        <div>
          <HeatLevelManager 
            currentLevel=\"steamy\" 
            sceneAnalysis={[
              { scene: 'Scene 1', detectedLevel: 'sweet', confidence: 0.8 }
            ]}
            onLevelChange={vi.fn()}
          />
        </div>
      </Wrapper>
    );
    
    expect(screen.getByText(/inconsistency detected/i)).toBeInTheDocument();
  });
});