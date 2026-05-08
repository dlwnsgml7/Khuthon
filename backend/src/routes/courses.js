const express = require('express');
const db = require('../db');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

// 도/시별 코스 목록 (잠긴 상태 - 제목/태그/가격만 노출)
router.get('/', (req, res) => {
  const { province, city } = req.query;
  let query = `
    SELECT c.id, c.province, c.city, c.title, c.price, c.tags, u.nickname as seller
    FROM courses c JOIN users u ON c.seller_id = u.id
  `;
  const params = [];
  const where = [];
  if (province) { where.push('c.province = ?'); params.push(province); }
  if (city)     { where.push('c.city = ?');     params.push(city); }
  if (where.length) query += ' WHERE ' + where.join(' AND ');
  query += ' ORDER BY c.created_at DESC';

  const rows = db.prepare(query).all(...params);
  const list = rows.map(r => ({
    ...r,
    tags: JSON.parse(r.tags || '[]'),
  }));
  res.json({ courses: list });
});

// 도별 코스 개수 (지도에 카운트 표시용)
router.get('/counts/by-province', (req, res) => {
  const rows = db
    .prepare('SELECT province, COUNT(*) as count FROM courses GROUP BY province')
    .all();
  res.json({ counts: rows });
});

// 시별 코스 개수
router.get('/counts/by-city', (req, res) => {
  const { province } = req.query;
  const rows = db
    .prepare('SELECT city, COUNT(*) as count FROM courses WHERE province = ? GROUP BY city')
    .all(province || '');
  res.json({ counts: rows });
});

// 코스 상세 (구매한 사람만 동선/장소 공개)
router.get('/:id', authRequired, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const course = db
    .prepare(`
      SELECT c.*, u.nickname as seller
      FROM courses c JOIN users u ON c.seller_id = u.id
      WHERE c.id = ?
    `)
    .get(id);
  if (!course) return res.status(404).json({ error: '코스 없음' });

  const purchased = db
    .prepare('SELECT id FROM purchases WHERE user_id = ? AND course_id = ?')
    .get(req.userId, id);

  const base = {
    id: course.id,
    title: course.title,
    province: course.province,
    city: course.city,
    price: course.price,
    seller: course.seller,
    tags: JSON.parse(course.tags || '[]'),
    unlocked: !!purchased,
  };

  if (purchased) {
    base.description = course.description;
    base.places = JSON.parse(course.places || '[]');
  }

  res.json({ course: base });
});

// 코스 결제 (머니 차감 + 구매 기록)
router.post('/:id/purchase', authRequired, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(id);
  if (!course) return res.status(404).json({ error: '코스 없음' });

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);

  const already = db
    .prepare('SELECT id FROM purchases WHERE user_id = ? AND course_id = ?')
    .get(req.userId, id);
  if (already) return res.status(409).json({ error: '이미 구매한 코스입니다' });

  if (user.money < course.price) {
    return res.status(402).json({
      error: '머니가 부족합니다',
      required: course.price,
      current: user.money,
    });
  }

  // 트랜잭션: 머니 차감 + 구매 기록
  const tx = db.transaction(() => {
    db.prepare('UPDATE users SET money = money - ? WHERE id = ?').run(course.price, req.userId);
    db.prepare('INSERT INTO purchases (user_id, course_id, amount) VALUES (?, ?, ?)')
      .run(req.userId, id, course.price);
  });
  tx();

  const updated = db
    .prepare('SELECT id, email, nickname, money FROM users WHERE id = ?')
    .get(req.userId);

  res.json({
    success: true,
    user: updated,
    unlocked: {
      description: course.description,
      places: JSON.parse(course.places || '[]'),
    },
  });
});

module.exports = router;
