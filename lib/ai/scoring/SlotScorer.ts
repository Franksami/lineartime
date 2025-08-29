import { differenceInDays, differenceInHours, differenceInMinutes } from 'date-fns';
import { validateHardConstraints } from '../constraints/HardConstraints';
import { calculateSoftConstraintScore } from '../constraints/SoftConstraints';
import type { SchedulingConstraint, SchedulingContext, TimeSlot } from '../types';
import { getEnergyLevel } from '../utils/dateHelpers';

export interface ScoredSlot extends TimeSlot {
  score: number;
  breakdown: ScoreBreakdown;
  violations: string[];
  penalties: { name: string; penalty: number }[];
}

export interface ScoreBreakdown {
  constraintScore: number; // 0-100 based on soft constraints
  energyScore: number; // 0-100 based on energy levels
  timingScore: number; // 0-100 based on how soon it can be scheduled
  balanceScore: number; // 0-100 based on day/week balance
  totalScore: number; // Weighted average
}

export interface ScoreWeights {
  constraints: number;
  energy: number;
  timing: number;
  balance: number;
}

export class SlotScorer {
  private weights: ScoreWeights;

  constructor(weights?: Partial<ScoreWeights>) {
    // Default weights that sum to 1.0
    this.weights = {
      constraints: weights?.constraints ?? 0.4,
      energy: weights?.energy ?? 0.25,
      timing: weights?.timing ?? 0.2,
      balance: weights?.balance ?? 0.15,
    };

    // Normalize weights to sum to 1.0
    const sum = Object.values(this.weights).reduce((a, b) => a + b, 0);
    if (sum !== 1.0) {
      Object.keys(this.weights).forEach((key) => {
        this.weights[key as keyof ScoreWeights] /= sum;
      });
    }
  }

  /**
   * Score a single time slot
   */
  public scoreSlot(
    slot: TimeSlot,
    context: SchedulingContext,
    hardConstraints: SchedulingConstraint[] = [],
    softConstraints: SchedulingConstraint[] = [],
    priority = 3
  ): ScoredSlot {
    // First validate hard constraints
    const { valid, violations } = validateHardConstraints(slot, context, hardConstraints);

    if (!valid) {
      // Hard constraint violation = score of 0
      return {
        ...slot,
        score: 0,
        breakdown: {
          constraintScore: 0,
          energyScore: 0,
          timingScore: 0,
          balanceScore: 0,
          totalScore: 0,
        },
        violations,
        penalties: [],
      };
    }

    // Calculate individual scores
    const { score: constraintScore, penalties } = calculateSoftConstraintScore(
      slot,
      context,
      softConstraints
    );

    const energyScore = this.calculateEnergyScore(slot, context);
    const timingScore = this.calculateTimingScore(slot, priority);
    const balanceScore = this.calculateBalanceScore(slot, context);

    // Calculate weighted total
    const totalScore =
      constraintScore * this.weights.constraints +
      energyScore * this.weights.energy +
      timingScore * this.weights.timing +
      balanceScore * this.weights.balance;

    return {
      ...slot,
      score: totalScore,
      breakdown: {
        constraintScore,
        energyScore,
        timingScore,
        balanceScore,
        totalScore,
      },
      violations,
      penalties,
    };
  }

  /**
   * Score multiple slots and return sorted by score
   */
  public scoreSlots(
    slots: TimeSlot[],
    context: SchedulingContext,
    hardConstraints: SchedulingConstraint[] = [],
    softConstraints: SchedulingConstraint[] = [],
    priority = 3,
    limit?: number
  ): ScoredSlot[] {
    const scoredSlots = slots.map((slot) =>
      this.scoreSlot(slot, context, hardConstraints, softConstraints, priority)
    );

    // Sort by score (highest first)
    scoredSlots.sort((a, b) => b.score - a.score);

    // Return limited results if specified
    return limit ? scoredSlots.slice(0, limit) : scoredSlots;
  }

  /**
   * Calculate energy score based on user's energy profile
   */
  private calculateEnergyScore(slot: TimeSlot, context: SchedulingContext): number {
    const hour = slot.start.getHours();
    const energyType = context.energyLevels.type as 'morning' | 'evening' | 'balanced';

    // Get energy level for start and end of slot
    const startEnergy = getEnergyLevel(hour, energyType);
    const endHour = slot.end.getHours();
    const endEnergy = getEnergyLevel(endHour, energyType);

    // Average energy level during the slot
    const avgEnergy = (startEnergy + endEnergy) / 2;

    // Convert to 0-100 scale
    return avgEnergy * 100;
  }

  /**
   * Calculate timing score based on how soon the slot is
   */
  private calculateTimingScore(slot: TimeSlot, priority: number): number {
    const hoursFromNow = differenceInHours(slot.start, new Date());

    // High priority items should be scheduled sooner
    let idealHours: number;
    switch (priority) {
      case 1:
        idealHours = 4;
        break; // Within 4 hours
      case 2:
        idealHours = 24;
        break; // Within 1 day
      case 3:
        idealHours = 72;
        break; // Within 3 days
      case 4:
        idealHours = 168;
        break; // Within 1 week
      default:
        idealHours = 336;
        break; // Within 2 weeks
    }

    if (hoursFromNow < 0) {
      // Slot is in the past
      return 0;
    }
    if (hoursFromNow <= idealHours) {
      // Within ideal time window
      return 100;
    }
    // Decay score based on how far beyond ideal time
    const beyondIdeal = hoursFromNow - idealHours;
    const decayRate = 0.95; // 5% reduction per ideal period beyond
    const periods = beyondIdeal / idealHours;
    return Math.max(0, 100 * decayRate ** periods);
  }

  /**
   * Calculate balance score based on workload distribution
   */
  private calculateBalanceScore(slot: TimeSlot, context: SchedulingContext): number {
    const slotDay = slot.start.toDateString();

    // Calculate load for this day
    const dayEvents = context.existingEvents.filter(
      (event) => event.startDate.toDateString() === slotDay
    );

    const dayMinutes = dayEvents.reduce(
      (sum, event) => sum + differenceInMinutes(event.endDate, event.startDate),
      0
    );

    // Calculate average daily load for the week
    const weekStart = new Date(slot.start);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week

    const weekEvents = context.existingEvents.filter((event) => {
      const daysDiff = differenceInDays(event.startDate, weekStart);
      return daysDiff >= 0 && daysDiff < 7;
    });

    const weekMinutes = weekEvents.reduce(
      (sum, event) => sum + differenceInMinutes(event.endDate, event.startDate),
      0
    );

    const avgDailyMinutes = weekMinutes / 7;

    // Score based on how close this day is to average
    const projectedDayMinutes = dayMinutes + slot.duration;
    const deviation = Math.abs(projectedDayMinutes - avgDailyMinutes);

    // Perfect balance = 100, deviation reduces score
    const maxDeviation = 240; // 4 hours deviation = 0 score
    const score = Math.max(0, 100 - (deviation / maxDeviation) * 100);

    return score;
  }

  /**
   * Find the best slot from a list
   */
  public findBestSlot(
    slots: TimeSlot[],
    context: SchedulingContext,
    hardConstraints: SchedulingConstraint[] = [],
    softConstraints: SchedulingConstraint[] = [],
    priority = 3
  ): ScoredSlot | null {
    const scoredSlots = this.scoreSlots(
      slots,
      context,
      hardConstraints,
      softConstraints,
      priority,
      1
    );

    return scoredSlots.length > 0 ? scoredSlots[0] : null;
  }

  /**
   * Update scoring weights
   */
  public updateWeights(weights: Partial<ScoreWeights>): void {
    Object.assign(this.weights, weights);

    // Normalize to sum to 1.0
    const sum = Object.values(this.weights).reduce((a, b) => a + b, 0);
    Object.keys(this.weights).forEach((key) => {
      this.weights[key as keyof ScoreWeights] /= sum;
    });
  }

  /**
   * Get current weights
   */
  public getWeights(): ScoreWeights {
    return { ...this.weights };
  }
}
