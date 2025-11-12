const CODE_STORAGE_KEY = 'jsc.code.v1';
const SNIPPETS_KEY = 'jsc.snippets.v1';

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export const storage = {
  // 현재 코드 저장/불러오기
  saveCode(code) {
    write(CODE_STORAGE_KEY, { code, ts: Date.now() });
  },
  
  loadCode() {
    const data = read(CODE_STORAGE_KEY, null);
    return data ? data.code : null;
  },
  
  // 코드 스니펫 관리
  getSnippets() {
    return read(SNIPPETS_KEY, []);
  },
  
  saveSnippet(name, code) {
    const snippets = this.getSnippets();
    const snippet = {
      id: uid(),
      name,
      code,
      createdAt: Date.now(),
    };
    snippets.unshift(snippet);
    write(SNIPPETS_KEY, snippets);
    return snippet;
  },
  
  deleteSnippet(id) {
    const snippets = this.getSnippets().filter(s => s.id !== id);
    write(SNIPPETS_KEY, snippets);
  },
  
  loadSnippet(id) {
    return this.getSnippets().find(s => s.id === id);
  },
};
