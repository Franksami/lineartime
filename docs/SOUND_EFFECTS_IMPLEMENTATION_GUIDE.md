# LinearTime Sound Effects Implementation Guide

## ✅ IMPLEMENTATION COMPLETE - January 26, 2025

**Status**: ✅ **COMPLETED**  
**Version**: v0.3.3  
**Duration**: 1-2 days (Streamlined from original 4-week plan)  
**Implementation**: use-sound React hook (simplified from direct Howler.js)  
**Documentation**: [PHASE_4.5_SOUND_EFFECTS_COMPLETE.md](../PHASE_4.5_SOUND_EFFECTS_COMPLETE.md)

> **✅ SUCCESS**: All sound effects features have been successfully implemented with streamlined architecture using use-sound React hook. See completion documentation for full details.

## Overview

This comprehensive guide details the step-by-step implementation of professional sound effects for LinearTime, ensuring tasteful, non-intrusive audio feedback that enhances the user experience without compromising professionalism.

**✅ IMPLEMENTATION NOTE**: The actual implementation was streamlined using the `use-sound` React hook instead of direct Howler.js integration, reducing complexity while maintaining all desired functionality.

## 🎯 Project Context

**Current Architecture:**
- Next.js 15 + React 19 + TypeScript
- Convex backend with real-time sync
- Enterprise-grade calendar integration platform
- Existing robust settings and notification systems
- PWA support with accessibility compliance

## 📋 Implementation Phases

### Phase 1: Foundation & Dependencies (Week 1)

#### 1.1 Install Audio Library
```bash
# Install Howler.js for Web Audio API support
pnpm add howler @types/howler

# Verify installation
pnpm list howler
```

#### 1.2 Update Settings Types
**File:** `lib/settings/types.ts`

```typescript
// Add to NotificationSettings interface
export interface NotificationSettings {
  enabled: boolean;
  eventReminders: boolean;
  reminderMinutes: number[];
  sound: boolean;
  // NEW: Enhanced sound controls
  soundVolume: number; // 0-1, default 0.3
  soundTypes: {
    eventCreated: boolean;   // default: true
    eventUpdated: boolean;   // default: true
    eventDeleted: boolean;   // default: true
    syncComplete: boolean;   // default: true
    syncError: boolean;      // default: true
    reminder: boolean;       // default: true
  };
  desktop: boolean;
  email: boolean;
  dailyDigest: boolean;
  dailyDigestTime: string;
}
```

#### 1.3 Create Sound Service
**File:** `lib/audio/SoundService.ts`

```typescript
import { Howl } from 'howler';

export type SoundType = 'success' | 'error' | 'notification' | 'subtle';

interface SoundConfig {
  src: string[];
  volume: number;
  preload: boolean;
}

class SoundService {
  private sounds: Map<SoundType, Howl> = new Map();
  private audioContext: AudioContext | null = null;
  private initialized = false;
  private enabled = false;
  private volume = 0.3;

  async initialize(settings: { enabled: boolean; volume: number }) {
    if (this.initialized) return;

    this.enabled = settings.enabled;
    this.volume = settings.volume;

    // Respect user preferences and accessibility
    if (!settings.enabled ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    // Initialize on first user gesture (required by browser autoplay policy)
    this.initializeAudioContext();
    this.loadSounds();
    this.initialized = true;
  }

  private initializeAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API not supported');
    }
  }

  private loadSounds() {
    const soundConfigs: Record<SoundType, SoundConfig> = {
      success: {
        src: ['/sounds/success.mp3', '/sounds/success.ogg'],
        volume: 0.25,
        preload: true
      },
      error: {
        src: ['/sounds/error.mp3', '/sounds/error.ogg'],
        volume: 0.18,
        preload: true
      },
      notification: {
        src: ['/sounds/notification.mp3', '/sounds/notification.ogg'],
        volume: 0.2,
        preload: true
      },
      subtle: {
        src: ['/sounds/subtle.mp3', '/sounds/subtle.ogg'],
        volume: 0.15,
        preload: true
      }
    };

    Object.entries(soundConfigs).forEach(([type, config]) => {
      const sound = new Howl({
        ...config,
        volume: config.volume * this.volume,
        html5: false, // Use Web Audio API
        onloaderror: () => console.warn(`Failed to load ${type} sound`)
      });
      this.sounds.set(type as SoundType, sound);
    });
  }

  play(type: SoundType, options?: { volume?: number }) {
    if (!this.enabled || !this.initialized) return;

    const sound = this.sounds.get(type);
    if (!sound) return;

    // Resume AudioContext if suspended (browser autoplay policy)
    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume();
    }

    if (options?.volume !== undefined) {
      sound.volume(options.volume * this.volume);
    }

    sound.play();
  }

  updateSettings(settings: { enabled: boolean; volume: number }) {
    this.enabled = settings.enabled;
    this.volume = settings.volume;

    // Update volume for all sounds
    this.sounds.forEach(sound => {
      const originalVolume = sound._volume; // Access original volume
      sound.volume(originalVolume * this.volume);
    });
  }

  destroy() {
    this.sounds.forEach(sound => sound.unload());
    this.sounds.clear();
    this.audioContext?.close();
    this.initialized = false;
  }
}

export const soundService = new SoundService();
```

#### 1.4 Create Sound Effects Hook
**File:** `hooks/useSoundEffects.ts`

```typescript
import { useCallback, useEffect } from 'react';
import { useSettingsContext } from '@/contexts/SettingsContext';
import { soundService, SoundType } from '@/lib/audio/SoundService';

export function useSoundEffects() {
  const { settings } = useSettingsContext();

  useEffect(() => {
    soundService.initialize({
      enabled: settings.notifications.sound,
      volume: settings.notifications.soundVolume || 0.3
    });
  }, [settings.notifications.sound, settings.notifications.soundVolume]);

  const playSound = useCallback((type: SoundType, options?: { volume?: number }) => {
    if (!settings.notifications.sound) return;
    soundService.play(type, options);
  }, [settings.notifications.sound]);

  return { playSound };
}
```

#### 1.5 Update Default Settings
**File:** `lib/settings/types.ts`

```typescript
export const createDefaultSettings = (): UserSettings => ({
  // ... existing settings
  notifications: {
    enabled: false, // Keep disabled by default for user choice
    eventReminders: true,
    reminderMinutes: [15],
    sound: false, // Disabled by default
    soundVolume: 0.3, // 30% volume
    soundTypes: {
      eventCreated: true,
      eventUpdated: true,
      eventDeleted: true,
      syncComplete: true,
      syncError: true,
      reminder: true
    },
    desktop: false,
    email: false,
    dailyDigest: false,
    dailyDigestTime: '08:00',
  },
  // ... rest of settings
});
```

### Phase 2: Enhanced Settings UI (Week 1-2)

#### 2.1 Update Notification Settings Component
**File:** `components/settings/sections/NotificationSettings.tsx`

```typescript
// Add these imports
import { Slider } from '@/components/ui/slider';

// Add volume control section after sound toggle
{notifications.sound && (
  <>
    {/* Volume Control */}
    <div className="space-y-2 ml-4">
      <Label htmlFor="soundVolume">Sound Volume</Label>
      <div className="flex items-center gap-3">
        <Slider
          id="soundVolume"
          min={0}
          max={1}
          step={0.1}
          value={[notifications.soundVolume || 0.3]}
          onValueChange={([value]) =>
            updateCategory('notifications', { soundVolume: value })
          }
          className="flex-1"
        />
        <span className="text-sm text-muted-foreground w-12">
          {Math.round((notifications.soundVolume || 0.3) * 100)}%
        </span>
      </div>
    </div>

    {/* Sound Types Configuration */}
    <div className="space-y-3 ml-4">
      <Label>Play sounds for:</Label>
      <div className="grid grid-cols-2 gap-3">
        {Object.entries({
          eventCreated: 'Event created',
          eventUpdated: 'Event updated',
          eventDeleted: 'Event deleted',
          syncComplete: 'Sync complete',
          syncError: 'Sync errors',
          reminder: 'Reminders'
        }).map(([key, label]) => (
          <div key={key} className="flex items-center space-x-2">
            <Switch
              id={key}
              checked={notifications.soundTypes?.[key] ?? true}
              onCheckedChange={(checked) =>
                updateCategory('notifications', {
                  soundTypes: { ...notifications.soundTypes, [key]: checked }
                })
              }
            />
            <Label htmlFor={key} className="text-sm">{label}</Label>
          </div>
        ))}
      </div>
    </div>
  </>
)}
```

#### 2.2 Add Slider Component (if not exists)
**File:** `components/ui/slider.tsx`

```typescript
import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center",
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
      <SliderPrimitive.Range className="absolute h-full bg-primary" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
```

### Phase 3: Event Integration Points (Week 2)

#### 3.1 Integrate with LinearCalendar Hook
**File:** `hooks/useLinearCalendar.ts`

```typescript
// Add import
import { useSoundEffects } from '@/hooks/useSoundEffects';

// Inside the hook
const { playSound } = useSoundEffects();

const handleEventSave = useCallback(async (event: Partial<Event>) => {
  try {
    if (event.id) {
      // Update existing event
      const dbEvent = dbEvents?.find(e => e.convexId === event.id || String(e.id) === event.id);
      if (dbEvent?.id) {
        await dbUpdateEvent(dbEvent.id, {
          title: event.title!,
          description: event.description,
          startTime: event.startDate!.getTime(),
          endTime: event.endDate?.getTime(),
          categoryId: event.category,
          location: event.location,
          allDay: event.allDay,
          recurrence: event.recurrence as any
        });
        // Play subtle sound for updates
        if (settings.notifications.sound && settings.notifications.soundTypes?.eventUpdated) {
          playSound('subtle');
        }
      }
    } else {
      // Create new event
      await dbCreateEvent({
        userId,
        title: event.title || '',
        description: event.description,
        startTime: (event.startDate || new Date()).getTime(),
        endTime: (event.endDate || event.startDate || new Date()).getTime(),
        categoryId: event.category || 'personal',
        location: event.location,
        allDay: event.allDay,
        recurrence: event.recurrence as any,
        syncStatus: 'local',
        lastModified: Date.now(),
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
      // Play success sound for creation
      if (settings.notifications.sound && settings.notifications.soundTypes?.eventCreated) {
        playSound('success');
      }
    }
  } catch (error) {
    // Play error sound on failure
    if (settings.notifications.sound && settings.notifications.soundTypes?.syncError) {
      playSound('error');
    }
    throw error;
  }
}, [dbEvents, dbCreateEvent, dbUpdateEvent, userId, playSound, settings.notifications]);

const handleEventDelete = useCallback(async (id: string) => {
  try {
    const dbEvent = dbEvents?.find(e => e.convexId === id || String(e.id) === id);
    if (dbEvent?.id) {
      await dbDeleteEvent(dbEvent.id);
      // Play subtle sound for deletion
      if (settings.notifications.sound && settings.notifications.soundTypes?.eventDeleted) {
        playSound('subtle', { volume: 0.5 }); // Quieter delete sound
      }
    }
  } catch (error) {
    // Play error sound on failure
    if (settings.notifications.sound && settings.notifications.soundTypes?.syncError) {
      playSound('error');
    }
    throw error;
  }
}, [dbEvents, dbDeleteEvent, playSound, settings.notifications]);
```

#### 3.2 Integrate with SyncedCalendar Hook
**File:** `hooks/useSyncedCalendar.ts`

```typescript
// Add import
import { useSoundEffects } from '@/hooks/useSoundEffects';

// Inside the hook
const { playSound } = useSoundEffects();

const handleEventSave = useCallback(async (event: Partial<SyncedEvent>) => {
  try {
    if (event.id) {
      // Update existing event
      await updateEvent({
        id: event.id as Id<"events">,
        title: event.title,
        description: event.description,
        startDate: event.startDate?.toISOString(),
        endDate: event.endDate?.toISOString(),
        category: event.category,
      });
      notify.success('Event updated');

      // Trigger sync if event is synced
      if (event.providerId) {
        const provider = providers?.find(p => p._id === event.providerId);
        if (provider) {
          await scheduleSync({
            provider: provider.provider,
            operation: 'event_update',
            priority: 10,
            data: { eventId: event.id },
          });
        }
      }
    } else {
      // Add new event
      await createEvent({
        title: event.title || '',
        startDate: event.startDate?.toISOString() || new Date().toISOString(),
        endDate: event.endDate?.toISOString() || new Date().toISOString(),
        category: event.category || 'personal',
        description: event.description,
      });
      notify.success('Event created');

      // Trigger sync for new events
      if (providers && providers.length > 0) {
        await scheduleSync({
          provider: providers[0].provider,
          operation: 'event_create',
          priority: 10,
        });
      }
    }

    // Play sound based on operation
    if (settings.notifications.sound) {
      if (event.id && settings.notifications.soundTypes?.eventUpdated) {
        playSound('subtle');
      } else if (!event.id && settings.notifications.soundTypes?.eventCreated) {
        playSound('success');
      }
    }
  } catch (error) {
    console.error('Error saving event:', error);
    notify.error('Failed to save event');
    if (settings.notifications.sound && settings.notifications.soundTypes?.syncError) {
      playSound('error');
    }
  }
}, [createEvent, updateEvent, providers, scheduleSync, playSound, settings.notifications]);
```

### Phase 4: Sync & Background Operations (Week 2-3)

#### 4.1 Create Sync Sound Manager
**File:** `lib/audio/SyncSoundManager.ts`

```typescript
import { soundService } from './SoundService';

export class SyncSoundManager {
  private static pendingSyncs = new Set<string>();

  static onSyncStart(syncId: string) {
    this.pendingSyncs.add(syncId);
  }

  static onSyncComplete(syncId: string, success: boolean) {
    if (!this.pendingSyncs.has(syncId)) return;

    this.pendingSyncs.delete(syncId);

    // Only play sound if this was the last pending sync
    if (this.pendingSyncs.size === 0) {
      soundService.play(success ? 'notification' : 'error', {
        volume: success ? 0.15 : 0.2
      });
    }
  }

  static onSyncError(syncId: string) {
    if (!this.pendingSyncs.has(syncId)) return;

    this.pendingSyncs.delete(syncId);

    // Always play error sound for sync failures
    soundService.play('error', { volume: 0.2 });
  }
}
```

#### 4.2 Integrate with Sync Operations
**File:** `convex/calendar/sync.ts`

```typescript
// Add import
import { SyncSoundManager } from '@/lib/audio/SyncSoundManager';

// In sync operation handlers
export const processSyncOperation = internalAction({
  args: { /* existing args */ },
  handler: async (ctx, args) => {
    const syncId = `sync_${args.userId}_${Date.now()}`;

    try {
      SyncSoundManager.onSyncStart(syncId);

      // ... existing sync logic ...

      // On success
      SyncSoundManager.onSyncComplete(syncId, true);

    } catch (error) {
      // On error
      SyncSoundManager.onSyncError(syncId);
      throw error;
    }
  }
});
```

#### 4.3 Update Notifications Context
**File:** `contexts/NotificationsContext.tsx`

```typescript
// Add sound integration to notification creation
const createNotification = useCallback((
  type: NotificationItem['type'],
  title: string,
  description?: string,
  options?: Partial<NotificationItem>
) => {
  if (!state.preferences.enabled || !state.preferences.types[type]) {
    return;
  }

  const source = options?.metadata?.source || 'user';
  if (!state.preferences.sources[source]) {
    return;
  }

  dispatch({
    type: 'ADD_NOTIFICATION',
    payload: {
      type,
      title,
      description,
      duration: options?.duration ?? state.preferences.defaultDuration,
      ...options
    }
  });

  // Play sound if enabled
  if (state.preferences.soundEnabled && state.preferences.types[type]) {
    const soundType = type === 'success' ? 'success' :
                     type === 'error' ? 'error' : 'notification';
    soundService.play(soundType);
  }
}, [state.preferences]);
```

### Phase 5: Sound Assets & Performance (Week 3)

#### 5.1 Sound Asset Specifications
Create `public/sounds/` directory with these files:

**success.mp3/ogg**
- Duration: 300ms
- Volume: -18 LUFS
- Characteristics: Soft ascending chime, pleasant completion feel

**error.mp3/ogg**
- Duration: 250ms
- Volume: -20 LUFS
- Characteristics: Gentle descending tone, non-alarming

**notification.mp3/ogg**
- Duration: 200ms
- Volume: -22 LUFS
- Characteristics: Subtle ping, neutral informative tone

**subtle.mp3/ogg**
- Duration: 150ms
- Volume: -24 LUFS
- Characteristics: Minimal click, barely perceptible

#### 5.2 Asset Optimization Script
**File:** `scripts/optimize-sounds.js`

```javascript
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const soundsDir = path.join(__dirname, '..', 'public', 'sounds');
const files = fs.readdirSync(soundsDir).filter(f => f.endsWith('.wav'));

files.forEach(file => {
  const input = path.join(soundsDir, file);
  const baseName = path.basename(file, '.wav');

  // Convert to MP3
  exec(`ffmpeg -i "${input}" -acodec libmp3lame -q:a 2 "${path.join(soundsDir, baseName + '.mp3')}"`);

  // Convert to OGG
  exec(`ffmpeg -i "${input}" -acodec libvorbis -q:a 4 "${path.join(soundsDir, baseName + '.ogg')}"`);
});
```

#### 5.3 Performance & Accessibility Service
**File:** `lib/audio/AudioAccessibility.ts`

```typescript
export class AudioAccessibility {
  static shouldPlaySounds(): boolean {
    // Respect user preferences
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const prefersReducedData = window.matchMedia('(prefers-reduced-data: reduce)').matches;

    return !prefersReducedMotion && !prefersReducedData;
  }

  static getVolumeMultiplier(): number {
    // Reduce volume in low-power mode or quiet environments
    if ('getBattery' in navigator) {
      // @ts-ignore - Battery API
      navigator.getBattery?.().then(battery => {
        return battery.charging ? 1.0 : 0.7;
      });
    }
    return 1.0;
  }

  static isAudioSupported(): boolean {
    return !!(window.AudioContext || window.webkitAudioContext);
  }
}
```

### Phase 6: Testing & Quality Assurance (Week 3-4)

#### 6.1 Automated Tests
**File:** `tests/sound-integration.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Sound Effects Integration', () => {
  test('sound settings are preserved across sessions', async ({ page }) => {
    // Enable sound in settings
    await page.goto('/settings');
    await page.click('[data-testid="sound-toggle"]');

    // Reload and verify setting persisted
    await page.reload();
    const toggle = await page.locator('[data-testid="sound-toggle"]');
    await expect(toggle).toBeChecked();
  });

  test('sounds respect user preferences', async ({ page }) => {
    // Mock audio context to prevent actual sound playback
    await page.addInitScript(() => {
      window.AudioContext = class MockAudioContext {
        state = 'running';
        resume() { return Promise.resolve(); }
        close() { return Promise.resolve(); }
      };
    });

    // Test event creation with sounds enabled
    await page.goto('/');
    // ... test implementation
  });

  test('sound volume controls work correctly', async ({ page }) => {
    await page.goto('/settings');

    // Enable sound
    await page.click('[data-testid="sound-toggle"]');

    // Adjust volume
    const slider = await page.locator('[data-testid="sound-volume-slider"]');
    await slider.fill('0.5');

    // Verify setting persisted
    await page.reload();
    await expect(slider).toHaveValue('0.5');
  });
});
```

#### 6.2 Manual Testing Checklist
- [ ] Sound plays on event creation
- [ ] Sound plays on event update
- [ ] Sound plays on event deletion
- [ ] Sound plays on sync completion
- [ ] Sound plays on sync error
- [ ] Volume slider adjusts playback volume
- [ ] Individual sound types can be disabled
- [ ] Sounds respect accessibility preferences
- [ ] No sounds play when master toggle is off
- [ ] Browser autoplay policy is handled correctly

#### 6.3 Performance Testing
**File:** `tests/sound-performance.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Sound Performance', () => {
  test('sound initialization does not block page load', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/');

    // Page should load within 2 seconds
    await page.waitForLoadState('domcontentloaded');
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(2000);
  });

  test('sound files load efficiently', async ({ page }) => {
    // Mock network to measure sound file loading
    const requests: string[] = [];
    page.on('request', request => {
      if (request.url().includes('/sounds/')) {
        requests.push(request.url());
      }
    });

    await page.goto('/settings');
    await page.click('[data-testid="sound-toggle"]');

    // Should load sound files
    await page.waitForTimeout(1000);

    // Verify sound files were requested
    expect(requests.length).toBeGreaterThan(0);
  });
});
```

### Phase 7: Documentation & Deployment (Week 4)

#### 7.1 Update Documentation
**File:** `docs/SOUND_IMPLEMENTATION.md`

```markdown
# Sound Effects Implementation

## Overview
LinearTime includes optional sound effects to enhance user feedback while maintaining professionalism.

## Features
- Tasteful, non-intrusive sounds for key interactions
- User-controlled volume and sound type preferences
- Accessibility-compliant with reduced motion support
- Performance-optimized with lazy loading

## Settings
Users can configure sound effects in Settings > Notifications:
- Master sound toggle
- Volume control (0-100%)
- Individual sound type toggles
- Respects system accessibility preferences

## Sound Types
- **Success**: Soft chime for event creation
- **Error**: Gentle tone for failures
- **Notification**: Subtle ping for sync completion
- **Subtle**: Minimal feedback for updates/deletions

## Technical Details
- Uses Howler.js for cross-browser Web Audio API support
- Sounds are optional and disabled by default
- Assets are optimized MP3/OGG format (<30KB each)
- Integrates with existing notification system
```

#### 7.2 Add to CHANGELOG
**File:** `docs/CHANGELOG.md`

```markdown
## [v2.7.0] - Sound Effects Enhancement

### Added
- Professional sound effects for user interactions
- Enhanced notification settings with sound controls
- Accessibility-compliant audio preferences
- Performance-optimized sound asset delivery

### Features
- Optional sound feedback for event operations
- User-controlled volume and sound type preferences
- Browser autoplay policy compliance
- Reduced motion preference respect

### Technical
- Howler.js integration for Web Audio API
- Optimized sound assets (MP3/OGG format)
- Lazy loading and caching for performance
- Cross-browser compatibility testing
```

## 📋 Implementation Checklist

### Pre-Implementation
- [ ] Review browser autoplay policies
- [ ] Source professional sound assets
- [ ] Test sound quality and volume normalization
- [ ] Verify accessibility compliance

### Phase 1: Foundation
- [ ] Install Howler.js dependency
- [ ] Create SoundService class
- [ ] Implement useSoundEffects hook
- [ ] Update settings types
- [ ] Test basic sound playback

### Phase 2: Settings UI
- [ ] Enhance NotificationSettings component
- [ ] Add volume slider control
- [ ] Implement sound type toggles
- [ ] Test settings persistence

### Phase 3: Event Integration
- [ ] Integrate with useLinearCalendar
- [ ] Integrate with useSyncedCalendar
- [ ] Add sound feedback to event modals
- [ ] Test event operation sounds

### Phase 4: Background Operations
- [ ] Create SyncSoundManager
- [ ] Integrate with sync operations
- [ ] Update NotificationsContext
- [ ] Test sync sound feedback

### Phase 5: Assets & Performance
- [ ] Optimize and add sound assets
- [ ] Implement AudioAccessibility service
- [ ] Add performance monitoring
- [ ] Test asset loading performance

### Phase 6: Testing & QA
- [ ] Create automated tests
- [ ] Manual testing across devices
- [ ] Accessibility testing
- [ ] Performance validation

### Phase 7: Documentation & Release
- [ ] Update implementation docs
- [ ] Add user documentation
- [ ] Update CHANGELOG
- [ ] Final integration testing

## 🔧 Technical Requirements

### Browser Support
- Chrome 60+ (Web Audio API)
- Firefox 55+ (Web Audio API)
- Safari 14+ (Web Audio API)
- Edge 79+ (Web Audio API)

### Performance Targets
- Sound initialization: <50ms
- Playback latency: <100ms
- Memory usage: <5MB
- Bundle size increase: <20KB

### Accessibility Requirements
- Respects `prefers-reduced-motion`
- Keyboard accessible controls
- Screen reader compatible
- Visual alternatives available

## 🚨 Important Notes

### Browser Autoplay Policy
- Sounds only play after user gesture
- AudioContext must be resumed on first interaction
- No autoplay on page load

### User Experience
- Sounds disabled by default (user choice)
- Volume starts at 30% (gentle)
- Individual sound types can be disabled
- Settings persist across sessions

### Error Handling
- Graceful degradation if Web Audio API unavailable
- No blocking errors if sound files fail to load
- Console warnings for debugging (production silent)

## 📞 Support & Maintenance

### Monitoring
- Track sound usage metrics
- Monitor performance impact
- Collect user feedback on sound preferences

### Future Enhancements
- Custom sound pack support
- Advanced audio processing
- Spatial audio for complex interactions

---

This guide provides comprehensive step-by-step instructions for implementing professional sound effects in LinearTime. Follow each phase sequentially and test thoroughly before proceeding to the next phase.
