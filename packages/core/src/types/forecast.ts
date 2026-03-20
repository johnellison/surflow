import { z } from 'zod';

export const TideState = z.enum(['rising', 'falling', 'high', 'low']);
export type TideState = z.infer<typeof TideState>;

export const ForecastSource = z.enum(['noaa', 'copernicus', 'open-meteo', 'surfline']);
export type ForecastSource = z.infer<typeof ForecastSource>;

export const ForecastSchema = z.object({
  id: z.string().uuid(),
  spotId: z.string().uuid(),
  timestamp: z.date(),
  source: ForecastSource,

  // Swell
  swellHeight: z.number().nonnegative().describe('Meters'),
  swellPeriod: z.number().nonnegative().describe('Seconds'),
  swellDirection: z.number().min(0).max(360).describe('Degrees'),

  // Wind
  windSpeed: z.number().nonnegative().describe('km/h'),
  windDirection: z.number().min(0).max(360).describe('Degrees'),

  // Tide
  tideHeight: z.number().describe('Meters above mean sea level'),
  tideState: TideState,

  // Temperature
  waterTemp: z.number().describe('Celsius'),
  airTemp: z.number().describe('Celsius'),

  // Rating
  rating: z.number().min(1).max(5).describe('Surf quality 1-5'),

  createdAt: z.date(),
});

export type Forecast = z.infer<typeof ForecastSchema>;

export const ForecastSummarySchema = z.object({
  spotId: z.string().uuid(),
  spotName: z.string(),
  rating: z.number().min(1).max(5),
  swellHeight: z.number(),
  swellPeriod: z.number(),
  swellDirection: z.number(),
  windSpeed: z.number(),
  windDirection: z.number(),
  tideState: TideState,
  summary: z.string().describe('Natural language forecast summary'),
  bestTimeWindow: z.string().nullable().describe('e.g., "Best around 10am mid-tide"'),
  updatedAt: z.date(),
});

export type ForecastSummary = z.infer<typeof ForecastSummarySchema>;
