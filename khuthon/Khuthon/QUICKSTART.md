# 빠른 시작 가이드

## 가장 쉬운 실행 방법 (Windows)

레포를 clone한 뒤, repo 루트의 아래 파일을 더블클릭합니다.

```text
start-localcourse.bat
```

이 파일은 백엔드와 웹 프론트엔드를 각각 새 창에서 실행합니다.

모바일 Expo Go로 테스트하려면 아래 파일을 사용합니다.

```text
start-backend.bat
start-frontend.bat
```

`start-backend.bat`를 먼저 실행하고, 그 다음 `start-frontend.bat`를 실행한 뒤 QR 코드를 Expo Go로 스캔합니다.

## 수동 실행 방법

### 1. 백엔드 실행

Windows PowerShell:

```powershell
cd C:\Users\hyukj\Desktop\Khuthon\khuthon\Khuthon\backend
npm install
copy .env.example .env
npm run dev
```

macOS/Linux:

```bash
cd khuthon/Khuthon/backend
npm install
cp .env.example .env
npm run dev
```

서버가 `http://localhost:4000`에서 실행됩니다.

자동으로 JSON DB(`backend/localcourse.json`)가 생성되고 시드 데이터가 입력됩니다.

데모 계정: `demo@local.com` / `test1234` (머니 5,000원 보유)

## 2. 프론트엔드 실행

다른 터미널에서:

```powershell
cd C:\Users\hyukj\Desktop\Khuthon\khuthon\Khuthon\frontend
npm install
npx expo start --web
```

웹 브라우저에서 터미널에 표시되는 URL을 엽니다. 보통 `http://localhost:8081`입니다.

모바일 Expo Go로 확인하려면:

```bash
npx expo start
```

QR 코드가 표시되면:

- iOS: 카메라 앱으로 QR 스캔
- Android: Expo Go 앱으로 QR 스캔

## 3. 백엔드 IP 설정

웹 실행은 자동으로 `http://localhost:4000`을 사용합니다.

Expo Go 실기기 테스트 시에는 `frontend/src/api/client.js` 파일에서 `LAN_IP`를 본인 PC의 IP로 변경합니다.

```javascript
const LAN_IP = '192.168.0.10'; // 본인 PC IP로 수정
```

PC IP 확인:

- Windows: `ipconfig` 후 IPv4 주소 확인
- macOS/Linux: `ifconfig` 또는 `ip addr`

PC와 모바일이 같은 와이파이에 연결되어 있어야 합니다.

## 4. 화면 흐름

```text
로그인 -> 홈 (한반도 지도)
        -> 도 클릭 -> 시/군/구 선택
                   -> 코스 목록 (잠금 상태)
                              -> 코스 상세
                              -> 결제 후 동선 공개
                              -> 머니 부족 시 충전 화면
```

## 트러블슈팅

| 문제 | 해결 |
|------|------|
| 브라우저에서 JSON만 보임 | Expo manifest URL을 연 상태입니다. `npx expo start --web`으로 실행한 웹 URL을 여세요. |
| `Network request failed` | 백엔드 실행 여부, 웹 `localhost:4000`, 실기기 `LAN_IP`를 확인하세요. |
| Expo Go에서 앱이 안 보임 | `npx expo start --tunnel`로 재시작하세요. |
| 로그인 실패 | 백엔드가 켜져 있는지 확인 후 `demo@local.com` / `test1234`로 로그인하세요. |
