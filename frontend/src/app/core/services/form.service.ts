import { Injectable, signal, inject } from '@angular/core';
import { ApiClientService } from './api-client.service';
import { Observable, tap, of } from 'rxjs';

interface FormConfig {
  debounce?: number;
  validateOnBlur?: boolean;
  validateOnChange?: boolean;
  autoSave?: boolean;
  autoSaveDelay?: number;
}

interface FormField<T = any> {
  value: T;
  error: string | null;
  touched: boolean;
  dirty: boolean;
  valid: boolean;
}

type Validator<T> = (value: T) => string | null;

interface FormState<T extends Record<string, any>> {
  values: T;
  fields: { [K in keyof T]: FormField<T[K]> };
  isValid: boolean;
  isDirty: boolean;
  isSubmitting: boolean;
  submitCount: number;
  errors: Partial<Record<keyof T, string>>;
}

@Injectable({
  providedIn: 'root',
})
export class FormService {
  private api = inject(ApiClientService);

  /**
   * إنشاء نموذج ديناميكي
   */
  createForm<T extends Record<string, any>>(
    initialValues: T,
    validators: Partial<Record<keyof T, Validator<any>[]>> = {},
    config: FormConfig = {},
  ) {
    // إنشاء حالة الحقول
    const fields = {} as { [K in keyof T]: FormField<T[K]> };
    for (const key in initialValues) {
      fields[key] = {
        value: initialValues[key],
        error: null,
        touched: false,
        dirty: false,
        valid: true,
      };
    }

    const state = signal<FormState<T>>({
      values: { ...initialValues },
      fields,
      isValid: true,
      isDirty: false,
      isSubmitting: false,
      submitCount: 0,
      errors: {},
    });

    // تعيين قيمة حقل
    const setValue = <K extends keyof T>(key: K, value: T[K]) => {
      state.update((s) => {
        const newValues = { ...s.values, [key]: value };
        const field = { ...s.fields[key], value, dirty: true };

        // التحقق من الصحة إذا كان مطلوباً
        if (config.validateOnChange) {
          const error = validateField(key, value);
          field.error = error;
          field.valid = !error;
        }

        const newFields = { ...s.fields, [key]: field };
        const errors = getErrors(newFields);

        return {
          ...s,
          values: newValues,
          fields: newFields,
          isDirty: true,
          isValid: Object.values(newFields).every((f) => f.valid),
          errors,
        };
      });
    };

    // التحقق من حقل
    const validateField = <K extends keyof T>(key: K, value: T[K]): string | null => {
      const fieldValidators = validators[key];
      if (!fieldValidators) return null;

      for (const validator of fieldValidators) {
        const error = validator(value);
        if (error) return error;
      }
      return null;
    };

    // الحصول على الأخطاء
    const getErrors = (fields: { [K in keyof T]: FormField<T[K]> }) => {
      const errors: Partial<Record<keyof T, string>> = {};
      for (const key in fields) {
        if (fields[key].error) {
          errors[key] = fields[key].error!;
        }
      }
      return errors;
    };

    // لمس حقل (blur)
    const touchField = <K extends keyof T>(key: K) => {
      state.update((s) => {
        const field = { ...s.fields[key], touched: true };

        if (config.validateOnBlur) {
          const error = validateField(key, s.values[key]);
          field.error = error;
          field.valid = !error;
        }

        const newFields = { ...s.fields, [key]: field };

        return {
          ...s,
          fields: newFields,
          isValid: Object.values(newFields).every((f) => f.valid),
          errors: getErrors(newFields),
        };
      });
    };

    // التحقق من كل النموذج
    const validate = (): boolean => {
      state.update((s) => {
        const newFields = { ...s.fields };

        for (const key in newFields) {
          const error = validateField(key, s.values[key]);
          newFields[key] = {
            ...newFields[key],
            error,
            valid: !error,
            touched: true,
          };
        }

        return {
          ...s,
          fields: newFields,
          isValid: Object.values(newFields).every((f) => f.valid),
          errors: getErrors(newFields),
        };
      });

      return state().isValid;
    };

    // إعادة تعيين النموذج
    const reset = (values?: T) => {
      const resetValues = values || initialValues;
      const resetFields = {} as { [K in keyof T]: FormField<T[K]> };

      for (const key in resetValues) {
        resetFields[key] = {
          value: resetValues[key],
          error: null,
          touched: false,
          dirty: false,
          valid: true,
        };
      }

      state.set({
        values: { ...resetValues },
        fields: resetFields,
        isValid: true,
        isDirty: false,
        isSubmitting: false,
        submitCount: 0,
        errors: {},
      });
    };

    // الإرسال
    const submit = async (handler: (values: T) => Promise<any> | Observable<any>) => {
      if (!validate()) return;

      state.update((s) => ({
        ...s,
        isSubmitting: true,
        submitCount: s.submitCount + 1,
      }));

      try {
        const result = handler(state().values);
        if (result instanceof Observable) {
          await result.toPromise();
        } else {
          await result;
        }
      } finally {
        state.update((s) => ({ ...s, isSubmitting: false }));
      }
    };

    return {
      state: state.asReadonly(),
      setValue,
      touchField,
      validate,
      reset,
      submit,
      getFieldProps: <K extends keyof T>(key: K) => ({
        value: state().values[key],
        error: state().fields[key].error,
        touched: state().fields[key].touched,
        onChange: (value: T[K]) => setValue(key, value),
        onBlur: () => touchField(key),
      }),
    };
  }

  // ============ Validators ============

  static required(message = 'هذا الحقل مطلوب'): Validator<any> {
    return (value) => {
      if (value === null || value === undefined || value === '') {
        return message;
      }
      return null;
    };
  }

  static email(message = 'البريد الإلكتروني غير صحيح'): Validator<string> {
    return (value) => {
      if (!value) return null;
      const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return regex.test(value) ? null : message;
    };
  }

  static minLength(min: number, message?: string): Validator<string> {
    return (value) => {
      if (!value) return null;
      return value.length >= min ? null : message || `الحد الأدنى ${min} حرف`;
    };
  }

  static maxLength(max: number, message?: string): Validator<string> {
    return (value) => {
      if (!value) return null;
      return value.length <= max ? null : message || `الحد الأقصى ${max} حرف`;
    };
  }

  static min(min: number, message?: string): Validator<number> {
    return (value) => {
      if (value === null || value === undefined) return null;
      return value >= min ? null : message || `الحد الأدنى ${min}`;
    };
  }

  static max(max: number, message?: string): Validator<number> {
    return (value) => {
      if (value === null || value === undefined) return null;
      return value <= max ? null : message || `الحد الأقصى ${max}`;
    };
  }

  static pattern(regex: RegExp, message: string): Validator<string> {
    return (value) => {
      if (!value) return null;
      return regex.test(value) ? null : message;
    };
  }

  static phone(message = 'رقم الهاتف غير صحيح'): Validator<string> {
    return FormService.pattern(/^[\+]?[0-9]{10,15}$/, message);
  }

  static url(message = 'الرابط غير صحيح'): Validator<string> {
    return (value) => {
      if (!value) return null;
      try {
        new URL(value);
        return null;
      } catch {
        return message;
      }
    };
  }

  static match(fieldName: string, message?: string): Validator<any> {
    return (value, formValues?: any) => {
      if (!formValues) return null;
      return value === formValues[fieldName] ? null : message || 'القيم غير متطابقة';
    };
  }
}
