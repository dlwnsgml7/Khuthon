const express = require('express');
const db = require('../db');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

router.get('/', (req, res) => {
  const { province, city } = req.query;
  res.json({ courses: db.listCourses({ province, city }) });
});

router.get('/counts/by-province', (_req, res) => {
  res.json({ counts: db.countByProvince() });
});

router.get('/counts/by-city', (req, res) => {
  const { province } = req.query;
  res.json({ counts: db.countByCity(province || '') });
});

router.get('/:id', authRequired, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const course = db.findCourseById(id);
  if (!course) return res.status(404).json({ error: '코스 없음' });

  const purchased = db.findPurchase(req.userId, id);
  const base = {
    id: course.id,
    title: course.title,
    province: course.province,
    city: course.city,
    price: course.price,
    seller: course.seller,
    tags: course.tags,
    unlocked: !!purchased,
  };

  if (purchased) {
    base.description = course.description;
    base.places = course.places;
  }

  res.json({ course: base });
});

router.post('/:id/purchase', authRequired, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const result = db.purchaseCourse(req.userId, id);

  if (result.error === 'NOT_FOUND') return res.status(404).json({ error: '코스 없음' });
  if (result.error === 'ALREADY_PURCHASED') {
    return res.status(409).json({ error: '이미 구매한 코스입니다' });
  }
  if (result.error === 'INSUFFICIENT_FUNDS') {
    return res.status(402).json({
      error: '머니가 부족합니다',
      required: result.required,
      current: result.current,
    });
  }

  res.json({
    success: true,
    user: db.publicUser(result.user),
    unlocked: {
      description: result.course.description,
      places: result.course.places,
    },
  });
});

module.exports = router;
