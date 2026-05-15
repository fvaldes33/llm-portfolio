import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

// moonshotai/kimi-k2.6
export const kimiK26 = openrouter.chat("moonshotai/kimi-k2.6");

// z-ai/glm-5-turbo
export const glm5Turbo = openrouter.chat("z-ai/glm-5-turbo");

// anthropic/claude-sonnet-4-6
export const claudeSonnet46 = anthropic.chat("claude-sonnet-4-6");

// openai/gpt-4o
export const gpt5ChatLatest = openai.chat("gpt-5.5");
