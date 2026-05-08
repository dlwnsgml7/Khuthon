const express = require('express');
const db = require('../db');
const { authRequired, authOptional } = require('../middleware/auth');

const router = express.Router();

// 코스 등록
router.post('/', authRequired, (req, res) => {
  const { province, city, title, description, price, tags, places, image_url } = req.body;
  if (!province || !city || !title) {
    return res.status(400).json({ error: '지역, 도시, 제목은 필수입니다' });
  }
  const result = db.prepare(`
    INSERT INTO courses (seller_id, province, city, title, description, price, tags, places, image_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    req.userId, province, city, title, description || '',
    parseInt(price) || 1000,
    JSON.stringify(tags || []),
    JSON.stringify(places || []),
    image_url || null,
  );
  res.status(201).json({ id: result.lastInsertRowid });
});

// 도/시별 코스 목록 (별점·구매수·구매여부 포함)
router.get('/', authOptional, (req, res) => {
  const { province, city } = req.query;
  const where = [];
  const params = [];
  if (province) { where.push('c.province = ?'); params.push(province); }
  if (city)     { where.push('c.city = ?');     params.push(city); }

  const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

  const rows = db.prepare(`
    SELECT
      c.id, c.province, c.city, c.title, c.price, c.tags, c.image_url,
      u.nickname AS seller,
      COUNT(DISTINCT p.id)  AS purchase_count,
      ROUND(AVG(r.rating), 1) AS avg_rating,
      COUNT(DISTINCT r.id)  AS review_count
    FROM courses c
    JOIN users u ON c.seller_id = u.id
    LEFT JOIN purchases p ON p.course_id = c.id
    LEFT JOIN reviews   r ON r.course_id = c.id
    ${whereClause}
    GROUP BY c.id
    ORDER BY COALESCE(ROUND(AVG(r.rating), 1), 0) DESC,
             COUNT(DISTINCT p.id) DESC,
             c.created_at DESC
  `).all(...params);

  // 로그인 유저의 구매 여부
  const purchasedSet = new Set();
  if (req.userId) {
    db.prepare('SELECT course_id FROM purchases WHERE user_id = ?')
      .all(req.userId)
      .forEach(p => purchasedSet.add(p.course_id));
  }

  const list = rows.map(r => ({
    ...r,
    tags:           JSON.parse(r.tags || '[]'),
    purchase_count: r.purchase_count || 0,
    avg_rating:     r.avg_rating || null,
    review_count:   r.review_count || 0,
    purchased:      purchasedSet.has(r.id),
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
    seller_id: course.seller_id,
    tags: JSON.parse(course.tags || '[]'),
    image_url: course.image_url || null,
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
