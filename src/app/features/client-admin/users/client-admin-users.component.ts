import { Component, OnInit, inject, DestroyRef, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreadcrumbsComponent } from '@shared/components/ui/breadcrumbs/breadcrumbs.component';
import { UserService } from '@services/http/user.service';
import { AuthService } from '@core/auth/auth.service';
import { User } from '@core/models';
import { finalize, catchError } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { LoggerService, ScopedLogger } from '@services/logger.service';
import { InvitationService } from '@core/services/invitation.service';
import { UserInvitation } from '@core/models/user-invitation.model';

@Component({
  selector: 'app-client-admin-users',
  imports: [CommonModule, FormsModule, BreadcrumbsComponent],
  templateUrl: './client-admin-users.component.html',
  styleUrls: ['./client-admin-users.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClientAdminUsersComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);
  private logger!: ScopedLogger;

  breadcrumbs = [
    { label: 'Users' }
  ];

  users: User[] = [];
  filteredUsers: User[] = [];
  invitations: UserInvitation[] = [];
  filteredInvitations: UserInvitation[] = [];
  isLoading = false;
  error: string | null = null;

  // View toggle
  currentView: 'users' | 'invitations' = 'users';

  // Search
  searchQuery: string = '';

  // Sort configuration
  sortColumn: 'dateCreated' | null = null;
  sortDirection: 'asc' | 'desc' = 'asc';

  // Dropdown menu state
  openMenuUserId: string | null = null;

  // User slots
  maxActiveUsers: number = 0;
  activeUsersCount: number = 0;

  // Side panel state
  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' | 'view' = 'add';
  selectedUser: User | null = null;
  selectedInvitation: UserInvitation | null = null;

  // Form data
  formData = {
    firstName: '',
    lastName: '',
    email: '',
    roles: [] as string[],
    client: null as string | null  // Client IRI
  };

  // Form submission
  isSubmitting = false;

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private loggerService: LoggerService,
    private invitationService: InvitationService
  ) {
    this.logger = this.loggerService.createLogger('ClientAdminUsersComponent');
  }

  ngOnInit(): void {
    this.loadData();
  }

  /**
   * Load both users and invitations
   */
  loadData(): void {
    this.loadUsers();
    this.loadInvitations();
  }

  /**
   * Load users from the same company as the logged-in user
   */
  loadUsers(): void {
    this.isLoading = true;
    this.error = null;

    // Get current user
    const currentUser = this.authService.getCurrentUser();

    if (!currentUser || !currentUser.client?.code) {
      this.error = 'Unable to determine your company. Please contact support.';
      this.isLoading = false;
      return;
    }

    // Fetch users from the same client
    this.userService.getUsersByClientCode(currentUser.client.code)
      .pipe(
        catchError(err => {
          this.logger.error('Error loading users', err);
          this.error = 'Failed to load users. Please try again later.';
          return of({
            '@context': '',
            '@id': '',
            '@type': '',
            'totalItems': 0,
            'member': [],
            'view': { '@id': '', '@type': '' },
            'search': { '@type': '', 'template': '', 'variableRepresentation': '', 'mapping': [] }
          });
        }),
        finalize(() => {
          setTimeout(() => {
            this.isLoading = false;
            this.cdr.markForCheck();
          }, 300);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response) => {
          this.users = response.member || [];
          this.calculateUserSlots();
          this.applyFiltersAndSort();
        }
      });
  }

  /**
   * Load invitations
   */
  loadInvitations(): void {
    this.invitationService.getInvitations()
      .pipe(
        catchError(err => {
          this.logger.error('Error loading invitations', err);
          return of({ 'hydra:member': [] });
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response) => {
          this.invitations = response['hydra:member'] || [];
          this.applyInvitationFilters();
          this.cdr.markForCheck();
        }
      });
  }

  /**
   * Calculate available user slots based on maxActiveUsers and active users count
   */
  calculateUserSlots(): void {
    // Get maxActiveUsers from first user's client (all users belong to same client)
    const firstUserWithClient = this.users.find(u => u.client?.maxActiveUsers);
    this.maxActiveUsers = firstUserWithClient?.client?.maxActiveUsers || 0;

    // Count active users
    this.activeUsersCount = this.users.filter(u => u.isActive !== false).length;
  }

  /**
   * Get available user slots
   */
  getAvailableSlots(): number {
    return Math.max(0, this.maxActiveUsers - this.activeUsersCount);
  }

  /**
   * Apply filters and sorting to the users list
   */
  applyFiltersAndSort(): void {
    let filtered = [...this.users];

    // Apply search filter (search by name)
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(user => {
        const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
        return fullName.includes(query);
      });
    }

    // Apply sorting by date created if column is sorted
    if (this.sortColumn === 'dateCreated') {
      filtered.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return this.sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      });
    }

    this.filteredUsers = filtered;
  }

  /**
   * Apply filters to invitations list
   */
  applyInvitationFilters(): void {
    let filtered = [...this.invitations];

    // Apply search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(invitation => {
        const fullName = `${invitation.firstName} ${invitation.lastName}`.toLowerCase();
        const email = invitation.email.toLowerCase();
        return fullName.includes(query) || email.includes(query);
      });
    }

    // Apply sorting by date created if column is sorted
    if (this.sortColumn === 'dateCreated') {
      filtered.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return this.sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      });
    }

    this.filteredInvitations = filtered;
  }

  /**
   * Handle search query change
   */
  onSearchChange(): void {
    if (this.currentView === 'users') {
      this.applyFiltersAndSort();
    } else {
      this.applyInvitationFilters();
    }
  }

  /**
   * Switch between users and invitations view
   */
  switchView(view: 'users' | 'invitations'): void {
    this.currentView = view;
    this.searchQuery = '';
    this.closeActionsMenu();
  }

  /**
   * Toggle sort on Date Created column
   */
  toggleDateSort(): void {
    if (this.sortColumn === 'dateCreated') {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = 'dateCreated';
      this.sortDirection = 'asc';
    }
    this.applyFiltersAndSort();
  }

  /**
   * Open Add User side panel
   */
  openAddUserDialog(): void {
    this.sidePanelMode = 'add';
    this.selectedUser = null;
    this.resetForm();

    // Set client IRI from current user
    const currentUser = this.authService.getCurrentUser();
    if (currentUser && currentUser.client) {
      this.formData.client = currentUser.client['@id'];
    }

    this.sidePanelOpen = true;
  }

  /**
   * Toggle actions menu for a user
   */
  toggleActionsMenu(userId: string, event: Event): void {
    event.stopPropagation();
    this.openMenuUserId = this.openMenuUserId === userId ? null : userId;
  }

  /**
   * Close actions menu
   */
  closeActionsMenu(): void {
    this.openMenuUserId = null;
  }

  /**
   * Check if menu is open for a specific user
   */
  isMenuOpen(userId: string): boolean {
    return this.openMenuUserId === userId;
  }

  /**
   * Edit user
   */
  editUser(user: User, event: Event): void {
    event.stopPropagation();
    this.closeActionsMenu();
    this.sidePanelMode = 'edit';
    this.selectedUser = user;
    this.populateForm(user);
    this.sidePanelOpen = true;
  }

  /**
   * View user details
   */
  viewUserDetails(user: User, event: Event): void {
    event.stopPropagation();
    this.closeActionsMenu();
    this.sidePanelMode = 'view';
    this.selectedUser = user;
    this.populateForm(user);
    this.sidePanelOpen = true;
  }

  /**
   * Delete user
   */
  deleteUser(user: User, event: Event): void {
    event.stopPropagation();
    this.closeActionsMenu();
    // TODO: Implement delete user functionality
    this.logger.debug('Delete user', { email: user.email });
  }

  /**
   * Deactivate/Activate user
   */
  toggleUserStatus(user: User, event: Event): void {
    event.stopPropagation();
    this.closeActionsMenu();

    const newStatus = user.isActive === false;
    const action = newStatus ? 'activate' : 'deactivate';

    if (confirm(`Are you sure you want to ${action} ${user.firstName} ${user.lastName}?`)) {
      this.userService.toggleUserActive(user.id, newStatus).subscribe({
        next: () => {
          user.isActive = newStatus;
          this.logger.debug(`User ${action}d`, { email: user.email });
        },
        error: (err) => {
          this.logger.error(`Failed to ${action} user`, err);
          alert(`Failed to ${action} user. Please try again.`);
        }
      });
    }
  }

  /**
   * Get user's full name
   */
  getUserFullName(user: User): string {
    return `${user.firstName} ${user.lastName}`.trim() || user.email;
  }

  /**
   * Get user role display name
   */
  getUserRoleDisplay(user: User): string {
    if (user.roles.includes('ROLE_CLIENT_ADMIN')) {
      return 'Admin';
    }
    return 'Standard';
  }

  /**
   * Get user role type for styling
   */
  getUserRoleType(user: User): 'admin' | 'standard' {
    return user.roles.includes('ROLE_CLIENT_ADMIN') ? 'admin' : 'standard';
  }

  /**
   * Get user status (Active/Inactive)
   */
  getUserStatus(user: User): 'Active' | 'Inactive' {
    return user.isActive !== false ? 'Active' : 'Inactive';
  }

  /**
   * Get transactions count
   */
  getTransactionsCount(user: User): number {
    return user.orders?.length || 0;
  }

  /**
   * Format date for display (DD-MM-YYYY)
   */
  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  /**
   * Get user initials for avatar
   */
  getUserInitials(user: User): string {
    const firstName = user.firstName?.charAt(0) || '';
    const lastName = user.lastName?.charAt(0) || '';
    return (firstName + lastName).toUpperCase() || user.email.charAt(0).toUpperCase();
  }

  // ============================================================================
  // SIDE PANEL METHODS
  // ============================================================================

  /**
   * Close side panel
   */
  closeSidePanel(): void {
    this.sidePanelOpen = false;
    this.selectedUser = null;
    this.resetForm();
  }

  /**
   * Reset form to initial state
   */
  resetForm(): void {
    this.formData = {
      firstName: '',
      lastName: '',
      email: '',
      roles: [],
      client: null
    };
  }

  /**
   * Populate form with user data
   */
  populateForm(user: User): void {
    this.formData.firstName = user.firstName || '';
    this.formData.lastName = user.lastName || '';
    this.formData.email = user.email;
    this.formData.roles = [...user.roles];
  }

  /**
   * Get side panel title
   */
  getSidePanelTitle(): string {
    switch (this.sidePanelMode) {
      case 'add': return 'Add user';
      case 'edit': return 'Edit user';
      case 'view': return 'User details';
      default: return 'User';
    }
  }

  /**
   * Get submit button text
   */
  getSubmitButtonText(): string {
    return this.sidePanelMode === 'add' ? 'Send Invitation' : 'Save changes';
  }

  /**
   * Check if form is in view mode
   */
  isViewMode(): boolean {
    return this.sidePanelMode === 'view';
  }

  /**
   * Toggle role selection
   */
  toggleRole(role: string): void {
    const index = this.formData.roles.indexOf(role);
    if (index > -1) {
      this.formData.roles.splice(index, 1);
    } else {
      this.formData.roles.push(role);
    }
  }

  /**
   * Check if role is selected
   */
  hasRole(role: string): boolean {
    return this.formData.roles.includes(role);
  }

  /**
   * Submit form
   */
  submitForm(): void {
    if (this.isViewMode()) {
      this.closeSidePanel();
      return;
    }

    // Validate form
    if (!this.formData.firstName.trim()) {
      alert('Please enter first name');
      return;
    }

    if (!this.formData.lastName.trim()) {
      alert('Please enter last name');
      return;
    }

    if (!this.formData.email.trim()) {
      alert('Please enter email address');
      return;
    }

    if (this.sidePanelMode === 'add') {
      this.sendInvitation();
    } else if (this.sidePanelMode === 'edit') {
      this.updateUser();
    }
  }

  /**
   * Send invitation to new user
   */
  sendInvitation(): void {
    this.isSubmitting = true;

    // Prepare invitation data
    const invitationData: any = {
      email: this.formData.email,
      firstName: this.formData.firstName,
      lastName: this.formData.lastName,
      roles: this.formData.roles.length > 0 ? this.formData.roles : ['ROLE_USER', 'ROLE_CLIENT']
    };

    // Add client if available
    if (this.formData.client) {
      invitationData.client = this.formData.client;
    }

    this.invitationService.createInvitation(invitationData).pipe(
      finalize(() => {
        this.isSubmitting = false;
        this.cdr.markForCheck();
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (invitation) => {
        this.logger.info('Invitation sent successfully', { email: invitation.email });
        alert(`Invitation sent to ${invitation.email}`);
        this.closeSidePanel();
        this.loadInvitations();
      },
      error: (err) => {
        this.logger.error('Error sending invitation', err);
        if (err.error?.detail) {
          alert(`Error: ${err.error.detail}`);
        } else if (err.error?.violations) {
          const violations = err.error.violations.map((v: any) => v.message).join('\n');
          alert(`Validation errors:\n${violations}`);
        } else {
          alert('Failed to send invitation. Please try again.');
        }
      }
    });
  }

  /**
   * Update existing user
   */
  updateUser(): void {
    // TODO: Implement user update functionality
    this.logger.debug('Updating user', { userId: this.selectedUser?.id });
    alert('User update functionality coming soon');
    this.closeSidePanel();
  }

  /**
   * Revoke invitation
   */
  revokeInvitation(invitation: UserInvitation, event: Event): void {
    event.stopPropagation();
    this.closeActionsMenu();

    if (!confirm(`Are you sure you want to revoke the invitation for ${invitation.email}?`)) {
      return;
    }

    this.invitationService.revokeInvitation(invitation.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.logger.info('Invitation revoked', { email: invitation.email });
          alert(`Invitation for ${invitation.email} has been revoked`);
          this.loadInvitations();
        },
        error: (err) => {
          this.logger.error('Error revoking invitation', err);
          alert('Failed to revoke invitation. Please try again.');
        }
      });
  }

  /**
   * Get invitation status display text
   */
  getInvitationStatus(invitation: UserInvitation): string {
    return invitation.status.charAt(0).toUpperCase() + invitation.status.slice(1);
  }

  /**
   * Get invitation status badge class
   */
  getInvitationStatusClass(invitation: UserInvitation): string {
    switch (invitation.status) {
      case 'pending':
        return 'users-table__badge--pending';
      case 'completed':
        return 'users-table__badge--completed';
      case 'expired':
        return 'users-table__badge--expired';
      case 'revoked':
        return 'users-table__badge--revoked';
      default:
        return '';
    }
  }

  /**
   * Check if invitation is expired
   */
  isInvitationExpired(invitation: UserInvitation): boolean {
    return new Date(invitation.expiresAt) < new Date();
  }

  /**
   * Get invitation full name
   */
  getInvitationFullName(invitation: UserInvitation): string {
    return `${invitation.firstName} ${invitation.lastName}`.trim();
  }

  /**
   * Get invitation initials
   */
  getInvitationInitials(invitation: UserInvitation): string {
    const firstName = invitation.firstName?.charAt(0) || '';
    const lastName = invitation.lastName?.charAt(0) || '';
    return (firstName + lastName).toUpperCase() || invitation.email.charAt(0).toUpperCase();
  }
}
