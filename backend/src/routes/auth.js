const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { signToken, authRequired } = require('../middleware/auth');

const router = express.Router();

// 회원가입
router.post('/signup', (req, res) => {
  const { email, password, nickname } = req.body || {};
  if (!email || !password || !nickname) {
    return res.status(400).json({ error: '이메일, 비밀번호, 닉네임을 모두 입력해주세요' });
  }

  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (exists) return res.status(409).json({ error: '이미 가입된 이메일입니다' });

  const hash = bcrypt.hashSync(password, 10);
  const result = db
    .prepare('INSERT INTO users (email, password, nickname, money) VALUES (?, ?, ?, 0)')
    .run(email, hash, nickname);

  const token = signToken(result.lastInsertRowid);
  res.json({
    token,
    user: { id: result.lastInsertRowid, email, nickname, money: 0 },
  });
});

// 로그인
router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: '이메일과 비밀번호를 입력해주세요' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다' });
  }

  const token = signToken(user.id);
  res.json({
    token,
    user: { id: user.id, email: user.email, nickname: user.nickname, money: user.money },
  });
});

// 내 정보 (머니 잔액 갱신용)
router.get('/me', authRequired, (req, res) => {
  const user = db
    .prepare('SELECT id, email, nickname, money FROM users WHERE id = ?')
    .get(req.userId);
  if (!user) return res.status(404).json({ error: '유저 없음' });
  res.json({ user });
});

// 머니 충전
router.post('/charge', authRequired, (req, res) => {
  const { amount } = req.body || {};
  const n = parseInt(amount, 10);
  if (!n || n <= 0) return res.status(400).json({ error: '충전 금액 오류' });

  db.prepare('UPDATE users SET money = money + ? WHERE id = ?').run(n, req.userId);
  const user = db
    .prepare('SELECT id, email, nickname, money FROM users WHERE id = ?')
    .get(req.userId);
  res.json({ user });
});

module.exports = router;
