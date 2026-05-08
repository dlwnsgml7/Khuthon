import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Expo Go에서 백엔드 접근:
// - 같은 와이파이의 PC IP 주소 사용 권장
// - 개발 시작 시 .env 또는 아래 BASE_URL 변경
//
// Android 에뮬레이터: 10.0.2.2
// iOS 시뮬레이터: localhost
// 실기기: PC의 LAN IP (예: 192.168.0.10)

const LAN_IP = '192.168.0.10'; // ⚠️ 본인 PC IP로 수정
const PORT = 4000;

export const BASE_URL = (() => {
  if (Platform.OS === 'android') return `http://10.0.2.2:${PORT}`;
  if (Platform.OS === 'ios') return `http://localhost:${PORT}`;
  return `http://${LAN_IP}:${PORT}`;
})();

async function getToken() {
  return await AsyncStorage.getItem('token');
}

async function request(path, { method = 'GET', body, auth = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = await getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `요청 실패 (${res.status})`);
  }
  return data;
}

export const api = {
  signup: (email, password, nickname) =>
    request('/auth/signup', { method: 'POST', body: { email, password, nickname } }),
  login: (email, password) =>
    request('/auth/login', { method: 'POST', body: { email, password } }),
  me: () => request('/auth/me', { auth: true }),
  charge: (amount) =>
    request('/auth/charge', { method: 'POST', body: { amount }, auth: true }),

  listCourses: (province, city) => {
    const q = new URLSearchParams();
    if (province) q.set('province', province);
    if (city) q.set('city', city);
    return request(`/courses?${q.toString()}`);
  },
  countsByProvince: () => request('/courses/counts/by-province'),
  countsByCity: (province) =>
    request(`/courses/counts/by-city?province=${encodeURIComponent(province)}`),
  courseDetail: (id) => request(`/courses/${id}`, { auth: true }),
  purchaseCourse: (id) => request(`/courses/${id}/purchase`, { method: 'POST', auth: true }),
};
