import { Injector, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ValidatorFn } from '@angular/forms/src/directives/validators';

import { OBaseComponent, IComponent } from './o-component.class';
import { InputConverter } from '../decorators';
import { OFormComponent } from './form/o-form.component';
import { OFormValue } from './form/OFormValue';
import { SQLTypes } from '../utils';


export interface IFormDataTypeComponent extends IComponent {
  getSQLType(): number;
}

export interface IFormControlComponent extends IComponent {
  getControl(): FormControl;
  getFormControl(): FormControl;
  hasError(error: string): boolean;
}

export interface IFormDataComponent {
  data(value: any);
  isAutomaticBinding(): Boolean;
}

export class OFormDataComponent extends OBaseComponent implements IFormControlComponent, IFormDataTypeComponent,
  IFormDataComponent, OnInit, OnDestroy {
  /* Inputs */
  protected sqlType: string;
  @InputConverter()
  autoBinding: boolean = true;

  /* Internal variables */
  protected value: OFormValue;
  protected defaultValue: any = undefined;
  protected _SQLType: number = SQLTypes.OTHER;
  protected _defaultSQLTypeKey: string = 'OTHER';
  protected _fControl: FormControl;
  protected elRef: ElementRef;
  protected form: OFormComponent;

  constructor(
    form: OFormComponent,
    elRef: ElementRef,
    injector: Injector
  ) {
    super(injector);
    this.form = form;
    this.elRef = elRef;
  }

  ngOnInit() {
    this.initialize();
  }

  ngOnDestroy() {
    this.destroy();
  }

  getFormGroup(): FormGroup {
    return this.form ? this.form.formGroup : undefined;
  }

  getFormControl(): FormControl {
    return this._fControl;
  }

  hasError(error: string): boolean {
    return !this.isReadOnly && this._fControl.touched && this._fControl.hasError(error);
  }

  getErrorValue(error: string, prop: string): string {
    return this._fControl.hasError(error) ? this._fControl.getError(error)[prop] || '' : '';
  }

  initialize() {
    super.initialize();
    if (this.form) {
      this.registerFormListeners();
      this._isReadOnly = this.form.isInInitialMode() ? true : false;
    } else {
      this._isReadOnly = this._disabled;
    }
  }

  destroy() {
    this.unregisterFormListeners();
  }

  registerFormListeners() {
    if (this.form) {
      this.form.registerFormComponent(this);
      this.form.registerFormControlComponent(this);
      this.form.registerSQLTypeFormComponent(this);
    }
  }

  unregisterFormListeners() {
    if (this.form) {
      this.form.unregisterFormComponent(this);
      this.form.unregisterFormControlComponent(this);
      this.form.unregisterSQLTypeFormComponent(this);
    }
  }

  set data(value: any) {
    this.setData(value);
  }

  setData(value: any) {
    this.ensureOFormValue(value);
    if (this._fControl) {
      this._fControl.setValue(value.value, {
        emitModelToViewChange: false,
        emitEvent: false
      });
    }
  }

  isAutomaticBinding(): Boolean {
    return this.autoBinding;
  }

  getValue(): any {
    if (this.value instanceof OFormValue) {
      if (this.value.value !== undefined) {
        return this.value.value;
      }
    }
    return this.defaultValue;
  }

  setValue(val: any) {
    this.ensureOFormValue(val);
    if (this._fControl) {
      this._fControl.setValue(val);
      this._fControl.markAsDirty();
    }
  }

  ensureOFormValue(value: any) {
    if (value instanceof OFormValue) {
      this.value = new OFormValue(value.value);
    } else if (value !== undefined && !(value instanceof OFormValue)) {
      this.value = new OFormValue(value);
    } else {
      this.value = new OFormValue(this.defaultValue);
    }

    /*
    * Temporary code
    * I do not understand the reason why MdInput is not removing 'mat-empty' clase despite of the fact that
    * the input element of the description is binding value attribute
    */
    let placeHolderLbl = this.elRef.nativeElement.querySelectorAll('label.mat-input-placeholder');
    if (placeHolderLbl.length) {
      // Take only first, nested element does not matter.
      let element = placeHolderLbl[0];
      if (!this.isEmpty()) {
        element.classList.remove('mat-empty');
      }
    }
  }

  getControl(): FormControl {
    if (!this._fControl) {
      let validators: ValidatorFn[] = this.resolveValidators();
      let cfg = {
        value: this.value ? this.value.value : undefined,
        disabled: this.isDisabled
      };
      this._fControl = new FormControl(cfg, validators);
    }
    return this._fControl;
  }

  resolveValidators(): ValidatorFn[] {
    let validators: ValidatorFn[] = [];

    if (this.orequired) {
      validators.push(Validators.required);
    }
    return validators;
  }

  getSQLType(): number {
    let sqlt = this.sqlType && this.sqlType.length > 0 ? this.sqlType : this._defaultSQLTypeKey;
    this._SQLType = SQLTypes.getSQLTypeValue(sqlt);
    return this._SQLType;
  }

  get isValid() {
    if (this._fControl) {
      return this._fControl.valid;
    }
    return false;
  }

  isEmpty(): boolean {
    if (this.value instanceof OFormValue) {
      if (this.value.value !== undefined) {
        return false;
      }
    }
    return true;
  }

}
