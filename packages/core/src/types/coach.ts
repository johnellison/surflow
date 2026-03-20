import { z } from 'zod';
import { Region } from './spot';

export const CoachSpecialty = z.enum([
  'beginner-lessons',
  'intermediate-coaching',
  'advanced-coaching',
  'video-analysis',
  'surf-fitness',
  'big-wave',
]);
export type CoachSpecialty = z.infer<typeof CoachSpecialty>;

export const CoachSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  bio: z.string(),
  certifications: z.array(z.string()),
  specialties: z.array(CoachSpecialty),
  languages: z.array(z.string()),
  hourlyRate: z.number().positive(),
  currency: z.string().default('USD'),
  stripeAccountId: z.string().nullable(),
  region: Region,
  verified: z.boolean().default(false),
  ratingAvg: z.number().min(0).max(5).nullable(),
  ratingCount: z.number().nonnegative().default(0),
  active: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Coach = z.infer<typeof CoachSchema>;

export const CreateCoachSchema = CoachSchema.omit({
  id: true,
  ratingAvg: true,
  ratingCount: true,
  createdAt: true,
  updatedAt: true,
});
export type CreateCoach = z.infer<typeof CreateCoachSchema>;
