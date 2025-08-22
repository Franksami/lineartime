'use client';

import { useState } from 'react';
import { EventParser } from '@/lib/nlp/EventParser';

export default function TestCommandBar() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<any>(null);
  const parser = new EventParser();

  const testExamples = [
    "Meeting tomorrow at 3pm",
    "Lunch with Sarah at noon at Starbucks",
    "Doctor appointment next Friday 3pm",
    "Team meeting every Monday at 10am",
    "Focus time tomorrow 9am to 12pm",
    "Birthday party next Saturday at 7pm",
    "Dentist appointment in 2 weeks at 2:30pm",
    "Conference call with client tomorrow at 4pm for 1 hour"
  ];

  const handleParse = () => {
    const parsed = parser.parse(input);
    const intent = parser.parseIntent(input);
    setResult({ parsed, intent });
  };

  const testExample = (example: string) => {
    setInput(example);
    const parsed = parser.parse(example);
    const intent = parser.parseIntent(example);
    setResult({ parsed, intent });
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">CommandBar NLP Parser Test</h1>
      
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">
          Enter natural language event description:
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleParse()}
            className="flex-1 px-3 py-2 border rounded-lg"
            placeholder="e.g., Meeting tomorrow at 3pm"
          />
          <button
            onClick={handleParse}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Parse
          </button>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Test Examples:</h2>
        <div className="grid gap-2">
          {testExamples.map((example, i) => (
            <button
              key={i}
              onClick={() => testExample(example)}
              className="text-left px-3 py-2 bg-gray-100 rounded hover:bg-gray-200"
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      {result && (
        <div className="space-y-4">
          <div className="p-4 bg-green-50 rounded-lg">
            <h3 className="font-semibold mb-2">Intent:</h3>
            <pre className="text-sm">{JSON.stringify(result.intent, null, 2)}</pre>
          </div>
          
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold mb-2">Parsed Event:</h3>
            <div className="space-y-1 text-sm">
              <div><strong>Title:</strong> {result.parsed.title || 'N/A'}</div>
              <div><strong>Start:</strong> {result.parsed.start ? result.parsed.start.toLocaleString() : 'N/A'}</div>
              <div><strong>End:</strong> {result.parsed.end ? result.parsed.end.toLocaleString() : 'N/A'}</div>
              <div><strong>Location:</strong> {result.parsed.location || 'N/A'}</div>
              <div><strong>Attendees:</strong> {result.parsed.attendees?.join(', ') || 'N/A'}</div>
              <div><strong>Category:</strong> {result.parsed.category}</div>
              <div><strong>Confidence:</strong> {(result.parsed.confidence * 100).toFixed(0)}%</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}