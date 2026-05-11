import { Routes } from '@angular/router';
import { AuthGuard } from '@core/auth/auth.guard';
import { AgentGuard } from '@core/guards/agent.guard';
import { CanDeactivateGuard } from '@core/guards/can-deactivate.guard';

export const routes: Routes = [
  // ============================================================================
  // PUBLIC ROUTES
  // ============================================================================
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('@features/login/login.component').then(m => m.LoginComponent),
    title: 'Inquiry Tool | Login'
  },
  {
    path: 'register',
    loadComponent: () => import('@features/register/register.component').then(m => m.RegisterComponent),
    title: 'Inquiry Tool | Register'
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('@features/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),
    title: 'Inquiry Tool | Forgot Password'
  },
  {
    path: 'reset-password',
    loadComponent: () => import('@features/reset-password/reset-password.component').then(m => m.ResetPasswordComponent),
    title: 'Inquiry Tool | Reset Password'
  },
  {
    path: 'ui-kit',
    loadComponent: () => import('@features/ui-kit-docs/ui-kit-docs.component').then(m => m.UiKitDocsComponent),
    title: 'UI Kit | Component Library'
  },

  // ============================================================================
  // AUTHENTICATED ROUTES
  // ============================================================================

  // Dashboard
  {
    path: 'dashboard',
    loadComponent: () => import('@features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [AuthGuard],
    title: 'Inquiry Tool | Dashboard'
  },

  // ============================================================================
  // INQUIRY HUB (Shop & Manual Entry)
  // ============================================================================
  {
    path: 'shop',
    loadComponent: () => import('@features/shop/shop.component').then(m => m.ShopComponent),
    canActivate: [AuthGuard],
    title: 'Inquiry Tool | Shop'
  },
  {
    path: 'manual-entry/input-form',
    loadComponent: () => import('@features/manual-entry/input-form/manual-entry-input-form.component').then(m => m.ManualEntryInputFormComponent),
    canActivate: [AuthGuard],
    canDeactivate: [CanDeactivateGuard],
    title: 'Inquiry Tool | Manual Entry - InputForm'
  },
  {
    path: 'manual-entry/template',
    loadComponent: () => import('@features/manual-entry/template/manual-entry-template.component').then(m => m.ManualEntryTemplateComponent),
    canActivate: [AuthGuard],
    canDeactivate: [CanDeactivateGuard],
    title: 'Inquiry Tool | Manual Entry - Template'
  },
  {
    path: 'manual-entry/:id/view',
    loadComponent: () => import('@features/inquiry-detail/manual-entry/inquiry-detail.component').then(m => m.InquiryDetailComponent),
    canActivate: [AuthGuard],
    title: 'Inquiry Tool | Draft Inquiry Details'
  },
  {
    path: 'inquiry-tool',
    loadComponent: () => import('@features/inquiry-tool/inquiry-tool.component').then(m => m.InquiryToolComponent),
    canActivate: [AuthGuard],
    title: 'Inquiry Tool | Inquiry Tool'
  },

  // ============================================================================
  // CART & CONFIRMATIONS
  // ============================================================================
  {
    path: 'cart',
    loadComponent: () => import('@features/cart/cart.component').then(m => m.CartComponent),
    canActivate: [AuthGuard],
    title: 'Inquiry Tool | Cart'
  },
  {
    path: 'manual-entry-cart',
    loadComponent: () => import('@features/manual-entry-cart/manual-entry-cart.component').then(m => m.ManualEntryCartComponent),
    canActivate: [AuthGuard],
    title: 'Inquiry Tool | Inquiry Overview'
  },
  {
    path: 'order-confirmation',
    loadComponent: () => import('@features/order-confirmation/order-confirmation.component').then(m => m.OrderConfirmationComponent),
    title: 'Inquiry Tool | Order Confirmation'
  },
  {
    path: 'inquiry-confirmation',
    loadComponent: () => import('@features/inquiry-confirmation/inquiry-confirmation.component').then(m => m.InquiryConfirmationComponent),
    title: 'Inquiry Tool | Inquiry Confirmation'
  },

  // ============================================================================
  // MY INQUIRIES
  // ============================================================================
  {
    path: 'my-inquiries',
    loadComponent: () => import('@features/my-inquiries/my-inquiries.component').then(m => m.MyInquiriesComponent),
    canActivate: [AuthGuard],
    title: 'Inquiry Tool | My Inquiries'
  },
  {
    path: 'my-inquiries/active',
    loadComponent: () => import('@features/my-inquiries/active/active-inquiries.component').then(m => m.ActiveInquiriesComponent),
    canActivate: [AuthGuard],
    title: 'Inquiry Tool | Active Inquiries'
  },
  {
    path: 'my-inquiries/drafts',
    loadComponent: () => import('@features/my-inquiries/drafts/draft-inquiries.component').then(m => m.DraftInquiriesComponent),
    canActivate: [AuthGuard],
    title: 'Inquiry Tool | Draft Inquiries'
  },
  {
    path: 'my-inquiries/history',
    loadComponent: () => import('@features/my-inquiries/history/inquiry-history.component').then(m => m.InquiryHistoryComponent),
    canActivate: [AuthGuard],
    title: 'Inquiry Tool | Inquiry History'
  },
  {
    path: 'my-inquiries/active/inquiry/:id/view',
    loadComponent: () => import('@features/inquiry-detail/manual-entry/inquiry-detail.component').then(m => m.InquiryDetailComponent),
    canActivate: [AuthGuard],
    title: 'Inquiry Tool | Inquiry Details'
  },
  {
    path: 'my-inquiries/active/order/:id/view',
    loadComponent: () => import('@features/inquiry-detail/shop/order-detail.component').then(m => m.OrderDetailComponent),
    canActivate: [AuthGuard],
    title: 'Inquiry Tool | Order Details'
  },

  // ============================================================================
  // MACHINE HUB
  // ============================================================================
  {
    path: 'all-machines',
    loadComponent: () => import('@features/all-machines/all-machines.component').then(m => m.AllMachinesComponent),
    canActivate: [AuthGuard],
    title: 'Inquiry Tool | All Machines'
  },

  // ============================================================================
  // AGENT ROUTES
  // ============================================================================
  {
    path: 'my-clients',
    loadComponent: () => import('./features/my-clients/my-clients.component').then(m => m.MyClientsComponent),
    canActivate: [AuthGuard, AgentGuard],
    title: 'Inquiry Tool | My Clients'
  },
  {
    path: 'my-clients/:id/view',
    loadComponent: () => import('./features/my-clients/client-detail/client-detail.component').then(m => m.ClientDetailComponent),
    canActivate: [AuthGuard, AgentGuard],
    title: 'Inquiry Tool | Client Details'
  },
  {
    path: 'my-orders/active',
    loadComponent: () => import('./features/my-orders/active/active-orders.component').then(m => m.ActiveOrdersComponent),
    canActivate: [AuthGuard],
    title: 'Inquiry Tool | Active Orders'
  },
  {
    path: 'my-orders/history',
    loadComponent: () => import('./features/my-orders/history/order-history.component').then(m => m.OrderHistoryComponent),
    canActivate: [AuthGuard],
    title: 'Inquiry Tool | Order History'
  },
  {
    path: 'my-orders/drafts',
    loadComponent: () => import('./features/my-orders/drafts/draft-orders.component').then(m => m.DraftOrdersComponent),
    canActivate: [AuthGuard],
    title: 'Inquiry Tool | Draft Orders'
  },
  {
    path: 'my-orders/active/order/:id/view',
    loadComponent: () => import('@features/inquiry-detail/shop/order-detail.component').then(m => m.OrderDetailComponent),
    canActivate: [AuthGuard],
    title: 'Inquiry Tool | Order Details'
  },
  {
    path: 'my-orders/active/inquiry/:id/view',
    loadComponent: () => import('@features/inquiry-detail/manual-entry/inquiry-detail.component').then(m => m.InquiryDetailComponent),
    canActivate: [AuthGuard],
    title: 'Inquiry Tool | Inquiry Details'
  },

  // ============================================================================
  // SETTINGS & COMPANY (CLIENT_ADMIN only)
  // ============================================================================
  {
    path: 'settings',
    loadComponent: () => import('@features/settings/settings.component').then(m => m.SettingsComponent),
    canActivate: [AuthGuard],
    title: 'Inquiry Tool | Settings'
  },
  {
    path: 'my-company',
    loadComponent: () => import('@features/my-company/my-company.component').then(m => m.MyCompanyComponent),
    canActivate: [AuthGuard],
    title: 'Inquiry Tool | My Company'
  },

  // ============================================================================
  // DOCUMENTATION
  // ============================================================================
  {
    path: 'documentation',
    loadComponent: () => import('@features/documentation/documentation.component').then(m => m.DocumentationComponent),
    canActivate: [AuthGuard],
    title: 'Inquiry Tool | Documentation'
  },
  {
    path: 'documentation/:page',
    loadComponent: () => import('@features/documentation/documentation.component').then(m => m.DocumentationComponent),
    canActivate: [AuthGuard],
    title: 'Inquiry Tool | Documentation'
  },

  // ============================================================================
  // CLIENT ADMIN ROUTES
  // ============================================================================
  {
    path: 'client-admin',
    canActivate: [AuthGuard],
    children: [
      {
        path: 'history',
        loadComponent: () => import('@features/client-admin/history/client-admin-history.component').then(m => m.ClientAdminHistoryComponent),
        title: 'Inquiry Tool | History'
      },
      {
        path: 'pending-approvals',
        loadComponent: () => import('@features/client-admin/pending-approvals/client-admin-pending-approvals.component').then(m => m.ClientAdminPendingApprovalsComponent),
        title: 'Inquiry Tool | Pending Approvals'
      },
      {
        path: 'drafts',
        loadComponent: () => import('@features/client-admin/drafts/client-admin-drafts.component').then(m => m.ClientAdminDraftsComponent),
        title: 'Inquiry Tool | Drafts'
      },
      {
        path: 'my-machines',
        loadComponent: () => import('@features/client-admin/my-machines/client-admin-my-machines.component').then(m => m.ClientAdminMyMachinesComponent),
        title: 'Inquiry Tool | My Machines'
      },
      {
        path: 'users',
        loadComponent: () => import('@features/client-admin/users/client-admin-users.component').then(m => m.ClientAdminUsersComponent),
        title: 'Inquiry Tool | Users'
      }
    ]
  }
];
