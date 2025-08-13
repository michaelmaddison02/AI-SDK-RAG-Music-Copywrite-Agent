import { ScrapedContent } from './scraper';

export interface ProcessedLegalContent {
  title: string;
  content: string;
  chunks: string[];
  metadata: {
    sourceUrl: string;
    sectionNumber?: string;
    chapterNumber?: string;
    contentType: 'chapter' | 'section';
    lastModified?: string;
  };
}

export class LegalContentProcessor {
  
  /**
   * Process legal text with specialized chunking for legal documents
   */
  static processLegalText(scrapedContent: ScrapedContent): ProcessedLegalContent {
    const { url, title, content, metadata } = scrapedContent;
    
    // Determine content type
    const contentType = url.includes('/chapter-') ? 'chapter' : 'section';
    
    // Clean and structure the content
    const cleanContent = this.cleanLegalText(content);
    
    // Create specialized chunks for legal content
    const chunks = this.chunkLegalText(cleanContent, title);
    
    return {
      title,
      content: cleanContent,
      chunks,
      metadata: {
        sourceUrl: url,
        sectionNumber: metadata.sectionNumber,
        chapterNumber: metadata.chapterNumber,
        contentType,
        lastModified: metadata.lastModified,
      }
    };
  }

  /**
   * Clean legal text by removing extra whitespace and formatting consistently
   */
  private static cleanLegalText(text: string): string {
    return text
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      // Remove extra spaces around punctuation
      .replace(/\s+([.,;:)])/g, '$1')
      .replace(/([([:])\s+/g, '$1')
      // Clean up section references
      .replace(/§\s*/g, '§ ')
      // Remove multiple consecutive periods
      .replace(/\.{3,}/g, '...')
      .trim();
  }

  /**
   * Specialized chunking for legal documents that preserves legal structure
   */
  private static chunkLegalText(content: string, title: string): string[] {
    const chunks: string[] = [];
    
    // Start with title context
    const titleChunk = `${title}\n\n${content}`;
    
    // Split by legal subsections (paragraphs numbered (1), (2), etc.)
    const paragraphSections = content.split(/(?=\(\d+\))/);
    
    if (paragraphSections.length > 1) {
      // If we have numbered paragraphs, create chunks for each
      paragraphSections.forEach((section, index) => {
        if (section.trim()) {
          const chunk = index === 0 
            ? `${title}\n\n${section.trim()}`
            : `${title} - ${section.trim()}`;
          
          if (chunk.length > 100) { // Only include substantial chunks
            chunks.push(chunk);
          }
        }
      });
    } else {
      // For content without clear subsections, use semantic chunking
      const sentences = this.splitIntoSentences(content);
      const semanticChunks = this.createSemanticChunks(sentences, title);
      chunks.push(...semanticChunks);
    }
    
    // If no good chunks were created, fall back to the full content
    if (chunks.length === 0 && content.length > 50) {
      chunks.push(titleChunk.substring(0, 2000)); // Limit chunk size
    }
    
    return chunks;
  }

  /**
   * Split text into sentences while being careful with legal abbreviations
   */
  private static splitIntoSentences(text: string): string[] {
    // Legal abbreviations that shouldn't be split on
    const legalAbbrevs = ['U.S.', 'v.', 'e.g.', 'i.e.', 'etc.', 'Inc.', 'Corp.', 'LLC'];
    
    let processedText = text;
    
    // Temporarily replace abbreviations to avoid splitting on them
    const placeholders: { [key: string]: string } = {};
    legalAbbrevs.forEach((abbrev, index) => {
      const placeholder = `__ABBREV_${index}__`;
      placeholders[placeholder] = abbrev;
      processedText = processedText.replace(new RegExp(abbrev.replace('.', '\\.'), 'g'), placeholder);
    });
    
    // Split on sentence boundaries
    const sentences = processedText
      .split(/[.!?]+\s+/)
      .map(sentence => {
        // Restore abbreviations
        let restored = sentence;
        Object.entries(placeholders).forEach(([placeholder, abbrev]) => {
          restored = restored.replace(new RegExp(placeholder, 'g'), abbrev);
        });
        return restored.trim();
      })
      .filter(sentence => sentence.length > 20); // Filter out very short fragments
    
    return sentences;
  }

  /**
   * Create semantic chunks that maintain meaning and context
   */
  private static createSemanticChunks(sentences: string[], title: string, maxChunkSize: number = 1200): string[] {
    const chunks: string[] = [];
    let currentChunk = `${title}\n\n`;
    
    for (const sentence of sentences) {
      // If adding this sentence would exceed max size, start a new chunk
      if (currentChunk.length + sentence.length + 2 > maxChunkSize && currentChunk.length > title.length + 10) {
        chunks.push(currentChunk.trim());
        currentChunk = `${title}\n\n${sentence}. `;
      } else {
        currentChunk += sentence + '. ';
      }
    }
    
    // Add the final chunk if it has content
    if (currentChunk.length > title.length + 10) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks;
  }

  /**
   * Process multiple scraped contents in batch
   */
  static processBatch(scrapedContents: ScrapedContent[]): ProcessedLegalContent[] {
    return scrapedContents
      .filter(content => content.content.length > 50) // Filter out empty content
      .map(content => this.processLegalText(content));
  }

  /**
   * Create a summary of processed content for logging
   */
  static createProcessingSummary(processedContents: ProcessedLegalContent[]): string {
    const totalChunks = processedContents.reduce((sum, content) => sum + content.chunks.length, 0);
    const chapters = processedContents.filter(c => c.metadata.contentType === 'chapter').length;
    const sections = processedContents.filter(c => c.metadata.contentType === 'section').length;
    
    return `Processed ${processedContents.length} documents (${chapters} chapters, ${sections} sections) into ${totalChunks} chunks`;
  }
}