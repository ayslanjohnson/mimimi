// backend/src/infrastructure/database/schema.js
import { pgTable, varchar, integer, json, timestamp } from 'drizzle-orm/pg-core';
import { sql } from '@vercel/postgres';
import { drizzle } from 'drizzle-orm/vercel-postgres';

export const profileAnalysisTable = pgTable('profile_analysis', {
  id: varchar('id', { length: 255 }).primaryKey(),
  psnId: varchar('psn_id', { length: 16 }).notNull().unique(),
  analysisData: json('analysis_data').notNull(),
  scoringResult: json('scoring_result').notNull(),
  llmAnalysis: json('llm_analysis'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const cacheTable = pgTable('api_cache', {
  id: varchar('id', { length: 255 }).primaryKey(),
  key: varchar('key', { length: 512 }).notNull().unique(),
  data: json('data').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
});

export const db = drizzle(sql);