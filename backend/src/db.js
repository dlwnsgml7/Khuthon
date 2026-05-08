const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../localcourse.db');
const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ── 스키마 ────────────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER NOT NULL,
    receiver_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (receiver_id) REFERENCES users(id),
    FOREIGN KEY (course_id) REFERENCES courses(id)
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    rating INTEGER NOT NULL,
    comment TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, course_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (course_id) REFERENCES courses(id)
  );

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
    image_url TEXT,
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

// ── 기존 DB 컬럼 마이그레이션 (테이블 생성 후 실행) ─────────────────────────
const userCols = db.prepare("PRAGMA table_info(users)").all().map(c => c.name);
if (!userCols.includes('verified_region')) {
  db.exec('ALTER TABLE users ADD COLUMN verified_region TEXT');
}
const courseCols = db.prepare("PRAGMA table_info(courses)").all().map(c => c.name);
if (!courseCols.includes('image_url')) {
  db.exec('ALTER TABLE courses ADD COLUMN image_url TEXT');
}

// ── 시드 데이터 ───────────────────────────────────────────────────────────────
const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get().c;

if (userCount === 0) {
  console.log('🌱 시드 데이터 생성 중...');
  const hash = bcrypt.hashSync('test1234', 10);

  // ── 판매자 계정 ──
  const insertUser = db.prepare(
    'INSERT INTO users (email, password, nickname, money, verified_region) VALUES (?, ?, ?, ?, ?)'
  );
  const seller1 = insertUser.run('gangneung@local.com', hash, '강릉토박이', 0, '강원특별자치도').lastInsertRowid;
  const seller2 = insertUser.run('jeju@local.com',      hash, '제주살이8년', 0, '제주특별자치도').lastInsertRowid;
  const seller3 = insertUser.run('busan@local.com',     hash, '부산갈매기', 0, '부산광역시').lastInsertRowid;
  const seller4 = insertUser.run('seoul@local.com',     hash, '서울러25년', 0, '서울특별시').lastInsertRowid;
  const seller5 = insertUser.run('yangyang@local.com',  hash, '양양서퍼', 0, '강원특별자치도').lastInsertRowid;
  const seller6 = insertUser.run('gyeongju@local.com',  hash, '경주사람', 0, '경상북도').lastInsertRowid;
  const seller7 = insertUser.run('jeonju@local.com',    hash, '전주전주', 0, '전북특별자치도').lastInsertRowid;
  const seller8 = insertUser.run('yeosu@local.com',     hash, '여수낭만', 0, '전라남도').lastInsertRowid;

  // ── 데모 계정 (머니 보유) ──
  const demoId = db.prepare(
    'INSERT INTO users (email, password, nickname, money) VALUES (?, ?, ?, ?)'
  ).run('demo@local.com', hash, '데모유저', 10000).lastInsertRowid;

  // ── 구매자 더미 계정 115개 ──
  const buyerIds = [];
  for (let i = 1; i <= 115; i++) {
    const id = db.prepare(
      'INSERT INTO users (email, password, nickname, money) VALUES (?, ?, ?, ?)'
    ).run(`buyer${i}@local.com`, hash, `여행자${i}`, 0).lastInsertRowid;
    buyerIds.push(id);
  }

  // ── 코스 등록 ──
  const insertCourse = db.prepare(`
    INSERT INTO courses (seller_id, province, city, title, description, price, tags, places, image_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const courses = [
    // ─ 기존 코스 (정성스럽게 재작성) ─────────────────────────────────────────
    {
      seller_id: seller1,
      province: '강원특별자치도', city: '강릉시',
      title: '강릉 로컬이 다니는 진짜 당일 코스',
      description: '안목커피거리보다 맛있는 골목 로스터리, 관광객 없는 명주동 적산가옥 골목, 현지인 단골 메밀막국수집, 경포호 북쪽 숨은 산책로. 강릉 20년 산 사람만 아는 동선.',
      price: 1500,
      tags: JSON.stringify(['#연인과 함께', '#차 없음', '#휴양', '#맛집']),
      places: JSON.stringify([
        { name: '안목 뒷골목 로스터리 카페', desc: '이름 없는 골목 안 소규모 로스터리. 커피 한 잔에 한 시간 앉아도 눈치 없음' },
        { name: '명주동 적산가옥 골목', desc: '관광 지도에 없는 구불구불한 구 일본식 가옥 거리, 이른 아침 추천' },
        { name: '○○메밀막국수', desc: '경포 주민 30년 단골집. 메뉴는 막국수 단 하나, 셀프 동치미 무한 리필' },
        { name: '경포호 북쪽 갈대밭 산책로', desc: '관광코스 정반대편. 저물 무렵 물 위로 붉게 반사되는 경포호 뷰' },
      ]),
    },
    {
      seller_id: seller2,
      province: '제주특별자치도', city: '제주시',
      title: '동쪽 제주 반나절 — 버스로 완주 가능한 진짜 한적 코스',
      description: '함덕·월정리 인파 피해서 북촌·세화·오조리 어촌 마을 투어. 제주 할망들이 모이는 세화오일장(5·10일 열림), 관광지 아닌 동네 식당에서 고등어조림 한 상.',
      price: 1200,
      tags: JSON.stringify(['#혼자', '#차 없음', '#휴양']),
      places: JSON.stringify([
        { name: '북촌 돌담길 어촌 마을', desc: '주민 외 방문객 거의 없는 조용한 어촌. 돌담 사이 고양이들이 반겨줌' },
        { name: '세화오일장', desc: '5일·10일·15일... 5의 배수 날에 열리는 재래시장. 제주 할망들의 실제 장터' },
        { name: '오조리 무명 카페', desc: '동네 주민이 운영하는 작은 카페. 창밖으로 성산일출봉이 보임' },
      ]),
    },
    {
      seller_id: seller3,
      province: '부산광역시', city: '해운대구',
      title: '해운대 빼고 가는 부산 야경 데이트 코스',
      description: '황령산 봉수대 야경은 광안대교를 위에서 내려다보는 뷰로 관광지 뷰와 차원이 다름. 청사포 다릿돌전망대 → 동백섬 뒷길로 마무리하는 2시간 데이트 코스.',
      price: 1000,
      tags: JSON.stringify(['#연인과 함께', '#차 있음', '#야경']),
      places: JSON.stringify([
        { name: '황령산 봉수대', desc: '부산 전체가 발 아래. 광안대교 야경을 위에서 보는 건 이 뷰포인트뿐' },
        { name: '청사포 다릿돌전망대', desc: '인적 드문 절벽 위 전망대. 파도 소리 들으며 바닷바람 맞기' },
        { name: '동백섬 뒷길 산책로', desc: '메인 산책로 아닌 바닷가 쪽 뒷길. 조용하고 불빛 반사가 예쁨' },
      ]),
    },
    {
      seller_id: seller4,
      province: '서울특별시', city: '종로구',
      title: '익선동·체부동 골목 — 관광 동선 완전히 피하는 법',
      description: '익선동 메인에서 골목 한 칸만 들어가면 관광객 없음. 체부동 구 잔치집, 통의동 보안여관 문화공간, 서촌 뒷골목 노포 빵집. 현지 주민 데이트 코스 그대로.',
      price: 1200,
      tags: JSON.stringify(['#연인과 함께', '#차 없음', '#맛집']),
      places: JSON.stringify([
        { name: '익선동 뒷골목 (경운동 방면)', desc: '메인 거리 대신 경운동 쪽 한 블록 안. 줄 없는 조용한 카페들' },
        { name: '체부동 잔치집', desc: '서촌 주민들의 50년 단골. 점심 한 정식 메뉴만, 12시 전에 가야 자리 있음' },
        { name: '통의동 보안여관', desc: '1930년대 여관을 개조한 독립 문화 공간. 전시·책방·카페 복합' },
        { name: '서촌 뒷골목 노포 빵집', desc: '간판도 없는 작은 빵집. 단팥빵·크림빵이 전부, 오후 2시면 품절' },
      ]),
    },
    {
      seller_id: seller1,
      province: '강원특별자치도', city: '속초시',
      title: '속초 1박2일 — 서핑·설악·시장 미식 완전 패키지',
      description: '1일차: 설악해변 초보 서핑 강습 → 중앙시장 닭강정·아바이순대 저녁. 2일차: 새벽 3시 울산바위 등반 → 하산 후 꽃게 골목 해장. 예약 팁과 현지 숙소 추천 포함.',
      price: 2000,
      tags: JSON.stringify(['#액티비티', '#차 있음', '#가족과 함께']),
      places: JSON.stringify([
        { name: '설악해변 서핑샵', desc: '관광용 아닌 실제 서퍼들이 강습받는 곳. 초보 2시간이면 기립 가능' },
        { name: '속초중앙시장 닭강정', desc: '원조 논쟁은 있지만 이 집이 제일 바삭. 포장해서 근처 해변에서 먹기' },
        { name: '울산바위 코스', desc: '새벽 3시 출발하면 일출 맞춰 정상 도착. 관광객 없는 울산바위 독점' },
        { name: '아바이마을 순대국', desc: '갯배 타고 건너가면 있는 오래된 함경도식 순대국집. 진짜 맛' },
        { name: '꽃게 골목', desc: '수산시장 옆 지역민 전용 꽃게무침 골목. 간판 없는 식당들 줄 서는 곳' },
      ]),
    },

    // ─ 신규 코스 10개 ──────────────────────────────────────────────────────────
    {
      seller_id: seller5,
      province: '강원특별자치도', city: '양양군',
      title: '양양 서퍼 로컬 코스 — 서피비치 말고 진짜 포인트',
      description: '인스타 핫플 서피비치 대신 로컬 서퍼들이 매일 체크하는 죽도해변·인구해변 파도 포인트. 서핑 끝나고 가는 현지인 해장국집, 일몰이 가장 예쁜 전망 카페까지. 서퍼가 직접 짠 동선.',
      price: 1800,
      tags: JSON.stringify(['#연인과 함께', '#액티비티', '#차 있음']),
      places: JSON.stringify([
        { name: '죽도해변 로컬 포인트', desc: '관광객 거의 없음. 파도 컨디션은 이 해변이 서피비치보다 나은 날이 많음' },
        { name: '인구해변 새벽 서핑', desc: '이른 아침 6시 전이 제일 좋음. 파도 혼자 독점 가능' },
        { name: '김씨네 해장국', desc: '서퍼들의 아침 식당. 간판 없음, 오전 7시부터 11시까지만 영업' },
        { name: '죽도 일몰 전망 카페', desc: '서핑 끝내고 샤워 후 일몰 맞추면 딱. 서퍼들 사이 알음알음 카페' },
      ]),
    },
    {
      seller_id: seller5,
      province: '강원특별자치도', city: '양양군',
      title: '양양 낙산사 새벽 일출 & 해변 조용 코스',
      description: '새벽 4시 30분 낙산사 입장 → 의상대 해돋이 → 낙산해변 아침 바닷바람 산책 → 동네 오래된 쌀국수집 아침 식사. 여름 성수기라도 6시 전이면 관광객 없이 혼자다.',
      price: 800,
      tags: JSON.stringify(['#혼자', '#휴양', '#차 없음']),
      places: JSON.stringify([
        { name: '낙산사 새벽 입장', desc: '새벽 4시 반부터 개방. 입장료 있지만 이 시간대엔 관리인 없을 때도 있음' },
        { name: '의상대 일출 뷰포인트', desc: '동해 일출 명소 중 가장 드라마틱한 뷰. 6시면 삼각대 줄 서기 시작' },
        { name: '낙산해변 이른 산책로', desc: '해 뜨고 나서 한 시간 산책. 여름에도 아침 해변은 서늘하고 조용함' },
        { name: '38년 된 동네 쌀국수집', desc: '새벽부터 문 여는 로컬 식당. 해장 겸 아침식사로 현지인들이 찾음' },
      ]),
    },
    {
      seller_id: seller1,
      province: '강원특별자치도', city: '강릉시',
      title: '강릉 로스터리 카페 골목 투어 — 바리스타가 직접 안내',
      description: '안목관광지 아닌, 강릉 로컬 바리스타들이 운영하는 소규모 로스터리 5곳. 각 카페마다 직접 볶은 원두가 다름. 원두 사고 싶어지는 커피 맛. 하루 종일 커피만 마시는 코스.',
      price: 1000,
      tags: JSON.stringify(['#연인과 함께', '#차 없음', '#맛집']),
      places: JSON.stringify([
        { name: '제빵소 겸 로스터리 (교동)', desc: '강릉 바리스타들이 가장 인정하는 집. 원두 소량 판매도 함' },
        { name: '옥상 로스터리 카페', desc: '3층 건물 옥상에 숨어 있음. 내려다보이는 주택가 뷰가 좋음' },
        { name: '골목 안 에스프레소 바', desc: '바 자리 4개가 전부. 에스프레소 한 잔씩만 파는 미니멀 카페' },
        { name: '저수지 옆 로스터리', desc: '강릉 외곽 저수지 바로 옆. 차 타고 15분이지만 가볼 만함' },
      ]),
    },
    {
      seller_id: seller1,
      province: '강원특별자치도', city: '속초시',
      title: '속초 아바이마을 & 꽃게 골목 — 진짜 속초 로컬 미식',
      description: '영화 속 아바이마을 갯배 → 아바이순대 원조집 → 아무도 모르는 꽃게무침 골목. 오전 일찍 오면 어르신들 장 보는 풍경과 새벽 경매까지 구경할 수 있음.',
      price: 1200,
      tags: JSON.stringify(['#가족과 함께', '#맛집', '#차 없음']),
      places: JSON.stringify([
        { name: '아바이마을 갯배', desc: '줄 당겨서 건너는 갯배. 편도 500원. 관광지인데 실제 주민들도 매일 이용' },
        { name: '아바이순대 원조집', desc: '아바이마을 안에서도 50년 가장 오래된 집. 순대국밥 9,000원' },
        { name: '꽃게무침 골목', desc: '수산시장 북쪽 골목. 간판 없는 식당 3곳, 꽃게무침이 메인. 현지인 줄서기' },
        { name: '속초등대 산책로', desc: '관광지도에 잘 안 나오는 등대 아래 바닷가 산책로. 일몰 시간 추천' },
      ]),
    },
    {
      seller_id: seller6,
      province: '경상북도', city: '경주시',
      title: '황리단길 진짜 맛집 코스 — 줄 없이 먹는 경주 로컬',
      description: '황리단길 메인 줄서기 거부. 한 블록 안쪽 현지인 국밥집, 관광객 모르는 원조 경주빵, 골목 막걸리 바. 자전거 빌려서 보문호 한 바퀴 루트도 포함.',
      price: 1500,
      tags: JSON.stringify(['#연인과 함께', '#차 없음', '#맛집']),
      places: JSON.stringify([
        { name: '황리단길 뒷골목 국밥집', desc: '메인에서 한 블록. 관광객 없고 주민들만 앉아 있는 아침 국밥집' },
        { name: '원조 경주빵 (황남동 본점)', desc: '황남빵 관광용 체인점 말고, 황남동 골목 원조 할머니 가게' },
        { name: '보문호 자전거 산책로', desc: '대여소에서 자전거 빌려서 호수 한 바퀴. 한 시간 코스' },
        { name: '골목 막걸리 바', desc: '저녁 5시부터 문 여는 작은 막걸리 바. 경주 쌀막걸리와 파전' },
        { name: '동궁원 야경 (무료 구역)', desc: '유료 구역 밖에서 보는 동궁과 월지 야경도 꽤 볼만함' },
      ]),
    },
    {
      seller_id: seller7,
      province: '전북특별자치도', city: '전주시',
      title: '한옥마을 안 가는 전주 로컬 코스',
      description: '한옥마을에서 5분만 걸어도 관광객 없음. 삼천동 물닭갈비 골목, 서신동 현지인 맛집 거리, 서학예술마을 그래피티 산책. 전주 시민이 실제로 다니는 동선.',
      price: 1000,
      tags: JSON.stringify(['#혼자', '#맛집', '#차 없음']),
      places: JSON.stringify([
        { name: '삼천동 물닭갈비 골목', desc: '전주 시민들이 특별한 날 가는 물닭갈비 거리. 관광지 아닌 동네 맛집' },
        { name: '서신동 현지인 카페 거리', desc: '전주 MZ세대들의 실제 카페 거리. 인스타엔 거의 안 나옴' },
        { name: '서학예술마을', desc: '담벼락 그래피티 마을. 한옥마을 10분 거리인데 아무도 안 옴' },
        { name: '남부시장 야시장 (금·토)', desc: '한옥마을 야시장보다 훨씬 저렴하고 현지인 음식 더 많음' },
      ]),
    },
    {
      seller_id: seller8,
      province: '전라남도', city: '여수시',
      title: '여수 돌산도 로컬 해산물 & 낙조 코스',
      description: '관광 포장마차 대신, 돌산도 어판장 앞 현지 식당. 여자만 낙조는 여수 낙조대보다 한적하고 더 예쁨. 돌산공원 야경으로 마무리하는 데이트 코스.',
      price: 1500,
      tags: JSON.stringify(['#연인과 함께', '#맛집', '#야경']),
      places: JSON.stringify([
        { name: '돌산 어판장 앞 횟집', desc: '관광지 포장마차 2배 가격 주고 먹지 말 것. 이 집이 양도 많고 신선함' },
        { name: '여자만 낙조 포인트', desc: '여수 낙조대는 관광객 가득. 여자만 쪽 갯벌 도로에서 보는 낙조가 더 드라마틱' },
        { name: '돌산공원 야경 포인트', desc: '돌산대교와 여수 시내 동시에 보이는 뷰포인트. 주민들의 저녁 산책 코스' },
        { name: '돌산 로컬 카페', desc: '돌산도 안에 있는 동네 카페. 창문 너머로 바다 보이고 조용함' },
      ]),
    },
    {
      seller_id: seller3,
      province: '부산광역시', city: '남구',
      title: '이바구길 & 망양로 — 부산 뒷골목 히스토리 코스',
      description: '부산역 도보 10분 시작. 이바구길 168계단 모노레일 → 망양로 뒷골목 할매 국밥 → 흰여울문화마을 일몰. 부산 원도심을 걸어서 체험하는 반나절 코스.',
      price: 1000,
      tags: JSON.stringify(['#연인과 함께', '#차 없음', '#야경']),
      places: JSON.stringify([
        { name: '이바구길 168계단 모노레일', desc: '무료 탑승. 위에서 내려다보는 부산항 뷰. 오르막 걱정 없이 이동' },
        { name: '망양로 할매 국밥골목', desc: '관광지 아닌 진짜 동네. 아침부터 영업하는 할머니들의 국밥집' },
        { name: '흰여울문화마을', desc: '절벽 위 골목. 영화 촬영지로 유명하지만 낮에 오면 한산함' },
        { name: '영도 등대 일몰 포인트', desc: '영도 끝자락 등대. 부산항으로 들어오는 배들 보며 일몰 감상' },
      ]),
    },
    {
      seller_id: seller4,
      province: '서울특별시', city: '마포구',
      title: '연남동·합정 로컬 골목 투어 — 뜨기 전 마지막 핫플',
      description: '경의선숲길 카페 줄서기 대신 한 블록 뒤 비건 브런치 → 합정동 오래된 독립서점 → 당인리책발전소 → 망원시장 현지인 먹거리 투어. 서울 살면서 모르면 손해인 코스.',
      price: 1200,
      tags: JSON.stringify(['#연인과 함께', '#차 없음', '#맛집']),
      places: JSON.stringify([
        { name: '연남동 골목 비건 브런치', desc: '숲길 뒷골목. 줄 없고 공간도 여유로움. 브런치 12,000원 수준' },
        { name: '합정동 독립서점 + 레코드샵', desc: '20년 된 독립서점 2곳이 골목 하나에. 레코드 구경하다 시간 가는 곳' },
        { name: '당인리책발전소', desc: '구 화력발전소 개조 복합문화공간. 특이한 공간감과 카페 운영 중' },
        { name: '망원시장 먹거리 투어', desc: '망리단길 아닌 시장 안. 순대 1,500원, 떡볶이 2,000원, 진짜 재래시장 가격' },
      ]),
    },
    {
      seller_id: seller2,
      province: '제주특별자치도', city: '서귀포시',
      title: '서귀포 정방동 감귤농장 & 진짜 로컬 코스',
      description: '관광용 감귤 체험 말고, 동네 할머니가 직접 운영하는 감귤 농장에서 직접 따는 체험. 정방폭포 이른 아침 관람, 서귀포 로컬 흑돼지 점심, 동네 카페 마무리.',
      price: 1500,
      tags: JSON.stringify(['#가족과 함께', '#휴양', '#차 있음']),
      places: JSON.stringify([
        { name: '정방동 할머니 감귤농장', desc: '상업 체험농장 아님. 연락해서 방문 예약 필수. 직접 따서 맛봄' },
        { name: '정방폭포 이른 아침', desc: '8시 전에 가면 관광객 없음. 바다로 직접 떨어지는 폭포 가까이 접근 가능' },
        { name: '서귀포 로컬 흑돼지 골목', desc: '관광지 흑돼지 식당 가격 절반. 서귀포 주민들이 회식하는 골목' },
        { name: '정방동 동네 카페', desc: '바다 보이는 골목 안 작은 카페. 관광 코스에 없는 서귀포 일상' },
      ]),
    },

    // ─ 양양 추가 코스 5개 ──────────────────────────────────────────────────────
    {
      seller_id: seller5,
      province: '강원특별자치도', city: '양양군',
      title: '양양 하조대 해안 절벽 & 로컬 해산물 코스',
      description: '양양 최고의 비경 하조대 등대에서 시작해 기암괴석 해안 산책로, 관광지 아닌 현지 어판장 직판 해산물, 일몰 포인트까지. 차 있으면 반나절이면 충분한 동선.',
      price: 1200,
      tags: JSON.stringify(['#연인과 함께', '#휴양', '#차 있음']),
      places: JSON.stringify([
        { name: '하조대 등대', desc: '양양 북쪽 끝자락 절벽 위 등대. 이른 아침이나 일몰 시간대가 최고' },
        { name: '하조대 기암 해안 산책로', desc: '등대 아래로 이어지는 1km 해안 바위 산책로. 파도 치는 날 강추' },
        { name: '하조대 어촌마을 직판장', desc: '관광용 포장 아닌 어민 직판. 가리비·소라·조개 현장 구이' },
        { name: '38해변 일몰 포인트', desc: '하조대에서 차로 10분. 수평선 일몰이 펼쳐지는 로컬 명소' },
      ]),
      image_url: 'https://picsum.photos/id/232/800/400',  // 바다 절벽
    },
    {
      seller_id: seller5,
      province: '강원특별자치도', city: '양양군',
      title: '양양 죽도정 & 기암해변 일몰 데이트 코스',
      description: '양양 숨겨진 절경 죽도정에서 시작해 기암해변 카페 감성, 서퍼들의 일몰 명소까지. 인파 없이 둘이서 즐기는 양양 해안 데이트 코스.',
      price: 1000,
      tags: JSON.stringify(['#연인과 함께', '#야경', '#차 없음']),
      places: JSON.stringify([
        { name: '죽도정 전망대', desc: '소나무 숲 안에 숨어 있는 정자. 바다 조망이 일품, 관광객 거의 없음' },
        { name: '기암해변 카페거리', desc: '서핑족들이 모이는 해변 옆 작은 카페들. 테라스에서 파도 소리 들으며 커피' },
        { name: '인구해변 일몰 포인트', desc: '서퍼들이 하루를 마감하는 장소. 오렌지 일몰과 보드 실루엣이 그림같음' },
      ]),
      image_url: 'https://picsum.photos/id/1002/800/400',  // 바다/일몰
    },
    {
      seller_id: seller5,
      province: '강원특별자치도', city: '양양군',
      title: '양양 남대천 연어 생태 & 산간 로컬 마을 코스',
      description: '가을이면 연어가 거슬러 오르는 남대천 생태 체험. 현북면 산간 마을 오래된 두부집, 시골 장터 탐방. 바다보다 덜 알려진 양양 내륙의 진짜 로컬 코스.',
      price: 800,
      tags: JSON.stringify(['#가족과 함께', '#휴양', '#차 있음']),
      places: JSON.stringify([
        { name: '남대천 연어 생태 탐방로', desc: '10월~11월 연어 회귀 시즌. 강을 거슬러 오르는 연어 가까이에서 관찰' },
        { name: '현북면 산간 두부집', desc: '40년 전통 순두부집. 현지인들이 주말 아침에 오는 집. 예약 없이 일찍 가야 함' },
        { name: '양양 시골 오일장', desc: '4·9일에 열리는 재래 장터. 강원도 산나물·약초 파는 할머니들 가득' },
        { name: '현북면 전통 막걸리 양조장', desc: '직접 빚은 쌀막걸리 시음 가능. 근처 식당에서 안주 포장해서 야외 시음' },
      ]),
    },
    {
      seller_id: seller5,
      province: '강원특별자치도', city: '양양군',
      title: '양양 장리해수욕장 새벽 해돋이 & 해변 산책 코스',
      description: '관광객이 모르는 양양 숨겨진 해수욕장, 장리해변. 이른 새벽엔 아무도 없음. 해돋이 보고 해변 산책, 근처 작은 횟집에서 아침 회국수 한 그릇.',
      price: 900,
      tags: JSON.stringify(['#혼자', '#휴양', '#차 없음']),
      places: JSON.stringify([
        { name: '장리해수욕장 새벽 해돋이', desc: '이른 아침 5~6시. 아무도 없는 백사장에서 혼자 일출 감상' },
        { name: '장리해변 조개 줍기', desc: '썰물 때 모래사장에서 조개 줍기. 아이 동반 가족도 좋아하는 코스' },
        { name: '해변 작은 횟집 아침 식사', desc: '오전 7시부터 여는 가게. 회국수·물회 아침 식사. 관광지 가격 아님' },
        { name: '낙산해변 ~ 장리 해안 산책로', desc: '두 해변 잇는 2km 해안 산책로. 파도 소리 들으며 걷는 1시간 코스' },
      ]),
      image_url: 'https://picsum.photos/id/1005/800/400',  // 해변/바다
    },
    {
      seller_id: seller5,
      province: '강원특별자치도', city: '양양군',
      title: '양양 현북면 로컬 카페 투어 — 산과 바다 사이',
      description: '양양의 숨겨진 면, 현북면. 바다 카페도 아니고 산속 카페도 아닌, 그 사이 어딘가. 로스터리 카페, 자연 속 브런치, 도예 공방 체험까지.',
      price: 1100,
      tags: JSON.stringify(['#연인과 함께', '#맛집', '#차 있음']),
      places: JSON.stringify([
        { name: '현북면 숲속 로스터리', desc: '나무 사이에 숨어 있는 작은 카페. 창밖으로 계곡 소리 들리는 곳' },
        { name: '현북 자연 브런치 카페', desc: '직접 키운 채소로 만드는 브런치. 예약 필수, 12시~2시만 운영' },
        { name: '현북 도예 공방', desc: '현지 도예 작가 운영 공방. 체험 프로그램 있음. 사전 연락 필요' },
        { name: '양양 서림계곡 산책', desc: '현북면 안에 있는 잘 알려지지 않은 계곡. 여름엔 피서지로 현지인들만 앎' },
      ]),
    },
  ];

  const courseIds = courses.map(c =>
    insertCourse.run(c.seller_id, c.province, c.city, c.title, c.description, c.price, c.tags, c.places, c.image_url || null).lastInsertRowid
  );

  // ── 구매 기록 (purchase_count 분포) ──────────────────────────────────────────
  const insertPurchase = db.prepare(
    'INSERT OR IGNORE INTO purchases (user_id, course_id, amount) VALUES (?, ?, ?)'
  );

  const purchaseMap = [
    { courseIdx: 0,  buyerCount: 8   },  // 강릉 당일
    { courseIdx: 1,  buyerCount: 5   },  // 제주 동쪽
    { courseIdx: 2,  buyerCount: 3   },  // 부산 야경
    { courseIdx: 3,  buyerCount: 12  },  // 서울 익선동
    { courseIdx: 4,  buyerCount: 2   },  // 속초 액티비티
    { courseIdx: 5,  buyerCount: 115 },  // 양양 서퍼 → 100+
    { courseIdx: 6,  buyerCount: 4   },  // 양양 낙산사
    { courseIdx: 7,  buyerCount: 15  },  // 강릉 카페
    { courseIdx: 8,  buyerCount: 6   },  // 속초 아바이
    { courseIdx: 9,  buyerCount: 9   },  // 경주 황리단
    { courseIdx: 10, buyerCount: 3   },  // 전주 로컬
    { courseIdx: 11, buyerCount: 7   },  // 여수 해산물
    { courseIdx: 12, buyerCount: 4   },  // 부산 이바구길
    { courseIdx: 13, buyerCount: 8   },  // 연남동
    { courseIdx: 14, buyerCount: 2   },  // 서귀포
    { courseIdx: 15, buyerCount: 11  },  // 양양 하조대
    { courseIdx: 16, buyerCount: 7   },  // 양양 죽도정
    { courseIdx: 17, buyerCount: 3   },  // 양양 남대천
    { courseIdx: 18, buyerCount: 9   },  // 양양 장리해변
    { courseIdx: 19, buyerCount: 5   },  // 양양 현북면 카페
  ];

  for (const { courseIdx, buyerCount } of purchaseMap) {
    const price = courses[courseIdx].price;
    for (let i = 0; i < buyerCount && i < buyerIds.length; i++) {
      insertPurchase.run(buyerIds[i], courseIds[courseIdx], price);
    }
  }

  // ── 리뷰 및 별점 ─────────────────────────────────────────────────────────────
  const insertReview = db.prepare(
    'INSERT OR IGNORE INTO reviews (user_id, course_id, rating, comment) VALUES (?, ?, ?, ?)'
  );

  const reviewMap = [
    { courseIdx: 0,  ratings: [5, 5, 5, 5, 4, 4, 3] },                        // avg 4.4
    { courseIdx: 1,  ratings: [5, 5, 5, 4, 3] },                               // avg 4.4
    { courseIdx: 2,  ratings: [5, 5, 4] },                                     // avg 4.7
    { courseIdx: 3,  ratings: [5, 5, 5, 5, 5, 4, 4, 4, 3, 3, 2, 1] },         // avg 3.8
    { courseIdx: 4,  ratings: [5, 4] },                                        // avg 4.5
    { courseIdx: 5,  ratings: [...Array(30).fill(5), ...Array(20).fill(4)] },  // avg 4.6
    { courseIdx: 6,  ratings: [5, 5, 5, 3] },                                 // avg 4.5
    { courseIdx: 7,  ratings: [5, 5, 5, 5, 5, 5, 5, 5, 4, 4, 4, 4, 4, 3, 3] }, // avg 4.5
    { courseIdx: 8,  ratings: [5, 5, 5, 4, 4, 3] },                           // avg 4.3
    { courseIdx: 9,  ratings: [5, 5, 5, 5, 4, 4, 4, 3, 3] },                  // avg 4.2
    { courseIdx: 10, ratings: [4, 4, 3] },                                    // avg 3.7
    { courseIdx: 11, ratings: [5, 5, 5, 5, 5, 4, 4] },                        // avg 4.7
    { courseIdx: 12, ratings: [5, 5, 5, 4] },                                 // avg 4.75
    { courseIdx: 13, ratings: [5, 5, 5, 5, 4, 4, 4, 3] },                     // avg 4.4
    // courseIdx: 14 (서귀포) 는 리뷰 없음
    { courseIdx: 15, ratings: [5, 5, 5, 5, 5, 4, 4, 4, 3, 4, 5] },  // avg 4.5
    { courseIdx: 16, ratings: [5, 5, 5, 5, 4, 4, 3] },               // avg 4.4
    { courseIdx: 17, ratings: [5, 4, 4] },                           // avg 4.3
    { courseIdx: 18, ratings: [5, 5, 5, 5, 5, 4, 4, 4, 4] },        // avg 4.6
    { courseIdx: 19, ratings: [5, 5, 4, 4, 3] },                     // avg 4.2
  ];

  for (const { courseIdx, ratings } of reviewMap) {
    ratings.forEach((rating, i) => {
      if (i < buyerIds.length) {
        insertReview.run(buyerIds[i], courseIds[courseIdx], rating, null);
      }
    });
  }

  console.log(`✅ 시드 완료: 판매자 8명, 구매자 115명, 코스 ${courseIds.length}개 (양양 5개 포함)`);
  console.log('   demo@local.com / test1234 (머니 10,000원)');
}

// ── demo2 계정 보장 ───────────────────────────────────────────────────────────
const demo2 = db.prepare('SELECT id FROM users WHERE email = ?').get('demo2@local.com');
if (!demo2) {
  const hash2 = bcrypt.hashSync('test1234', 10);
  db.prepare(
    'INSERT INTO users (email, password, nickname, money) VALUES (?, ?, ?, ?)'
  ).run('demo2@local.com', hash2, '데모유저2', 5000);
  console.log('✅ demo2@local.com 생성');
}

module.exports = db;
