import { z } from 'zod';

export const SurfSessionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  spotId: z.string().uuid(),
  startedAt: z.date(),
  endedAt: z.date(),
  conditionsSnapshot: z
    .object({
      swellHeight: z.number(),
      swellPeriod: z.number(),
      windSpeed: z.number(),
      rating: z.number().min(1).max(5),
    })
    .nullable(),
  notes: z.string().nullable(),
  personalRating: z.number().min(1).max(5).nullable(),
  createdAt: z.date(),
});

export type SurfSession = z.infer<typeof SurfSessionSchema>;

export const CreateSurfSessionSchema = SurfSessionSchema.omit({
  id: true,
  createdAt: true,
});
export type CreateSurfSession = z.infer<typeof CreateSurfSessionSchema>;
