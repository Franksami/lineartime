# Command Center Calendar Event Management User Guide

## Complete Guide to Creating, Editing, and Managing Events

Version: 1.0.0  
Last Updated: August 23, 2025

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Creating Events](#creating-events)
3. [Editing Events](#editing-events)
4. [Deleting Events](#deleting-events)
5. [Event Categories](#event-categories)
6. [Keyboard Shortcuts](#keyboard-shortcuts)
7. [Mobile Usage](#mobile-usage)
8. [Advanced Features](#advanced-features)
9. [Tips & Best Practices](#tips--best-practices)
10. [Troubleshooting](#troubleshooting)

---

## Quick Start

Command Center Calendar provides multiple intuitive ways to manage your calendar events. Here's what you can do in 30 seconds:

### Your First Event in 3 Steps

1. **Drag** on any empty calendar space
2. **Type** your event title when the input appears
3. **Press Enter** to save

That's it! Your event is created and saved automatically.

### Essential Actions

- **Click an event** to see the floating toolbar for quick edits
- **Double-click an event** to open the full edit dialog
- **Press Delete** while an event is selected to remove it
- **Use Cmd+N** anywhere to create a new event

---

## Creating Events

### Method 1: Drag-to-Create (Recommended)

The fastest way to create events with automatic time selection.

#### Steps:
1. **Position your mouse** over the desired start date/time
2. **Click and drag** to the end date/time
3. **Release the mouse** - a title input appears immediately
4. **Type your event title**
5. **Press Enter** to save or **Escape** to cancel

#### Visual Indicators:
- **Blue preview box** shows the event duration while dragging
- **Snap-to-grid** ensures events align with time slots
- **Real-time feedback** shows exact start/end times

#### Pro Tips:
- Drag horizontally for multi-day events
- Small drags (< 30 pixels) are ignored to prevent accidental creation
- The preview color matches your default category

### Method 2: Keyboard Shortcut

For power users who prefer keyboard navigation.

#### Steps:
1. **Press Cmd+N** (Mac) or **Ctrl+N** (Windows/Linux)
2. **Fill in the event details** in the dialog
3. **Tab through fields** or click to navigate
4. **Press Enter** or click "Save"

### Method 3: Command Bar (Natural Language)

Create events using natural language input.

#### Steps:
1. **Press Cmd+K** to open the command bar
2. **Type naturally**: "Meeting with Sarah tomorrow at 3pm"
3. **Press Enter** to create

#### Supported Patterns:
- "Lunch with John next Tuesday"
- "Team standup every weekday at 9am"
- "Doctor appointment March 15 at 2:30pm"
- "Vacation from Dec 20 to Jan 3"

### Method 4: Quick Add Button

Available in the toolbar for quick access.

#### Steps:
1. **Click the + button** in the top toolbar
2. **Select a date** from the calendar picker
3. **Enter event details**
4. **Click "Create Event"**

---

## Editing Events

### Quick Edit with FloatingToolbar

The FloatingToolbar appears when you click any event, providing instant access to common edits.

#### Available Actions:

##### 1. Inline Title Editing
- **Click the title field** in the toolbar
- **Type your changes**
- **Changes save automatically** when you click outside

##### 2. Time Adjustments
Quick buttons for common time changes:
- **+15m** - Add 15 minutes
- **+30m** - Add 30 minutes  
- **+1h** - Add 1 hour
- **-15m** - Subtract 15 minutes
- **Custom** - Enter specific time

##### 3. All-Day Toggle
- **Click the toggle** to make event all-day
- Removes specific time, keeps the date
- Useful for holidays, birthdays, deadlines

##### 4. Category Change
- **Click the color dot** to open category menu
- **Select new category** from dropdown
- Color updates immediately

##### 5. Quick Delete
- **Click the trash icon**
- **Confirm deletion** in the popup
- **Undo available** for 5 seconds

### Full Edit Dialog

For comprehensive event editing, double-click any event.

#### Editable Fields:
- **Title** - Event name (required)
- **Description** - Additional details (optional)
- **Start Date/Time** - When event begins
- **End Date/Time** - When event ends
- **Category** - Event type and color
- **Location** - Where the event occurs
- **Reminder** - Notification settings
- **Recurrence** - Repeat patterns

### Drag-to-Reschedule

Move events by dragging them to new times.

#### Steps:
1. **Hover over an event** until cursor changes
2. **Click and hold** the event
3. **Drag to new position**
4. **Release** to confirm move

#### Constraints:
- Can't drag to past dates (unless enabled in settings)
- Multi-day events maintain their duration
- Recurring events offer "this only" or "all future" options

---

## Deleting Events

### Method 1: FloatingToolbar Delete

1. **Click the event** to show toolbar
2. **Click the trash icon**
3. **Confirm deletion**

### Method 2: Keyboard Delete

1. **Click to select** the event
2. **Press Delete** or **Backspace**
3. **Confirm deletion**

### Method 3: Right-Click Context Menu

1. **Right-click** on the event
2. **Select "Delete Event"**
3. **Confirm deletion**

### Bulk Delete

For removing multiple events:

1. **Hold Cmd/Ctrl** and click multiple events
2. **Press Delete** or right-click → "Delete Selected"
3. **Confirm bulk deletion**

### Undo Delete

After deleting an event:
- **5-second undo window** appears
- **Click "Undo"** or press **Cmd+Z**
- Event is restored with all details

---

## Event Categories

Categories help organize and visualize different types of events.

### Default Categories

| Category | Color | Best For |
|----------|--------|----------|
| Personal | Green | Personal appointments, activities |
| Work | Blue | Meetings, deadlines, work tasks |
| Health | Orange | Medical appointments, exercise |
| Social | Purple | Social events, gatherings |
| Other | Gray | Miscellaneous events |

### Setting Event Category

#### During Creation:
1. After entering title, **Tab to category field**
2. **Select from dropdown** or press number key (1-5)

#### After Creation:
1. **Click event** to show FloatingToolbar
2. **Click color dot** to open category menu
3. **Select new category**

### Filtering by Category

1. **Click filter icon** in toolbar
2. **Check/uncheck categories** to show/hide
3. **Click "Apply Filters"**

### Custom Categories (Coming Soon)

Future updates will allow:
- Creating custom categories
- Custom colors
- Icon selection
- Category templates

---

## Keyboard Shortcuts

### Global Shortcuts

| Shortcut | Action |
|----------|--------|
| **Cmd/Ctrl + N** | New event |
| **Cmd/Ctrl + K** | Open command bar |
| **Cmd/Ctrl + F** | Search events |
| **Cmd/Ctrl + Z** | Undo last action |
| **Cmd/Ctrl + Shift + Z** | Redo |
| **Escape** | Close dialogs/cancel |

### Navigation

| Shortcut | Action |
|----------|--------|
| **←/→** | Previous/Next month |
| **↑/↓** | Previous/Next week |
| **Home** | Go to today |
| **Page Up/Down** | Previous/Next year |

### Event Management

| Shortcut | Action |
|----------|--------|
| **Enter** | Edit selected event |
| **Delete/Backspace** | Delete selected event |
| **Space** | Quick view event |
| **D** | Duplicate event |
| **C** | Copy event |
| **V** | Paste event |

### View Controls

| Shortcut | Action |
|----------|--------|
| **1** | Year view |
| **2** | Month view |
| **3** | Week view |
| **4** | Day view |
| **+/-** | Zoom in/out |

---

## Mobile Usage

Command Center Calendar is fully optimized for mobile devices with touch gestures.

### Touch Gestures

#### Creating Events
1. **Long press** on empty space (0.5 seconds)
2. **Drag to set duration** (optional)
3. **Enter title** in popup keyboard
4. **Tap "Save"**

#### Editing Events
1. **Tap event** to show FloatingToolbar
2. **Use toolbar buttons** for quick edits
3. **Double-tap** for full edit dialog

#### Navigation
- **Swipe left/right** - Navigate months
- **Swipe up/down** - Scroll through days
- **Pinch** - Zoom in/out
- **Two-finger swipe** - Navigate years

### Mobile-Specific Features

#### Bottom Sheet Editor
On small screens, edit dialogs appear as bottom sheets:
- **Swipe up** to expand
- **Swipe down** to minimize
- **Swipe down fully** to close

#### Thumb-Friendly Toolbar
FloatingToolbar positions itself for easy thumb access:
- Appears above events near screen bottom
- Appears below events near screen top
- Always within thumb reach

#### Haptic Feedback
Feel subtle vibrations for:
- Event selection
- Drag thresholds
- Successful saves
- Deletion confirmations

---

## Advanced Features

### Smart Scheduling (AI-Powered)

Let AI find the perfect time for your events.

#### How to Use:
1. **Create new event** with any method
2. **Click "Find Time"** button
3. **AI suggests optimal slots** based on:
   - Your existing schedule
   - Preferred working hours
   - Meeting patterns
   - Focus time protection

#### AI Considerations:
- Avoids back-to-back meetings
- Respects lunch hours
- Maintains focus blocks
- Suggests based on past patterns

### Conflict Detection

Automatic detection of scheduling conflicts.

#### Visual Indicators:
- **Red outline** on conflicting events
- **Warning icon** in event corner
- **Conflict count** in FloatingToolbar

#### Resolution Options:
1. **Click "Resolve Conflicts"**
2. Choose resolution:
   - Reschedule earlier event
   - Reschedule later event
   - Make events concurrent
   - Cancel one event

### Recurring Events

Create events that repeat on a schedule.

#### Setting Recurrence:
1. **Create or edit** an event
2. **Click "Make Recurring"**
3. Choose pattern:
   - Daily
   - Weekly (with day selection)
   - Monthly (by date or day)
   - Yearly
   - Custom

#### Editing Recurring Events:
When editing, choose:
- **This event only** - Changes single occurrence
- **This and future** - Changes from this point forward
- **All events** - Changes entire series

### Event Templates

Save time with reusable event templates.

#### Creating Templates:
1. **Create an event** with desired settings
2. **Click "Save as Template"**
3. **Name your template**

#### Using Templates:
1. **Press Cmd+N** for new event
2. **Click "Use Template"**
3. **Select from your templates**
4. **Adjust dates and details**

### Batch Operations

Perform actions on multiple events simultaneously.

#### Multi-Select:
- **Cmd/Ctrl + Click** - Select individual events
- **Shift + Click** - Select range
- **Cmd/Ctrl + A** - Select all visible

#### Batch Actions:
- Change category for all
- Shift time for all
- Delete selected
- Export selected
- Copy/Move to different calendar

---

## Tips & Best Practices

### Productivity Tips

1. **Use descriptive titles** - Include who, what, where in title
2. **Color code consistently** - Stick to category meanings
3. **Set reminders** - 15 minutes for meetings, 1 day for deadlines
4. **Block focus time** - Create "Focus" events to protect deep work
5. **Review weekly** - Spend 10 minutes planning each week

### Organization Strategies

#### Time Blocking
- Create blocks for similar tasks
- Use "Work Block" for focused periods
- Add "Admin Time" for emails/calls

#### Buffer Time
- Add 15-minute buffers between meetings
- Use "Transition" events between locations
- Build in break time

#### Theme Days
- Assign themes to days (e.g., "Meeting Mondays")
- Batch similar activities
- Reduce context switching

### Visual Organization

1. **Use categories meaningfully**
   - Work = Professional obligations
   - Personal = Self and family
   - Health = Wellness activities
   - Social = Friends and networking

2. **Title formatting**
   - [URGENT] for time-sensitive
   - @Location for places
   - #Project for grouping
   - !Important for priorities

3. **Description best practices**
   - Include agenda for meetings
   - Add contact info for appointments
   - List preparation needed
   - Note follow-up actions

---

## Troubleshooting

### Common Issues & Solutions

#### Event Won't Save
**Problem**: Event disappears after creation
**Solution**: 
- Check internet connection
- Ensure title is not empty
- Verify valid date/time
- Reload page and retry

#### Drag-to-Create Not Working
**Problem**: Dragging doesn't create event
**Solution**:
- Ensure you're dragging on empty space
- Drag distance must be > 30 pixels
- Check if calendar is in read-only mode
- Try different browser

#### FloatingToolbar Not Appearing
**Problem**: Clicking event shows nothing
**Solution**:
- Click directly on event, not empty space
- Check if popups are blocked
- Try double-click for full dialog
- Refresh the page

#### Events Not Syncing
**Problem**: Events don't appear on other devices
**Solution**:
- Check sync status in settings
- Verify account is connected
- Force sync with sync button
- Check conflict resolution queue

#### Keyboard Shortcuts Not Working
**Problem**: Shortcuts have no effect
**Solution**:
- Ensure calendar has focus (click on it)
- Check if dialog is open (close with Esc)
- Verify shortcuts aren't disabled
- Try different browser

### Performance Issues

#### Slow Loading
- Clear browser cache
- Reduce visible events with filters
- Close other browser tabs
- Check internet speed

#### Laggy Scrolling
- Reduce zoom level
- Filter to show fewer events
- Disable animations in settings
- Update browser to latest version

### Data Issues

#### Lost Events
1. Check trash/archive
2. Remove filters
3. Check different views
4. Restore from backup

#### Duplicate Events
1. Check for sync conflicts
2. Remove duplicate calendar sources
3. Clean up with deduplication tool
4. Verify recurring event settings

---

## Getting Help

### Support Resources

- **Help Center**: [help.lineartime.app](https://help.lineartime.app)
- **Video Tutorials**: [youtube.com/lineartime](https://youtube.com/lineartime)
- **Community Forum**: [community.lineartime.app](https://community.lineartime.app)
- **Email Support**: support@lineartime.app

### Feedback & Feature Requests

We love hearing from users! Share your ideas:
- **Feature Requests**: [feedback.lineartime.app](https://feedback.lineartime.app)
- **Bug Reports**: Use the bug icon in app
- **Twitter**: [@lineartime](https://twitter.com/lineartime)

### Keyboard Shortcut Reference Card

Print this quick reference:

```
CREATION
Cmd+N............New Event
Drag.............Create by dragging
Cmd+K............Command bar

NAVIGATION  
←/→..............Month navigation
↑/↓..............Week navigation
Home.............Today
PgUp/PgDn........Year navigation

EDITING
Click............FloatingToolbar
Double-click.....Full edit
Delete...........Remove event
Cmd+Z............Undo

VIEWS
1................Year view
2................Month view  
3................Week view
+/-..............Zoom
```

---

## What's Next?

### Coming Soon in Version 2.0

- **Real-time Collaboration** - See others' edits live
- **Advanced AI** - Meeting scheduling assistant
- **Plugin System** - Integrate with your tools
- **Mobile Apps** - Native iOS and Android
- **Calendar Sync** - Google, Outlook, Apple
- **Custom Themes** - Personalize your calendar
- **Analytics** - Insights into your time usage

### Join the Beta

Be the first to try new features:
1. Go to Settings → Beta Program
2. Enable "Try Beta Features"
3. Provide feedback on new features

---

*Thank you for choosing Command Center Calendar! We're committed to making calendar management intuitive and powerful.*

*User Guide Version 1.0.0 | August 23, 2025*  
*© 2025 Command Center Calendar - "Life is bigger than a week"*