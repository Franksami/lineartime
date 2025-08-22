// Test script for CommandBar NLP parsing
import { EventParser } from './lib/nlp/EventParser.ts';

const parser = new EventParser();

// Test examples
const testInputs = [
  "Meeting tomorrow at 3pm",
  "Lunch with Sarah at noon at Starbucks",
  "Doctor appointment next Friday 3pm",
  "Team meeting every Monday at 10am",
  "Focus time tomorrow 9am to 12pm",
  "Birthday party next Saturday at 7pm",
  "Dentist appointment in 2 weeks at 2:30pm",
  "Conference call with client tomorrow at 4pm for 1 hour"
];

console.log("Testing CommandBar NLP Parser:\n");
console.log("=" .repeat(50));

testInputs.forEach((input, index) => {
  console.log(`\nTest ${index + 1}: "${input}"`);
  console.log("-" .repeat(40));
  
  const result = parser.parse(input);
  const intent = parser.parseIntent(input);
  
  console.log("Intent:", intent);
  console.log("Parsed Event:");
  console.log("  Title:", result.title);
  console.log("  Start:", result.start ? result.start.toLocaleString() : 'N/A');
  console.log("  End:", result.end ? result.end.toLocaleString() : 'N/A');
  console.log("  Location:", result.location || 'N/A');
  console.log("  Attendees:", result.attendees?.length > 0 ? result.attendees.join(', ') : 'N/A');
  console.log("  Category:", result.category);
  console.log("  Confidence:", (result.confidence * 100).toFixed(0) + '%');
});

console.log("\n" + "=" .repeat(50));
console.log("Testing complete!");