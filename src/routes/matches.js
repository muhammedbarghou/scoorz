import { Router } from "express";
import { desc } from "drizzle-orm";
import { createMatchSchema, listMatchesQuerySchema  } from "../validation/matches.js";
import { matches } from "../db/schema.js";
import { db } from "../db/db.js";
import { getMatchStatus } from "../utils/match-status.js";

const matchRouter = Router();

matchRouter.get('/', async (req, res) => {
    const parsed = listMatchesQuerySchema.safeParse(req.query);

    if (!parsed.success) {
        return res.status(400).json({error: "Invalid request query", details: JSON.stringify(parsed.error.issues)});
    }
    const limit = Math.min(parsed.data.limit ?? 10, 100);
    try {
        const data = await db.select().from(matches).limit(limit ?? 10).orderBy(desc(matches.createdAt));
        res.status(200).json(data);
    } catch (e) {
        res.status(500).json({error: "Failed to list matches" , details: e instanceof Error ? e.message : String(e)});
    }
});

matchRouter.post('/', async (req, res) => {
    const parsed = createMatchSchema.safeParse(req.body);
    const {data: {startTime, endTime,homeScore, awayScore}} = parsed;
    if (!parsed.success) {
        return res.status(400).json({error: "Invalid request body", details: JSON.stringify(parsed.error.issues)});
    }
    try {
        const [event] = await db.insert(matches).values({
            ...parsed.data,
            startTime: new Date(startTime), 
            endTime: new Date(endTime), 
            homeScore: homeScore ?? 0,
            awayScore: awayScore ?? 0,
            status: getMatchStatus(startTime, endTime)}).returning();
        res.status(201).json({data: event});
    } catch (e) {
        res.status(500).json({error: "Failed to create match" , details: e instanceof Error ? e.message : String(e)});
    }
});

export default matchRouter;