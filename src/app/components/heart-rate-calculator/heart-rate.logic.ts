/**
 * Heart rate zones with the heart rate reserve (Karvonen) method. Plain TypeScript, no Angular imports.
 *
 *   heart rate reserve (HRR) = max heart rate - resting heart rate
 *   target heart rate        = resting + percentage x HRR
 */

export type MaxSource = 'estimate' | 'measured';

export interface HeartRateInput {
  age: number;
  restingHr: number;
  /** A measured max heart rate. When null, the max is estimated from the age. */
  measuredMaxHr: number | null;
}

export interface ZoneDefinition {
  zone: 1 | 2 | 3 | 4 | 5;
  name: string;
  /** Lower and upper end as a fraction of heart rate reserve. */
  from: number;
  to: number;
  feel: string;
  use: string;
}

export interface HeartRateZone extends ZoneDefinition {
  /** Lowest and highest beats per minute in this zone. Zones follow on from each other without overlap. */
  low: number;
  high: number;
}

export interface HeartRateResult {
  maxHr: number;
  maxSource: MaxSource;
  restingHr: number;
  reserve: number;
  zones: HeartRateZone[];
}

/** The reserve must be at least this many bpm, otherwise the zones would be meaningless. */
export const MIN_RESERVE = 20;

export const ZONE_DEFINITIONS: ZoneDefinition[] = [
  {
    zone: 1,
    name: 'Recovery',
    from: 0.5,
    to: 0.6,
    feel: 'Very easy. You can talk without any effort.',
    use: 'Warm-up, cool-down and recovery days.',
  },
  {
    zone: 2,
    name: 'Endurance',
    from: 0.6,
    to: 0.7,
    feel: 'Easy. You can speak in full sentences.',
    use: 'Most easy runs and long rides. Builds your aerobic base.',
  },
  {
    zone: 3,
    name: 'Tempo',
    from: 0.7,
    to: 0.8,
    feel: 'Comfortably hard. You can speak in short sentences.',
    use: 'Steady tempo runs and longer sustained efforts.',
  },
  {
    zone: 4,
    name: 'Threshold',
    from: 0.8,
    to: 0.9,
    feel: 'Hard. You can say a few words at a time.',
    use: 'Threshold intervals and hard sustained work.',
  },
  {
    zone: 5,
    name: 'Maximum',
    from: 0.9,
    to: 1,
    feel: 'All out. Talking is not possible.',
    use: 'Short intervals and sprints. Only in small doses.',
  },
];

/** Tanaka et al. (2001): 208 - 0.7 x age. More accurate than the older 220 - age. */
export function estimateMaxHr(age: number): number {
  return Math.round(208 - 0.7 * age);
}

/** Returns null when the max is too close to the resting heart rate to build zones. */
export function calculateZones(input: HeartRateInput): HeartRateResult | null {
  const measured = input.measuredMaxHr !== null;
  const maxHr = measured ? (input.measuredMaxHr as number) : estimateMaxHr(input.age);
  const reserve = maxHr - input.restingHr;

  if (reserve < MIN_RESERVE) {
    return null;
  }

  const zones: HeartRateZone[] = [];
  ZONE_DEFINITIONS.forEach((definition, index) => {
    const high = Math.round(input.restingHr + definition.to * reserve);
    // Start each zone one beat above the previous one, so the ranges never overlap.
    const low = index === 0 ? Math.round(input.restingHr + definition.from * reserve) : zones[index - 1].high + 1;
    zones.push({ ...definition, low, high });
  });

  return {
    maxHr,
    maxSource: measured ? 'measured' : 'estimate',
    restingHr: input.restingHr,
    reserve,
    zones,
  };
}
