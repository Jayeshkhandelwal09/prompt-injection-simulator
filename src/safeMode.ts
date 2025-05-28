export interface SafeModeOptions {
  enabled: boolean;
  maxTokens?: number;
  maxPromptLength?: number;
  blockList?: string[];
  requireConfirmation?: boolean;
}

export class SafeMode {
  private options: SafeModeOptions;
  private defaultBlockList = [
    'system prompt',
    'system instruction',
    'ignore previous',
    'ignore your',
    'forget your',
    'you are now',
    'developer mode',
    'admin mode',
    'sudo',
    'override',
    'bypass',
    '<system>',
    '</system>',
    '[system]',
    'print_system_prompt',
    'reveal your',
    'show me your',
    'tell me your'
  ];

  constructor(options?: Partial<SafeModeOptions>) {
    this.options = {
      enabled: options?.enabled ?? true,
      maxTokens: options?.maxTokens ?? 150,
      maxPromptLength: options?.maxPromptLength ?? 500,
      blockList: [...(options?.blockList || []), ...this.defaultBlockList],
      requireConfirmation: options?.requireConfirmation ?? true
    };
  }

  public checkPrompt(prompt: string): { safe: boolean; risks: string[]; needsConfirmation: boolean } {
    if (!this.options.enabled) {
      return { safe: true, risks: [], needsConfirmation: false };
    }

    const risks: string[] = [];
    const normalizedPrompt = prompt.toLowerCase();

    // Check prompt length
    if (this.options.maxPromptLength && prompt.length > this.options.maxPromptLength) {
      risks.push(`Prompt exceeds maximum length (${prompt.length} > ${this.options.maxPromptLength})`);
    }

    // Check for blocked phrases
    for (const blocked of this.options.blockList!) {
      if (normalizedPrompt.includes(blocked.toLowerCase())) {
        risks.push(`Contains blocked phrase: "${blocked}"`);
      }
    }

    // Check for potential code injection
    if (this.containsCodePatterns(prompt)) {
      risks.push('Contains potential code injection patterns');
    }

    // Check for potential role play manipulation
    if (this.containsRolePlayPatterns(prompt)) {
      risks.push('Contains role play manipulation patterns');
    }

    // Check for emotional manipulation
    if (this.containsEmotionalPatterns(prompt)) {
      risks.push('Contains emotional manipulation patterns');
    }

    // Check for repetitive patterns that might indicate an attack
    if (this.containsRepetitivePatterns(prompt)) {
      risks.push('Contains suspicious repetitive patterns');
    }

    const needsConfirmation = (this.options.requireConfirmation ?? true) && (
      risks.length > 0 || 
      this.containsSensitiveKeywords(prompt)
    );

    return {
      safe: risks.length === 0,
      risks,
      needsConfirmation
    };
  }

  private containsCodePatterns(prompt: string): boolean {
    const patterns = [
      '```',
      'function',
      'eval(',
      'exec(',
      'system(',
      '<script',
      '</script>',
      'process.env',
      'require(',
      'import '
    ];
    return patterns.some(p => prompt.toLowerCase().includes(p.toLowerCase()));
  }

  private containsRolePlayPatterns(prompt: string): boolean {
    const patterns = [
      'you are now',
      'you\'re now',
      'act as',
      'pretend to be',
      'switch to',
      'become a',
      'you will be',
      'role play'
    ];
    return patterns.some(p => prompt.toLowerCase().includes(p.toLowerCase()));
  }

  private containsEmotionalPatterns(prompt: string): boolean {
    const patterns = [
      'please help',
      'urgent',
      'emergency',
      'lives depend',
      'critical',
      'desperate',
      'need your help',
      'trust me'
    ];
    return patterns.some(p => prompt.toLowerCase().includes(p.toLowerCase()));
  }

  private containsRepetitivePatterns(prompt: string): boolean {
    const normalized = prompt.toLowerCase();
    // Check for repeated words or phrases
    const words = normalized.split(/\s+/);
    const repetitions = words.filter((word, index) => 
      word.length > 3 && // Only check words longer than 3 characters
      words.indexOf(word) !== index // Check if word appears more than once
    );
    return repetitions.length > 3; // If more than 3 repetitions found
  }

  private containsSensitiveKeywords(prompt: string): boolean {
    const sensitiveKeywords = [
      'password',
      'secret',
      'token',
      'key',
      'credential',
      'private',
      'confidential',
      'internal'
    ];
    return sensitiveKeywords.some(keyword => 
      prompt.toLowerCase().includes(keyword.toLowerCase())
    );
  }
} 