import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import {
  UnitSystem,
  cmToFeetInches,
  feetInchesToCm,
  kgToLb,
  lbToKg,
  round1,
} from '../calorie-calculator/units';
import { BmiCategory, BmiResult, calculateBmi } from './bmi.logic';

/** Same key as the other calculators, so the visitor picks metric or imperial only once. */
const UNITS_STORAGE_KEY = 'activewithraph.units';

@Component({
  selector: 'app-bmi-calculator',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './bmi-calculator.component.html',
  styleUrls: ['./bmi-calculator.component.scss'],
})
export class BmiCalculatorComponent implements OnDestroy {
  readonly unitOptions: { value: UnitSystem; label: string }[] = [
    { value: 'metric', label: 'Metric' },
    { value: 'imperial', label: 'Imperial' },
  ];

  /** Shown under the scale; the segments of the bar use the same widths (see bmi.logic.ts for the limits). */
  readonly categoryLabels: Record<BmiCategory, string> = {
    underweight: 'Underweight',
    normal: 'Healthy range',
    overweight: 'Overweight',
    obese: 'Obese',
  };

  readonly categoryTexts: Record<BmiCategory, string> = {
    underweight: 'Your BMI is below 18.5. If you are losing weight without trying, or you feel weak or tired, talk to a doctor.',
    normal: 'Your BMI is between 18.5 and 24.9, which is the healthy range for most adults.',
    overweight: 'Your BMI is between 25 and 29.9. For people who lift weights this often says little, because muscle is heavy (see the note below).',
    obese: 'Your BMI is 30 or higher. BMI is only a rough screen. A doctor can look at the full picture, including waist size and fitness.',
  };

  /** Height and weight exist once per unit system; only the active ones are enabled. */
  readonly form = new FormGroup({
    units: new FormControl<UnitSystem>('metric', { nonNullable: true }),
    heightCm: new FormControl<number | null>(null, [Validators.required, Validators.min(120), Validators.max(230)]),
    weightKg: new FormControl<number | null>(null, [Validators.required, Validators.min(35), Validators.max(250)]),
    heightFt: new FormControl<number | null>(null, [Validators.required, Validators.min(4), Validators.max(7)]),
    heightIn: new FormControl<number | null>(null, [Validators.required, Validators.min(0), Validators.max(11)]),
    weightLb: new FormControl<number | null>(null, [Validators.required, Validators.min(77), Validators.max(550)]),
  });

  /** null until the form is valid. */
  result: BmiResult | null = null;

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

  /** The healthy weight range in the unit the visitor uses, e.g. "56 to 75 kg" or "123 to 165 lb". */
  get healthyRange(): string {
    if (!this.result) return '';
    const { healthyMinKg, healthyMaxKg } = this.result;
    if (this.isImperial) {
      return `${Math.round(kgToLb(healthyMinKg))} to ${Math.round(kgToLb(healthyMaxKg))} lb`;
    }
    return `${Math.round(healthyMinKg)} to ${Math.round(healthyMaxKg)} kg`;
  }

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
    if (!this.form.valid) {
      this.result = null;
      return;
    }
    const v = this.form.getRawValue();
    const imperial = v.units === 'imperial';
    this.result = calculateBmi({
      heightCm: imperial ? feetInchesToCm(v.heightFt as number, v.heightIn as number) : (v.heightCm as number),
      weightKg: imperial ? lbToKg(v.weightLb as number) : (v.weightKg as number),
    });
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
