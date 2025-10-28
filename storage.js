const ROOMS_KEY = 'jsc.rooms.v1';

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
  getRooms() {
    return read(ROOMS_KEY, []);
  },
  saveRooms(rooms) {
    write(ROOMS_KEY, rooms);
    return rooms;
  },
  createRoom({ name, groupName, authorName, logoUrl }) {
    const rooms = read(ROOMS_KEY, []);
    const room = { id: uid(), name, groupName, authorName, logoUrl };
    rooms.unshift(room);
    write(ROOMS_KEY, rooms);
    return room;
  },
  getRoom(id) {
    if (!id) return null;
    return this.getRooms().find((r) => r.id === id) || null;
  },
  setRoomCode(id, code) {
    write(`jsc.room.${id}.code`, { code, ts: Date.now() });
  },
  getRoomCode(id) {
    const data = read(`jsc.room.${id}.code`, null);
    return data ? data.code : null;
  },
  seedRooms() {
    const seeded = [
      {
        id: uid(),
        name: '군산대 소프트웨어학과 1학년 파이썬 1차시험',
        groupName: '군산대 소프트웨어학과 1학년',
        authorName: 'xxx 교수',
      },
      {
        id: uid(),
        name: '고려대 컴퓨터 정보통신과 2학년 C++ 쪽지시험',
        groupName: '고려대 정보통신학과 1학년',
        authorName: 'xxx 교수',
      },
      {
        id: uid(),
        name: '아주대 환경공학과 2학년 C++ 1차 시험',
        groupName: '아주대학교 환경공학과 2학년',
        authorName: 'xxx 교수',
      },
    ];
    write(ROOMS_KEY, seeded);
    return seeded;
  },
};
