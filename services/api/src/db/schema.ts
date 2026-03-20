import {
  pgTable,
  uuid,
  text,
  varchar,
  timestamp,
  integer,
  real,
  boolean,
  jsonb,
  pgEnum,
} from 'drizzle-orm/pg-core';

// Enums
export const regionEnum = pgEnum('region', ['morocco', 'bali']);
export const breakTypeEnum = pgEnum('break_type', ['reef', 'beach', 'point']);
export const surfLevelEnum = pgEnum('surf_level', [
  'beginner',
  'intermediate',
  'advanced',
  'professional',
]);
export const authProviderEnum = pgEnum('auth_provider', ['email', 'apple', 'google']);
export const tideStateEnum = pgEnum('tide_state', ['rising', 'falling', 'high', 'low']);
export const forecastSourceEnum = pgEnum('forecast_source', [
  'noaa',
  'copernicus',
  'open-meteo',
  'surfline',
]);
export const sessionTypeEnum = pgEnum('session_type', [
  'one-on-one',
  'group',
  'video-analysis',
]);
export const bookingStatusEnum = pgEnum('booking_status', [
  'confirmed',
  'completed',
  'cancelled',
]);
export const exerciseDifficultyEnum = pgEnum('exercise_difficulty', [
  'beginner',
  'intermediate',
  'advanced',
]);
export const routineTypeEnum = pgEnum('routine_type', [
  'warmup',
  'cooldown',
  'recovery',
  'injury',
]);

// Tables

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  passwordHash: text('password_hash'),
  avatarUrl: text('avatar_url'),
  authProvider: authProviderEnum('auth_provider').notNull().default('email'),
  surfLevel: surfLevelEnum('surf_level'),
  homeSpotId: uuid('home_spot_id'),
  injuryAreas: jsonb('injury_areas').$type<string[]>().default([]),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const spots = pgTable('spots', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  region: regionEnum('region').notNull(),
  latitude: real('latitude').notNull(),
  longitude: real('longitude').notNull(),
  orientation: integer('orientation').notNull(),
  breakType: breakTypeEnum('break_type').notNull(),
  idealSwellDir: integer('ideal_swell_dir').notNull(),
  idealWindDir: integer('ideal_wind_dir').notNull(),
  description: text('description').notNull().default(''),
  imageUrl: text('image_url'),
  webcamUrls: jsonb('webcam_urls').$type<string[]>().default([]),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const forecasts = pgTable('forecasts', {
  id: uuid('id').primaryKey().defaultRandom(),
  spotId: uuid('spot_id')
    .notNull()
    .references(() => spots.id),
  timestamp: timestamp('timestamp').notNull(),
  source: forecastSourceEnum('source').notNull(),
  swellHeight: real('swell_height').notNull(),
  swellPeriod: real('swell_period').notNull(),
  swellDirection: integer('swell_direction').notNull(),
  windSpeed: real('wind_speed').notNull(),
  windDirection: integer('wind_direction').notNull(),
  tideHeight: real('tide_height').notNull(),
  tideState: tideStateEnum('tide_state').notNull(),
  waterTemp: real('water_temp').notNull(),
  airTemp: real('air_temp').notNull(),
  rating: integer('rating').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const coaches = pgTable('coaches', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  bio: text('bio').notNull().default(''),
  certifications: jsonb('certifications').$type<string[]>().default([]),
  specialties: jsonb('specialties').$type<string[]>().default([]),
  languages: jsonb('languages').$type<string[]>().default([]),
  hourlyRate: integer('hourly_rate').notNull(),
  currency: varchar('currency', { length: 3 }).notNull().default('USD'),
  stripeAccountId: varchar('stripe_account_id', { length: 255 }),
  region: regionEnum('region').notNull(),
  verified: boolean('verified').notNull().default(false),
  ratingAvg: real('rating_avg'),
  ratingCount: integer('rating_count').notNull().default(0),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const bookings = pgTable('bookings', {
  id: uuid('id').primaryKey().defaultRandom(),
  surferId: uuid('surfer_id')
    .notNull()
    .references(() => users.id),
  coachId: uuid('coach_id')
    .notNull()
    .references(() => coaches.id),
  sessionType: sessionTypeEnum('session_type').notNull(),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  status: bookingStatusEnum('status').notNull().default('confirmed'),
  stripePaymentId: varchar('stripe_payment_id', { length: 255 }),
  amount: integer('amount').notNull(),
  platformFee: integer('platform_fee').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const exercises = pgTable('exercises', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description').notNull(),
  videoUrl: text('video_url'),
  bodyAreas: jsonb('body_areas').$type<string[]>().default([]),
  surfRelevance: jsonb('surf_relevance').$type<string[]>().default([]),
  difficulty: exerciseDifficultyEnum('difficulty').notNull(),
  durationSeconds: integer('duration_seconds').notNull(),
  sets: integer('sets'),
  reps: integer('reps'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const routines = pgTable('routines', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  type: routineTypeEnum('type').notNull(),
  exercises: jsonb('exercises')
    .$type<Array<{ exerciseId: string; order: number; restAfterSeconds: number }>>()
    .default([]),
  estimatedDuration: integer('estimated_duration').notNull(),
  targetIntensity: varchar('target_intensity', { length: 20 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const surfSessions = pgTable('surf_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  spotId: uuid('spot_id')
    .notNull()
    .references(() => spots.id),
  startedAt: timestamp('started_at').notNull(),
  endedAt: timestamp('ended_at').notNull(),
  conditionsSnapshot: jsonb('conditions_snapshot'),
  notes: text('notes'),
  personalRating: integer('personal_rating'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const reviews = pgTable('reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  bookingId: uuid('booking_id')
    .notNull()
    .references(() => bookings.id),
  reviewerId: uuid('reviewer_id')
    .notNull()
    .references(() => users.id),
  coachId: uuid('coach_id')
    .notNull()
    .references(() => coaches.id),
  rating: integer('rating').notNull(),
  text: text('text').notNull(),
  coachResponse: text('coach_response'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  threadId: uuid('thread_id').notNull(),
  senderId: uuid('sender_id')
    .notNull()
    .references(() => users.id),
  body: text('body').notNull(),
  mediaUrl: text('media_url'),
  readAt: timestamp('read_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const favorites = pgTable('favorites', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  spotId: uuid('spot_id')
    .notNull()
    .references(() => spots.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
