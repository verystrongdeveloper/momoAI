# 모모톡 (MomoTalk) - 블루 아카이브 채팅 시뮬레이터

넥슨의 게임 "블루 아카이브"의 모모톡을 모방한 채팅 및 이벤트 시스템입니다. 생성형 AI를 활용하여 캐릭터들과 자연스러운 대화를 나눌 수 있습니다.

## ✨ 주요 기능

- **1:1 캐릭터 채팅**: 다양한 블루 아카이브 캐릭터들과 대화
- **그룹 채팅**: 여러 캐릭터들이 참여하는 단톡방 시뮬레이션
- **미연시 이벤트**: 5회 대화 후 자동으로 시작되는 인터랙티브 이벤트
- **멀티미디어 지원**: 배경 이미지, 캐릭터 표정, BGM, 효과음

## 🚀 시작하기

### 사전 요구사항

- Node.js 18+
- npm 또는 yarn
- Expo CLI

### 설치 및 실행

1. 의존성 설치
   ```bash
   npm install
   ```

2. 개발 서버 시작
   ```bash
   npx expo start
   ```

3. 다음 옵션 중 하나로 앱 실행:
   - [Expo Go](https://expo.dev/go) (모바일 앱)
   - [Android 에뮬레이터](https://docs.expo.dev/workflow/android-studio-emulator/)
   - [iOS 시뮬레이터](https://docs.expo.dev/workflow/ios-simulator/)
   - 웹 브라우저

## 🏗️ 프로젝트 구조

```
├── app/                 # Expo Router 페이지들
├── components/          # 재사용 가능한 컴포넌트들
│   ├── event/          # 이벤트 플레이어 관련 컴포넌트
│   └── constants/      # 정적 데이터 및 설정
├── assets/             # 이미지, 음악, 효과음 파일들
├── constants/          # 캐릭터 및 설정 데이터
└── hooks/              # 커스텀 훅들
```

## 🔧 환경 설정

### 백엔드 API 설정

이 앱은 별도의 백엔드 API 서버가 필요합니다. 기본적으로 `localhost:3000`을 사용합니다.

환경 변수를 설정하려면 프로젝트 루트에 `.env` 파일을 생성하세요:

```bash
EXPO_PUBLIC_API_URL=http://your-api-server:3000
```

### 지원되는 캐릭터들

- 호시노 (대책위원회)
- 시로코 (대책위원회)
- 세리카 (대책위원회)
- 노노미 (대책위원회)
- 아야네 (대책위원회)
- 히나 (아비도스)
- 이부키 (게헨나)
- 코하루 (아비도스)
- 아리스 (밀레니엄)
- 유우카 (밀레니엄)
- 아코 (아비도스)
- 츠루기 (트리니티)

## 📱 기술 스택

- **프론트엔드**: React Native, Expo
- **언어**: TypeScript
- **라우팅**: Expo Router
- **UI**: React Native 기본 컴포넌트 + 커스텀 스타일링
- **멀티미디어**: expo-av (오디오), expo-linear-gradient (그래픽 효과)

## 🎮 게임플레이

1. **채팅 모드**: 캐릭터를 선택하여 1:1 대화를 나눕니다
2. **그룹 채팅**: 단톡방에서 여러 캐릭터들과 동시에 대화합니다
3. **이벤트 트리거**: 5회 대화 후 자동으로 미연시 이벤트가 시작됩니다
4. **이벤트 플레이**: 선택지 기반의 인터랙티브 스토리를 즐깁니다

## 📝 라이선스

이 프로젝트는 블루 아카이브의 팬 프로젝트입니다. 상업적 사용을 금합니다.

## 🤝 기여하기

1. Fork this repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
