import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { TwilioService } from "./services/twilio-service";
import { EmailService } from "./services/email-service";
import { TennisBot } from "./services/tennis-bot";

export async function registerRoutes(app: Express): Promise<Server> {
  const twilioService = new TwilioService();
  const emailService = new EmailService();
  const tennisBot = new TennisBot(storage, emailService, twilioService);

  // Minimal Twilio webhook endpoint for SMS code retrieval
  app.post("/api/webhook/twilio", express.json(), async (req, res) => {
    try {
      const { Body, From } = req.body;
      
      console.log(`[Twilio] SMS received from ${From}: ${Body}`);
      
      // Extract verification code from SMS
      const codeMatch = Body.match(/\b\d{4,6}\b/);
      if (codeMatch) {
        const code = codeMatch[0];
        console.log(`[Twilio] Extracted verification code: ${code}`);
        
        // Store the code for the bot to retrieve
        twilioService.setVerificationCode(code);
        
        res.status(200).send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
      } else {
        console.log(`[Twilio] No verification code found in SMS: ${Body}`);
        res.status(200).send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
      }
    } catch (error) {
      console.error("[Twilio] Webhook error:", error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      service: "tennis-bot"
    });
  });

  // Manual trigger endpoint for testing (remove in production)
  app.post("/api/trigger-booking", async (req, res) => {
    try {
      console.log("[API] Manual booking trigger requested");
      const result = await tennisBot.attemptBooking();
      res.json({ success: true, result });
    } catch (error) {
      console.error("[API] Manual booking failed:", error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Get recent booking attempts
  app.get("/api/booking-attempts", async (req, res) => {
    try {
      const attempts = await storage.getRecentBookingAttempts(20);
      res.json(attempts);
    } catch (error) {
      console.error("[API] Failed to get booking attempts:", error);
      res.status(500).json({ error: "Failed to retrieve booking attempts" });
    }
  });

  // Get bot configuration
  app.get("/api/config", async (req, res) => {
    try {
      const config = await storage.getBotConfig();
      res.json(config);
    } catch (error) {
      console.error("[API] Failed to get bot config:", error);
      res.status(500).json({ error: "Failed to retrieve bot configuration" });
    }
  });

  const httpServer = createServer(app);

  // Initialize the tennis bot scheduling
  tennisBot.initialize();

  return httpServer;
}
