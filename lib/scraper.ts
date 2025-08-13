import { chromium, Browser, Page } from 'playwright';
import * as cheerio from 'cheerio';
import CryptoJS from 'crypto-js';

export interface ScrapedContent {
  url: string;
  title: string;
  content: string;
  contentHash: string;
  links: string[];
  metadata: {
    sectionNumber?: string;
    chapterNumber?: string;
    lastModified?: string;
  };
}

export class CornellLawScraper {
  private browser: Browser | null = null;

  async init(): Promise<void> {
    this.browser = await chromium.launch({ 
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    });
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  private generateContentHash(content: string): string {
    return CryptoJS.SHA256(content).toString();
  }

  /**
   * Check if a URL exists before attempting to scrape
   */
  private async validateUrl(url: string): Promise<boolean> {
    if (!this.browser) return false;
    
    const page = await this.browser.newPage();
    try {
      const response = await page.goto(url, { 
        waitUntil: 'domcontentloaded',
        timeout: 30000 
      });
      const isValid = response?.status() === 200;
      return isValid;
    } catch (error) {
      return false;
    } finally {
      await page.close();
    }
  }

  /**
   * Scrape a single section page with enhanced content extraction
   */
  private async scrapeSectionPage(page: Page, url: string): Promise<ScrapedContent> {
    await page.goto(url, { 
      waitUntil: 'domcontentloaded',
      timeout: 60000 
    });
    
    const html = await page.content();
    const $ = cheerio.load(html);
    
    // Extract section title
    const title = $('h1').first().text().trim() || 
                 $('title').text().replace(' | LII / Legal Information Institute', '').trim();
    
    // Extract section number
    const sectionMatch = url.match(/\/(\d+)$/);
    const sectionNumber = sectionMatch ? sectionMatch[1] : undefined;
    
    // Target the active tab content specifically
    let content = '';
    const activeTab = $('.tab-pane.active');
    if (activeTab.length > 0) {
      // Remove unwanted elements from the active tab
      const tabClone = activeTab.clone();
      tabClone.find('.advertisement, script, style, .breadcrumb, .tabs, nav, .sidebar').remove();
      content = tabClone.text();
    } else {
      // Fallback: get main content area
      $('.liicol-1, .advertisement, script, style, .breadcrumb, .tabs, nav').remove();
      const mainContent = $('.liicol-2, .content, .main-content').first();
      content = mainContent.text();
    }
    
    // Clean up content
    content = content.replace(/\s+/g, ' ').trim();
    
    return {
      url,
      title,
      content,
      contentHash: this.generateContentHash(content),
      links: [],
      metadata: {
        sectionNumber,
        lastModified: new Date().toISOString()
      }
    };
  }

  /**
   * Scrape a single section by URL
   */
  async scrapeSingleSection(url: string): Promise<ScrapedContent | null> {
    if (!this.browser) {
      throw new Error('Scraper not initialized. Call init() first.');
    }
    
    // First validate the URL exists
    const isValid = await this.validateUrl(url);
    if (!isValid) {
      console.log(`⚠️  URL not found: ${url}`);
      return null;
    }
    
    const page = await this.browser.newPage();
    
    try {
      console.log(`📄 Scraping: ${url}`);
      
      // Add delay to be respectful to the server
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const result = await this.scrapeSectionPage(page, url);
      console.log(`✅ Successfully scraped: ${result.title}`);
      
      return result;
    } catch (error) {
      console.error(`❌ Failed to scrape ${url}:`, error);
      return null;
    } finally {
      await page.close();
    }
  }

  /**
   * Generate URLs for all sections in a range
   */
  private generateSectionUrls(startSection: number, endSection: number): string[] {
    const urls: string[] = [];
    for (let i = startSection; i <= endSection; i++) {
      urls.push(`https://www.law.cornell.edu/uscode/text/17/${i}`);
    }
    return urls;
  }

  /**
   * Scrape all sections systematically
   */
  async scrapeAllSections(): Promise<ScrapedContent[]> {
    const results: ScrapedContent[] = [];
    
    console.log('🚀 Starting systematic section scraping...');
    
    // Generate all URLs to scrape
    const chapter10Urls = this.generateSectionUrls(1001, 1010); // §§ 1001-1010
    const chapter11Urls = ['https://www.law.cornell.edu/uscode/text/17/1101']; // § 1101 only
    
    const allUrls = [...chapter10Urls, ...chapter11Urls];
    
    console.log(`📋 Generated ${allUrls.length} URLs to check`);
    
    // Scrape each URL
    for (let i = 0; i < allUrls.length; i++) {
      const url = allUrls[i];
      const sectionNum = url.split('/').pop();
      
      console.log(`\n[${i + 1}/${allUrls.length}] Processing § ${sectionNum}`);
      
      try {
        const result = await this.scrapeSingleSection(url);
        if (result) {
          results.push(result);
        }
        
        // Add delay between requests (2 seconds)
        if (i < allUrls.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
      } catch (error) {
        console.error(`💥 Error processing § ${sectionNum}:`, error);
        continue;
      }
    }
    
    console.log(`\n🎉 Scraping completed! Successfully scraped ${results.length} sections.`);
    
    return results;
  }
}

// Convenience function for scraping all sections
export async function scrapeCornellLawChapters(): Promise<ScrapedContent[]> {
  const scraper = new CornellLawScraper();
  await scraper.init();
  
  try {
    return await scraper.scrapeAllSections();
  } finally {
    await scraper.close();
  }
}