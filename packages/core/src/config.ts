import { z } from "zod";

export const RuntimeConfigSchema = z
  .object({
    host: z.string().min(1).default("127.0.0.1"),
    port: z.number().int().min(1).max(65535).default(4000),
    staticDir: z.string().optional(),
  })
  .strict();

export type RuntimeConfig = z.infer<typeof RuntimeConfigSchema>;
