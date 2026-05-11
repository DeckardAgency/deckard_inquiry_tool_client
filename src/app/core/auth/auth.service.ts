import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { User, TokenPayload } from '@core/models';
import { environment } from '@env/environment';
import { UserService } from '@services/http/user.service';
import { AuthResponse } from '@models/api/auth-api.model';
import { LoggerService, ScopedLogger } from '@services/logger.service';

// Re-export for backward compatibility
export type { AuthResponse };

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiBaseUrl}/api/login_check`;
  private tokenKey = 'auth_token';
  private refreshTokenKey = 'refresh_token';
  private userKey = 'currentUser';

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$: Observable<User | null> = this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasStoredToken());
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  private logger!: ScopedLogger;

  constructor(
    private http: HttpClient,
    private userService: UserService,
    private loggerService: LoggerService
  ) {
    this.logger = this.loggerService.createLogger('AuthService');
    // Check if a user is already logged in from localStorage
    this.loadUserFromStorage();
  }

  login(username: string, password: string): Observable<boolean> {
    return this.http.post<AuthResponse>(this.apiUrl, { username, password })
      .pipe(
        switchMap(response => {
          // Store tokens temporarily
          this.setItemInStorage(this.tokenKey, response.token);
          this.setItemInStorage(this.refreshTokenKey, response.refresh_token);

          // Fetch user data from API using the token
          return this.userService.getUserByEmail(username).pipe(
            map(userData => {
              if (userData) {
                // Check if user account is deactivated
                if (userData.isActive === false) {
                  this.removeItemFromStorage(this.tokenKey);
                  this.removeItemFromStorage(this.refreshTokenKey);
                  throw new Error('Your account has been deactivated. Please contact your administrator.');
                }

                // Check if user's client is archived
                if (userData.client?.isArchived) {
                  // Clear the temporarily stored tokens
                  this.removeItemFromStorage(this.tokenKey);
                  this.removeItemFromStorage(this.refreshTokenKey);

                  // Throw an error to prevent login
                  throw new Error('Your company account has been archived. Please contact support for assistance.');
                }

                // Store complete user data with token information
                this.storeCompleteUserData(response, userData);
                return true;
              } else {
                // Fallback: Store basic user data if API doesn't return user details
                this.storeAuthData(response, username);
                return true;
              }
            }),
            catchError(userError => {
              this.logger.error('Error fetching user data', userError);

              // If it's our custom error (archived or deactivated), re-throw it
              if (userError.message && (userError.message.includes('archived') || userError.message.includes('deactivated'))) {
                return throwError(() => userError);
              }

              // Fallback: Store basic user data if user fetch fails
              this.storeAuthData(response, username);
              return of(true);
            })
          );
        }),
        catchError(error => {
          this.logger.error('Login error', error);
          return throwError(() => error);
        })
      );
  }

  logout(): void {
    // Clear storage
    this.removeItemFromStorage(this.tokenKey);
    this.removeItemFromStorage(this.refreshTokenKey);
    this.removeItemFromStorage(this.userKey);

    // Update subjects
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }

  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  getToken(): string | null {
    return this.getItemFromStorage(this.tokenKey);
  }

  getRefreshToken(): string | null {
    return this.getItemFromStorage(this.refreshTokenKey);
  }

  /**
   * Get the current user from the behavior subject
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Get current user's full name
   * @returns Full name (first + last) or email if name not available
   */
  getUserFullName(): string {
    const user = this.getCurrentUser();
    if (user) {
      if (user.firstName && user.lastName) {
        return `${user.firstName} ${user.lastName}`;
      } else if (user.firstName) {
        return user.firstName;
      } else {
        return user.email;
      }
    }
    return '';
  }

  /**
   * Check if user has a specific role
   * @param role Role to check for
   * @returns True if user has the role
   */
  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return !!user?.roles && user.roles.includes(role);
  }

  /**
   * Parse JWT token to get user information
   * @param token - JWT token string
   * @returns Decoded token payload or null if invalid
   */
  private parseToken(token: string): TokenPayload | null {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const decoded = JSON.parse(window.atob(base64)) as TokenPayload;

      // Validate required fields
      if (!decoded.username || !decoded.exp || !decoded.iat) {
        this.logger.error('Invalid token payload: missing required fields');
        return null;
      }

      return decoded;
    } catch (e) {
      this.logger.error('Error parsing JWT token', e);
      return null;
    }
  }

  /**
   * Store basic auth data when user data is not available from API
   */
  private storeAuthData(authResponse: AuthResponse, email: string): void {
    try {
      // Store tokens
      this.setItemInStorage(this.tokenKey, authResponse.token);
      this.setItemInStorage(this.refreshTokenKey, authResponse.refresh_token);

      // Extract user info from token
      const tokenData = this.parseToken(authResponse.token);

      // Create a user object
      const user: User = {
        username: tokenData?.username || email,
        email: tokenData?.username || email,
        id: '',
        roles: [],
        firstName: '',
        lastName: '',
        // Client information will be empty until fetched from the API
        client: undefined
      };

      // Store user info
      this.setItemInStorage(this.userKey, JSON.stringify(user));

      // Update subjects
      this.currentUserSubject.next(user);
      this.isAuthenticatedSubject.next(true);
    } catch (error) {
      this.logger.error('Could not save authentication data', error);
      throw error;
    }
  }

  /**
   * Store complete user data from API along with auth tokens
   */
  private storeCompleteUserData(authResponse: AuthResponse, userData: User): void {
    try {
      // Store tokens
      this.setItemInStorage(this.tokenKey, authResponse.token);
      this.setItemInStorage(this.refreshTokenKey, authResponse.refresh_token);

      // Extract token data for any additional information
      const tokenData = this.parseToken(authResponse.token);

      // Ensure username field is set for compatibility with existing code
      if (!userData.username && userData.email) {
        userData.username = userData.email;
      }

      // Store complete user data
      this.setItemInStorage(this.userKey, JSON.stringify(userData));

      // Update subjects
      this.currentUserSubject.next(userData);
      this.isAuthenticatedSubject.next(true);

      this.logger.debug('User data stored successfully');
    } catch (error) {
      this.logger.error('Could not save complete user data', error);
      throw error;
    }
  }

  private loadUserFromStorage(): void {
    try {
      const storedUser = this.getItemFromStorage(this.userKey);
      if (storedUser) {
        this.currentUserSubject.next(JSON.parse(storedUser));
        this.isAuthenticatedSubject.next(true);
      }
    } catch (error) {
      this.logger.error('Error loading user from storage', error);
    }
  }

  private hasStoredToken(): boolean {
    try {
      return !!this.getItemFromStorage(this.tokenKey);
    } catch (error) {
      this.logger.warn('Could not check authentication status', error);
      return false;
    }
  }

  // Safe storage methods with fallbacks
  private isLocalStorageAvailable(): boolean {
    try {
      const testKey = '__test__';
      localStorage.setItem(testKey, testKey);
      localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  }

  private getItemFromStorage(key: string): string | null {
    if (this.isLocalStorageAvailable()) {
      return localStorage.getItem(key);
    }
    // Fallback to memory storage or return null
    return null;
  }

  private setItemInStorage(key: string, value: string): void {
    if (this.isLocalStorageAvailable()) {
      localStorage.setItem(key, value);
    }
  }

  private removeItemFromStorage(key: string): void {
    if (this.isLocalStorageAvailable()) {
      localStorage.removeItem(key);
    }
  }

  /**
   * Get client information if available
   * @returns Client information or null
   */
  getClientInfo(): { name: string, code: string } | null {
    const user = this.getCurrentUser();
    if (user?.client) {
      return {
        name: user.client.name,
        code: user.client.code
      };
    }
    return null;
  }

  /**
   * Check if user is associated with a client
   * @returns True if user has client information
   */
  hasClient(): boolean {
    const user = this.getCurrentUser();
    return !!user?.client;
  }

  /**
   * Get client name if available
   * @returns Client name or empty string
   */
  getClientName(): string {
    const client = this.getClientInfo();
    return client ? client.name : '';
  }

  /**
   * Check if user's client is archived
   * @returns True if user's client is archived
   */
  isClientArchived(): boolean {
    const user = this.getCurrentUser();
    return !!user?.client?.isArchived;
  }

  /**
   * Check if user's client is active
   * @returns True if user's client is active
   */
  isClientActive(): boolean {
    const user = this.getCurrentUser();
    return !!user?.client?.isActive;
  }

  /**
   * Validate a password reset token
   * @param token - The password reset token from the URL
   * @returns Observable with validation result
   */
  validateResetToken(token: string): Observable<{ valid: boolean; email?: string; expiresAt?: string; error?: string }> {
    return this.http.get<{ valid: boolean; email?: string; expiresAt?: string; error?: string }>(
      `${environment.apiBaseUrl}/api/auth/validate-reset-token/${token}`
    ).pipe(
      catchError((error: HttpErrorResponse) => {
        this.logger.error('Token validation error', error);
        return of({
          valid: false,
          error: error.error?.error || 'Invalid or expired token'
        });
      })
    );
  }

  /**
   * Reset password using a valid token
   * @param token - The password reset token
   * @param newPassword - The new password
   * @returns Observable with reset result
   */
  resetPassword(token: string, newPassword: string): Observable<{ success: boolean; message?: string; error?: string }> {
    return this.http.post<{ success: boolean; message?: string; error?: string }>(
      `${environment.apiBaseUrl}/api/auth/reset-password`,
      { token, newPassword }
    ).pipe(
      catchError((error: HttpErrorResponse) => {
        this.logger.error('Password reset error', error);
        return of({
          success: false,
          error: error.error?.error || 'Failed to reset password. Please try again.'
        });
      })
    );
  }

  /**
   * Request a password reset by email (forgot password)
   * @param email - The user's email address
   * @returns Observable with request result
   */
  requestPasswordResetByEmail(email: string): Observable<{ success: boolean; message?: string; error?: string }> {
    return this.http.post<{ success: boolean; message?: string; error?: string }>(
      `${environment.apiBaseUrl}/api/auth/forgot-password`,
      { email }
    ).pipe(
      catchError((error: HttpErrorResponse) => {
        this.logger.error('Password reset request error', error);
        return of({
          success: false,
          error: error.error?.error || 'Failed to process request. Please try again.'
        });
      })
    );
  }
}
