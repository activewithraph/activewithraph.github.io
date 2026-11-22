/**
 * Macro calculator maths. Plain TypeScript, no Angular imports.
 *
 *   protein = grams per kg of body weight (depends on the goal)
 *   fat     = a share of the calories (but never below a minimum per kg)
 *   carbs   = whatever calories are left
 */

import type { Goal } from '../calorie-calculator/calorie.logic';

export type FatShare = 'lower' | 'balanced' | 'higher';

export interface MacroInput {
  /** The daily calorie target, for example from the calorie calculator. */
  calories: number;
  weightKg: number;
  goal: Goal;
  fatShare: FatShare;
}

export interface MacroResult {
  proteinG: number;
  carbsG: number;
  fatG: number;
  proteinKcal: number;
  carbsKcal: number;
  fatKcal: number;
  /** Shares of the calories, in whole percent, adding up to 100. */
  proteinPct: number;
  carbsPct: number;
  fatPct: number;
  proteinPerKg: number;
  carbsPerKg: number;
  fatPerKg: number;
  /** True when carbs are low for someone who trains hard. */
  carbsLow: boolean;
}

/** Calories per gram. */
export const KCAL_PER_G = { protein: 4, carbs: 4, fat: 9 } as const;

/** Protein in grams per kg of body weight. Higher when cutting, to hold on to muscle. */
export const PROTEIN_PER_KG: Record<Goal, number> = {
  lose: 2.0,
  maintain: 1.6,
  gain: 1.8,
};

/** Share of the calories that comes from fat. */
export const FAT_SHARE: Record<FatShare, number> = {
  lower: 0.2,
  balanced: 0.25,
  higher: 0.35,
};

/** Fat never goes below this, even when the share of a low calorie target would be less. */
export const MIN_FAT_PER_KG = 0.6;

/** Below this many grams of carbs per kg, the result shows a note. */
export const LOW_CARBS_PER_KG = 2;

/** Grams are rounded to the nearest 5, so the numbers look like something you can actually weigh out. */
const roundTo5 = (n: number): number => Math.round(n / 5) * 5;

/** Returns null when protein and fat already use up all the calories. */
export function calculateMacros(input: MacroInput): MacroResult | null {
  const proteinG = roundTo5(input.weightKg * PROTEIN_PER_KG[input.goal]);
  const fatG = roundTo5(
    Math.max((input.calories * FAT_SHARE[input.fatShare]) / KCAL_PER_G.fat, input.weightKg * MIN_FAT_PER_KG)
  );

  const remaining = input.calories - proteinG * KCAL_PER_G.protein - fatG * KCAL_PER_G.fat;
  const carbsG = roundTo5(remaining / KCAL_PER_G.carbs);
  if (carbsG <= 0) {
    return null;
  }

  const proteinKcal = proteinG * KCAL_PER_G.protein;
  const fatKcal = fatG * KCAL_PER_G.fat;
  const carbsKcal = carbsG * KCAL_PER_G.carbs;
  const total = proteinKcal + fatKcal + carbsKcal;

  // Carbs take what is left of the 100%, so the three always add up.
  const proteinPct = Math.round((proteinKcal / total) * 100);
  const fatPct = Math.round((fatKcal / total) * 100);

  return {
    proteinG,
    carbsG,
    fatG,
    proteinKcal,
    carbsKcal,
    fatKcal,
    proteinPct,
    fatPct,
    carbsPct: 100 - proteinPct - fatPct,
    proteinPerKg: proteinG / input.weightKg,
    carbsPerKg: carbsG / input.weightKg,
    fatPerKg: fatG / input.weightKg,
    carbsLow: carbsG / input.weightKg < LOW_CARBS_PER_KG,
  };
}
