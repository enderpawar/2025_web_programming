// Gemini AI 기능 (프론트엔드에서 직접 호출)
import { GoogleGenerativeAI } from '@google/generative-ai';
import { localAPI } from './localStorage.js';

// API 키 가져오기 함수
function getApiKey() {
  // 1. localStorage에서 먼저 확인
  const storedKey = localAPI.getGeminiApiKey();
  if (storedKey) return storedKey;
  
  // 2. 환경변수 확인
  if (import.meta.env.VITE_GEMINI_API_KEY) return import.meta.env.VITE_GEMINI_API_KEY;
  
  throw new Error('Gemini API 키가 설정되지 않았습니다. Profile > API Setting에서 API 키를 입력해주세요.');
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
    
    // PDF 텍스트가 너무 길면 앞부분만 사용 (토큰 제한)
    const maxLength = 8000;
    const truncatedText = pdfText.length > maxLength ? pdfText.substring(0, maxLength) + '...' : pdfText;
    
    console.log('PDF 텍스트 길이:', pdfText.length);
    console.log('PDF 텍스트 미리보기:', truncatedText.substring(0, 500));
    
    const prompt = `당신은 프로그래밍 교육 전문가입니다. 다음 PDF/문서에서 추출한 텍스트를 **정확히 분석**하고, 그 내용과 **직접 관련된** JavaScript 코딩 문제를 생성하세요.

PDF/문서 내용:
"""
${truncatedText}
"""

**분석 지침:**
1. 위 텍스트에서 다루는 주요 알고리즘, 자료구조, 프로그래밍 개념을 파악하세요
2. 예제 코드가 있다면 그것을 바탕으로 유사한 문제를 만드세요
3. 문서의 난이도를 고려하여 적절한 난이도의 문제를 생성하세요

**금지 사항:**
- PDF 파일 크기 계산 같은 메타 정보 문제는 절대 만들지 마세요
- 문서 내용과 무관한 일반적인 문제는 만들지 마세요
- 문서에서 다루지 않은 개념의 문제는 만들지 마세요

다음 JSON 형식으로 **정확히 1개의** 문제를 생성하세요:

[
  {
    "title": "문서에서 다룬 개념을 활용한 구체적인 문제 제목 (한국어)",
    "description": "문서의 핵심 개념을 적용하는 명확한 문제 설명. 반드시 '이 문제는 [문서에서 다룬 개념]을 활용합니다' 형태로 시작하세요. (한국어)",
    "difficulty": "Easy|Medium|Hard",
    "functionName": "solve",
    "starterCode": "function solve(param1, param2) {\\n  // TODO: 여기에 코드를 작성하세요\\n  // [문서의 핵심 개념]을 활용하세요\\n}",
    "solution": "function solve(param1, param2) {\\n  // [문서 개념] 기반 솔루션\\n  \\n  return result;\\n}",
    "samples": [
      {
        "input": ["실제 예시 값1", "값2"],
        "output": "예상 결과"
      }
    ],
    "tests": [
      {
        "input": ["테스트 값1", "값2"],
        "output": "예상 결과"
      },
      {
        "input": ["테스트 값3", "값4"],
        "output": "예상 결과2"
      },
      {
        "input": ["엣지 케이스"],
        "output": "결과3"
      }
    ]
  }
]

**필수 요구사항:**
- JSON 형식만 반환 (추가 설명 없이)
- 문제는 반드시 문서 내용과 직접 연관
- description 첫 문장에 문서 개념 명시
- 최소 3개의 다양한 테스트 케이스
- 모든 텍스트는 한국어

JSON만 반환하세요:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('Gemini 응답:', text);
    
    // JSON 추출 (코드 블록 제거)
    let jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      // ```json으로 감싸진 경우
      const codeBlockMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch) {
        jsonMatch = [codeBlockMatch[1]];
      }
    }
    
    if (!jsonMatch) {
      console.error('JSON 파싱 실패. 응답:', text);
      throw new Error('올바른 JSON 형식을 찾을 수 없습니다');
    }
    
    const problems = JSON.parse(jsonMatch[0]);
    console.log('생성된 문제:', problems);
    return problems;
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error('문제 생성에 실패했습니다: ' + error.message);
  }
}

// AI 코드 리뷰 생성 (교수용)
export async function generateCodeReview(studentCode, problemTitle, problemDescription, testPassed) {
  try {
    console.log('[generateCodeReview] 시작');
    const apiKey = getApiKey();
    console.log('[generateCodeReview] API 키 확인:', apiKey ? '✅ 있음' : '❌ 없음');
    
    if (!apiKey) {
      throw new Error('API 키가 설정되지 않았습니다. Profile > API Setting에서 설정해주세요.');
    }
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `당신은 경험 많은 프로그래밍 교수이자 코드 리뷰어입니다.

**문제**: ${problemTitle}
**문제 설명**: ${problemDescription}
**테스트 통과 여부**: ${testPassed ? '✅ 통과' : '❌ 미통과'}

**학생의 코드**:
\`\`\`javascript
${studentCode}
\`\`\`

다음 항목들을 분석하여 **교육적이고 건설적인 피드백**을 제공하세요:

1. **코드 품질 평가** (1-5점):
   - 가독성: X/5
   - 효율성: X/5
   - 정확성: X/5

2. **잘한 점** (2-3가지):
   - 구체적으로 어떤 부분이 좋았는지

3. **개선이 필요한 점** (2-3가지):
   - 구체적인 개선 방법과 이유

4. **코드 개선 제안**:
   - 핵심적으로 개선해야 할 부분의 코드 예시 (3-5줄)

5. **학습 조언**:
   - 이 학생이 다음에 공부하면 좋을 개념이나 자료

**응답 형식**:
반드시 다음 JSON 형식으로 응답하세요:
{
  "ratings": {
    "readability": 4,
    "efficiency": 3,
    "correctness": 5
  },
  "strengths": ["잘한 점 1", "잘한 점 2"],
  "improvements": ["개선점 1", "개선점 2"],
  "suggestedCode": "// 개선된 코드 예시",
  "learningAdvice": "학습 조언 내용"
}`;

    console.log('[generateCodeReview] Gemini API 호출 중...');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('[generateCodeReview] AI 응답 받음:', text.substring(0, 200));
    
    // JSON 추출
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[generateCodeReview] JSON 파싱 실패. 응답:', text);
      throw new Error('AI 응답을 파싱할 수 없습니다. 응답 형식이 올바르지 않습니다.');
    }
    
    const review = JSON.parse(jsonMatch[0]);
    console.log('[generateCodeReview] 성공:', review);
    return review;
  } catch (error) {
    console.error('[generateCodeReview] 에러 발생:', error);
    
    // 더 자세한 에러 메시지 제공
    if (error.message.includes('API 키')) {
      throw error; // API 키 관련 에러는 그대로 전달
    } else if (error.message.includes('quota')) {
      throw new Error('API 사용량 한도를 초과했습니다. 잠시 후 다시 시도해주세요.');
    } else if (error.message.includes('invalid')) {
      throw new Error('유효하지 않은 API 키입니다. API 키를 다시 확인해주세요.');
    } else if (error.message.includes('network')) {
      throw new Error('네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.');
    } else {
      throw new Error(`AI 코드 리뷰 생성 실패: ${error.message}`);
    }
  }
}
