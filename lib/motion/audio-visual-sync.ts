/**
 * Audio-Visual Sync System
 * Coordinates motion timing with sound effects for cohesive UX
 * Integrates with existing sound service and settings context
 */

'use client';

import type { NotificationSettings } from '../settings/types';
import { type SoundType, useSoundEffects } from '../sound-service';
import { getMotionTokens } from './motion-system';

// Audio-visual sync configuration
export interface AudioVisualSyncConfig {
  sound: SoundType;
  timing: 'start' | 'middle' | 'end' | 'parallel';
  delay?: number;
  volume?: number;
  fadeDuration?: number;
  spatialAudio?: boolean;
}

// Timing coordination for different animation types
export const ANIMATION_AUDIO_MAPPING = {
  // Feedback motions (≤150ms) - immediate audio feedback
  buttonPress: {
    sound: 'success' as SoundType,
    timing: 'start' as const,
    delay: 0,
    volume: 0.1,
  },
  buttonHover: {
    sound: 'notification' as SoundType,
    timing: 'start' as const,
    delay: 0,
    volume: 0.05,
  },

  // Interface motions (200-300ms) - coordinated timing
  modalOpen: {
    sound: 'notification' as SoundType,
    timing: 'end' as const,
    delay: 50,
    volume: 0.2,
  },
  modalClose: {
    sound: 'success' as SoundType,
    timing: 'middle' as const,
    delay: 0,
    volume: 0.15,
  },
  drawerSlide: {
    sound: 'notification' as SoundType,
    timing: 'parallel' as const,
    delay: 0,
    volume: 0.1,
  },

  // Page transitions (250-400ms) - orchestrated audio
  pageEnter: {
    sound: 'success' as SoundType,
    timing: 'middle' as const,
    delay: 100,
    volume: 0.15,
  },
  pageExit: {
    sound: 'notification' as SoundType,
    timing: 'start' as const,
    delay: 0,
    volume: 0.1,
  },

  // Calendar-specific animations
  eventCreate: {
    sound: 'success' as SoundType,
    timing: 'end' as const,
    delay: 0,
    volume: 0.2,
  },
  eventUpdate: {
    sound: 'notification' as SoundType,
    timing: 'middle' as const,
    delay: 0,
    volume: 0.1,
  },
  eventDelete: {
    sound: 'error' as SoundType,
    timing: 'start' as const,
    delay: 0,
    volume: 0.15,
  },
} as const;

export type AnimationSoundMapping = keyof typeof ANIMATION_AUDIO_MAPPING;

/**
 * Enhanced audio-visual sync engine
 */
export class AudioVisualSyncEngine {
  private settings: NotificationSettings | null = null;
  private activeAnimations = new Map<
    string,
    {
      audioTimeout?: NodeJS.Timeout;
      fadeTimeout?: NodeJS.Timeout;
    }
  >();
  private motionTokens = getMotionTokens();

  constructor(settings?: NotificationSettings) {
    this.settings = settings || null;
  }

  updateSettings(settings: NotificationSettings) {
    this.settings = settings;
  }

  /**
   * Calculate precise timing for audio-visual sync
   */
  calculateSyncTiming(animationDuration: number, config: AudioVisualSyncConfig): number {
    switch (config.timing) {
      case 'start':
        return config.delay || 0;
      case 'middle':
        return animationDuration / 2 + (config.delay || 0);
      case 'end':
        return animationDuration + (config.delay || 0);
      case 'parallel':
        return config.delay || 0;
      default:
        return 0;
    }
  }

  /**
   * Play sound with animation coordination
   */
  private async playSound(config: AudioVisualSyncConfig): Promise<void> {
    if (!this.settings?.sound || this.prefersReducedMotion()) {
      return;
    }

    if (!this.settings.soundTypes[config.sound]) {
      return;
    }

    try {
      const audio = new Audio(`/sounds/${config.sound}.mp3`);
      audio.volume = (config.volume || 0.3) * (this.settings.soundVolume || 0.3);

      // Spatial audio simulation (simple left-right panning)
      if (config.spatialAudio && 'createStereoPanner' in AudioContext.prototype) {
        const audioContext = new AudioContext();
        const source = audioContext.createMediaElementSource(audio);
        const panner = audioContext.createStereoPanner();
        panner.pan.value = 0; // Center for now, could be dynamic
        source.connect(panner).connect(audioContext.destination);
      }

      // Fade-in effect
      if (config.fadeDuration && config.fadeDuration > 0) {
        audio.volume = 0;
        await audio.play();

        const fadeSteps = 20;
        const stepDuration = config.fadeDuration / fadeSteps;
        const volumeStep =
          ((config.volume || 0.3) * (this.settings.soundVolume || 0.3)) / fadeSteps;

        for (let i = 0; i < fadeSteps; i++) {
          setTimeout(() => {
            audio.volume = volumeStep * (i + 1);
          }, stepDuration * i);
        }
      } else {
        await audio.play();
      }
    } catch (error) {
      console.warn(`Failed to play ${config.sound} sound:`, error);
    }
  }

  /**
   * Coordinate animation with sound effect
   */
  syncAnimationWithAudio(
    animationId: string,
    animationDuration: number,
    config: AudioVisualSyncConfig
  ): void {
    // Clean up any existing sync for this animation
    this.cleanup(animationId);

    const syncTiming = this.calculateSyncTiming(animationDuration, config);
    const animationState = { audioTimeout: undefined, fadeTimeout: undefined };

    // Schedule audio playback
    animationState.audioTimeout = setTimeout(() => {
      this.playSound(config);
    }, syncTiming);

    this.activeAnimations.set(animationId, animationState);

    // Auto-cleanup after animation completes
    setTimeout(() => {
      this.cleanup(animationId);
    }, animationDuration + 1000); // Extra buffer for audio completion
  }

  /**
   * Use predefined animation-audio mapping
   */
  syncWithPreset(
    animationId: string,
    animationDuration: number,
    preset: AnimationSoundMapping,
    overrides?: Partial<AudioVisualSyncConfig>
  ): void {
    const config = {
      ...ANIMATION_AUDIO_MAPPING[preset],
      ...overrides,
    };

    this.syncAnimationWithAudio(animationId, animationDuration, config);
  }

  /**
   * Create audio sequence for complex animations
   */
  createAudioSequence(
    animationId: string,
    sequence: Array<{
      delay: number;
      config: AudioVisualSyncConfig;
    }>
  ): void {
    this.cleanup(animationId);

    const animationState = {
      audioTimeout: undefined,
      fadeTimeout: undefined,
    };

    // Schedule each audio event in the sequence
    sequence.forEach(({ delay, config }, _index) => {
      setTimeout(() => {
        this.playSound(config);
      }, delay);
    });

    this.activeAnimations.set(animationId, animationState);

    // Auto-cleanup after longest delay + buffer
    const maxDelay = Math.max(...sequence.map((s) => s.delay));
    setTimeout(() => {
      this.cleanup(animationId);
    }, maxDelay + 2000);
  }

  /**
   * Stop audio for specific animation
   */
  stopAudioForAnimation(animationId: string): void {
    this.cleanup(animationId);
  }

  /**
   * Stop all active audio
   */
  stopAllAudio(): void {
    for (const animationId of this.activeAnimations.keys()) {
      this.cleanup(animationId);
    }
  }

  /**
   * Clean up animation state
   */
  private cleanup(animationId: string): void {
    const animationState = this.activeAnimations.get(animationId);
    if (animationState) {
      if (animationState.audioTimeout) {
        clearTimeout(animationState.audioTimeout);
      }
      if (animationState.fadeTimeout) {
        clearTimeout(animationState.fadeTimeout);
      }
      this.activeAnimations.delete(animationId);
    }
  }

  /**
   * Check for reduced motion preference
   */
  private prefersReducedMotion(): boolean {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /**
   * Get optimal audio timing for motion category
   */
  getOptimalTiming(category: 'feedback' | 'interface' | 'page'): AudioVisualSyncConfig['timing'] {
    switch (category) {
      case 'feedback':
        return 'start'; // Immediate feedback
      case 'interface':
        return 'middle'; // Coordinated with visual
      case 'page':
        return 'end'; // Completion confirmation
      default:
        return 'start';
    }
  }
}

// Global sync engine instance
let globalSyncEngine: AudioVisualSyncEngine | null = null;

/**
 * Initialize the global audio-visual sync engine
 */
export function initializeAudioVisualSync(settings?: NotificationSettings): AudioVisualSyncEngine {
  if (!globalSyncEngine) {
    globalSyncEngine = new AudioVisualSyncEngine(settings);
  } else if (settings) {
    globalSyncEngine.updateSettings(settings);
  }
  return globalSyncEngine;
}

/**
 * Get the global sync engine instance
 */
export function getAudioVisualSync(): AudioVisualSyncEngine | null {
  return globalSyncEngine;
}

/**
 * React hook for audio-visual sync
 */
export function useAudioVisualSync(settings?: NotificationSettings) {
  const syncEngine = globalSyncEngine || new AudioVisualSyncEngine(settings);

  React.useEffect(() => {
    if (settings) {
      syncEngine.updateSettings(settings);
    }
  }, [settings, syncEngine]);

  const syncAnimation = React.useCallback(
    (animationId: string, animationDuration: number, config: AudioVisualSyncConfig) => {
      syncEngine.syncAnimationWithAudio(animationId, animationDuration, config);
    },
    [syncEngine]
  );

  const syncWithPreset = React.useCallback(
    (
      animationId: string,
      animationDuration: number,
      preset: AnimationSoundMapping,
      overrides?: Partial<AudioVisualSyncConfig>
    ) => {
      syncEngine.syncWithPreset(animationId, animationDuration, preset, overrides);
    },
    [syncEngine]
  );

  const createSequence = React.useCallback(
    (animationId: string, sequence: Array<{ delay: number; config: AudioVisualSyncConfig }>) => {
      syncEngine.createAudioSequence(animationId, sequence);
    },
    [syncEngine]
  );

  const stopAudio = React.useCallback(
    (animationId?: string) => {
      if (animationId) {
        syncEngine.stopAudioForAnimation(animationId);
      } else {
        syncEngine.stopAllAudio();
      }
    },
    [syncEngine]
  );

  return {
    syncAnimation,
    syncWithPreset,
    createSequence,
    stopAudio,
    engine: syncEngine,
  };
}

// React import for hook
let React: any;
try {
  React = require('react');
} catch {
  // React not available in Node environment
}

export default {
  AudioVisualSyncEngine,
  initializeAudioVisualSync,
  getAudioVisualSync,
  useAudioVisualSync: React ? useAudioVisualSync : undefined,
  ANIMATION_AUDIO_MAPPING,
};
