# Calories and macros calculator: how it works

Daily calorie target for the Tools page. This file explains the calculation, where each part lives in the code,
and how to ask for changes. It describes the code as it was first written; if you change the code, update this file.

## Files

| File | What it does |
| --- | --- |
| `calorie.logic.ts` | All the maths and constants. Plain TypeScript, no Angular. **Change numbers here.** |
| `units.ts` | Metric/imperial conversions (lb, kg, ft/in, cm). |
| `calorie-calculator.component.ts` | The form (reactive forms), validation limits, unit switching, live result. |
| `calorie-calculator.component.html` | The layout: 4 step cards and the result card. All visible text is here. |
| `calorie-calculator.component.css` | Styling (uses the variables from `colors.css`). |
| `tools-calories.component.*` | The page at `/tools/calories` that hosts `<app-calorie-calculator>`. |

## Calories and macros in one tool

The macro calculator is now part of this component. At the top the visitor chooses:

- **Work out my calories** (default): steps 1 to 4 below, then the macro focus as step 5.
- **I know my calories**: one card with units, calories (1,000 to 6,000) and weight, then the macro focus as step 2.

The result card shows the calorie target and its breakdown first, then the macros under it (share bar, one row each for
protein, carbs and fat, and a line about the protein). In the second path it shows only the macros, based on the calories typed.

How it works in the code (`calorie-calculator.component.ts`):

- `mode` (`'calculate'` or `'known'`), `knownCalories` and `style` (macro focus) are extra form controls.
- `syncEnabled()` enables only the controls that belong to the chosen mode and unit system. Disabled controls are
  ignored by validation, so hidden fields never block the result. Change which fields belong to which mode here.
- `update()` calculates the calories (calculate mode), then the macros from those calories and the weight.
- The macro maths is unchanged and lives in `macros.logic.ts` (same folder). How it works and the sources are in
  `MACRO_CALCULATOR.md` (same folder). 
- The old standalone macro calculator component and page are gone.

## The calculation in 5 steps

```
1. BMR          = resting energy (Mifflin-St Jeor)
2. Daily life   = BMR x (daily factor - 1)
3. Workouts     = average extra calories per day from the workout rows
4. Maintenance  = BMR + Daily life + Workouts
5. Target       = Maintenance x goal factor   (with a minimum when losing weight)
```

Each of BMR, Daily life and Workouts is rounded to the nearest 10 kcal first, so the breakdown on screen adds up.
The target is rounded to the nearest 10 too.

### 1. BMR (resting energy): Mifflin-St Jeor

```
men:    10 x weight(kg) + 6.25 x height(cm) - 5 x age + 5
women:  10 x weight(kg) + 6.25 x height(cm) - 5 x age - 161
```

A well-known equation (1990) and generally considered the most accurate common one for healthy adults.
Individuals can still differ from it by about 10%.

Code: `basalMetabolicRate()`.

### 2. Daily life (outside workouts)

The user picks one of three descriptions. Each maps to a multiplier on BMR:

| Choice | Description shown | Factor |
| --- | --- | --- |
| `low` | Mostly sitting, under about 5,000 steps | 1.2 |
| `some` | Some walking, about 5,000 to 9,000 steps | 1.35 |
| `high` | On my feet a lot, over 10,000 steps | 1.5 |

Only the part above 1.0 is added (`BMR x (factor - 1)`), because the BMR itself is already counted.
These factors are conventional, rounded values, not from a single study. They are deliberately lower than the
"moderately active" factors many calculators use, because workouts are added separately and should not be counted twice.

Code: `DAILY_ACTIVITY_FACTOR`.

### 3. Workouts

Each workout row has a type, an intensity, sessions per week and minutes per session.
The calories burned per session are:

```
(MET - 1) x weight(kg) x hours
```

A MET is how many times more energy an activity uses than resting. We subtract 1 because resting energy is already
in the BMR. Weekly total = sum over all rows of `kcal per session x sessions per week`, then divided by 7 for a daily average.

MET values used:

| Type | Easy | Moderate | Hard |
| --- | --- | --- | --- |
| Strength | 3.5 | 5.0 | 6.0 |
| Running | 8.3 (5 mph, about 8 km/h) | 9.8 (6 mph, about 10 km/h) | 11.8 (8 mph, about 13 km/h) |
| Cycling | 4.8 | 7.0 | 10.0 |

**Checked on 23 November 2026** against the [2011 Compendium of Physical Activities](https://fitmum.ku.dk/2011_Compendium_of_Physical_Activities.pdf).
The 2024 update exists and was not compared, so values may differ slightly.

- **Running:** the three values are Compendium entries for 5, 6 and 8 mph.
- **Strength:** 3.5 is the entry for general resistance training (8 to 15 reps), 6.0 for vigorous lifting. 5.0 is a Compendium
  value for squats; here it serves as the middle level between the two. The Compendium has no separate "moderate" level.
- **Cycling:**

  | Level | Value used | Compendium entries it stands for |
  | --- | --- | --- |
  | Easy | 4.8 | leisure riding under about 16 km/h: 4.0 (under 10 mph) and 5.8 (about 9 mph). 4.8 is a value in between, not an entry |
  | Moderate | 7.0 | 6.8 (10 to 11.9 mph, about 16 to 19 km/h) up to 8.0 (12 to 13.9 mph, about 19 to 22 km/h) |
  | Hard | 10.0 | 14 to 15.9 mph, about 23 to 26 km/h |

The effect of these choices is small: for three 60-minute strength sessions a week at 78 kg, using 3.5 instead of 5.0 for
"moderate" would lower the daily estimate by about 50 kcal, around 2% of maintenance.

Code: `MET`, `workoutCaloriesPerDay()`.

### 4. Goal and minimum

| Goal | Factor | Meaning |
| --- | --- | --- |
| Lose weight | 0.85 | about 15% below maintenance |
| Maintain | 1.00 | maintenance |
| Gain weight | 1.10 | about 10% above maintenance |

These percentages are common starting points, not derived from a formula.
The goal is labelled "Gain weight" on the page (code name `gain`). It was called "Build muscle" before, but that clashed with
the "Muscle" macro focus in the next step, so the two are kept apart: the goal sets how many calories, the focus sets the split.

When the goal is **lose**, the target never goes below a minimum:
**1,500 kcal for men, 1,200 for women**. If the person's own maintenance is already lower than that,
the minimum is their maintenance (no deficit). When the minimum is used, the result card shows a warning.
The minimum does not apply to maintain or gain weight.

Code: `GOAL_FACTOR`, `MIN_CALORIES`, the end of `calculateCalories()`.

## Worked example

Man, 34 years, 182 cm, 78 kg. Daily life: "Some walking" (1.35). Workouts: strength moderate 3 x 60 min,
running moderate 2 x 45 min. Goal: maintain.

```
BMR           = 10x78 + 6.25x182 - 5x34 + 5          = 1752.5  -> 1,750
Daily life    = 1752.5 x 0.35                        =  613.4  ->   610
Strength      = (5.0 - 1) x 78 x 1.00 h x 3          =  936 kcal/week
Running       = (9.8 - 1) x 78 x 0.75 h x 2          = 1029.6 kcal/week
Workouts      = (936 + 1029.6) / 7                   =  280.8  ->   280
Maintenance   = 1,750 + 610 + 280                    =                2,640
Target        = 2,640 x 1.00                         =                2,640
```

For "lose weight" the target would be 2,640 x 0.85 = 2,244 -> 2,240; for "gain weight" 2,640 x 1.10 = 2,904 -> 2,900.

## Units (metric and imperial)

The visitor can switch between Metric (kg, cm) and Imperial (lb, ft and in) at the top of step 1.
The calculation itself always runs in kg and cm: for imperial, the component converts first with the functions
in `units.ts`, then calls `calculateCalories()`. `calorie.logic.ts` knows nothing about units.

- Height and weight exist as separate form fields per system (`heightCm`/`weightKg` and `heightFt`/`heightIn`/`weightLb`).
  Only the fields of the active system are enabled; disabled fields are ignored by validation.
- Switching converts what was already typed (80 kg becomes 176.4 lb). Height is rounded to the nearest inch
  (or back to whole cm), which can shift it by up to about 1.3 cm. That changes the result by less than 10 kcal.
- The chosen system is remembered in the browser (`localStorage`, key `activewithraph.units`).
  Default is metric. Storage failures (private mode) are ignored.
- Imperial limits: 4 to 7 feet, 0 to 11 inches, 77 to 550 lb (about the same range as the metric limits).
- Not supported: stones and pounds (UK).

## Accuracy and limits

- Every step is an estimate. The total is realistically within about 10 to 15% of true needs.
- The result card tells users to eat the target for 2 to 3 weeks, watch their weight trend and adjust by 100 to 150 kcal.
- The page says it is not medical advice. Keep that.
- Validation limits (in the component): age 18 to 99, height 120 to 230 cm, weight 35 to 250 kg (imperial limits above),
  1 to 14 sessions a week, 10 to 240 minutes, at most 6 workout rows.
- The calculator is for healthy adults. It does not handle pregnancy, breastfeeding, medical conditions or under 18s.

## How to ask for changes

Say which part you want changed and give the new value or rule. Examples:

- "In `calorie.logic.ts`, change the lose-weight factor from 0.85 to 0.80."
- "Add swimming as a workout type with MET easy 5.8, moderate 8.3, hard 9.8."
  (Needs: the `WorkoutType` type and `MET` in `calorie.logic.ts`, and the `workoutTypes` list in the component.)
- "Add a 4th daily-life option, 'Very active job', factor 1.6."
  (Needs: `DailyActivity` type and `DAILY_ACTIVITY_FACTOR` in the logic, and `dailyOptions` in the component.)
- "Use the Katch-McArdle formula when the user enters their body fat percentage."
- "Show protein, carbs and fat targets under the calories."
- "Add stones and pounds for UK visitors."

Where things live:

- A number or formula: `calorie.logic.ts`.
- A label, hint or message: `calorie-calculator.component.html`.
- A field limit or list of options: `calorie-calculator.component.ts`.
- The look: `calorie-calculator.component.css`.

Useful to include when you ask: the file name, the old and new value, and the example you expect
(for instance "man, 80 kg, 180 cm, 30 years should now give about 2,300 kcal").

## Checking the maths

`calorie.logic.ts` has no Angular dependencies, so it can be tested on its own. Checks done when it was written:

- BMR for a 30-year-old man (80 kg, 180 cm) = 1,780 and for a 30-year-old woman (60 kg, 165 cm) = 1,320.25.
- The worked example above (workouts = 280, maintenance = 2,640).
- A small woman who wants to lose weight is held at her maintenance instead of a deficit.
- The goal adjustment always equals target minus maintenance.

If you change a number, re-check one example by hand, as in the worked example above.