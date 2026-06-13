const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Dalam lingkungan serverless Vercel, memory akan hilang ketika instance "tidur" (cold start).
// Namun karena aplikasi ini memakai metode Long/Short Polling dimana siswa akan mengirim ping
// setiap 5 detik, Map in-memory ini akan terbentuk kembali dengan cepat saat instance nyala.
// Untuk skala besar di masa depan, ganti Map ini dengan `Vercel KV` (Redis).
const activeStudentsMap = new Map();

// Rute root untuk memastikan server berjalan dengan baik di browser (menghindari error 404 NOT_FOUND)
app.get('/', (req, res) => {
    res.status(200).send('✅ Server Backend Monitoring berjalan dengan normal di Vercel!');
});

app.post('/api/ping', (req, res) => {
    const { studentId } = req.body;
    if (studentId) {
        // Simpan waktu terakhir siswa melakukan ping
        activeStudentsMap.set(studentId, Date.now());
    }
    res.status(200).json({ success: true });
});

app.get('/api/count', (req, res) => {
    const now = Date.now();
    let count = 0;
    
    // Hapus siswa yang tidak mengirim ping selama 15 detik terakhir 
    // (tanda aplikasi / internet mereka mati)
    for (const [id, timestamp] of activeStudentsMap.entries()) {
        if (now - timestamp > 15000) {
            activeStudentsMap.delete(id);
        } else {
            count++;
        }
    }
    
    res.status(200).json({ count });
});

// Jalankan server lokal (Vercel otomatis mengexport app ini tanpa listen)
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Polling Server running on port ${PORT}`));
}

module.exports = app;
