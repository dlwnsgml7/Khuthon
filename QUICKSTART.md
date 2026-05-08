# 빠른 시작 가이드

## 1️⃣ 백엔드 실행

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

서버가 `http://localhost:4000`에서 실행됩니다.

자동으로 SQLite DB가 생성되고 시드 데이터가 입력됩니다.

**데모 계정**: `demo@local.com` / `test1234` (머니 5,000원 보유)

## 2️⃣ 프론트엔드 실행

다른 터미널에서:

```bash
cd frontend
npm install
npx expo start
```

QR 코드가 표시되면:
- **iOS**: 카메라 앱으로 QR 스캔
- **Android**: Expo Go 앱으로 QR 스캔

## 3️⃣ 백엔드 IP 설정 (실기기 테스트 시)

`frontend/src/api/client.js` 파일에서 `LAN_IP`를 본인 PC의 IP로 변경:

```javascript
const LAN_IP = '192.168.0.10'; // ← 본인 PC IP로 수정
```

PC IP 확인:
- **macOS / Linux**: `ifconfig | grep "inet "` 또는 `ipconfig getifaddr en0`
- **Windows**: `ipconfig` 후 IPv4 주소 확인

⚠️ PC와 모바일이 **같은 와이파이**에 연결되어 있어야 합니다.

## 4️⃣ 화면 흐름

```
로그인 → 홈 (한반도 지도)
        → 도 클릭 → 시·군·구 선택
                   → 코스 목록 (잠금 상태)
                              → 코스 상세 (결제 전: 가격만 / 결제 후: 동선 공개)
                                          → 머니 부족 시 충전 화면
```

## 트러블슈팅

| 문제 | 해결 |
|------|------|
| `Network request failed` | 1) 백엔드 실행 중인지 확인 2) `LAN_IP` 설정 확인 3) 같은 와이파이 확인 |
| `better-sqlite3` 설치 오류 | Node 20.x로 버전 다운그레이드 후 `npm install` 재시도 |
| Expo Go에서 앱이 안 보임 | `npx expo start --tunnel`로 재시작 |
