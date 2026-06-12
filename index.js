const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let activeStudents = 0;
let admins = new Set();

wss.on('connection', (ws) => {
    console.log('Client terhubung');

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);

            if (data.type === 'register_admin') {
                admins.add(ws);
                console.log('Operator Dashboard terhubung');
                ws.send(JSON.stringify({ type: 'student_count_update', count: activeStudents }));
            }

            if (data.type === 'register_student') {
                activeStudents++;
                ws.isStudent = true;
                console.log(`Siswa masuk. Total siswa aktif: ${activeStudents}`);
                broadcastToAdmins({ type: 'student_count_update', count: activeStudents });
            }
        } catch (e) {
            console.error('Invalid message format', e);
        }
    });

    ws.on('close', () => {
        if (admins.has(ws)) {
            admins.delete(ws);
            console.log('Operator Dashboard terputus');
        }

        if (ws.isStudent) {
            activeStudents = Math.max(0, activeStudents - 1);
            console.log(`Siswa keluar. Total siswa aktif: ${activeStudents}`);
            broadcastToAdmins({ type: 'student_count_update', count: activeStudents });
        }
    });
});

function broadcastToAdmins(message) {
    const msgString = JSON.stringify(message);
    admins.forEach(admin => {
        if (admin.readyState === WebSocket.OPEN) {
            admin.send(msgString);
        }
    });
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Monitoring Signaling Server (Student Counter) berjalan di port ${PORT}`);
});
