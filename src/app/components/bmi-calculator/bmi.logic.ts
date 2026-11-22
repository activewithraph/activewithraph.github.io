/**
 * BMI maths. Plain TypeScript, no Angular. Always works in kg and cm;
 * the component converts from pounds, feet and inches first (see ../calorie-calculator/units.ts).
 */

export type BmiCategory = 'underweight' | 'normal' | 'overweight' | 'obese';

export interface BmiInput {
  heightCm: number;
  weightKg: number;
}

export interface BmiResult {
  /** Rounded to one decimal. */
  bmi: number;
  category: BmiCategory;
  /** Weight range for this height that gives a BMI of 18.5 up to 24.9, in kg (one decimal). */
  healthyMinKg: number;
  healthyMaxKg: number;
  /** Where the marker sits on the scale, 0 to 100 (%). */
  markerPct: number;
}

/** Adult categories of the World Health Organization. A BMI from this value up belongs to the category. */
export const CATEGORY_START: Record<BmiCategory, number> = {
  underweight: 0,
  normal: 18.5,
  overweight: 25,
  obese: 30,
};

/** The scale on screen runs from SCALE_MIN to SCALE_MAX; values outside it sit at the edge. */
export const SCALE_MIN = 15;
export const SCALE_MAX = 40;

export function categoryFor(bmi: number): BmiCategory {
  if (bmi < CATEGORY_START.normal) return 'underweight';
  if (bmi < CATEGORY_START.overweight) return 'normal';
  if (bmi < CATEGORY_START.obese) return 'overweight';
  return 'obese';
}

export function calculateBmi(input: BmiInput): BmiResult {
  const m = input.heightCm / 100;
  const m2 = m * m;
  const bmi = Math.round((input.weightKg / m2) * 10) / 10;

  // Rounded BMI is used for the category, so the number and the label on screen never disagree.
  const clamped = Math.min(SCALE_MAX, Math.max(SCALE_MIN, bmi));
  return {
    bmi,
    category: categoryFor(bmi),
    healthyMinKg: Math.round(18.5 * m2 * 10) / 10,
    healthyMaxKg: Math.round(24.9 * m2 * 10) / 10,
    markerPct: ((clamped - SCALE_MIN) / (SCALE_MAX - SCALE_MIN)) * 100,
  };
}
