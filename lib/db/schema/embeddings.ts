import { sql } from "drizzle-orm";
import { text, varchar, timestamp, pgTable, real } from "drizzle-orm/pg-core";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { nanoid } from "@/lib/utils";
import { resources } from "./resources";

export const embeddings = pgTable("embeddings", {
  id: varchar("id", { length: 191 })
    .primaryKey()
    .$defaultFn(() => nanoid()),
  resourceId: varchar("resource_id", { length: 191 })
    .notNull()
    .references(() => resources.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  embedding: text("embedding").notNull(),

  createdAt: timestamp("created_at")
    .notNull()
    .default(sql`now()`),
});

// Schema for embeddings - used to validate API requests
export const insertEmbeddingSchema = createSelectSchema(embeddings)
  .extend({})
  .omit({
    id: true,
    createdAt: true,
  });

// Type for embeddings - used to type API request params and within Components
export type NewEmbeddingParams = z.infer<typeof insertEmbeddingSchema>;