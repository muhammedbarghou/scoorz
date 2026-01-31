import { z } from "zod";

// Match status constants
export const MATCH_STATUS = {
  SCHEDULED: "scheduled",
  LIVE: "live",
  FINISHED: "finished",
};

// Schema for query parameters when listing matches
export const listMatchesQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional(),
});

// Schema for match ID parameter
export const matchIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// Schema for creating a match
export const createMatchSchema = z
  .object({
    sport: z.string().min(1, "Sport must be a non-empty string"),
    homeTeam: z.string().min(1, "Home team must be a non-empty string"),
    awayTeam: z.string().min(1, "Away team must be a non-empty string"),
    startTime: z.string().min(1, "Start time must be a non-empty string"),
    endTime: z.string().min(1, "End time must be a non-empty string"),
    homeScore: z.coerce.number().int().nonnegative().optional(),
    awayScore: z.coerce.number().int().nonnegative().optional(),
  })
  .refine(
    (data) => {
      try {
        new Date(data.startTime).toISOString();
        return !isNaN(new Date(data.startTime).getTime());
      } catch {
        return false;
      }
    },
    {
      message: "Start time must be a valid ISO date string",
      path: ["startTime"],
    }
  )
  .refine(
    (data) => {
      try {
        new Date(data.endTime).toISOString();
        return !isNaN(new Date(data.endTime).getTime());
      } catch {
        return false;
      }
    },
    {
      message: "End time must be a valid ISO date string",
      path: ["endTime"],
    }
  )
  .superRefine((data, ctx) => {
    const startTime = new Date(data.startTime);
    const endTime = new Date(data.endTime);

    if (endTime <= startTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "End time must be chronologically after start time",
        path: ["endTime"],
      });
    }
  });

// Schema for updating match scores
export const updateScoreSchema = z.object({
  homeScore: z.coerce.number().int().nonnegative(),
  awayScore: z.coerce.number().int().nonnegative(),
});
