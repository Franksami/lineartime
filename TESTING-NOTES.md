# Testing Notes for Linear Calendar AI Integration

## ✅ CommandBar Integration Status

### What's Working:
1. **CommandBar Component Added** ✅
   - Component is now rendered in `app/page.tsx`
   - Keyboard shortcut **Cmd+K** or **Ctrl+K** opens the command bar
   - Event handlers are wired up for create, update, delete, and search

2. **NLP Parser Integration** ✅  
   - EventParser from `lib/nlp/EventParser.ts` is integrated
   - Uses chrono-node for date/time parsing
   - Supports natural language input like:
     - "Meeting tomorrow at 3pm"
     - "Lunch with Sarah at noon at Starbucks"
     - "Doctor appointment next Friday 3pm"
     - "Team meeting every Monday at 10am"

3. **Test Page Created** ✅
   - Test page available at: http://localhost:3000/test-commandbar
   - Allows testing NLP parsing with various examples
   - Shows parsed results including title, time, location, attendees, category, and confidence

### Manual Testing Instructions:

1. **Test CommandBar Opening:**
   - Navigate to http://localhost:3000
   - Press **Cmd+K** (Mac) or **Ctrl+K** (Windows/Linux)
   - CommandBar dialog should appear

2. **Test Natural Language Input:**
   - Type: "Meeting tomorrow at 3pm"
   - Press Enter
   - Should create an event for tomorrow at 3pm

3. **Test Search:**
   - Type: "find meetings this week"
   - Should search and filter existing events

4. **Test Delete:**
   - Type: "delete birthday party"
   - Should find and offer to delete matching events

## ⚠️ AssistantPanel Configuration Required

### Current Status:
- AssistantPanel component IS rendered (bottom-right floating button with Bot icon)
- Backend API endpoint exists at `/api/ai/chat/route.ts`
- Uses OpenAI GPT-4o-mini model with Vercel AI SDK

### Configuration Needed:
1. **Add OpenAI API Key:**
   ```bash
   # In .env.local file, add:
   OPENAI_API_KEY=your-openai-api-key-here
   ```

2. **Get API Key:**
   - Go to https://platform.openai.com/api-keys
   - Create a new API key
   - Add to .env.local file

3. **Restart Dev Server:**
   ```bash
   # After adding API key:
   pnpm dev
   ```

### AssistantPanel Features (Once Configured):
- Scheduling suggestions ("Find free time tomorrow")
- Conflict detection ("What conflicts do I have today?")
- Calendar summaries ("Summarize this week")
- Smart scheduling with CSP solver
- Focus time protection

## 🚀 Next Steps

### Immediate Tasks:
1. ✅ CommandBar integration - COMPLETE
2. ⚠️ Configure OpenAI API key for AssistantPanel
3. 📝 Create SchedulingSuggestions component
4. 🔧 Add "Smart Schedule" button to EventModal
5. 🎯 Test with 10,000+ events for performance

### Performance Testing Plan:
```javascript
// Generate test events
const generateTestEvents = (count) => {
  const events = [];
  const categories = ['work', 'personal', 'effort', 'note'];
  
  for (let i = 0; i < count; i++) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 365));
    
    events.push({
      id: `test-${i}`,
      title: `Event ${i}`,
      startDate,
      endDate: new Date(startDate.getTime() + 3600000), // 1 hour
      category: categories[Math.floor(Math.random() * categories.length)]
    });
  }
  
  return events;
};

// Test with 10,000 events
const testEvents = generateTestEvents(10000);
```

## 📊 Metrics to Monitor

1. **CommandBar Response Time:**
   - Target: <100ms for parsing
   - Current: Testing needed

2. **Calendar Performance:**
   - Target: 60fps with 10,000+ events
   - Current: HybridCalendar with virtual scrolling implemented

3. **AI Response Time:**
   - Target: <2s for suggestions
   - Current: Requires API key to test

## 🐛 Known Issues

1. **OpenAI API Key Missing:**
   - AssistantPanel won't function without API key
   - Need to add OPENAI_API_KEY to .env.local

2. **Search Functionality:**
   - CommandBar search is logged but not yet highlighting/filtering events
   - TODO comment in code at line 283 of page.tsx

3. **Mobile CommandBar:**
   - May need optimization for mobile viewport
   - Consider drawer-style UI for mobile

## ✨ Successfully Implemented Features

1. **HybridCalendar** - High-performance calendar with Canvas/DOM switching
2. **VirtualCalendar** - Virtual scrolling for large datasets
3. **IntervalTree** - O(log n) conflict detection
4. **EventParser** - Natural language processing with chrono-node
5. **SchedulingEngine** - CSP solver for smart scheduling
6. **CommandBar** - Natural language command interface

---

Last Updated: August 22, 2025