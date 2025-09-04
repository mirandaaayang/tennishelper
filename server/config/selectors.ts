// Centralized selectors for rec.us website automation
// Update these selectors if the website structure changes

export const SELECTORS = {
  login: {
    emailInput: 'input[type="email"], input[name="email"], #email',
    passwordInput: 'input[type="password"], input[name="password"], #password',
    submitButton: 'button[type="submit"], input[type="submit"], .login-button',
    twoFactorInput: 'input[name="code"], input[placeholder*="code"], .verification-code',
    twoFactorSubmit: 'button:has-text("Verify"), button:has-text("Submit"), .verify-button',
  },
  
  navigation: {
    bookingsMenu: 'a:has-text("Book"), nav a:has-text("Reservations"), .nav-bookings',
    tennisSection: 'a:has-text("Tennis"), .tennis-courts, [data-sport="tennis"]',
  },
  
  dashboard: {
    mainContent: '.dashboard, .main-content, #main, [role="main"]',
  },
  
  booking: {
    dateSelector: '.date-picker, .calendar-trigger, button:has-text("Select Date")',
    dateOption: '.calendar-day, .date-option, [data-date]',
    timeSlot: '[data-time="{time}"], .time-slot:has-text("{time}"), button:has-text("{time}")',
    continueButton: 'button:has-text("Continue"), button:has-text("Next"), .continue-btn',
    confirmationPage: '.booking-confirmation, .confirm-booking, [data-step="confirm"]',
    confirmButton: 'button:has-text("Confirm"), button:has-text("Book Now"), .confirm-booking',
    successMessage: '.booking-success, .success-message, [data-status="success"]',
  },
  
  courts: {
    hamilton: '.court-hamilton, [data-court="hamilton"], button:has-text("Hamilton")',
    backup1: '.court-backup, [data-court="backup"], button:has-text("Court 2")',
    backup2: '.court-alternative, [data-court="alt"], button:has-text("Court 3")',
  }
} as const;
