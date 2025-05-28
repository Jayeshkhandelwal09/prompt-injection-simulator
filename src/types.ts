export interface Config {
  openaiApiKey: string;
  model: string;
  maxTokens: number;
}

export interface AttackResult {
  prompt: string;
  response: string;
  success: boolean;
  category: string;
  notes: string;
}

export interface Attack {
  name: string;
  description: string;
  prompt: string;
  category: AttackCategory;
  successCriteria: (response: string) => boolean;
}

export enum AttackCategory {
  SYSTEM_PROMPT_REVELATION = 'System Prompt Revelation',
  INSTRUCTION_OVERRIDE = 'Instruction Override',
  ROLE_PLAY_MANIPULATION = 'Role Play Manipulation',
  CONTEXT_CONFUSION = 'Context Confusion',
  EMOTIONAL_MANIPULATION = 'Emotional Manipulation'
} 