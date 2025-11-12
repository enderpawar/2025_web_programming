# Week 2: Local Storage

## 📚 학습 목표

이번 주차에서는 **브라우저에서 JavaScript 코드를 실행하고 콘솔 출력을 보여주는 기본 컴파일러**를 만듭니다.

### 핵심 개념
- ✅ React 기본 구조 (컴포넌트, Props, State)
- ✅ 브라우저에서 JavaScript 코드 실행 (`Function` constructor)
- ✅ `console` 메서드 오버라이딩
- ✅ 에러 핸들링 (try-catch)
- ✅ Vite를 사용한 React 개발 환경

---

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

## 🎯 학습 체크리스트

- [ ] React 컴포넌트의 기본 구조를 이해했나요?
- [ ] `useState`와 `useCallback` 훅의 역할을 알고 있나요?
- [ ] `Function` constructor가 `eval`보다 안전한 이유는?
- [ ] Props를 통한 컴포넌트 간 데이터 전달 방식을 이해했나요?
- [ ] 에디터의 코드와 콘솔 출력이 어떻게 연결되는지 파악했나요?

---

## 🔥 도전 과제

### 레벨 1: 기본
1. **라인 넘버 추가**: 에디터에 라인 넘버를 표시해보세요
2. **폰트 크기 조절**: 에디터 폰트 크기를 변경하는 버튼 추가
3. **다크/라이트 테마**: 간단한 테마 전환 기능 구현

### 레벨 2: 중급
1. **코드 실행 히스토리**: 최근 실행한 코드 5개를 저장하고 다시 불러오기
2. **실행 시간 측정**: 코드 실행 시간을 측정하여 콘솔에 표시
3. **키보드 단축키**: Ctrl+Enter로 코드 실행

### 레벨 3: 고급
1. **Syntax Highlighting**: 간단한 키워드 하이라이팅 구현
2. **자동 완성**: 기본 JavaScript 키워드 자동완성
3. **코드 포맷팅**: Prettier 같은 포맷터 통합

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
```

---

## 📖 참고 자료

- [React 공식 문서](https://react.dev/)
- [Vite 공식 문서](https://vitejs.dev/)
- [Function Constructor MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function)
- [Console API MDN](https://developer.mozilla.org/en-US/docs/Web/API/Console)

---

## ❓ FAQ

**Q: Function constructor가 정확히 뭔가요?**  
A: 문자열로 된 코드를 실제 함수로 변환하여 실행하는 JavaScript의 내장 기능입니다. `eval`보다 스코프가 제한되어 더 안전합니다.

**Q: console.log를 왜 오버라이드하나요?**  
A: 사용자 코드의 console.log 출력을 캡처하여 우리의 Console 컴포넌트에 표시하기 위해서입니다.

**Q: 왜 textarea를 사용하나요?**  
A: Week 1에서는 간단한 구현에 집중합니다. 나중 주차에서 더 나은 에디터로 업그레이드할 수 있습니다.

---

## 🎓 다음 주차 미리보기

**Week 2: Local Storage 기능**
- 코드를 브라우저에 저장
- 여러 코드 스니펫 관리
- 자동 저장 기능

준비되셨나요? 코딩을 시작해보세요! 🚀
