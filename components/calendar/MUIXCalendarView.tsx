'use client';

import { cn } from '@/lib/utils';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Event as EventIcon,
  LocationOn as LocationIcon,
  People as PeopleIcon,
  Schedule as ScheduleIcon,
  Settings as SettingsIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import {
  Avatar,
  Badge,
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Fab,
  IconButton,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import { DateRangePicker } from '@mui/x-date-pickers-pro/DateRangePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { PickersDay, type PickersDayProps } from '@mui/x-date-pickers/PickersDay';
import { StaticDatePicker } from '@mui/x-date-pickers/StaticDatePicker';
import React, { useState, useCallback, useMemo } from 'react';
import type { CalendarEvent, CalendarViewProps } from './providers/types';

interface MUIXCalendarViewProps extends CalendarViewProps {
  pickerVariant?: 'calendar' | 'date' | 'dateTime' | 'range' | 'static';
  showToolbar?: boolean;
  enableRange?: boolean;
  views?: Array<'year' | 'month' | 'day'>;
  orientation?: 'portrait' | 'landscape';
}

// Custom day component with event indicators
interface CustomDayProps extends PickersDayProps<Date> {
  dayEvents?: CalendarEvent[];
}

const CustomPickersDay = React.forwardRef<HTMLButtonElement, CustomDayProps>((props, ref) => {
  const { dayEvents = [], day, ...other } = props;

  const getPriorityColor = (priority?: string): string => {
    switch (priority) {
      case 'critical':
        return '#d32f2f';
      case 'high':
        return '#f57c00';
      case 'medium':
        return '#fbc02d';
      case 'low':
        return '#388e3c';
      default:
        return '#1976d2';
    }
  };

  return (
    <Box sx={{ position: 'relative' }}>
      <PickersDay {...other} ref={ref} day={day} />
      {dayEvents.length > 0 && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 2,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: 0.5,
          }}
        >
          {dayEvents.slice(0, 3).map((event, index) => (
            <Box
              key={index}
              sx={{
                width: 4,
                height: 4,
                borderRadius: '50%',
                backgroundColor: getPriorityColor(event.priority),
              }}
            />
          ))}
          {dayEvents.length > 3 && (
            <Box
              sx={{
                width: 4,
                height: 4,
                borderRadius: '50%',
                backgroundColor: 'grey.500',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography variant="caption" sx={{ fontSize: 6, color: 'white' }}>
                +
              </Typography>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
});
CustomPickersDay.displayName = 'CustomPickersDay';

const MUIXCalendarView: React.FC<MUIXCalendarViewProps> = ({
  events = [],
  selectedDate,
  onEventCreate,
  onEventUpdate,
  onEventDelete,
  onDateChange,
  theme = 'light',
  loading = false,
  className,
  pickerVariant = 'calendar',
  showToolbar = true,
  enableRange = false,
  views = ['year', 'month', 'day'],
  orientation = 'portrait',
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(selectedDate);
  const [selectedRange, setSelectedRange] = useState<[Date | null, Date | null]>([null, null]);
  const [currentVariant, setCurrentVariant] = useState(pickerVariant);
  const [showEvents, setShowEvents] = useState(true);

  // Process events by date
  const eventsByDate = useMemo(() => {
    const eventMap = new Map<string, CalendarEvent[]>();

    events.forEach((event) => {
      const dateKey = event.start.toISOString().split('T')[0];
      if (!eventMap.has(dateKey)) {
        eventMap.set(dateKey, []);
      }
      eventMap.get(dateKey)?.push(event);
    });

    return eventMap;
  }, [events]);

  // Handle date selection
  const handleDateChange = useCallback(
    (date: Date | null) => {
      if (date) {
        setCurrentDate(date);
        onDateChange(date);
      }
    },
    [onDateChange]
  );

  // Handle event creation
  const handleCreateEvent = useCallback(
    async (date?: Date) => {
      try {
        const eventDate = date || currentDate;
        const start = new Date(eventDate);
        const end = new Date(eventDate);

        start.setHours(9, 0, 0, 0);
        end.setHours(10, 0, 0, 0);

        await onEventCreate({
          title: 'New Event',
          start,
          end,
          allDay: false,
        });
      } catch (error) {
        console.error('Failed to create event:', error);
      }
    },
    [currentDate, onEventCreate]
  );

  // Custom day renderer
  const renderDay = useCallback(
    (day: Date, _selectedDays: Date[], pickersDayProps: PickersDayProps<Date>) => {
      const dateKey = day.toISOString().split('T')[0];
      const dayEvents = eventsByDate.get(dateKey) || [];

      return <CustomPickersDay {...pickersDayProps} dayEvents={dayEvents} day={day} />;
    },
    [eventsByDate]
  );

  // Get events for selected date
  const selectedDateEvents = useMemo(() => {
    const dateKey = currentDate.toISOString().split('T')[0];
    return eventsByDate.get(dateKey) || [];
  }, [currentDate, eventsByDate]);

  const getPriorityColor = useCallback((priority?: string) => {
    switch (priority) {
      case 'critical':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'success';
      default:
        return 'primary';
    }
  }, []);

  const renderCalendarVariant = () => {
    const commonProps = {
      value: currentDate,
      onChange: handleDateChange,
      views,
      orientation,
      disabled: loading,
    };

    switch (currentVariant) {
      case 'calendar':
        return (
          <DateCalendar
            {...commonProps}
            renderDay={renderDay}
            showDaysOutsideCurrentMonth
            sx={{ width: '100%' }}
          />
        );

      case 'date':
        return (
          <DatePicker
            {...commonProps}
            label="Select Date"
            slotProps={{
              textField: {
                fullWidth: true,
                variant: 'outlined',
              },
            }}
          />
        );

      case 'dateTime':
        return (
          <DateTimePicker
            {...commonProps}
            label="Select Date & Time"
            slotProps={{
              textField: {
                fullWidth: true,
                variant: 'outlined',
              },
            }}
          />
        );

      case 'range':
        return (
          <DateRangePicker
            value={selectedRange}
            onChange={(newRange) => setSelectedRange(newRange)}
            localeText={{ start: 'Start Date', end: 'End Date' }}
            disabled={loading}
          />
        );

      case 'static':
        return (
          <StaticDatePicker
            {...commonProps}
            displayStaticWrapperAs="desktop"
            renderDay={renderDay}
          />
        );

      default:
        return (
          <DateCalendar
            {...commonProps}
            renderDay={renderDay}
            showDaysOutsideCurrentMonth
            sx={{ width: '100%' }}
          />
        );
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <div className={cn('muix-calendar-view', className)}>
        {loading && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(255,255,255,0.5)',
              backdropFilter: 'blur(2px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 50,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  border: '2px solid',
                  borderColor: 'primary.main',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  '@keyframes spin': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' },
                  },
                }}
              />
              <Typography variant="body2" color="text.secondary">
                Loading events...
              </Typography>
            </Box>
          </Box>
        )}

        {/* Header */}
        {showToolbar && (
          <Paper sx={{ p: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <EventIcon color="primary" />
                <Typography variant="h5" component="h2">
                  MUI X Date Pickers
                </Typography>
                <Chip label={events.length} color="primary" size="small" />
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ToggleButtonGroup
                  value={currentVariant}
                  exclusive
                  onChange={(_, value) => value && setCurrentVariant(value)}
                  size="small"
                  disabled={loading}
                >
                  <ToggleButton value="calendar">Calendar</ToggleButton>
                  <ToggleButton value="date">Date</ToggleButton>
                  <ToggleButton value="dateTime">DateTime</ToggleButton>
                  <ToggleButton value="static">Static</ToggleButton>
                </ToggleButtonGroup>

                <IconButton
                  onClick={() => setShowEvents(!showEvents)}
                  disabled={loading}
                  color={showEvents ? 'primary' : 'default'}
                >
                  {showEvents ? <VisibilityIcon /> : <VisibilityOffIcon />}
                </IconButton>
              </Box>
            </Box>
          </Paper>
        )}

        <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', lg: 'row' } }}>
          {/* Calendar Column */}
          <Box sx={{ flex: showEvents ? 2 : 1 }}>
            <Paper sx={{ p: 2 }}>
              {renderCalendarVariant()}

              {/* Today Button */}
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                <Fab
                  size="small"
                  color="primary"
                  onClick={() => handleDateChange(new Date())}
                  disabled={loading}
                  sx={{ mr: 1 }}
                >
                  <ScheduleIcon />
                </Fab>
                <Fab
                  size="small"
                  color="secondary"
                  onClick={() => handleCreateEvent()}
                  disabled={loading}
                >
                  <AddIcon />
                </Fab>
              </Box>
            </Paper>
          </Box>

          {/* Events Sidebar */}
          {showEvents && (
            <Box sx={{ flex: 1, minWidth: 320 }}>
              <Card>
                <CardContent>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                  >
                    <EventIcon />
                    Events for{' '}
                    {currentDate.toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                    })}
                    <Chip size="small" label={selectedDateEvents.length} color="primary" />
                  </Typography>

                  {selectedDateEvents.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                      <EventIcon sx={{ fontSize: 48, opacity: 0.5, mb: 2 }} />
                      <Typography variant="body2" gutterBottom>
                        No events for this date
                      </Typography>
                      <IconButton
                        color="primary"
                        onClick={() => handleCreateEvent()}
                        disabled={loading}
                      >
                        <AddIcon />
                      </IconButton>
                    </Box>
                  ) : (
                    <List>
                      {selectedDateEvents.map((event, index) => (
                        <React.Fragment key={event.id}>
                          <ListItem sx={{ px: 0 }}>
                            <Avatar
                              sx={{
                                backgroundColor: `${getPriorityColor(event.priority)}.main`,
                                width: 32,
                                height: 32,
                                mr: 2,
                              }}
                            >
                              <EventIcon fontSize="small" />
                            </Avatar>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="subtitle2">{event.title}</Typography>
                                  {event.priority && (
                                    <Chip
                                      label={event.priority}
                                      size="small"
                                      color={getPriorityColor(event.priority) as any}
                                      sx={{ height: 20, fontSize: 10 }}
                                    />
                                  )}
                                </Box>
                              }
                              secondary={
                                <Box sx={{ mt: 0.5 }}>
                                  {event.description && (
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                      {event.description}
                                    </Typography>
                                  )}
                                  <Box
                                    sx={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 2,
                                      flexWrap: 'wrap',
                                    }}
                                  >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                      <ScheduleIcon fontSize="small" />
                                      <Typography variant="caption">
                                        {event.allDay
                                          ? 'All day'
                                          : `${event.start.toLocaleTimeString('en-US', {
                                              hour: 'numeric',
                                              minute: '2-digit',
                                            })} - ${event.end.toLocaleTimeString('en-US', {
                                              hour: 'numeric',
                                              minute: '2-digit',
                                            })}`}
                                      </Typography>
                                    </Box>

                                    {event.location && (
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <LocationIcon fontSize="small" />
                                        <Typography variant="caption">{event.location}</Typography>
                                      </Box>
                                    )}

                                    {event.attendees && event.attendees.length > 0 && (
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <PeopleIcon fontSize="small" />
                                        <Typography variant="caption">
                                          {event.attendees.length}
                                        </Typography>
                                      </Box>
                                    )}
                                  </Box>
                                </Box>
                              }
                            />
                            <ListItemSecondaryAction>
                              <IconButton
                                edge="end"
                                color="error"
                                onClick={() => onEventDelete(event.id)}
                                disabled={loading}
                                size="small"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </ListItemSecondaryAction>
                          </ListItem>
                          {index < selectedDateEvents.length - 1 && <Divider />}
                        </React.Fragment>
                      ))}
                    </List>
                  )}
                </CardContent>
              </Card>

              {/* Statistics Card */}
              <Card sx={{ mt: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Statistics
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        Total Events
                      </Typography>
                      <Chip label={events.length} size="small" color="info" />
                    </Box>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        High Priority
                      </Typography>
                      <Chip
                        label={
                          events.filter((e) => e.priority === 'high' || e.priority === 'critical')
                            .length
                        }
                        size="small"
                        color="warning"
                      />
                    </Box>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        This Month
                      </Typography>
                      <Chip
                        label={
                          events.filter((event) => {
                            return (
                              event.start.getMonth() === currentDate.getMonth() &&
                              event.start.getFullYear() === currentDate.getFullYear()
                            );
                          }).length
                        }
                        size="small"
                        color="success"
                      />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          )}
        </Box>
      </div>
    </LocalizationProvider>
  );
};

export default MUIXCalendarView;
