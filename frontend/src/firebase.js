import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyCkxsNqGt85PhSeSRy1rhabswMaJsfFhZ8",
  authDomain: "localcoursetradingplatform.firebaseapp.com",
  databaseURL: "https://localcoursetradingplatform-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "localcoursetradingplatform",
  storageBucket: "localcoursetradingplatform.firebasestorage.app",
  messagingSenderId: "829037453452",
  appId: "1:829037453452:web:8701aa71d708e852b89ba9",
};

const app = initializeApp(firebaseConfig);
export const rtdb = getDatabase(app);

// 채팅방 키 생성: courseId_작은userId_큰userId
export function roomKey(courseId, uid1, uid2) {
  const [a, b] = [Number(uid1), Number(uid2)].sort((x, y) => x - y);
  return `${courseId}_${a}_${b}`;
}
