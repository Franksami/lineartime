#!/usr/bin/env tsx

import { addDays, startOfYear } from 'date-fns';
import type { Event } from '../types/calendar';

function generateTestEvents(count: number = 10000): Event[] {
  const events: Event[] = [];
  const categories: Event['category'][] = ['personal', 'work', 'effort', 'note'];
  const startDate = startOfYear(new Date());
  
  for (let i = 0; i < count; i++) {
    const dayOffset = Math.floor(Math.random() * 365);
    const duration = Math.floor(Math.random() * 5) + 1; // 1-5 days
    const start = addDays(startDate, dayOffset);
    const end = addDays(start, duration);
    
    events.push({
      id: `test-${i}`,
      title: `Event ${i} - ${['Meeting', 'Task', 'Reminder', 'Appointment'][Math.floor(Math.random() * 4)]}`,
      startDate: start,
      endDate: end,
      category: categories[Math.floor(Math.random() * categories.length)],
      description: `Test event ${i} description`,
      allDay: Math.random() > 0.5,
    });
  }
  
  return events;
}

// Generate events and output as JSON
const events = generateTestEvents(10000);
console.log(JSON.stringify(events, null, 2));