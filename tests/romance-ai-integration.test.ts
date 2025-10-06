import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  generateContent,
  buildMusePrompt,
  buildEditorPrompt,
  buildCoachPrompt,
  fetchProjectContext,
  analyzeWritingStyle,
  type AiRequest,
  type RomanceContext
} from '../server/openai';
import { storage } from '../server/storage';

// Mock the storage
vi.mock('../server/storage', () => ({
  storage: {
    getProject: vi.fn(),
    getProjectCharacters: vi.fn(),
    getProjectWorldbuilding: vi.fn(),
    saveAiGeneration: vi.fn(),
    getUserAiUsage: vi.fn(),
  },
}));

// Mock OpenAI
vi.mock('openai', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: vi.fn().mockResolvedValue({
            choices: [{
              message: {
                content: 'Generated romance content',
              },
            }],
          }),
        },
      },
    })),
  };
});

const mockProject = {
  id: 'test-project',
  title: 'Test Romance Novel',
  description: 'A contemporary romance novel',
  genre: 'romance',
  ownerId: 'user1',
  createdAt: new Date(),
  updatedAt: new Date(),
  characters: [
    {
      id: 'char1',
      name: 'Emma',
      role: 'protagonist',
      description: 'Strong-willed marketing executive',
      traits: ['ambitious', 'independent', 'vulnerable'],
      backstory: 'Recently divorced, focusing on her career',
    },
    {
      id: 'char2', 
      name: 'Jake',
      role: 'love_interest',
      description: 'Charming restaurant owner',
      traits: ['charismatic', 'protective', 'commitment-phobic'],
      backstory: 'Lost his previous restaurant in a divorce settlement',
    },
  ],
  worldbuilding: [
    {
      id: 'world1',
      title: 'Downtown Portland',
      category: 'location',
      description: 'Urban setting with trendy restaurants and corporate offices',
    },
  ],
};

const mockRomanceContext: RomanceContext = {
  heat_level: 'steamy',
  tropes: ['enemies-to-lovers', 'second-chance'],
  character_archetypes: {
    protagonist: 'strong-heroine',
    love_interest: 'alpha-hero',
  },
  relationship_stage: 'building-tension',
  conflict_type: 'internal',
  setting_mood: 'urban-contemporary',
  pov: 'dual',
  romance_subgenre: 'contemporary',
};

describe('Romance AI Assistant Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    (storage.getProject as any).mockResolvedValue(mockProject);
    (storage.getProjectCharacters as any).mockResolvedValue(mockProject.characters);
    (storage.getProjectWorldbuilding as any).mockResolvedValue(mockProject.worldbuilding);
    (storage.saveAiGeneration as any).mockResolvedValue({ id: 'gen1' });
    (storage.getUserAiUsage as any).mockResolvedValue({ count: 5, totalTokens: 1000 });
  });

  describe('Romance Muse AI', () => {
    it('builds proper romance muse prompts', async () => {
      const request: AiRequest = {
        persona: 'romance_muse',
        prompt: 'Write a steamy first encounter scene',
        projectId: 'test-project',
        romance_context: mockRomanceContext,
      };
      
      const prompt = await buildMusePrompt(request);
      
      expect(prompt).toContain('Romance Muse');
      expect(prompt).toContain('steamy');
      expect(prompt).toContain('enemies-to-lovers');
      expect(prompt).toContain('Emma');
      expect(prompt).toContain('Jake');
      expect(prompt).toContain('strong-heroine');
      expect(prompt).toContain('alpha-hero');
    });
    
    it('generates romance content with proper context', async () => {
      const request: AiRequest = {
        persona: 'romance_muse',
        prompt: 'Create a meet-cute scene in a restaurant',
        projectId: 'test-project',
        romance_context: mockRomanceContext,
      };
      
      const result = await generateContent(request, 'user1');
      
      expect(result.content).toBe('Generated romance content');
      expect(storage.saveAiGeneration).toHaveBeenCalledWith({
        projectId: 'test-project',
        userId: 'user1',
        persona: 'romance_muse',
        prompt: expect.stringContaining('Create a meet-cute scene'),
        response: 'Generated romance content',
        metadata: expect.objectContaining({
          romance_context: mockRomanceContext,
        }),
      });
    });
    
    it('includes character dynamics in scene generation', async () => {
      const request: AiRequest = {
        persona: 'romance_muse',
        prompt: 'Write a tension-filled argument scene',
        projectId: 'test-project',
        romance_context: {
          ...mockRomanceContext,
          relationship_stage: 'conflict',
          conflict_type: 'misunderstanding',
        },
      };
      
      const prompt = await buildMusePrompt(request);
      
      expect(prompt).toContain('ambitious');
      expect(prompt).toContain('commitment-phobic');
      expect(prompt).toContain('Recently divorced');
      expect(prompt).toContain('Lost his previous restaurant');
    });
  });

  describe('Romance Editor AI', () => {
    it('builds romance editing prompts with genre knowledge', async () => {
      const request: AiRequest = {
        persona: 'romance_editor',
        prompt: 'Review this love scene for pacing and heat level consistency',
        content: 'Sample romantic scene content...',
        romance_context: mockRomanceContext,
      };
      
      const prompt = await buildEditorPrompt(request);
      
      expect(prompt).toContain('Romance Editor');
      expect(prompt).toContain('steamy');
      expect(prompt).toContain('pacing');
      expect(prompt).toContain('heat level');
      expect(prompt).toContain('enemies-to-lovers');
    });
    
    it('analyzes trope execution', async () => {
      const request: AiRequest = {
        persona: 'romance_editor',
        prompt: 'Analyze trope consistency in this passage',
        content: 'The enemies finally kissed after weeks of tension...',
        romance_context: mockRomanceContext,
      };
      
      const result = await generateContent(request, 'user1');
      
      expect(result.content).toBe('Generated romance content');
      expect(storage.saveAiGeneration).toHaveBeenCalledWith(
        expect.objectContaining({
          persona: 'romance_editor',
          metadata: expect.objectContaining({
            content_type: 'editing',
            tropes_analyzed: ['enemies-to-lovers', 'second-chance'],
          }),
        })
      );
    });
  });

  describe('Romance Coach AI', () => {
    it('provides romance structure guidance', async () => {
      const request: AiRequest = {
        persona: 'romance_coach',
        prompt: 'Help me plot the emotional arc for my enemies-to-lovers story',
        romance_context: mockRomanceContext,
      };
      
      const prompt = await buildCoachPrompt(request);
      
      expect(prompt).toContain('Romance Coach');
      expect(prompt).toContain('emotional arc');
      expect(prompt).toContain('enemies-to-lovers');
      expect(prompt).toContain('building-tension');
    });
    
    it('analyzes character development', async () => {
      const request: AiRequest = {
        persona: 'romance_coach',
        prompt: 'Evaluate the romantic development between my main characters',
        projectId: 'test-project',
        romance_context: mockRomanceContext,
      };
      
      const result = await generateContent(request, 'user1');
      
      expect(storage.saveAiGeneration).toHaveBeenCalledWith(
        expect.objectContaining({
          persona: 'romance_coach',
          metadata: expect.objectContaining({
            analysis_type: 'character_development',
            characters_analyzed: ['Emma', 'Jake'],
          }),
        })
      );
    });
  });

  describe('Tension Builder AI', () => {
    it('analyzes romantic tension levels', async () => {
      const request: AiRequest = {
        persona: 'tension_builder',
        prompt: 'Analyze the sexual tension in this scene',
        content: 'Their eyes met across the crowded room...',
        romance_context: mockRomanceContext,
      };
      
      const result = await generateContent(request, 'user1');
      
      expect(result.content).toBe('Generated romance content');
      expect(storage.saveAiGeneration).toHaveBeenCalledWith(
        expect.objectContaining({
          persona: 'tension_builder',
          metadata: expect.objectContaining({
            analysis_type: 'tension_analysis',
            heat_level: 'steamy',
          }),
        })
      );
    });
    
    it('provides tension escalation suggestions', async () => {
      const request: AiRequest = {
        persona: 'tension_builder',
        prompt: 'Suggest ways to increase romantic tension before the climax',
        romance_context: {
          ...mockRomanceContext,
          relationship_stage: 'approaching-climax',
        },
      };
      
      const prompt = await buildMusePrompt(request);
      
      expect(prompt).toContain('tension');
      expect(prompt).toContain('approaching-climax');
      expect(prompt).toContain('enemies-to-lovers');
    });
  });

  describe('Dialogue Coach AI', () => {
    it('improves romantic dialogue', async () => {
      const request: AiRequest = {
        persona: 'dialogue_coach',
        prompt: 'Improve this romantic dialogue to sound more natural',
        content: '\"I love you,\" he said. \"I love you too,\" she replied.',
        romance_context: mockRomanceContext,
      };
      
      const result = await generateContent(request, 'user1');
      
      expect(storage.saveAiGeneration).toHaveBeenCalledWith(
        expect.objectContaining({
          persona: 'dialogue_coach',
          metadata: expect.objectContaining({
            improvement_type: 'dialogue_enhancement',
            character_voices: expect.arrayContaining(['Emma', 'Jake']),
          }),
        })
      );
    });
    
    it('maintains character voice consistency', async () => {
      const request: AiRequest = {
        persona: 'dialogue_coach',
        prompt: 'Check if this dialogue matches Emma\\'s established voice',
        content: '\"Whatever, I don\\'t care,\" Emma muttered.',
        projectId: 'test-project',
        romance_context: mockRomanceContext,
      };
      
      const prompt = await buildCoachPrompt(request);
      
      expect(prompt).toContain('Emma');
      expect(prompt).toContain('ambitious');
      expect(prompt).toContain('independent');
      expect(prompt).toContain('marketing executive');
    });
  });

  describe('Context Integration', () => {
    it('fetches complete project context', async () => {
      const context = await fetchProjectContext('test-project');
      
      expect(context.project).toEqual(mockProject);
      expect(context.characters).toEqual(mockProject.characters);
      expect(context.worldbuilding).toEqual(mockProject.worldbuilding);
      expect(storage.getProject).toHaveBeenCalledWith('test-project');
      expect(storage.getProjectCharacters).toHaveBeenCalledWith('test-project');
      expect(storage.getProjectWorldbuilding).toHaveBeenCalledWith('test-project');
    });
    
    it('analyzes writing style for romance consistency', async () => {
      const request = {
        projectId: 'test-project',
        content: 'Sample romance content with steamy scenes and emotional depth...',
        romance_context: mockRomanceContext,
      };
      
      const analysis = await analyzeWritingStyle(request, 'user1');
      
      expect(analysis.consistency).toBeDefined();
      expect(analysis.suggestions).toBeDefined();
      expect(storage.saveAiGeneration).toHaveBeenCalledWith(
        expect.objectContaining({
          persona: 'editor',
          metadata: expect.objectContaining({
            analysis_type: 'style_analysis',
            romance_elements: expect.any(Object),
          }),
        })
      );
    });
  });

  describe('Romance Content Generation Workflow', () => {
    it('generates complete romance scene with all AI assistants', async () => {
      // Step 1: Romance Coach plans the scene
      const planRequest: AiRequest = {
        persona: 'romance_coach',
        prompt: 'Plan a reconciliation scene for enemies-to-lovers',
        romance_context: mockRomanceContext,
      };
      
      await generateContent(planRequest, 'user1');
      
      // Step 2: Romance Muse writes the scene
      const writeRequest: AiRequest = {
        persona: 'romance_muse',
        prompt: 'Write the reconciliation scene between Emma and Jake',
        projectId: 'test-project',
        romance_context: mockRomanceContext,
      };
      
      await generateContent(writeRequest, 'user1');
      
      // Step 3: Tension Builder analyzes emotional impact
      const tensionRequest: AiRequest = {
        persona: 'tension_builder',
        prompt: 'Analyze the emotional tension in this reconciliation',
        content: 'Generated romance content',
        romance_context: mockRomanceContext,
      };
      
      await generateContent(tensionRequest, 'user1');
      
      // Step 4: Dialogue Coach refines dialogue
      const dialogueRequest: AiRequest = {
        persona: 'dialogue_coach',
        prompt: 'Polish the dialogue for emotional authenticity',
        content: 'Generated romance content',
        projectId: 'test-project',
        romance_context: mockRomanceContext,
      };
      
      await generateContent(dialogueRequest, 'user1');
      
      // Step 5: Romance Editor final review
      const editRequest: AiRequest = {
        persona: 'romance_editor',
        prompt: 'Final review for genre conventions and pacing',
        content: 'Generated romance content',
        romance_context: mockRomanceContext,
      };
      
      await generateContent(editRequest, 'user1');
      
      expect(storage.saveAiGeneration).toHaveBeenCalledTimes(5);
      expect(storage.saveAiGeneration).toHaveBeenCalledWith(
        expect.objectContaining({ persona: 'romance_coach' })
      );
      expect(storage.saveAiGeneration).toHaveBeenCalledWith(
        expect.objectContaining({ persona: 'romance_muse' })
      );
      expect(storage.saveAiGeneration).toHaveBeenCalledWith(
        expect.objectContaining({ persona: 'tension_builder' })
      );
      expect(storage.saveAiGeneration).toHaveBeenCalledWith(
        expect.objectContaining({ persona: 'dialogue_coach' })
      );
      expect(storage.saveAiGeneration).toHaveBeenCalledWith(
        expect.objectContaining({ persona: 'romance_editor' })
      );
    });
  });

  describe('Error Handling', () => {
    it('handles missing romance context gracefully', async () => {
      const request: AiRequest = {
        persona: 'romance_muse',
        prompt: 'Write a romantic scene',
        // No romance_context provided
      };
      
      const result = await generateContent(request, 'user1');
      
      expect(result.content).toBe('Generated romance content');
      expect(storage.saveAiGeneration).toHaveBeenCalled();
    });
    
    it('handles missing project context', async () => {
      (storage.getProject as any).mockResolvedValue(null);
      
      const request: AiRequest = {
        persona: 'romance_muse',
        prompt: 'Write a scene',
        projectId: 'nonexistent-project',
      };
      
      const result = await generateContent(request, 'user1');
      
      expect(result.content).toBe('Generated romance content');
    });
    
    it('validates heat level consistency', async () => {
      const inconsistentContext: RomanceContext = {
        ...mockRomanceContext,
        heat_level: 'sweet',
        tropes: ['instalove'], // Conflicts with sweet heat level expectation
      };
      
      const request: AiRequest = {
        persona: 'romance_editor',
        prompt: 'Review this steamy scene',
        content: 'Very explicit romantic content...',
        romance_context: inconsistentContext,
      };
      
      const result = await generateContent(request, 'user1');
      
      expect(storage.saveAiGeneration).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            consistency_warnings: expect.arrayContaining([
              expect.stringContaining('heat level')
            ]),
          }),
        })
      );
    });
  });
});