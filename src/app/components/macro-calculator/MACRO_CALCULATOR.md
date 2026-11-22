# Macro calculator: how it works

Turns a daily calorie target into grams of protein, carbs and fat, for the Tools page.
This file explains the calculation, where each part lives in the code, and how to ask for changes.
It describes the code as it was first written; if you change the code, update this file.

## Files

| File | What it does |
| --- | --- |
| `macros.logic.ts` | All the maths and constants. Plain TypeScript, no Angular. **Change numbers here.** |
| `macro-calculator.component.ts` | The form (reactive forms), validation limits, unit switching, live result. |
| `macro-calculator.component.html` | Layout and all visible text. |
| `macro-calculator.component.css` | Styling, including the macro colours (protein orange, carbs blue, fat yellow). |
| `tools-macros.component.*` (in `tools-pages/`) | The page at `/tools/macros` that hosts `<app-macro-calculator>`. |

It reuses two files from the calorie calculator: `calorie.logic.ts` (the `Goal` type) and `units.ts`
(lb and kg conversion). Keep the `calorie-calculator/` folder next to this one, or update the import paths.

## The calculation

```
1. Protein = grams per kg of body weight (depends on the goal, or on the "Muscle" focus)
2. Fat     = a share of the calories (depends on the focus), but never less than 0.6 g per kg
3. Carbs   = the calories that are left, divided by 4
```

Calories per gram: protein 4, carbs 4, fat 9.

### Protein

| Goal | Grams per kg of body weight |
| --- | --- |
| Lose weight | 2.0 |
| Maintain | 1.6 |
| Build muscle | 2.0 |

More protein while losing weight helps hold on to muscle, and more while building it supports growth. The values follow commonly cited ranges for people who
strength train (roughly 1.6 to 2.2 g/kg, higher in a calorie deficit). They are rounded, practical choices,
not exact requirements, and I did not check them against the original studies here.
Protein uses total body weight, so for someone with a lot of body fat the lower end is plenty (the page says so).

The "Muscle" focus (below) replaces the goal's amount with 2.2 g per kg, the top of that range.

Code: `PROTEIN_PER_KG`.

### Focus (step 4)

The visitor picks what the plan should lean towards. It decides the fat share and, for Muscle, the protein:

| Focus | Share of calories from fat | Protein | Result |
| --- | --- | --- | --- |
| Balanced (default) | 25% | from the goal | A good all-round split |
| Endurance | 20% | from the goal | More carbs, to fuel long runs and rides |
| Muscle | 25% | 2.2 g per kg | More protein to support growth and recovery, carbs take the rest |

The fat shares sit inside the commonly recommended range of about 20 to 35% of calories from fat.
Fat never goes below `MIN_FAT_PER_KG` = 0.6 g per kg, even when the share would give less (low calories, high weight).
That minimum is a practical convention, not a hard rule.

The differences between the three are modest on purpose: total calories and protein matter most, and the split of the
rest is largely preference as long as fat is not too low and carbs are enough for the training.

Code: `STYLE_SETTINGS` (fat share and fixed protein per focus), `MIN_FAT_PER_KG`.

### Carbs

Carbs get what is left: `(calories - protein x 4 - fat x 9) / 4`.
If nothing is left (protein and fat already use all the calories), no result is shown and the page explains why.
When the goal is Build muscle, the "Muscle" focus is pre-selected (and "Balanced" for other goals). This only happens
while the visitor has not chosen a focus themselves: once they click one, their choice is kept.

When carbs come out under 2 g per kg (`LOW_CARBS_PER_KG`), a note says this is low for hard training.

### Rounding

Protein, fat and carbs are rounded to the nearest 5 g, so the numbers are easy to weigh out.
Carbs are calculated after protein and fat are rounded, so the plan stays within about 10 kcal of the target.
The percentages are shares of the plan's calories, in whole numbers, and always add up to 100 (carbs take the rest).

## Units (metric and imperial)

Only body weight needs units. The visitor switches between Metric (kg) and Imperial (lb); results are always in grams.
The maths runs in kg: lb is converted first with `units.ts`. Switching converts the value already typed.
The choice is remembered in the browser under the same key as the calorie calculator (`activewithraph.units`),
so a visitor only chooses once for both tools. Limits: 35 to 250 kg, or 77 to 550 lb.

## Worked example

2,640 kcal a day, 78 kg, goal maintain, focus Balanced.

```
Protein = 1.6 x 78               = 124.8   -> 125 g   (500 kcal)
Fat     = 2,640 x 0.25 / 9       =  73.3   ->  75 g   (675 kcal)   (floor: 0.6 x 78 = 46.8, not needed)
Carbs   = (2,640 - 500 - 675) / 4 = 366.25 -> 365 g   (1,460 kcal)
Shares  = protein 19%, carbs 55%, fat 26%
```

The three add up to 2,635 kcal, which is within 10 kcal of 2,640.

The same person with the other focuses:

| Focus | Protein | Carbs | Fat |
| --- | --- | --- | --- |
| Balanced | 125 g | 365 g | 75 g |
| Endurance | 125 g | 400 g | 60 g |
| Muscle | 170 g | 320 g | 75 g |

## Limits and checks

- Validation (in the component): calories 1,000 to 6,000, weight as above.
- The calculator does not know the calorie target is sensible: it uses what the visitor types. The page links to the
  calorie calculator for that.
- The page says it is an estimate, not medical advice. Keep that.
- Not covered: fibre, vegetarian or vegan protein sources, medical diets, under 18s, pregnancy.

## How to ask for changes

Say which part you want changed and give the new value or rule. Examples:

- "In `macros.logic.ts`, change protein for losing weight from 2.0 to 2.2 g per kg."
- "Add a 'Keto' focus with 5% of calories from carbs."
- "Show how many grams of each macro to eat per meal, for 3 or 4 meals."
- "Use lean body mass instead of total weight when the visitor enters their body fat percentage."
- "Add a button to take over the result from the calorie calculator."

Where things live:

- A number or rule: `macros.logic.ts`.
- A label, hint or message: `macro-calculator.component.html`.
- A field limit or list of options: `macro-calculator.component.ts`.
- Colours and layout: `macro-calculator.component.css`.

Useful to include when you ask: the file name, the old and new value, and the example you expect
(for instance "2,640 kcal, 78 kg, maintain should give about 125 g protein").

## Checking the maths

`macros.logic.ts` has no Angular dependencies, so it can be tested on its own. Checks done when it was written:

- The worked example above (125 g protein, 75 g fat, 365 g carbs, percentages add up to 100).
- Losing weight gives more protein (2,000 kcal, 78 kg: 155 g).
- The fat minimum wins at low calories and high weight (1,500 kcal, 100 kg: 60 g).
- Building muscle gives more protein (2,900 kcal, 78 kg: 155 g).
- The three focuses give the numbers in the table above, and Endurance has more carbs and Muscle more protein than Balanced.
- No result when protein and fat use all the calories.
- The low-carbs note appears at 1,800 kcal, 95 kg, losing weight, Muscle focus.
- Across a grid of calories, weights, goals and focuses: all grams above zero, percentages add up to 100.

If you change a number, re-check one example by hand, as in the worked example above.
