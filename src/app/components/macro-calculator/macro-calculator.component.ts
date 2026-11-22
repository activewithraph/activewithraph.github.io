import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { UnitSystem, kgToLb, lbToKg, round1 } from '../calorie-calculator/units';
import { EatingStyle, MacroResult, calculateMacros } from './macros.logic';

/** Same key as the calorie calculator, so the visitor picks metric or imperial only once. */
const UNITS_STORAGE_KEY = 'activewithraph.units';

@Component({
  selector: 'app-macro-calculator',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './macro-calculator.component.html',
  styleUrls: ['./macro-calculator.component.scss'],
})
export class MacroCalculatorComponent implements OnDestroy {
  readonly unitOptions: { value: UnitSystem; label: string }[] = [
    { value: 'metric', label: 'Metric' },
    { value: 'imperial', label: 'Imperial' },
  ];

  readonly styleOptions: { value: EatingStyle; title: string; text: string }[] = [
    { value: 'balanced', title: 'Balanced', text: 'A good all-round split. The default.' },
    { value: 'endurance', title: 'Endurance', text: 'More carbs, to fuel long runs and rides.' },
    { value: 'muscle', title: 'Muscle', text: 'More protein, to build or keep muscle. Also good while losing weight.' },
  ];

  /** Weight exists once per unit system; only the active one is enabled (disabled controls are ignored by validation). */
  readonly form = new FormGroup({
    calories: new FormControl<number | null>(null, [Validators.required, Validators.min(1000), Validators.max(6000)]),
    units: new FormControl<UnitSystem>('metric', { nonNullable: true }),
    weightKg: new FormControl<number | null>(null, [Validators.required, Validators.min(35), Validators.max(250)]),
    weightLb: new FormControl<number | null>(null, [Validators.required, Validators.min(77), Validators.max(550)]),
    style: new FormControl<EatingStyle>('balanced', { nonNullable: true }),
  });

  /** null until the form is valid. */
  result: MacroResult | null = null;

  /** True when the form is valid but protein and fat already use up all the calories. */
  tooFewCalories = false;

  private readonly subscriptions = new Subscription();

  constructor() {
    const saved = this.loadUnits();
    this.form.controls.units.setValue(saved, { emitEvent: false });
    this.applyUnits(saved, false);

    this.subscriptions.add(
      this.form.controls.units.valueChanges.subscribe((units) => {
        this.applyUnits(units, true);
        this.saveUnits(units);
      })
    );
    this.subscriptions.add(this.form.valueChanges.subscribe(() => this.update()));
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  get isImperial(): boolean {
    return this.form.controls.units.value === 'imperial';
  }

  showError(control: AbstractControl): boolean {
    return control.invalid && (control.touched || control.dirty);
  }

  /** One line that explains why the protein amount is what it is, so the number doesn't look arbitrary. */
  get proteinNote(): string {
    const v = this.form.getRawValue();
    if (v.style === 'muscle') {
      return 'That is 2 grams per kilogram of body weight, at the high end of what studies suggest for people who lift. It helps you build muscle, or keep it while you lose weight.';
    }
    return 'That is 1.6 grams per kilogram of body weight. Studies suggest this is enough for most people who train, and eating more adds little.';
  }

  private applyUnits(units: UnitSystem, convert: boolean): void {
    const c = this.form.controls;
    const quiet = { emitEvent: false };

    if (units === 'imperial') {
      if (convert && c.weightKg.value !== null) {
        c.weightLb.setValue(round1(kgToLb(c.weightKg.value)), quiet);
      }
      c.weightKg.disable(quiet);
      c.weightLb.enable(quiet);
    } else {
      if (convert && c.weightLb.value !== null) {
        c.weightKg.setValue(round1(lbToKg(c.weightLb.value)), quiet);
      }
      c.weightLb.disable(quiet);
      c.weightKg.enable(quiet);
    }
    this.update();
  }

  private update(): void {
    this.result = null;
    this.tooFewCalories = false;

    if (!this.form.valid) {
      return;
    }

    const v = this.form.getRawValue();
    const weightKg = v.units === 'imperial' ? lbToKg(v.weightLb as number) : (v.weightKg as number);
    const result = calculateMacros({
      calories: v.calories as number,
      weightKg,
      style: v.style,
    });

    if (result) {
      this.result = result;
    } else {
      this.tooFewCalories = true;
    }
  }

  // Browser storage can be unavailable (private mode, blocked cookies), so always guard it.
  private loadUnits(): UnitSystem {
    try {
      return localStorage.getItem(UNITS_STORAGE_KEY) === 'imperial' ? 'imperial' : 'metric';
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