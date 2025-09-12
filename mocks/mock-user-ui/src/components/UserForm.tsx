import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { User, CreateUserRequest, UpdateUserRequest, ApiError } from '../types';
import { userService } from '../services';
import './UserForm.scss';

interface UserFormData {
  email: string;
  password: string;
  displayName: string;
}

interface UserFormProps {
  user?: User | null; // If provided, form is in edit mode
  onSave?: (user: User, isNew: boolean) => void;
  onCancel?: () => void;
  onError?: (error: string) => void;
}

export const UserForm: React.FC<UserFormProps> = ({
  user,
  onSave,
  onCancel,
  onError
}) => {
  const isEditMode = !!user;
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = React.useState<string | null>(null);
  const formRef = React.useRef<HTMLDivElement>(null);
  const firstInputRef = React.useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isDirty },
    reset,
    watch
  } = useForm<UserFormData>({
    mode: 'onChange',
    defaultValues: {
      email: user?.email || '',
      password: '',
      displayName: user?.displayName || ''
    }
  });

  // Reset form when user prop changes
  useEffect(() => {
    if (user) {
      reset({
        email: user.email,
        password: '',
        displayName: user.displayName
      });
    } else {
      reset({
        email: '',
        password: '',
        displayName: ''
      });
    }
    setSubmitError(null);
    setSubmitSuccess(null);
  }, [user, reset]);

  // Focus management
  useEffect(() => {
    // Focus the first input when the form opens
    if (firstInputRef.current) {
      firstInputRef.current.focus();
    }

    // Trap focus within the modal
    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab' && formRef.current) {
        const focusableElements = formRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    document.addEventListener('keydown', handleTabKey);
    return () => document.removeEventListener('keydown', handleTabKey);
  }, []);

  const onSubmit = async (data: UserFormData) => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);
      setSubmitSuccess(null);

      let result: User;

      if (isEditMode && user) {
        // Update existing user
        const updateData: UpdateUserRequest = {
          email: data.email !== user.email ? data.email : undefined,
          displayName: data.displayName !== user.displayName ? data.displayName : undefined,
          password: data.password ? data.password : undefined
        };

        // Only send fields that have changed
        const hasChanges = Object.values(updateData).some(value => value !== undefined);
        
        if (!hasChanges) {
          setSubmitError('No changes detected');
          return;
        }

        result = await userService.updateUser(user.uid, updateData);
        setSubmitSuccess('User updated successfully!');
      } else {
        // Create new user
        const createData: CreateUserRequest = {
          email: data.email,
          password: data.password,
          displayName: data.displayName
        };

        result = await userService.createUser(createData);
        setSubmitSuccess('User created successfully!');
        
        // Reset form after successful creation
        reset();
      }

      // Call success callback
      if (onSave) {
        onSave(result, !isEditMode);
      }

    } catch (err) {
      const apiError = err as ApiError;
      const errorMessage = apiError.message || 'An unexpected error occurred';
      setSubmitError(errorMessage);
      
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    reset();
    setSubmitError(null);
    setSubmitSuccess(null);
    
    if (onCancel) {
      onCancel();
    }
  };

  // Watch password field to show strength indicator
  const password = watch('password');

  const getPasswordStrength = (pwd: string): { strength: number; label: string; color: string } => {
    if (!pwd) return { strength: 0, label: '', color: '' };
    
    let strength = 0;
    if (pwd.length >= 6) strength++;
    if (pwd.length >= 8) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[a-z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[^A-Za-z0-9]/.test(pwd)) strength++;

    if (strength <= 2) return { strength, label: 'Weak', color: '#dc3545' };
    if (strength <= 4) return { strength, label: 'Medium', color: '#ffc107' };
    return { strength, label: 'Strong', color: '#28a745' };
  };

  const passwordStrength = getPasswordStrength(password || '');

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleCancel();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <div 
      className="user-form-overlay" 
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-form-title"
      aria-describedby="user-form-description"
    >
      <div className="user-form" ref={formRef}>
      <div className="form-header">
        <h2 id="user-form-title">{isEditMode ? 'Edit User' : 'Create New User'}</h2>
        <p id="user-form-description" className="form-description">
          {isEditMode 
            ? 'Update user information. Leave password empty to keep current password.'
            : 'Fill in the details to create a new test user account.'
          }
        </p>
      </div>

      {submitError && (
        <div className="alert alert-error" role="alert" aria-live="polite">
          <strong>Error:</strong> {submitError}
        </div>
      )}

      {submitSuccess && (
        <div className="alert alert-success" role="alert" aria-live="polite">
          <strong>Success:</strong> {submitSuccess}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="form">
        <div className="form-group">
          <label htmlFor="email" className="form-label">
            Email Address *
          </label>
          <input
            id="email"
            type="email"
            className={`form-input ${errors.email ? 'error' : ''}`}
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Please enter a valid email address'
              }
            })}
            ref={firstInputRef}
            placeholder="user@example.com"
            aria-invalid={errors.email ? 'true' : 'false'}
            aria-describedby={errors.email ? 'email-error' : undefined}
          />
          {errors.email && (
            <span id="email-error" className="error-message" role="alert">
              {errors.email.message}
            </span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="displayName" className="form-label">
            Display Name *
          </label>
          <input
            id="displayName"
            type="text"
            className={`form-input ${errors.displayName ? 'error' : ''}`}
            {...register('displayName', {
              required: 'Display name is required',
              minLength: {
                value: 2,
                message: 'Display name must be at least 2 characters'
              },
              maxLength: {
                value: 50,
                message: 'Display name must be less than 50 characters'
              }
            })}
            placeholder="John Doe"
            aria-invalid={errors.displayName ? 'true' : 'false'}
            aria-describedby={errors.displayName ? 'displayName-error' : undefined}
          />
          {errors.displayName && (
            <span id="displayName-error" className="error-message" role="alert">
              {errors.displayName.message}
            </span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="password" className="form-label">
            Password {isEditMode ? '(leave empty to keep current)' : '*'}
          </label>
          <input
            id="password"
            type="password"
            className={`form-input ${errors.password ? 'error' : ''}`}
            {...register('password', {
              required: isEditMode ? false : 'Password is required',
              minLength: {
                value: 6,
                message: 'Password must be at least 6 characters'
              }
            })}
            placeholder={isEditMode ? 'Enter new password (optional)' : 'Enter password'}
            aria-invalid={errors.password ? 'true' : 'false'}
            aria-describedby={
              errors.password 
                ? 'password-error' 
                : password 
                  ? 'password-strength' 
                  : undefined
            }
          />
          {errors.password && (
            <span id="password-error" className="error-message" role="alert">
              {errors.password.message}
            </span>
          )}
          
          {password && (
            <div id="password-strength" className="password-strength" aria-live="polite">
              <div 
                className="strength-bar" 
                role="progressbar" 
                aria-valuenow={passwordStrength.strength} 
                aria-valuemin={0} 
                aria-valuemax={6}
                aria-label="Password strength"
              >
                <div 
                  className="strength-fill" 
                  style={{ 
                    width: `${(passwordStrength.strength / 6) * 100}%`,
                    backgroundColor: passwordStrength.color
                  }}
                />
              </div>
              <span 
                className="strength-label"
                style={{ color: passwordStrength.color }}
                aria-label={`Password strength: ${passwordStrength.label}`}
              >
                {passwordStrength.label}
              </span>
            </div>
          )}
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={handleCancel}
            className="button button-secondary"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="button button-primary"
            disabled={isSubmitting || !isValid || (!isDirty && isEditMode)}
          >
            {isSubmitting ? (
              <>
                <span className="loading-spinner small"></span>
                {isEditMode ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              isEditMode ? 'Update User' : 'Create User'
            )}
          </button>
        </div>
      </form>

      <div className="form-footer">
        <p className="help-text">
          * Required fields
        </p>
        {isEditMode && (
          <p className="help-text">
            Only modified fields will be updated.
          </p>
        )}
      </div>
      </div>
    </div>
  );
};