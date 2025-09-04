import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const bookingAttempts = pgTable("booking_attempts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  court: text("court").notNull(),
  targetDate: text("target_date").notNull(),
  targetTime: text("target_time").notNull(),
  status: text("status").notNull(), // 'success', 'failed', 'pending'
  errorMessage: text("error_message"),
  duration: integer("duration"), // in milliseconds
  createdAt: timestamp("created_at").defaultNow(),
});

export const botConfig = pgTable("bot_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  preferredCourt: text("preferred_court").notNull().default("Hamilton"),
  targetTime: text("target_time").notNull().default("7:30 AM"),
  isActive: boolean("is_active").notNull().default(true),
  emailNotifications: boolean("email_notifications").notNull().default(false),
  smsNotifications: boolean("sms_notifications").notNull().default(true),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertBookingAttemptSchema = createInsertSchema(bookingAttempts).omit({
  id: true,
  createdAt: true,
});

export const insertBotConfigSchema = createInsertSchema(botConfig).omit({
  id: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type BookingAttempt = typeof bookingAttempts.$inferSelect;
export type InsertBookingAttempt = z.infer<typeof insertBookingAttemptSchema>;
export type BotConfig = typeof botConfig.$inferSelect;
export type InsertBotConfig = z.infer<typeof insertBotConfigSchema>;
