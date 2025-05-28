import dotenv from 'dotenv';
import { Config } from './types';

dotenv.config();

export const config: Config = {
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  model: process.env.MODEL || 'gpt-3.5-turbo',
  maxTokens: 150
}; 