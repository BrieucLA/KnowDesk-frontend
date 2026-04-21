import React from 'react';
import { cn } from '../../lib/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?:      string;
  error?:      string;
  helperText?: string;
  leftIcon?:   React.ReactNode;
  /** Pass a unique id — required when using label */
  id: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, id, className, ...rest }, ref) => {
    const errorId  = `${id}-error`;
    const helperId = `${id}-helper`;

    return (
      <div className="field">
        {label && (
          <label htmlFor={id} className="field-label">
            {label}
            {rest.required && <span className="field-required" aria-hidden="true"> *</span>}
          </label>
        )}

        <div className={cn('field-wrap', leftIcon ? 'field-wrap--icon' : '')}>
          {leftIcon && (
            <span className="field-icon" aria-hidden="true">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={id}
            className={cn('field-input', error && 'field-input--error', className)}
            aria-invalid={!!error}
            aria-describedby={cn(error && errorId, helperText && helperId) || undefined}
            {...rest}
          />
        </div>

        {error && (
          <p id={errorId} className="field-error" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={helperId} className="field-helper">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
