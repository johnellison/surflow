import { z } from 'zod';

export const BreakType = z.enum(['reef', 'beach', 'point']);
export type BreakType = z.infer<typeof BreakType>;

export const Region = z.enum(['morocco', 'bali']);
export type Region = z.infer<typeof Region>;

export const SpotSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  slug: z.string().min(1),
  region: Region,
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  orientation: z.number().min(0).max(360).describe('Degrees, facing the ocean'),
  breakType: BreakType,
  idealSwellDir: z.number().min(0).max(360),
  idealWindDir: z.number().min(0).max(360),
  description: z.string(),
  imageUrl: z.string().url().nullable(),
  webcamUrls: z.array(z.string().url()),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Spot = z.infer<typeof SpotSchema>;

export const CreateSpotSchema = SpotSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type CreateSpot = z.infer<typeof CreateSpotSchema>;
