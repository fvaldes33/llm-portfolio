import { z } from "zod";

export const canvasHeroBlockSchema = z.object({
  type: z.literal("hero"),
  eyebrow: z.string().optional(),
  title: z.string(),
  body: z.string().optional(),
});

export const canvasParagraphBlockSchema = z.object({
  type: z.literal("paragraph"),
  text: z.string(),
});

export const canvasCalloutBlockSchema = z.object({
  type: z.literal("callout"),
  title: z.string().optional(),
  text: z.string(),
  tone: z.enum(["default", "primary", "inverse"]).default("default"),
});

export const canvasStatGridBlockSchema = z.object({
  type: z.literal("statGrid"),
  items: z.array(
    z.object({
      label: z.string(),
      value: z.string(),
      detail: z.string().optional(),
    }),
  ),
});

export const canvasTagListBlockSchema = z.object({
  type: z.literal("tagList"),
  label: z.string().optional(),
  items: z.array(z.string()).min(1).max(16),
});

export const canvasLocationSchema = z.object({
  id: z.string(),
  label: z.string(),
  sublabel: z.string().optional(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  story: z.string(),
});

export const canvasMapBlockSchema = z.object({
  type: z.literal("map"),
  title: z.string().optional(),
  description: z.string().optional(),
  locations: z.array(canvasLocationSchema).min(1).max(6),
});

export const canvasTimelineBlockSchema = z.object({
  type: z.literal("timeline"),
  items: z.array(
    z.object({
      period: z.string(),
      title: z.string(),
      description: z.string(),
    }),
  ),
});

export const canvasMomentGridBlockSchema = z.object({
  type: z.literal("momentGrid"),
  items: z.array(
    z.object({
      eyebrow: z.string().optional(),
      title: z.string(),
      body: z.string(),
    }),
  ),
});

export const canvasProjectListBlockSchema = z.object({
  type: z.literal("projectList"),
  items: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      href: z.url().optional(),
      meta: z.string().optional(),
    }),
  ),
});

export const canvasBlockSchema = z.discriminatedUnion("type", [
  canvasHeroBlockSchema,
  canvasParagraphBlockSchema,
  canvasCalloutBlockSchema,
  canvasStatGridBlockSchema,
  canvasTagListBlockSchema,
  canvasMapBlockSchema,
  canvasTimelineBlockSchema,
  canvasMomentGridBlockSchema,
  canvasProjectListBlockSchema,
]);

export const canvasIntentSchema = z.enum([
  "welcome",
  "locations",
  "current",
  "projects",
  "career",
  "custom",
]);

export const canvasDocumentSchema = z.object({
  title: z.string(),
  intent: canvasIntentSchema,
  blocks: z.array(canvasBlockSchema).min(1).max(8),
});

export type CanvasLocation = z.infer<typeof canvasLocationSchema>;
export type CanvasBlock = z.infer<typeof canvasBlockSchema>;
export type CanvasDocument = z.infer<typeof canvasDocumentSchema>;
export type CanvasIntent = z.infer<typeof canvasIntentSchema>;
export type CanvasDocumentOutput = {
  status: "rendered";
  title: string;
  blockCount: number;
};

// individual block types
export type CanvasHeroBlock = z.infer<typeof canvasHeroBlockSchema>;
export type CanvasParagraphBlock = z.infer<typeof canvasParagraphBlockSchema>;
export type CanvasCalloutBlock = z.infer<typeof canvasCalloutBlockSchema>;
export type CanvasStatGridBlock = z.infer<typeof canvasStatGridBlockSchema>;
export type CanvasTagListBlock = z.infer<typeof canvasTagListBlockSchema>;
export type CanvasMapBlock = z.infer<typeof canvasMapBlockSchema>;
export type CanvasTimelineBlock = z.infer<typeof canvasTimelineBlockSchema>;
export type CanvasMomentGridBlock = z.infer<typeof canvasMomentGridBlockSchema>;
export type CanvasProjectListBlock = z.infer<
  typeof canvasProjectListBlockSchema
>;
