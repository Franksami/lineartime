'use client';

import type React from 'react';

import { Button } from '@/components/ui/button';
import type { CalendarEvent } from '@/components/ui/calendar';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { AICalendarService } from '@/lib/ai-services';
import { Bot, Send, Sparkles, User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIChatInterfaceProps {
  events: CalendarEvent[];
  onEventCreate?: (event: CalendarEvent) => void;
  onEventUpdate?: (eventId: string, updates: Partial<CalendarEvent>) => void;
}

export function AIChatInterface({ events, onEventCreate, onEventUpdate }: AIChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content:
        "Hi! I'm your AI calendar assistant. I can help you create events, optimize your schedule, and answer questions about your calendar. Try saying something like 'Schedule a team meeting next Tuesday at 2pm' or 'What's my schedule looking like this week?'",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      type: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // First, try to parse as an event creation request
      const parsedEvent = await AICalendarService.parseEventFromText(input.trim());

      if (parsedEvent && onEventCreate) {
        onEventCreate(parsedEvent);

        const successMessage: Message = {
          id: crypto.randomUUID(),
          type: 'assistant',
          content: `Great! I've created the event "${parsedEvent.title}" for ${parsedEvent.startDate.toLocaleDateString()}. You can see it on your calendar now.`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, successMessage]);
      } else {
        // If not an event creation, use general chat
        const response = await AICalendarService.chatWithAssistant(input.trim(), events);

        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          type: 'assistant',
          content: response,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('[v0] Chat error:', error);
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        type: 'assistant',
        content: "I'm sorry, I encountered an error processing your request. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card className="flex flex-col h-96 bg-white border border-border">
      {/* Header */}
      <div className="flex items-center gap-2 p-4 border-b border-border bg-muted">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-100 /* TODO: Use semantic token */ rounded-full">
            <Sparkles className="w-4 h-4 text-blue-600 /* TODO: Use semantic token */" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">AI Calendar Assistant</h3>
            <p className="text-xs text-gray-500 /* TODO: Use semantic token */">Powered by Grok & Groq</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.type === 'assistant' && (
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 /* TODO: Use semantic token */ rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-blue-600 /* TODO: Use semantic token */" />
              </div>
            )}
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.type === 'user' ? 'bg-blue-600 /* TODO: Use semantic token */ text-white' : 'bg-muted text-foreground'
              }`}
            >
              <p className="text-sm">{message.content}</p>
              <p
                className={`text-xs mt-1 ${message.type === 'user' ? 'text-blue-100 /* TODO: Use semantic token */' : 'text-gray-500 /* TODO: Use semantic token */'}`}
              >
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            {message.type === 'user' && (
              <div className="flex-shrink-0 w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-gray-600 /* TODO: Use semantic token */" />
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 /* TODO: Use semantic token */ rounded-full flex items-center justify-center">
              <Bot className="w-4 h-4 text-blue-600 /* TODO: Use semantic token */" />
            </div>
            <div className="bg-muted text-foreground px-4 py-2 rounded-lg">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-gray-400 /* TODO: Use semantic token */ rounded-full animate-bounce" />
                <div
                  className="w-2 h-2 bg-gray-400 /* TODO: Use semantic token */ rounded-full animate-bounce"
                  style={{ animationDelay: '0.1s' }}
                />
                <div
                  className="w-2 h-2 bg-gray-400 /* TODO: Use semantic token */ rounded-full animate-bounce"
                  style={{ animationDelay: '0.2s' }}
                />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about your calendar..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            size="sm"
            className="px-3"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
