interface BookingNotificationData {
  success: boolean;
  court: string;
  date: string;
  time: string;
  duration: number;
  error?: string;
}

export class TwilioService {
  private verificationCode: string | null = null;
  private codeResolvers: Array<(code: string | null) => void> = [];

  constructor() {
    // Clear any stored verification codes on startup
    this.verificationCode = null;
  }

  setVerificationCode(code: string): void {
    console.log(`[TwilioService] Verification code received: ${code}`);
    this.verificationCode = code;
    
    // Resolve any pending promises waiting for the code
    this.codeResolvers.forEach(resolve => resolve(code));
    this.codeResolvers = [];
    
    // Clear the code after 60 seconds to prevent reuse
    setTimeout(() => {
      if (this.verificationCode === code) {
        this.verificationCode = null;
        console.log('[TwilioService] Verification code expired and cleared');
      }
    }, 60000);
  }

  async waitForVerificationCode(timeoutMs: number = 30000): Promise<string | null> {
    // Return immediately if we already have a code
    if (this.verificationCode) {
      const code = this.verificationCode;
      this.verificationCode = null; // Clear after use
      return code;
    }

    // Wait for a new code to arrive
    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        // Remove this resolver from the list
        const index = this.codeResolvers.indexOf(resolve);
        if (index > -1) {
          this.codeResolvers.splice(index, 1);
        }
        resolve(null); // Timeout
      }, timeoutMs);

      // Add resolver to the list
      const wrappedResolve = (code: string | null) => {
        clearTimeout(timeoutId);
        resolve(code);
      };
      
      this.codeResolvers.push(wrappedResolve);
    });
  }

  hasVerificationCode(): boolean {
    return this.verificationCode !== null;
  }

  clearVerificationCode(): void {
    this.verificationCode = null;
    console.log('[TwilioService] Verification code manually cleared');
  }

  async sendBookingNotification(data: BookingNotificationData): Promise<void> {
    const twilioNumber = process.env.TWILIO_PHONE_NUMBER;
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    
    if (!twilioNumber || !accountSid || !authToken) {
      console.error('[TwilioService] Missing Twilio configuration for SMS notifications');
      return;
    }

    const message = data.success 
      ? `✅ Tennis court booked! ${data.court} court on ${data.date} at ${data.time}. Booking took ${(data.duration / 1000).toFixed(1)}s.`
      : `❌ Failed to book ${data.court} court on ${data.date} at ${data.time}. Error: ${data.error || 'Unknown error'}. Duration: ${(data.duration / 1000).toFixed(1)}s.`;

    try {
      // Use Twilio REST API to send SMS
      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: twilioNumber,
          To: twilioNumber.replace(/\s+/g, ''), // Remove spaces and use same number (Twilio trial limitation)
          Body: message,
        }),
      });

      if (response.ok) {
        console.log(`[TwilioService] ${data.success ? 'Success' : 'Failure'} notification sent via SMS`);
      } else {
        const errorText = await response.text();
        console.error('[TwilioService] Failed to send SMS notification:', errorText);
      }
    } catch (error) {
      console.error('[TwilioService] Failed to send SMS notification:', error);
    }
  }
}
