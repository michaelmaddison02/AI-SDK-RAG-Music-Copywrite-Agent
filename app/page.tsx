'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, there was an error processing your message.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-6 max-w-4xl mx-auto">
      <div className="w-full mb-8">
        <h1 className="text-3xl font-bold text-center mb-2">Music Copyright AI Assistant</h1>
        <p className="text-center text-gray-600 dark:text-gray-400">
          Get answers about digital audio recording laws and copyright regulations based on Cornell Law School's U.S. Code database
        </p>
      </div>

      <div className="flex-1 w-full bg-white dark:bg-gray-900 rounded-lg border shadow-lg flex flex-col">
        <div className="flex-1 p-4 overflow-y-auto space-y-4 min-h-[400px]">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center space-y-6 mt-8">
              <div className="text-center text-gray-500 dark:text-gray-400">
                Ask questions about digital audio recording laws, copyright regulations, and music industry legal requirements
              </div>
              
              <div className="w-full max-w-2xl space-y-3">
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4">Try these example questions:</p>
                <div className="flex flex-col space-y-2">
                  <Button
                    variant="outline"
                    className="w-full text-left justify-start h-auto p-4 text-wrap"
                    onClick={() => {
                      const prompt = "What are digital audio recording devices?";
                      setInput('');
                      setMessages(prev => [...prev, { role: 'user', content: prompt }]);
                      setIsLoading(true);

                      fetch('/api/chat', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ message: prompt }),
                      })
                      .then(res => res.json())
                      .then(data => {
                        setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
                      })
                      .catch(error => {
                        console.error('Error:', error);
                        setMessages(prev => [...prev, { 
                          role: 'assistant', 
                          content: 'Sorry, there was an error processing your message.' 
                        }]);
                      })
                      .finally(() => setIsLoading(false));
                    }}
                  >
                    What are digital audio recording devices?
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full text-left justify-start h-auto p-4 text-wrap"
                    onClick={() => {
                      const prompt = "What are the royalty payment requirements for digital audio recordings?";
                      setInput('');
                      setMessages(prev => [...prev, { role: 'user', content: prompt }]);
                      setIsLoading(true);

                      fetch('/api/chat', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ message: prompt }),
                      })
                      .then(res => res.json())
                      .then(data => {
                        setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
                      })
                      .catch(error => {
                        console.error('Error:', error);
                        setMessages(prev => [...prev, { 
                          role: 'assistant', 
                          content: 'Sorry, there was an error processing your message.' 
                        }]);
                      })
                      .finally(() => setIsLoading(false));
                    }}
                  >
                    What are the royalty payment requirements for digital audio recordings?
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full text-left justify-start h-auto p-4 text-wrap"
                    onClick={() => {
                      const prompt = "What civil remedies are available for copyright infringement?";
                      setInput('');
                      setMessages(prev => [...prev, { role: 'user', content: prompt }]);
                      setIsLoading(true);

                      fetch('/api/chat', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ message: prompt }),
                      })
                      .then(res => res.json())
                      .then(data => {
                        setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
                      })
                      .catch(error => {
                        console.error('Error:', error);
                        setMessages(prev => [...prev, { 
                          role: 'assistant', 
                          content: 'Sorry, there was an error processing your message.' 
                        }]);
                      })
                      .finally(() => setIsLoading(false));
                    }}
                  >
                    What civil remedies are available for copyright infringement?
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 dark:border-gray-100"></div>
                  <span className="text-gray-600 dark:text-gray-400">Thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t p-4">
          <div className="flex space-x-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask a question or provide information to store..."
              className="flex-1"
              disabled={isLoading}
            />
            <Button onClick={sendMessage} disabled={isLoading || !input.trim()}>
              Send
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
