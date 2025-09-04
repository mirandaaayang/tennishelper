import { chromium, Browser, Page } from 'playwright';
import { storage, type IStorage } from '../storage';
import { EmailService } from './email-service';
import { TwilioService } from './twilio-service';
import { SELECTORS } from '../config/selectors';
import { COURTS } from '../config/courts';
import { getNextWeekdayAt8AM, getPacificTime, getTargetBookingDate } from '../utils/timezone';
import { type InsertBookingAttempt } from '@shared/schema';

export class TennisBot {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private scheduledTimeouts: Set<NodeJS.Timeout> = new Set();

  constructor(
    private storage: IStorage,
    private emailService: EmailService,
    private twilioService: TwilioService
  ) {}

  async initialize() {
    console.log('[TennisBot] Initializing bot...');
    
    // Schedule next booking attempt
    this.scheduleNextBooking();
    
    console.log('[TennisBot] Bot initialized successfully');
  }

  private scheduleNextBooking() {
    // Clear existing timeouts
    this.scheduledTimeouts.forEach(timeout => clearTimeout(timeout));
    this.scheduledTimeouts.clear();

    const now = getPacificTime();
    const nextRun = getNextWeekdayAt8AM();
    const preWarmTime = new Date(nextRun.getTime() - 20000); // 20 seconds before
    
    const timeToPreWarm = preWarmTime.getTime() - now.getTime();
    const timeToRun = nextRun.getTime() - now.getTime();

    console.log(`[TennisBot] Current time: ${now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })}`);
    console.log(`[TennisBot] Next pre-warm: ${preWarmTime.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })}`);
    console.log(`[TennisBot] Next booking attempt: ${nextRun.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })}`);

    // Schedule pre-warming
    if (timeToPreWarm > 0) {
      const preWarmTimeout = setTimeout(() => {
        console.log('[TennisBot] Starting pre-warm session...');
        this.preWarmBrowser();
      }, timeToPreWarm);
      
      this.scheduledTimeouts.add(preWarmTimeout);
    }

    // Schedule booking attempt
    if (timeToRun > 0) {
      const bookingTimeout = setTimeout(() => {
        console.log('[TennisBot] Starting booking attempt...');
        this.attemptBooking().then(() => {
          // Schedule next booking after this one completes
          this.scheduleNextBooking();
        });
      }, timeToRun);
      
      this.scheduledTimeouts.add(bookingTimeout);
    }
  }

  private async preWarmBrowser() {
    try {
      console.log('[TennisBot] Pre-warming browser...');
      
      this.browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      this.page = await this.browser.newPage();
      
      // Set user agent to avoid detection
      await this.page.setExtraHTTPHeaders({
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      });
      
      // Navigate to rec.us login page
      await this.page.goto('https://rec.us/login', { waitUntil: 'networkidle' });
      
      console.log('[TennisBot] Browser pre-warmed successfully');
    } catch (error) {
      console.error('[TennisBot] Pre-warm failed:', error);
      await this.cleanup();
    }
  }

  async attemptBooking(): Promise<boolean> {
    const startTime = Date.now();
    const targetDate = getTargetBookingDate();
    const config = await this.storage.getBotConfig();
    
    if (!config || !config.isActive) {
      console.log('[TennisBot] Bot is not active, skipping booking attempt');
      return false;
    }

    const attemptData: InsertBookingAttempt = {
      court: config.preferredCourt,
      targetDate: targetDate.toDateString(),
      targetTime: config.targetTime,
      status: 'pending',
      duration: null,
      errorMessage: null,
    };

    const attempt = await this.storage.createBookingAttempt(attemptData);
    
    try {
      console.log(`[TennisBot] Starting booking attempt for ${config.preferredCourt} court on ${targetDate.toDateString()} at ${config.targetTime}`);

      // Initialize browser if not already done
      if (!this.browser || !this.page) {
        await this.preWarmBrowser();
      }

      if (!this.page) {
        throw new Error('Failed to initialize browser page');
      }

      // Step 1: Login
      await this.login();

      // Step 2: Navigate to booking page
      await this.navigateToBooking();

      // Step 3: Select date and time
      await this.selectDateAndTime(targetDate, config.targetTime);

      // Step 4: Select court
      const courtBooked = await this.selectCourt(config.preferredCourt);

      // Step 5: Complete booking
      await this.completeBooking();

      const duration = Date.now() - startTime;
      
      await this.storage.updateBookingAttempt(attempt.id, {
        status: 'success',
        duration,
        court: courtBooked,
      });

      console.log(`[TennisBot] Booking successful! ${courtBooked} court booked for ${targetDate.toDateString()} at ${config.targetTime}`);

      // Send success notification via SMS
      if (config.smsNotifications) {
        await this.twilioService.sendBookingNotification({
          success: true,
          court: courtBooked,
          date: targetDate.toDateString(),
          time: config.targetTime,
          duration,
        });
      }

      return true;

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      console.error('[TennisBot] Booking failed:', errorMessage);

      await this.storage.updateBookingAttempt(attempt.id, {
        status: 'failed',
        duration,
        errorMessage,
      });

      // Send failure notification via SMS
      if (config?.smsNotifications) {
        await this.twilioService.sendBookingNotification({
          success: false,
          court: config.preferredCourt,
          date: targetDate.toDateString(),
          time: config.targetTime,
          duration,
          error: errorMessage,
        });
      }

      return false;
    } finally {
      await this.cleanup();
    }
  }

  private async login() {
    if (!this.page) throw new Error('Browser page not initialized');

    console.log('[TennisBot] Attempting login...');

    // Fill in login credentials
    await this.page.fill(SELECTORS.login.emailInput, process.env.REC_US_EMAIL || '');
    await this.page.fill(SELECTORS.login.passwordInput, process.env.REC_US_PASSWORD || '');
    
    // Click login button
    await this.page.click(SELECTORS.login.submitButton);
    
    // Wait for potential 2FA
    try {
      await this.page.waitForSelector(SELECTORS.login.twoFactorInput, { timeout: 5000 });
      console.log('[TennisBot] 2FA required, waiting for SMS code...');
      
      // Wait for SMS code from Twilio webhook
      const code = await this.twilioService.waitForVerificationCode(30000); // 30 second timeout
      
      if (!code) {
        throw new Error('Failed to receive SMS verification code');
      }

      await this.page.fill(SELECTORS.login.twoFactorInput, code);
      await this.page.click(SELECTORS.login.twoFactorSubmit);
      
    } catch (error) {
      // 2FA not required or different flow
      console.log('[TennisBot] No 2FA required or already logged in');
    }

    // Wait for successful login
    await this.page.waitForSelector(SELECTORS.dashboard.mainContent, { timeout: 10000 });
    
    console.log('[TennisBot] Login successful');
  }

  private async navigateToBooking() {
    if (!this.page) throw new Error('Browser page not initialized');

    console.log('[TennisBot] Navigating to booking page...');
    
    // Navigate to tennis court booking section
    await this.page.click(SELECTORS.navigation.bookingsMenu);
    await this.page.click(SELECTORS.navigation.tennisSection);
    
    await this.page.waitForSelector(SELECTORS.booking.dateSelector, { timeout: 10000 });
    
    console.log('[TennisBot] Successfully navigated to booking page');
  }

  private async selectDateAndTime(targetDate: Date, targetTime: string) {
    if (!this.page) throw new Error('Browser page not initialized');

    console.log(`[TennisBot] Selecting date: ${targetDate.toDateString()} and time: ${targetTime}`);

    // Open date picker
    await this.page.click(SELECTORS.booking.dateSelector);
    
    // Find and click the target date
    const dateString = targetDate.getDate().toString();
    await this.page.click(`${SELECTORS.booking.dateOption}[data-date="${dateString}"]`);
    
    // Select time slot
    const timeSelector = SELECTORS.booking.timeSlot.replace('{time}', targetTime);
    await this.page.waitForSelector(timeSelector, { timeout: 5000 });
    await this.page.click(timeSelector);
    
    console.log('[TennisBot] Date and time selected successfully');
  }

  private async selectCourt(preferredCourt: string): Promise<string> {
    if (!this.page) throw new Error('Browser page not initialized');

    console.log(`[TennisBot] Attempting to select ${preferredCourt} court...`);

    // Try preferred court first
    const courtOption = COURTS.find(court => court.name === preferredCourt);
    if (!courtOption) {
      throw new Error(`Court ${preferredCourt} not found in configuration`);
    }

    try {
      await this.page.waitForSelector(courtOption.selector, { timeout: 5000 });
      await this.page.click(courtOption.selector);
      console.log(`[TennisBot] Successfully selected ${preferredCourt} court`);
      return preferredCourt;
    } catch (error) {
      console.log(`[TennisBot] ${preferredCourt} court not available, trying backup courts...`);
      
      // Try backup courts
      for (const court of COURTS) {
        if (court.name === preferredCourt) continue; // Skip preferred court
        
        try {
          await this.page.waitForSelector(court.selector, { timeout: 2000 });
          await this.page.click(court.selector);
          console.log(`[TennisBot] Successfully selected backup court: ${court.name}`);
          return court.name;
        } catch (backupError) {
          console.log(`[TennisBot] ${court.name} court also not available`);
          continue;
        }
      }
      
      throw new Error('No courts available for the selected time slot');
    }
  }

  private async completeBooking() {
    if (!this.page) throw new Error('Browser page not initialized');

    console.log('[TennisBot] Completing booking...');

    // Click continue/next button
    await this.page.click(SELECTORS.booking.continueButton);
    
    // Wait for confirmation page
    await this.page.waitForSelector(SELECTORS.booking.confirmationPage, { timeout: 10000 });
    
    // Click final confirm button
    await this.page.click(SELECTORS.booking.confirmButton);
    
    // Wait for success message
    await this.page.waitForSelector(SELECTORS.booking.successMessage, { timeout: 15000 });
    
    console.log('[TennisBot] Booking completed successfully');
  }

  private async cleanup() {
    try {
      if (this.page) {
        await this.page.close();
        this.page = null;
      }
      
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }
    } catch (error) {
      console.error('[TennisBot] Cleanup error:', error);
    }
  }

  async shutdown() {
    console.log('[TennisBot] Shutting down...');
    
    // Clear all scheduled timeouts
    this.scheduledTimeouts.forEach(timeout => clearTimeout(timeout));
    this.scheduledTimeouts.clear();
    
    await this.cleanup();
    
    console.log('[TennisBot] Shutdown complete');
  }
}
