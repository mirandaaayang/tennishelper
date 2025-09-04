import { type User, type InsertUser, type BookingAttempt, type InsertBookingAttempt, type BotConfig, type InsertBotConfig } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  createBookingAttempt(attempt: InsertBookingAttempt): Promise<BookingAttempt>;
  getRecentBookingAttempts(limit?: number): Promise<BookingAttempt[]>;
  updateBookingAttempt(id: string, updates: Partial<BookingAttempt>): Promise<BookingAttempt | undefined>;
  
  getBotConfig(): Promise<BotConfig | undefined>;
  updateBotConfig(config: Partial<InsertBotConfig>): Promise<BotConfig>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private bookingAttempts: Map<string, BookingAttempt>;
  private botConfig: BotConfig | undefined;

  constructor() {
    this.users = new Map();
    this.bookingAttempts = new Map();
    
    // Initialize default bot config
    this.botConfig = {
      id: randomUUID(),
      preferredCourt: "Hamilton",
      targetTime: "7:30 AM",
      isActive: true,
      emailNotifications: false,
      smsNotifications: true,
      updatedAt: new Date(),
    };
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createBookingAttempt(attempt: InsertBookingAttempt): Promise<BookingAttempt> {
    const id = randomUUID();
    const bookingAttempt: BookingAttempt = {
      ...attempt,
      id,
      createdAt: new Date(),
      duration: attempt.duration ?? null,
      errorMessage: attempt.errorMessage ?? null,
    };
    this.bookingAttempts.set(id, bookingAttempt);
    return bookingAttempt;
  }

  async getRecentBookingAttempts(limit: number = 10): Promise<BookingAttempt[]> {
    const attempts = Array.from(this.bookingAttempts.values())
      .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime())
      .slice(0, limit);
    return attempts;
  }

  async updateBookingAttempt(id: string, updates: Partial<BookingAttempt>): Promise<BookingAttempt | undefined> {
    const attempt = this.bookingAttempts.get(id);
    if (!attempt) return undefined;
    
    const updated = { ...attempt, ...updates };
    this.bookingAttempts.set(id, updated);
    return updated;
  }

  async getBotConfig(): Promise<BotConfig | undefined> {
    return this.botConfig;
  }

  async updateBotConfig(config: Partial<InsertBotConfig>): Promise<BotConfig> {
    if (!this.botConfig) {
      this.botConfig = {
        id: randomUUID(),
        preferredCourt: "Hamilton",
        targetTime: "7:30 AM",
        isActive: true,
        emailNotifications: false,
        smsNotifications: true,
        updatedAt: new Date(),
      };
    }

    this.botConfig = {
      ...this.botConfig,
      ...config,
      updatedAt: new Date(),
    };

    return this.botConfig;
  }
}

export const storage = new MemStorage();
