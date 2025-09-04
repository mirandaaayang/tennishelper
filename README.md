# Tennis Court Booking Bot

A headless automation bot that books tennis courts on rec.us every weekday at 8:00 AM Pacific Time.

## Features

- ✅ Automatic court booking for Hamilton court (with backups)
- ✅ SMS notifications via Twilio for booking results
- ✅ 2FA SMS code handling through Twilio webhook
- ✅ Configurable court preferences and booking times
- ✅ Memory-based booking attempt logging
- ✅ Pacific timezone scheduling with DST awareness

## Deployment to Render

### 1. Prerequisites
- GitHub repository with this code
- Render.com account (free)
- Environment variables:
  - `REC_US_EMAIL` - Your rec.us login email
  - `REC_US_PASSWORD` - Your rec.us password
  - `TWILIO_ACCOUNT_SID` - Your Twilio Account SID
  - `TWILIO_AUTH_TOKEN` - Your Twilio Auth Token
  - `TWILIO_PHONE_NUMBER` - Your Twilio phone number

### 2. Deploy Steps
1. Push code to GitHub
2. Go to [render.com](https://render.com)
3. Create New Web Service from GitHub repo
4. Configure:
   - **Build Command**: `npm install && npx playwright install chromium && npx playwright install-deps chromium`
   - **Start Command**: `npm start`
   - **Plan**: Free
5. Add environment variables in Render dashboard
6. Deploy!

### 3. External Scheduling (Required for Free Tier)
Since Render free tier apps sleep after 15 minutes:

1. Set up UptimeRobot or cron-job.org
2. Monitor this URL daily at 8:00 AM Pacific:
   `https://your-app.onrender.com/api/trigger-booking`

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/config` - Bot configuration  
- `GET /api/booking-attempts` - View booking history
- `POST /api/trigger-booking` - Manual booking trigger (for external cron)
- `POST /api/webhook/twilio` - Twilio SMS webhook

## Local Development

```bash
npm install
npm run dev
```

## Cost: $0/month on Render free tier

The bot automatically books Hamilton court for 7:30 AM slots, 7 days in advance, every weekday at 8:00 AM PT.