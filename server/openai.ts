import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key is not configured. Please set the OPENAI_API_KEY environment variable.");
    }
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
}

export interface AiRequest {
  intent: string;
  persona: "muse" | "editor" | "coach";
  project_id: string;
  context_refs?: string[];
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

const SAFETY_PROMPT = `You must not generate explicit sexual content, graphic descriptions of sexual acts, or non-consensual / exploitative content. Verify all characters referenced are 18+. If content touches sexual themes, produce implied, emotionally focused language only. Flag any safety violation with code: SAFETY_VIOLATION_{reason} in response metadata.`;

const PERSONA_PROMPTS = {
  muse: `You are Muse. Create evocative, sensory scenes that align with the provided story bible. Prioritize emotion, sensory detail, and character voice. Enforce safety: block explicit sexual content and non-consensual material; if a placeholder is type steamy, render implied intimacy only. Validate ages (all characters must be 18+). Output must include an opening image line and end with a one-line hook. Return plain text.`,
  
  editor: `You are Editor. Improve clarity, grammar, and flow while preserving the author's voice and plot facts. Do not invent new plot events. If contradictions appear, list them separately. Return a JSON object: {edited_text, diff: [{original_span, edited_span}], rationale}.`,
  
  coach: `You are Coach. Produce concise, structured outputs (checklist, acts, beats). When asked for outlines, return JSON: {acts:[{title,beats:[{title,purpose,chapter_range,emotional_hook}]}]}. Keep outputs actionable.`
};

export async function generateContent(request: AiRequest, userPrompt: string): Promise<AiResponse> {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const outputId = `out_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const systemPrompt = `${SAFETY_PROMPT}\n\n${PERSONA_PROMPTS[request.persona]}`;
  
  try {
    const client = getOpenAIClient();
    const response = await client.chat.completions.create({
      model: "gpt-5",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_completion_tokens: request.params.max_tokens || 800,
      ...(request.persona === "editor" || request.persona === "coach" ? {
        response_format: { type: "json_object" }
      } : {})
    });

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
        model: "gpt-5",
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
}): string {
  const charactersStr = data.characters.map(c => `${c.name}:${c.status}`).join(', ');
  
  return `Project: ${data.projectTitle}; Scene intent: ${data.sceneIntent}; Setting: ${data.setting}; Characters: [${charactersStr}]; Mood: tension=${data.mood.tension}, intimacy=${data.mood.intimacy}, pacing=${data.mood.pacing}; ${data.lastSceneSummary ? `Context: last_scene_summary: "${data.lastSceneSummary}"; ` : ''}Length target: ${data.targetLength}.`;
}

export function buildEditorPrompt(data: {
  originalText: string;
  goals: { concise: boolean; preserve_voice: boolean; remove_passive: boolean };
}): string {
  const goalsStr = Object.entries(data.goals)
    .filter(([_, value]) => value)
    .map(([key, _]) => key)
    .join(', ');
    
  return `Task: Edit paragraph for clarity. Original: "${data.originalText}". Goals: ${goalsStr}.`;
}

export function buildCoachPrompt(data: {
  title: string;
  premise: string;
  targetLength: string;
  tone: string;
  mustHaveBeats?: string[];
  constraints?: string;
}): string {
  let prompt = `Project: ${data.title}; Premise: "${data.premise}"; Target_length: ${data.targetLength}; Tone: ${data.tone};`;
  
  if (data.mustHaveBeats && data.mustHaveBeats.length > 0) {
    prompt += ` Must-have beats: [${data.mustHaveBeats.join(', ')}];`;
  }
  
  if (data.constraints) {
    prompt += ` Constraints: ${data.constraints}.`;
  }
  
  return prompt;
}
