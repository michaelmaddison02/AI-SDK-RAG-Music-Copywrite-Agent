#!/usr/bin/env tsx

import { db } from '../lib/db';
import { resources, embeddings } from '../lib/db/schema';

async function checkDatabase() {
  console.log('🔍 Database Status Check\n');

  try {
    // Check resources table
    const allResources = await db.select().from(resources);
    console.log(`📚 Resources: ${allResources.length}`);
    
    allResources.forEach((resource, index) => {
      console.log(`  ${index + 1}. ${resource.title || 'Untitled'}`);
      console.log(`     URL: ${resource.sourceUrl || 'No URL'}`);
      console.log(`     Content Length: ${resource.content?.length || 0} chars`);
      console.log(`     Content Hash: ${resource.contentHash || 'No hash'}`);
      console.log(`     Last Scraped: ${resource.lastScraped || 'Never'}`);
      console.log('');
    });

    // Check embeddings table
    const allEmbeddings = await db.select().from(embeddings);
    console.log(`🔗 Embeddings: ${allEmbeddings.length}`);
    
    if (allEmbeddings.length > 0) {
      // Group by resource ID
      const embeddingsByResource = allEmbeddings.reduce((acc, emb) => {
        acc[emb.resourceId] = (acc[emb.resourceId] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      console.log('   Embeddings per resource:');
      Object.entries(embeddingsByResource).forEach(([resourceId, count]) => {
        const resource = allResources.find(r => r.id === resourceId);
        console.log(`     ${resource?.title || 'Unknown'}: ${count} chunks`);
      });
    }

    console.log('\n📊 Summary:');
    console.log(`   • ${allResources.length} resources stored`);
    console.log(`   • ${allEmbeddings.length} embedding chunks`);
    
    if (allResources.length > 0 && allEmbeddings.length === 0) {
      console.log('   ⚠️  Resources exist but no embeddings - population was interrupted');
    } else if (allResources.length === 0) {
      console.log('   ⚠️  Database is empty - need to run population');
    } else {
      console.log('   ✅ Database appears properly populated');
    }

  } catch (error) {
    console.error('❌ Error checking database:', error);
  }
}

checkDatabase().then(() => process.exit(0));