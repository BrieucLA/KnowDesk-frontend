import type { LoginFormState, LoginFormErrors } from '../types';

/**
 * Validates the login form fields.
 * Returns an error object — empty object means "no errors".
 *
 * Keeping validation separate from the component makes it trivially testable:
 *   expect(validateLogin({ email: '', password: '' })).toHaveProperty('email')
 */
export function validateLoginForm(values: LoginFormState): LoginFormErrors {
  const errors: LoginFormErrors = {};

  if (!values.email.trim()) {
    errors.email = 'L\'adresse email est requise.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = 'L\'adresse email n\'est pas valide.';
  }

  if (!values.password) {
    errors.password = 'Le mot de passe est requis.';
  } else if (values.password.length < 6) {
    errors.password = 'Le mot de passe doit contenir au moins 6 caractères.';
  }

  return errors;
}

/** Returns true only when there are no validation errors */
export function isFormValid(errors: LoginFormErrors): boolean {
  return Object.keys(errors).length === 0;
}
