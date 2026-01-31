import { Router } from "express";
import { listMatches, createMatch, updateMatchScore } from "../controllers/matches-controllers.js";

const matchRouter = Router();

matchRouter.get('/', listMatches);
matchRouter.post('/', createMatch);
matchRouter.patch('/:id/score', updateMatchScore);

export default matchRouter;