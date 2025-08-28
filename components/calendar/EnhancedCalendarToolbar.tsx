'use client';

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
import { AnimatePresence, motion } from 'framer-motion';
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
import { useCalendarProvider } from './providers/CalendarProvider';
import { type CalendarLibrary, CalendarTheme, type CalendarView } from './providers/types';

interface EnhancedCalendarToolbarProps {
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

const EnhancedCalendarToolbar: React.FC<EnhancedCalendarToolbarProps> = ({
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

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [_showFilters, _setShowFilters] = useState(false);
  const [_showSettings, _setShowSettings] = useState(false);
  const [showQuickEvent, setShowQuickEvent] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [quickEventData, setQuickEventData] = useState<QuickEventData>({
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    duration: '60',
    priority: 'medium',
    category: '',
  });
  const [_filters, _setFilters] = useState<FilterOptions>({
    categories: [],
    dateRange: 'all',
    priority: 'all',
    showCompleted: true,
  });

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!enableKeyboardShortcuts) return;

    const handleKeyboard = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'n':
            e.preventDefault();
            setShowQuickEvent(true);
            break;
          case 'f':
            e.preventDefault();
            document.getElementById('search-input')?.focus();
            break;
          case '/':
            e.preventDefault();
            setShowKeyboardShortcuts(true);
            break;
        }
      } else {
        switch (e.key) {
          case 't':
            e.preventDefault();
            navigateToDate(new Date());
            break;
          case 'm':
            e.preventDefault();
            switchView('month');
            break;
          case 'w':
            e.preventDefault();
            switchView('week');
            break;
          case 'd':
            e.preventDefault();
            switchView('day');
            break;
          case 'a':
            e.preventDefault();
            switchView('agenda');
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [enableKeyboardShortcuts, navigateToDate, switchView]);

  const handlePrevious = () => {
    const newDate = new Date(selectedDate);
    if (currentView === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (currentView === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() - 1);
    }
    navigateToDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(selectedDate);
    if (currentView === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (currentView === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    navigateToDate(newDate);
  };

  const handleToday = () => {
    navigateToDate(new Date());
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    // TODO: Implement search functionality in CalendarProvider
  };

  const handleQuickEventSubmit = async () => {
    try {
      const [year, month, day] = quickEventData.date.split('-').map(Number);
      const [hour, minute] = quickEventData.time.split(':').map(Number);

      const start = new Date(year, month - 1, day, hour, minute);
      const end = new Date(start.getTime() + Number.parseInt(quickEventData.duration) * 60 * 1000);

      await onEventCreate({
        title: quickEventData.title,
        description: quickEventData.description,
        start,
        end,
        allDay: false,
        priority: quickEventData.priority,
        category: quickEventData.category,
      });

      setQuickEventData({
        title: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        time: '09:00',
        duration: '60',
        priority: 'medium',
        category: '',
      });
      setShowQuickEvent(false);
    } catch (error) {
      console.error('Failed to create event:', error);
    }
  };

  const getSyncIcon = () => {
    switch (syncStatus) {
      case 'success':
        return <Wifi className="h-4 w-4 text-green-500 /* TODO: Use semantic token */" />;
      case 'error':
        return <WifiOff className="h-4 w-4 text-red-500 /* TODO: Use semantic token */" />;
      case 'syncing':
        return <RefreshCw className="h-4 w-4 text-primary animate-spin" />;
      default:
        return <Wifi className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
      ...(currentView === 'day' && { day: 'numeric' }),
    });
  };

  const _getLibraryDisplayName = (library: CalendarLibrary): string => {
    const names: Record<CalendarLibrary, string> = {
      linear: 'Linear Calendar',
      fullcalendar: 'FullCalendar Pro',
      toastui: 'Toast UI Calendar',
      reactbigcalendar: 'React Big Calendar',
      reactinfinite: 'React Infinite Calendar',
      primereact: 'PrimeReact Calendar',
      muix: 'MUI X Date Pickers',
      reactcalendar: 'React Calendar',
      reactdatepicker: 'React DatePicker',
      reactdaypicker: 'React Day Picker',
    };
    return names[library] || library;
  };

  const viewIcons: Record<CalendarView, React.ComponentType<{ className?: string }>> = {
    month: Grid3X3,
    week: Calendar,
    day: Clock,
    agenda: List,
    year: MoreHorizontal,
    timeline: MoreHorizontal,
    progress: MoreHorizontal,
    linear: Layers,
  };

  const keyboardShortcuts = [
    { key: 'Ctrl/Cmd + N', action: 'Create new event' },
    { key: 'Ctrl/Cmd + F', action: 'Focus search' },
    { key: 'Ctrl/Cmd + /', action: 'Show shortcuts' },
    { key: '←/→', action: 'Navigate dates' },
    { key: 'T', action: 'Go to today' },
    { key: 'M/W/D/A', action: 'Switch views' },
  ];

  if (isMobile) {
    return (
      <div
        className={cn(
          'w-full bg-background/80 backdrop-blur-xl border-b border-border/50 sticky top-0 z-50',
          className
        )}
      >
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrevious}
              className="h-8 w-8 p-0"
              disabled={loading}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNext}
              className="h-8 w-8 p-0"
              disabled={loading}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <h2 className="text-sm font-semibold text-foreground">{formatDate(selectedDate)}</h2>
          </div>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <SheetHeader>
                <SheetTitle>Calendar Controls</SheetTitle>
              </SheetHeader>
              <div className="space-y-6 mt-6">
                <div className="space-y-2">
                  <Label>Search Events</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search events..."
                      value={searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>View</Label>
                  <Select
                    value={currentView}
                    onValueChange={(value) => switchView(value as CalendarView)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="linear">Linear</SelectItem>
                      <SelectItem value="month">Month</SelectItem>
                      <SelectItem value="week">Week</SelectItem>
                      <SelectItem value="day">Day</SelectItem>
                      <SelectItem value="agenda">Agenda</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {showLibrarySelector && (
                  <div className="space-y-2">
                    <Label>Calendar Library</Label>
                    <Select
                      value={selectedLibrary}
                      onValueChange={(value) => switchLibrary(value as CalendarLibrary)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="linear">Linear Calendar</SelectItem>
                        <SelectItem value="fullcalendar">FullCalendar Pro</SelectItem>
                        <SelectItem value="reactbigcalendar">React Big Calendar</SelectItem>
                        <SelectItem value="muix">MUI X Date Pickers</SelectItem>
                        <SelectItem value="primereact">PrimeReact Calendar</SelectItem>
                        <SelectItem value="reactcalendar">React Calendar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <Label>Dark Mode</Label>
                  <Switch
                    checked={theme === 'dark'}
                    onCheckedChange={() => switchTheme(theme === 'dark' ? 'light' : 'dark')}
                  />
                </div>

                <Button
                  onClick={() => setShowQuickEvent(true)}
                  className="w-full"
                  disabled={loading}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Quick Event
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'w-full bg-background/80 backdrop-blur-xl border-b border-border/50 sticky top-0 z-50',
          compactMode && 'py-2',
          className
        )}
      >
        <div
          className={cn(
            'flex items-center justify-between gap-4',
            compactMode ? 'px-4 py-2' : 'p-4'
          )}
        >
          {/* Left Section - Navigation */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handlePrevious}
                    className="h-9 w-9 p-0 hover:bg-primary/10 transition-colors"
                    disabled={loading}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Previous</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleNext}
                    className="h-9 w-9 p-0 hover:bg-primary/10 transition-colors"
                    disabled={loading}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Next</TooltipContent>
              </Tooltip>

              <Button
                variant="outline"
                size="sm"
                onClick={handleToday}
                className="ml-2 bg-background/50 hover:bg-primary/10 border-border/50"
                disabled={loading}
              >
                Today
              </Button>
            </div>

            {!compactMode && <Separator orientation="vertical" className="h-6" />}

            <motion.h1
              key={selectedDate.toISOString()}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={cn('font-semibold text-foreground', compactMode ? 'text-lg' : 'text-xl')}
            >
              {formatDate(selectedDate)}
            </motion.h1>

            {events.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {events.length} events
              </Badge>
            )}
          </div>

          {/* Center Section - Search */}
          {!compactMode && (
            <div className="flex-1 max-w-md mx-4">
              <motion.div
                className="relative"
                animate={{
                  scale: isSearchFocused ? 1.02 : 1,
                  boxShadow: isSearchFocused
                    ? '0 0 0 2px hsl(var(--primary))'
                    : '0 0 0 0px transparent',
                }}
                transition={{ duration: 0.2 }}
              >
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search-input"
                  placeholder="Search events... (Ctrl+F)"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  className="pl-10 pr-4 bg-background/50 border-border/50 focus:bg-background transition-colors"
                  disabled={loading}
                />
              </motion.div>
            </div>
          )}

          {/* Right Section - Controls */}
          <div className="flex items-center gap-2">
            {/* View Controls */}
            <div className="flex items-center bg-muted/50 rounded-lg p-1">
              {(['month', 'week', 'day', 'agenda'] as const).map((viewOption) => {
                const Icon = viewIcons[viewOption];
                return (
                  <Tooltip key={viewOption}>
                    <TooltipTrigger asChild>
                      <Button
                        variant={currentView === viewOption ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => switchView(viewOption)}
                        className="h-8 w-8 p-0 transition-all duration-200"
                        disabled={loading}
                      >
                        <Icon className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {viewOption.charAt(0).toUpperCase() + viewOption.slice(1)}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>

            {!compactMode && <Separator orientation="vertical" className="h-6" />}

            {/* Library Selector */}
            {showLibrarySelector && (
              <Select
                value={selectedLibrary}
                onValueChange={(value) => switchLibrary(value as CalendarLibrary)}
              >
                <SelectTrigger className="w-40 bg-background/50 border-border/50">
                  <SelectValue placeholder="Select library" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="linear">Linear Calendar</SelectItem>
                  <SelectItem value="fullcalendar">FullCalendar Pro</SelectItem>
                  <SelectItem value="reactbigcalendar">React Big Calendar</SelectItem>
                  <SelectItem value="muix">MUI X Date Pickers</SelectItem>
                  <SelectItem value="primereact">PrimeReact Calendar</SelectItem>
                  <SelectItem value="reactcalendar">React Calendar</SelectItem>
                </SelectContent>
              </Select>
            )}

            {/* Quick Actions */}
            <div className="flex items-center gap-1">
              <Dialog open={showQuickEvent} onOpenChange={setShowQuickEvent}>
                <DialogTrigger asChild>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground"
                        disabled={loading}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Event
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Create Event (Ctrl+N)</TooltipContent>
                  </Tooltip>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Quick Event</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={quickEventData.title}
                        onChange={(e) =>
                          setQuickEventData((prev) => ({ ...prev, title: e.target.value }))
                        }
                        placeholder="Event title"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={quickEventData.description}
                        onChange={(e) =>
                          setQuickEventData((prev) => ({ ...prev, description: e.target.value }))
                        }
                        placeholder="Event description"
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="date">Date</Label>
                        <Input
                          id="date"
                          type="date"
                          value={quickEventData.date}
                          onChange={(e) =>
                            setQuickEventData((prev) => ({ ...prev, date: e.target.value }))
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="time">Time</Label>
                        <Input
                          id="time"
                          type="time"
                          value={quickEventData.time}
                          onChange={(e) =>
                            setQuickEventData((prev) => ({ ...prev, time: e.target.value }))
                          }
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="duration">Duration (minutes)</Label>
                        <Select
                          value={quickEventData.duration}
                          onValueChange={(value) =>
                            setQuickEventData((prev) => ({ ...prev, duration: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="30">30 minutes</SelectItem>
                            <SelectItem value="60">1 hour</SelectItem>
                            <SelectItem value="90">1.5 hours</SelectItem>
                            <SelectItem value="120">2 hours</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="priority">Priority</Label>
                        <Select
                          value={quickEventData.priority}
                          onValueChange={(value) =>
                            setQuickEventData((prev) => ({ ...prev, priority: value as any }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="critical">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowQuickEvent(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleQuickEventSubmit} disabled={loading}>
                        Create Event
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {showSyncStatus && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => providers.length > 0 && syncCalendar(providers[0].id)}
                      className="h-9 w-9 p-0 hover:bg-primary/10"
                      disabled={loading}
                    >
                      {getSyncIcon()}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Sync Status: {syncStatus}</TooltipContent>
                </Tooltip>
              )}

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => switchTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="h-9 w-9 p-0 hover:bg-primary/10"
                    disabled={loading}
                  >
                    {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Toggle Theme</TooltipContent>
              </Tooltip>

              {enableKeyboardShortcuts && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowKeyboardShortcuts(true)}
                      className="h-9 w-9 p-0 hover:bg-primary/10"
                    >
                      <Keyboard className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Keyboard Shortcuts (Ctrl+/)</TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        </div>

        {/* Sync Status Bar */}
        <AnimatePresence>
          {syncStatus === 'syncing' && showSyncStatus && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-primary/10 border-t border-blue-500 /* TODO: Use semantic token *//20 px-4 py-2"
            >
              <div className="flex items-center gap-2 text-sm text-blue-600 /* TODO: Use semantic token */ dark:text-blue-400 /* TODO: Use semantic token */">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Syncing calendar data...
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Keyboard Shortcuts Dialog */}
        {enableKeyboardShortcuts && (
          <Dialog open={showKeyboardShortcuts} onOpenChange={setShowKeyboardShortcuts}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Keyboard className="h-5 w-5" />
                  Keyboard Shortcuts
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                {keyboardShortcuts.map((shortcut, index) => (
                  <div key={index} className="flex items-center justify-between py-2">
                    <span className="text-sm text-muted-foreground">{shortcut.action}</span>
                    <Badge variant="outline" className="font-mono text-xs">
                      {shortcut.key}
                    </Badge>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </motion.div>
    </TooltipProvider>
  );
};

export default EnhancedCalendarToolbar;
