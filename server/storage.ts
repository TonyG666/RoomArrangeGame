import { users, type User, type InsertUser } from "@shared/schema";
import { eq } from "drizzle-orm";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  currentId: number;

  constructor() {
    this.users = new Map();
    this.currentId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
}

// Database storage implementation using Drizzle ORM
export class DbStorage implements IStorage {
  private db: any;

  constructor(db: any) {
    this.db = db;
  }

  async getUser(id: number): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await this.db.insert(users).values(insertUser).returning();
    return result[0];
  }
}

// Helper function to initialize database storage asynchronously
export async function initializeDbStorage(): Promise<IStorage> {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for database storage");
  }
  
  const { drizzle } = await import("drizzle-orm/neon-http");
  const { neon } = await import("@neondatabase/serverless");
  
  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql);
  console.log("Using PostgreSQL database storage");
  return new DbStorage(db);
}

// Initialize storage based on environment
// For production with DATABASE_URL, you should call initializeDbStorage() and update storage
// For now, default to memory storage (works for both dev and prod if no DB is needed)
export const storage = new MemStorage();

// If you want to use database storage in production, update routes.ts to call:
// const storage = await initializeDbStorage();
// Then use that storage instance instead of the default export
