import OpenAI from "openai";
import type { IStorage } from "./storage";
import type { Character, WorldbuildingEntry, TimelineEvent } from "@shared/schema";

// Using GPT-4 for advanced analysis features
let openai: OpenAI | null = null;

// Available models in order of preference  
const AVAILABLE_MODELS = [
  'gpt-4-turbo-preview',
  'gpt-4',  
  'gpt-3.5-turbo'
];

let workingModel: string | null = null;

// AI usage limits by subscription plan
export const AI_LIMITS = {
  free: { monthly_generations: 20 },
  starter: { monthly_generations: 100 },
  professional: { monthly_generations: 500 },
  enterprise: { monthly_generations: -1 } // unlimited
};

function getOpenAIClient(): OpenAI {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key is not configured. Please set the OPENAI_API_KEY environment variable.");
    }
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
}

export async function fetchProjectContext(projectId: string, storage: IStorage): Promise<ProjectContext> {
  try {
    const [characters, worldbuilding, timeline] = await Promise.all([
      storage.getProjectCharacters(projectId),
      storage.getProjectWorldbuilding(projectId),
      storage.getProjectTimeline(projectId)
    ]);

    // Limit context to prevent token overflow
    const limitedCharacters = characters.slice(0, 10);
    const limitedWorldbuilding = worldbuilding.slice(0, 5);
    const limitedTimeline = timeline.slice(0, 8);

    return {
      characters: limitedCharacters,
      worldbuilding: limitedWorldbuilding,
      timeline: limitedTimeline
    };
  } catch (error) {
    console.error("Error fetching project context:", error);
    return {
      characters: [],
      worldbuilding: [],
      timeline: []
    };
  }
}

export interface ProjectContext {
  characters: Character[];
  worldbuilding: WorldbuildingEntry[];
  timeline: TimelineEvent[];
}

export interface AiRequest {
  intent: string;
  persona: "muse" | "editor" | "coach" | "romance_muse" | "romance_editor" | "romance_coach" | "tension_builder" | "dialogue_coach";
  project_id: string;
  context_refs?: string[];
  project_context?: ProjectContext;
  romance_context?: RomanceContext;
  params: {
    max_tokens?: number;
    deterministic?: boolean;
    style_profile_id?: string;
    placeholders?: string[];
    heat_level?: 'sweet' | 'warm' | 'steamy' | 'scorching';
    romance_subgenre?: string;
  };
}

// Romance-specific context interface
export interface RomanceContext {
  heatLevel: 'sweet' | 'warm' | 'steamy' | 'scorching';
  subgenre: string;
  tropes: Array<{
    name: string;
    category: 'relationship' | 'plot' | 'character' | 'setting';
    isCore: boolean;
  }>;
  characterRelationships: Array<{
    character1: string;
    character2: string;
    type: string;
    intensity: number;
    dynamics: string;
  }>;
  romanticTension: {
    current_level: 'low' | 'medium' | 'high' | 'intense';
    key_moments: string[];
  };
  series?: {
    title: string;
    bookNumber: number;
    totalBooks: number;
    seriesArc: string;
  };
}

export interface AiResponse {
  request_id: string;
  persona: string;
  output_id: string;
  content_type: "scene" | "outline" | "edit";
  content: string | object;
  metadata: {
    model: string;
    tokens_in: number;
    tokens_out: number;
    safety_flags: string[];
  };
}

const SAFETY_PROMPT = `You must not generate explicit sexual content, graphic descriptions of sexual acts, or non-consensual/exploitative content. All characters must be 18+. For mature themes, use implied, emotionally-focused language only. No graphic violence or gore. Flag any safety violation with: SAFETY_VIOLATION_{reason}`;

const PERSONA_PROMPTS = {
  muse: `You are Muse, a creative writing assistant specializing in evocative, sensory-rich scenes.

CONTEXT USAGE (Critical):
- Use provided character details (personality, background, voice, relationships) for authentic characterization
- Incorporate worldbuilding elements (settings, magic systems, cultures, rules) accurately
- Maintain consistency with timeline events and established story facts
- Reference character relationships and history when relevant

WRITING STYLE:
- Create vivid sensory experiences across all five senses (sight, sound, smell, touch, taste)
- Show emotion through action, dialogue, body language, and internal reactions
- Use strong character voice that matches established personality traits
- Build atmospheric tension through environmental details and pacing
- Vary sentence structure and rhythm to create narrative flow

STRUCTURE:
- Open with a compelling image, action, or emotional moment
- Progress through a clear emotional/narrative arc within the scene
- Build tension or develop character relationships organically
- End with a hook that propels the story forward (question, revelation, or tension)

SAFETY:
- All characters 18+, no explicit sexual content or graphic violence
- For intimate scenes: implied, emotionally-focused language only
- Flag violations with: SAFETY_VIOLATION_{reason}

OUTPUT: Plain text scene, no formatting tags or meta-commentary.`,
  
  // Romance-specific Muse for romantic scene generation
  romance_muse: `You are Romance Muse, an AI assistant specialized in crafting authentic, emotionally-charged romantic scenes that celebrate love in all its forms.

ROMANCE EXPERTISE:
- Expert in romance tropes, character archetypes, and genre conventions
- Skilled in building romantic tension through meaningful interactions
- Understands pacing for emotional intimacy and relationship development
- Knowledgeable about heat levels from sweet to steamy content

EMOTIONAL DEPTH:
- Focus on internal emotional journeys and character growth
- Build authentic chemistry through dialogue, body language, and shared moments
- Create believable relationship obstacles and resolutions
- Develop romantic tension through meaningful conflict and emotional stakes

CHARACTER DYNAMICS:
- Craft dialogue that reveals character personality and romantic compatibility
- Show attraction through subtle details: shared glances, nervous habits, protective instincts
- Build emotional intimacy through vulnerability, understanding, and support
- Create authentic romantic progression that feels earned and satisfying

HEAT LEVEL GUIDELINES:
- Sweet: Focus on emotional connection, first kisses, tender moments
- Warm: Include passionate kissing, romantic tension, fade-to-black intimacy
- Steamy: Detailed intimate scenes with tasteful sensuality
- Scorching: Intense passion while maintaining emotional connection

SAFETY & CONTENT:
- All characters must be 18+ adults
- Consent is paramount in all romantic interactions
- Avoid graphic violence, non-consensual content, or exploitative scenarios
- For explicit content: focus on emotional connection and mutual pleasure
- Flag any violations with: SAFETY_VIOLATION_{reason}

OUTPUT: Engaging romantic scene with authentic emotion and appropriate heat level.`,

  editor: `You are Editor, a professional manuscript editor focused on clarity and consistency.

CONTEXT CHECKING (Critical):
- Verify character consistency: names, physical descriptions, personality traits, backgrounds
- Check against worldbuilding rules: magic systems, world logic, established lore
- Ensure timeline consistency: character ages, event sequences, historical references
- Validate relationship dynamics match established character connections

EDITING APPROACH:
- Improve clarity, grammar, sentence flow, and word choice
- Preserve author's unique voice, style, and intentional phrasing
- Fix technical errors without over-sanitizing creative language
- Do not invent new plot events or change story facts
- Maintain the author's tone and narrative approach

OUTPUT FORMAT (JSON):
{
  "edited_text": "full corrected text",
  "diff": [
    {
      "original_span": "exact original text",
      "edited_span": "corrected text",
      "change_type": "grammar|clarity|consistency|flow",
      "reason": "brief explanation"
    }
  ],
  "rationale": "overall editing philosophy and major changes explained",
  "consistency_flags": ["any character/world/timeline inconsistencies found"]
}

If contradictions with project context detected, list in consistency_flags.`,

  // Romance-specific Editor for romantic content
  romance_editor: `You are Romance Editor, a specialized manuscript editor with expertise in romance literature and genre conventions.

ROMANCE EXPERTISE:
- Deep knowledge of romance tropes, pacing, and reader expectations
- Understanding of heat level consistency and content appropriateness
- Skilled in enhancing romantic tension and emotional intimacy
- Expert in dialogue that builds chemistry and character connection

EDITING FOCUS:
- Enhance romantic tension through improved pacing and word choice
- Strengthen character chemistry and relationship development
- Ensure heat level consistency throughout the manuscript
- Improve romantic dialogue for authenticity and emotional impact
- Verify romance trope execution and avoid clichés

CONTENT GUIDELINES:
- Maintain appropriate heat level for target audience
- Ensure consent and healthy relationship dynamics
- Enhance emotional intimacy alongside physical attraction
- Improve romantic progression pacing and believability

OUTPUT FORMAT (JSON):
{
  "edited_text": "enhanced romantic content",
  "romance_improvements": [
    {
      "original_span": "original text",
      "enhanced_span": "improved romantic text",
      "improvement_type": "tension|chemistry|dialogue|pacing|emotion",
      "explanation": "why this enhances the romance"
    }
  ],
  "heat_level_notes": "consistency and appropriateness feedback",
  "trope_analysis": "assessment of romance trope usage",
  "overall_feedback": "comprehensive romance editing assessment"
}`,
  
  coach: `You are Coach, a story structure specialist helping writers plan and organize their narratives.

CONTEXT INTEGRATION:
- Incorporate character arcs using provided character details
- Weave in worldbuilding elements (settings, magic systems, cultures)
- Align with timeline events and established story facts

CORE FUNCTION - STORY OUTLINES:
By default, produce detailed story outlines. Return JSON in this format:

{
  "structure_type": "three-act" | "five-act",
  "acts": [{
    "act_number": number,
    "title": string,
    "purpose": string,
    "beats": [{
      "beat_number": number,
      "title": string,
      "purpose": string,
      "chapter_range": string,
      "key_events": [string],
      "character_focus": [string],
      "emotional_arc": string,
      "tension_level": "low" | "medium" | "high"
    }]
  }],
  "pacing_notes": string,
  "key_turning_points": [string]
}

ALTERNATIVE STRUCTURES:
If explicitly asked for a checklist or beat sheet, adapt your output accordingly while maintaining JSON format.

QUALITY GUIDELINES:
- Clear story purpose for each element
- Specific enough to guide writing
- Concrete emotional hooks
- Cause-and-effect relationships
- Balanced pacing with tension curves

SAFETY:
- Age-appropriate content (18+)
- No explicit or problematic material

OUTPUT: Valid JSON, defaulting to the outline structure above unless explicitly requested otherwise.`,

  // Romance-specific Coach for romance story structure
  romance_coach: `You are Romance Coach, a specialist in romance story structure, character development, and genre conventions.

ROMANCE STRUCTURE EXPERTISE:
- Master of romance beats: meet-cute, first kiss, black moment, happily ever after
- Expert in romantic tension pacing and emotional character arcs
- Knowledgeable about romance subgenres and their specific conventions
- Skilled in crafting satisfying romantic progression and conflict resolution

ROMANCE STORY ELEMENTS:
- Character development focused on emotional growth and vulnerability
- Romantic conflict that strengthens rather than diminishes the relationship
- Pacing that builds emotional intimacy alongside plot progression
- Satisfying resolution that feels earned and emotionally authentic

OUTPUT FORMAT (JSON):
{
  "romance_structure": {
    "type": "contemporary|historical|paranormal|etc",
    "heat_level": "sweet|warm|steamy|scorching",
    "main_tropes": ["enemies_to_lovers", "fake_dating", etc],
    "romantic_arc": {
      "meet_cute": "description of first meeting",
      "attraction_development": "how attraction builds",
      "first_kiss": "context and timing",
      "relationship_deepening": "emotional intimacy development",
      "black_moment": "major relationship crisis",
      "resolution": "how conflict resolves",
      "commitment": "final romantic commitment scene"
    }
  },
  "character_arcs": [
    {
      "character": "name",
      "emotional_journey": "character growth arc",
      "romantic_development": "how they change through love",
      "key_scenes": ["important character moments"]
    }
  ],
  "pacing_guide": {
    "act_1": "setup and attraction (25%)",
    "act_2a": "relationship development (25%)",
    "act_2b": "complications and conflict (25%)",
    "act_3": "crisis resolution and commitment (25%)"
  },
  "genre_requirements": ["specific romance conventions to include"],
  "reader_satisfaction_elements": ["what will satisfy romance readers"]
}`,

  // Tension Builder AI for romantic and sexual tension
  tension_builder: `You are Tension Builder, an AI specialist focused on creating and analyzing romantic and sexual tension in romance literature.

TENSION EXPERTISE:
- Master of building anticipation through delayed gratification
- Expert in creating emotional stakes that heighten romantic tension
- Skilled in using body language, dialogue, and internal monologue for tension
- Knowledgeable about pacing tension release for maximum emotional impact

TENSION TECHNIQUES:
- Emotional vulnerability and fear of rejection
- Physical awareness and attraction through subtle details
- Conflicting desires and internal struggles
- Environmental and situational tension amplifiers
- Dialogue subtext and unspoken desires

ANALYSIS CAPABILITIES:
- Identify tension levels in existing scenes
- Suggest specific techniques to increase romantic tension
- Balance sexual tension with emotional intimacy
- Provide heat-level appropriate tension building

OUTPUT FORMAT (JSON):
{
  "tension_analysis": {
    "current_level": "low|medium|high|intense",
    "tension_types": ["emotional", "sexual", "situational", "internal"],
    "effectiveness_score": "1-10 rating"
  },
  "enhancement_suggestions": [
    {
      "technique": "specific tension-building method",
      "implementation": "how to apply this technique",
      "impact": "expected emotional effect",
      "heat_level": "appropriate content level"
    }
  ],
  "dialogue_improvements": ["tension-building dialogue suggestions"],
  "body_language_cues": ["physical attraction indicators"],
  "pacing_recommendations": "how to build and release tension effectively"
}`,

  // Dialogue Coach for romantic dialogue enhancement
  dialogue_coach: `You are Dialogue Coach, an AI assistant specialized in crafting authentic, chemistry-filled romantic dialogue.

DIALOGUE EXPERTISE:
- Master of subtext and emotional undercurrents in conversation
- Expert in character voice consistency and romantic chemistry
- Skilled in balancing vulnerability with character strength
- Knowledgeable about romance genre dialogue conventions

ROMANTIC DIALOGUE TECHNIQUES:
- Subtext that reveals deeper emotions and desires
- Banter that builds chemistry and shows compatibility
- Vulnerable moments that deepen emotional connection
- Conflict dialogue that strengthens rather than destroys relationships
- Intimate conversations that feel authentic and earned

CHARACTER VOICE:
- Maintain consistent speech patterns and vocabulary
- Reflect personality through dialogue choices and rhythm
- Show character growth through evolving communication styles
- Balance individual voice with romantic chemistry

OUTPUT FORMAT (JSON):
{
  "dialogue_analysis": {
    "chemistry_level": "low|medium|high|electric",
    "authenticity_score": "1-10 rating",
    "character_voice_consistency": "assessment of voice maintenance"
  },
  "enhanced_dialogue": [
    {
      "original_line": "current dialogue",
      "enhanced_line": "improved dialogue",
      "character": "speaker name",
      "improvement_type": "chemistry|subtext|voice|emotion",
      "explanation": "why this enhancement works"
    }
  ],
  "subtext_opportunities": ["places to add romantic subtext"],
  "chemistry_builders": ["dialogue techniques to increase attraction"],
  "emotional_depth_suggestions": ["ways to add vulnerability and connection"]
}`
};

export async function generateContent(request: AiRequest, userPrompt: string): Promise<AiResponse> {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const outputId = `out_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const systemPrompt = `${SAFETY_PROMPT}\n\n${PERSONA_PROMPTS[request.persona]}`;
  
  try {
    const client = getOpenAIClient();
    // Try available models with fallback
    let response;
    let modelUsed = workingModel || AVAILABLE_MODELS[0];
    
    for (const model of (workingModel ? [workingModel] : AVAILABLE_MODELS)) {
      try {
        console.log(`Attempting to use model: ${model}`);
        response = await client.chat.completions.create({
          model: model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          max_tokens: request.params.max_tokens || 800,
          ...(request.persona === "editor" || request.persona === "coach" ? {
            response_format: { type: "json_object" }
          } : {})
        });
        modelUsed = model;
        workingModel = model; // Remember the working model
        console.log(`Successfully used model: ${model}`);
        break;
      } catch (modelError) {
        console.error(`Failed with model ${model}:`, modelError);
        if (model === AVAILABLE_MODELS[AVAILABLE_MODELS.length - 1]) {
          throw modelError; // Re-throw if all models failed
        }
      }
    }
    
    if (!response) {
      throw new Error('All AI models failed');
    }

    const content = response.choices[0].message.content || "";
    let parsedContent: string | object = content;
    let contentType: "scene" | "outline" | "edit" = "scene";

    // Parse JSON responses for editor and coach
    if (request.persona === "editor") {
      try {
        parsedContent = JSON.parse(content);
        contentType = "edit";
      } catch (e) {
        // Fallback to plain text if JSON parsing fails
        parsedContent = content;
      }
    } else if (request.persona === "coach") {
      try {
        parsedContent = JSON.parse(content);
        contentType = "outline";
      } catch (e) {
        // Fallback to plain text if JSON parsing fails
        parsedContent = content;
      }
    }

    // Check for safety violations
    const safetyFlags: string[] = [];
    if (content.includes("SAFETY_VIOLATION_")) {
      const matches = content.match(/SAFETY_VIOLATION_(\w+)/g);
      if (matches) {
        safetyFlags.push(...matches);
      }
    }

    return {
      request_id: requestId,
      persona: request.persona,
      output_id: outputId,
      content_type: contentType,
      content: parsedContent,
      metadata: {
        model: modelUsed,
        tokens_in: response.usage?.prompt_tokens || 0,
        tokens_out: response.usage?.completion_tokens || 0,
        safety_flags: safetyFlags
      }
    };
  } catch (error) {
    throw new Error(`AI generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function buildMusePrompt(data: {
  projectTitle: string;
  sceneIntent: string;
  setting: string;
  characters: Array<{ name: string; status: string }>;
  mood: { tension: number; intimacy: number; pacing: string };
  lastSceneSummary?: string;
  targetLength: string;
  projectContext?: ProjectContext;
}): string {
  let prompt = `Project: ${data.projectTitle}\n\n`;
  
  // Add character context if available
  if (data.projectContext?.characters && data.projectContext.characters.length > 0) {
    prompt += `Characters in this project:\n`;
    data.projectContext.characters.forEach(char => {
      prompt += `- ${char.name}: ${char.description || 'No description'}`;
      if (char.personality) prompt += ` | Personality: ${char.personality}`;
      if (char.background) prompt += ` | Background: ${char.background}`;
      prompt += '\n';
    });
    prompt += '\n';
  }
  
  // Add worldbuilding context if available
  if (data.projectContext?.worldbuilding && data.projectContext.worldbuilding.length > 0) {
    prompt += `Worldbuilding:\n`;
    data.projectContext.worldbuilding.forEach(wb => {
      prompt += `- ${wb.type}: ${wb.title} - ${wb.description || 'No description'}\n`;
    });
    prompt += '\n';
  }
  
  // Add timeline context if available
  if (data.projectContext?.timeline && data.projectContext.timeline.length > 0) {
    prompt += `Timeline Key Events:\n`;
    data.projectContext.timeline.forEach(event => {
      prompt += `- ${event.date || 'Unknown date'}: ${event.title} - ${event.description || 'No description'}\n`;
    });
    prompt += '\n';
  }
  
  // Add scene-specific context
  const charactersStr = data.characters.map(c => `${c.name}:${c.status}`).join(', ');
  prompt += `Scene intent: ${data.sceneIntent}\n`;
  prompt += `Setting: ${data.setting}\n`;
  prompt += `Characters in scene: [${charactersStr}]\n`;
  prompt += `Mood: tension=${data.mood.tension}, intimacy=${data.mood.intimacy}, pacing=${data.mood.pacing}\n`;
  
  if (data.lastSceneSummary) {
    prompt += `Previous scene summary: "${data.lastSceneSummary}"\n`;
  }
  
  prompt += `Length target: ${data.targetLength}`;
  
  return prompt;
}

export function buildEditorPrompt(data: {
  originalText: string;
  goals: { concise: boolean; preserve_voice: boolean; remove_passive: boolean };
  projectContext?: ProjectContext;
}): string {
  let prompt = '';
  
  // Add character context for consistency checking
  if (data.projectContext?.characters && data.projectContext.characters.length > 0) {
    prompt += `Character reference for consistency:\n`;
    data.projectContext.characters.forEach(char => {
      prompt += `- ${char.name}: ${char.description || 'No description'}\n`;
    });
    prompt += '\n';
  }
  
  const goalsStr = Object.entries(data.goals)
    .filter(([_, value]) => value)
    .map(([key, _]) => key)
    .join(', ');
    
  prompt += `Task: Edit paragraph for clarity. Original: "${data.originalText}". Goals: ${goalsStr}.`;
  
  return prompt;
}

export function buildCoachPrompt(data: {
  title: string;
  premise: string;
  targetLength: string;
  tone: string;
  mustHaveBeats?: string[];
  constraints?: string;
  projectContext?: ProjectContext;
}): string {
  let prompt = `Project: ${data.title}\nPremise: "${data.premise}"\n\n`;
  
  // Add character context
  if (data.projectContext?.characters && data.projectContext.characters.length > 0) {
    prompt += `Main Characters:\n`;
    data.projectContext.characters.forEach(char => {
      prompt += `- ${char.name}: ${char.description || 'No description'}`;
      if (char.personality) prompt += ` | ${char.personality}`;
      prompt += '\n';
    });
    prompt += '\n';
  }
  
  // Add worldbuilding context
  if (data.projectContext?.worldbuilding && data.projectContext.worldbuilding.length > 0) {
    prompt += `World Elements:\n`;
    data.projectContext.worldbuilding.forEach(wb => {
      prompt += `- ${wb.type}: ${wb.title}\n`;
    });
    prompt += '\n';
  }
  
  // Add timeline context for structure
  if (data.projectContext?.timeline && data.projectContext.timeline.length > 0) {
    prompt += `Key Timeline Events:\n`;
    data.projectContext.timeline.forEach(event => {
      prompt += `- ${event.title}\n`;
    });
    prompt += '\n';
  }
  
  prompt += `Target length: ${data.targetLength}\nTone: ${data.tone}\n`;
  
  if (data.mustHaveBeats && data.mustHaveBeats.length > 0) {
    prompt += `Must-have beats: [${data.mustHaveBeats.join(', ')}]\n`;
  }
  
  if (data.constraints) {
    prompt += `Constraints: ${data.constraints}`;
  }
  
  return prompt;
}

// Romance-specific prompt builders
export function buildRomanceMusePrompt(data: {
  projectTitle: string;
  sceneIntent: string;
  setting: string;
  characters: Array<{ name: string; status: string; romanticArchetype?: string }>;
  romanticTension: { level: string; type: string; focus: string };
  heatLevel: 'sweet' | 'warm' | 'steamy' | 'scorching';
  relationshipDynamics?: string;
  lastSceneSummary?: string;
  targetLength: string;
  projectContext?: ProjectContext;
  romanceContext?: RomanceContext;
}): string {
  let prompt = `Romance Project: ${data.projectTitle}\n\n`;
  
  // Add romance context
  if (data.romanceContext) {
    prompt += `Romance Details:\n`;
    prompt += `- Subgenre: ${data.romanceContext.subgenre}\n`;
    prompt += `- Heat Level: ${data.romanceContext.heatLevel}\n`;
    
    if (data.romanceContext.tropes.length > 0) {
      const coretropes = data.romanceContext.tropes.filter(t => t.isCore).map(t => t.name);
      if (coretropes.length > 0) {
        prompt += `- Core Tropes: ${coretropes.join(', ')}\n`;
      }
    }
    
    if (data.romanceContext.series) {
      prompt += `- Series: ${data.romanceContext.series.title} (Book ${data.romanceContext.series.bookNumber}/${data.romanceContext.series.totalBooks})\n`;
    }
    prompt += '\n';
  }
  
  // Add character context with romantic details
  if (data.projectContext?.characters && data.projectContext.characters.length > 0) {
    prompt += `Characters:\n`;
    data.projectContext.characters.forEach(char => {
      prompt += `- ${char.name}: ${char.description || 'No description'}`;
      if (char.personality) prompt += ` | Personality: ${char.personality}`;
      if ((char as any).romanticArchetype) prompt += ` | Romantic Type: ${(char as any).romanticArchetype}`;
      if ((char as any).romanticGoals) prompt += ` | Romantic Goals: ${(char as any).romanticGoals}`;
      prompt += '\n';
    });
    prompt += '\n';
  }
  
  // Add relationship dynamics
  if (data.romanceContext?.characterRelationships && data.romanceContext.characterRelationships.length > 0) {
    prompt += `Character Relationships:\n`;
    data.romanceContext.characterRelationships.forEach(rel => {
      prompt += `- ${rel.character1} & ${rel.character2}: ${rel.type} (intensity: ${rel.intensity}/10)\n`;
      if (rel.dynamics) prompt += `  Dynamics: ${rel.dynamics}\n`;
    });
    prompt += '\n';
  }
  
  // Add scene-specific context
  const charactersStr = data.characters.map(c => {
    let str = `${c.name}:${c.status}`;
    if (c.romanticArchetype) str += `:${c.romanticArchetype}`;
    return str;
  }).join(', ');
  
  prompt += `Scene Details:\n`;
  prompt += `- Intent: ${data.sceneIntent}\n`;
  prompt += `- Setting: ${data.setting}\n`;
  prompt += `- Characters: [${charactersStr}]\n`;
  prompt += `- Heat Level: ${data.heatLevel}\n`;
  prompt += `- Romantic Tension: ${data.romanticTension.level} (${data.romanticTension.type}) - ${data.romanticTension.focus}\n`;
  
  if (data.relationshipDynamics) {
    prompt += `- Relationship Dynamics: ${data.relationshipDynamics}\n`;
  }
  
  if (data.lastSceneSummary) {
    prompt += `- Previous Scene: "${data.lastSceneSummary}"\n`;
  }
  
  prompt += `- Target Length: ${data.targetLength}\n\n`;
  
  prompt += `Create a ${data.heatLevel} romance scene that builds ${data.romanticTension.type} tension through ${data.romanticTension.focus}.`;
  
  return prompt;
}

export function buildDialogueCoachPrompt(data: {
  originalDialogue: string;
  characters: Array<{ name: string; personality: string; romanticArchetype?: string }>;
  relationshipStatus: string;
  tensionGoal: string;
  heatLevel: 'sweet' | 'warm' | 'steamy' | 'scorching';
  context: string;
  romanceContext?: RomanceContext;
}): string {
  let prompt = `Dialogue Enhancement Request\n\n`;
  
  prompt += `Characters in Conversation:\n`;
  data.characters.forEach(char => {
    prompt += `- ${char.name}: ${char.personality}`;
    if (char.romanticArchetype) prompt += ` (${char.romanticArchetype})`;
    prompt += '\n';
  });
  prompt += '\n';
  
  prompt += `Relationship Context:\n`;
  prompt += `- Current Status: ${data.relationshipStatus}\n`;
  prompt += `- Tension Goal: ${data.tensionGoal}\n`;
  prompt += `- Heat Level: ${data.heatLevel}\n`;
  prompt += `- Scene Context: ${data.context}\n\n`;
  
  if (data.romanceContext?.tropes && data.romanceContext.tropes.length > 0) {
    const activetropes = data.romanceContext.tropes.filter(t => t.isCore).map(t => t.name);
    if (activetropes.length > 0) {
      prompt += `Active Romance Tropes: ${activetropes.join(', ')}\n\n`;
    }
  }
  
  prompt += `Original Dialogue:\n"${data.originalDialogue}"\n\n`;
  prompt += `Enhance this dialogue to increase romantic chemistry and ${data.tensionGoal} while maintaining character voices and ${data.heatLevel} content level.`;
  
  return prompt;
}

export function buildTensionBuilderPrompt(data: {
  sceneText: string;
  characters: Array<{ name: string; relationship: string }>;
  currentTensionLevel: 'low' | 'medium' | 'high' | 'intense';
  desiredTensionLevel: 'low' | 'medium' | 'high' | 'intense';
  tensionType: 'emotional' | 'sexual' | 'romantic' | 'situational';
  heatLevel: 'sweet' | 'warm' | 'steamy' | 'scorching';
  constraints?: string;
  romanceContext?: RomanceContext;
}): string {
  let prompt = `Romantic Tension Analysis and Enhancement\n\n`;
  
  prompt += `Scene Context:\n`;
  prompt += `- Characters: ${data.characters.map(c => `${c.name} (${c.relationship})`).join(', ')}\n`;
  prompt += `- Current Tension: ${data.currentTensionLevel}\n`;
  prompt += `- Target Tension: ${data.desiredTensionLevel}\n`;
  prompt += `- Tension Type: ${data.tensionType}\n`;
  prompt += `- Heat Level: ${data.heatLevel}\n`;
  
  if (data.constraints) {
    prompt += `- Constraints: ${data.constraints}\n`;
  }
  prompt += '\n';
  
  if (data.romanceContext?.romanticTension) {
    prompt += `Romance Arc Context:\n`;
    prompt += `- Overall Tension Level: ${data.romanceContext.romanticTension.current_level}\n`;
    if (data.romanceContext.romanticTension.key_moments.length > 0) {
      prompt += `- Key Tension Moments: ${data.romanceContext.romanticTension.key_moments.join(', ')}\n`;
    }
    prompt += '\n';
  }
  
  prompt += `Scene Text to Analyze:\n"${data.sceneText}"\n\n`;
  prompt += `Analyze the romantic tension and provide specific techniques to enhance it from ${data.currentTensionLevel} to ${data.desiredTensionLevel} while maintaining ${data.heatLevel} content appropriateness.`;
  
  return prompt;
}

export function buildRomanceCoachPrompt(data: {
  title: string;
  premise: string;
  subgenre: string;
  heatLevel: 'sweet' | 'warm' | 'steamy' | 'scorching';
  mainTropes: string[];
  targetLength: string;
  characterCount: number;
  seriesInfo?: { position: number; totalBooks: number; seriesArc: string };
  constraints?: string;
  projectContext?: ProjectContext;
  romanceContext?: RomanceContext;
}): string {
  let prompt = `Romance Novel Structure Planning\n\n`;
  
  prompt += `Project Details:\n`;
  prompt += `- Title: ${data.title}\n`;
  prompt += `- Premise: "${data.premise}"\n`;
  prompt += `- Subgenre: ${data.subgenre}\n`;
  prompt += `- Heat Level: ${data.heatLevel}\n`;
  prompt += `- Target Length: ${data.targetLength}\n`;
  prompt += `- Character Count: ${data.characterCount}\n`;
  
  if (data.mainTropes.length > 0) {
    prompt += `- Main Tropes: ${data.mainTropes.join(', ')}\n`;
  }
  
  if (data.seriesInfo) {
    prompt += `- Series: Book ${data.seriesInfo.position} of ${data.seriesInfo.totalBooks}\n`;
    prompt += `- Series Arc: ${data.seriesInfo.seriesArc}\n`;
  }
  
  if (data.constraints) {
    prompt += `- Constraints: ${data.constraints}\n`;
  }
  prompt += '\n';
  
  // Add character context
  if (data.projectContext?.characters && data.projectContext.characters.length > 0) {
    prompt += `Main Characters:\n`;
    data.projectContext.characters.forEach(char => {
      prompt += `- ${char.name}: ${char.description || 'No description'}`;
      if (char.personality) prompt += ` | ${char.personality}`;
      if ((char as any).romanticArchetype) prompt += ` | Romantic Type: ${(char as any).romanticArchetype}`;
      prompt += '\n';
    });
    prompt += '\n';
  }
  
  // Add romance relationship context
  if (data.romanceContext?.characterRelationships && data.romanceContext.characterRelationships.length > 0) {
    prompt += `Key Relationships:\n`;
    data.romanceContext.characterRelationships.forEach(rel => {
      prompt += `- ${rel.character1} & ${rel.character2}: ${rel.type}\n`;
    });
    prompt += '\n';
  }
  
  prompt += `Create a comprehensive romance novel structure that incorporates these elements and follows ${data.subgenre} conventions with ${data.heatLevel} content level.`;
  
  return prompt;
}

// Advanced Analysis Types
export interface StyleAnalysisRequest {
  documents: Array<{ id: string; title: string; content: string }>;
  projectContext?: string;
}

export interface PlotConsistencyRequest {
  documents: Array<{ id: string; title: string; content: string; orderIndex: number }>;
  timeline: Array<{ title: string; date: string; description: string }>;
  characters: Array<{ name: string; description: string }>;
}

export interface CharacterDevelopmentRequest {
  character: { name: string; description: string; background?: string };
  documents: Array<{ id: string; title: string; content: string; orderIndex: number }>;
}

export interface NarrativeFlowRequest {
  documents: Array<{ id: string; title: string; content: string; orderIndex: number }>;
  genre?: string;
  targetPacing?: string;
}

export interface AnalysisResult<T = any> {
  success: boolean;
  data: T;
  recommendations: string[];
  metadata: {
    analysisType: string;
    timestamp: Date;
    documentsAnalyzed: number;
    confidence: number;
  };
}

// Helper function to try multiple models with fallback
async function createChatCompletionWithFallback(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  options: {
    response_format?: { type: 'json_object' };
    max_tokens?: number;
  } = {}
) {
  const client = getOpenAIClient();
  const modelsToTry = workingModel ? [workingModel] : AVAILABLE_MODELS;
  
  for (const model of modelsToTry) {
    try {
      console.log(`[Analysis] Attempting to use model: ${model}`);
      const response = await client.chat.completions.create({
        model: model,
        messages: messages,
        ...options,
        max_tokens: options.max_tokens || 1500
      });
      
      // Remember the working model for future calls
      if (!workingModel || workingModel !== model) {
        workingModel = model;
        console.log(`[Analysis] Successfully set working model: ${model}`);
      }
      
      return { response, model };
    } catch (error: any) {
      console.error(`[Analysis] Failed with model ${model}:`, error?.message || error);
      
      // If it's the last model, throw the error
      if (model === modelsToTry[modelsToTry.length - 1]) {
        throw new Error(
          `All AI models failed. Last error: ${error?.message || 'Unknown error'}. ` +
          `Tried models: ${modelsToTry.join(', ')}`
        );
      }
    }
  }
  
  throw new Error('Failed to get AI response from any model');
}

// Style Analysis
export async function analyzeWritingStyle(request: StyleAnalysisRequest): Promise<AnalysisResult> {
  const client = getOpenAIClient();
  const combinedText = request.documents.map(d => d.content).join('\n\n');
  
  const systemPrompt = `You are an expert literary analyst. Analyze the writing style comprehensively and return a JSON object with detailed metrics and insights. Focus on: tone, voice consistency, reading level, sentence variety, vocabulary richness, and overall style consistency. Provide actionable recommendations.`;
  
  const userPrompt = `Analyze the writing style across these documents. Project context: "${request.projectContext || 'General fiction'}". 
  
  Text samples: ${combinedText.substring(0, 15000)}
  
  Return JSON:
  {
    "tone": { "primary": string, "variations": string[], "consistency": number (0-100) },
    "voice": { "type": string, "consistency": number (0-100), "characteristics": string[] },
    "readingLevel": { "grade": number, "complexity": string, "accessibility": string },
    "sentenceVariety": { "average_length": number, "variation_score": number (0-100), "patterns": string[] },
    "vocabulary": { "richness_score": number (0-100), "unique_words": number, "sophistication": string },
    "style": { "genre_alignment": number (0-100), "distinctiveness": number (0-100), "strengths": string[], "weaknesses": string[] },
    "pacing": { "overall": string, "variation": string, "effectiveness": number (0-100) }
  }`;
  
  try {
    console.log('[Style Analysis] Text length:', combinedText.length);
    console.log('[Style Analysis] Documents count:', request.documents.length);
    
    const { response, model } = await createChatCompletionWithFallback(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      {
        response_format: { type: "json_object" },
        max_tokens: 1500
      }
    );
    
    console.log('[Style Analysis] Response received from model:', model);
    console.log('[Style Analysis] Response content preview:', response.choices[0].message.content?.substring(0, 200));
    
    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('Empty response from AI model');
    }
    
    const analysis = JSON.parse(content);
    console.log('[Style Analysis] Parsed analysis keys:', Object.keys(analysis));
    
    const recommendations = [];
    if (analysis.tone?.consistency < 70) {
      recommendations.push("Consider maintaining a more consistent tone throughout your narrative");
    }
    if (analysis.sentenceVariety?.variation_score < 60) {
      recommendations.push("Vary your sentence structures to improve rhythm and flow");
    }
    if (analysis.vocabulary?.richness_score < 50) {
      recommendations.push("Expand your vocabulary usage to enrich the prose");
    }
    if (analysis.style?.weaknesses?.length > 0) {
      recommendations.push(`Address these style weaknesses: ${analysis.style.weaknesses.join(", ")}`);
    }
    
    return {
      success: true,
      data: analysis,
      recommendations,
      metadata: {
        analysisType: "style",
        timestamp: new Date(),
        documentsAnalyzed: request.documents.length,
        confidence: Math.min(95, 70 + (request.documents.length * 5))
      }
    };
  } catch (error) {
    throw new Error(`Style analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Plot Consistency Analysis
export async function analyzePlotConsistency(request: PlotConsistencyRequest): Promise<AnalysisResult> {
  const plotSummary = request.documents
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map(d => `Chapter ${d.orderIndex}: ${d.title}\n${d.content.substring(0, 500)}`)
    .join('\n\n');
  
  const systemPrompt = `You are a plot consistency expert. Analyze the narrative for plot holes, timeline inconsistencies, unresolved threads, and character consistency. Return detailed JSON analysis with specific examples and locations of issues.`;
  
  const userPrompt = `Analyze plot consistency across this narrative.
  
  Timeline Events: ${JSON.stringify(request.timeline.map(t => ({ date: t.date, event: t.title })))}
  Characters: ${request.characters.map(c => c.name).join(', ')}
  
  Story Content: ${plotSummary}
  
  Return JSON:
  {
    "plotHoles": [{ "description": string, "location": string, "severity": "minor"|"major"|"critical", "suggestion": string }],
    "timelineIssues": [{ "description": string, "chapters": string[], "conflict": string }],
    "unresolvedThreads": [{ "thread": string, "introduced": string, "status": string, "importance": "low"|"medium"|"high" }],
    "characterInconsistencies": [{ "character": string, "issue": string, "locations": string[] }],
    "overallConsistency": number (0-100),
    "strongPoints": string[],
    "criticalIssues": string[]
  }`;
  
  try {
    console.log('[Plot Analysis] Documents count:', request.documents.length);
    console.log('[Plot Analysis] Timeline events:', request.timeline.length);
    console.log('[Plot Analysis] Characters:', request.characters.length);
    
    const { response, model } = await createChatCompletionWithFallback(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      {
        response_format: { type: "json_object" },
        max_tokens: 2000
      }
    );
    
    console.log('[Plot Analysis] Response received from model:', model);
    
    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('Empty response from AI model');
    }
    
    const analysis = JSON.parse(content);
    
    const recommendations = [];
    if (analysis.plotHoles?.length > 0) {
      const critical = analysis.plotHoles.filter((h: any) => h.severity === 'critical');
      if (critical.length > 0) {
        recommendations.push(`Address ${critical.length} critical plot hole(s) immediately`);
      }
    }
    if (analysis.unresolvedThreads?.filter((t: any) => t.importance === 'high').length > 0) {
      recommendations.push("Resolve high-importance story threads before conclusion");
    }
    if (analysis.overallConsistency < 70) {
      recommendations.push("Conduct a thorough continuity review to improve consistency");
    }
    
    return {
      success: true,
      data: analysis,
      recommendations,
      metadata: {
        analysisType: "plot_consistency",
        timestamp: new Date(),
        documentsAnalyzed: request.documents.length,
        confidence: Math.min(90, 65 + (request.documents.length * 3))
      }
    };
  } catch (error) {
    throw new Error(`Plot consistency analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Character Development Analysis
export async function analyzeCharacterDevelopment(request: CharacterDevelopmentRequest): Promise<AnalysisResult> {
  const characterAppearances = request.documents
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map(d => {
      const mentions = d.content.match(new RegExp(request.character.name, 'gi'))?.length || 0;
      return `Chapter ${d.orderIndex}: ${mentions} mentions\nExcerpt: ${d.content.substring(0, 300)}`;
    })
    .join('\n\n');
  
  const systemPrompt = `You are a character development analyst. Track character arcs, growth, relationship evolution, and consistency. Identify key moments of change and areas needing development. Return comprehensive JSON analysis.`;
  
  const userPrompt = `Analyze the development of character "${request.character.name}".
  
  Character Profile: ${request.character.description}
  Background: ${request.character.background || 'Not provided'}
  
  Story Appearances: ${characterAppearances}
  
  Return JSON:
  {
    "arc": { 
      "type": string, 
      "startPoint": string, 
      "currentPoint": string, 
      "projected": string,
      "completeness": number (0-100)
    },
    "growth": {
      "areas": [{ "aspect": string, "change": string, "chapter": string }],
      "overall_growth": number (0-100),
      "believability": number (0-100)
    },
    "consistency": {
      "score": number (0-100),
      "inconsistencies": [{ "issue": string, "location": string }]
    },
    "relationships": [{ 
      "character": string, 
      "evolution": string, 
      "current_status": string,
      "development_quality": number (0-100)
    }],
    "keyMoments": [{ "chapter": string, "moment": string, "significance": string }],
    "presence": {
      "distribution": string,
      "screen_time": "insufficient"|"balanced"|"excessive",
      "impact": number (0-100)
    },
    "recommendations": string[]
  }`;
  
  try {
    console.log('[Character Analysis] Character:', request.character.name);
    console.log('[Character Analysis] Documents count:', request.documents.length);
    
    const { response, model } = await createChatCompletionWithFallback(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      {
        response_format: { type: "json_object" },
        max_tokens: 1800
      }
    );
    
    console.log('[Character Analysis] Response received from model:', model);
    
    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('Empty response from AI model');
    }
    
    const analysis = JSON.parse(content);
    
    const recommendations = analysis.recommendations || [];
    if (analysis.arc?.completeness < 50) {
      recommendations.push("Develop character arc more fully through meaningful challenges");
    }
    if (analysis.consistency?.score < 75) {
      recommendations.push("Review character actions for consistency with established personality");
    }
    if (analysis.presence?.screen_time === 'insufficient') {
      recommendations.push("Increase character presence in key scenes");
    }
    
    return {
      success: true,
      data: analysis,
      recommendations,
      metadata: {
        analysisType: "character_development",
        timestamp: new Date(),
        documentsAnalyzed: request.documents.length,
        confidence: Math.min(92, 70 + (request.documents.length * 4))
      }
    };
  } catch (error) {
    throw new Error(`Character development analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Narrative Flow Analysis
export async function analyzeNarrativeFlow(request: NarrativeFlowRequest): Promise<AnalysisResult> {
  const narrativeStructure = request.documents
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map(d => `Chapter ${d.orderIndex}: ${d.title} (${d.content.split(/\s+/).length} words)`)
    .join('\n');
  
  const contentSample = request.documents
    .slice(0, 5)
    .map(d => d.content.substring(0, 500))
    .join('\n\n---\n\n');
  
  const systemPrompt = `You are a narrative flow expert. Analyze pacing, rhythm, scene transitions, tension curves, and story momentum. Identify areas of lag or rush. Provide specific, actionable suggestions. Return detailed JSON analysis.`;
  
  const userPrompt = `Analyze the narrative flow and pacing.
  
  Genre: ${request.genre || 'General Fiction'}
  Target Pacing: ${request.targetPacing || 'Moderate'}
  
  Chapter Structure:
  ${narrativeStructure}
  
  Content Sample:
  ${contentSample}
  
  Return JSON:
  {
    "pacing": {
      "overall": "slow"|"moderate"|"fast"|"varied",
      "effectiveness": number (0-100),
      "chapters": [{ "number": number, "pace": string, "issue": string|null }]
    },
    "rhythm": {
      "variety": number (0-100),
      "flow": number (0-100),
      "patterns": string[]
    },
    "transitions": {
      "quality": number (0-100),
      "smooth": number,
      "jarring": number,
      "issues": [{ "between": string, "problem": string }]
    },
    "tensionCurve": {
      "pattern": string,
      "effectiveness": number (0-100),
      "peaks": [{ "chapter": number, "intensity": number (1-10) }],
      "valleys": [{ "chapter": number, "intensity": number (1-10) }]
    },
    "momentum": {
      "building": boolean,
      "maintained": number (0-100),
      "lostAt": string[]
    },
    "lagAreas": [{ "location": string, "reason": string, "suggestion": string }],
    "rushAreas": [{ "location": string, "reason": string, "suggestion": string }],
    "hooks": {
      "chapter_endings": number (0-100),
      "chapter_openings": number (0-100),
      "overall_engagement": number (0-100)
    }
  }`;
  
  try {
    console.log('[Narrative Analysis] Documents count:', request.documents.length);
    console.log('[Narrative Analysis] Genre:', request.genre || 'General Fiction');
    console.log('[Narrative Analysis] Target pacing:', request.targetPacing || 'Moderate');
    
    const { response, model } = await createChatCompletionWithFallback(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      {
        response_format: { type: "json_object" },
        max_tokens: 2000
      }
    );
    
    console.log('[Narrative Analysis] Response received from model:', model);
    
    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('Empty response from AI model');
    }
    
    const analysis = JSON.parse(content);
    
    const recommendations = [];
    if (analysis.pacing?.effectiveness < 70) {
      recommendations.push("Adjust pacing to better match genre expectations");
    }
    if (analysis.lagAreas?.length > 2) {
      recommendations.push(`Address ${analysis.lagAreas.length} areas where narrative momentum slows`);
    }
    if (analysis.rushAreas?.length > 1) {
      recommendations.push("Expand rushed scenes to allow proper development");
    }
    if (analysis.transitions?.quality < 75) {
      recommendations.push("Smooth scene and chapter transitions for better flow");
    }
    if (analysis.hooks?.chapter_endings < 70) {
      recommendations.push("Strengthen chapter endings with compelling hooks");
    }
    
    return {
      success: true,
      data: analysis,
      recommendations,
      metadata: {
        analysisType: "narrative_flow",
        timestamp: new Date(),
        documentsAnalyzed: request.documents.length,
        confidence: Math.min(88, 65 + (request.documents.length * 3))
      }
    };
  } catch (error) {
    throw new Error(`Narrative flow analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
