# 🗺️ LocalCourse

> 현지인이 직접 만든 여행 코스 마켓플레이스 — 광고 없이, 진짜만

[![Hackathon](https://img.shields.io/badge/Khuthon-2026-1D9E75?style=flat-square)](https://github.com/dlwnsgml7/Khuthon)
[![License](https://img.shields.io/badge/license-MIT-gray?style=flat-square)](./LICENSE)

---

## 개요

LocalCourse는 현지인이 알고 있는 진짜 여행 정보를 소액으로 사고파는 **P2P 코스 마켓플레이스**입니다.

유튜브와 지도 앱의 알고리즘·광고 중심 정보 구조에서 벗어나, **사람이 유통 구조**가 되는 플랫폼입니다.  
지역 고유 문화의 가시성을 높이고, 로컬 창작자에게 처음으로 수익 구조를 부여합니다.

> **해결하는 문제**  
> 알고리즘이 검증된 콘텐츠만 노출시켜 지역 고유 문화가 비가시화되고,  
> 광고가 섞인 정보가 여행자의 문화 경험을 왜곡하는 구조적 문제를 해결합니다.

---

## 동작 시나리오

### 1단계 — 시작 화면 (온보딩)

앱을 실행하면 **회원가입 / 로그인** 버튼이 표시됩니다.  
로그인 후 홈 화면으로 진입합니다.

### 2단계 — 홈 (한반도 지도 탐색)

```
홈 화면
 └─ 한반도 전체 지도 표시 (행정구역별 클릭 영역 구분)
     └─ 도(道) 클릭
         └─ 해당 도로 확대 → 시(市) 단위 구역으로 세분화
             └─ 시(市) 선택
                 └─ 해당 지역 코스 목록 표시
```

코스 목록에는 각 코스의 **가격**과 **키워드 태그**가 표시됩니다.  
코스 내용은 기본적으로 **비공개** 상태이며, 결제 전에는 열람할 수 없습니다.

```
코스 카드 예시
┌────────────────────────────────┐
│  📍 강릉 감성 당일치기 코스      │
│  #연인과 함께  #차 없음  #휴양  │
│                        ₩1,000  │
│                   [ 공개하기 ]  │
└────────────────────────────────┘
```

지원하는 태그 키워드:

| 카테고리 | 태그 |
|----------|------|
| 동행 | `#연인과 함께` `#가족과 함께` `#혼자` |
| 테마 | `#액티비티` `#휴양` `#맛집` `#야경` |
| 이동수단 | `#차 있음` `#차 없음` |

### 3단계 — 코스 결제

`공개하기` 버튼을 누르면 **LocalCourse 머니** 결제 창이 표시됩니다.

```
잔액 충분   →  즉시 차감 후 코스 공개
잔액 부족   →  머니 충전 화면으로 이동 → 충전 후 결제
```

결제 완료 시 코스의 전체 동선, 장소 상세 정보, 판매자 설명이 공개됩니다.

---

### 전체 플로우 요약

```
앱 실행
  └─ 회원가입 / 로그인
       └─ 홈 (한반도 지도)
            └─ 도 선택 → 시 선택
                 └─ 코스 목록 탐색
                      └─ 공개하기 클릭
                           ├─ 머니 잔액 충분 → 즉시 결제 → 코스 공개
                           └─ 머니 잔액 부족 → 충전 → 결제 → 코스 공개
```

판매자는 자신의 지역에서만 아는 경치, 분위기 좋은 장소, 숨겨진 동선을 코스로 구성해 등록합니다.  
여행자는 머니로 결제하고 코스를 구매해 여행에 활용합니다.

---

## 주요 기능

| 기능 | 설명 |
|------|------|
| 🔐 회원가입 / 로그인 | 간단한 인증 후 서비스 진입 |
| 🗺️ 한반도 지도 탐색 | 도 → 시 단위로 드릴다운하는 인터랙티브 지도 |
| 🏷️ 태그 기반 코스 탐색 | 동행·테마·이동수단 키워드로 코스 필터링 |
| 🔒 코스 잠금 / 공개 | 결제 전 비공개, 결제 완료 후 전체 동선 공개 |
| 💰 LocalCourse 머니 | 앱 내 포인트로 즉시 결제, 잔액 부족 시 충전 |
| 📝 코스 에디터 | 판매자가 장소·동선·설명을 구성해 등록 |
| 🛡️ 현지인 인증 | 거주지 기반 인증 배지로 정보 신뢰도 담보 |
| ⭐ 구매 후 리뷰 | 실제 구매자만 리뷰 작성 가능, 조작 방지 |

---

## 기술 스택

**Frontend (Mobile)**
- React Native + Expo
- TypeScript
- React Navigation (화면 전환)
- React Native SVG (한반도 지도 인터랙션)
- AsyncStorage (로그인 토큰 / 세션)

**Backend**
- Node.js + Express
- SQLite (해커톤용 경량 DB, 추후 PostgreSQL 마이그레이션)
- JWT (인증)

**개발 도구**
- VSCode
- Expo Go (실기기 테스트)
- Git / GitHub

---

## 개발 환경 세팅

### 사전 요구사항

| 도구 | 버전 |
|------|------|
| Node.js | 20.x 이상 |
| npm | 10.x 이상 |
| Expo Go 앱 | 모바일에서 설치 (App Store / Play Store) |

### VSCode 권장 익스텐션

- **ES7+ React/Redux/React-Native snippets**
- **Prettier - Code formatter**
- **ESLint**
- **GitLens**
- **Path Intellisense**

### 실행 방법

```bash
# 1. 레포 클론
git clone https://github.com/dlwnsgml7/Khuthon.git
cd Khuthon

# 2. 프론트엔드 실행
cd frontend
npm install
npx expo start
# → QR 코드를 Expo Go 앱으로 스캔하면 모바일에서 바로 확인 가능

# 3. 백엔드 실행 (다른 터미널)
cd backend
npm install
cp .env.example .env
npm run dev
```

---

## 프로젝트 구조

```
Khuthon/
├── frontend/                  # React Native + Expo 앱
│   ├── App.tsx                # 앱 진입점
│   ├── src/
│   │   ├── screens/           # 화면 컴포넌트
│   │   │   ├── LoginScreen.tsx
│   │   │   ├── SignupScreen.tsx
│   │   │   ├── HomeScreen.tsx       # 한반도 지도
│   │   │   ├── ProvinceScreen.tsx   # 도 → 시 확대
│   │   │   ├── CourseListScreen.tsx # 코스 목록
│   │   │   ├── CourseDetailScreen.tsx
│   │   │   └── PaymentScreen.tsx
│   │   ├── components/        # 재사용 컴포넌트
│   │   │   ├── KoreaMap.tsx
│   │   │   ├── CourseCard.tsx
│   │   │   └── TagBadge.tsx
│   │   ├── navigation/        # React Navigation 설정
│   │   ├── api/               # 백엔드 API 호출 함수
│   │   ├── types/             # TypeScript 타입
│   │   └── assets/            # 이미지, 지도 SVG 등
│   └── package.json
│
├── backend/                   # Node.js + Express 서버
│   ├── src/
│   │   ├── routes/            # API 라우트
│   │   │   ├── auth.ts        # 회원가입 / 로그인
│   │   │   ├── courses.ts     # 코스 CRUD
│   │   │   └── payment.ts     # 머니 결제
│   │   ├── models/            # DB 스키마
│   │   ├── middleware/        # 인증 미들웨어
│   │   └── index.ts           # 서버 진입점
│   ├── .env.example
│   └── package.json
│
└── README.md
```

---

## 협업 컨벤션

### 브랜치 전략

```
main          # 배포용 (직접 푸시 금지)
└─ develop    # 개발 통합 브랜치
    ├─ feat/login           # 기능 단위 브랜치
    ├─ feat/korea-map
    └─ fix/payment-bug
```

### 커밋 메시지 컨벤션

```
feat:     새 기능 추가
fix:      버그 수정
style:    코드 포맷, UI 스타일 변경
refactor: 리팩토링
docs:     문서 수정
chore:    빌드, 설정 변경
```

예시: `feat: 한반도 지도 도 단위 클릭 인터랙션 구현`

### Pull Request 규칙

- `develop` 브랜치로 PR 생성
- 다른 팀원 1명 이상 리뷰 후 머지
- 충돌 발생 시 작성자가 해결

---

## 순환 구조

이 플랫폼의 핵심은 단방향 소비가 아닌 **지속 가능한 순환**입니다.

```
판매자 수익
    ↓
더 많은 코스 생산
    ↓
여행자의 진짜 경험
    ↓
지역 문화 재생산
    ↓
판매자 동기 강화 (처음으로 돌아감)
```

알고리즘 대신 사람이 유통 구조가 되며, 소액 거래가 신뢰 시그널이자 지속 가능성의 근거가 됩니다.

---

## 팀

| GitHub | 역할 |
|--------|------|
| [@dlwnsgml7](https://github.com/dlwnsgml7) | - |
| [@chunghyukje](https://github.com/chunghyukje) | - |

---

## 라이선스

[MIT](./LICENSE) © LocalCourse · Khuthon 2026
