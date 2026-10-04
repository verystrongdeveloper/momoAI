# MomoStory

블루 아카이브 세계관의 캐릭터와 대화하고, 대화 맥락으로 인연 스토리 이벤트를 생성하는 팬 프로젝트입니다.

## 주요 기능

- **1:1 캐릭터 채팅**: 캐릭터 페르소나에 맞춰 대화
- **그룹 채팅**: 여러 캐릭터가 참여하는 단톡방
- **인연 이벤트**: 대화가 쌓이면 시작되는 인터랙티브 스토리
- **멀티미디어**: 배경, 표정, BGM, 효과음

## 시작하기

### 사전 요구사항

- Node.js 18+
- npm
- Gemini API 키 (`server/.env`의 `GEMINI_API_KEY`)

### 설치 및 실행

1. 의존성 설치
   ```bash
   npm install
   npm --prefix server install
   ```

2. 백엔드 실행 (별도 터미널)
   ```bash
   npm run server
   ```

3. 앱 실행
   ```bash
   npx expo start
   ```

웹 브라우저, Expo Go, Android/iOS 시뮬레이터 중 원하는 방식으로 열면 됩니다.

환경 변수를 바꾸려면 프로젝트 루트에 `.env`를 만듭니다.

```bash
EXPO_PUBLIC_API_URL=http://localhost:3000
```

## 프로젝트 구조

```
├── app/                    # Expo Router 화면
├── components/
│   ├── chat/               # 1:1 · 단톡 채팅
│   ├── event/              # 인연 이벤트 플레이어
│   └── layout/             # 헤더 · 사이드바 · 컨테이너
├── constants/              # 캐릭터 · 에셋 매핑
├── hooks/                  # 레이아웃 · BGM · 스크립트 파서
├── server/src/config/prompts/
│   ├── common.js           # 공통 규칙 · 선생 설정
│   ├── personas.js         # 캐릭터 고유 페르소나
│   ├── npcs.js             # 이벤트 엑스트라
│   └── resources.js        # bg / music / emotion 목록
└── shared/                 # 프론트·서버 공유 단톡방 정의
```

캐릭터를 추가할 때는 `personas.js`(또는 `npcs.js`)와 `resources.js`, 프론트 `constants/characters.ts`만 맞추면 됩니다.

## 지원 캐릭터

호시노, 시로코, 세리카, 노노미, 아야네, 히나, 이부키, 코하루, 아리스, 유우카, 아코, 츠루기

## 기술 스택

- 프론트엔드: React Native, Expo, TypeScript
- 백엔드: Express, Gemini API

이 프로젝트는 블루 아카이브의 팬 프로젝트이며 상업적 사용을 금합니다.
