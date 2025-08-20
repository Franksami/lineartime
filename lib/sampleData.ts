import { TimelineEvent, EventCategory } from '@/types';

export const sampleCategories: EventCategory[] = [
  {
    id: 'work',
    name: 'Work',
    color: 'oklch(65% 0.2 220)',
    icon: '💼',
    userId: 'sample-user'
  },
  {
    id: 'personal',
    name: 'Personal',
    color: 'oklch(70% 0.15 320)',
    icon: '🌟',
    userId: 'sample-user'
  },
  {
    id: 'health',
    name: 'Health & Fitness',
    color: 'oklch(60% 0.25 140)',
    icon: '🏃‍♂️',
    userId: 'sample-user'
  },
  {
    id: 'social',
    name: 'Social',
    color: 'oklch(75% 0.18 280)',
    icon: '🎉',
    userId: 'sample-user'
  },
  {
    id: 'learning',
    name: 'Learning',
    color: 'oklch(55% 0.22 40)',
    icon: '📚',
    userId: 'sample-user'
  }
];

export function generateSampleEvents(year: number = new Date().getFullYear()): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  const categories = sampleCategories;
  
  // Generate events throughout the year
  for (let month = 0; month < 12; month++) {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
      // Random chance of having events on any given day (70% chance)
      if (Math.random() > 0.3) {
        const eventCount = Math.floor(Math.random() * 4) + 1; // 1-4 events per day
        
        for (let i = 0; i < eventCount; i++) {
          const category = categories[Math.floor(Math.random() * categories.length)];
          const startHour = Math.floor(Math.random() * 20) + 6; // 6 AM to 2 AM
          const duration = Math.floor(Math.random() * 4) + 1; // 1-4 hours
          
          const startTime = new Date(year, month, day, startHour, 0, 0);
          const endTime = new Date(year, month, day, startHour + duration, 0, 0);
          
          const eventTitles = {
            work: [
              'Team Standup', 'Client Meeting', 'Code Review', 'Project Planning',
              'Sprint Planning', 'Architecture Discussion', 'Product Demo',
              'Weekly Sync', 'Performance Review', 'Training Session'
            ],
            personal: [
              'Grocery Shopping', 'Family Dinner', 'Movie Night', 'Reading Time',
              'Meditation', 'Journal Writing', 'Organize Home', 'Pay Bills',
              'Call Parents', 'Weekend Plans'
            ],
            health: [
              'Morning Jog', 'Gym Workout', 'Yoga Class', 'Doctor Appointment',
              'Meal Prep', 'Cycling', 'Swimming', 'Tennis Match',
              'Physical Therapy', 'Nutrition Planning'
            ],
            social: [
              'Coffee with Sarah', 'Birthday Party', 'Game Night', 'Concert',
              'Dinner Date', 'Book Club', 'Hiking Trip', 'Beach Day',
              'Wedding', 'Art Gallery Visit'
            ],
            learning: [
              'Online Course', 'Workshop', 'Conference', 'Podcast Recording',
              'Language Practice', 'Skill Building', 'Tutorial Session',
              'Study Group', 'Research Time', 'Knowledge Sharing'
            ]
          };
          
          const titles = eventTitles[category.id as keyof typeof eventTitles] || ['Event'];
          const title = titles[Math.floor(Math.random() * titles.length)];
          
          events.push({
            id: `${year}-${month}-${day}-${i}-${Math.random().toString(36).substr(2, 9)}`,
            title,
            description: `${title} scheduled for ${startTime.toLocaleDateString()}`,
            startTime,
            endTime,
            allDay: Math.random() > 0.8, // 20% chance of all-day events
            color: category.color,
            categoryId: category.id,
            attendees: Math.random() > 0.5 ? ['user@example.com'] : undefined,
            location: Math.random() > 0.6 ? 'Conference Room A' : undefined,
            createdAt: new Date(),
            updatedAt: new Date(),
            userId: 'sample-user'
          });
        }
      }
    }
  }
  
  // Add some recurring events
  addRecurringEvents(events, year);
  
  return events.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
}

function addRecurringEvents(events: TimelineEvent[], year: number) {
  // Add weekly standup meetings
  for (let week = 0; week < 52; week++) {
    const monday = new Date(year, 0, 1 + (week * 7) - new Date(year, 0, 1).getDay() + 1);
    if (monday.getFullYear() === year) {
      events.push({
        id: `standup-${year}-${week}`,
        title: 'Weekly Team Standup',
        startTime: new Date(monday.getTime() + 9 * 60 * 60 * 1000), // 9 AM
        endTime: new Date(monday.getTime() + 10 * 60 * 60 * 1000), // 10 AM
        color: 'oklch(65% 0.2 220)',
        categoryId: 'work',
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: 'sample-user'
      });
    }
  }
  
  // Add monthly review meetings
  for (let month = 0; month < 12; month++) {
    const firstFriday = new Date(year, month, 1);
    firstFriday.setDate(firstFriday.getDate() + ((5 - firstFriday.getDay() + 7) % 7));
    
    events.push({
      id: `monthly-review-${year}-${month}`,
      title: 'Monthly Performance Review',
      startTime: new Date(firstFriday.getTime() + 14 * 60 * 60 * 1000), // 2 PM
      endTime: new Date(firstFriday.getTime() + 16 * 60 * 60 * 1000), // 4 PM
      color: 'oklch(65% 0.2 220)',
      categoryId: 'work',
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: 'sample-user'
    });
  }
}