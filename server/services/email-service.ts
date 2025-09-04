import nodemailer from 'nodemailer';

interface BookingNotificationData {
  success: boolean;
  court: string;
  date: string;
  time: string;
  duration: number;
  error?: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Configure Gmail SMTP
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER || process.env.EMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD || process.env.EMAIL_PASSWORD,
      },
    });
  }

  async sendBookingNotification(data: BookingNotificationData): Promise<void> {
    const toEmail = process.env.NOTIFICATION_EMAIL || process.env.GMAIL_USER || process.env.EMAIL_USER;
    
    if (!toEmail) {
      console.error('[EmailService] No notification email configured');
      return;
    }

    const subject = data.success 
      ? `✅ Tennis Court Booked Successfully - ${data.court}` 
      : `❌ Tennis Court Booking Failed - ${data.court}`;

    const html = data.success ? this.getSuccessEmailTemplate(data) : this.getFailureEmailTemplate(data);

    try {
      await this.transporter.sendMail({
        from: process.env.GMAIL_USER || process.env.EMAIL_USER,
        to: toEmail,
        subject,
        html,
      });

      console.log(`[EmailService] ${data.success ? 'Success' : 'Failure'} notification sent to ${toEmail}`);
    } catch (error) {
      console.error('[EmailService] Failed to send notification:', error);
    }
  }

  private getSuccessEmailTemplate(data: BookingNotificationData): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Tennis Court Booking Success</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .header { text-align: center; margin-bottom: 30px; }
            .success-icon { font-size: 48px; color: #4CAF50; margin-bottom: 20px; }
            .title { color: #2E7D32; font-size: 24px; font-weight: bold; margin: 0; }
            .details { background-color: #E8F5E8; padding: 20px; border-radius: 6px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
            .detail-label { font-weight: bold; color: #555; }
            .detail-value { color: #333; }
            .footer { text-align: center; margin-top: 30px; color: #777; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="success-icon">✅</div>
                <h1 class="title">Court Booking Successful!</h1>
                <p style="color: #666; margin: 10px 0 0 0;">Your tennis court has been successfully booked</p>
            </div>
            
            <div class="details">
                <div class="detail-row">
                    <span class="detail-label">Court:</span>
                    <span class="detail-value">${data.court}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Date:</span>
                    <span class="detail-value">${data.date}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Time:</span>
                    <span class="detail-value">${data.time}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Booking Duration:</span>
                    <span class="detail-value">${(data.duration / 1000).toFixed(1)}s</span>
                </div>
            </div>
            
            <div class="footer">
                <p>This is an automated notification from your Tennis Booking Bot</p>
                <p style="margin: 5px 0 0 0;">Timestamp: ${new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })} PT</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  private getFailureEmailTemplate(data: BookingNotificationData): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Tennis Court Booking Failed</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .header { text-align: center; margin-bottom: 30px; }
            .error-icon { font-size: 48px; color: #F44336; margin-bottom: 20px; }
            .title { color: #D32F2F; font-size: 24px; font-weight: bold; margin: 0; }
            .details { background-color: #FFEBEE; padding: 20px; border-radius: 6px; margin: 20px 0; }
            .error-details { background-color: #FFF3E0; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #FF9800; }
            .detail-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
            .detail-label { font-weight: bold; color: #555; }
            .detail-value { color: #333; }
            .error-message { color: #F57C00; font-weight: 500; }
            .footer { text-align: center; margin-top: 30px; color: #777; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="error-icon">❌</div>
                <h1 class="title">Court Booking Failed</h1>
                <p style="color: #666; margin: 10px 0 0 0;">Unable to book the tennis court</p>
            </div>
            
            <div class="details">
                <div class="detail-row">
                    <span class="detail-label">Attempted Court:</span>
                    <span class="detail-value">${data.court}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Target Date:</span>
                    <span class="detail-value">${data.date}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Target Time:</span>
                    <span class="detail-value">${data.time}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Attempt Duration:</span>
                    <span class="detail-value">${(data.duration / 1000).toFixed(1)}s</span>
                </div>
            </div>
            
            ${data.error ? `
            <div class="error-details">
                <div class="detail-label" style="margin-bottom: 10px;">Error Details:</div>
                <div class="error-message">${data.error}</div>
            </div>
            ` : ''}
            
            <div class="footer">
                <p>This is an automated notification from your Tennis Booking Bot</p>
                <p style="margin: 5px 0 0 0;">The bot will automatically retry at the next scheduled time.</p>
                <p style="margin: 5px 0 0 0;">Timestamp: ${new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })} PT</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  async sendTestEmail(): Promise<boolean> {
    try {
      await this.sendBookingNotification({
        success: true,
        court: "Hamilton",
        date: new Date().toDateString(),
        time: "7:30 AM",
        duration: 2500,
      });
      return true;
    } catch (error) {
      console.error('[EmailService] Test email failed:', error);
      return false;
    }
  }
}
