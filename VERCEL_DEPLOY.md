# Vercel 배포 가이드

## 배포 단계

### 1. Vercel CLI 설치
```bash
npm i -g vercel
```

### 2. Vercel 로그인
```bash
vercel login
```

### 3. 프로젝트 배포
```bash
vercel
```

### 4. 환경 변수 설정
Vercel 대시보드에서 환경 변수를 설정하세요:
- `GEMINI_API_KEY`: Google Gemini API 키

또는 CLI로 설정:
```bash
vercel env add GEMINI_API_KEY
```

### 5. 프로덕션 배포
```bash
vercel --prod
```

## 참고 사항

- Socket.IO는 Vercel 서버리스 환경에서 제한적으로 작동할 수 있습니다.
- 실시간 협업 기능이 필요하다면 Render나 Railway를 추천합니다.
- 파일 저장은 Vercel의 임시 파일 시스템을 사용하므로, 프로덕션에서는 데이터베이스 사용을 권장합니다.

## 대안: GitHub Pages + Render

프론트엔드만 Vercel에 배포하고, 백엔드는 Render에 배포하는 것도 좋은 방법입니다.
