const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

let token = localStorage.getItem('jsc.token') || '';

export function setToken(t) {
  token = t || '';
  if (t) localStorage.setItem('jsc.token', t);
  else localStorage.removeItem('jsc.token');
}

async function req(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth && token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  async signup(payload) {
    const data = await req('/api/auth/signup', { method: 'POST', body: payload, auth: false });
    setToken(data.token);
    return data;
  },
  async login(payload) {
    const data = await req('/api/auth/login', { method: 'POST', body: payload, auth: false });
    setToken(data.token);
    return data;
  },
  async me() {
    return req('/api/me');
  },
  async rooms() {
    return req('/api/rooms');
  },
  async createRoom(payload) {
    return req('/api/rooms', { method: 'POST', body: payload });
  },
  async room(id) {
    return req(`/api/rooms/${id}`);
  },
  async getCode(id) {
    return req(`/api/rooms/${id}/code`);
  },
  async saveCode(id, code) {
    return req(`/api/rooms/${id}/code`, { method: 'PUT', body: { code } });
  },
  async shareRoom(id) {
    return req(`/api/rooms/${id}/share`, { method: 'POST' });
  },
  token,
  API_URL,
};
