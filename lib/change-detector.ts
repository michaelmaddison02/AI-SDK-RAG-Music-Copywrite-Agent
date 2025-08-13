import { db } from './db';
import { resources, embeddings } from './db/schema';
import { eq } from 'drizzle-orm';
import { ScrapedContent } from './scraper';
import { ProcessedLegalContent } from './legal-processor';

export interface ChangeDetectionResult {
  url: string;
  changeType: 'new' | 'updated' | 'unchanged';
  oldHash?: string;
  newHash: string;
  resourceId?: string;
}

export class ChangeDetector {
  
  /**
   * Compare scraped content with stored content to detect changes
   */
  static async detectChanges(scrapedContents: ScrapedContent[]): Promise<ChangeDetectionResult[]> {
    const results: ChangeDetectionResult[] = [];
    
    for (const content of scrapedContents) {
      const result = await this.detectSingleChange(content);
      results.push(result);
    }
    
    return results;
  }

  /**
   * Detect changes for a single piece of content
   */
  private static async detectSingleChange(content: ScrapedContent): Promise<ChangeDetectionResult> {
    try {
      // Look for existing resource with this URL
      const existingResource = await db
        .select()
        .from(resources)
        .where(eq(resources.sourceUrl, content.url))
        .limit(1);
      
      if (existingResource.length === 0) {
        // New content
        return {
          url: content.url,
          changeType: 'new',
          newHash: content.contentHash
        };
      }
      
      const existing = existingResource[0];
      
      if (existing.contentHash === content.contentHash) {
        // No change
        return {
          url: content.url,
          changeType: 'unchanged',
          oldHash: existing.contentHash,
          newHash: content.contentHash,
          resourceId: existing.id
        };
      }
      
      // Content has changed
      return {
        url: content.url,
        changeType: 'updated',
        oldHash: existing.contentHash,
        newHash: content.contentHash,
        resourceId: existing.id
      };
      
    } catch (error) {
      console.error(`Error detecting changes for ${content.url}:`, error);
      // Assume it's new content if we can't determine
      return {
        url: content.url,
        changeType: 'new',
        newHash: content.contentHash
      };
    }
  }

  /**
   * Remove old embeddings for changed content
   */
  static async cleanupOldEmbeddings(resourceId: string): Promise<void> {
    try {
      await db
        .delete(embeddings)
        .where(eq(embeddings.resourceId, resourceId));
      
      console.log(`Cleaned up old embeddings for resource ${resourceId}`);
    } catch (error) {
      console.error(`Error cleaning up embeddings for resource ${resourceId}:`, error);
      throw error;
    }
  }

  /**
   * Update existing resource with new content
   */
  static async updateResource(
    resourceId: string, 
    processedContent: ProcessedLegalContent, 
    contentHash: string
  ): Promise<void> {
    try {
      await db
        .update(resources)
        .set({
          content: processedContent.content,
          title: processedContent.title,
          contentHash,
          lastScraped: new Date(),
          updatedAt: new Date()
        })
        .where(eq(resources.id, resourceId));
      
      console.log(`Updated resource ${resourceId}: ${processedContent.title}`);
    } catch (error) {
      console.error(`Error updating resource ${resourceId}:`, error);
      throw error;
    }
  }

  /**
   * Create change detection summary for logging
   */
  static createChangesSummary(results: ChangeDetectionResult[]): string {
    const newCount = results.filter(r => r.changeType === 'new').length;
    const updatedCount = results.filter(r => r.changeType === 'updated').length;
    const unchangedCount = results.filter(r => r.changeType === 'unchanged').length;
    
    const summary = [
      `Change Detection Summary:`,
      `- New: ${newCount}`,
      `- Updated: ${updatedCount}`,
      `- Unchanged: ${unchangedCount}`,
      `- Total: ${results.length}`
    ].join('\n');
    
    // Add details for changes
    const changes = results.filter(r => r.changeType !== 'unchanged');
    if (changes.length > 0) {
      const changeDetails = changes.map(change => 
        `  ${change.changeType.toUpperCase()}: ${change.url}`
      ).join('\n');
      
      return `${summary}\n\nChanges Detected:\n${changeDetails}`;
    }
    
    return summary;
  }

  /**
   * Get list of URLs that need processing (new or updated)
   */
  static getUrlsToProcess(results: ChangeDetectionResult[]): {
    new: ChangeDetectionResult[],
    updated: ChangeDetectionResult[]
  } {
    return {
      new: results.filter(r => r.changeType === 'new'),
      updated: results.filter(r => r.changeType === 'updated')
    };
  }

  /**
   * Update last scraped timestamp for unchanged content
   */
  static async updateLastScrapedTimestamp(unchangedResults: ChangeDetectionResult[]): Promise<void> {
    for (const result of unchangedResults) {
      if (result.resourceId) {
        try {
          await db
            .update(resources)
            .set({ lastScraped: new Date() })
            .where(eq(resources.id, result.resourceId));
        } catch (error) {
          console.error(`Error updating timestamp for ${result.resourceId}:`, error);
        }
      }
    }
  }
}