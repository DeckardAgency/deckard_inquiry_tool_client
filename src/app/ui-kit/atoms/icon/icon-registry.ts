/**
 * Icon Registry for ui-icon component
 *
 * Add new icons here following the pattern:
 * iconName: `<svg>...</svg>`
 *
 * All icons should:
 * - Use currentColor for stroke/fill to support color prop
 * - Have a viewBox attribute
 * - Not have hardcoded width/height (will be set dynamically)
 */
export const ICON_REGISTRY: Record<string, string> = {
  // Navigation
  'chevron-right': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M6 12L10 8L6 4" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'chevron-left': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M10 12L6 8L10 4" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'chevron-down': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'chevron-up': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M4 10L8 6L12 10" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'arrow-right': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M3.333 8H12.667M12.667 8L8 3.333M12.667 8L8 12.667" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'arrow-left': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M12.667 8H3.333M3.333 8L8 12.667M3.333 8L8 3.333" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  // Actions
  'close': `<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'plus': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M8 3.333V12.667M3.333 8H12.667" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'minus': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M3.333 8H12.667" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'check': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M13.333 4L6 11.333L2.667 8" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'edit': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M7.333 2.667H2.667A1.333 1.333 0 001.333 4v9.333a1.333 1.333 0 001.334 1.334H12a1.333 1.333 0 001.333-1.334V8M12.333 1.667a1.414 1.414 0 112 2L8 10l-2.667.667L6 8l6.333-6.333z" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'trash': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M2 4h12M5.333 4V2.667a1.333 1.333 0 011.334-1.334h2.666a1.333 1.333 0 011.334 1.334V4m2 0v9.333a1.333 1.333 0 01-1.334 1.334H4.667a1.333 1.333 0 01-1.334-1.334V4h9.334zM6.667 7.333v4M9.333 7.333v4" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'copy': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M13.333 6H7.333A1.333 1.333 0 006 7.333v6a1.333 1.333 0 001.333 1.334h6a1.333 1.333 0 001.334-1.334v-6A1.333 1.333 0 0013.333 6z" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M3.333 10h-.666a1.333 1.333 0 01-1.334-1.333v-6a1.333 1.333 0 011.334-1.334h6A1.333 1.333 0 0110 2.667v.666" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'save': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M12.667 14H3.333A1.333 1.333 0 012 12.667V3.333A1.333 1.333 0 013.333 2h7.334L14 5.333v7.334A1.333 1.333 0 0112.667 14z" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M11.333 14V8.667H4.667V14M4.667 2v3.333h5.333" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'refresh': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M14 8a6 6 0 01-10.2 4.28M2 8a6 6 0 0110.2-4.28M14 2.667V6h-3.333M2 13.333V10h3.333" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  // UI Elements
  'search': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M14 14l-2.867-2.867m1.534-3.8A5.333 5.333 0 112 7.333a5.333 5.333 0 0110.667 0z" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'filter': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M2.5 4h11M4.5 8h7M6.5 12h3" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'menu': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'more-vertical': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="1" fill="currentColor"/>
    <circle cx="8" cy="4" r="1" fill="currentColor"/>
    <circle cx="8" cy="12" r="1" fill="currentColor"/>
  </svg>`,

  'more-horizontal': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="1" fill="currentColor"/>
    <circle cx="4" cy="8" r="1" fill="currentColor"/>
    <circle cx="12" cy="8" r="1" fill="currentColor"/>
  </svg>`,

  'grid': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M6 2H2.667A.667.667 0 002 2.667V6c0 .368.298.667.667.667H6A.667.667 0 006.667 6V2.667A.667.667 0 006 2zM13.333 2H10a.667.667 0 00-.667.667V6c0 .368.299.667.667.667h3.333A.667.667 0 0014 6V2.667A.667.667 0 0013.333 2zM13.333 9.333H10a.667.667 0 00-.667.667v3.333c0 .368.299.667.667.667h3.333a.667.667 0 00.667-.667V10a.667.667 0 00-.667-.667zM6 9.333H2.667A.667.667 0 002 10v3.333c0 .368.298.667.667.667H6a.667.667 0 00.667-.667V10A.667.667 0 006 9.333z" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'list': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M6 2.667h8M6 8h8M6 13.333h8M2 2.667h.007M2 8h.007M2 13.333h.007" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  // Status
  'info': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="6.667" stroke="currentColor" stroke-width="1.33"/>
    <path d="M8 10.667V8M8 5.333h.007" stroke="currentColor" stroke-width="1.33" stroke-linecap="round"/>
  </svg>`,

  'warning': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M6.86 2.573L1.213 12a1.333 1.333 0 001.14 2h11.294a1.333 1.333 0 001.14-2L9.14 2.573a1.333 1.333 0 00-2.28 0z" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M8 6v2.667M8 11.333h.007" stroke="currentColor" stroke-width="1.33" stroke-linecap="round"/>
  </svg>`,

  'error': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="6.667" stroke="currentColor" stroke-width="1.33"/>
    <path d="M10 6L6 10M6 6l4 4" stroke="currentColor" stroke-width="1.33" stroke-linecap="round"/>
  </svg>`,

  'success': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="6.667" stroke="currentColor" stroke-width="1.33"/>
    <path d="M5.333 8l2 2 3.334-3.333" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  // Objects
  'cart': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M6 14.667a.667.667 0 100-1.334.667.667 0 000 1.334zM13.333 14.667a.667.667 0 100-1.334.667.667 0 000 1.334zM.667.667h2.666l1.787 8.926a1.333 1.333 0 001.333 1.074h6.48a1.333 1.333 0 001.334-1.074L15.333 4H4" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'user': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M13.333 14v-1.333A2.667 2.667 0 0010.667 10H5.333a2.667 2.667 0 00-2.666 2.667V14M8 7.333A2.667 2.667 0 108 2a2.667 2.667 0 000 5.333z" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'home': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M6 14.667V8h4v6.667M2 6l6-4.667L14 6v7.333a1.334 1.334 0 01-1.333 1.334H3.333A1.334 1.334 0 012 13.333V6z" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'settings': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="2" stroke="currentColor" stroke-width="1.33"/>
    <path d="M13.067 10a1.133 1.133 0 00.227 1.253l.04.04a1.373 1.373 0 11-1.94 1.94l-.04-.04a1.133 1.133 0 00-1.254-.227 1.133 1.133 0 00-.687 1.04v.114a1.373 1.373 0 11-2.746 0v-.06a1.133 1.133 0 00-.74-1.04 1.133 1.133 0 00-1.254.227l-.04.04a1.373 1.373 0 11-1.94-1.94l.04-.04A1.133 1.133 0 003 10a1.133 1.133 0 00-1.04-.687h-.113a1.373 1.373 0 110-2.746h.06a1.133 1.133 0 001.04-.74 1.133 1.133 0 00-.227-1.254l-.04-.04a1.374 1.374 0 111.94-1.94l.04.04A1.133 1.133 0 006 2.86v-.007c0-.76.613-1.373 1.373-1.373h0c.76 0 1.373.613 1.373 1.373v.06c.02.444.3.836.687 1.04a1.133 1.133 0 001.254-.227l.04-.04a1.374 1.374 0 111.94 1.94l-.04.04a1.133 1.133 0 00-.227 1.254c.198.386.59.667 1.033.687h.12c.76 0 1.373.613 1.373 1.373h0c0 .76-.613 1.373-1.373 1.373h-.06a1.133 1.133 0 00-1.04.687z" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'mail': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M2.667 2.667h10.666c.734 0 1.334.6 1.334 1.333v8c0 .733-.6 1.333-1.334 1.333H2.667c-.734 0-1.334-.6-1.334-1.333V4c0-.733.6-1.333 1.334-1.333z" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M14.667 4L8 8.667 1.333 4" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'phone': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M14.667 11.28v2a1.333 1.333 0 01-1.454 1.333 13.193 13.193 0 01-5.753-2.046 13 13 0 01-4-4 13.193 13.193 0 01-2.047-5.78A1.333 1.333 0 012.74 1.333h2a1.333 1.333 0 011.333 1.147 8.56 8.56 0 00.467 1.873 1.333 1.333 0 01-.3 1.407l-.847.847a10.667 10.667 0 004 4l.847-.847a1.333 1.333 0 011.407-.3 8.56 8.56 0 001.873.467 1.333 1.333 0 011.147 1.353z" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'calendar': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M12.667 2.667H3.333C2.597 2.667 2 3.264 2 4v9.333c0 .737.597 1.334 1.333 1.334h9.334c.736 0 1.333-.597 1.333-1.334V4c0-.736-.597-1.333-1.333-1.333zM10.667 1.333V4M5.333 1.333V4M2 6.667h12" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'clock': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="6.667" stroke="currentColor" stroke-width="1.33"/>
    <path d="M8 4v4l2.667 1.333" stroke="currentColor" stroke-width="1.33" stroke-linecap="round"/>
  </svg>`,

  'file': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M9.333 1.333H4a1.333 1.333 0 00-1.333 1.334v10.666A1.333 1.333 0 004 14.667h8a1.333 1.333 0 001.333-1.334V5.333l-4-4z" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M9.333 1.333v4h4" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'image': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M12.667 2H3.333C2.597 2 2 2.597 2 3.333v9.334C2 13.403 2.597 14 3.333 14h9.334c.736 0 1.333-.597 1.333-1.333V3.333C14 2.597 13.403 2 12.667 2z" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M5.667 6.667a1 1 0 100-2 1 1 0 000 2zM14 10l-3.333-3.333L3.333 14" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'upload': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M14 10v2.667A1.334 1.334 0 0112.667 14H3.333A1.334 1.334 0 012 12.667V10M11.333 5.333L8 2M8 2L4.667 5.333M8 2v8" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'download': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M14 10v2.667A1.334 1.334 0 0112.667 14H3.333A1.334 1.334 0 012 12.667V10M4.667 6.667L8 10M8 10l3.333-3.333M8 10V2" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'link': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M6.667 8.667a3.333 3.333 0 005.026.36l2-2a3.334 3.334 0 00-4.713-4.714l-1.147 1.14" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M9.333 7.333a3.333 3.333 0 00-5.026-.36l-2 2a3.333 3.333 0 004.713 4.714l1.14-1.14" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'external-link': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M12 8.667v4A1.333 1.333 0 0110.667 14H3.333A1.333 1.333 0 012 12.667V5.333A1.333 1.333 0 013.333 4h4M10 2h4v4M6.667 9.333L14 2" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'eye': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M.667 8S3.333 2.667 8 2.667 15.333 8 15.333 8 12.667 13.333 8 13.333.667 8 .667 8z" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="8" cy="8" r="2" stroke="currentColor" stroke-width="1.33"/>
  </svg>`,

  'eye-off': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M9.413 9.413a2 2 0 11-2.826-2.826M11.96 11.96A6.546 6.546 0 018 13.333c-4.667 0-7.333-5.333-7.333-5.333a12.01 12.01 0 013.373-3.96m2.627-1.373A5.92 5.92 0 018 2.667c4.667 0 7.333 5.333 7.333 5.333a12.04 12.04 0 01-1.44 2.127M.667.667l14.666 14.666" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'lock': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M12.667 7.333H3.333C2.597 7.333 2 7.93 2 8.667v4.666c0 .737.597 1.334 1.333 1.334h9.334c.736 0 1.333-.597 1.333-1.334V8.667c0-.737-.597-1.334-1.333-1.334z" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M4.667 7.333V4.667a3.333 3.333 0 116.666 0v2.666" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'spinner': `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <style>.spinner_track{opacity:.25}.spinner_head{stroke-dasharray:60;stroke-dashoffset:45;stroke-linecap:round;animation:spinner_rotate .75s linear infinite}@keyframes spinner_rotate{100%{transform:rotate(360deg);transform-origin:center}}</style>
    <circle class="spinner_track" cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="3"/>
    <circle class="spinner_head" cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="3"/>
  </svg>`,

  'inbox': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M14.667 8H10.667L9.333 10H6.667L5.333 8H1.333" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M3.633 3.407L1.333 8v4a1.333 1.333 0 001.334 1.333h10.666A1.333 1.333 0 0014.667 12V8l-2.3-4.593a1.333 1.333 0 00-1.194-.74H4.827a1.333 1.333 0 00-1.194.74z" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'truck': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M10.667 2H1.333v9.333h9.334V2zM10.667 6h2.666l2 2v3.333h-4.666V6zM4 14a1.333 1.333 0 100-2.667A1.333 1.333 0 004 14zM12.667 14a1.333 1.333 0 100-2.667 1.333 1.333 0 000 2.667z" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'package': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M14 10.667V5.333a1.333 1.333 0 00-.667-1.153L8.667 1.513a1.333 1.333 0 00-1.334 0L2.667 4.18A1.333 1.333 0 002 5.333v5.334a1.333 1.333 0 00.667 1.153l4.666 2.667a1.333 1.333 0 001.334 0l4.666-2.667A1.333 1.333 0 0014 10.667z" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M2.18 4.627L8 8.007l5.82-3.38M8 14.72V8" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'star': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M8 1.333l2.06 4.174 4.607.673-3.334 3.247.787 4.586L8 11.847l-4.12 2.166.787-4.586L1.333 6.18l4.607-.673L8 1.333z" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'heart': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M13.893 3.073a3.667 3.667 0 00-5.186 0L8 3.78l-.707-.707a3.667 3.667 0 00-5.186 5.187l.706.707L8 14.153l5.187-5.186.706-.707a3.667 3.667 0 000-5.187z" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'bell': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M12 5.333a4 4 0 10-8 0c0 4.667-2 6-2 6h12s-2-1.333-2-6zM9.153 14a1.333 1.333 0 01-2.306 0" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'logout': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M6 14H3.333A1.333 1.333 0 012 12.667V3.333A1.333 1.333 0 013.333 2H6M10.667 11.333L14 8M14 8l-3.333-3.333M14 8H6" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'login': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path d="M10 2h2.667A1.333 1.333 0 0114 3.333v9.334A1.333 1.333 0 0112.667 14H10M6.667 11.333L10 8M10 8L6.667 4.667M10 8H2" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
};

/**
 * Helper function to add custom icons at runtime
 */
export function registerIcon(name: string, svg: string): void {
  ICON_REGISTRY[name] = svg;
}
