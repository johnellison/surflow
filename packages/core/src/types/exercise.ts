import { z } from 'zod';
import { BodyArea } from './user';

export const ExerciseDifficulty = z.enum(['beginner', 'intermediate', 'advanced']);
export type ExerciseDifficulty = z.infer<typeof ExerciseDifficulty>;

export const SurfRelevance = z.enum([
  'paddling',
  'pop-up',
  'bottom-turn',
  'duck-dive',
  'balance',
  'general-mobility',
]);
export type SurfRelevance = z.infer<typeof SurfRelevance>;

export const ExerciseSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string(),
  videoUrl: z.string().url().nullable(),
  bodyAreas: z.array(BodyArea),
  surfRelevance: z.array(SurfRelevance),
  difficulty: ExerciseDifficulty,
  durationSeconds: z.number().positive(),
  sets: z.number().positive().nullable(),
  reps: z.number().positive().nullable(),
  createdAt: z.date(),
});

export type Exercise = z.infer<typeof ExerciseSchema>;

export const RoutineType = z.enum(['warmup', 'cooldown', 'recovery', 'injury']);
export type RoutineType = z.infer<typeof RoutineType>;

export const RoutineExerciseSchema = z.object({
  exerciseId: z.string().uuid(),
  order: z.number().nonnegative(),
  restAfterSeconds: z.number().nonnegative().default(30),
});

export const RoutineSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  type: RoutineType,
  exercises: z.array(RoutineExerciseSchema),
  estimatedDuration: z.number().positive().describe('Minutes'),
  targetIntensity: z.enum(['light', 'moderate', 'intense']),
  createdAt: z.date(),
});

export type Routine = z.infer<typeof RoutineSchema>;
