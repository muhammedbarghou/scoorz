import { desc, eq } from "drizzle-orm";
import { createMatchSchema, listMatchesQuerySchema, updateScoreSchema, matchIdParamSchema } from "../validation/matches.js";
import { matches } from "../db/schema.js";
import { db } from "../db/db.js";
import { getMatchStatus } from "../utils/match-status.js";

export const listMatches = async (req, res) => {
    const parsed = listMatchesQuerySchema.safeParse(req.query);

    if (!parsed.success) {
        return res.status(400).json({error: "Invalid request query", details: parsed.error.issues});
    }
    const limit = Math.min(parsed.data.limit ?? 10, 100);
    try {
        const data = await db.select().from(matches).limit(limit ?? 10).orderBy(desc(matches.createdAt));
        res.status(200).json(data);
    } catch (e) {
        res.status(500).json({error: "Failed to list matches" , details: e instanceof Error ? e.message : String(e)});
    }
};

export const createMatch = async (req, res) => {
    const parsed = createMatchSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({error: "Invalid request body", details: parsed.error.issues});
    }
    const {startTime, endTime, homeScore, awayScore} = parsed.data;
    try {
        const status = getMatchStatus(startTime, endTime);
        if (!status) {
            return res.status(400).json({error: "Invalid date range for match status calculation"});
        }
        
        const matchData = {
            sport: parsed.data.sport,
            homeTeam: parsed.data.homeTeam,
            awayTeam: parsed.data.awayTeam,
            startTime: new Date(startTime), 
            endTime: new Date(endTime), 
            homeScore: homeScore ?? 0,
            awayScore: awayScore ?? 0,
            status: status
        };
        
        console.log('Attempting to insert match:', matchData);
        
        const [event] = await db.insert(matches).values(matchData).returning();
        
        if (!event) {
            console.error('Insert returned no event');
            return res.status(500).json({error: "Failed to create match - no data returned"});
        }
        
        console.log('Match created successfully:', event);
        
        if (res.app.locals.broadcastMatchCreated) {
            res.app.locals.broadcastMatchCreated(event);
        }
        
        res.status(201).json({data: event});
    } catch (e) {
        console.error('Error creating match:', e);
        res.status(500).json({error: "Failed to create match" , details: e instanceof Error ? e.message : String(e)});
    }
};

export const updateMatchScore = async (req, res) => {
    const idParsed = matchIdParamSchema.safeParse(req.params);
    if (!idParsed.success) {
        return res.status(400).json({error: "Invalid match ID", details: idParsed.error.issues});
    }
    
    const bodyParsed = updateScoreSchema.safeParse(req.body);
    if (!bodyParsed.success) {
        return res.status(400).json({error: "Invalid request body", details: bodyParsed.error.issues});
    }
    
    const { homeScore, awayScore } = bodyParsed.data;
    const { id } = idParsed.data;
    
    try {
        const [updatedMatch] = await db
            .update(matches)
            .set({
                homeScore,
                awayScore,
            })
            .where(eq(matches.id, id))
            .returning();
        
        if (!updatedMatch) {
            return res.status(404).json({error: "Match not found"});
        }
        
        res.status(200).json({data: updatedMatch});
    } catch (e) {
        res.status(500).json({error: "Failed to update match score", details: e instanceof Error ? e.message : String(e)});
    }
};
