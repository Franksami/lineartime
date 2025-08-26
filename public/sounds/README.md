# Sound Effects Directory

This directory contains audio files for UI notification sounds.

## Required Sound Files

1. **success.mp3** - Positive feedback sound (event created, saved, synced)
   - Duration: 0.2-0.5 seconds
   - Frequency: Higher pitched, pleasant tone
   - Volume: Moderate, non-jarring
   - Examples: Subtle "ding", soft chime, brief upward tone

2. **error.mp3** - Error/failure notification sound
   - Duration: 0.3-0.6 seconds  
   - Frequency: Lower pitched, attention-getting but not harsh
   - Volume: Slightly louder than success sound
   - Examples: Soft "thud", brief downward tone, muted alert

3. **notification.mp3** - General notification sound
   - Duration: 0.2-0.4 seconds
   - Frequency: Neutral, informative tone
   - Volume: Balanced between success and error
   - Examples: Gentle tap, soft click, brief neutral tone

## Sound Requirements

- **Format**: MP3 for broad browser compatibility
- **Bitrate**: 128kbps or lower (small file sizes)
- **Volume**: Pre-normalized to consistent levels
- **Accessibility**: Respectful of user preferences and hearing sensitivities

## Fallback Behavior

If sound files are missing, the sound service will fail gracefully without errors.

## Implementation Notes

Sound playback respects:
- User's sound enabled/disabled preference
- Individual sound type preferences (success/error/notification)
- Volume settings (0.0-1.0 scale)
- Browser autoplay policies (requires user gesture)
- Reduced motion accessibility preferences