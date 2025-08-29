/**
 * MailboxView - Email triage with entity conversion
 * Research validation: Email-to-entity conversion patterns for productivity workflows
 */

'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Mail,
  Search,
  Archive,
  Trash2,
  Calendar,
  CheckSquare,
  FileText,
  User,
  Clock,
  ArrowRight,
  Star,
  Paperclip,
} from 'lucide-react';
import { ViewScaffold, useViewScaffold } from '@/components/_deprecated/ViewScaffold';
import { useFeatureFlag, COMMAND_WORKSPACE_FLAGS } from '@/lib/features/useFeatureFlags';
import { cn } from '@/lib/utils';

/**
 * Email thread interface for triage workflow
 */
interface EmailThread {
  id: string;
  subject: string;
  sender: {
    name: string;
    email: string;
    avatar?: string;
  };
  preview: string;
  fullContent: string;
  receivedAt: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'inbox' | 'converted' | 'archived' | 'deleted';
  hasAttachments: boolean;
  isRead: boolean;
  isStarred: boolean;

  // Conversion tracking
  convertedTo?: Array<{
    type: 'event' | 'task' | 'note';
    id: string;
    title: string;
    createdAt: string;
  }>;

  // AI analysis (for Phase 4)
  aiSuggestions?: Array<{
    type: 'event' | 'task' | 'note';
    title: string;
    confidence: number;
    reasoning: string;
  }>;
}

/**
 * Sample email threads for development
 */
const SAMPLE_EMAIL_THREADS: EmailThread[] = [
  {
    id: 'email-1',
    subject: 'AI Integration Planning Meeting',
    sender: {
      name: 'Dan Rodriguez',
      email: 'dan@company.com',
    },
    preview:
      'Hi there! I wanted to schedule our AI integration planning meeting. How about Tuesday at 3pm? We should cover...',
    fullContent: `Hi there!

I wanted to schedule our AI integration planning meeting for next week. How about Tuesday at 3pm? 

We should cover:
- Constraint solving algorithms
- Real-time conflict detection
- User experience patterns
- Performance optimization

Let me know if that works for you!

Best,
Dan`,
    receivedAt: '2025-08-28T10:30:00Z',
    priority: 'high',
    status: 'inbox',
    hasAttachments: false,
    isRead: false,
    isStarred: true,
    aiSuggestions: [
      {
        type: 'event',
        title: 'AI Integration Planning Meeting with Dan',
        confidence: 0.92,
        reasoning: 'Email mentions specific meeting time and agenda',
      },
    ],
  },
  {
    id: 'email-2',
    subject: 'Command Workspace feedback and next steps',
    sender: {
      name: 'Sarah Chen',
      email: 'sarah@design.com',
    },
    preview:
      'The Command Workspace prototype looks great! I have some feedback on the three-pane layout...',
    fullContent: `The Command Workspace prototype looks great! I have some feedback on the three-pane layout and some suggestions for improvements.

Feedback:
- Love the keyboard-first approach
- Three-pane layout works well on desktop
- Command palette feels natural

Next steps:
- Test mobile responsiveness
- Add more keyboard shortcuts  
- Consider user onboarding flow

Can we schedule a review meeting this week?`,
    receivedAt: '2025-08-28T08:15:00Z',
    priority: 'medium',
    status: 'inbox',
    hasAttachments: true,
    isRead: true,
    isStarred: false,
    aiSuggestions: [
      {
        type: 'task',
        title: 'Address Command Workspace feedback from Sarah',
        confidence: 0.85,
        reasoning: 'Email contains actionable feedback items',
      },
      {
        type: 'event',
        title: 'Command Workspace review meeting',
        confidence: 0.78,
        reasoning: 'Sender requests to schedule a review meeting',
      },
    ],
  },
];

/**
 * Mailbox View state management
 */
function useMailboxView() {
  const [threads, setThreads] = useState<EmailThread[]>(SAMPLE_EMAIL_THREADS);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(
    SAMPLE_EMAIL_THREADS[0]?.id || null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<EmailThread['status'] | 'all'>('inbox');

  const { measureRender, announceViewChange } = useViewScaffold('Mailbox');

  // Filter threads
  const filteredThreads = useMemo(() => {
    return threads.filter((thread) => {
      const matchesSearch =
        !searchQuery ||
        thread.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        thread.sender.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        thread.preview.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || thread.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [threads, searchQuery, statusFilter]);

  // Get active thread
  const activeThread = useMemo(
    () => threads.find((thread) => thread.id === activeThreadId),
    [threads, activeThreadId]
  );

  // Convert email to entity (research: Email-to-entity conversion patterns)
  const convertToEntity = (thread: EmailThread, type: 'event' | 'task' | 'note') => {
    console.log(`Converting email "${thread.subject}" to ${type}`);

    // TODO: Phase 4 - AI Integration for smart conversion
    const conversion = {
      type,
      id: `${type}-${Date.now()}`,
      title: type === 'event' ? `Meeting: ${thread.subject}` : thread.subject,
      createdAt: new Date().toISOString(),
    };

    // Update thread with conversion tracking
    setThreads((prev) =>
      prev.map((t) =>
        t.id === thread.id
          ? {
              ...t,
              status: 'converted',
              convertedTo: [...(t.convertedTo || []), conversion],
            }
          : t
      )
    );

    // TODO: Create actual entity in respective system
    return conversion;
  };

  return {
    threads: filteredThreads,
    activeThread,
    activeThreadId,
    setActiveThreadId,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    convertToEntity,
    measureRender,
  };
}

/**
 * Email Thread List (left panel)
 */
function EmailThreadList({
  threads,
  activeThreadId,
  onSelectThread,
  statusFilter,
  onStatusFilterChange,
}: {
  threads: EmailThread[];
  activeThreadId: string | null;
  onSelectThread: (threadId: string) => void;
  statusFilter: EmailThread['status'] | 'all';
  onStatusFilterChange: (status: EmailThread['status'] | 'all') => void;
}) {
  const statusCounts = useMemo(() => {
    return threads.reduce(
      (acc, thread) => {
        acc[thread.status] = (acc[thread.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
  }, [threads]);

  return (
    <div className="w-80 border-r border-border bg-muted/20 flex flex-col">
      {/* Status filter tabs */}
      <div className="p-4 border-b border-border">
        <div className="grid grid-cols-2 gap-1 bg-muted/50 rounded-lg p-1">
          {(['inbox', 'converted', 'archived'] as const).map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onStatusFilterChange(status)}
              className="h-7 px-2 text-xs"
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              {statusCounts[status] && (
                <Badge variant="outline" className="ml-1 text-xs">
                  {statusCounts[status]}
                </Badge>
              )}
            </Button>
          ))}
        </div>
      </div>

      {/* Thread list */}
      <div className="flex-1 overflow-auto">
        <div className="p-2 space-y-2">
          {threads.map((thread) => (
            <Card
              key={thread.id}
              className={cn(
                'cursor-pointer transition-all duration-200 hover:shadow-sm',
                activeThreadId === thread.id && 'ring-2 ring-primary bg-primary/5',
                !thread.isRead && 'border-l-4 border-l-primary'
              )}
              onClick={() => onSelectThread(thread.id)}
            >
              <CardContent className="p-3">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h4
                      className={cn(
                        'text-sm leading-tight line-clamp-2',
                        thread.isRead ? 'font-normal' : 'font-semibold'
                      )}
                    >
                      {thread.subject}
                    </h4>

                    <div className="flex items-center gap-1">
                      {thread.isStarred && <Star className="h-3 w-3 fill-primary text-primary" />}
                      {thread.hasAttachments && (
                        <Paperclip className="h-3 w-3 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium">{thread.sender.name}</span>
                    <span className="mx-1">•</span>
                    <span>{new Date(thread.receivedAt).toLocaleDateString()}</span>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2">{thread.preview}</p>

                  <div className="flex items-center justify-between">
                    <Badge
                      variant={thread.priority === 'urgent' ? 'destructive' : 'outline'}
                      className="text-xs"
                    >
                      {thread.priority}
                    </Badge>

                    {thread.convertedTo && thread.convertedTo.length > 0 && (
                      <div className="text-xs text-primary">
                        Converted ({thread.convertedTo.length})
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Email Thread Viewer (right panel)
 */
function EmailThreadViewer({
  thread,
  onConvertToEntity,
}: {
  thread: EmailThread | null;
  onConvertToEntity: (type: 'event' | 'task' | 'note') => void;
}) {
  if (!thread) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Mail className="h-12 w-12 text-muted-foreground mx-auto" />
          <h3 className="text-lg font-semibold">No Email Selected</h3>
          <p className="text-muted-foreground">Select an email to view and triage</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Email header */}
      <div className="p-4 border-b border-border bg-background">
        <div className="space-y-3">
          <h2 className="text-lg font-semibold leading-tight">{thread.subject}</h2>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-medium">{thread.sender.name}</div>
                  <div className="text-xs text-muted-foreground">{thread.sender.email}</div>
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                <Clock className="h-3 w-3 inline mr-1" />
                {new Date(thread.receivedAt).toLocaleString()}
              </div>

              <Badge variant="outline" className="text-xs">
                {thread.priority}
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Star className={cn('h-4 w-4', thread.isStarred && 'fill-primary text-primary')} />
              </Button>

              <Button variant="outline" size="sm">
                <Archive className="h-4 w-4" />
              </Button>

              <Button variant="outline" size="sm">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Email content */}
      <div className="flex-1 overflow-auto">
        <div className="p-4">
          <div className="whitespace-pre-wrap text-sm leading-relaxed">{thread.fullContent}</div>
        </div>
      </div>

      {/* Conversion actions */}
      <div className="border-t border-border p-4 bg-muted/20">
        <div className="space-y-3">
          <div className="text-sm font-medium">Convert to:</div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onConvertToEntity('event')}
              className="flex-1"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Event
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onConvertToEntity('task')}
              className="flex-1"
            >
              <CheckSquare className="h-4 w-4 mr-2" />
              Task
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onConvertToEntity('note')}
              className="flex-1"
            >
              <FileText className="h-4 w-4 mr-2" />
              Note
            </Button>
          </div>

          {/* AI suggestions (Phase 4) */}
          {thread.aiSuggestions && thread.aiSuggestions.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground">AI Suggestions:</div>
              {thread.aiSuggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-primary/5 rounded border"
                >
                  <div className="flex-1">
                    <div className="text-sm font-medium">{suggestion.title}</div>
                    <div className="text-xs text-muted-foreground">{suggestion.reasoning}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {(suggestion.confidence * 100).toFixed(0)}%
                    </Badge>
                    <Button size="sm" variant="outline">
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Conversion history */}
          {thread.convertedTo && thread.convertedTo.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground">Already Converted:</div>
              {thread.convertedTo.map((conversion) => (
                <div key={conversion.id} className="flex items-center gap-2 text-sm">
                  {conversion.type === 'event' && <Calendar className="h-4 w-4 text-primary" />}
                  {conversion.type === 'task' && <CheckSquare className="h-4 w-4 text-primary" />}
                  {conversion.type === 'note' && <FileText className="h-4 w-4 text-primary" />}

                  <span className="flex-1">{conversion.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(conversion.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Mailbox View Header
 */
function MailboxViewHeader({
  searchQuery,
  onSearchChange,
}: {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}) {
  return (
    <div className="flex items-center justify-between p-4 border-b border-border">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold">Mailbox</h2>
        <Badge variant="secondary" className="text-xs">
          Triage + Conversion
        </Badge>
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search emails..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-64 pl-10 h-8"
          />
        </div>

        <Button variant="outline" size="sm">
          <Mail className="h-4 w-4 mr-2" />
          Sync
        </Button>
      </div>
    </div>
  );
}

/**
 * Main Mailbox View Component
 */
export function MailboxView() {
  const {
    threads,
    activeThread,
    activeThreadId,
    setActiveThreadId,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    convertToEntity,
  } = useMailboxView();

  const mailboxViewEnabled = useFeatureFlag(COMMAND_WORKSPACE_FLAGS.VIEWS_MAILBOX);

  if (!mailboxViewEnabled) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <Mail className="h-12 w-12 text-muted-foreground mx-auto" />
          <h3 className="text-lg font-semibold">Mailbox View</h3>
          <p className="text-muted-foreground">Feature flag disabled</p>
          <Badge variant="outline">views.mailbox</Badge>
        </div>
      </div>
    );
  }

  return (
    <ViewScaffold
      header={<MailboxViewHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} />}
      content={
        <div className="flex h-full">
          <EmailThreadList
            threads={threads}
            activeThreadId={activeThreadId}
            onSelectThread={setActiveThreadId}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
          />

          <EmailThreadViewer
            thread={activeThread}
            onConvertToEntity={(type) => {
              if (activeThread) {
                convertToEntity(activeThread, type);
              }
            }}
          />
        </div>
      }
      contextPanels={['ai', 'details']}
      scrollable={false} // Custom scroll in viewer
    />
  );
}
