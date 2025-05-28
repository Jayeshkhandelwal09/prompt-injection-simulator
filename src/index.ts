import { config } from './config';
import { attacks } from './attacks';
import { PromptInjectionTester } from './tester';
import { SafeModeOptions } from './safeMode';

async function main() {
  if (!config.openaiApiKey) {
    console.error('Error: OPENAI_API_KEY is not set in .env file');
    process.exit(1);
  }

  const safeModeOptions: SafeModeOptions = {
    enabled: true,
    maxTokens: 150,
    maxPromptLength: 500,
    requireConfirmation: true, 
  };

  const tester = new PromptInjectionTester(config, safeModeOptions);

  try {
    console.log(`Starting prompt injection tests against ${config.model} with Safe Mode enabled...\n`);
    await tester.runAllAttacks(attacks);
  } catch (error) {
    console.error('Error running tests:', error);
    process.exit(1);
  }
}

main().catch(console.error); 