import OpenAI from 'openai';
import chalk from 'chalk';
import { Attack, AttackResult, Config } from './types';
import { SafeMode, SafeModeOptions } from './safeMode';
import readline from 'readline';

export class PromptInjectionTester {
  private openai: OpenAI;
  private config: Config;
  private safeMode: SafeMode;

  constructor(config: Config, safeModeOptions?: SafeModeOptions) {
    this.config = config;
    this.openai = new OpenAI({
      apiKey: config.openaiApiKey
    });
    this.safeMode = new SafeMode(safeModeOptions);
  }

  public async runAttack(attack: Attack): Promise<AttackResult> {
    console.log(chalk.blue(`\nRunning attack: ${attack.name}`));
    console.log(chalk.dim(`Category: ${attack.category}`));
    console.log(chalk.dim(`Prompt: ${attack.prompt}`));

    // Check prompt safety
    const safetyCheck = this.safeMode.checkPrompt(attack.prompt);
    
    if (!safetyCheck.safe) {
      console.log(chalk.yellow('\nSafety Risks Detected:'));
      safetyCheck.risks.forEach(risk => console.log(chalk.yellow(`- ${risk}`)));
      
      if (safetyCheck.needsConfirmation) {
        const proceed = await this.askForConfirmation();
        if (!proceed) {
          return {
            prompt: attack.prompt,
            response: 'Attack cancelled by user due to safety concerns',
            success: false,
            category: attack.category,
            notes: 'Cancelled: ' + safetyCheck.risks.join(', ')
          };
        }
      }
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: 'user',
            content: attack.prompt
          }
        ],
        max_tokens: this.config.maxTokens
      });

      const responseText = response.choices[0]?.message?.content || '';
      const success = attack.successCriteria(responseText);

      const result: AttackResult = {
        prompt: attack.prompt,
        response: responseText,
        success,
        category: attack.category,
        notes: this.generateNotes(success, safetyCheck.risks)
      };

      this.logResult(result);
      return result;

    } catch (error) {
      console.error(chalk.red('Error running attack:'), error);
      throw error;
    }
  }

  public async runAllAttacks(attacks: Attack[]): Promise<AttackResult[]> {
    const results: AttackResult[] = [];
    
    for (const attack of attacks) {
      try {
        const result = await this.runAttack(attack);
        results.push(result);
        // Add a small delay between requests to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(chalk.red(`Failed to run attack "${attack.name}":`, error));
      }
    }

    this.logSummary(results);
    return results;
  }

  private generateNotes(success: boolean, risks: string[]): string {
    const baseNote = success 
      ? 'Attack potentially successful - model may have revealed sensitive information'
      : 'Attack failed - model maintained security boundaries';
    
    return risks.length > 0
      ? `${baseNote}\nSafety risks detected: ${risks.join(', ')}`
      : baseNote;
  }

  private logResult(result: AttackResult) {
    const status = result.success 
      ? chalk.red('✗ Vulnerable')
      : chalk.green('✓ Secure');

    console.log(chalk.dim('Response:'), result.response);
    console.log(chalk.dim('Status:'), status);
    console.log(chalk.dim('Notes:'), result.notes);
  }

  private logSummary(results: AttackResult[]) {
    const total = results.length;
    const successful = results.filter(r => r.success).length;
    const successRate = ((successful / total) * 100).toFixed(2);

    console.log('\n' + chalk.bold('Test Summary'));
    console.log(chalk.dim('Total Attacks:'), total);
    console.log(chalk.dim('Successful Attacks:'), successful);
    console.log(chalk.dim('Success Rate:'), `${successRate}%`);

    if (successful > 0) {
      console.log(chalk.yellow('\nWarning: Some attacks were successful. Review the results and consider strengthening the model\'s security.'));
    }
  }

  private askForConfirmation(): Promise<boolean> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise(resolve => {
      rl.question(chalk.yellow('\nThis prompt contains potential risks. Proceed? (y/N) '), answer => {
        rl.close();
        resolve(answer.toLowerCase() === 'y');
      });
    });
  }
} 