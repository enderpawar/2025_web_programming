## 🚀 프로젝트 실행 방법

### 1. 의존성 설치
```bash
npm install
```

### 2. 개발 서버 시작
```bash
npm run dev
```

브라우저에서 `http://localhost:3000` 열기

---

## 📁 프로젝트 구조

```
week-1-basic-compiler/
├── components/
│   ├── Editor.jsx       # 코드 에디터 컴포넌트
│   ├── Console.jsx      # 콘솔 출력 컴포넌트
│   └── Header.jsx       # 헤더 컴포넌트
├── App.jsx              # 메인 앱 컴포넌트
├── index.jsx            # React 앱 진입점
├── types.js             # OutputType enum
├── index.html           # HTML 템플릿
├── index.css            # 글로벌 스타일
├── vite.config.js       # Vite 설정
└── package.json         # 프로젝트 의존성
```

---

## 💡 주요 기능

### 1. 코드 에디터 (Editor.jsx)
- `textarea`를 사용한 간단한 코드 입력
- Run 버튼으로 코드 실행
- 실행 중 로딩 상태 표시

### 2. 콘솔 출력 (Console.jsx)
- `console.log`, `error`, `warn`, `info` 출력 지원
- 출력 타입별 아이콘 및 색상 구분
- Clear 버튼으로 콘솔 초기화

### 3. 코드 실행 메커니즘
```javascript
// App.jsx의 핵심 로직
const handleRunCode = useCallback(() => {
  // 1. console 메서드 오버라이드
  window.console.log = customConsole.log;
  
  try {
    // 2. Function constructor로 코드 실행
    const result = new Function(code)();
    
    // 3. 결과 출력
    newOutput.push({ type: 'success', message: 'Execution finished.' });
  } catch (error) {
    // 4. 에러 처리
    newOutput.push({ type: 'error', message: error.message });
  } finally {
    // 5. console 복원
    window.console = originalConsole;
  }
}, [code]);
```

---


## 🧠 핵심 개념 설명

### 1. Function Constructor vs eval
```javascript
// ❌ eval (보안 위험)
eval(userCode);

// ✅ Function constructor (더 안전)
new Function(userCode)();
```

### 2. Console Override
```javascript
// 원래 console 저장
const originalConsole = { ...console };

// 커스텀 로직으로 대체
window.console.log = (...args) => {
  // 우리가 원하는 처리
  captureOutput(args);
};

// 복원
window.console = originalConsole;
```

### 3. React State Management
```javascript
// State로 UI 반응형 관리
const [code, setCode] = useState('');
const [output, setOutput] = useState([]);

// State 변경 → 자동 리렌더링
setCode(newCode);
