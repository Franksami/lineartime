#!/usr/bin/env node

/**
 * Test Data Seeder for Manual Testing
 * Creates sample events for testing LinearCalendar functionality
 */

console.log('🌱 Seeding Test Data for Manual Testing');
console.log('=====================================');
console.log('');

const currentYear = new Date().getFullYear();

// Sample events for testing
const testEvents = [
  {
    title: 'New Year Planning',
    start: `${currentYear}-01-01`,
    end: `${currentYear}-01-05`,
    category: 'personal',
    description: 'Annual goal setting and planning session'
  },
  {
    title: 'Q1 Sprint Planning',
    start: `${currentYear}-01-08`, 
    end: `${currentYear}-01-26`,
    category: 'work',
    description: 'First quarter development sprint planning'
  },
  {
    title: 'Team Meeting',
    start: `${currentYear}-02-15`,
    end: `${currentYear}-02-15`,
    category: 'work', 
    description: 'Weekly team sync meeting'
  },
  {
    title: 'Birthday Party',
    start: `${currentYear}-03-22`,
    end: `${currentYear}-03-22`,
    category: 'personal',
    description: 'Friend\'s birthday celebration'
  },
  {
    title: 'Conference Talk',
    start: `${currentYear}-04-10`,
    end: `${currentYear}-04-12`,
    category: 'work',
    description: 'Speaking at tech conference'
  },
  {
    title: 'Summer Vacation',
    start: `${currentYear}-07-01`,
    end: `${currentYear}-07-14`,
    category: 'personal',
    description: 'Two-week summer vacation trip'
  },
  {
    title: 'Project Launch',
    start: `${currentYear}-09-15`,
    end: `${currentYear}-09-15`,
    category: 'work',
    description: 'Major project launch day'
  },
  {
    title: 'Holiday Planning',
    start: `${currentYear}-12-01`,
    end: `${currentYear}-12-31`,
    category: 'personal',
    description: 'Holiday season preparations'
  }
];

console.log('📋 Sample Events Created:');
testEvents.forEach((event, index) => {
  console.log(`   ${index + 1}. ${event.title} (${event.start} - ${event.end})`);
  console.log(`      Category: ${event.category}`);
  console.log(`      Description: ${event.description}`);
  console.log('');
});

console.log('🔧 How to Use These Events:');
console.log('   1. Open http://localhost:3000');
console.log('   2. Create events manually using the data above');
console.log('   3. Or copy/paste this data into your calendar app');
console.log('   4. Test all functionality with these sample events');
console.log('');

console.log('🎯 Test Scenarios with This Data:');
console.log('   • Short events (Birthday Party, Team Meeting)');
console.log('   • Multi-day events (New Year Planning, Summer Vacation)');
console.log('   • Work vs Personal category testing');
console.log('   • Events spread across the year');
console.log('   • Different description lengths');
console.log('');

console.log('🚀 Ready for comprehensive testing!');
console.log('');