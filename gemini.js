// Gemini AI 기능 (프론트엔드에서 직접 호출)
import { GoogleGenerativeAI } from '@google/generative-ai';

// API 키 가져오기 함수
function getApiKey() {
  // 환경변수에서만 키 확인
  if (import.meta.env.VITE_GEMINI_API_KEY) return import.meta.env.VITE_GEMINI_API_KEY;
  
  throw new Error('Gemini API 키가 설정되지 않았습니다. .env 파일에 VITE_GEMINI_API_KEY를 설정해주세요.');
}

// AI 힌트 생성
export async function generateHint(problemTitle, problemDescription, currentCode, difficulty) {
  try {
    const apiKey = getApiKey();
    const genAI = new GoogleGenerativeAI(apiKey);
    
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash"
    });    const prompt = `당신은 알고리즘과 자료구조 전문가이자 프로그래밍 교육자입니다.

문제: ${problemTitle}
난이도: ${difficulty}
설명: ${problemDescription}

학생의 현재 코드:
\`\`\`javascript
${currentCode || '// 아직 코드 없음'}
\`\`\`

학생이 문제를 해결할 수 있도록 전문적이고 구체적인 힌트를 제공하세요.
다음 사항을 포함하여 답변하세요:

1. **핵심 알고리즘/자료구조**: 이 문제를 해결하는데 적합한 알고리즘이나 자료구조 (예: 해시맵, 투 포인터, 동적 프로그래밍 등)
2. **시간/공간 복잡도**: 최적 솔루션의 예상 시간/공간 복잡도
3. **구현 접근법**: 구체적인 구현 단계나 주의할 점
4. **코드 개선점**: 현재 코드가 있다면 개선이 필요한 부분
5. 코드 출력은 4~5줄 이내로 간결하게 제시
직접적인 코드는 제공하지 말고, 학생이 스스로 구현할 수 있도록 개념과 방향을 명확히 제시하세요.
전문 용어를 사용하되 이해하기 쉽게 설명하고, 반드시 한국어로 답변하세요.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const hint = response.text();
    
    return { hint };
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error('힌트 생성에 실패했습니다. API 키를 확인해주세요.');
  }
}

// PDF에서 문제 생성
export async function generateProblemsFromPdfText(pdfText) {
  try {
    const apiKey = getApiKey();
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    const prompt = `당신은 프로그래밍 문제 생성 전문가입니다. 다음 PDF에서 추출한 텍스트를 기반으로 JavaScript 온라인 컴파일러에 적합한 코딩 문제를 생성하세요.

PDF 내용:
${pdfText}

다음 JSON 형식으로 1-3개의 코딩 문제를 생성하세요:
[
  {
    "title": "문제 제목 (한국어)",
    "description": "명확한 문제 설명 (한국어, 구체적으로)",
    "difficulty": "Easy|Medium|Hard",
    "functionName": "solve",
    "starterCode": "function solve(param1, param2) {\\n  // TODO: 여기에 코드를 작성하세요\\n}",
    "solution": "function solve(param1, param2) {\\n  // 모범 답안 코드 (주석 포함)\\n  // 알고리즘 설명\\n  return result;\\n}",
    "samples": [
      {
        "input": [값1, 값2],
        "output": 예상출력
      }
    ],
    "tests": [
      {
        "input": [값1, 값2],
        "output": 예상출력
      }
    ]
  }
]

생성 규칙:
- 모든 텍스트는 **반드시 한국어**로 작성
- title과 description은 명확하고 구체적으로
- solution 필드에 **완전한 모범 답안 코드** 포함 (주석으로 알고리즘 설명 추가)
- 각 문제당 최소 2-3개의 테스트 케이스
- JavaScript 문법 사용
- samples는 사용자에게 보여지는 예제, tests는 채점용 테스트 케이스

**JSON 배열만 반환하고, 추가 텍스트는 절대 포함하지 마세요.**`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // JSON 추출 (코드 블록 제거)
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('올바른 JSON 형식을 찾을 수 없습니다');
    }
    
    const problems = JSON.parse(jsonMatch[0]);
    return problems;
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error('문제 생성에 실패했습니다: ' + error.message);
  }
}
