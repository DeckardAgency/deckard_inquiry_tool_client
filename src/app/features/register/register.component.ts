import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { InvitationService } from '@services/invitation.service';
import { InvitationVerifyResponse } from '@models/user-invitation.model';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  invitation: InvitationVerifyResponse | null = null;
  token: string | null = null;
  loading = false;
  verifying = true;
  error: string | null = null;
  success = false;
  passwordVisible = false;
  passwordConfirmVisible = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private invitationService: InvitationService
  ) {
    this.registerForm = this.fb.group({
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        this.passwordStrengthValidator()
      ]],
      passwordConfirm: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator()
    });
  }

  ngOnInit(): void {
    // Get token from query parameters
    this.route.queryParams.subscribe(params => {
      this.token = params['token'];

      if (!this.token) {
        this.error = 'Invalid invitation link. No token provided.';
        this.verifying = false;
        return;
      }

      this.verifyToken();
    });
  }

  /**
   * Verify the invitation token
   */
  verifyToken(): void {
    if (!this.token) {
      return;
    }

    this.verifying = true;
    this.error = null;

    this.invitationService.verifyToken(this.token).subscribe({
      next: (response) => {
        this.invitation = response;
        this.verifying = false;

        // Check if already expired
        if (response.isExpired) {
          this.error = 'This invitation has expired. Please contact your administrator for a new invitation.';
        }
      },
      error: (err) => {
        this.verifying = false;

        if (err.status === 404) {
          this.error = 'Invalid invitation token. The invitation may have been used or revoked.';
        } else if (err.error?.detail) {
          this.error = err.error.detail;
        } else {
          this.error = 'Failed to verify invitation. Please try again or contact support.';
        }
      }
    });
  }

  /**
   * Submit the registration form
   */
  onSubmit(): void {
    if (this.registerForm.invalid || !this.token) {
      this.markFormGroupTouched(this.registerForm);
      return;
    }

    this.loading = true;
    this.error = null;

    const formValue = this.registerForm.value;

    this.invitationService.completeInvitation(this.token, {
      password: formValue.password,
      passwordConfirm: formValue.passwordConfirm
    }).subscribe({
      next: (response) => {
        this.loading = false;
        this.success = true;

        // Redirect to login after 2 seconds
        setTimeout(() => {
          this.router.navigate(['/login'], {
            queryParams: { email: this.invitation?.email }
          });
        }, 2000);
      },
      error: (err) => {
        this.loading = false;

        if (err.error?.detail) {
          this.error = err.error.detail;
        } else if (err.error?.violations) {
          // Handle validation errors
          const violations = err.error.violations;
          this.error = violations.map((v: any) => v.message).join(', ');
        } else {
          this.error = 'Failed to complete registration. Please try again.';
        }
      }
    });
  }

  /**
   * Password strength validator
   */
  private passwordStrengthValidator() {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;

      if (!value) {
        return null;
      }

      const hasUpperCase = /[A-Z]/.test(value);
      const hasLowerCase = /[a-z]/.test(value);
      const hasNumeric = /[0-9]/.test(value);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);

      const passwordValid = hasUpperCase && hasLowerCase && hasNumeric;

      return passwordValid ? null : {
        passwordStrength: {
          hasUpperCase,
          hasLowerCase,
          hasNumeric,
          hasSpecialChar
        }
      };
    };
  }

  /**
   * Password match validator
   */
  private passwordMatchValidator() {
    return (formGroup: AbstractControl): ValidationErrors | null => {
      const password = formGroup.get('password')?.value;
      const passwordConfirm = formGroup.get('passwordConfirm')?.value;

      if (!password || !passwordConfirm) {
        return null;
      }

      return password === passwordConfirm ? null : { passwordMismatch: true };
    };
  }

  /**
   * Mark all controls in form group as touched
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  /**
   * Toggle password visibility
   */
  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }

  /**
   * Toggle password confirm visibility
   */
  togglePasswordConfirmVisibility(): void {
    this.passwordConfirmVisible = !this.passwordConfirmVisible;
  }

  /**
   * Get password strength level
   */
  getPasswordStrength(): number {
    const password = this.registerForm.get('password')?.value;

    if (!password) {
      return 0;
    }

    let strength = 0;

    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;

    return strength;
  }

  /**
   * Get password strength class for styling
   */
  getPasswordStrengthClass(): string {
    const strength = this.getPasswordStrength();

    if (strength === 0) return '';
    if (strength <= 2) return 'weak';
    if (strength <= 3) return 'medium';
    if (strength <= 4) return 'good';
    return 'strong';
  }

  /**
   * Get password strength label
   */
  getPasswordStrengthLabel(): string {
    const strength = this.getPasswordStrength();

    if (strength === 0) return '';
    if (strength <= 2) return 'Weak';
    if (strength <= 3) return 'Medium';
    if (strength <= 4) return 'Good';
    return 'Strong';
  }

  /**
   * Check if form field has error
   */
  hasError(fieldName: string, errorType: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!(field?.hasError(errorType) && field?.touched);
  }

  /**
   * Check if form has error
   */
  hasFormError(errorType: string): boolean {
    return !!(this.registerForm.hasError(errorType) &&
             this.registerForm.get('passwordConfirm')?.touched);
  }

  /**
   * Check if password has minimum length
   */
  hasMinimumLength(): boolean {
    const password = this.registerForm.get('password')?.value;
    return password?.length >= 8;
  }

  /**
   * Check if password has uppercase letter
   */
  hasUpperCase(): boolean {
    const password = this.registerForm.get('password')?.value || '';
    return /[A-Z]/.test(password);
  }

  /**
   * Check if password has lowercase letter
   */
  hasLowerCase(): boolean {
    const password = this.registerForm.get('password')?.value || '';
    return /[a-z]/.test(password);
  }

  /**
   * Check if password has number
   */
  hasNumber(): boolean {
    const password = this.registerForm.get('password')?.value || '';
    return /[0-9]/.test(password);
  }
}
