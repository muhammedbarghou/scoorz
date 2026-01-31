import {WebSocket, WebSocketServer} from 'ws';
import { wsArcjet } from '../arcjet.js';

function sendJson (socket, payload) {
    if (socket.readyState !== WebSocket.OPEN) {
        return;
    }
    socket.send(JSON.stringify(payload));
}

function broadcast (wss,payload) {
    for (const client of wss.clients) {
        if (client.readyState !== WebSocket.OPEN) continue;

        client.send(JSON.stringify(payload));
    }
}

export function createWebSocketServer (server) {
    const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 1024 * 1024 });
    wss.on('connection', async (socket, req) => {
        if (wsArcjet) {
            try {
                const decision = await wsArcjet.protect(req);
                if (decision.isDenied()) {
                    const code = decision.reason.isRateLimit() ? 1013 : 1008;
                    const reason = decision.reason.isRateLimit() ? 'Rate Limit Exceeded' : 'Policy Violation';
                    socket.close(code, reason);
                    return;
                }
            } catch (err) {
                console.error('Arcjet WS protection error:', err);
                socket.close(1011, 'Server Error');
                return;
            }
        }

        socket.isAlive = true;
        socket.on('pong', () => {
            socket.isAlive = true;
        });
        sendJson(socket, {type: 'welcome'});
        socket.on('error', console.error);
    });

    const interval = setInterval(() => {
        wss.clients.forEach((socket) => {
            if (!socket.isAlive) return socket.terminate();
            socket.isAlive = false;
            socket.ping();
        });
    }, 30000);

    wss.on('close', () => {
        clearInterval(interval);
    });

    function broadcastMatchCreated (match) {
        broadcast(wss, {type: 'match_created', data: match});
    }

    return {
        broadcastMatchCreated,
    };
}