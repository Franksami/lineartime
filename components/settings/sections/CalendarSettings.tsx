'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useSettingsContext } from '@/contexts/SettingsContext';
import type { UserSettings } from '@/lib/settings/types';
import type * as React from 'react';

export function CalendarSettings() {
  const { settings, updateCategory } = useSettingsContext();
  const calendar = settings.calendar;

  const handleWeekStartChange = (value: string) => {
    updateCategory('calendar', {
      weekStartsOn: Number.parseInt(value) as UserSettings['calendar']['weekStartsOn'],
    });
  };

  const handleDefaultViewChange = (defaultView: UserSettings['calendar']['defaultView']) => {
    updateCategory('calendar', { defaultView });
  };

  const handleDefaultCategoryChange = (
    defaultEventCategory: UserSettings['calendar']['defaultEventCategory']
  ) => {
    updateCategory('calendar', { defaultEventCategory });
  };

  const handleEventDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const duration = Number.parseInt(e.target.value);
    if (!Number.isNaN(duration) && duration > 0) {
      updateCategory('calendar', { eventDefaultDuration: duration });
    }
  };

  const handleWorkingHoursChange = (field: 'start' | 'end', value: string) => {
    updateCategory('calendar', {
      workingHours: {
        ...calendar.workingHours,
        [field]: value,
      },
    });
  };

  const toggleWorkingHours = () => {
    updateCategory('calendar', {
      workingHours: {
        ...calendar.workingHours,
        enabled: !calendar.workingHours.enabled,
      },
    });
  };

  const toggleWeekNumbers = () => {
    updateCategory('calendar', { showWeekNumbers: !calendar.showWeekNumbers });
  };

  const toggleWeekends = () => {
    updateCategory('calendar', { showWeekends: !calendar.showWeekends });
  };

  const handleCalendarDayStyleChange = (
    calendarDayStyle: UserSettings['calendar']['calendarDayStyle']
  ) => {
    updateCategory('calendar', { calendarDayStyle });
  };

  const toggleDaysLeftCounter = () => {
    updateCategory('calendar', { showDaysLeft: !calendar.showDaysLeft });
  };

  const weekDays = [
    { value: '0', label: 'Sunday' },
    { value: '1', label: 'Monday' },
    { value: '2', label: 'Tuesday' },
    { value: '3', label: 'Wednesday' },
    { value: '4', label: 'Thursday' },
    { value: '5', label: 'Friday' },
    { value: '6', label: 'Saturday' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Calendar Preferences</h3>

        <div className="space-y-4">
          {/* Week Start Day */}
          <div className="flex items-center justify-between">
            <Label htmlFor="weekStart">Week Starts On</Label>
            <Select value={calendar.weekStartsOn.toString()} onValueChange={handleWeekStartChange}>
              <SelectTrigger id="weekStart" className="w-[180px]">
                <SelectValue placeholder="Select day" />
              </SelectTrigger>
              <SelectContent>
                {weekDays.map((day) => (
                  <SelectItem key={day.value} value={day.value}>
                    {day.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Default View */}
          <div className="flex items-center justify-between">
            <Label htmlFor="defaultView">Default View</Label>
            <Select value={calendar.defaultView} onValueChange={handleDefaultViewChange}>
              <SelectTrigger id="defaultView" className="w-[180px]">
                <SelectValue placeholder="Select view" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="year">Year View</SelectItem>
                <SelectItem value="timeline">Timeline</SelectItem>
                <SelectItem value="manage">Manage</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Default Event Category */}
          <div className="flex items-center justify-between">
            <Label htmlFor="defaultCategory">Default Event Category</Label>
            <Select
              value={calendar.defaultEventCategory}
              onValueChange={handleDefaultCategoryChange}
            >
              <SelectTrigger id="defaultCategory" className="w-[180px]">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="personal">Personal</SelectItem>
                <SelectItem value="work">Work</SelectItem>
                <SelectItem value="effort">Effort</SelectItem>
                <SelectItem value="note">Note</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Default Event Duration */}
          <div className="flex items-center justify-between">
            <Label htmlFor="eventDuration">Default Event Duration (minutes)</Label>
            <Input
              id="eventDuration"
              type="number"
              min="15"
              max="480"
              step="15"
              value={calendar.eventDefaultDuration}
              onChange={handleEventDurationChange}
              className="w-[180px]"
            />
          </div>

          {/* Show Week Numbers */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="weekNumbers">Show Week Numbers</Label>
              <p className="text-sm text-muted-foreground">Display week numbers in calendar view</p>
            </div>
            <Switch
              id="weekNumbers"
              checked={calendar.showWeekNumbers}
              onCheckedChange={toggleWeekNumbers}
              aria-label="Toggle week numbers"
            />
          </div>

          {/* Show Weekends */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="weekends">Show Weekends</Label>
              <p className="text-sm text-muted-foreground">
                Display Saturday and Sunday in calendar
              </p>
            </div>
            <Switch
              id="weekends"
              checked={calendar.showWeekends}
              onCheckedChange={toggleWeekends}
              aria-label="Toggle weekends"
            />
          </div>

          {/* Calendar Day Style */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="calendarDayStyle">Calendar Day Style</Label>
              <p className="text-sm text-muted-foreground">
                Choose how days are displayed in calendar view
              </p>
            </div>
            <Select value={calendar.calendarDayStyle} onValueChange={handleCalendarDayStyleChange}>
              <SelectTrigger id="calendarDayStyle" className="w-[180px]">
                <SelectValue placeholder="Select style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="number">Numbers</SelectItem>
                <SelectItem value="dot">Progress Dots</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Days Left Counter (only show in dot mode) */}
          {calendar.calendarDayStyle === 'dot' && (
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="daysLeft">Show Days Left Counter</Label>
                <p className="text-sm text-muted-foreground">
                  Display remaining days counter in dot mode
                </p>
              </div>
              <Switch
                id="daysLeft"
                checked={calendar.showDaysLeft}
                onCheckedChange={toggleDaysLeftCounter}
                aria-label="Toggle days left counter"
              />
            </div>
          )}

          {/* Working Hours */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="workingHours">Working Hours</Label>
                <p className="text-sm text-muted-foreground">Highlight working hours in calendar</p>
              </div>
              <Switch
                id="workingHours"
                checked={calendar.workingHours.enabled}
                onCheckedChange={toggleWorkingHours}
                aria-label="Toggle working hours"
              />
            </div>

            {calendar.workingHours.enabled && (
              <div className="flex items-center gap-2 ml-4">
                <Input
                  type="time"
                  value={calendar.workingHours.start}
                  onChange={(e) => handleWorkingHoursChange('start', e.target.value)}
                  className="w-[120px]"
                  aria-label="Working hours start time"
                />
                <span className="text-sm">to</span>
                <Input
                  type="time"
                  value={calendar.workingHours.end}
                  onChange={(e) => handleWorkingHoursChange('end', e.target.value)}
                  className="w-[120px]"
                  aria-label="Working hours end time"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
