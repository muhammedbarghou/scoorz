import arcjet, { detectBot, shield, slidingWindow } from "@arcjet/node";

const arcjetKey = process.env.ARCJET_KEY;
const arcjetMode = process.env.ARCJET_MODE === 'DRY_RUN' ? 'DRY_RUN' : 'LIVE';

if (!arcjetKey) {
    throw new Error('ARCJET_KEY is not defined');
}

export const httpArcjet = arcjetKey ?
    arcjet({
        Key: arcjetKey,
        rules : [
            shield({mode: arcjetMode}),
            detectBot({mode: arcjetMode, allow: ['CATAGORY:SEARCH_ENGINE', 'CATAGORY:PREVIEW']}),
            slidingWindow({mode: arcjetMode, interval: '10s', max: 20})
        ]
        
    }) : null;

export const wsArcjet = arcjetKey ?
    arcjet({
        Key: arcjetKey,
        rules : [
            shield({mode: arcjetMode}),
            detectBot({mode: arcjetMode, allow: ['CATAGORY:SEARCH_ENGINE', 'CATAGORY:PREVIEW']}),
            slidingWindow({mode: arcjetMode, interval: '2s', max: 5})
        ]
        
    }) : null;

export function securityMiddleware() {
    return async (req, res, next) => {
        if (httpArcjet) {
            try {
                const decision = await httpArcjet.protect(req);
                if (decision.isDenied()) {
                    return res.status(429).json({error: 'Too many Requests'});
                }
                next();
            } catch (err) {
                console.error('Arcjet protection error:', err);
                return res.status(403).json({error: 'Forbidden'});
            }
        } else {
            next();
        }
    };
}