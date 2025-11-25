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
    });    const prompt = `당신은 학생이 코딩 문제를 해결할 수 있도록 돕는 프로그래밍 튜터입니다.

문제: ${problemTitle}
난이도: ${difficulty}
설명: ${problemDescription}

학생의 현재 코드:
\`\`\`javascript
${currentCode || '// 아직 코드 없음'}
\`\`\`

완전한 정답을 알려주지 않으면서 학생이 해결 방법을 찾을 수 있도록 유용한 힌트를 제공하세요.
다음 사항에 집중하세요:
1. 고려해야 할 핵심 개념이나 알고리즘
2. 피해야 할 일반적인 함정
3. 다음에 취할 수 있는 작은 단계

힌트는 간결하게(2-3문장) 작성하고 격려하는 톤으로 작성하세요.
반드시 한국어로 답변하세요.`;

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
    
    const prompt = `You are a programming problem generator. Based on the following text extracted from a PDF, generate coding problems suitable for a JavaScript online compiler.

PDF Content:
${pdfText}

Generate 1-3 coding problems in the following JSON format:
[
  {
    "title": "Problem Title",
    "description": "Clear problem description",
    "difficulty": "Easy|Medium|Hard",
    "functionName": "functionName",
    "starterCode": "function functionName(param1, param2) {\\n  // TODO\\n}",
    "samples": [
      {
        "input": [value1, value2],
        "output": expectedOutput
      }
    ],
    "tests": [
      {
        "input": [value1, value2],
        "output": expectedOutput
      }
    ]
  }
]

Make sure the problems are:
- Clear and well-defined
- Have proper test cases
- Use JavaScript syntax
- Include at least 2-3 test cases per problem

Return ONLY the JSON array, no additional text.`;

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
