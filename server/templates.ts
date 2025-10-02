import type { 
  InsertDocument, 
  InsertCharacter, 
  InsertWorldbuildingEntry, 
  InsertTimelineEvent 
} from "@shared/schema";

export type TemplateType = 'blank' | 'novel' | 'screenplay' | 'short-story';

export interface ProjectTemplate {
  documents: Omit<InsertDocument, 'projectId' | 'authorId'>[];
  characters: Omit<InsertCharacter, 'projectId'>[];
  worldbuilding: Omit<InsertWorldbuildingEntry, 'projectId'>[];
  timeline: Omit<InsertTimelineEvent, 'projectId'>[];
}

export const templates: Record<TemplateType, ProjectTemplate> = {
  blank: {
    documents: [],
    characters: [],
    worldbuilding: [],
    timeline: [],
  },

  novel: {
    documents: [
      {
        title: "Chapter 1",
        content: "<p>Start writing your first chapter here. Introduce your characters, setting, and the initial conflict...</p>",
        orderIndex: 0,
      },
      {
        title: "Chapter 2",
        content: "<p>Continue your story in chapter 2. Develop your plot and characters further...</p>",
        orderIndex: 1,
      },
      {
        title: "Chapter 3",
        content: "<p>Build momentum in chapter 3. Deepen the conflict and raise the stakes...</p>",
        orderIndex: 2,
      },
    ],
    characters: [
      {
        name: "Protagonist",
        description: "The main character of your story",
        background: "Add the protagonist's backstory and history here...",
        personality: "Describe their personality traits, motivations, and flaws...",
        appearance: "Describe their physical appearance and distinctive features...",
        relationships: {},
        notes: "Additional notes about your protagonist...",
      },
      {
        name: "Antagonist",
        description: "The primary opposing force in your story",
        background: "Add the antagonist's backstory and motivations here...",
        personality: "Describe what drives them and their key characteristics...",
        appearance: "Describe their physical appearance...",
        relationships: {},
        notes: "Additional notes about your antagonist...",
      },
    ],
    worldbuilding: [
      {
        title: "Main Setting",
        type: "location",
        description: "Describe the primary location where your story takes place. Include details about geography, culture, society, and atmosphere...",
        tags: ["primary", "setting"],
      },
      {
        title: "Magic System",
        type: "system",
        description: "If your novel includes a magic system, supernatural elements, or unique world mechanics, describe them here. Include rules, limitations, and how they affect your story...",
        tags: ["magic", "system"],
      },
    ],
    timeline: [
      {
        title: "Story Beginning",
        date: null,
        description: "Mark the beginning of your story's timeline. What is the inciting incident that sets everything in motion?",
      },
    ],
  },

  screenplay: {
    documents: [
      {
        title: "Act I",
        content: "<p>ACT I - SETUP</p><p>Introduce your protagonist, their world, and the story's central conflict. End with a turning point that propels the story forward...</p>",
        orderIndex: 0,
      },
      {
        title: "Act II",
        content: "<p>ACT II - CONFRONTATION</p><p>The protagonist faces obstacles and challenges. Develop subplots and deepen character relationships. Build toward the midpoint and second turning point...</p>",
        orderIndex: 1,
      },
      {
        title: "Act III",
        content: "<p>ACT III - RESOLUTION</p><p>The climax and resolution of your story. All conflicts come to a head and are resolved...</p>",
        orderIndex: 2,
      },
    ],
    characters: [
      {
        name: "Main Character",
        description: "The protagonist of your screenplay",
        background: "Character's backstory and what brought them to this point...",
        personality: "Personality traits, desires, and internal conflicts...",
        appearance: "Age, physical description, and how they present themselves...",
        relationships: {},
        notes: "Character arc and development notes...",
      },
      {
        name: "Supporting Character",
        description: "A key supporting character",
        background: "Their relationship to the main character and role in the story...",
        personality: "Key traits and how they complement or challenge the protagonist...",
        appearance: "Physical description...",
        relationships: {},
        notes: "Additional character notes...",
      },
    ],
    worldbuilding: [
      {
        title: "Primary Location",
        type: "location",
        description: "Describe the main setting where most of your screenplay takes place. Include visual details, atmosphere, and how the location affects the story...",
        tags: ["location", "primary"],
      },
      {
        title: "Secondary Location",
        type: "location",
        description: "Describe an important secondary location. This could be where key scenes take place or represents a contrast to the primary setting...",
        tags: ["location", "secondary"],
      },
    ],
    timeline: [
      {
        title: "Opening Scene",
        date: null,
        description: "The opening image and scene of your screenplay. What visual and emotional tone are you setting?",
      },
    ],
  },

  "short-story": {
    documents: [
      {
        title: "Draft",
        content: "<p>Begin your short story here. Remember to focus on a single conflict or theme, with a clear beginning, middle, and end...</p>",
        orderIndex: 0,
      },
    ],
    characters: [
      {
        name: "Main Character",
        description: "The protagonist of your short story",
        background: "Brief backstory relevant to the story...",
        personality: "Key personality traits and motivations...",
        appearance: "Essential physical details...",
        relationships: {},
        notes: "Character notes and development...",
      },
    ],
    worldbuilding: [
      {
        title: "Setting",
        type: "location",
        description: "Describe the setting of your short story. Include sensory details and atmosphere that enhance your theme...",
        tags: ["setting"],
      },
    ],
    timeline: [
      {
        title: "Key Event",
        date: null,
        description: "The central event or turning point of your short story.",
      },
    ],
  },
};

export function getTemplate(templateType: TemplateType): ProjectTemplate {
  return templates[templateType] || templates.blank;
}
