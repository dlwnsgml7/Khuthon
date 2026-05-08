require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes   = require('./routes/auth');
const courseRoutes = require('./routes/courses');
const chatRoutes   = require('./routes/chat');
const reviewRoutes = require('./routes/reviews');

// DB 초기화 (시드 포함)
require('./db');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({ name: 'LocalCourse API', status: 'ok' });
});

app.use('/auth', authRoutes);
app.use('/courses', courseRoutes);
app.use('/chat', chatRoutes);
app.use('/reviews', reviewRoutes);

// 에러 핸들러
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: '서버 오류' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 LocalCourse API on http://localhost:${PORT}`);
});
