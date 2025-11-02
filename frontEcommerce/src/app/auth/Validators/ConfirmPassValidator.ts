import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function passwordMatchValidator(passwordKey: string, confirmPasswordKey: string): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const password = group.get(passwordKey)?.value;
    const confirmPassword = group.get(confirmPasswordKey)?.value;

    if (password !== confirmPassword) {
      group.get(confirmPasswordKey)?.setErrors({ mismatch: true });
    } else {
      // Clean up previous mismatch error if now valid
      const errors = group.get(confirmPasswordKey)?.errors;
      if (errors) {
        delete errors['mismatch'];
        if (Object.keys(errors).length === 0) {
          group.get(confirmPasswordKey)?.setErrors(null);
        } else {
          group.get(confirmPasswordKey)?.setErrors(errors);
        }
      }
    }

    return null;
  };
}
