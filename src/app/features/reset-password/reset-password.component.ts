import { Component, OnInit, inject, DestroyRef, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '@core/auth/auth.service';
import { animate, style, transition, trigger } from '@angular/animations';
import { LoggerService, ScopedLogger } from '@services/logger.service';

type ViewState = 'validating' | 'form' | 'success' | 'error';

@Component({
    selector: 'app-reset-password',
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './reset-password.component.html',
    styleUrls: ['./reset-password.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: [
        trigger('fadeAnimation', [
            transition(':enter', [
                style({ opacity: 0 }),
                animate('200ms ease-out', style({ opacity: 1 }))
            ])
        ])
    ]
})
export class ResetPasswordComponent implements OnInit {
    private authService = inject(AuthService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private destroyRef = inject(DestroyRef);
    private loggerService = inject(LoggerService);
    private fb = inject(FormBuilder);
    private logger!: ScopedLogger;

    // State signals
    viewState = signal<ViewState>('validating');
    errorMessage = signal<string>('');
    successMessage = signal<string>('');
    isLoading = signal<boolean>(false);
    userEmail = signal<string>('');
    expiresAt = signal<string>('');

    // Form
    resetForm: FormGroup;
    showNewPassword: boolean = false;
    showConfirmPassword: boolean = false;

    // Token from URL
    private token: string = '';

    constructor() {
        this.logger = this.loggerService.createLogger('ResetPasswordComponent');

        // Initialize form with validators
        this.resetForm = this.fb.group({
            newPassword: ['', [
                Validators.required,
                Validators.minLength(8),
                this.passwordStrengthValidator()
            ]],
            confirmPassword: ['', [Validators.required]]
        }, {
            validators: this.passwordMatchValidator()
        });
    }

    ngOnInit(): void {
        // Get token from URL params
        this.route.queryParams.pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe(params => {
            this.token = params['token'] || '';
            if (this.token) {
                this.validateToken();
            } else {
                this.viewState.set('error');
                this.errorMessage.set('No reset token provided. Please use the link from your email.');
            }
        });
    }

    private validateToken(): void {
        this.viewState.set('validating');

        this.authService.validateResetToken(this.token).subscribe({
            next: (response) => {
                if (response.valid) {
                    this.userEmail.set(response.email || '');
                    this.expiresAt.set(response.expiresAt || '');
                    this.viewState.set('form');
                } else {
                    this.viewState.set('error');
                    this.errorMessage.set(response.error || 'This reset link is invalid or has expired.');
                }
            },
            error: (err) => {
                this.logger.error('Token validation failed', err);
                this.viewState.set('error');
                this.errorMessage.set('Unable to validate reset link. Please try again later.');
            }
        });
    }

    onSubmit(): void {
        if (this.resetForm.invalid) {
            this.markFormGroupTouched(this.resetForm);
            return;
        }

        this.isLoading.set(true);
        this.errorMessage.set('');

        const newPassword = this.resetForm.get('newPassword')?.value;

        this.authService.resetPassword(this.token, newPassword).subscribe({
            next: (response) => {
                this.isLoading.set(false);
                if (response.success) {
                    this.viewState.set('success');
                    this.successMessage.set(response.message || 'Your password has been reset successfully.');
                } else {
                    this.errorMessage.set(response.error || 'Failed to reset password. Please try again.');
                }
            },
            error: (err) => {
                this.isLoading.set(false);
                this.logger.error('Password reset failed', err);
                this.errorMessage.set('An error occurred. Please try again later.');
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

            const passwordValid = hasUpperCase && hasLowerCase && hasNumeric;

            return passwordValid ? null : {
                passwordStrength: {
                    hasUpperCase,
                    hasLowerCase,
                    hasNumeric
                }
            };
        };
    }

    /**
     * Password match validator
     */
    private passwordMatchValidator() {
        return (formGroup: AbstractControl): ValidationErrors | null => {
            const password = formGroup.get('newPassword')?.value;
            const passwordConfirm = formGroup.get('confirmPassword')?.value;

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

    toggleNewPasswordVisibility(): void {
        this.showNewPassword = !this.showNewPassword;
    }

    toggleConfirmPasswordVisibility(): void {
        this.showConfirmPassword = !this.showConfirmPassword;
    }

    goToLogin(): void {
        this.router.navigate(['/login']);
    }

    requestNewLink(): void {
        this.router.navigate(['/forgot-password']);
    }

    /**
     * Get password strength level (0-5)
     */
    getPasswordStrength(): number {
        const password = this.resetForm.get('newPassword')?.value;

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
        const field = this.resetForm.get(fieldName);
        return !!(field?.hasError(errorType) && field?.touched);
    }

    /**
     * Check if form has error
     */
    hasFormError(errorType: string): boolean {
        return !!(this.resetForm.hasError(errorType) &&
                 this.resetForm.get('confirmPassword')?.touched);
    }

    /**
     * Check if password has minimum length
     */
    hasMinimumLength(): boolean {
        const password = this.resetForm.get('newPassword')?.value;
        return password?.length >= 8;
    }

    /**
     * Check if password has uppercase letter
     */
    hasUpperCase(): boolean {
        const password = this.resetForm.get('newPassword')?.value || '';
        return /[A-Z]/.test(password);
    }

    /**
     * Check if password has lowercase letter
     */
    hasLowerCase(): boolean {
        const password = this.resetForm.get('newPassword')?.value || '';
        return /[a-z]/.test(password);
    }

    /**
     * Check if password has number
     */
    hasNumber(): boolean {
        const password = this.resetForm.get('newPassword')?.value || '';
        return /[0-9]/.test(password);
    }
}
