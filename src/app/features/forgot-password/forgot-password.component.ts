import { Component, inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { animate, style, transition, trigger } from '@angular/animations';
import { LoggerService, ScopedLogger } from '@services/logger.service';

type ViewState = 'form' | 'success' | 'error';

@Component({
    selector: 'app-forgot-password',
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './forgot-password.component.html',
    styleUrls: ['./forgot-password.component.scss'],
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
export class ForgotPasswordComponent {
    private authService = inject(AuthService);
    private router = inject(Router);
    private loggerService = inject(LoggerService);
    private fb = inject(FormBuilder);
    private logger!: ScopedLogger;

    // State signals
    viewState = signal<ViewState>('form');
    errorMessage = signal<string>('');
    successMessage = signal<string>('');
    isLoading = signal<boolean>(false);

    // Form
    forgotPasswordForm: FormGroup;

    constructor() {
        this.logger = this.loggerService.createLogger('ForgotPasswordComponent');

        // Initialize form with validators
        this.forgotPasswordForm = this.fb.group({
            email: ['', [
                Validators.required,
                Validators.email
            ]]
        });
    }

    onSubmit(): void {
        if (this.forgotPasswordForm.invalid) {
            this.markFormGroupTouched(this.forgotPasswordForm);
            return;
        }

        this.isLoading.set(true);
        this.errorMessage.set('');

        const email = this.forgotPasswordForm.get('email')?.value;

        this.authService.requestPasswordResetByEmail(email).subscribe({
            next: (response) => {
                this.isLoading.set(false);
                if (response.success) {
                    this.viewState.set('success');
                    this.successMessage.set(response.message || 'If an account with that email exists, you will receive a password reset link shortly.');
                } else {
                    this.errorMessage.set(response.error || 'Failed to process request. Please try again.');
                }
            },
            error: (err) => {
                this.isLoading.set(false);
                this.logger.error('Password reset request failed', err);
                this.errorMessage.set('An error occurred. Please try again later.');
            }
        });
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

    goToLogin(): void {
        this.router.navigate(['/login']);
    }

    tryAgain(): void {
        this.viewState.set('form');
        this.errorMessage.set('');
        this.forgotPasswordForm.reset();
    }

    /**
     * Check if form field has error
     */
    hasError(fieldName: string, errorType: string): boolean {
        const field = this.forgotPasswordForm.get(fieldName);
        return !!(field?.hasError(errorType) && field?.touched);
    }
}
