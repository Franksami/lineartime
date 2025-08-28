/**
 * NotesView - Markdown editing with entity linking
 * Research validation: Obsidian patterns for note-taking and backlinks
 */

'use client'

import { useState, useMemo, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { 
  FileText,
  Plus,
  Search,
  Link,
  Hash,
  Calendar,
  CheckSquare,
  Mail,
  ExternalLink,
  Edit,
  Eye
} from 'lucide-react'
import { ViewScaffold, useViewScaffold } from '@/components/shell/TabWorkspace/ViewScaffold'
import { useFeatureFlag, COMMAND_WORKSPACE_FLAGS } from '@/lib/features/useFeatureFlags'
import { cn } from '@/lib/utils'

/**
 * Note interface with entity linking (research: Obsidian note structure)
 */
interface Note {
  id: string
  title: string
  content: string
  tags: string[]
  links: Array<{
    id: string
    type: 'event' | 'task' | 'note' | 'contact'
    title: string
    createdAt: string
  }>
  backlinks: Array<{
    noteId: string
    noteTitle: string
    context: string // Surrounding text where link appears
  }>
  createdAt: string
  updatedAt: string
  wordCount: number
}

/**
 * Sample notes for development (research patterns from Obsidian)
 */
const SAMPLE_NOTES: Note[] = [
  {
    id: '1',
    title: 'Command Workspace Implementation Notes',
    content: `# Command Workspace Implementation

## Research Validation Complete
- ✅ Obsidian workspace patterns validated
- ✅ Schedule X keyboard navigation confirmed  
- ✅ Timefold AI constraint solving researched
- ✅ Rasa conversation management patterns

## Implementation Progress
### Phase 1: Shell Architecture ✅
Three-pane layout with react-resizable-panels working perfectly.

### Phase 2: Command System ✅  
Command palette with fuzzysort + Omnibox with Vercel AI SDK.

### Phase 3: Views Implementation 🔄
Currently implementing WeekView and PlannerView.

## Entity Links
- [[Meeting: AI Integration Planning]] - Phase 4 planning session
- [[Task: Implement conflict resolution]] - High priority development task
- [[Project: Command Workspace]] - Main project tracking

## Next Steps
1. Complete views implementation
2. Integrate AI agents with MCP tools
3. Add computer vision privacy features
4. Performance optimization and mobile support`,
    tags: ['development', 'research', 'command-workspace'],
    links: [
      {
        id: 'meeting-1',
        type: 'event',
        title: 'AI Integration Planning',
        createdAt: '2025-08-28T14:00:00Z'
      },
      {
        id: 'task-1', 
        type: 'task',
        title: 'Implement conflict resolution',
        createdAt: '2025-08-28T10:00:00Z'
      }
    ],
    backlinks: [],
    createdAt: '2025-08-28T09:00:00Z',
    updatedAt: '2025-08-28T16:30:00Z',
    wordCount: 180
  },
  {
    id: '2',
    title: 'Meeting Notes: Research Validation',
    content: `# Research Validation Meeting
*August 27, 2025*

## Attendees
- Development Team
- Research Lead

## Key Findings
Our comprehensive research validated all 7 workspace patterns:

1. **Obsidian Workspaces** - Multi-pane architecture ✅
2. **Schedule X Keyboard** - Navigation patterns ✅  
3. **Timefold AI** - Constraint solving ✅
4. **Rasa Conversation** - AI integration ✅
5. **Manifestly Workflows** - Task automation ✅
6. **ImageSorcery MCP** - Local computer vision ✅

## Decisions Made
- ✅ Transform existing codebase (not greenfield)
- ✅ Preserve calendar integration platform  
- ✅ Implement Command Workspace architecture
- ✅ Use research-validated library stack

## Action Items
- [ ] Complete Phase 3 views implementation
- [ ] Begin AI agent integration
- [ ] Plan computer vision privacy features

## Links
- [[Note: Command Workspace Implementation Notes]]
- [[Project: LinearTime Transformation]]`,
    tags: ['meeting', 'research', 'decisions'],
    links: [
      {
        id: 'note-1',
        type: 'note', 
        title: 'Command Workspace Implementation Notes',
        createdAt: '2025-08-28T09:00:00Z'
      }
    ],
    backlinks: [
      {
        noteId: '1',
        noteTitle: 'Command Workspace Implementation Notes',
        context: '...planning session with research validation...'
      }
    ],
    createdAt: '2025-08-27T15:00:00Z',
    updatedAt: '2025-08-27T15:30:00Z',
    wordCount: 165
  }
]

/**
 * Notes View state management
 */
function useNotesView() {
  const [notes, setNotes] = useState<Note[]>(SAMPLE_NOTES)
  const [activeNoteId, setActiveNoteId] = useState<string | null>(SAMPLE_NOTES[0]?.id || null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [editMode, setEditMode] = useState(false)
  
  const { measureRender, announceViewChange } = useViewScaffold('Notes')
  
  // Get active note
  const activeNote = useMemo(() => 
    notes.find(note => note.id === activeNoteId),
    [notes, activeNoteId]
  )
  
  // Filter notes by search and tag
  const filteredNotes = useMemo(() => {
    return notes.filter(note => {
      const matchesSearch = !searchQuery ||
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesTag = !selectedTag || note.tags.includes(selectedTag)
      
      return matchesSearch && matchesTag
    })
  }, [notes, searchQuery, selectedTag])
  
  // Get all unique tags
  const allTags = useMemo(() => 
    Array.from(new Set(notes.flatMap(note => note.tags))).sort(),
    [notes]
  )
  
  // Create new note
  const createNote = useCallback(() => {
    const newNote: Note = {
      id: `note-${Date.now()}`,
      title: 'Untitled Note',
      content: '# Untitled Note\n\nStart writing...',
      tags: [],
      links: [],
      backlinks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      wordCount: 3
    }
    
    setNotes(prev => [newNote, ...prev])
    setActiveNoteId(newNote.id)
    setEditMode(true)
  }, [])
  
  // Update note content
  const updateNote = useCallback((noteId: string, updates: Partial<Note>) => {
    setNotes(prev => prev.map(note => 
      note.id === noteId 
        ? { 
            ...note, 
            ...updates, 
            updatedAt: new Date().toISOString(),
            wordCount: updates.content ? updates.content.split(/\s+/).length : note.wordCount
          }
        : note
    ))
  }, [])
  
  return {
    notes: filteredNotes,
    activeNote,
    activeNoteId,
    setActiveNoteId,
    searchQuery,
    setSearchQuery,
    selectedTag,
    setSelectedTag,
    allTags,
    editMode,
    setEditMode,
    createNote,
    updateNote,
    measureRender
  }
}

/**
 * Notes List Component (left panel)
 */
function NotesList({
  notes,
  activeNoteId, 
  onSelectNote,
  searchQuery,
  onSearchChange,
  selectedTag,
  onTagSelect,
  allTags,
  onCreateNote
}: {
  notes: Note[]
  activeNoteId: string | null
  onSelectNote: (noteId: string) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  selectedTag: string | null
  onTagSelect: (tag: string | null) => void
  allTags: string[]
  onCreateNote: () => void
}) {
  return (
    <div className="w-80 border-r border-border bg-muted/20 flex flex-col">
      {/* Notes header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Notes</h3>
          <Button size="sm" onClick={onCreateNote}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-8"
          />
        </div>
        
        {/* Tag filter */}
        <div className="flex flex-wrap gap-1">
          <Button
            variant={selectedTag === null ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => onTagSelect(null)}
            className="h-6 px-2 text-xs"
          >
            All
          </Button>
          {allTags.slice(0, 4).map(tag => (
            <Button
              key={tag}
              variant={selectedTag === tag ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => onTagSelect(tag)}
              className="h-6 px-2 text-xs"
            >
              {tag}
            </Button>
          ))}
        </div>
      </div>
      
      {/* Notes list */}
      <div className="flex-1 overflow-auto">
        <div className="p-2 space-y-2">
          {notes.map((note) => (
            <Card
              key={note.id}
              className={cn(
                'cursor-pointer transition-all duration-200 hover:shadow-sm',
                activeNoteId === note.id && 'ring-2 ring-primary bg-primary/5'
              )}
              onClick={() => onSelectNote(note.id)}
            >
              <CardContent className="p-3">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm leading-tight line-clamp-2">
                    {note.title}
                  </h4>
                  
                  <p className="text-xs text-muted-foreground line-clamp-3">
                    {note.content.replace(/[#*`]/g, '').slice(0, 150)}...
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                      {note.tags.slice(0, 2).map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {note.tags.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{note.tags.length - 2}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {note.links.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Link className="h-3 w-3" />
                          {note.links.length}
                        </div>
                      )}
                      <span>{note.wordCount} words</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * Note Editor Component (right panel)
 */
function NoteEditor({ 
  note,
  editMode,
  onToggleEdit,
  onUpdateNote
}: {
  note: Note | null
  editMode: boolean
  onToggleEdit: () => void
  onUpdateNote: (updates: Partial<Note>) => void
}) {
  const [editContent, setEditContent] = useState(note?.content || '')
  const [editTitle, setEditTitle] = useState(note?.title || '')
  
  // Update local state when note changes
  useState(() => {
    if (note) {
      setEditContent(note.content)
      setEditTitle(note.title)
    }
  })
  
  const handleSave = () => {
    if (!note) return
    
    onUpdateNote({
      title: editTitle,
      content: editContent
    })
    onToggleEdit()
  }
  
  if (!note) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto" />
          <h3 className="text-lg font-semibold">No Note Selected</h3>
          <p className="text-muted-foreground">Select a note to view or edit</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="flex-1 flex flex-col">
      {/* Note header */}
      <div className="p-4 border-b border-border bg-background">
        <div className="flex items-center justify-between">
          {editMode ? (
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="text-lg font-semibold bg-transparent border-none p-0 h-auto"
              placeholder="Note title..."
            />
          ) : (
            <h2 className="text-lg font-semibold">{note.title}</h2>
          )}
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleEdit}
            >
              {editMode ? <Eye className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
              {editMode ? 'Preview' : 'Edit'}
            </Button>
            
            {editMode && (
              <Button size="sm" onClick={handleSave}>
                Save
              </Button>
            )}
          </div>
        </div>
        
        {/* Note metadata */}
        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
          <span>{note.wordCount} words</span>
          <span>Updated {new Date(note.updatedAt).toLocaleDateString()}</span>
          <span>{note.links.length} links</span>
          <span>{note.backlinks.length} backlinks</span>
        </div>
      </div>
      
      {/* Note content */}
      <div className="flex-1 overflow-auto">
        {editMode ? (
          <div className="p-4">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="min-h-[500px] font-mono text-sm resize-none"
              placeholder="Start writing your note..."
            />
          </div>
        ) : (
          <div className="p-4">
            {/* Markdown rendering (simplified for MVP) */}
            <div className="prose prose-sm max-w-none">
              {note.content.split('\n').map((line, index) => {
                if (line.startsWith('# ')) {
                  return <h1 key={index} className="text-xl font-bold mt-6 mb-3">{line.slice(2)}</h1>
                }
                if (line.startsWith('## ')) {
                  return <h2 key={index} className="text-lg font-semibold mt-4 mb-2">{line.slice(3)}</h2>
                }
                if (line.startsWith('### ')) {
                  return <h3 key={index} className="text-base font-medium mt-3 mb-2">{line.slice(4)}</h3>
                }
                if (line.startsWith('- ')) {
                  return (
                    <div key={index} className="flex items-start gap-2 my-1">
                      <span className="text-primary">•</span>
                      <span>{line.slice(2)}</span>
                    </div>
                  )
                }
                if (line.includes('[[') && line.includes(']]')) {
                  // Entity link rendering (research: Obsidian link patterns)
                  const parts = line.split(/(\[\[.*?\]\])/)
                  return (
                    <p key={index} className="my-2">
                      {parts.map((part, partIndex) => {
                        if (part.startsWith('[[') && part.endsWith(']]')) {
                          const linkText = part.slice(2, -2)
                          return (
                            <Button
                              key={partIndex}
                              variant="link"
                              className="p-0 h-auto text-primary underline"
                            >
                              {linkText}
                            </Button>
                          )
                        }
                        return part
                      })}
                    </p>
                  )
                }
                if (line.trim()) {
                  return <p key={index} className="my-2">{line}</p>
                }
                return <br key={index} />
              })}
            </div>
          </div>
        )}
      </div>
      
      {/* Note footer - Links and tags */}
      <div className="border-t border-border p-4 bg-muted/20">
        {/* Tags */}
        {note.tags.length > 0 && (
          <div className="space-y-2 mb-4">
            <div className="text-xs font-medium text-muted-foreground">Tags</div>
            <div className="flex flex-wrap gap-1">
              {note.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  <Hash className="h-3 w-3 mr-1" />
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {/* Entity links */}
        {note.links.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">Linked Entities</div>
            <div className="space-y-1">
              {note.links.map(link => (
                <div key={link.id} className="flex items-center gap-2 text-sm">
                  {link.type === 'event' && <Calendar className="h-4 w-4 text-primary" />}
                  {link.type === 'task' && <CheckSquare className="h-4 w-4 text-primary" />}
                  {link.type === 'note' && <FileText className="h-4 w-4 text-primary" />}
                  {link.type === 'contact' && <Mail className="h-4 w-4 text-primary" />}
                  
                  <Button variant="link" className="p-0 h-auto text-sm">
                    {link.title}
                  </Button>
                  
                  <ExternalLink className="h-3 w-3 text-muted-foreground" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Notes View Header
 */
function NotesViewHeader() {
  return (
    <div className="flex items-center justify-between p-4 border-b border-border">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold">Notes</h2>
        <Badge variant="secondary" className="text-xs">
          Markdown + Entity Linking
        </Badge>
      </div>
      
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm">
          <Link className="h-4 w-4 mr-2" />
          Link Entity
        </Button>
        
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New Note
        </Button>
      </div>
    </div>
  )
}

/**
 * Main Notes View Component  
 */
export function NotesView() {
  const {
    notes,
    activeNote,
    activeNoteId,
    setActiveNoteId,
    searchQuery,
    setSearchQuery,
    selectedTag,
    setSelectedTag,
    allTags,
    editMode,
    setEditMode,
    createNote,
    updateNote
  } = useNotesView()
  
  const notesViewEnabled = useFeatureFlag(COMMAND_WORKSPACE_FLAGS.VIEWS_NOTES)
  
  if (!notesViewEnabled) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto" />
          <h3 className="text-lg font-semibold">Notes View</h3>
          <p className="text-muted-foreground">Feature flag disabled</p>
          <Badge variant="outline">views.notes</Badge>
        </div>
      </div>
    )
  }
  
  return (
    <ViewScaffold
      header={<NotesViewHeader />}
      content={
        <div className="flex h-full">
          <NotesList
            notes={notes}
            activeNoteId={activeNoteId}
            onSelectNote={setActiveNoteId}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedTag={selectedTag}
            onTagSelect={setSelectedTag}
            allTags={allTags}
            onCreateNote={createNote}
          />
          
          <NoteEditor
            note={activeNote}
            editMode={editMode}
            onToggleEdit={() => setEditMode(!editMode)}
            onUpdateNote={(updates) => {
              if (activeNoteId) {
                updateNote(activeNoteId, updates)
              }
            }}
          />
        </div>
      }
      contextPanels={['backlinks', 'details', 'ai']}
      scrollable={false} // Custom scroll in editor
    />
  )
}