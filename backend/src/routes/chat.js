const express = require('express');
const db = require('../db');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

// 내 대화 목록 (코스별 상대방 기준)
router.get('/rooms', authRequired, (req, res) => {
  const uid = req.userId;
  const rooms = db.prepare(`
    SELECT
      m.course_id,
      CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END AS other_id,
      u.nickname  AS other_nickname,
      c.title     AS course_title,
      c.province  AS province,
      c.city      AS city,
      (SELECT content    FROM messages
       WHERE course_id = m.course_id
         AND ((sender_id = ? AND receiver_id = other_id) OR (sender_id = other_id AND receiver_id = ?))
       ORDER BY created_at DESC LIMIT 1) AS last_message,
      (SELECT created_at FROM messages
       WHERE course_id = m.course_id
         AND ((sender_id = ? AND receiver_id = other_id) OR (sender_id = other_id AND receiver_id = ?))
       ORDER BY created_at DESC LIMIT 1) AS last_time
    FROM messages m
    JOIN users   u ON u.id = CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END
    JOIN courses c ON c.id = m.course_id
    WHERE m.sender_id = ? OR m.receiver_id = ?
    GROUP BY m.course_id, other_id
    ORDER BY last_time DESC
  `).all(uid, uid, uid, uid, uid, uid, uid, uid);

  res.json({ rooms });
});

// 특정 채팅방 메시지
router.get('/room/:courseId/:otherId', authRequired, (req, res) => {
  const uid = req.userId;
  const { courseId, otherId } = req.params;

  const messages = db.prepare(`
    SELECT m.id, m.sender_id, m.content, m.created_at,
           u.nickname AS sender_nickname
    FROM messages m
    JOIN users u ON u.id = m.sender_id
    WHERE m.course_id = ?
      AND ((m.sender_id = ? AND m.receiver_id = ?)
        OR (m.sender_id = ? AND m.receiver_id = ?))
    ORDER BY m.created_at ASC
  `).all(courseId, uid, otherId, otherId, uid);

  res.json({ messages });
});

// 메시지 전송
router.post('/send', authRequired, (req, res) => {
  const { receiver_id, course_id, content } = req.body;
  if (!receiver_id || !course_id || !content?.trim()) {
    return res.status(400).json({ error: '필수 값 누락' });
  }
  const result = db.prepare(
    'INSERT INTO messages (sender_id, receiver_id, course_id, content) VALUES (?, ?, ?, ?)'
  ).run(req.userId, receiver_id, course_id, content.trim());

  const msg = db.prepare(`
    SELECT m.id, m.sender_id, m.content, m.created_at, u.nickname AS sender_nickname
    FROM messages m JOIN users u ON u.id = m.sender_id WHERE m.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json({ message: msg });
});

module.exports = router;
