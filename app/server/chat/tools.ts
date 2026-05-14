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
import { retrieveFrancoKnowledge } from "~/server/knowledge/retrieval";

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
      "Search Franco's embedded knowledge base with a targeted query. Use this when the initial retrieved context is not specific enough, when the user asks a follow-up that needs a different angle, or before composing a custom canvas that needs precise facts. Try focused queries like 'baseball catcher leadership', 'Momwise app stack', 'Safety Radar workflow editor', or 'Union Craft CMS design system'.",
    inputSchema: z.object({
      query: z.string().min(2),
      limit: z.number().int().min(1).max(10).default(5),
    }),
    execute: async ({ query, limit }) => {
      const chunks = await retrieveFrancoKnowledge(query, limit);
      return chunks.map((chunk) => ({
        title: chunk.documentTitle,
        sourcePath: chunk.sourcePath,
        heading: chunk.heading,
        content: chunk.content,
        similarity: chunk.similarity,
      }));
    },
  }),
  showKnownCanvas: tool({
    description:
      "Render one of Franco's known high-quality left-panel canvases. Use mainly for reset/welcome or when the user asks a very common broad topic. For nuanced answers, prefer searchFrancoKnowledge followed by renderCanvasDocument.",
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

      getFrancoToolContext(experimental_context).writeCanvas(documents[view]);
      return `Rendered ${view} canvas.`;
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
      "Render a custom structured UI document in the left panel. This is the main generative UI tool. Compose a concise AST from allowed blocks only using known/retrieved Franco facts. Never include private details, ARR, children's names, exact address, private customer names, or internal Safety Radar metrics.",
    inputSchema: canvasDocumentSchema,
    execute: async (canvasDocument, { experimental_context }) => {
      getFrancoToolContext(experimental_context).writeCanvas(canvasDocument);
      return `Rendered custom canvas: ${canvasDocument.title}.`;
    },
  }),
};

export type FrancoTools = typeof francoTools;
export type FrancoUITools = InferUITools<FrancoTools>;
