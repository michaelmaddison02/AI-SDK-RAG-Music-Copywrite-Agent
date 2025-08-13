# Music Copyright AI Assistant

An intelligent RAG (Retrieval-Augmented Generation) chatbot that provides accurate answers about digital audio recording laws and copyright regulations based on Cornell Law School's U.S. Code database.

## What It Does

The Music Copyright AI Assistant:
- **Scrapes legal content** from Cornell Law's USC Title 17 (Chapters 10 & 11)
- **Creates semantic embeddings** for accurate legal information retrieval
- **Answers questions** using only verified legal sources from the database
- **Automatically monitors** for legal updates and refreshes content
- **Provides citations** from relevant USC sections in responses

## Tech Stack

- **Frontend**: [Next.js](https://nextjs.org) 14 (App Router), [shadcn-ui](https://ui.shadcn.com), [TailwindCSS](https://tailwindcss.com)
- **AI**: [Vercel AI SDK](https://sdk.vercel.ai/docs), [OpenAI](https://openai.com) (GPT-4o-mini + text-embedding-ada-002)
- **Database**: [PostgreSQL](https://www.postgresql.org/) with vector embeddings
- **ORM**: [Drizzle ORM](https://orm.drizzle.team)
- **Scraping**: [Playwright](https://playwright.dev/), [Cheerio](https://cheerio.js.org/)

## Legal Knowledge Base

The system contains comprehensive information from:
- **USC Title 17, Chapter 10**: Digital Audio Recording Devices and Media (§§ 1001-1010)
  - Definitions, copying controls, royalty payments, infringement actions, civil remedies
- **USC Title 17, Chapter 11**: Sound Recordings and Music Videos (§ 1101)
  - Unauthorized fixation and trafficking regulations

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (recommended: [Neon](https://neon.tech/) or local setup)
- OpenAI API key

### 1. Clone and Install

```bash
git clone <repository-url>
cd ai-sdk-rag-starter
npm install
```

### 2. Environment Setup

Create `.env` file:

```bash
DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"
OPENAI_API_KEY="sk-your-openai-api-key-here"
```

### 3. Database Setup

```bash
# Generate and run migrations
npm run db:generate
npm run db:migrate

# Optional: View database in Drizzle Studio
npm run db:studio
```

## Web Scraping & Data Population

### Initial Population

Scrape all legal content and create embeddings:

```bash
# Full scraping and embedding process
npm run scrape:populate
```

This will:
1. Scrape USC sections 1001-1010 and 1101 from Cornell Law
2. Process and chunk the legal text
3. Generate OpenAI embeddings for semantic search
4. Store everything in the PostgreSQL database

### Preview Mode

Check what would be scraped without making changes:

```bash
npm run scrape:preview
```

### Manual Embedding Creation

If embeddings are missing for existing resources:

```bash
npm run db:create-embeddings
```

### Database Status Check

View current database contents:

```bash
npm run db:check-status
```

Example output:
```
Resources: 11 legal sections
Embeddings: 78 chunks
Database appears properly populated
```

## Running the Assistant

### Development Mode

```bash
npm run dev
```

Visit `http://localhost:3000` to chat with the Music Copyright AI Assistant.

### Production Build

```bash
npm run build
npm run start
```

## Monitoring & Updates

### Manual Content Updates

Check for legal content changes and update database:

```bash
npm run monitor populate
```

### Scheduled Monitoring

Set up a cron job for automatic updates:

```bash
# Daily check at 2 AM
0 2 * * * cd /path/to/project && npm run monitor populate
```

### Available Monitoring Commands

```bash
npm run monitor populate    # Update database with latest content
npm run monitor preview     # Preview potential changes
npm run monitor help       # Show all available commands
```

## How It Works

### 1. Web Scraping Process
- **Target Sources**: Cornell Law's USC Title 17 pages
- **Content Extraction**: Uses Playwright to handle JavaScript-heavy pages
- **Structure Preservation**: Maintains legal document hierarchy and citations
- **Change Detection**: Content hashing to detect updates automatically

### 2. Legal Text Processing
- **Smart Chunking**: Preserves legal subsection structure (a), (b), (c), etc.
- **Context Preservation**: Each chunk includes section title for proper context
- **Semantic Embeddings**: OpenAI text-embedding-ada-002 for accurate similarity search

### 3. RAG Pipeline
- **Query Processing**: User questions are converted to embeddings
- **Similarity Search**: Cosine similarity matching against legal content
- **Context Injection**: Relevant legal sections are provided as context
- **Response Generation**: GPT-4o-mini generates answers using only provided legal context

### 4. Quality Assurance
- **Source Attribution**: Responses include USC section references
- **Hallucination Prevention**: Agent only uses retrieved legal content
- **Accuracy Guarantee**: Direct quotes and citations from official legal sources

## Example Usage

The assistant can answer questions like:

- **"What are digital audio recording devices?"**
  - Returns definitions from USC § 1001 with specific legal criteria
  
- **"What are the royalty payment requirements?"**
  - Explains obligations from USC §§ 1003-1007 with specific percentages and procedures
  
- **"What civil remedies are available for copyright infringement?"**  
  - Details remedies from USC § 1009 including injunctions and damages

## Features

- **Accurate Legal Information**: Only uses verified Cornell Law sources
- **Real-time Updates**: Automatic content monitoring and refresh
- **Citation Transparency**: All responses include source attributions  
- **Semantic Search**: Advanced vector similarity for relevant results
- **User-Friendly Interface**: Suggested queries and intuitive chat design
- **Comprehensive Coverage**: Complete USC Title 17 Chapters 10 & 11

## Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── api/chat/          # Chat API endpoint  
│   └── page.tsx           # Main chat interface
├── lib/
│   ├── actions/           # Database operations
│   ├── db/                # Database schema and config
│   ├── agent.ts           # RAG AI agent
│   ├── embeddings.ts      # Embedding utilities
│   ├── scraper.ts         # Web scraping logic
│   ├── legal-processor.ts # Legal text processing
│   └── change-detector.ts # Content change detection
├── scripts/
│   ├── monitor.ts         # Monitoring and update commands
│   ├── check-db.ts        # Database status checker
│   └── create-embeddings.ts # Manual embedding creation
└── components/ui/         # Reusable UI components
```

## Troubleshooting

### Common Issues

**Database Connection Errors**
- Verify `DATABASE_URL` in `.env`
- Ensure PostgreSQL is running and accessible

**OpenAI API Errors**  
- Check `OPENAI_API_KEY` is valid and has credits
- Verify API key has embedding permissions

**Scraping Failures**
- Cornell Law site may be temporarily unavailable
- Run `npm run scrape:preview` to test connectivity

**No Search Results**
- Check if embeddings exist: `npm run db:check-status`
- Recreate embeddings: `npm run db:create-embeddings`

### Development Commands

```bash
# Database management
npm run db:generate     # Create new migrations
npm run db:migrate      # Apply migrations  
npm run db:push        # Push schema changes
npm run db:studio      # Open database GUI

# Content management  
npm run scrape:populate    # Full scraping pipeline
npm run scrape:preview     # Preview changes only
npm run db:create-embeddings # Create missing embeddings
npm run db:check-status    # Database status overview
```

## License

This project is based on the Vercel AI SDK RAG starter and adapted for legal document processing and Cornell Law content integration.
