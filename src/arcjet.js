import arcjet, { detectBot, shield, slidingWindow } from "@arcjet/node";

const arcjetKey = process.env.ARCJET_KEY;
const arcjetMode = process.env.ARCJET_MODE === 'DRY_RUN' ? 'DRY_RUN' : 'LIVE';

export const httpArcjet = arcjetKey ?
    arcjet({
        key: arcjetKey,
        rules : [
            shield({mode: arcjetMode}),
            detectBot({mode: arcjetMode, allow: ['CATEGORY:SEARCH_ENGINE', 'CATEGORY:PREVIEW']}),
            slidingWindow({mode: arcjetMode, interval: '10s', max: 20})
        ]
        
    }) : null;

export const wsArcjet = arcjetKey ?
    arcjet({
        key: arcjetKey,
        rules : [
            shield({mode: arcjetMode}),
            detectBot({mode: arcjetMode, allow: ['CATEGORY:SEARCH_ENGINE', 'CATEGORY:PREVIEW']}),
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