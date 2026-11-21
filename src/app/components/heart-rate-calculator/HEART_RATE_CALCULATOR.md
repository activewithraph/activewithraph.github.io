# Heart rate zone calculator: how it works

Training zones for the Tools page, based on heart rate reserve (the Karvonen method).
This file explains the calculation, where each part lives in the code, and how to ask for changes.
It describes the code as it was first written; if you change the code, update this file.

## Files

| File | What it does |
| --- | --- |
| `heart-rate.logic.ts` | All the maths and the zone definitions. Plain TypeScript, no Angular. **Change numbers and zone texts here.** |
| `heart-rate-calculator.component.ts` | The form (reactive forms), validation limits, live result. |
| `heart-rate-calculator.component.html` | Layout and all visible text, except the zone names and descriptions (those are in the logic file). |
| `heart-rate-calculator.component.css` | Styling, including the zone colours (`.zone--1` to `.zone--5`). |
| `tools-heart-rate.component.*` (in `tools-pages/`) | The page at `/tools/heart-rate-zones` that hosts `<app-heart-rate-calculator>`. |

No metric/imperial switch is needed: the only inputs are age and beats per minute.

## The calculation

```
heart rate reserve (HRR) = max heart rate - resting heart rate
target heart rate        = resting heart rate + percentage x HRR
```

Using the reserve instead of a plain percentage of the max (as in `220 - age`) makes the zones personal:
a fitter person with a low resting heart rate gets different zones than someone with the same age and a higher one.

### Max heart rate

Two options, chosen by the visitor:

- **Estimate:** Tanaka formula, `208 - 0.7 x age`, rounded. It is more accurate than the older `220 - age`.
  Still only an average: one person can differ by 10 bpm or more.
- **Measured:** the visitor types their own max (from an all-out test or the highest value seen on a watch).
  Preferred when known.

Code: `estimateMaxHr()`.

### The five zones

| Zone | Name | % of HRR | Feel (talk test) | Typical use |
| --- | --- | --- | --- | --- |
| 1 | Recovery | 50 to 60% | Very easy, talk without effort | Warm-up, cool-down, recovery days |
| 2 | Endurance | 60 to 70% | Easy, full sentences | Most easy runs and long rides, aerobic base |
| 3 | Tempo | 70 to 80% | Comfortably hard, short sentences | Steady tempo runs, longer sustained efforts |
| 4 | Threshold | 80 to 90% | Hard, a few words | Threshold intervals, hard sustained work |
| 5 | Maximum | 90 to 100% | All out, no talking | Short intervals, sprints, in small doses |

Five zones in 10% steps is a common convention, not a law: other models use different splits or three zones.
Zone 1 starts at 50% of the reserve. Below that is not shown.

Code: `ZONE_DEFINITIONS` (percentages and all texts), `calculateZones()`.

### Rounding

Each zone's upper limit is `round(resting + upper% x HRR)`. Each zone then starts one beat above the previous
zone's upper limit, so ranges never overlap. Zone 5 always ends exactly at the max heart rate.

## Worked example

Age 34, resting heart rate 55 bpm, max estimated.

```
Max       = 208 - 0.7 x 34             = 184.2 -> 184
Reserve   = 184 - 55                   = 129

Zone 1    = 55 + 0.5 x 129 = 119.5 -> 120   to  55 + 0.6 x 129 = 132.4 -> 132
Zone 2    = 133                              to  55 + 0.7 x 129 = 145.3 -> 145
Zone 3    = 146                              to  55 + 0.8 x 129 = 158.2 -> 158
Zone 4    = 159                              to  55 + 0.9 x 129 = 171.1 -> 171
Zone 5    = 172                              to  184
```

## Limits and checks

- Validation (in the component): age 18 to 99, resting heart rate 30 to 120 bpm, measured max 120 to 230 bpm.
- If max minus resting is less than 20 bpm (`MIN_RESERVE`), no zones are shown and a message asks the visitor to check
  both values.
- The page says zones are best for running and cycling. For strength training heart rate lags behind the effort,
  so it points to reps in reserve instead. Keep this, since the site is about strength too.
- The page says: estimates, not medical advice, ask a doctor if on heart medication or with a heart condition.
  (Beta blockers, for example, lower heart rate and make the zones wrong.) Keep that.
- Not covered: under 18s, people who are pregnant, other formulas (such as Gulati for women).

## How to ask for changes

Say which part you want changed and give the new value or rule. Examples:

- "In `heart-rate.logic.ts`, change zone 2 to 60 to 75% and zone 3 to 75 to 85%."
- "Use three zones instead of five."
- "Add a second max heart rate formula for women (Gulati: 206 - 0.88 x age) and let the visitor choose."
- "Show the zones as pace ranges for runners" (needs extra input such as a recent race time).
- "Show a plain percentage of max as well, for people who use that method."

Where things live:

- A percentage, formula or zone text: `heart-rate.logic.ts`.
- A label, hint or message: `heart-rate-calculator.component.html`.
- A field limit: `heart-rate-calculator.component.ts`.
- Colours and layout: `heart-rate-calculator.component.css`.

Useful to include when you ask: the file name, the old and new value, and the example you expect
(for instance "age 34, resting 55 should give zone 2 as 133 to 145").

## Checking the maths

`heart-rate.logic.ts` has no Angular dependencies, so it can be tested on its own. Checks done when it was written:

- Max for age 34 = 184 and for age 20 = 194.
- The worked example above, including that zone 5 ends at the max and zones never overlap.
- A measured max is used instead of the estimate.
- No zones when the reserve is under 20 bpm.
- Every zone has its lower limit at or below its upper limit across a range of resting and max values.

If you change a number, re-check one example by hand, as in the worked example above.
