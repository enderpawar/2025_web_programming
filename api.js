import { localAPI, waitForInit } from './localStorage.js';
import { generateHint, generateProblemsFromPdfText } from './gemini.js';

// localStorage 기반 API로 전환
export function setToken() {
  // localStorage 사용시 불필요 (하위 호환성 유지)
}

// API 호출 전 초기화 대기
async function ensureInit() {
  await waitForInit();
}

export const api = {
  // 인증
  async signup(payload) {
    await ensureInit();
    const data = localAPI.signup(payload.email, payload.password, payload.name);
    return data;
  },
  
  async login(payload) {
    console.log('[API] Login called with:', payload);
    await ensureInit();
    console.log('[API] Init complete, calling localAPI.login');
    const data = localAPI.login(payload.email, payload.password);
    console.log('[API] Login result:', data);
    return data;
  },
  
  logout() {
    localAPI.logout();
  },
  
  async me() {
    await ensureInit();
    return localAPI.me();
  },

  // 룸 관리
  async rooms() {
    await ensureInit();
    return localAPI.getRooms();
  },
  
  async createRoom(payload) {
    return localAPI.createRoom(
      payload.name || payload.title,
      payload.groupName,
      payload.authorName,
      payload.logoUrl,
      payload.makePublic ?? payload.public
    );
  },
  
  async room(id) {
    return localAPI.getRoom(id);
  },
  
  async deleteRoom(id) {
    localAPI.deleteRoom(id);
  },
  
  async shareRoom(id) {
    // localStorage에서는 공유 기능 불필요 (모든 데이터가 로컬)
    return { message: 'Room is already accessible locally' };
  },

  // 멤버 관리
  async getRoomMembers(roomId) {
    return localAPI.getRoomMembers(roomId);
  },
  
  async inviteMember(roomId, userEmail) {
    return localAPI.inviteMember(roomId, userEmail);
  },
  
  async removeMember(roomId, userId) {
    localAPI.removeMember(roomId, userId);
  },
  
  async getAllUsers() {
    return localAPI.getAllUsers();
  },

  // Gemini API 키 관리
  setGeminiApiKey(apiKey) {
    localAPI.setGeminiApiKey(apiKey);
  },
  
  getGeminiApiKey() {
    return localAPI.getGeminiApiKey();
  },

  // 문제 관리
  async problems(roomId) {
    return localAPI.getProblems(roomId);
  },
  
  async problem(roomId, problemId) {
    return localAPI.getProblem(roomId, problemId);
  },
  
  async createProblem(roomId, problem) {
    return localAPI.createProblem(roomId, problem);
  },
  
  async updateProblem(roomId, problemId, problem) {
    return localAPI.updateProblem(roomId, problemId, problem);
  },
  
  async deleteProblem(roomId, problemId) {
    localAPI.deleteProblem(roomId, problemId);
  },

  // 코드 관리
  async getCode(id) {
    // 레거시 지원: roomId만 있는 경우
    return { code: '' };
  },
  
  async saveCode(id, code) {
    // 레거시 지원: roomId만 있는 경우
    return { message: 'Use saveProblemCode instead' };
  },
  
  async getProblemCode(roomId, problemId) {
    const code = localAPI.getCode(roomId, problemId);
    return { code };
  },
  
  async saveProblemCode(roomId, problemId, code, passed = false) {
    localAPI.saveCode(roomId, problemId, code, passed);
    return { message: 'Code saved' };
  },

  // 코드 실행
  async submitSolution(id, code) {
    // 레거시 지원
    return { results: [] };
  },
  
  async submitProblemSolution(roomId, problemId, code) {
    const problem = localAPI.getProblem(roomId, problemId);
    const result = localAPI.executeCode(code, problem.tests, problem.functionName);
    
    // passed 필드 추가
    const passed = result.results.every(r => r.passed);
    
    return {
      passed,
      results: result.results.map((r, idx) => ({
        pass: r.passed,
        input: r.input,
        expected: r.expected,
        actual: r.actual,
        error: r.error
      }))
    };
  },

  // AI 기능 (Gemini API)
  async getHint(problemTitle, problemDescription, currentCode, difficulty) {
    return await generateHint(problemTitle, problemDescription, currentCode, difficulty);
  },
  
  async generateProblemsFromPdf(roomId, file) {
    // PDF 파일을 텍스트로 변환
    const arrayBuffer = await file.arrayBuffer();
    
    // pdf.js는 이미 설치되어 있으므로 사용
    // 간단히 텍스트만 추출
    const pdfText = await extractTextFromPdf(arrayBuffer);
    
    // Gemini로 문제 생성
    const problems = await generateProblemsFromPdfText(pdfText);
    
    // 생성된 문제들을 룸에 추가
    const createdProblems = [];
    for (const problem of problems) {
      const created = localAPI.createProblem(roomId, problem);
      createdProblems.push(created);
    }
    
    return { problems: createdProblems };
  },

  // 진행도 추적
  getRoomProgress(roomId) {
    return localAPI.getRoomProgress(roomId);
  },
  
  getStudentProgress(roomId) {
    return localAPI.getStudentProgress(roomId);
  },
  
  isProblemCompleted(roomId, problemId) {
    return localAPI.isProblemCompleted(roomId, problemId);
  },

  getStudentCode(studentId, roomId, problemId) {
    return localAPI.getStudentCode(studentId, roomId, problemId);
  },

  saveFeedback(studentId, roomId, problemId, feedback) {
    return localAPI.saveFeedback(studentId, roomId, problemId, feedback);
  },

  getGeminiApiKey() {
    return localAPI.getGeminiApiKey();
  },

  // 하위 호환성
  token: '',
  API_URL: '',
};

// PDF 텍스트 추출 헬퍼 함수
async function extractTextFromPdf(arrayBuffer) {
  try {
    // pdfjs-dist 라이브러리 사용
    const pdfjsLib = await import('pdfjs-dist');
    
    // Worker 설정 - 로컬 파일 사용
    const workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).href;
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
    
    // PDF 로드
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    let fullText = '';
    
    // 모든 페이지의 텍스트 추출
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + '\n';
    }
    
    // 텍스트 정리
    fullText = fullText.replace(/\s+/g, ' ').trim();
    
    if (fullText.length < 100) {
      throw new Error('PDF에서 충분한 텍스트를 추출하지 못했습니다. 텍스트가 포함된 PDF인지 확인해주세요.');
    }
    
    console.log('PDF 텍스트 추출 성공:', fullText.substring(0, 200) + '...');
    return fullText;
  } catch (error) {
    console.error('PDF 파싱 오류:', error);
    throw new Error('PDF 파일 파싱에 실패했습니다. 텍스트 기반 PDF를 사용해주세요. (' + error.message + ')');
  }
}
