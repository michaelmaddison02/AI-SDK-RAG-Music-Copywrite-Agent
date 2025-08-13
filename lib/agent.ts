import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { findSimilarResources } from './actions/resources';

export async function runAgent(userMessage: string) {
  try {
    // First, let's test basic functionality without tools
    console.log('Testing basic agent functionality...');
    
    // Search the knowledge base directly
    const searchResults = await findSimilarResources(userMessage, 5);
    console.log('Search results:', searchResults);
    
    let contextText = '';
    if (searchResults && !('error' in searchResults) && searchResults.length > 0) {
      contextText = searchResults
        .map((result, index) => `[${index + 1}] ${result.content}`)
        .join('\n\n');
    }
    
    const systemPrompt = `You are a RAG AI assistant that answers questions based only on the provided legal context.

CONTEXT FROM LEGAL DATABASE:
${contextText || 'No relevant information found in the legal database.'}

RULES:
- Only answer based on the context provided above
- If no context is provided, state that you don't have information on that topic
- Reference the legal sections when answering
- Be precise and cite the relevant legal text`;

    const result = await generateText({
      model: openai('gpt-4o-mini'),
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userMessage,
        },
      ],
    });

    return result;
  } catch (error) {
    console.error('Agent error:', error);
    throw new Error('Failed to process request');
  }
}