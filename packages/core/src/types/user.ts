import { z } from 'zod';

export const SurfLevel = z.enum(['beginner', 'intermediate', 'advanced', 'professional']);
export type SurfLevel = z.infer<typeof SurfLevel>;

export const AuthProvider = z.enum(['email', 'apple', 'google']);
export type AuthProvider = z.infer<typeof AuthProvider>;

export const BodyArea = z.enum([
  'shoulders',
  'hips',
  'lower-back',
  'upper-back',
  'neck',
  'ankles',
  'knees',
  'wrists',
]);
export type BodyArea = z.infer<typeof BodyArea>;

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1),
  avatarUrl: z.string().url().nullable(),
  authProvider: AuthProvider,
  surfLevel: SurfLevel.nullable(),
  homeSpotId: z.string().uuid().nullable(),
  injuryAreas: z.array(BodyArea),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type User = z.infer<typeof UserSchema>;

export const CreateUserSchema = UserSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type CreateUser = z.infer<typeof CreateUserSchema>;
