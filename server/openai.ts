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
  persona: "muse" | "editor" | "coach";
  project_id: string;
  context_refs?: string[];
  project_context?: ProjectContext;
  params: {
    max_tokens?: number;
    deterministic?: boolean;
    style_profile_id?: string;
    placeholders?: string[];
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

OUTPUT: Valid JSON, defaulting to the outline structure above unless explicitly requested otherwise.`
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
