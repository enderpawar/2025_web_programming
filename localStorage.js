// UUID 생성 헬퍼 함수 (crypto.randomUUID 폴리필)
function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try {
      return crypto.randomUUID();
    } catch (e) {
      // HTTPS가 아닌 경우 등 에러 발생 시 폴백
    }
  }
  // 폴백: 간단한 UUID v4 생성
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// LocalStorage 기반 데이터 관리
const STORAGE_KEYS = {
  USERS: 'jsc_users',
  ROOMS: 'jsc_rooms',
  CURRENT_USER: 'jsc_current_user',
  CODES: 'jsc_codes',
  INITIALIZED: 'jsc_initialized',
  VERSION: 'jsc_version',
  GEMINI_API_KEY: 'jsc_gemini_api_key'
};

const CURRENT_VERSION = '1.1'; // 버전 업데이트 시 localStorage 강제 리셋

let initPromise = null;

// 초기 데이터 로드
async function initializeStorage() {
  // 버전 체크 - 버전이 다르면 완전 초기화
  const storedVersion = localStorage.getItem(STORAGE_KEYS.VERSION);
  if (storedVersion !== CURRENT_VERSION) {
    console.log('Version mismatch. Resetting storage...', storedVersion, '->', CURRENT_VERSION);
    localStorage.clear();
    localStorage.setItem(STORAGE_KEYS.VERSION, CURRENT_VERSION);
  }

  // 이미 초기화되었으면 스킵
  if (localStorage.getItem(STORAGE_KEYS.INITIALIZED)) {
    return;
  }

  // base path 설정 (GitHub Pages용)
  const basePath = import.meta.env.BASE_URL || '/';
  
  console.log('Initializing localStorage with base path:', basePath);

  // 사용자 데이터가 없으면 초기화
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    try {
      const url = `${basePath}data/users.json`;
      console.log('Fetching users from:', url);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const users = await response.json();
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      console.log('Users loaded:', users.length);
    } catch (error) {
      console.error('Failed to load users.json:', error);
      // 기본 사용자 데이터
      const defaultUsers = [
        { id: "1", email: "owner@owner", password: "owner", name: "교수님", role: "professor" },
        { id: "2", email: "jinwoo@jinwoo", password: "jinwoo", name: "진우", role: "student" },
        { id: "3", email: "test2@naver.com", password: "test", name: "테스트2", role: "student" }
      ];
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(defaultUsers));
      console.log('Using default users');
    }
  }

  // 룸 데이터가 없으면 초기화
  if (!localStorage.getItem(STORAGE_KEYS.ROOMS)) {
    try {
      const url = `${basePath}data/rooms.json`;
      console.log('Fetching rooms from:', url);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const rooms = await response.json();
      localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(rooms));
      console.log('Rooms loaded:', rooms.length);
    } catch (error) {
      console.error('Failed to load rooms.json:', error);
      localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify([]));
      console.log('Using empty rooms array');
    }
  }

  // 코드 저장소가 없으면 초기화
  if (!localStorage.getItem(STORAGE_KEYS.CODES)) {
    localStorage.setItem(STORAGE_KEYS.CODES, JSON.stringify({}));
  }

  // 초기화 완료 표시
  localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
  console.log('LocalStorage initialized');
}

// Helper functions
function getUsers() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
}

function setUsers(users) {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
}

function getRooms() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.ROOMS) || '[]');
}

function setRooms(rooms) {
  localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(rooms));
}

function getCurrentUser() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER) || 'null');
}

function setCurrentUser(user) {
  if (user) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }
}

function getCodes() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.CODES) || '{}');
}

function setCodes(codes) {
  localStorage.setItem(STORAGE_KEYS.CODES, JSON.stringify(codes));
}

// API 함수들
export const localAPI = {
  // 회원가입
  signup(email, password, name) {
    const users = getUsers();
    
    if (users.find(u => u.email === email)) {
      throw new Error('이미 존재하는 이메일입니다');
    }

    const newUser = {
      id: generateUUID(),
      email,
      name: name || email.split('@')[0],
      password,
      role: 'student',
      createdAt: Date.now()
    };

    users.push(newUser);
    setUsers(users);
    
    const userInfo = { ...newUser };
    delete userInfo.password;
    setCurrentUser(userInfo);
    
    return { user: userInfo };
  },

  // 로그인
  login(email, password) {
    const users = getUsers();
    const user = users.find(u => u.email === email && u.password === password);
    
    if (!user) {
      throw new Error('이메일 또는 비밀번호가 올바르지 않습니다');
    }

    const userInfo = { ...user };
    delete userInfo.password;
    setCurrentUser(userInfo);
    
    return { user: userInfo };
  },

  // 로그아웃
  logout() {
    setCurrentUser(null);
  },

  // 현재 사용자
  me() {
    const user = getCurrentUser();
    if (!user) throw new Error('로그인이 필요합니다');
    return user;
  },

  // 전체 사용자 조회 (멤버 초대용)
  getAllUsers() {
    return getUsers().map(u => {
      const userInfo = { ...u };
      delete userInfo.password;
      return userInfo;
    });
  },

  // 룸 목록
  getRooms() {
    const rooms = getRooms();
    // 각 룸에 문제 개수 추가
    return rooms.map(room => ({
      ...room,
      problemCount: (room.problems || []).length
    }));
  },

  // 특정 룸 조회
  getRoom(roomId) {
    const rooms = getRooms();
    const room = rooms.find(r => r.id === roomId);
    if (!room) throw new Error('룸을 찾을 수 없습니다');
    return room;
  },

  // 룸 생성
  createRoom(name, groupName, authorName, logoUrl = '', isPublic = true) {
    const currentUser = getCurrentUser();
    if (!currentUser) throw new Error('로그인이 필요합니다');

    const rooms = getRooms();
    const newRoom = {
      id: generateUUID(),
      name: name || 'Untitled Room',
      groupName: groupName || 'Default Group',
      authorName: authorName || currentUser.name,
      logoUrl,
      ownerId: currentUser.id,
      public: isPublic,
      members: [currentUser.id],
      createdAt: Date.now(),
      problems: []
    };

    rooms.push(newRoom);
    setRooms(rooms);
    
    return newRoom;
  },

  // 룸 삭제
  deleteRoom(roomId) {
    const currentUser = getCurrentUser();
    if (!currentUser) throw new Error('로그인이 필요합니다');

    const rooms = getRooms();
    const roomIndex = rooms.findIndex(r => r.id === roomId);
    
    if (roomIndex === -1) throw new Error('룸을 찾을 수 없습니다');
    if (rooms[roomIndex].ownerId !== currentUser.id) {
      throw new Error('권한이 없습니다');
    }

    rooms.splice(roomIndex, 1);
    setRooms(rooms);
  },

  // 룸 멤버 조회
  getRoomMembers(roomId) {
    const room = this.getRoom(roomId);
    const users = getUsers();
    return room.members.map(memberId => {
      const user = users.find(u => u.id === memberId);
      if (user) {
        const userInfo = { ...user };
        delete userInfo.password;
        return userInfo;
      }
      return null;
    }).filter(Boolean);
  },

  // 멤버 초대
  inviteMember(roomId, userEmail) {
    const currentUser = getCurrentUser();
    if (!currentUser) throw new Error('로그인이 필요합니다');

    const rooms = getRooms();
    const room = rooms.find(r => r.id === roomId);
    if (!room) throw new Error('룸을 찾을 수 없습니다');
    if (room.ownerId !== currentUser.id) throw new Error('권한이 없습니다');

    const users = getUsers();
    const userToInvite = users.find(u => u.email === userEmail);
    if (!userToInvite) throw new Error('사용자를 찾을 수 없습니다');
    if (room.members.includes(userToInvite.id)) {
      throw new Error('이미 멤버입니다');
    }

    room.members.push(userToInvite.id);
    setRooms(rooms);
    
    return { message: '멤버가 추가되었습니다' };
  },

  // 멤버 제거
  removeMember(roomId, userId) {
    const currentUser = getCurrentUser();
    if (!currentUser) throw new Error('로그인이 필요합니다');

    const rooms = getRooms();
    const room = rooms.find(r => r.id === roomId);
    if (!room) throw new Error('룸을 찾을 수 없습니다');
    if (room.ownerId !== currentUser.id) throw new Error('권한이 없습니다');

    room.members = room.members.filter(id => id !== userId);
    setRooms(rooms);
  },

  // 문제 목록
  getProblems(roomId) {
    const room = this.getRoom(roomId);
    return room.problems || [];
  },

  // 특정 문제 조회
  getProblem(roomId, problemId) {
    const room = this.getRoom(roomId);
    const problem = room.problems.find(p => p.id === problemId);
    if (!problem) throw new Error('문제를 찾을 수 없습니다');
    return problem;
  },

  // 문제 생성
  createProblem(roomId, problem) {
    const currentUser = getCurrentUser();
    if (!currentUser) throw new Error('로그인이 필요합니다');

    const rooms = getRooms();
    const room = rooms.find(r => r.id === roomId);
    
    if (!room) throw new Error('룸을 찾을 수 없습니다');
    if (room.ownerId !== currentUser.id) throw new Error('권한이 없습니다');

    const newProblem = {
      id: generateUUID(),
      ...problem,
      createdAt: Date.now()
    };

    room.problems.push(newProblem);
    setRooms(rooms);
    
    return newProblem;
  },

  // 문제 수정
  updateProblem(roomId, problemId, updates) {
    const currentUser = getCurrentUser();
    if (!currentUser) throw new Error('로그인이 필요합니다');

    const rooms = getRooms();
    const room = rooms.find(r => r.id === roomId);
    
    if (!room) throw new Error('룸을 찾을 수 없습니다');
    if (room.ownerId !== currentUser.id) throw new Error('권한이 없습니다');

    const problem = room.problems.find(p => p.id === problemId);
    if (!problem) throw new Error('문제를 찾을 수 없습니다');

    Object.assign(problem, updates);
    setRooms(rooms);
    
    return problem;
  },

  // 문제 삭제
  deleteProblem(roomId, problemId) {
    const currentUser = getCurrentUser();
    if (!currentUser) throw new Error('로그인이 필요합니다');

    const rooms = getRooms();
    const room = rooms.find(r => r.id === roomId);
    
    if (!room) throw new Error('룸을 찾을 수 없습니다');
    if (room.ownerId !== currentUser.id) throw new Error('권한이 없습니다');

    const problemIndex = room.problems.findIndex(p => p.id === problemId);
    if (problemIndex === -1) throw new Error('문제를 찾을 수 없습니다');

    room.problems.splice(problemIndex, 1);
    setRooms(rooms);
  },

  // 코드 저장 (테스트 통과 여부 포함)
  saveCode(roomId, problemId, code, passed = false) {
    const currentUser = getCurrentUser();
    if (!currentUser) throw new Error('로그인이 필요합니다');

    const codes = getCodes();
    const key = `${currentUser.id}-${roomId}-${problemId}`;
    
    // 기존 데이터가 있으면 passed 상태를 유지 (한 번이라도 통과했으면 계속 통과로 유지)
    const existingData = codes[key];
    const existingPassed = existingData?.passed === true;
    
    codes[key] = {
      code,
      passed: existingPassed ? true : passed, // 기존에 통과했으면 무조건 true 유지, 아니면 새 passed 값 사용
      updatedAt: Date.now()
    };

    setCodes(codes);
    console.log(`[saveCode] Saved code for ${key}, passed:`, codes[key].passed);
  },

  // 코드 불러오기
  getCode(roomId, problemId) {
    const currentUser = getCurrentUser();
    if (!currentUser) return '';

    const codes = getCodes();
    const key = `${currentUser.id}-${roomId}-${problemId}`;
    
    return codes[key]?.code || '';
  },

  // 룸의 학생 진행도 계산 (owner 제외)
  getRoomProgress(roomId) {
    const room = this.getRoom(roomId);
    const codes = getCodes();
    
    // 전체 멤버 수 - 1 (owner 제외) = 학생 수
    const totalStudents = Math.max(0, room.members.length - 1);
    
    if (totalStudents === 0) {
      return { completedStudents: 0, totalStudents: 0, percentage: 0 };
    }
    
    const totalProblems = (room.problems || []).length;
    if (totalProblems === 0) {
      return { completedStudents: 0, totalStudents, percentage: 0 };
    }
    
    // owner를 제외한 학생들
    const students = room.members.filter(memberId => memberId !== room.ownerId);
    
    // 각 학생이 최소 1개 이상의 문제를 풀었는지 확인 (테스트 통과 기준)
    let completedStudents = 0;
    students.forEach(studentId => {
      let solvedCount = 0;
      
      room.problems.forEach(problem => {
        const key = `${studentId}-${roomId}-${problem.id}`;
        const codeData = codes[key];
        
        // 테스트를 통과한 경우만 풀이한 것으로 간주
        if (codeData && codeData.passed === true) {
          solvedCount++;
        }
      });
      
      console.log(`[getRoomProgress] Student ${studentId} solved ${solvedCount}/${totalProblems} problems`);
      
      // 최소 1개 이상의 문제를 풀었으면 완료한 학생으로 카운트
      if (solvedCount > 0) {
        completedStudents++;
      }
    });
    
    const percentage = totalStudents > 0 ? Math.round((completedStudents / totalStudents) * 100) : 0;
    console.log(`[getRoomProgress] Room ${roomId}: ${completedStudents}/${totalStudents} students completed (${percentage}%)`);
    
    return {
      completedStudents,
      totalStudents,
      percentage
    };
  },

  // 특정 문제가 완료되었는지 확인 (현재 로그인한 사용자 기준)
  isProblemCompleted(roomId, problemId) {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      console.log('[isProblemCompleted] No current user');
      return false;
    }
    
    const codes = getCodes();
    const key = `${currentUser.id}-${roomId}-${problemId}`;
    const codeData = codes[key];
    
    console.log('[isProblemCompleted]', { roomId, problemId, userId: currentUser.id, key, codeData, passed: codeData?.passed });
    return codeData && codeData.passed === true;
  },

  // Gemini API 키 설정
  setGeminiApiKey(apiKey) {
    localStorage.setItem(STORAGE_KEYS.GEMINI_API_KEY, apiKey);
  },

  // Gemini API 키 조회
  getGeminiApiKey() {
    return localStorage.getItem(STORAGE_KEYS.GEMINI_API_KEY) || '';
  },

  // 코드 실행
  executeCode(code, testCases, functionName = 'solve') {
    const results = [];

    for (const tc of testCases) {
      try {
        // 코드 실행 및 함수 추출
        let func;
        try {
          // 먼저 직접 평가 시도 (함수 선언)
          func = new Function(`
            ${code}
            return ${functionName};
          `)();
        } catch (e) {
          // 실패하면 객체로 감싼 형태로 시도
          const moduleExports = new Function('return ' + code)();
          func = moduleExports[functionName];
        }
        
        if (typeof func !== 'function') {
          throw new Error(`${functionName} is not a function`);
        }
        
        // 입력값이 배열이면 spread, 아니면 그대로 전달
        const input = Array.isArray(tc.input) ? tc.input : [tc.input];
        console.log('[executeCode] Input:', input, 'Expected:', tc.output);
        const result = func(...input);
        console.log('[executeCode] Actual result:', result);
        const passed = JSON.stringify(result) === JSON.stringify(tc.output);
        console.log('[executeCode] Passed:', passed, 'Expected:', JSON.stringify(tc.output), 'Got:', JSON.stringify(result));
        
        results.push({
          passed,
          input: tc.input,
          expected: tc.output,
          actual: result
        });
      } catch (error) {
        console.error('[executeCode] Error:', error.message);
        results.push({
          passed: false,
          input: tc.input,
          expected: tc.output,
          error: error.message
        });
      }
    }

    console.log('[executeCode] Final results:', results);
    return { results };
  }
};

// 초기화 실행 (한 번만)
if (!initPromise) {
  initPromise = initializeStorage();
}

// 초기화 대기 함수
export async function waitForInit() {
  if (initPromise) {
    await initPromise;
  }
}

// 디버그용 리셋 함수
export function resetStorage() {
  localStorage.removeItem(STORAGE_KEYS.USERS);
  localStorage.removeItem(STORAGE_KEYS.ROOMS);
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  localStorage.removeItem(STORAGE_KEYS.CODES);
  localStorage.removeItem(STORAGE_KEYS.INITIALIZED);
  initPromise = initializeStorage();
  console.log('Storage reset initiated');
}

// 개발자 콘솔에서 사용 가능하도록
if (typeof window !== 'undefined') {
  window.resetStorage = resetStorage;
}
