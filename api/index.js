const express = require('express');
const cors = require('cors');

const app = express();
// Konfigurasi CORS agar bisa diakses dari mana saja (termasuk dari web/aplikasi Android)
app.use(cors({ origin: '*' }));
app.use(express.json());

const activeStudentsMap = new Map();

// Route utama '/'
app.get('/', (req, res) => {
    res.status(200).send('✅ Server Backend Monitoring berjalan dengan normal di Vercel!');
});

// Route ping
app.post('/api/ping', (req, res) => {
    const { studentId } = req.body;
    if (studentId) {
        activeStudentsMap.set(studentId, Date.now());
    }
    res.status(200).json({ success: true });
});

// Route count
app.get('/api/count', (req, res) => {
    const now = Date.now();
    let count = 0;
    
    for (const [id, timestamp] of activeStudentsMap.entries()) {
        if (now - timestamp > 15000) {
            activeStudentsMap.delete(id);
        } else {
            count++;
        }
    }
    
    res.status(200).json({ count });
});

module.exports = app;
