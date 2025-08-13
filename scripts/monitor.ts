#!/usr/bin/env tsx

/**
 * Scheduled monitoring script for Cornell Law content changes
 * This can be run via cron job or GitHub Actions
 */

import { populateDatabase, previewChanges } from '../lib/populate-db';

const COMMANDS = {
  'populate': populateDatabase,
  'preview': previewChanges,
  'help': showHelp
};

async function showHelp(): Promise<void> {
  console.log(`
Cornell Law Monitor - Usage:

Commands:
  populate    Scrape websites and update database with any changes
  preview     Show what would be changed without updating database
  help        Show this help message

Examples:
  npm run monitor populate    # Update database with latest content
  npm run monitor preview     # Preview changes without updating
  
Scheduling:
  Run "npm run monitor populate" daily via cron:
  0 2 * * * cd /path/to/project && npm run monitor populate

Environment Variables:
  DATABASE_URL - Postgres database connection string
  OPENAI_API_KEY - OpenAI API key for embeddings
`);
}

async function main(): Promise<void> {
  const command = process.argv[2] || 'help';
  
  if (!(command in COMMANDS)) {
    console.error(`❌ Unknown command: ${command}`);
    console.error('Run "npm run monitor help" for usage information.');
    process.exit(1);
  }
  
  const handler = COMMANDS[command as keyof typeof COMMANDS];
  
  try {
    console.log(`🚀 Running command: ${command}`);
    console.log(`⏰ Started at: ${new Date().toISOString()}`);
    
    await handler();
    
    console.log(`✅ Command completed: ${command}`);
    console.log(`⏰ Finished at: ${new Date().toISOString()}`);
    
    // Force exit to ensure clean shutdown
    process.exit(0);
    
  } catch (error) {
    console.error(`❌ Command failed: ${command}`);
    console.error('Error:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n⚠️  Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n⚠️  Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Run the main function
main().catch((error) => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});