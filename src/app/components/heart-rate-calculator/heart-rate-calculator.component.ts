import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { HeartRateResult, HeartRateZone, MaxSource, MIN_RESERVE, calculateZones } from './heart-rate.logic';

@Component({
  selector: 'app-heart-rate-calculator',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './heart-rate-calculator.component.html',
  styleUrls: ['./heart-rate-calculator.component.scss'],
})
export class HeartRateCalculatorComponent implements OnDestroy {
  readonly minReserve = MIN_RESERVE;

  readonly form = new FormGroup({
    age: new FormControl<number | null>(null, [Validators.required, Validators.min(18), Validators.max(99)]),
    restingHr: new FormControl<number | null>(null, [Validators.required, Validators.min(30), Validators.max(120)]),
    maxSource: new FormControl<MaxSource>('estimate', { nonNullable: true }),
    // Only used (enabled) when the visitor knows their own max heart rate.
    measuredMaxHr: new FormControl<number | null>({ value: null, disabled: true }, [
      Validators.required,
      Validators.min(120),
      Validators.max(230),
    ]),
  });

  /** null until the form is valid and the numbers make sense. */
  result: HeartRateResult | null = null;

  /** True when the form is valid but the max and resting heart rate are too close together. */
  reserveTooSmall = false;

  private readonly subscriptions = new Subscription();

  constructor() {
    this.subscriptions.add(
      this.form.controls.maxSource.valueChanges.subscribe((source) => {
        const measured = this.form.controls.measuredMaxHr;
        if (source === 'measured') {
          measured.enable({ emitEvent: false });
        } else {
          measured.disable({ emitEvent: false });
        }
        this.update();
      })
    );
    this.subscriptions.add(this.form.valueChanges.subscribe(() => this.update()));
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  get isMeasured(): boolean {
    return this.form.controls.maxSource.value === 'measured';
  }

  showError(control: AbstractControl): boolean {
    return control.invalid && (control.touched || control.dirty);
  }

  /** Where a zone starts and how wide it is, as a percentage of the bar from resting to max. */
  barLeft(zone: HeartRateZone): number {
    const r = this.result;
    return r ? ((zone.low - r.restingHr) / r.reserve) * 100 : 0;
  }

  barWidth(zone: HeartRateZone): number {
    const r = this.result;
    return r ? ((zone.high - zone.low + 1) / r.reserve) * 100 : 0;
  }

  private update(): void {
    this.result = null;
    this.reserveTooSmall = false;

    if (!this.form.valid) {
      return;
    }

    const v = this.form.getRawValue();
    const result = calculateZones({
      age: v.age as number,
      restingHr: v.restingHr as number,
      measuredMaxHr: v.maxSource === 'measured' ? (v.measuredMaxHr as number) : null,
    });

    if (result) {
      this.result = result;
    } else {
      this.reserveTooSmall = true;
    }
  }
}
