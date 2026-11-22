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
1. Protein = grams per kg of body weight (depends on the goal)
2. Fat     = a share of the calories, but never less than 0.6 g per kg
3. Carbs   = the calories that are left, divided by 4
```

Calories per gram: protein 4, carbs 4, fat 9.

### Protein

| Goal | Grams per kg of body weight |
| --- | --- |
| Lose weight | 2.0 |
| Maintain | 1.6 |
| Gain weight | 1.8 |

More protein while losing weight helps hold on to muscle. The values follow commonly cited ranges for people who
strength train (roughly 1.6 to 2.2 g/kg, higher in a calorie deficit). They are rounded, practical choices,
not exact requirements, and I did not check them against the original studies here.
Protein uses total body weight, so for someone with a lot of body fat the lower end is plenty (the page says so).

Code: `PROTEIN_PER_KG`.

### Fat

The visitor picks a share of their calories:

| Option | Share of calories from fat |
| --- | --- |
| More carbs | 20% |
| Balanced | 25% |
| More fat | 35% |

These sit inside the commonly recommended range of about 20 to 35% of calories from fat.
Fat never goes below `MIN_FAT_PER_KG` = 0.6 g per kg, even when the share would give less (low calories, high weight).
That minimum is a practical convention, not a hard rule.

Code: `FAT_SHARE`, `MIN_FAT_PER_KG`.

### Carbs

Carbs get what is left: `(calories - protein x 4 - fat x 9) / 4`.
If nothing is left (protein and fat already use all the calories), no result is shown and the page explains why.
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

2,640 kcal a day, 78 kg, goal maintain, balanced fat.

```
Protein = 1.6 x 78               = 124.8   -> 125 g   (500 kcal)
Fat     = 2,640 x 0.25 / 9       =  73.3   ->  75 g   (675 kcal)   (floor: 0.6 x 78 = 46.8, not needed)
Carbs   = (2,640 - 500 - 675) / 4 = 366.25 -> 365 g   (1,460 kcal)
Shares  = protein 19%, carbs 55%, fat 26%
```

The three add up to 2,635 kcal, which is within 10 kcal of 2,640.

## Limits and checks

- Validation (in the component): calories 1,000 to 6,000, weight as above.
- The calculator does not know the calorie target is sensible: it uses what the visitor types. The page links to the
  calorie calculator for that.
- The page says it is an estimate, not medical advice. Keep that.
- Not covered: fibre, vegetarian or vegan protein sources, medical diets, under 18s, pregnancy.

## How to ask for changes

Say which part you want changed and give the new value or rule. Examples:

- "In `macros.logic.ts`, change protein for losing weight from 2.0 to 2.2 g per kg."
- "Add a 'Keto' option with 5% of calories from carbs."
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
- No result when protein and fat use all the calories.
- The low-carbs note appears at 1,800 kcal, 95 kg, losing weight, more fat.
- Across a grid of calories, weights, goals and fat options: all grams above zero, percentages add up to 100.

If you change a number, re-check one example by hand, as in the worked example above.
