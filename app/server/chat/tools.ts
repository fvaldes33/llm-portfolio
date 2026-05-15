import { tool, type InferUITools } from "ai";
import { z } from "zod";
import {
  canvasDocumentSchema,
  type CanvasDocument,
} from "~/lib/canvas-document";
import {
  currentCanvasDocument,
  locationsCanvasDocument,
  projectsCanvasDocument,
  welcomeCanvasDocument,
} from "~/lib/canvas-documents";
import { retrieveFrancoKnowledgeMany } from "~/server/knowledge/retrieval";

export type FollowUpPrompt = {
  label: string;
  prompt: string;
};

export type CanvasDataPart = { canvasDocument: CanvasDocument };
export type FollowUpsDataPart = { prompts: FollowUpPrompt[] };

type FrancoToolContext = {
  writeCanvas: (canvasDocument: CanvasDocument) => void;
  writeFollowUps: (prompts: FollowUpPrompt[]) => void;
};

function getFrancoToolContext(context: unknown) {
  return context as FrancoToolContext;
}

export const francoTools = {
  searchFrancoKnowledge: tool({
    description:
      "Search Franco's embedded knowledge base with 1-4 focused semantic queries in parallel. Use this heavily before answering substantive questions or composing a custom canvas. Each query should be a short noun phrase, ideally 2-6 words, and represent one semantic angle. Do not pass the raw user message. Do not create long keyword strings or kitchen-sink queries. Good query sets: ['UVA culture shock', 'Miami normalcy wealth', 'Charlottesville pace']; ['athlete engineer transition', 'dealership review system', 'Rock Slide Xpient']; ['Team USA trials', 'Monterrey silver Cuba']; ['father four kids', 'Momwise mental load', 'meetings wasted motion'].",
    inputSchema: z.object({
      queries: z.array(z.string().min(2).max(64)).min(1).max(4),
      limitPerQuery: z.number().int().min(1).max(8).default(4),
      maxResults: z.number().int().min(1).max(12).default(8),
    }),
    execute: async ({ queries, limitPerQuery, maxResults }) => {
      const chunks = await retrieveFrancoKnowledgeMany({
        queries,
        limitPerQuery,
        maxResults,
      });

      return chunks.map((chunk) => ({
        title: chunk.documentTitle,
        sourcePath: chunk.sourcePath,
        heading: chunk.heading,
        content: chunk.content,
        similarity: chunk.similarity,
        matchedQueries: chunk.matchedQueries,
      }));
    },
  }),
  showKnownCanvas: tool({
    description:
      "Render one of Franco's known high-quality left-panel canvases. Use when the user intent exactly matches a broad known view: welcome/reset, locations, current role/Safety Radar, or side projects. For nuanced answers, prefer renderCanvasDocument.",
    inputSchema: z.object({
      view: z.enum(["welcome", "locations", "current", "projects"]),
    }),
    execute: async ({ view }, { experimental_context }) => {
      const documents = {
        welcome: welcomeCanvasDocument,
        locations: locationsCanvasDocument,
        current: currentCanvasDocument,
        projects: projectsCanvasDocument,
      } satisfies Record<typeof view, CanvasDocument>;

      const canvasDocument = documents[view];
      getFrancoToolContext(experimental_context).writeCanvas(canvasDocument);
      return {
        status: "rendered",
        title: canvasDocument.title,
        blockCount: canvasDocument.blocks.length,
      };
    },
  }),
  generateFollowUps: tool({
    description:
      "Generate follow-up prompts that give the user momentum to continue the conversation. Always call this once near the end of the answer. Return 3-5 concise, specific follow-ups based on the user's question, the answer, and the visible canvas. Do not duplicate the user's exact question.",
    inputSchema: z.object({
      prompts: z
        .array(
          z.object({
            label: z.string().min(2).max(48),
            prompt: z.string().min(2).max(180),
          }),
        )
        .min(3)
        .max(5),
    }),
    execute: async ({ prompts }, { experimental_context }) => {
      getFrancoToolContext(experimental_context).writeFollowUps(prompts);
      return prompts;
    },
  }),
  renderCanvasDocument: tool({
    description:
      "Render a custom structured UI document in the left panel. This is the primary generative UI tool and should be used on most substantive turns. Compose a concise AST from allowed blocks only using known/retrieved Franco facts. Great for stories, timelines, leadership answers, AI beliefs, career transitions, project comparisons, Safety Radar, baseball, origin, or any answer with multiple distinct facts. Never include private details, ARR, children's names, exact address, private customer names, or internal Safety Radar metrics.",
    inputSchema: canvasDocumentSchema,
    execute: async (canvasDocument, { experimental_context }) => {
      getFrancoToolContext(experimental_context).writeCanvas(canvasDocument);
      return {
        status: "rendered",
        title: canvasDocument.title,
        blockCount: canvasDocument.blocks.length,
      };
    },
  }),
};

export type FrancoTools = typeof francoTools;
export type FrancoUITools = InferUITools<FrancoTools>;
