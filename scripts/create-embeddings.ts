#!/usr/bin/env tsx

/**
 * Create embeddings for resources that don't have them
 */

import { db } from '../lib/db';
import { resources, embeddings } from '../lib/db/schema';
import { LegalContentProcessor } from '../lib/legal-processor';
import { createEmbeddingsForResource } from '../lib/embeddings';
import { eq, sql } from 'drizzle-orm';

async function createMissingEmbeddings(): Promise<void> {
  console.log('🔗 Creating missing embeddings...\n');

  try {
    // Get all resources that don't have embeddings
    const resourcesWithoutEmbeddings = await db
      .select()
      .from(resources)
      .leftJoin(embeddings, eq(resources.id, embeddings.resourceId))
      .where(sql`${embeddings.id} IS NULL`);

    if (resourcesWithoutEmbeddings.length === 0) {
      console.log('✅ All resources already have embeddings!');
      return;
    }

    console.log(`📋 Found ${resourcesWithoutEmbeddings.length} resources without embeddings:`);
    resourcesWithoutEmbeddings.forEach((row, i) => {
      const resource = row.resources;
      console.log(`  ${i + 1}. ${resource.title || 'Untitled'} (${resource.content?.length || 0} chars)`);
    });

    console.log('\n💾 Creating embeddings...\n');

    // Process each resource
    for (let i = 0; i < resourcesWithoutEmbeddings.length; i++) {
      const resource = resourcesWithoutEmbeddings[i].resources;
      
      if (!resource.content) {
        console.log(`⚠️  Skipping ${resource.title} - no content`);
        continue;
      }

      console.log(`[${i + 1}/${resourcesWithoutEmbeddings.length}] Processing: ${resource.title}`);

      try {
        // Create mock scraped content for processing
        const scrapedContent = {
          url: resource.sourceUrl || '',
          title: resource.title || '',
          content: resource.content,
          contentHash: resource.contentHash || '',
          links: [],
          metadata: {
            sectionNumber: resource.sourceUrl?.match(/\/(\d+)$/)?.[1],
            lastModified: resource.lastScraped?.toISOString() || new Date().toISOString()
          }
        };

        // Process the content to get chunks
        const processedContent = LegalContentProcessor.processLegalText(scrapedContent);
        
        console.log(`  📝 Generated ${processedContent.chunks.length} chunks`);

        // Create embeddings for each chunk
        for (const chunk of processedContent.chunks) {
          await createEmbeddingsForResource(resource.id, chunk);
        }

        console.log(`  ✅ Created embeddings for ${resource.title}\n`);

      } catch (error) {
        console.error(`  ❌ Failed to create embeddings for ${resource.title}:`, error);
        continue;
      }
    }

    console.log('🎉 Finished creating embeddings!');

  } catch (error) {
    console.error('💥 Error:', error);
    throw error;
  }
}

// Allow this to be run as a script
if (require.main === module) {
  createMissingEmbeddings()
    .then(() => {
      console.log('\n✅ Embedding creation completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Embedding creation failed:', error);
      process.exit(1);
    });
}

export { createMissingEmbeddings };