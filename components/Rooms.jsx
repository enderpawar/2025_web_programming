import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, setToken } from '../api.js';
import AuthModal from './AuthModal.jsx';
import ThemeToggleButton from './ThemeToggleButton.jsx';

const PillInput = ({ placeholder, value, onChange }) => (
  <input
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    className="rooms-search-input"
  />
);

const Avatar = ({ logoUrl, title }) => {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={title}
        className="room-avatar-img"
      />
    );
  }
  const initials = (title || '?')
    .split(' ')
    .map((t) => t[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="room-avatar-placeholder">
      {initials}
    </div>
  );
};

const RoomCard = ({ room, onClick, canDelete, onDelete, viewMode = 'list', index = 0 }) => {
  if (viewMode === 'grid') {
    return (
      <div className="room-card-grid" style={{ animationDelay: `${index * 0.05}s` }}>
        <button onClick={onClick} className="room-card-grid-button">
          <div className="room-card-grid-header">
            <Avatar logoUrl={room.logoUrl} title={room.name} />
            {canDelete && (
              <button
                title="Delete room"
                aria-label="Delete room"
                onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
                className="room-card-delete-btn"
              >
                ×
              </button>
            )}
          </div>
          <div className="room-card-grid-body">
            <div className="room-card-grid-name">{room.name}</div>
            <div className="room-card-grid-author">👤 {room.authorName}</div>
            <div className="room-card-grid-group">📁 {room.groupName}</div>
            <div className="room-card-grid-stats">
              <span className="room-card-stat">
                <span className="room-card-stat-icon">📝</span>
                <span>{room.problemCount || 0}</span>
              </span>
              <span className="room-card-stat">
                <span className="room-card-stat-icon">👥</span>
                <span>{room.members?.length || 0}</span>
              </span>
            </div>
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="card room-card-flex">
      <button
        onClick={onClick}
        className="room-card-button"
      >
        <Avatar logoUrl={room.logoUrl} title={room.name} />
        <div className="room-card-info">
          <div className="room-card-name">{room.name}</div>
          <div className="room-card-author">{room.authorName}</div>
          <div className="room-card-group">{room.groupName}</div>
        </div>
        <div className="room-card-stats-inline">
          <span className="room-stat-badge">📝 {room.problemCount || 0}</span>
          <span className="room-stat-badge">👥 {room.members?.length || 0}</span>
        </div>
        <div className="room-card-arrow">›</div>
      </button>
      {canDelete && (
        <button
          title="Delete room"
          aria-label="Delete room"
          onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
          style={{ background: 'none', border: 'none', color: 'rgba(255, 255, 255, 0.5)', cursor: 'pointer', padding: '0.5rem', fontSize: '1rem' }}
        >
          X
        </button>
      )}
    </div>
  );
};


const CreateRoomModal = ({ open, onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [groupName, setGroupName] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [makePublic, setMakePublic] = useState(true);

  if (!open) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-content modal-content-wide">
        <h3 className="modal-title">Create Room</h3>
        <div className="modal-form">
          <input className="input" placeholder="Room Name" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="input" placeholder="Group Name" value={groupName} onChange={(e) => setGroupName(e.target.value)} />
          <input className="input" placeholder="Author Name" value={authorName} onChange={(e) => setAuthorName(e.target.value)} />
          <input className="input" placeholder="Logo URL (optional)" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} />
          <label className="checkbox-label">
            <input type="checkbox" className="checkbox-input" checked={makePublic} onChange={(e)=>setMakePublic(e.target.checked)} /> Make Public
          </label>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={() => {
              if (!name.trim()) return;
              onCreate({
                name: name.trim(),
                groupName: groupName.trim(),
                authorName: authorName.trim(),
                logoUrl: logoUrl.trim() || undefined,
                makePublic,
              });
            }}
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
};

const Rooms = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({ room: '', group: '', author: '' });
  const [rooms, setRooms] = useState([]);
  const [open, setOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('latest');
  const [viewMode, setViewMode] = useState('grid');

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const who = await api.me();
        setMe(who);
        const list = await api.rooms();
        console.log('Loaded rooms:', list);
        setRooms(list || []);
      } catch (e) {
        console.error('Failed to load:', e);
        // Not logged in
        setAuthOpen(true);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const r = filters.room.toLowerCase();
    const g = filters.group.toLowerCase();
    const a = filters.author.toLowerCase();
    let result = rooms.filter((x) =>
      (!r || x.name.toLowerCase().includes(r)) &&
      (!g || x.groupName.toLowerCase().includes(g)) &&
      (!a || x.authorName.toLowerCase().includes(a))
    );
    
    // 정렬
    if (sortBy === 'latest') {
      result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    } else if (sortBy === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'members') {
      result.sort((a, b) => {
        const aCount = (a.members?.length || 0);
        const bCount = (b.members?.length || 0);
        return bCount - aCount;
      });
    }
    
    return result;
  }, [rooms, filters, sortBy]);

  return (
    <div className="rooms-page">
      {/* Top bar */}
      <header className="header">
        <div className="header-container">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="logo focus:outline-none"
            aria-label="Go to main"
            title="Go to main"
          >
            JSC
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ThemeToggleButton />
            {me && me.role === 'professor' && (
              <button className="btn btn-primary btn-sm" onClick={() => setOpen(true)}>
                CREATE
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="rooms-filters-container">
        <PillInput placeholder="Room Name" value={filters.room} onChange={(v) => setFilters((s) => ({ ...s, room: v }))} />
        <PillInput placeholder="Group Name" value={filters.group} onChange={(v) => setFilters((s) => ({ ...s, group: v }))} />
        <PillInput placeholder="Author Name" value={filters.author} onChange={(v) => setFilters((s) => ({ ...s, author: v }))} />
      </div>

      {/* Controls */}
      <div className="rooms-controls">
        <div className="rooms-controls-left">
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="rooms-sort-select">
            <option value="latest">최신순</option>
            <option value="name">이름순</option>
            <option value="members">참여자순</option>
          </select>
          <span className="rooms-count">{filtered.length}개의 방</span>
        </div>
        <div className="rooms-controls-right">
          <button
            onClick={() => setViewMode('list')}
            className={`rooms-view-btn ${viewMode === 'list' ? 'active' : ''}`}
            title="리스트 보기"
          >
            ☰
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`rooms-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
            title="그리드 보기"
          >
            ⊞
          </button>
        </div>
      </div>

      {/* Rooms list */}
      <div className={`rooms-list-container ${viewMode === 'grid' ? 'rooms-grid-view' : ''}`}>
        {filtered.map((room, index) => (
          <RoomCard
            key={room.id}
            room={room}
            onClick={() => navigate(`/rooms/${room.id}/problems`)}
            canDelete={me && me.id === room.ownerId}
            viewMode={viewMode}
            index={index}
            onDelete={async () => {
              const ok = confirm('이 방과 모든 문제 및 코드를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.');
              if (!ok) return;
              try {
                await api.deleteRoom(room.id);
                setRooms((prev) => prev.filter((r) => r.id !== room.id));
              } catch (e) {
                alert(e.message);
              }
            }}
          />
        ))}
        {filtered.length === 0 && (
          <div className="rooms-empty-state">No rooms found. Try creating one.</div>
        )}
      </div>

      <CreateRoomModal
        open={open}
        onClose={() => setOpen(false)}
        onCreate={(payload) => {
          (async () => {
            try {
              const created = await api.createRoom(payload);
              setRooms((prev) => [created, ...prev]);
              setOpen(false);
            } catch (e) {
              alert(e.message);
            }
          })();
        }}
      />

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onAuthed={async () => {
          try {
            const who = await api.me();
            setMe(who);
            const list = await api.rooms();
            setRooms(list);
          } catch (e) {
            console.error(e);
          }
        }}
      />
    </div>
  );
};

export default Rooms;
