import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { AbstractControl, FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import {
  CalorieInput,
  CalorieResult,
  DailyActivity,
  Goal,
  Intensity,
  Sex,
  Workout,
  WorkoutType,
  calculateCalories,
} from './calorie.logic';
import { UnitSystem, cmToFeetInches, feetInchesToCm, kgToLb, lbToKg, round1 } from './units';

type WorkoutGroup = FormGroup<{
  type: FormControl<WorkoutType>;
  intensity: FormControl<Intensity>;
  sessionsPerWeek: FormControl<number | null>;
  minutes: FormControl<number | null>;
}>;

const UNITS_STORAGE_KEY = 'activewithraph.units';

@Component({
  selector: 'app-calorie-calculator',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './calorie-calculator.component.html',
  styleUrls: ['./calorie-calculator.component.scss'],
})
export class CalorieCalculatorComponent implements OnDestroy {
  readonly maxWorkouts = 6;

  readonly unitOptions: { value: UnitSystem; label: string }[] = [
    { value: 'metric', label: 'Metric' },
    { value: 'imperial', label: 'Imperial' },
  ];

  readonly dailyOptions: { value: DailyActivity; title: string; text: string }[] = [
    { value: 'low', title: 'Mostly sitting', text: 'Desk job or studying, under about 5,000 steps a day.' },
    { value: 'some', title: 'Some walking', text: 'About 5,000 to 9,000 steps, or on your feet part of the day.' },
    { value: 'high', title: 'On my feet a lot', text: 'Over 10,000 steps, or a physically active job.' },
  ];

  readonly workoutTypes: { value: WorkoutType; label: string }[] = [
    { value: 'strength', label: 'Strength' },
    { value: 'running', label: 'Running' },
    { value: 'cycling', label: 'Cycling' },
  ];

  readonly intensities: { value: Intensity; label: string }[] = [
    { value: 'easy', label: 'Easy' },
    { value: 'moderate', label: 'Moderate' },
    { value: 'hard', label: 'Hard' },
  ];

  readonly goals: { value: Goal; label: string }[] = [
    { value: 'lose', label: 'Lose weight' },
    { value: 'maintain', label: 'Maintain' },
    { value: 'gain', label: 'Gain weight' },
  ];

  /**
   * Height and weight exist once per unit system. Only the controls of the active system are enabled,
   * and disabled controls are ignored by form validation.
   */
  readonly form = new FormGroup({
    units: new FormControl<UnitSystem>('metric', { nonNullable: true }),
    sex: new FormControl<Sex | null>(null, Validators.required),
    age: new FormControl<number | null>(null, [Validators.required, Validators.min(18), Validators.max(99)]),
    heightCm: new FormControl<number | null>(null, [Validators.required, Validators.min(120), Validators.max(230)]),
    weightKg: new FormControl<number | null>(null, [Validators.required, Validators.min(35), Validators.max(250)]),
    heightFt: new FormControl<number | null>(null, [Validators.required, Validators.min(4), Validators.max(7)]),
    heightIn: new FormControl<number | null>(null, [Validators.required, Validators.min(0), Validators.max(11)]),
    weightLb: new FormControl<number | null>(null, [Validators.required, Validators.min(77), Validators.max(550)]),
    dailyActivity: new FormControl<DailyActivity | null>(null, Validators.required),
    workouts: new FormArray<WorkoutGroup>([]),
    goal: new FormControl<Goal>('maintain', { nonNullable: true }),
  });

  /** null until every field is filled in correctly. */
  result: CalorieResult | null = null;

  private readonly subscriptions = new Subscription();

  constructor() {
    const saved = this.loadUnits();
    this.form.controls.units.setValue(saved, { emitEvent: false });
    this.applyUnits(saved, false);

    this.subscriptions.add(this.form.controls.units.valueChanges.subscribe((u) => this.onUnitsChanged(u)));
    this.subscriptions.add(this.form.valueChanges.subscribe(() => this.update()));
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  get isImperial(): boolean {
    return this.form.controls.units.value === 'imperial';
  }

  get workouts(): FormArray<WorkoutGroup> {
    return this.form.controls.workouts;
  }

  get canAddWorkout(): boolean {
    return this.workouts.length < this.maxWorkouts;
  }

  addWorkout(): void {
    if (!this.canAddWorkout) {
      return;
    }
    this.workouts.push(
      new FormGroup({
        type: new FormControl<WorkoutType>('strength', { nonNullable: true }),
        intensity: new FormControl<Intensity>('moderate', { nonNullable: true }),
        sessionsPerWeek: new FormControl<number | null>(null, [
          Validators.required,
          Validators.min(1),
          Validators.max(14),
        ]),
        minutes: new FormControl<number | null>(null, [Validators.required, Validators.min(10), Validators.max(240)]),
      })
    );
  }

  removeWorkout(index: number): void {
    this.workouts.removeAt(index);
  }

  /** True when a field has been touched and is invalid, to show its error message. */
  showError(control: AbstractControl): boolean {
    return control.invalid && (control.touched || control.dirty);
  }

  get goalText(): string {
    switch (this.form.controls.goal.value) {
      case 'lose':
        return 'to lose weight steadily, about 15% below maintenance';
      case 'gain':
        return 'to gain weight gradually, about 10% above maintenance';
      default:
        return 'to keep your weight stable';
    }
  }

  private onUnitsChanged(units: UnitSystem): void {
    this.applyUnits(units, true);
    this.saveUnits(units);
  }

  /** Enables the controls of the chosen system and, when asked, converts what was already typed. */
  private applyUnits(units: UnitSystem, convert: boolean): void {
    const c = this.form.controls;
    const quiet = { emitEvent: false };

    if (units === 'imperial') {
      if (convert) {
        if (c.heightCm.value !== null) {
          const { feet, inches } = cmToFeetInches(c.heightCm.value);
          c.heightFt.setValue(feet, quiet);
          c.heightIn.setValue(inches, quiet);
        }
        if (c.weightKg.value !== null) {
          c.weightLb.setValue(round1(kgToLb(c.weightKg.value)), quiet);
        }
      }
      c.heightCm.disable(quiet);
      c.weightKg.disable(quiet);
      c.heightFt.enable(quiet);
      c.heightIn.enable(quiet);
      c.weightLb.enable(quiet);
    } else {
      if (convert) {
        if (c.heightFt.value !== null && c.heightIn.value !== null) {
          c.heightCm.setValue(Math.round(feetInchesToCm(c.heightFt.value, c.heightIn.value)), quiet);
        }
        if (c.weightLb.value !== null) {
          c.weightKg.setValue(round1(lbToKg(c.weightLb.value)), quiet);
        }
      }
      c.heightFt.disable(quiet);
      c.heightIn.disable(quiet);
      c.weightLb.disable(quiet);
      c.heightCm.enable(quiet);
      c.weightKg.enable(quiet);
    }
    this.update();
  }

  private update(): void {
    this.result = this.form.valid ? calculateCalories(this.toInput()) : null;
  }

  private toInput(): CalorieInput {
    const v = this.form.getRawValue();
    const imperial = v.units === 'imperial';
    // The form is valid at this point, so the required values are present.
    return {
      sex: v.sex as Sex,
      age: v.age as number,
      heightCm: imperial ? feetInchesToCm(v.heightFt as number, v.heightIn as number) : (v.heightCm as number),
      weightKg: imperial ? lbToKg(v.weightLb as number) : (v.weightKg as number),
      dailyActivity: v.dailyActivity as DailyActivity,
      goal: v.goal,
      workouts: v.workouts.map(
        (w): Workout => ({
          type: w.type,
          intensity: w.intensity,
          sessionsPerWeek: w.sessionsPerWeek as number,
          minutes: w.minutes as number,
        })
      ),
    };
  }

  // Browser storage can be unavailable (private mode, blocked cookies), so always guard it.
  private loadUnits(): UnitSystem {
    try {
      const value = localStorage.getItem(UNITS_STORAGE_KEY);
      return value === 'imperial' ? 'imperial' : 'metric';
    } catch {
      return 'metric';
    }
  }

  private saveUnits(units: UnitSystem): void {
    try {
      localStorage.setItem(UNITS_STORAGE_KEY, units);
    } catch {
      /* ignore */
    }
  }
}