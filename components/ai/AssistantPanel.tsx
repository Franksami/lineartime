'use client'

import * as React from 'react'
import { useChat } from '@ai-sdk/react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X, Minimize2, Maximize2, Bot, Calendar as CalendarIcon, Clock as ClockIcon, AlertTriangle, Wand2, Sparkles, Copy, RotateCcw, Share, ThumbsUp, ThumbsDown } from 'lucide-react'
import { api } from '@/convex/_generated/api'
import { useMutation, useQuery } from 'convex/react'
import { useUser } from '@clerk/nextjs'
import { 
  Conversation, 
  ConversationContent, 
  ConversationScrollButton 
} from '@/components/ai-elements/conversation'
import { Message, MessageContent } from '@/components/ai-elements/message'
import { 
  PromptInput,
  PromptInputTextarea,
  PromptInputSubmit,
  PromptInputToolbar,
  PromptInputTools,
  PromptInputButton,
  PromptInputModelSelect,
  PromptInputModelSelectTrigger,
  PromptInputModelSelectContent,
  PromptInputModelSelectItem,
  PromptInputModelSelectValue
} from '@/components/ai-elements/prompt-input'
import { Suggestions, Suggestion } from '@/components/ai-elements/suggestion'
import { Tool, ToolHeader, ToolContent, ToolInput, ToolOutput } from '@/components/ai-elements/tool'
import { Response } from '@/components/ai-elements/response'
import { Loader } from '@/components/ai-elements/loader'
import { Actions, Action } from '@/components/ai-elements/actions'
import { CodeBlock } from '@/components/ai-elements/code-block'
import { InlineCitation } from '@/components/ai-elements/inline-citation'
import { Sources, SourcesContent, SourcesTrigger, Source } from '@/components/ai-elements/source'
import { Image } from '@/components/ai-elements/image'
import { WebPreview } from '@/components/ai-elements/web-preview'
import { Reasoning, ReasoningTrigger, ReasoningContent } from '@/components/ai-elements/reasoning'
// 🚀 NEW: Enhanced AI features from v0
import { NaturalLanguageParser } from './natural-language-parser'
import { AIChatInterface } from './ai-chat-interface'
import { AICalendarService } from '@/lib/ai-services'
import type { Event } from '@/types/calendar'

interface AssistantPanelProps {
  events?: Event[]
  onEventCreate?: (event: Partial<Event>) => void
  onEventUpdate?: (id: string, event: Partial<Event>) => void
  onEventDelete?: (id: string) => void
  className?: string
}

export function AssistantPanel({
  events = [],
  onEventCreate,
  onEventUpdate,
  onEventDelete,
  className
}: AssistantPanelProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [isMinimized, setIsMinimized] = React.useState(false)
  const [input, setInput] = React.useState('')
  const [isMobile, setIsMobile] = React.useState(false)
  const [webSearch, setWebSearch] = React.useState(false)
  const [model, setModel] = React.useState<string>('openai/gpt-4o-mini')
  const [includeCalendar, setIncludeCalendar] = React.useState(true)
  const logEvent = useMutation(api.aiChat.logEvent)
  const { user } = useUser()
  const currentUser = useQuery(api.users.getCurrentUser, {})
  const ensureChat = useMutation(api.aiChat.ensureChat)
  const [chatId, setChatId] = React.useState<string | null>(null)
  const chats = useQuery(api.aiChat.listChatsWithStats as any, currentUser?._id ? { userId: currentUser._id } as any : "skip")
  const createChat = useMutation(api.aiChat.createChat)
  const renameChat = useMutation(api.aiChat.renameChat)
  const deleteChat = useMutation(api.aiChat.deleteChat)

  React.useEffect(() => {
    if (currentUser?._id && !chatId) {
      ensureChat({ userId: currentUser._id }).then(setChatId).catch(() => {})
    }
  }, [currentUser?._id, chatId, ensureChat])

  const chatData = useQuery(api.aiChat.getChat as any, chatId ? { chatId } as any : "skip")
  
  // 🚀 NEW: Enhanced AI features state
  const [activeTab, setActiveTab] = React.useState<'chat' | 'parser' | 'ai-chat'>('chat')
  const [isParsingEvent, setIsParsingEvent] = React.useState(false)
  const [parsedEvent, setParsedEvent] = React.useState<Partial<Event> | null>(null)
  const [aiSuggestions, setAiSuggestions] = React.useState<string[]>([])
  
  // Detect mobile viewport
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  const { messages, sendMessage, status, input: chatInput, setInput: setChatInput, handleSubmit: handleChatSubmit } = useChat({
    api: '/api/ai/chat',
    body: { model, webSearch, events: includeCalendar ? events : [], userId: currentUser?._id || 'anonymous' },
    onFinish() {
      try { localStorage.setItem('lt_last_chat', JSON.stringify(messages)) } catch {}
    },
    initialMessages: (() => {
      if (chatData?.messages?.length) {
        return chatData.messages.map((m: any) => ({ role: m.role, parts: m.parts }))
      }
      try { return JSON.parse(localStorage.getItem('lt_last_chat') || '[]') } catch { return [] }
    })()
  })
  
  // 🚀 NEW: Enhanced AI event parsing
  const handleNaturalLanguageParse = async (text: string) => {
    if (!text.trim()) return
    
    setIsParsingEvent(true)
    try {
      // Use the new AI service for natural language parsing
      const parsedEvent = await AICalendarService.parseEventFromText(text)
      if (parsedEvent && onEventCreate) {
        // Convert the parsed event to your Event type
        const newEvent: Partial<Event> = {
          title: parsedEvent.title,
          startDate: new Date(parsedEvent.startDate),
          endDate: new Date(parsedEvent.endDate),
          category: parsedEvent.category as any,
          description: parsedEvent.description || ''
        }
        
        onEventCreate(newEvent)
        setParsedEvent(newEvent)
        
        // Show success message
        sendMessage({ 
          text: `I've successfully created the event "${parsedEvent.title}" for ${new Date(parsedEvent.startDate).toLocaleDateString()}. You can see it on your calendar now!` 
        })
      }
    } catch (error) {
      console.error('AI parsing error:', error)
      sendMessage({ 
        text: "I'm sorry, I couldn't parse that event. Please try rephrasing it or use a different format." 
      })
    } finally {
      setIsParsingEvent(false)
    }
  }
  
  // 🚀 NEW: AI-powered scheduling suggestions
  const handleAISchedulingSuggestion = async () => {
    try {
      const suggestions = await AICalendarService.getSchedulingSuggestions(events, {
        timeRange: 'week',
        includeConflicts: true,
        optimizeFor: 'productivity'
      })
      
      if (suggestions) {
        sendMessage({ 
          text: `Here are some AI-powered scheduling suggestions for your week:\n\n${suggestions.bestTimeSlots?.map(slot => `• ${slot.date} at ${slot.time} (${Math.round(slot.confidence * 100)}% confidence)`).join('\n') || 'No specific suggestions available.'}` 
        })
      }
    } catch (error) {
      console.error('AI scheduling error:', error)
      sendMessage({ 
        text: "I couldn't generate scheduling suggestions right now. Please try again later." 
      })
    }
  }
  
  const suggestions = React.useMemo(() => {
    if (messages.length === 0) {
      return [
        'Plan my week',
        'Find free time tomorrow', 
        'Resolve scheduling conflicts',
        'Summarize this month',
        // 🚀 NEW: AI-enhanced suggestions
        'AI: Optimize my schedule',
        'AI: Find best meeting times',
        'AI: Resolve conflicts automatically'
      ]
    }
    return []
  }, [messages.length])
  
  const handleSuggestionSelect = (suggestion: string) => {
    setInput(suggestion)
    // Trigger form submission programmatically
    const syntheticEvent = {
      preventDefault: () => {}
    } as React.FormEvent
    handleSubmit(syntheticEvent)
  }

  const handleApplySuggestion = (s: { startISO: string; endISO: string; title?: string }) => {
    if (!onEventCreate) return
    const start = new Date(s.startISO)
    const end = new Date(s.endISO)
    onEventCreate({ title: s.title || 'Scheduled time', startDate: start, endDate: end })
    sendMessage({ text: `Added event on ${start.toLocaleString()} – ${end.toLocaleString()}` })
  }
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || status === 'streaming') return
    sendMessage(
      { text: input },
      { body: { model, webSearch, events: includeCalendar ? events : [] } }
    )
    setInput('')
  }
  
  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed z-40 rounded-full shadow-lg",
          isMobile 
            ? "bottom-20 right-4 h-14 w-14" // Mobile: Higher up to avoid nav
            : "bottom-4 right-4 h-12 w-12"   // Desktop: Standard position
        )}
        size="icon"
      >
        <Bot className="h-5 w-5" />
        <span className="sr-only">Open AI Assistant</span>
      </Button>
    )
  }
  
  return (
    <Card className={cn(
      'fixed z-40 shadow-2xl transition-all duration-300',
      isMobile ? (
        // Mobile: Full screen
        isMinimized 
          ? 'bottom-0 left-0 right-0 h-14'
          : 'inset-0 rounded-none'
      ) : (
        // Desktop: Floating panel
        isMinimized 
          ? 'bottom-4 right-4 w-80 h-14'
          : 'bottom-4 right-4 w-96 h-[600px] max-h-[80vh]'
      ),
      'flex flex-col',
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-sm">AI Assistant</h3>
        </div>
        <div className="flex items-center gap-2">
          {currentUser?._id && (
            <div className="flex items-center gap-2">
              <select
                className="h-7 rounded border bg-background text-xs"
                value={chatId ?? ''}
                onChange={(e) => setChatId(e.target.value || null)}
              >
                <option value="">Current</option>
                {(chats || []).map((c: any) => (
                  <option key={c._id} value={c._id}>
                    {(c.title || 'Chat')} · {c.messageCount} msgs · {new Date(c.updatedAt).toLocaleDateString()}
                  </option>
                ))}
              </select>
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2 text-xs"
                onClick={async () => {
                  if (!currentUser?._id) return
                  const id = await createChat({ userId: currentUser._id })
                  setChatId(id)
                }}
              >
                New Chat
              </Button>
              {chatId && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-xs"
                    onClick={async () => {
                      const title = prompt('Rename chat to:')
                      if (title) await renameChat({ chatId, title })
                    }}
                  >
                    Rename
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-7 px-2 text-xs"
                    onClick={async () => {
                      if (confirm('Delete this chat?')) {
                        await deleteChat({ chatId })
                        setChatId(null)
                      }
                    }}
                  >
                    Delete
                  </Button>
                </>
              )}
            </div>
          )}
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            {isMinimized ? (
              <Maximize2 className="h-3.5 w-3.5" />
            ) : (
              <Minimize2 className="h-3.5 w-3.5" />
            )}
            <span className="sr-only">
              {isMinimized ? 'Maximize' : 'Minimize'}
            </span>
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-3.5 w-3.5" />
            <span className="sr-only">Close</span>
          </Button>
        </div>
      </div>
      
      {/* 🚀 NEW: Tab Navigation */}
      {!isMinimized && (
        <div className="flex border-b bg-muted/30">
          <button
            onClick={() => setActiveTab('chat')}
            className={cn(
              "flex-1 px-3 py-2 text-sm font-medium transition-colors",
              activeTab === 'chat' 
                ? "bg-background text-foreground border-b-2 border-primary" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <div className="flex items-center gap-2 justify-center">
              <Bot className="w-4 h-4" />
              Chat
            </div>
          </button>
          <button
            onClick={() => setActiveTab('parser')}
            className={cn(
              "flex-1 px-3 py-2 text-sm font-medium transition-colors",
              activeTab === 'parser' 
                ? "bg-background text-foreground border-b-2 border-primary" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <div className="flex items-center gap-2 justify-center">
              <Wand2 className="w-4 h-4" />
              Parser
            </div>
          </button>
          <button
            onClick={() => setActiveTab('ai-chat')}
            className={cn(
              "flex-1 px-3 py-2 text-sm font-medium transition-colors",
              activeTab === 'ai-chat' 
                ? "bg-background text-foreground border-b-2 border-primary" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <div className="flex items-center gap-2 justify-center">
              <Sparkles className="w-4 h-4" />
              AI Chat
            </div>
          </button>
        </div>
      )}
      
      {!isMinimized && (
        <>
          {/* Tab Content */}
          <div className="flex-1 overflow-hidden p-3">
            {activeTab === 'chat' && (
              <>
                {/* Original Chat Interface */}
                <Conversation className="h-full">
                  <ConversationContent className="space-y-3">
                    {messages.map((message) => (
                      <div key={message.id}>
                        <Message from={message.role} key={message.id}>
                          <MessageContent>
                            {(message.parts || []).map((part: any, i: number) => {
                              if (part.type === 'text') return <Response key={i}>{part.text}</Response>
                              if (part.type === 'reasoning') return (
                                <Reasoning key={i} isStreaming={status === 'streaming'}>
                                  <ReasoningTrigger />
                                  <ReasoningContent>{part.text}</ReasoningContent>
                                </Reasoning>
                              )
                              if (part.type === 'code') return <CodeBlock key={i} language={part.language || 'tsx'}>{part.text}</CodeBlock>
                              if (part.type === 'citation') return <InlineCitation key={i} index={part.index} href={part.url} />
                              if (part.type === 'source-url') return (
                                <Sources key={i}>
                                  <SourcesTrigger count={1} />
                                  <SourcesContent>
                                    <Source href={part.url} title={part.url} />
                                  </SourcesContent>
                                </Sources>
                              )
                              if (part.type === 'image') return <Image key={i} src={part.url} alt={part.alt || 'Image'} />
                              if (part.type === 'link-preview') return (
                                <WebPreview key={i} defaultUrl={part.url} />
                              )
                              if (part.type === 'tool-invocation') {
                                const output = part.result
                                const isSuggest = part.toolName === 'suggestSchedule'
                                return (
                                  <Tool key={i} defaultOpen>
                                    <ToolHeader type={part.toolName} state={part.state} />
                                    <ToolContent>
                                      <ToolInput input={part.args} />
                                      <ToolOutput
                                        output={
                                          isSuggest && output?.suggestions?.length ? (
                                            <div className="p-2">
                                              {output.suggestions.map((s: any, idx: number) => (
                                                <div key={idx} className="flex items-center justify-between gap-3 border-b last:border-0 p-2">
                                                  <div className="text-sm">
                                                    <div className="font-medium">{s.start} → {s.end}</div>
                                                    <div className="text-muted-foreground text-xs">Score: {Math.round((s.score || 0) * 100) / 100}</div>
                                                    {Array.isArray(s.reasons) && s.reasons.length > 0 && (
                                                      <div className="text-xs mt-1">{s.reasons.join('; ')}</div>
                                                    )}
                                                  </div>
                                                  <Button size="sm" onClick={() => handleApplySuggestion(s)}>
                                                    Apply
                                                  </Button>
                                                </div>
                                              ))}
                                            </div>
                                          ) : output ? (
                                            <pre className="text-xs p-2">{JSON.stringify(output, null, 2)}</pre>
                                          ) : null
                                        }
                                        errorText={part.errorText}
                                      />
                                    </ToolContent>
                                  </Tool>
                                )
                              }
                              return null
                            })}

                            {message.role === 'assistant' && (
                              <Actions className="mt-2">
                                <Action tooltip="Copy response" onClick={() => {
                                  const txt = (message.parts || []).map((p: any) => p.text).filter(Boolean).join('\n')
                                  navigator.clipboard.writeText(txt)
                                  logEvent({ eventType: 'copy' }).catch(() => {})
                                }}>
                                  <Copy className="h-4 w-4" />
                                </Action>
                                <Action tooltip="Regenerate" onClick={() => {
                                  const lastUser = [...messages].reverse().find((m: any) => m.role === 'user')
                                  if (lastUser?.content) sendMessage({ text: lastUser.content })
                                  logEvent({ eventType: 'regenerate' }).catch(() => {})
                                }}>
                                  <RotateCcw className="h-4 w-4" />
                                </Action>
                                <Action tooltip="Share" onClick={() => {
                                  const txt = (message.parts || []).map((p: any) => p.text).filter(Boolean).join('\n')
                                  navigator.share?.({ text: txt }).catch(() => {})
                                  logEvent({ eventType: 'share' }).catch(() => {})
                                }}>
                                  <Share className="h-4 w-4" />
                                </Action>
                                <Action tooltip="Like" onClick={() => { logEvent({ eventType: 'like' }).catch(() => {}) }}>
                                  <ThumbsUp className="h-4 w-4" />
                                </Action>
                                <Action tooltip="Dislike" onClick={() => { logEvent({ eventType: 'dislike' }).catch(() => {}) }}>
                                  <ThumbsDown className="h-4 w-4" />
                                </Action>
                              </Actions>
                            )}
                          </MessageContent>
                        </Message>
                      </div>
                    ))}
                    {status === 'streaming' && <Loader />}
                  </ConversationContent>
                  <ConversationScrollButton />
                </Conversation>
                
                {/* Enhanced Suggestions */}
                {suggestions.length > 0 && (
                  <div className="mt-4 p-3 border-t">
                    <Suggestions>
                      {suggestions.map((suggestion, index) => (
                        <Suggestion
                          key={index}
                          onClick={() => {
                            if (suggestion.startsWith('AI:')) {
                              // Handle AI-enhanced suggestions
                              if (suggestion.includes('Optimize')) {
                                handleAISchedulingSuggestion()
                              } else if (suggestion.includes('Find best meeting times')) {
                                handleAISchedulingSuggestion()
                              } else if (suggestion.includes('Resolve conflicts')) {
                                sendMessage({ text: 'I\'ll analyze your calendar for conflicts and suggest resolutions.' })
                              }
                            } else {
                              handleSuggestionSelect(suggestion)
                            }
                          }}
                          suggestion={suggestion}
                        />
                      ))}
                    </Suggestions>
                  </div>
                )}
              </>
            )}
            
            {activeTab === 'parser' && (
              <div className="h-full">
                <NaturalLanguageParser 
                  onEventParsed={(event) => {
                    if (onEventCreate) {
                      onEventCreate(event as any)
                      setActiveTab('chat')
                      sendMessage({ 
                        text: `I've successfully created the event "${event.title}"! You can see it on your calendar now.` 
                      })
                    }
                  }}
                />
              </div>
            )}
            
            {activeTab === 'ai-chat' && (
              <div className="h-full">
                <AIChatInterface 
                  events={events as any}
                  onEventCreate={(event) => {
                    if (onEventCreate) {
                      onEventCreate(event as any)
                      setActiveTab('chat')
                    }
                  }}
                  onEventUpdate={(eventId, updates) => {
                    if (onEventUpdate) {
                      onEventUpdate(eventId, updates as any)
                    }
                  }}
                />
              </div>
            )}
          </div>
          
          {/* Input */}
          <div className="border-t p-3">
            <PromptInput onSubmit={handleSubmit} className="rounded-lg">
              <PromptInputTextarea
                onChange={(e) => setInput(e.target.value)}
                value={input}
                placeholder="Ask about your schedule..."
                className="min-h-[60px]"
              />
              <PromptInputToolbar className="px-2 pb-2">
                <PromptInputTools>
                  <PromptInputButton
                    variant={webSearch ? 'default' : 'ghost'}
                    onClick={() => setWebSearch(!webSearch)}
                  >
                    <span>Search</span>
                  </PromptInputButton>
                  <PromptInputModelSelect value={model} onValueChange={setModel}>
                    <PromptInputModelSelectTrigger>
                      <PromptInputModelSelectValue />
                    </PromptInputModelSelectTrigger>
                    <PromptInputModelSelectContent>
                      <PromptInputModelSelectItem value="openai/gpt-4o-mini">GPT-4o Mini</PromptInputModelSelectItem>
                      <PromptInputModelSelectItem value="openai/gpt-4o">GPT-4o</PromptInputModelSelectItem>
                    </PromptInputModelSelectContent>
                  </PromptInputModelSelect>
                  <PromptInputButton
                    variant={includeCalendar ? 'default' : 'ghost'}
                    onClick={() => setIncludeCalendar(!includeCalendar)}
                  >
                    <span>Calendar</span>
                  </PromptInputButton>
                </PromptInputTools>
                <PromptInputSubmit 
                  disabled={!input.trim()} 
                  status={status} 
                />
              </PromptInputToolbar>
            </PromptInput>
          </div>
        </>
      )}
    </Card>
  )
}