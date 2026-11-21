/**
 * Calorie calculator maths. Plain TypeScript, no Angular imports, so it is easy to test and reuse.
 *
 * Daily target = resting energy (BMR) + daily life + workouts, adjusted for the goal.
 * All numbers are estimates (typically within 10-15%).
 */

export type Sex = 'male' | 'female';
export type DailyActivity = 'low' | 'some' | 'high';
export type WorkoutType = 'strength' | 'running' | 'cycling';
export type Intensity = 'easy' | 'moderate' | 'hard';
export type Goal = 'lose' | 'maintain' | 'gain';

export interface Workout {
  type: WorkoutType;
  intensity: Intensity;
  sessionsPerWeek: number;
  minutes: number;
}

export interface CalorieInput {
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  dailyActivity: DailyActivity;
  workouts: Workout[];
  goal: Goal;
}

export interface CalorieResult {
  /** Resting energy: what your body burns doing nothing. */
  bmr: number;
  /** Extra energy for moving around during the day, outside workouts. */
  dailyLife: number;
  /** Average extra energy per day from your workouts. */
  workouts: number;
  /** bmr + dailyLife + workouts: the amount that keeps your weight stable. */
  maintenance: number;
  /** Maintenance adjusted for the goal. */
  target: number;
  /** target - maintenance (negative when losing weight). */
  goalChange: number;
  /** True when the target was held at the safety minimum instead of going lower. */
  floorApplied: boolean;
  /** The lowest target we show for this person (never above their maintenance). */
  floor: number;
}

/** Multiplier on BMR for everyday life, excluding workouts. */
export const DAILY_ACTIVITY_FACTOR: Record<DailyActivity, number> = {
  low: 1.2, // mostly sitting, under ~5,000 steps
  some: 1.35, // some walking, ~5,000-9,000 steps
  high: 1.5, // on your feet a lot, 10,000+ steps
};

/** Goal adjustment applied to maintenance. */
export const GOAL_FACTOR: Record<Goal, number> = {
  lose: 0.85, // about 15% below
  maintain: 1,
  gain: 1.1, // about 10% above
};

/** Lowest target we show when the goal is to lose weight. */
export const MIN_CALORIES: Record<Sex, number> = {
  male: 1500,
  female: 1200,
};

/** MET values (gross, from the Compendium of Physical Activities, rounded). */
export const MET: Record<WorkoutType, Record<Intensity, number>> = {
  strength: { easy: 3.5, moderate: 5, hard: 6 },
  running: { easy: 8.3, moderate: 9.8, hard: 11.8 }, // about 8, 10 and 12 km/h
  cycling: { easy: 4.8, moderate: 7, hard: 10 },
};

/** Mifflin-St Jeor equation. */
export function basalMetabolicRate(sex: Sex, age: number, heightCm: number, weightKg: number): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === 'male' ? base + 5 : base - 161;
}

/**
 * Average extra calories per day from workouts.
 * Uses (MET - 1) because resting energy is already counted in the BMR.
 */
export function workoutCaloriesPerDay(workouts: Workout[], weightKg: number): number {
  const perWeek = workouts.reduce((sum, w) => {
    const hours = w.minutes / 60;
    return sum + (MET[w.type][w.intensity] - 1) * weightKg * hours * w.sessionsPerWeek;
  }, 0);
  return perWeek / 7;
}

const roundTo10 = (n: number): number => Math.round(n / 10) * 10;

export function calculateCalories(input: CalorieInput): CalorieResult {
  const bmrRaw = basalMetabolicRate(input.sex, input.age, input.heightCm, input.weightKg);
  const dailyLifeRaw = bmrRaw * (DAILY_ACTIVITY_FACTOR[input.dailyActivity] - 1);
  const workoutsRaw = workoutCaloriesPerDay(input.workouts, input.weightKg);

  // Round the parts to 10 kcal so the breakdown adds up and doesn't suggest false precision.
  const bmr = roundTo10(bmrRaw);
  const dailyLife = roundTo10(dailyLifeRaw);
  const workouts = roundTo10(workoutsRaw);
  const maintenance = bmr + dailyLife + workouts;

  // Never advise a deficit that ends below the safety minimum (or below maintenance, if that is already lower).
  const floor = Math.min(maintenance, MIN_CALORIES[input.sex]);
  let target = roundTo10(maintenance * GOAL_FACTOR[input.goal]);
  let floorApplied = false;

  if (input.goal === 'lose' && target < floor) {
    target = floor;
    floorApplied = true;
  }

  return {
    bmr,
    dailyLife,
    workouts,
    maintenance,
    target,
    goalChange: target - maintenance,
    floorApplied,
    floor,
  };
}
