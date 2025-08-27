/**
 * Motion-Enhanced Calendar Toolbar
 * Migrated from Framer Motion to Motion library
 * Features audio-visual sync and performance optimizations
 */

'use client';

import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  Grid3X3,
  Keyboard,
  Layers,
  List,
  Menu,
  Moon,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Sun,
  Wifi,
  WifiOff,
} from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useCalendarProvider } from './providers/CalendarProvider';
import { type CalendarLibrary, CalendarTheme, CalendarView } from './providers/types';

import { useSettingsContext } from '@/contexts/SettingsContext';
// Motion system imports
import {
  Animated,
  useButtonAnimation,
  useModalAnimation,
  useMotion,
  useMotionTokens,
} from '@/lib/motion';
import { useAudioVisualSync } from '@/lib/motion/audio-visual-sync';

interface MotionEnhancedCalendarToolbarProps {
  className?: string;
  showSyncStatus?: boolean;
  enableKeyboardShortcuts?: boolean;
  showLibrarySelector?: boolean;
  compactMode?: boolean;
}

interface QuickEventData {
  title: string;
  description: string;
  date: string;
  time: string;
  duration: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category?: string;
}

interface FilterOptions {
  categories: string[];
  dateRange: string;
  priority: string;
  showCompleted: boolean;
}

export const MotionEnhancedCalendarToolbar: React.FC<MotionEnhancedCalendarToolbarProps> = ({
  className,
  showSyncStatus = true,
  enableKeyboardShortcuts = true,
  showLibrarySelector = true,
  compactMode = false,
}) => {
  const {
    selectedLibrary,
    switchLibrary,
    currentView,
    switchView,
    selectedDate,
    navigateToDate,
    theme,
    switchTheme,
    onEventCreate,
    syncStatus,
    syncCalendar,
    providers,
    events,
    loading,
  } = useCalendarProvider();

  // Settings integration for audio-visual sync
  const settings = useSettingsContext();
  const { syncWithPreset } = useAudioVisualSync(settings.notifications);
  const motionTokens = useMotionTokens();

  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [_isSearchFocused, setIsSearchFocused] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showQuickEvent, setShowQuickEvent] = useState(false);
  const [_showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [quickEventData, setQuickEventData] = useState<QuickEventData>({
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    duration: '1h',
    priority: 'medium',
    category: 'work',
  });

  // Motion hooks for enhanced UX
  const addButtonAnimation = useButtonAnimation<HTMLButtonElement>();
  const searchAnimation = useMotion<HTMLDivElement>();
  const toolbarAnimation = useMotion<HTMLDivElement>();
  const quickEventModal = useModalAnimation();

  // Responsive design detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    if (!enableKeyboardShortcuts) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'n':
            e.preventDefault();
            handleQuickEventOpen();
            break;
          case 'k':
            e.preventDefault();
            setSearchQuery('');
            // Focus search would go here
            break;
          case '/':
            e.preventDefault();
            setShowFilters(!showFilters);
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enableKeyboardShortcuts, showFilters]);

  // Enhanced event handlers with motion feedback
  const handleQuickEventOpen = () => {
    setShowQuickEvent(true);
    quickEventModal.open({
      onComplete: () => {
        syncWithPreset('modal-open', motionTokens.durations.normal, 'modalOpen');
      },
    });
  };

  const handleQuickEventSubmit = async () => {
    if (!quickEventData.title.trim()) return;

    try {
      // Animation feedback for successful creation
      syncWithPreset('event-create', motionTokens.durations.slow, 'eventCreate');

      // Create event logic would go here
      await onEventCreate?.({
        title: quickEventData.title,
        description: quickEventData.description,
        start: new Date(`${quickEventData.date}T${quickEventData.time}`),
        end: new Date(`${quickEventData.date}T${quickEventData.time}`), // + duration
        priority: quickEventData.priority,
        category: quickEventData.category,
      });

      // Reset form and close
      setQuickEventData({
        title: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        time: '09:00',
        duration: '1h',
        priority: 'medium',
        category: 'work',
      });

      quickEventModal.close();
    } catch (error) {
      console.error('Failed to create event:', error);
      // Error feedback animation
      syncWithPreset('event-error', motionTokens.durations.fast, 'eventDelete');
    }
  };

  const handleLibrarySwitch = (library: CalendarLibrary) => {
    switchLibrary(library);
    syncWithPreset('library-switch', motionTokens.durations.normal, 'buttonPress');
  };

  const handleThemeToggle = () => {
    switchTheme(theme === 'light' ? 'dark' : 'light');
    syncWithPreset('theme-toggle', motionTokens.durations.fast, 'buttonPress');
  };

  const handleSync = async () => {
    try {
      syncWithPreset('sync-start', motionTokens.durations.fast, 'buttonPress');
      await syncCalendar();
      syncWithPreset('sync-complete', motionTokens.durations.normal, 'eventCreate');
    } catch (_error) {
      syncWithPreset('sync-error', motionTokens.durations.fast, 'eventDelete');
    }
  };

  const handleSearchFocus = () => {
    setIsSearchFocused(true);
    if (searchAnimation.ref.current) {
      searchAnimation.animate(
        { scale: 1.02, boxShadow: '0 0 0 2px rgb(59 130 246 / 0.2)' },
        {
          duration: motionTokens.durations.fast / 1000,
          category: 'feedback',
          audio: { sound: 'notification', volume: 0.05, syncTiming: true },
        }
      );
    }
  };

  const handleSearchBlur = () => {
    setIsSearchFocused(false);
    if (searchAnimation.ref.current) {
      searchAnimation.animate(
        { scale: 1, boxShadow: '0 0 0 0px transparent' },
        {
          duration: motionTokens.durations.fast / 1000,
          category: 'feedback',
        }
      );
    }
  };

  // Render methods
  const renderMobileToolbar = () => (
    <Animated
      className={cn(
        'flex items-center justify-between p-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
        className
      )}
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      category="interface"
    >
      <div className="flex items-center space-x-2">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm">
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left">
            <SheetHeader>
              <SheetTitle>Calendar Tools</SheetTitle>
            </SheetHeader>
            <div className="space-y-4 py-4">
              {showLibrarySelector && renderLibrarySelector()}
              {renderViewSelector()}
              {renderThemeToggle()}
            </div>
          </SheetContent>
        </Sheet>

        <Button
          ref={addButtonAnimation.ref}
          variant="ghost"
          size="sm"
          onClick={() => {
            addButtonAnimation.handlePress();
            handleQuickEventOpen();
          }}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        {renderSyncStatus()}
        <Button variant="ghost" size="sm" onClick={handleThemeToggle}>
          {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </Button>
      </div>
    </Animated>
  );

  const renderDesktopToolbar = () => (
    <Animated
      ref={toolbarAnimation.ref}
      className={cn(
        'flex items-center justify-between p-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
        'transition-all duration-200',
        className
      )}
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      category="interface"
    >
      {/* Left section */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-primary" />
          <span className="font-semibold text-lg">LinearTime</span>
        </div>

        <Separator orientation="vertical" className="h-6" />

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateToDate(new Date(selectedDate.getTime() - 86400000))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" className="min-w-[120px]">
                {selectedDate.toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              {/* Date picker would go here */}
            </PopoverContent>
          </Popover>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateToDate(new Date(selectedDate.getTime() + 86400000))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {showLibrarySelector && renderLibrarySelector()}
        {renderViewSelector()}
      </div>

      {/* Center section - Search */}
      <div ref={searchAnimation.ref} className="relative flex-1 max-w-md mx-8">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search events..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={handleSearchFocus}
          onBlur={handleSearchBlur}
          className="pl-10 pr-4"
        />
        {searchQuery && (
          <Animated
            className="absolute right-3 top-1/2 transform -translate-y-1/2"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            category="feedback"
          >
            <Badge variant="secondary" className="text-xs">
              {
                events.filter((e) => e.title.toLowerCase().includes(searchQuery.toLowerCase()))
                  .length
              }{' '}
              found
            </Badge>
          </Animated>
        )}
      </div>

      {/* Right section */}
      <div className="flex items-center space-x-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                ref={addButtonAnimation.ref}
                variant="default"
                size="sm"
                onClick={() => {
                  addButtonAnimation.handlePress();
                  handleQuickEventOpen();
                }}
                onMouseEnter={() => addButtonAnimation.handleHover(true)}
                onMouseLeave={() => addButtonAnimation.handleHover(false)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Quick Add
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Add event (Ctrl+N)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Popover open={showFilters} onOpenChange={setShowFilters}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-4">
              <h4 className="font-medium">Filter Events</h4>
              {renderFilterOptions()}
            </div>
          </PopoverContent>
        </Popover>

        {renderSyncStatus()}

        <Button variant="ghost" size="sm" onClick={handleThemeToggle}>
          {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </Button>

        <Popover open={showSettings} onOpenChange={setShowSettings}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-4">
              <h4 className="font-medium">Settings</h4>
              {renderSettingsPanel()}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </Animated>
  );

  const renderLibrarySelector = () => (
    <Select value={selectedLibrary} onValueChange={handleLibrarySwitch}>
      <SelectTrigger className="w-[140px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="linear">Linear Calendar</SelectItem>
        <SelectItem value="fullcalendar">FullCalendar Pro</SelectItem>
        <SelectItem value="react-big-calendar">Big Calendar</SelectItem>
        <SelectItem value="toast-ui">Toast UI</SelectItem>
        <SelectItem value="react-calendar">React Calendar</SelectItem>
      </SelectContent>
    </Select>
  );

  const renderViewSelector = () => (
    <Select value={currentView} onValueChange={switchView}>
      <SelectTrigger className="w-[100px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="month">Month</SelectItem>
        <SelectItem value="week">Week</SelectItem>
        <SelectItem value="day">Day</SelectItem>
        <SelectItem value="agenda">Agenda</SelectItem>
      </SelectContent>
    </Select>
  );

  const renderSyncStatus = () => {
    if (!showSyncStatus) return null;

    const isOnline = syncStatus?.connected ?? true;
    const lastSync = syncStatus?.lastSync;

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSync}
              disabled={loading || !isOnline}
              className="relative"
            >
              {loading ? (
                <Animated initial={{ rotate: 0 }} animate={{ rotate: 360 }} category="interface">
                  <RefreshCw className="h-4 w-4" />
                </Animated>
              ) : isOnline ? (
                <Wifi className="h-4 w-4" />
              ) : (
                <WifiOff className="h-4 w-4" />
              )}

              {syncStatus?.pendingChanges && (
                <Animated
                  className="absolute -top-1 -right-1 h-2 w-2 bg-orange-500 rounded-full"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  category="feedback"
                />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {loading
                ? 'Syncing...'
                : isOnline
                  ? `Last sync: ${lastSync ? new Date(lastSync).toLocaleTimeString() : 'Never'}`
                  : 'Offline'}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  const renderThemeToggle = () => (
    <div className="flex items-center space-x-2">
      <Label htmlFor="theme-toggle">Dark mode</Label>
      <Switch id="theme-toggle" checked={theme === 'dark'} onCheckedChange={handleThemeToggle} />
    </div>
  );

  const renderFilterOptions = () => (
    <div className="space-y-3">
      <div>
        <Label className="text-sm font-medium">Categories</Label>
        <div className="flex flex-wrap gap-2 mt-1">
          {['work', 'personal', 'health', 'social'].map((category) => (
            <Badge
              key={category}
              variant="outline"
              className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
            >
              {category}
            </Badge>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-sm font-medium">Priority</Label>
        <Select defaultValue="all">
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderSettingsPanel = () => (
    <div className="space-y-4">
      {renderThemeToggle()}

      <div className="flex items-center space-x-2">
        <Label htmlFor="keyboard-shortcuts">Enable keyboard shortcuts</Label>
        <Switch
          id="keyboard-shortcuts"
          checked={enableKeyboardShortcuts}
          onCheckedChange={() => {}} // This would be handled by parent
        />
      </div>

      <div className="flex items-center space-x-2">
        <Label htmlFor="compact-mode">Compact mode</Label>
        <Switch
          id="compact-mode"
          checked={compactMode}
          onCheckedChange={() => {}} // This would be handled by parent
        />
      </div>

      <Separator />

      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowKeyboardShortcuts(true)}
        className="w-full"
      >
        <Keyboard className="h-4 w-4 mr-2" />
        View Keyboard Shortcuts
      </Button>
    </div>
  );

  // Quick Event Modal (using Dialog instead of custom modal)
  const renderQuickEventModal = () => (
    <Dialog open={showQuickEvent} onOpenChange={setShowQuickEvent}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Quick Add Event</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            placeholder="Event title"
            value={quickEventData.title}
            onChange={(e) => setQuickEventData((prev) => ({ ...prev, title: e.target.value }))}
          />

          <Textarea
            placeholder="Description (optional)"
            value={quickEventData.description}
            onChange={(e) =>
              setQuickEventData((prev) => ({ ...prev, description: e.target.value }))
            }
            rows={3}
          />

          <div className="grid grid-cols-2 gap-2">
            <Input
              type="date"
              value={quickEventData.date}
              onChange={(e) => setQuickEventData((prev) => ({ ...prev, date: e.target.value }))}
            />
            <Input
              type="time"
              value={quickEventData.time}
              onChange={(e) => setQuickEventData((prev) => ({ ...prev, time: e.target.value }))}
            />
          </div>

          <Select
            value={quickEventData.priority}
            onValueChange={(value: any) =>
              setQuickEventData((prev) => ({ ...prev, priority: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low Priority</SelectItem>
              <SelectItem value="medium">Medium Priority</SelectItem>
              <SelectItem value="high">High Priority</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => setShowQuickEvent(false)} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleQuickEventSubmit}
              disabled={!quickEventData.title.trim()}
              className="flex-1"
            >
              Create Event
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <>
      {isMobile ? renderMobileToolbar() : renderDesktopToolbar()}
      {renderQuickEventModal()}
    </>
  );
};

export default MotionEnhancedCalendarToolbar;
