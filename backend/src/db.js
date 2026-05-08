const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../localcourse.db');
const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ===== 스키마 =====
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    nickname TEXT NOT NULL,
    money INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    seller_id INTEGER NOT NULL,
    province TEXT NOT NULL,
    city TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    price INTEGER NOT NULL DEFAULT 1000,
    tags TEXT,
    places TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (seller_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS purchases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    amount INTEGER NOT NULL,
    purchased_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, course_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (course_id) REFERENCES courses(id)
  );
`);

// ===== 시드 데이터 =====
const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get().c;

if (userCount === 0) {
  console.log('🌱 시드 데이터 생성 중...');

  const insertUser = db.prepare(
    'INSERT INTO users (email, password, nickname, money) VALUES (?, ?, ?, ?)'
  );

  const hash = bcrypt.hashSync('test1234', 10);
  const demoUserId = insertUser.run('demo@local.com', hash, '데모유저', 5000).lastInsertRowid;
  const seller1 = insertUser.run('gangneung@local.com', hash, '강릉현지인', 0).lastInsertRowid;
  const seller2 = insertUser.run('jeju@local.com', hash, '제주토박이', 0).lastInsertRowid;
  const seller3 = insertUser.run('busan@local.com', hash, '부산갈매기', 0).lastInsertRowid;
  const seller4 = insertUser.run('seoul@local.com', hash, '서울러', 0).lastInsertRowid;

  const insertCourse = db.prepare(`
    INSERT INTO courses (seller_id, province, city, title, description, price, tags, places)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const seedCourses = [
    {
      seller_id: seller1,
      province: '강원특별자치도',
      city: '강릉시',
      title: '강릉 감성 당일치기 코스',
      description: '관광지 말고 진짜 강릉 사람들이 가는 곳. 새벽 안목해변 → 명주동 골목 → 현지인 단골 막국수집 → 노을 명소까지.',
      price: 1000,
      tags: JSON.stringify(['#연인과 함께', '#차 없음', '#휴양']),
      places: JSON.stringify([
        { name: '안목해변 끝자락', desc: '관광객 없는 새벽 6시 추천' },
        { name: '명주동 골목', desc: '오래된 적산가옥 골목길' },
        { name: '○○막국수', desc: '동네 사람만 아는 메밀막국수집' },
        { name: '경포대 뒷편 언덕', desc: '노을 보기 가장 좋은 자리' },
      ]),
    },
    {
      seller_id: seller2,
      province: '제주특별자치도',
      city: '제주시',
      title: '관광객 없는 제주 동쪽 코스',
      description: '함덕·월정리 말고 진짜 한적한 동쪽. 차 없이 버스로 가능한 동선.',
      price: 1000,
      tags: JSON.stringify(['#혼자', '#차 없음', '#휴양']),
      places: JSON.stringify([
        { name: '북촌 돌담길', desc: '아무도 없는 어촌 마을' },
        { name: '세화 오일장 (5일)', desc: '제주 할망들 시장' },
        { name: '평대리 무명 카페', desc: '동네 주민이 운영하는 작은 카페' },
      ]),
    },
    {
      seller_id: seller3,
      province: '부산광역시',
      city: '해운대구',
      title: '해운대 빼고 진짜 부산 야경',
      description: '광안리·해운대 말고 부산 사람들이 데이트하는 야경 코스.',
      price: 1000,
      tags: JSON.stringify(['#연인과 함께', '#차 있음', '#야경']),
      places: JSON.stringify([
        { name: '황령산 봉수대', desc: '광안대교를 위에서 보는 뷰' },
        { name: '청사포 다릿돌전망대', desc: '인적 드문 해안 전망대' },
        { name: '동백섬 뒷길', desc: '메인 산책로 말고 뒷길' },
      ]),
    },
    {
      seller_id: seller4,
      province: '서울특별시',
      city: '종로구',
      title: '익선동·서촌 골목 코스',
      description: '인스타 아닌 진짜 옛 골목. 관광객 동선 피하는 법.',
      price: 1000,
      tags: JSON.stringify(['#가족과 함께', '#차 없음', '#맛집']),
      places: JSON.stringify([
        { name: '체부동 잔치집', desc: '서촌 토박이 단골' },
        { name: '익선동 뒷골목', desc: '메인 거리 말고 뒷골목' },
        { name: '통의동 보안여관', desc: '오래된 문화공간' },
      ]),
    },
    {
      seller_id: seller1,
      province: '강원특별자치도',
      city: '속초시',
      title: '속초 액티비티 1박2일',
      description: '서핑 + 등산 + 시장 미식 풀패키지.',
      price: 1000,
      tags: JSON.stringify(['#액티비티', '#차 있음', '#가족과 함께']),
      places: JSON.stringify([
        { name: '설악해변 서핑샵', desc: '초보 강습' },
        { name: '울산바위 코스', desc: '4시간 등산' },
        { name: '속초중앙시장 닭강정', desc: '현지인 추천 가게' },
      ]),
    },
  ];

  for (const c of seedCourses) {
    insertCourse.run(
      c.seller_id, c.province, c.city, c.title, c.description, c.price, c.tags, c.places
    );
  }

  console.log(`✅ 시드 완료: 유저 5명, 코스 ${seedCourses.length}개`);
  console.log('   데모 계정: demo@local.com / test1234 (머니 5,000원 보유)');
}

module.exports = db;
