# BMI calculator: how it works

Body mass index for the Tools page, with the healthy weight range for the visitor's height.
It describes the code as it was first written; if you change the code, update this file.

## Files

| File | What it does |
| --- | --- |
| `bmi.logic.ts` | The maths and the category limits. Plain TypeScript, no Angular. **Change numbers here.** |
| `bmi-calculator.component.ts` | The form, validation limits, unit switching, texts per category. |
| `bmi-calculator.component.html` | Layout and visible text. |
| `bmi-calculator.component.scss` | Styling (SCSS: variables at the top, nesting, one mixin). |
| `tools-bmi.component.*` (in `tools-pages/`) | The page at `/tools/bmi`. |
| `hub-bmi-card.snippet.html` | The card to paste into the Tools overview. |

It reuses `units.ts` from `calorie-calculator/`, and the same units setting (`activewithraph.units`).

## The calculation

```
BMI = weight (kg) / (height in metres)^2        rounded to 1 decimal
```

Category (World Health Organization, adults), based on the rounded BMI so the number and the label always agree:

| BMI | Category |
| --- | --- |
| under 18.5 | Underweight |
| 18.5 to 24.9 | Healthy range |
| 25 to 29.9 | Overweight |
| 30 and up | Obese |

Healthy weight range = the weight that gives BMI 18.5 up to 24.9 at the visitor's height, shown in kg or lb.

Worked example: 180 cm, 80 kg. 80 / 1.8^2 = 24.7, so "Healthy range". Healthy weights: 59.9 to 80.7 kg (60 to 81 kg on screen).

Code: `calculateBmi()`, `categoryFor()`, `CATEGORY_START`.

## The scale

The bar runs from BMI 15 to 40. The four segments are 14%, 26%, 20% and 40% wide, which is exactly 15 to 18.5, 18.5 to 25, 25 to 30 and 30 to 40.
The white marker sits at `(BMI - 15) / 25`, held at the edges for values outside the scale.
If you change `SCALE_MIN`, `SCALE_MAX` or the category limits, also change the widths in the `.scss` (`.scale__part`) and the tick positions in the `.html`.

## Units

Same as the other tools: Metric (cm, kg) or Imperial (ft and in, lb). The maths always runs in cm and kg.
Limits: 120 to 230 cm or 4 to 7 ft and 0 to 11 in; 35 to 250 kg or 77 to 550 lb.

## Limits (the page says the first two)

- BMI cannot tell muscle from fat. Strong, muscular people often land in "overweight" while lean. The page says so,
  because many visitors lift.
- It ignores where weight sits (waist) and age. Adults from 18 only; the WHO limits do not apply to children.
- Some guidelines use lower limits for people of Asian descent. Not covered here.
- The category limits are the standard WHO ones. I did not re-check them against the WHO site in this session.

## How to ask for changes

- "In `bmi.logic.ts`, round the healthy range to the nearest 0.5 kg."
- "Add waist circumference and show the waist-to-height ratio."
- "Show how many kg to lose or gain to reach the healthy range."

A number or rule: `bmi.logic.ts`. A text: the `.html`, or `categoryTexts` in the `.ts`. Look: the `.scss`.
