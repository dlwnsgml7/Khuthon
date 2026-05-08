const express = require('express');
const db = require('../db');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

// 코스 리뷰 목록
router.get('/:courseId', (req, res) => {
  const reviews = db.prepare(`
    SELECT r.id, r.rating, r.comment, r.created_at, u.nickname
    FROM reviews r JOIN users u ON u.id = r.user_id
    WHERE r.course_id = ?
    ORDER BY r.created_at DESC
  `).all(req.params.courseId);

  const avg = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  res.json({ reviews, avg, count: reviews.length });
});

// 리뷰 등록 / 수정
router.post('/:courseId', authRequired, (req, res) => {
  const { rating, comment } = req.body;
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: '별점은 1~5 사이로 입력해주세요' });
  }

  // 구매 여부 확인
  const purchased = db.prepare(
    'SELECT id FROM purchases WHERE user_id = ? AND course_id = ?'
  ).get(req.userId, req.params.courseId);
  if (!purchased) return res.status(403).json({ error: '구매한 코스만 평가할 수 있습니다' });

  db.prepare(`
    INSERT INTO reviews (user_id, course_id, rating, comment)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(user_id, course_id) DO UPDATE SET rating = ?, comment = ?
  `).run(req.userId, req.params.courseId, rating, comment || '', rating, comment || '');

  res.json({ ok: true });
});

module.exports = router;
