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
    await ensureInit();
    const data = localAPI.login(payload.email, payload.password);
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
  
  async saveProblemCode(roomId, problemId, code) {
    localAPI.saveCode(roomId, problemId, code);
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
    return result;
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

  // 하위 호환성
  token: '',
  API_URL: '',
};

// PDF 텍스트 추출 헬퍼 함수
async function extractTextFromPdf(arrayBuffer) {
  try {
    // pdf-parse 라이브러리가 Node.js용이므로 브라우저에서는 간단한 방법 사용
    // 실제로는 pdf.js를 사용해야 하지만, 여기서는 기본 구현
    
    // ArrayBuffer를 문자열로 변환 (간단한 텍스트 추출)
    const uint8Array = new Uint8Array(arrayBuffer);
    const decoder = new TextDecoder('utf-8');
    let text = decoder.decode(uint8Array);
    
    // PDF 바이너리에서 텍스트만 추출 (간단한 패턴)
    text = text.replace(/[^\x20-\x7E\n]/g, ' ');
    text = text.replace(/\s+/g, ' ').trim();
    
    if (text.length < 100) {
      throw new Error('PDF에서 충분한 텍스트를 추출하지 못했습니다');
    }
    
    return text;
  } catch (error) {
    console.error('PDF 파싱 오류:', error);
    throw new Error('PDF 파일 파싱에 실패했습니다. 텍스트 기반 PDF를 사용해주세요.');
  }
}
