"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { type EventCategory, type EventPriority, CATEGORY_COLORS } from "@/components/ui/calendar"
import { Plus, X, Tag, Palette } from "lucide-react"

interface CategoryTagManagerProps {
  selectedCategory: EventCategory
  selectedPriority: EventPriority
  selectedTags: string[]
  availableTags: string[]
  onCategoryChange: (category: EventCategory) => void
  onPriorityChange: (priority: EventPriority) => void
  onTagsChange: (tags: string[]) => void
  onCreateTag: (tag: string) => void
}

export function CategoryTagManager({
  selectedCategory,
  selectedPriority,
  selectedTags,
  availableTags,
  onCategoryChange,
  onPriorityChange,
  onTagsChange,
  onCreateTag,
}: CategoryTagManagerProps) {
  const [newTag, setNewTag] = useState("")

  const categories: { value: EventCategory; label: string; description: string }[] = [
    { value: "personal", label: "Personal", description: "Personal events and activities" },
    { value: "work", label: "Work", description: "Professional meetings and tasks" },
    { value: "effort", label: "Effort", description: "Active projects and initiatives" },
    { value: "note", label: "Note", description: "Important reminders and notes" },
    { value: "meeting", label: "Meeting", description: "Scheduled meetings and calls" },
    { value: "deadline", label: "Deadline", description: "Important deadlines and due dates" },
    { value: "milestone", label: "Milestone", description: "Project milestones and achievements" },
  ]

  const priorities: { value: EventPriority; label: string; description: string }[] = [
    { value: "critical", label: "Critical", description: "Urgent and important" },
    { value: "high", label: "High", description: "Important but not urgent" },
    { value: "medium", label: "Medium", description: "Normal priority" },
    { value: "low", label: "Low", description: "Nice to have" },
    { value: "optional", label: "Optional", description: "Can be skipped if needed" },
  ]

  const handleAddTag = () => {
    if (newTag.trim() && !availableTags.includes(newTag.trim())) {
      onCreateTag(newTag.trim())
      setNewTag("")
    }
  }

  const handleToggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter((t) => t !== tag))
    } else {
      onTagsChange([...selectedTags, tag])
    }
  }

  const handleRemoveTag = (tag: string) => {
    onTagsChange(selectedTags.filter((t) => t !== tag))
  }

  return (
    <div className="space-y-6">
      {/* Category Selection */}
      <div className="space-y-3">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Palette className="w-4 h-4" />
          Category
        </Label>
        <div className="grid grid-cols-2 gap-2">
          {categories.map((category) => (
            <Button
              key={category.value}
              variant={selectedCategory === category.value ? "default" : "outline"}
              size="sm"
              onClick={() => onCategoryChange(category.value)}
              className="justify-start h-auto p-3"
            >
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[category.value] }} />
                <div className="text-left">
                  <div className="font-medium">{category.label}</div>
                  <div className="text-xs text-muted-foreground">{category.description}</div>
                </div>
              </div>
            </Button>
          ))}
        </div>
      </div>

      {/* Priority Selection */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Priority</Label>
        <Select value={selectedPriority} onValueChange={(value: EventPriority) => onPriorityChange(value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {priorities.map((priority) => (
              <SelectItem key={priority.value} value={priority.value}>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      priority.value === "critical"
                        ? "bg-red-500"
                        : priority.value === "high"
                          ? "bg-orange-500"
                          : priority.value === "medium"
                            ? "bg-blue-500"
                            : priority.value === "low"
                              ? "bg-gray-400"
                              : "bg-gray-300"
                    }`}
                  />
                  <span>{priority.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tags Management */}
      <div className="space-y-3">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Tag className="w-4 h-4" />
          Tags
        </Label>

        {/* Selected Tags */}
        {selectedTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedTags.map((tag) => (
              <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                {tag}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 w-4 h-4 hover:bg-transparent"
                  onClick={() => handleRemoveTag(tag)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </Badge>
            ))}
          </div>
        )}

        {/* Add New Tag */}
        <div className="flex gap-2">
          <Input
            placeholder="Add new tag..."
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleAddTag()}
            className="flex-1"
          />
          <Button onClick={handleAddTag} size="sm" disabled={!newTag.trim()}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Available Tags */}
        {availableTags.length > 0 && (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Available Tags</Label>
            <div className="flex flex-wrap gap-2">
              {availableTags
                .filter((tag) => !selectedTags.includes(tag))
                .map((tag) => (
                  <Button
                    key={tag}
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleTag(tag)}
                    className="h-6 px-2 text-xs"
                  >
                    {tag}
                  </Button>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
