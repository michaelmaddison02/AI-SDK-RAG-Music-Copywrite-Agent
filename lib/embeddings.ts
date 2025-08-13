import { openai } from "@ai-sdk/openai";
import { embed } from "ai";
import { db } from "./db";
import { embeddings } from "./db/schema/embeddings";

export function chunkText(text: string, chunkSize: number = 1000, chunkOverlap: number = 200): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const chunk = text.slice(start, end);
    chunks.push(chunk.trim());
    
    if (end === text.length) break;
    start = end - chunkOverlap;
  }

  return chunks;
}

export async function createEmbedding(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: openai.embedding("text-embedding-ada-002"),
    value: text,
  });
  
  return embedding;
}

export async function createEmbeddingsForResource(resourceId: string, content: string): Promise<void> {
  const chunks = chunkText(content);
  
  for (const chunk of chunks) {
    const embedding = await createEmbedding(chunk);
    
    await db.insert(embeddings).values({
      resourceId,
      content: chunk,
      embedding: JSON.stringify(embedding),
    });
  }
}