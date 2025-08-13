'use server';

import {
  NewResourceParams,
  insertResourceSchema,
  resources,
} from '@/lib/db/schema/resources';
import { db } from '../db';
import { createEmbeddingsForResource } from '../embeddings';
import { eq, sql } from 'drizzle-orm';
import { embeddings } from '../db/schema/embeddings';

export const createResource = async (input: NewResourceParams) => {
  try {
    const { content } = insertResourceSchema.parse(input);

    const [resource] = await db
      .insert(resources)
      .values({ content })
      .returning();

    // Create embeddings for the resource
    if (resource) {
      await createEmbeddingsForResource(resource.id, content);
    }

    return 'Resource successfully created.';
  } catch (e) {
    if (e instanceof Error)
      return e.message.length > 0 ? e.message : 'Error, please try again.';
  }
};

export const findSimilarResources = async (query: string, limit: number = 5) => {
  try {
    const { embed } = await import('ai');
    const { openai } = await import('@ai-sdk/openai');
    
    const { embedding: queryEmbedding } = await embed({
      model: openai.embedding("text-embedding-ada-002"),
      value: query,
    });

    // Get all embeddings and calculate similarity in JavaScript
    const allEmbeddings = await db
      .select({
        id: embeddings.id,
        content: embeddings.content,
        resourceId: embeddings.resourceId,
        embedding: embeddings.embedding,
      })
      .from(embeddings);

    // Calculate cosine similarity for each embedding
    const similarEmbeddings = allEmbeddings
      .map((item) => {
        const embeddingVector = JSON.parse(item.embedding) as number[];
        const similarity = cosineSimilarity(queryEmbedding, embeddingVector);
        return {
          ...item,
          similarity,
        };
      })
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    return similarEmbeddings;
  } catch (e) {
    if (e instanceof Error)
      return { error: e.message.length > 0 ? e.message : 'Error, please try again.' };
  }
};

function cosineSimilarity(vecA: number[], vecB: number[]): number {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}