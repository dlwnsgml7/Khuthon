const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../localcourse.json');

function seedData() {
  const hash = bcrypt.hashSync('test1234', 10);
  const users = [
    { id: 1, email: 'demo@local.com', password: hash, nickname: '데모유저', money: 5000 },
    { id: 2, email: 'gangneung@local.com', password: hash, nickname: '강릉현지인', money: 0 },
    { id: 3, email: 'jeju@local.com', password: hash, nickname: '제주토박이', money: 0 },
    { id: 4, email: 'busan@local.com', password: hash, nickname: '부산갈매기', money: 0 },
    { id: 5, email: 'seoul@local.com', password: hash, nickname: '서울러', money: 0 },
  ];

  const courses = [
    {
      id: 1,
      seller_id: 2,
      province: '강원특별자치도',
      city: '강릉시',
      title: '강릉 감성 당일치기 코스',
      description: '관광지 말고 진짜 강릉 사람들이 가는 곳. 새벽 안목해변 -> 명주동 골목 -> 현지인 단골 막국수집 -> 노을 명소까지.',
      price: 1000,
      tags: ['#연인과 함께', '#차 없음', '#휴양'],
      places: [
        { name: '안목해변 끝자락', desc: '관광객 없는 새벽 6시 추천' },
        { name: '명주동 골목', desc: '오래된 적산가옥 골목길' },
        { name: '로컬 막국수', desc: '동네 사람만 아는 메밀막국수집' },
        { name: '경포대 뒷편 언덕', desc: '노을 보기 가장 좋은 자리' },
      ],
    },
    {
      id: 2,
      seller_id: 3,
      province: '제주특별자치도',
      city: '제주시',
      title: '관광객 없는 제주 동쪽 코스',
      description: '함덕, 월정리 말고 진짜 한적한 동쪽. 차 없이 버스로 가능한 동선.',
      price: 1000,
      tags: ['#혼자', '#차 없음', '#휴양'],
      places: [
        { name: '북촌 돌담길', desc: '아무도 없는 어촌 마을' },
        { name: '세화 오일장', desc: '제주 할망들 시장' },
        { name: '평대리 무명 카페', desc: '동네 주민이 운영하는 작은 카페' },
      ],
    },
    {
      id: 3,
      seller_id: 4,
      province: '부산광역시',
      city: '해운대구',
      title: '해운대 빼고 진짜 부산 야경',
      description: '광안리, 해운대 말고 부산 사람들이 데이트하는 야경 코스.',
      price: 1000,
      tags: ['#연인과 함께', '#차 있음', '#야경'],
      places: [
        { name: '황령산 봉수대', desc: '광안대교를 위에서 보는 뷰' },
        { name: '청사포 다릿돌전망대', desc: '인적 드문 해안 전망대' },
        { name: '동백섬 뒷길', desc: '메인 산책로 말고 뒷길' },
      ],
    },
    {
      id: 4,
      seller_id: 5,
      province: '서울특별시',
      city: '종로구',
      title: '익선동 서촌 골목 코스',
      description: '인스타 명소가 아닌 진짜 옛 골목. 관광객 동선을 피하는 코스.',
      price: 1000,
      tags: ['#가족과 함께', '#차 없음', '#맛집'],
      places: [
        { name: '체부동 잔치집', desc: '서촌 토박이 단골' },
        { name: '익선동 뒷골목', desc: '메인 거리 말고 뒷골목' },
        { name: '통의동 보안여관', desc: '오래된 문화공간' },
      ],
    },
    {
      id: 5,
      seller_id: 2,
      province: '강원특별자치도',
      city: '속초시',
      title: '속초 액티비티 1박2일',
      description: '서핑, 등산, 시장 미식을 묶은 풀패키지.',
      price: 1000,
      tags: ['#액티비티', '#차 있음', '#가족과 함께'],
      places: [
        { name: '설악해변 서핑샵', desc: '초보 강습' },
        { name: '울산바위 코스', desc: '4시간 등산' },
        { name: '속초중앙시장 닭강정', desc: '현지인 추천 가게' },
      ],
    },
  ];

  return { users, courses, purchases: [], nextIds: { user: 6, course: 6, purchase: 1 } };
}

function load() {
  if (!fs.existsSync(DB_PATH)) {
    const initial = seedData();
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2));
    console.log('Seed data created. Demo account: demo@local.com / test1234');
    return initial;
  }

  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

let state = load();

function save() {
  fs.writeFileSync(DB_PATH, JSON.stringify(state, null, 2));
}

function publicUser(user) {
  if (!user) return null;
  return { id: user.id, email: user.email, nickname: user.nickname, money: user.money };
}

function courseWithSeller(course) {
  const seller = state.users.find((user) => user.id === course.seller_id);
  return { ...course, seller: seller ? seller.nickname : '알 수 없음' };
}

module.exports = {
  findUserByEmail(email) {
    return state.users.find((user) => user.email === email);
  },

  findUserById(id) {
    return state.users.find((user) => user.id === id);
  },

  createUser({ email, password, nickname }) {
    const user = {
      id: state.nextIds.user++,
      email,
      password,
      nickname,
      money: 0,
    };
    state.users.push(user);
    save();
    return user;
  },

  addMoney(userId, amount) {
    const user = this.findUserById(userId);
    if (!user) return null;
    user.money += amount;
    save();
    return user;
  },

  listCourses({ province, city } = {}) {
    return state.courses
      .filter((course) => !province || course.province === province)
      .filter((course) => !city || course.city === city)
      .map(courseWithSeller)
      .map(({ description, places, seller_id, ...course }) => course);
  },

  countByProvince() {
    const counts = new Map();
    for (const course of state.courses) {
      counts.set(course.province, (counts.get(course.province) || 0) + 1);
    }
    return Array.from(counts, ([province, count]) => ({ province, count }));
  },

  countByCity(province) {
    const counts = new Map();
    for (const course of state.courses.filter((item) => item.province === province)) {
      counts.set(course.city, (counts.get(course.city) || 0) + 1);
    }
    return Array.from(counts, ([city, count]) => ({ city, count }));
  },

  findCourseById(id) {
    const course = state.courses.find((item) => item.id === id);
    return course ? courseWithSeller(course) : null;
  },

  findPurchase(userId, courseId) {
    return state.purchases.find(
      (purchase) => purchase.user_id === userId && purchase.course_id === courseId
    );
  },

  purchaseCourse(userId, courseId) {
    const user = this.findUserById(userId);
    const course = this.findCourseById(courseId);
    if (!user || !course) return { error: 'NOT_FOUND' };
    if (this.findPurchase(userId, courseId)) return { error: 'ALREADY_PURCHASED' };
    if (user.money < course.price) {
      return { error: 'INSUFFICIENT_FUNDS', required: course.price, current: user.money };
    }

    user.money -= course.price;
    state.purchases.push({
      id: state.nextIds.purchase++,
      user_id: userId,
      course_id: courseId,
      amount: course.price,
      purchased_at: new Date().toISOString(),
    });
    save();
    return { user, course };
  },

  publicUser,
};
