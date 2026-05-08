const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { signToken, authRequired } = require('../middleware/auth');

const router = express.Router();

router.post('/signup', (req, res) => {
  const { email, password, nickname } = req.body || {};
  if (!email || !password || !nickname) {
    return res.status(400).json({ error: '이메일, 비밀번호, 닉네임을 모두 입력해주세요' });
  }

  const exists = db.findUserByEmail(email);
  if (exists) return res.status(409).json({ error: '이미 가입된 이메일입니다' });

  const hash = bcrypt.hashSync(password, 10);
  const user = db.createUser({ email, password: hash, nickname });
  const token = signToken(user.id);

  res.json({ token, user: db.publicUser(user) });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: '이메일과 비밀번호를 입력해주세요' });
  }

  const user = db.findUserByEmail(email);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다' });
  }

  const token = signToken(user.id);
  res.json({ token, user: db.publicUser(user) });
});

router.get('/me', authRequired, (req, res) => {
  const user = db.findUserById(req.userId);
  if (!user) return res.status(404).json({ error: '유저 없음' });
  res.json({ user: db.publicUser(user) });
});

router.post('/charge', authRequired, (req, res) => {
  const { amount } = req.body || {};
  const n = parseInt(amount, 10);
  if (!n || n <= 0) return res.status(400).json({ error: '충전 금액 오류' });

  const user = db.addMoney(req.userId, n);
  if (!user) return res.status(404).json({ error: '유저 없음' });
  res.json({ user: db.publicUser(user) });
});

module.exports = router;
