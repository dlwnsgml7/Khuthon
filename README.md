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

```
판매자 (현지인)          플랫폼                  구매자 (여행자)
     │                    │                          │
     │  코스 등록          │                          │
     │ ─────────────────> │                          │
     │                    │   코스 탐색              │
     │                    │ <──────────────────────  │
     │                    │   ₩1,000 결제            │
     │                    │ <──────────────────────  │
     │   수익 정산         │                          │
     │ <───────────────── │   코스 수령              │
     │                    │ ──────────────────────>  │
```

판매자는 자신의 지역에서만 아는 경치, 분위기 좋은 장소, 숨겨진 동선을 코스로 구성해 등록합니다.  
여행자는 ₩1,000을 결제하고 해당 코스를 구매해 여행에 활용합니다.

---

## 주요 기능

| 기능 | 설명 |
|------|------|
| 📝 코스 에디터 | 지도 기반으로 장소를 추가하고 순서를 구성하는 판매자 도구 |
| 🛡️ 현지인 인증 | 거주지 기반 인증 배지로 정보 신뢰도 담보 |
| ⭐ 구매 후 리뷰 | 실제 구매자만 리뷰 작성 가능, 조작 방지 |
| 🔍 지역별 탐색 | 여행 목적지로 코스를 필터링해 탐색 |

---

## 기술 스택

**Frontend**
- React Native

**Backend**
- Node.js / Express
- PostgreSQL

**외부 API**
- Kakao Maps API
- 토스페이먼츠

---

## 로컬 실행

```bash
# 레포 클론
git clone https://github.com/dlwnsgml7/Khuthon.git
cd Khuthon

# 의존성 설치
npm install

# 환경변수 설정
cp .env.example .env
# .env에 KAKAO_API_KEY, DB_URL, PAYMENT_SECRET 입력

# 개발 서버 실행
npm run dev
```

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
