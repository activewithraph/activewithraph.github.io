/** Unit conversions. The calculator maths in calorie.logic.ts always works in cm and kg. */

export type UnitSystem = 'metric' | 'imperial';

const CM_PER_INCH = 2.54;
const KG_PER_POUND = 0.45359237;

export function lbToKg(pounds: number): number {
  return pounds * KG_PER_POUND;
}

export function kgToLb(kg: number): number {
  return kg / KG_PER_POUND;
}

export function feetInchesToCm(feet: number, inches: number): number {
  return (feet * 12 + inches) * CM_PER_INCH;
}

/** Rounds to the nearest whole inch, so 12 inches always carries over into the next foot. */
export function cmToFeetInches(cm: number): { feet: number; inches: number } {
  const totalInches = Math.round(cm / CM_PER_INCH);
  const feet = Math.floor(totalInches / 12);
  return { feet, inches: totalInches - feet * 12 };
}

/** One decimal, e.g. for showing pounds. */
export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
