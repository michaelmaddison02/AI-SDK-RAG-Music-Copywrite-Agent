import { scrapeCornellLawChapters } from './scraper';
import { LegalContentProcessor } from './legal-processor';
import { ChangeDetector, ChangeDetectionResult } from './change-detector';
import { createEmbeddingsForResource } from './embeddings';
import { db } from './db';
import { resources } from './db/schema';

/**
 * Main function to populate database with Cornell Law content
 */
export async function populateDatabase(): Promise<void> {
  console.log('🚀 Starting Cornell Law database population...');
  
  try {
    // Step 1: Scrape content from Cornell Law
    console.log('📡 Scraping Cornell Law chapters...');
    const scrapedContents = await scrapeCornellLawChapters();
    console.log(`✅ Scraped ${scrapedContents.length} pages`);
    
    // Step 2: Detect changes
    console.log('🔍 Detecting changes...');
    const changeResults = await ChangeDetector.detectChanges(scrapedContents);
    const changesSummary = ChangeDetector.createChangesSummary(changeResults);
    console.log(changesSummary);
    
    // Step 3: Process content that needs updating
    const { new: newContent, updated: updatedContent } = ChangeDetector.getUrlsToProcess(changeResults);
    const toProcess = [...newContent, ...updatedContent];
    
    if (toProcess.length === 0) {
      console.log('✅ No changes detected. Database is up to date.');
      
      // Update timestamps for unchanged content
      const unchangedResults = changeResults.filter(r => r.changeType === 'unchanged');
      await ChangeDetector.updateLastScrapedTimestamp(unchangedResults);
      
      return;
    }
    
    // Step 4: Process legal content
    console.log(`📝 Processing ${toProcess.length} changed documents...`);
    const contentToProcess = scrapedContents.filter(content => 
      toProcess.some(change => change.url === content.url)
    );
    
    const processedContents = LegalContentProcessor.processBatch(contentToProcess);
    const processingSummary = LegalContentProcessor.createProcessingSummary(processedContents);
    console.log(processingSummary);
    
    // Step 5: Update database
    console.log('💾 Updating database...');
    
    for (let i = 0; i < processedContents.length; i++) {
      const processedContent = processedContents[i];
      const changeResult = toProcess.find(change => change.url === processedContent.metadata.sourceUrl);
      
      if (!changeResult) continue;
      
      console.log(`Processing ${i + 1}/${processedContents.length}: ${processedContent.title}`);
      
      try {
        if (changeResult.changeType === 'updated' && changeResult.resourceId) {
          // Update existing resource
          await handleUpdatedContent(changeResult.resourceId, processedContent, changeResult.newHash);
        } else {
          // Create new resource
          await handleNewContent(processedContent, changeResult.newHash);
        }
      } catch (error) {
        console.error(`❌ Error processing ${processedContent.title}:`, error);
        continue;
      }
    }
    
    console.log('✅ Database population completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during database population:', error);
    throw error;
  }
}

/**
 * Handle new content by creating resource and embeddings
 */
async function handleNewContent(
  processedContent: any, 
  contentHash: string
): Promise<void> {
  // Create new resource
  const [newResource] = await db
    .insert(resources)
    .values({
      content: processedContent.content,
      sourceUrl: processedContent.metadata.sourceUrl,
      title: processedContent.title,
      contentHash,
      lastScraped: new Date()
    })
    .returning();
  
  // Create embeddings for each chunk
  for (const chunk of processedContent.chunks) {
    await createEmbeddingsForResource(newResource.id, chunk);
  }
  
  console.log(`✅ Created new resource: ${processedContent.title} (${processedContent.chunks.length} chunks)`);
}

/**
 * Handle updated content by cleaning old embeddings and creating new ones
 */
async function handleUpdatedContent(
  resourceId: string, 
  processedContent: any, 
  contentHash: string
): Promise<void> {
  // Clean up old embeddings
  await ChangeDetector.cleanupOldEmbeddings(resourceId);
  
  // Update resource
  await ChangeDetector.updateResource(resourceId, processedContent, contentHash);
  
  // Create new embeddings for each chunk
  for (const chunk of processedContent.chunks) {
    await createEmbeddingsForResource(resourceId, chunk);
  }
  
  console.log(`✅ Updated resource: ${processedContent.title} (${processedContent.chunks.length} chunks)`);
}

/**
 * Quick function to check what would be updated without actually doing it
 */
export async function previewChanges(): Promise<void> {
  console.log('🔍 Previewing potential changes...');
  
  try {
    const scrapedContents = await scrapeCornellLawChapters();
    const changeResults = await ChangeDetector.detectChanges(scrapedContents);
    const changesSummary = ChangeDetector.createChangesSummary(changeResults);
    
    console.log(changesSummary);
    
  } catch (error) {
    console.error('❌ Error during preview:', error);
    throw error;
  }
}

// Allow this to be run as a script
if (require.main === module) {
  populateDatabase()
    .then(() => {
      console.log('🎉 Population script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Population script failed:', error);
      process.exit(1);
    });
}