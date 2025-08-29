# Command Center Calendar Workshop Templates

Interactive workshop materials and hands-on lab templates for Command Center Calendar training sessions.

## 🎯 Workshop Facilitation Guide

### Pre-Workshop Preparation Checklist

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      WORKSHOP PREPARATION CHECKLIST                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  □ Technical Setup (1 week before)                                           │
│    □ Provision workshop environments                                         │
│    □ Test all demo accounts                                                  │
│    □ Verify network connectivity                                             │
│    □ Prepare backup environments                                             │
│                                                                               │
│  □ Materials Preparation (3 days before)                                     │
│    □ Print workshop handouts                                                 │
│    □ Prepare slide decks                                                     │
│    □ Create participant folders                                              │
│    □ Test all exercises                                                      │
│                                                                               │
│  □ Participant Communication (2 days before)                                 │
│    □ Send prerequisites checklist                                            │
│    □ Share setup instructions                                                │
│    □ Confirm attendance                                                      │
│    □ Distribute pre-reading materials                                        │
│                                                                               │
│  □ Day of Workshop                                                           │
│    □ Arrive 1 hour early                                                     │
│    □ Test A/V equipment                                                      │
│    □ Setup workstations                                                      │
│    □ Prepare refreshments                                                    │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 🛠️ Interactive Workshop Templates

### Template 1: Feature Development Workshop

**Duration**: 3 hours  
**Participants**: 5-15 developers  
**Format**: Hands-on coding session

#### Workshop Structure

```typescript
// workshop-config.ts
export const featureDevelopmentWorkshop = {
  metadata: {
    title: 'Building Features in Command Center Calendar',
    duration: '3 hours',
    maxParticipants: 15,
    difficulty: 'intermediate',
    prerequisites: [
      'Basic React knowledge',
      'TypeScript familiarity',
      'Command Center Calendar environment setup'
    ]
  },
  
  schedule: [
    {
      time: '0:00-0:15',
      activity: 'Introduction & Setup Verification',
      type: 'presentation',
      materials: ['slides/intro.pdf', 'checklist.md']
    },
    {
      time: '0:15-0:45',
      activity: 'Feature Planning Exercise',
      type: 'group-exercise',
      materials: ['planning-template.md', 'user-stories.md']
    },
    {
      time: '0:45-1:30',
      activity: 'Hands-on Implementation',
      type: 'coding',
      materials: ['starter-code.zip', 'api-reference.md']
    },
    {
      time: '1:30-1:45',
      activity: 'Break & Discussion',
      type: 'break',
      materials: []
    },
    {
      time: '1:45-2:30',
      activity: 'Testing & Refinement',
      type: 'coding',
      materials: ['test-templates.ts', 'quality-checklist.md']
    },
    {
      time: '2:30-2:45',
      activity: 'Code Review Session',
      type: 'review',
      materials: ['review-guidelines.md']
    },
    {
      time: '2:45-3:00',
      activity: 'Wrap-up & Q&A',
      type: 'discussion',
      materials: ['feedback-form.md', 'resources.md']
    }
  ],
  
  exercises: {
    planning: {
      title: 'Feature Planning Exercise',
      objective: 'Design a new calendar feature from requirements to implementation plan',
      deliverables: [
        'User story document',
        'Component hierarchy diagram',
        'API endpoint specifications',
        'Test plan outline'
      ]
    },
    implementation: {
      title: 'Build a Smart Scheduling Assistant',
      objective: 'Implement an AI-powered scheduling suggestion feature',
      starterCode: 'exercises/smart-scheduler-starter.tsx',
      solution: 'solutions/smart-scheduler-complete.tsx',
      checkpoints: [
        'Basic UI component created',
        'API integration working',
        'AI suggestions displayed',
        'User interactions handled',
        'Tests passing'
      ]
    }
  }
};
```

#### Hands-On Exercise: Smart Scheduling Assistant

```tsx
// exercises/smart-scheduler-starter.tsx
/**
 * Workshop Exercise: Smart Scheduling Assistant
 * 
 * Goal: Build a feature that suggests optimal meeting times based on:
 * - Participant availability
 * - Meeting patterns
 * - Time zone considerations
 * - Focus time protection
 */

import React, { useState, useEffect } from 'react';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import { useAI } from '@/hooks/useAI';

interface SmartSchedulerProps {
  participants: string[];
  duration: number; // in minutes
  preferences?: {
    preferredTimes?: string[];
    avoidTimes?: string[];
    timezone?: string;
  };
}

export function SmartScheduler({ 
  participants, 
  duration, 
  preferences 
}: SmartSchedulerProps) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const { events } = useCalendarEvents();
  const { generateSuggestions } = useAI();
  
  // TODO: Exercise 1 - Fetch participant availability
  const fetchAvailability = async () => {
    // Implement:
    // 1. Query each participant's calendar
    // 2. Identify busy times
    // 3. Calculate available slots
  };
  
  // TODO: Exercise 2 - Generate AI suggestions
  const generateSmartSuggestions = async () => {
    // Implement:
    // 1. Analyze meeting patterns
    // 2. Consider time zones
    // 3. Protect focus time
    // 4. Rank suggestions by score
  };
  
  // TODO: Exercise 3 - Handle user selection
  const handleTimeSelection = (suggestion) => {
    // Implement:
    // 1. Create calendar event
    // 2. Send invitations
    // 3. Handle conflicts
    // 4. Show confirmation
  };
  
  // TODO: Exercise 4 - Add visual feedback
  return (
    <div className="smart-scheduler">
      {/* Implement UI:
          1. Loading state
          2. Suggestion cards
          3. Conflict warnings
          4. Booking confirmation
      */}
    </div>
  );
}

// Test cases to implement
describe('SmartScheduler', () => {
  it('should fetch participant availability', async () => {
    // TODO: Write test
  });
  
  it('should generate relevant suggestions', async () => {
    // TODO: Write test
  });
  
  it('should handle time zone differences', () => {
    // TODO: Write test
  });
  
  it('should protect focus time blocks', () => {
    // TODO: Write test
  });
});
```

### Template 2: Performance Optimization Lab

**Duration**: 2.5 hours  
**Format**: Problem-solving workshop

#### Performance Lab Structure

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     PERFORMANCE OPTIMIZATION LAB                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  SCENARIO: Command Center Calendar is experiencing performance issues with 10,000+ events │
│                                                                               │
│  CURRENT METRICS:                                                            │
│  • Initial Load: 8.2s                                                        │
│  • Time to Interactive: 12.5s                                                │
│  • Memory Usage: 450MB                                                       │
│  • FPS during scroll: 22fps                                                  │
│                                                                               │
│  TARGET METRICS:                                                             │
│  • Initial Load: <3s                                                         │
│  • Time to Interactive: <5s                                                  │
│  • Memory Usage: <150MB                                                      │
│  • FPS during scroll: 60fps                                                  │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Lab Exercises

```typescript
// performance-lab-exercises.ts

/**
 * Lab Exercise 1: Profiling & Analysis (30 minutes)
 */
export const exercise1 = {
  title: 'Performance Profiling',
  tools: ['Chrome DevTools', 'React Profiler', 'Lighthouse'],
  tasks: [
    {
      step: 1,
      description: 'Record initial performance baseline',
      deliverable: 'performance-baseline.json',
      instructions: `
        1. Open Chrome DevTools Performance tab
        2. Start recording
        3. Load calendar with 10,000 events
        4. Stop recording after 30 seconds
        5. Export profile
      `
    },
    {
      step: 2,
      description: 'Identify bottlenecks',
      deliverable: 'bottleneck-analysis.md',
      checklist: [
        'Long tasks (>50ms)',
        'Render-blocking resources',
        'Memory leaks',
        'Unnecessary re-renders'
      ]
    },
    {
      step: 3,
      description: 'Create optimization plan',
      deliverable: 'optimization-strategy.md',
      template: `
        ## Optimization Strategy
        
        ### Critical Issues
        1. [Issue]: [Impact] - [Proposed Solution]
        
        ### Quick Wins
        1. [Optimization]: [Expected Improvement]
        
        ### Long-term Improvements
        1. [Major Change]: [Timeline] - [Resources Needed]
      `
    }
  ]
};

/**
 * Lab Exercise 2: Virtual Scrolling Implementation (45 minutes)
 */
export const exercise2 = {
  title: 'Implement Virtual Scrolling',
  starter: `
    // Current implementation (inefficient)
    function CalendarEventList({ events }) {
      return (
        <div className="event-list">
          {events.map(event => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      );
    }
  `,
  
  solution: `
    // Optimized with virtual scrolling
    import { FixedSizeList } from 'react-window';
    
    function CalendarEventList({ events }) {
      const Row = ({ index, style }) => (
        <div style={style}>
          <EventCard event={events[index]} />
        </div>
      );
      
      return (
        <FixedSizeList
          height={600}
          itemCount={events.length}
          itemSize={80}
          width="100%"
        >
          {Row}
        </FixedSizeList>
      );
    }
  `,
  
  benchmarks: {
    before: {
      renderTime: '2500ms',
      memoryUsage: '180MB',
      fps: '22'
    },
    after: {
      renderTime: '120ms',
      memoryUsage: '45MB',
      fps: '60'
    }
  }
};

/**
 * Lab Exercise 3: Code Splitting & Lazy Loading (30 minutes)
 */
export const exercise3 = {
  title: 'Implement Code Splitting',
  objective: 'Reduce initial bundle size by 60%',
  
  steps: [
    {
      task: 'Analyze bundle composition',
      command: 'npm run analyze',
      expected: 'Identify large dependencies'
    },
    {
      task: 'Implement route-based splitting',
      code: `
        // Before
        import Analytics from './Analytics';
        import Settings from './Settings';
        
        // After
        const Analytics = lazy(() => import('./Analytics'));
        const Settings = lazy(() => import('./Settings'));
      `
    },
    {
      task: 'Add loading boundaries',
      code: `
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Suspense>
      `
    }
  ],
  
  validation: {
    metric: 'bundle-size',
    before: '2.4MB',
    target: '<1MB',
    actual: '___' // To be filled during workshop
  }
};

/**
 * Lab Exercise 4: Memory Optimization (45 minutes)
 */
export const exercise4 = {
  title: 'Memory Leak Detection & Fix',
  
  scenario: `
    The calendar component is leaking memory when switching between views.
    After 10 view changes, memory usage increases by 200MB.
  `,
  
  investigation: [
    'Use Chrome Memory Profiler',
    'Take heap snapshots',
    'Compare snapshots',
    'Identify retained objects'
  ],
  
  commonLeaks: [
    {
      type: 'Event listener leak',
      detection: 'Increasing listener count',
      fix: 'Cleanup in useEffect'
    },
    {
      type: 'Closure leak',
      detection: 'Retained contexts',
      fix: 'WeakMap for references'
    },
    {
      type: 'Timer leak',
      detection: 'Active timers after unmount',
      fix: 'Clear timers in cleanup'
    }
  ],
  
  solution: `
    // Example fix for event listener leak
    useEffect(() => {
      const handleResize = () => {
        // Handle resize
      };
      
      window.addEventListener('resize', handleResize);
      
      // Critical: Cleanup function
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }, []);
  `
};
```

### Template 3: Security Workshop

**Duration**: 4 hours  
**Format**: Threat modeling and hands-on security implementation

#### Security Workshop Agenda

```yaml
security_workshop:
  title: "Command Center Calendar Security Implementation Workshop"
  duration: "4 hours"
  modules:
    - module_1:
        title: "Threat Modeling"
        duration: "60 minutes"
        activities:
          - STRIDE analysis
          - Attack vector identification
          - Risk scoring matrix
          - Mitigation planning
          
    - module_2:
        title: "Input Validation & Sanitization"
        duration: "60 minutes"
        hands_on:
          - XSS prevention
          - SQL injection defense
          - CSRF protection
          - File upload security
          
    - module_3:
        title: "Authentication & Authorization"
        duration: "60 minutes"
        implementation:
          - OAuth 2.0 flow
          - JWT best practices
          - Session management
          - MFA implementation
          
    - module_4:
        title: "Data Protection"
        duration: "60 minutes"
        exercises:
          - Encryption at rest
          - Encryption in transit
          - Key management
          - PII handling
```

#### Security Lab Exercises

```typescript
// security-workshop-exercises.ts

/**
 * Security Exercise 1: Input Validation
 * Prevent XSS attacks in user-generated content
 */
export const xssPreventionExercise = {
  vulnerable: `
    // VULNERABLE CODE - DO NOT USE IN PRODUCTION
    function EventDescription({ description }) {
      return (
        <div dangerouslySetInnerHTML={{ __html: description }} />
      );
    }
  `,
  
  secure: `
    // SECURE IMPLEMENTATION
    import DOMPurify from 'dompurify';
    
    function EventDescription({ description }) {
      const sanitized = DOMPurify.sanitize(description, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'],
        ALLOWED_ATTR: ['href']
      });
      
      return (
        <div dangerouslySetInnerHTML={{ __html: sanitized }} />
      );
    }
  `,
  
  testCases: [
    {
      input: '<script>alert("XSS")</script>',
      expected: 'Text only, no script execution'
    },
    {
      input: '<img src=x onerror=alert("XSS")>',
      expected: 'Image tag removed'
    },
    {
      input: '<a href="javascript:alert(\'XSS\')">Click</a>',
      expected: 'JavaScript protocol removed'
    }
  ]
};

/**
 * Security Exercise 2: API Rate Limiting
 * Implement rate limiting to prevent abuse
 */
export const rateLimitingExercise = {
  task: 'Implement token bucket rate limiting',
  
  implementation: `
    class TokenBucketRateLimiter {
      private tokens: number;
      private lastRefill: number;
      private readonly capacity: number;
      private readonly refillRate: number;
      
      constructor(capacity: number, refillPerSecond: number) {
        this.capacity = capacity;
        this.tokens = capacity;
        this.refillRate = refillPerSecond;
        this.lastRefill = Date.now();
      }
      
      consume(tokens: number = 1): boolean {
        this.refill();
        
        if (this.tokens >= tokens) {
          this.tokens -= tokens;
          return true;
        }
        
        return false;
      }
      
      private refill(): void {
        const now = Date.now();
        const timePassed = (now - this.lastRefill) / 1000;
        const tokensToAdd = timePassed * this.refillRate;
        
        this.tokens = Math.min(
          this.capacity,
          this.tokens + tokensToAdd
        );
        this.lastRefill = now;
      }
    }
  `,
  
  usage: `
    // Middleware implementation
    const limiter = new TokenBucketRateLimiter(100, 10);
    
    export function rateLimitMiddleware(req, res, next) {
      const userId = req.user?.id || req.ip;
      const userLimiter = limiters.get(userId) || new TokenBucketRateLimiter(100, 10);
      
      if (!userLimiter.consume()) {
        return res.status(429).json({
          error: 'Too many requests',
          retryAfter: 10
        });
      }
      
      next();
    }
  `
};

/**
 * Security Exercise 3: Encryption Implementation
 * Implement field-level encryption for sensitive data
 */
export const encryptionExercise = {
  title: 'Field-Level Encryption',
  
  requirements: [
    'Encrypt PII fields before storage',
    'Decrypt on authorized access',
    'Key rotation support',
    'Audit trail for access'
  ],
  
  implementation: `
    import crypto from 'crypto';
    
    class FieldEncryption {
      private algorithm = 'aes-256-gcm';
      private keyDerivationSalt: Buffer;
      
      constructor(private masterKey: string) {
        this.keyDerivationSalt = crypto.randomBytes(32);
      }
      
      encrypt(plaintext: string, context: string): EncryptedField {
        const iv = crypto.randomBytes(16);
        const key = this.deriveKey(context);
        const cipher = crypto.createCipheriv(this.algorithm, key, iv);
        
        let encrypted = cipher.update(plaintext, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        const authTag = cipher.getAuthTag();
        
        return {
          ciphertext: encrypted,
          iv: iv.toString('hex'),
          authTag: authTag.toString('hex'),
          algorithm: this.algorithm,
          keyVersion: 1
        };
      }
      
      decrypt(encrypted: EncryptedField, context: string): string {
        const key = this.deriveKey(context);
        const decipher = crypto.createDecipheriv(
          this.algorithm,
          key,
          Buffer.from(encrypted.iv, 'hex')
        );
        
        decipher.setAuthTag(Buffer.from(encrypted.authTag, 'hex'));
        
        let decrypted = decipher.update(encrypted.ciphertext, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
      }
      
      private deriveKey(context: string): Buffer {
        return crypto.pbkdf2Sync(
          this.masterKey,
          this.keyDerivationSalt + context,
          100000,
          32,
          'sha256'
        );
      }
    }
  `,
  
  testing: `
    describe('Field Encryption', () => {
      it('should encrypt and decrypt successfully', () => {
        const encryption = new FieldEncryption('master-key');
        const plaintext = 'sensitive-data';
        const context = 'user-123';
        
        const encrypted = encryption.encrypt(plaintext, context);
        const decrypted = encryption.decrypt(encrypted, context);
        
        expect(decrypted).toBe(plaintext);
        expect(encrypted.ciphertext).not.toBe(plaintext);
      });
      
      it('should fail with wrong context', () => {
        const encryption = new FieldEncryption('master-key');
        const encrypted = encryption.encrypt('data', 'context-1');
        
        expect(() => {
          encryption.decrypt(encrypted, 'context-2');
        }).toThrow();
      });
    });
  `
};
```

## 🎓 Facilitator Resources

### Facilitator Guide Template

```markdown
# Workshop Facilitator Guide

## Pre-Workshop Setup (T-24 hours)

### Environment Preparation
- [ ] Clone workshop repository
- [ ] Run setup script: `npm run workshop:setup`
- [ ] Verify all participant accounts active
- [ ] Test screen sharing and audio
- [ ] Prepare backup slides (offline capable)

### Participant Requirements Email Template
```
Subject: Command Center Calendar Workshop - Setup Instructions

Hi [Name],

Looking forward to seeing you at tomorrow's Command Center Calendar workshop!

Please complete these setup steps before the session:

1. Install required software:
   - Node.js 18+ (https://nodejs.org)
   - VS Code (https://code.visualstudio.com)
   - Git (https://git-scm.com)

2. Clone the workshop repository:
   git clone https://github.com/lineartime/workshop-materials
   cd workshop-materials
   npm install

3. Verify your setup:
   npm run verify

4. Review pre-reading materials (attached)

If you encounter any issues, please reach out before the workshop.

See you tomorrow!
[Facilitator Name]
```

### During Workshop

#### Time Management
- Use a visible timer
- Announce transitions 2 minutes before
- Build in buffer time for questions
- Have backup exercises for fast finishers

#### Engagement Techniques
- Pair programming for complex exercises
- Regular check-ins every 30 minutes
- Use polls for quick understanding checks
- Encourage questions in chat/verbally

#### Troubleshooting Common Issues
```javascript
// common-issues.js
const workshopIssues = {
  'npm install fails': {
    solution: 'Clear npm cache: npm cache clean --force',
    alternative: 'Use yarn instead: yarn install'
  },
  
  'Port 3000 in use': {
    solution: 'Kill process: lsof -ti:3000 | xargs kill -9',
    alternative: 'Use different port: PORT=3001 npm run dev'
  },
  
  'Convex connection error': {
    solution: 'Check NEXT_PUBLIC_CONVEX_URL in .env',
    alternative: 'Use mock data: npm run dev:mock'
  },
  
  'TypeScript errors': {
    solution: 'Restart TS server in VS Code',
    alternative: 'Run: npm run typecheck'
  }
};
```

### Post-Workshop

#### Follow-up Email Template
```
Subject: Command Center Calendar Workshop - Resources & Next Steps

Thank you for participating in today's Command Center Calendar workshop!

## Key Resources
- Workshop materials: [repo link]
- Recording: [video link]
- Slides: [presentation link]
- Solution code: [solutions branch]

## Your Next Steps
1. Complete the homework exercise (due Friday)
2. Join our Slack channel: #lineartime-dev
3. Schedule 1:1 if you have questions
4. Register for next workshop: [Advanced Topics]

## Feedback
Please complete our 2-minute survey: [survey link]

Happy coding!
[Facilitator Name]
```

## 📊 Workshop Metrics & Success Criteria

### Success Metrics Dashboard

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        WORKSHOP SUCCESS METRICS                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ENGAGEMENT METRICS                                                          │
│  ├─ Attendance Rate: >90%                                                    │
│  ├─ Completion Rate: >85%                                                    │
│  ├─ Q&A Participation: >60%                                                  │
│  └─ Exercise Submission: >80%                                                │
│                                                                               │
│  LEARNING OUTCOMES                                                           │
│  ├─ Pre/Post Assessment: >30% improvement                                    │
│  ├─ Hands-on Success: >75% complete exercises                               │
│  ├─ Code Quality: Meets standards                                            │
│  └─ Concept Application: Can explain to others                               │
│                                                                               │
│  SATISFACTION SCORES                                                         │
│  ├─ Overall Rating: >4.5/5                                                   │
│  ├─ Content Relevance: >4.6/5                                                │
│  ├─ Facilitator Effectiveness: >4.7/5                                        │
│  └─ Would Recommend: >95%                                                    │
│                                                                               │
│  FOLLOW-UP ACTIONS                                                           │
│  ├─ Additional Resources Requested: Track topics                             │
│  ├─ 1:1 Sessions Scheduled: Within 1 week                                    │
│  ├─ Slack Channel Activity: Daily participation                              │
│  └─ Next Workshop Registration: >50%                                         │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start Templates

### 30-Minute Lightning Workshop Template

```typescript
// lightning-workshop.ts
export const lightningWorkshop = {
  format: '30-minute focused session',
  structure: [
    { time: '0-5', activity: 'Problem introduction' },
    { time: '5-20', activity: 'Guided implementation' },
    { time: '20-25', activity: 'Solution review' },
    { time: '25-30', activity: 'Q&A and resources' }
  ],
  
  topics: [
    'Quick Wins: React Performance',
    'Security: Input Validation',
    'Feature: Adding a new component',
    'Debugging: Common issues',
    'Testing: Writing your first test'
  ],
  
  materials: {
    minimal: true,
    slides: '5-10 slides',
    code: 'Single file exercise',
    followUp: 'Resource links'
  }
};
```

### Virtual Workshop Best Practices

```markdown
## Virtual Workshop Guidelines

### Technical Setup
- Use dual monitors (share one, facilitate on other)
- Have backup internet connection ready
- Record session for absent participants
- Test all tools 30 minutes before start

### Engagement Strategies
- Start with icebreaker/check-in
- Use breakout rooms for pair programming
- Regular polls and reactions
- Encourage camera use (not mandatory)
- Shared document for questions

### Accessibility Considerations
- Provide captions/transcription
- Share materials in advance
- Offer multiple ways to participate
- Record for async viewing
- Use clear, high-contrast visuals
```

## 📚 Resource Library

### Workshop Materials Repository Structure

```
workshop-materials/
├── slides/               # Presentation decks
├── exercises/           # Hands-on exercises
├── solutions/           # Exercise solutions
├── templates/           # Starter code templates
├── scripts/             # Setup and utility scripts
├── recordings/          # Workshop video recordings
├── feedback/            # Feedback forms and results
└── resources/           # Additional learning materials
```

This completes the comprehensive workshop templates with facilitator guides, interactive exercises, and success metrics!