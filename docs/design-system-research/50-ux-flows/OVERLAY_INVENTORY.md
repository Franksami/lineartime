# 🎯 Overlay Components Inventory

## 📊 Overview
**Total Overlay Surfaces**: 150+ instances across codebase
**Research Priority**: Critical for user experience and accessibility

---

## 🗂️ 1. Modal/Dialog System (40+ instances)

### Core Modal Components

#### **SettingsDialog** (`components/settings/SettingsDialog.tsx`)
```tsx
// Usage: Settings panel access
<SettingsDialog>
  <SettingsContent />
</SettingsDialog>
```
- **Trigger**: Gear icon in header
- **Purpose**: Application settings and preferences
- **Z-Index**: Modal layer (1000+)
- **States**: Open/closed, loading, error
- **Accessibility**: Focus trap, escape key, screen reader
- **Animation**: Scale in/out, backdrop fade

#### **AdvancedExportDialog** (`components/analytics/AdvancedExportDialog.tsx`)
```tsx
// Usage: Data export functionality
<AdvancedExportDialog>
  <ExportOptions />
</AdvancedExportDialog>
```
- **Trigger**: Export button in analytics
- **Purpose**: Complex data export with filters
- **States**: Configuration, progress, completion
- **Animation**: Slide up, progress animations

#### **ConflictResolutionModal** (`components/calendar/ConflictResolutionModal.tsx`)
```tsx
// Usage: Calendar sync conflicts
<ConflictResolutionModal>
  <ConflictDetails />
</ConflictResolutionModal>
```
- **Trigger**: Sync conflict notification
- **Purpose**: Resolve calendar event conflicts
- **Critical Path**: Affects data integrity
- **States**: Review, resolution, confirmation

#### **EventModal** (`components/calendar/EventModal.tsx`)
```tsx
// Usage: Event creation/editing
<EventModal>
  <EventForm />
</EventModal>
```
- **Trigger**: Calendar click, event double-click
- **Purpose**: Full event management
- **Complex Form**: Multiple tabs, validation
- **Animation**: Smooth entry/exit

#### **event-modal.tsx** (`components/calendar/event-modal.tsx`)
- **Purpose**: Alternative event modal implementation
- **Usage**: Integrated calendar event editing
- **Note**: Potential duplicate - needs consolidation

#### **ReflectionModal** (`components/calendar/ReflectionModal.tsx`)
```tsx
// Usage: Calendar reflection/review
<ReflectionModal>
  <ReflectionContent />
</ReflectionModal>
```
- **Trigger**: Reflection button in calendar
- **Purpose**: User calendar review and insights
- **States**: Loading analytics, displaying insights

#### **ConflictResolutionDialog** (`components/sync/ConflictResolutionDialog.tsx`)
- **Purpose**: Alternative conflict resolution UI
- **Note**: Similar to ConflictResolutionModal - needs consolidation

### Command System Modals

#### **Command Menu** (`components/ui/command.tsx`)
```tsx
// Usage: Global command palette
<CommandDialog>
  <CommandInput />
  <CommandList />
</CommandDialog>
```
- **Trigger**: Cmd+K (Mac), Ctrl+K (Windows)
- **Purpose**: Global navigation and actions
- **Performance**: Must be fast (sub-100ms)
- **Accessibility**: Full keyboard navigation

#### **DragDropMetricsPanel** (`components/analytics/DragDropMetricsPanel.tsx`)
- **Purpose**: Analytics overlay for drag operations
- **Trigger**: Drag actions in calendar
- **Real-time**: Updates during drag operations

---

## 📱 2. Sheet/Sidebar System (16+ instances)

### Navigation Sheets

#### **NavigationHeader Sheet** (`components/layout/NavigationHeader.tsx`)
```tsx
// Usage: Mobile navigation
<Sheet>
  <NavigationMenu />
</Sheet>
```
- **Trigger**: Hamburger menu on mobile
- **Purpose**: Mobile navigation drawer
- **Animation**: Slide from left, backdrop
- **States**: Open/closed, swipe gestures

#### **EnhancedCalendarToolbar Sheet** (`components/calendar/EnhancedCalendarToolbar.tsx`)
```tsx
// Usage: Calendar controls
<Sheet>
  <CalendarControls />
</Sheet>
```
- **Trigger**: Calendar toolbar button
- **Purpose**: Advanced calendar filtering and views
- **Multiple Sheets**: Different control panels

### Mobile-Specific Sheets

#### **BottomSheet** (`components/mobile/BottomSheet.tsx`)
```tsx
// Usage: Mobile calendar actions
<BottomSheet>
  <EventActions />
</BottomSheet>
```
- **Trigger**: Long press on calendar events
- **Purpose**: Mobile-optimized action menu
- **Animation**: Slide from bottom
- **Touch Gestures**: Swipe to dismiss

### System UI Sheets

#### **Sidebar Component** (`components/ui/sidebar.tsx`)
```tsx
// Usage: Application sidebar
<Sidebar>
  <NavigationItems />
</Sidebar>
```
- **Trigger**: Persistent or collapsible
- **Purpose**: Main navigation structure
- **States**: Collapsed/expanded, responsive
- **Animation**: Smooth collapse/expand

---

## 💬 3. Tooltip System (57+ instances)

### Calendar Tooltips

#### **EnhancedCalendarToolbar Tooltips** (`components/calendar/EnhancedCalendarToolbar.tsx`)
```tsx
// Usage: Control explanations
<Tooltip>
  <TooltipTrigger>Button</TooltipTrigger>
  <TooltipContent>Button explanation</TooltipContent>
</Tooltip>
```
- **15+ instances** in calendar toolbar
- **Purpose**: Explain complex calendar controls
- **Timing**: 300ms delay, 5s duration
- **Positioning**: Auto-positioning based on viewport

#### **Calendar Event Tooltips**
- **Trigger**: Hover on calendar events
- **Content**: Event summary, time, location
- **Performance**: Must not impact calendar rendering
- **Mobile**: Touch and hold to trigger

### Analytics Tooltips

#### **IntegrationAnalyticsCharts Tooltips** (`components/analytics/IntegrationAnalyticsCharts.tsx`)
- **5+ instances** for data visualization
- **Purpose**: Explain metrics and data points
- **Rich Content**: Charts, numbers, explanations
- **Accessibility**: Screen reader compatible

#### **DragDropMetricsPanel Tooltips** (`components/analytics/DragDropMetricsPanel.tsx`)
- **4+ instances** for performance metrics
- **Real-time**: Update during operations
- **Contextual**: Different tooltips based on operation

### AI Assistant Tooltips

#### **AssistantPanel Tooltips** (`components/ai/AssistantPanel.tsx`)
- **Purpose**: Explain AI capabilities and suggestions
- **Contextual**: Different based on user context
- **Educational**: Help users understand AI features

### System Tooltips

#### **Core Tooltip Component** (`components/ui/tooltip.tsx`)
```tsx
// Base tooltip implementation
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger>Trigger</TooltipTrigger>
    <TooltipContent>Content</TooltipContent>
  </Tooltip>
</TooltipProvider>
```
- **Central Implementation**: All tooltips inherit from this
- **Theme Integration**: Respects dark/light mode
- **Animation**: Smooth fade in/out
- **Accessibility**: Proper ARIA attributes

---

## 🔔 4. Toast Notification System (15+ instances)

### Core Toast Implementation

#### **useToast Hook** (`hooks/use-toast.tsx`)
```tsx
// Usage: Global toast notifications
const { toast } = useToast();

toast({
  title: "Success",
  description: "Operation completed",
  variant: "default"
});
```
- **5 instances** in hook implementation
- **Central State**: Global toast queue management
- **Variants**: success, error, warning, info
- **Auto-dismiss**: Configurable timing

### Integration Toasts

#### **Settings Integration Toasts** (`app/settings/integrations/page.tsx`)
```tsx
// Usage: Provider connection feedback
toast({
  title: "Connected",
  description: "Google Calendar connected successfully"
});
```
- **10+ instances** for different integration states
- **Real-time Feedback**: Connection status, errors, success
- **Actionable**: Some toasts include retry actions

### Toast States and Variants

#### **Success States**
- Provider connection successful
- Data sync completed
- Settings saved
- Export completed

#### **Error States**
- Connection failed
- Sync conflict
- Permission denied
- Network error

#### **Warning States**
- Large data operation
- Unusual activity detected
- Storage quota approaching

#### **Info States**
- Background sync in progress
- New feature available
- Maintenance scheduled

---

## 🎯 5. Onboarding & Guided Experience (8+ flows)

### User Onboarding Flows

#### **New User Onboarding** (`app/playground/onboarding/page.tsx`)
- **Multi-step Process**: Welcome → Calendar setup → Feature introduction
- **Progressive Disclosure**: Show features as user needs them
- **Completion Tracking**: Track onboarding progress

#### **Enterprise Setup Flow**
- **Complex Process**: Team creation → Provider integration → Security setup
- **Role-based**: Different flows for admins vs. users
- **Compliance**: GDPR, SSO, audit requirements

### Feature-Specific Onboarding

#### **AI Assistant Introduction**
- **Contextual**: Show when user first uses AI features
- **Progressive**: Start simple, offer advanced features
- **Opt-out**: Respect user preferences

#### **Calendar Integration Setup**
- **Provider-specific**: Different flows for Google, Microsoft, Apple
- **Permission Explanation**: Clear explanation of required permissions
- **Error Recovery**: Handle OAuth failures gracefully

---

## ⚠️ 6. Error & Empty States (12+ types)

### Error State Categories

#### **Network Errors**
- Connection failed, timeout, offline mode
- Retry mechanisms, offline capabilities
- User-friendly error messages

#### **Authentication Errors**
- Token expired, permission denied
- Re-authentication flows
- Session management

#### **Data Errors**
- Sync conflicts, data corruption
- Recovery options, backup systems
- Clear error communication

### Empty State Patterns

#### **No Events**
- First-time user experience
- After filtering with no results
- Encouraging action-oriented messaging

#### **No Data**
- Analytics with no data yet
- Integration not set up
- Loading states vs. empty states

#### **No Permissions**
- Access denied scenarios
- Request permission flows
- Alternative access methods

---

## 📊 7. Loading & Skeleton States

### Loading Patterns

#### **Page-level Loading**
- Initial page load, route transitions
- Skeleton layouts, progressive loading
- Performance expectations

#### **Component-level Loading**
- Button loading states, form submissions
- Inline loading indicators
- Non-blocking operations

#### **Data Loading**
- Calendar event loading, analytics loading
- Streaming data, real-time updates
- Background sync indicators

### Skeleton Implementations

#### **Calendar Skeletons**
- Event list skeletons
- Calendar grid placeholders
- Maintain layout consistency

#### **Form Skeletons**
- Input field placeholders
- Button loading states
- Form submission feedback

---

## 🎨 8. Critical UX Flow Issues Identified

### High Priority Issues

#### **Modal Accessibility**
- Some modals missing focus traps
- Inconsistent escape key handling
- Screen reader announcements missing

#### **Tooltip Performance**
- 57+ tooltips may impact rendering
- Hover delays not consistent
- Positioning conflicts on mobile

#### **Toast Queue Management**
- Multiple toasts may overwhelm users
- No priority system for critical notifications
- Dismissal behavior inconsistent

#### **Sheet Responsiveness**
- Mobile sheet gestures not optimized
- Touch target sizes may be insufficient
- Swipe-to-dismiss reliability

### Medium Priority Issues

#### **Onboarding Completion**
- No clear progress indication
- Skip options may confuse users
- Re-entry points not obvious

#### **Error Recovery**
- Some error states lack clear recovery paths
- Generic error messages not helpful
- No offline mode guidance

---

## 📈 9. Research Recommendations

### Immediate Actions (Week 1-2)
1. **Audit all modals** for accessibility compliance
2. **Standardize tooltip timing** and positioning
3. **Implement toast priority system**
4. **Test mobile sheet interactions**

### Medium-term Improvements (Week 3-4)
1. **Consolidate duplicate components** (ConflictResolutionModal vs Dialog)
2. **Implement progressive onboarding**
3. **Enhance error recovery flows**
4. **Optimize tooltip performance**

### Long-term Vision (Week 5-8)
1. **Unified overlay system** with consistent patterns
2. **Advanced onboarding** with AI personalization
3. **Comprehensive error handling** with predictive recovery
4. **Performance-optimized** overlay rendering

---

## 🔗 10. Next Steps

1. **Complete ASCII Layouts**: Draft layouts for all major surfaces
2. **Theme Audit**: Check all overlays for token compliance
3. **Animation Inventory**: Document all overlay animations
4. **Accessibility Testing**: Comprehensive a11y audit
5. **Performance Analysis**: Measure overlay impact on performance

**This inventory provides our complete foundation for overlay research. Ready to proceed with ASCII layouts and theme auditing?**
