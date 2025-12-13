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

const RoomCard = ({ room, onClick, canDelete, onDelete, viewMode = 'list', index = 0, progress, onProgressClick }) => {
  if (viewMode === 'grid') {
    return (
      <div className="room-card-grid" style={{ animationDelay: `${index * 0.05}s` }}>
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
        <button onClick={onClick} className="room-card-grid-button">
          <div className="room-card-grid-header">
            <Avatar logoUrl={room.logoUrl} title={room.name} />
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
            {progress && (
              <div 
                className="room-progress-section" 
                onClick={(e) => { e.stopPropagation(); onProgressClick?.(); }}
                style={{ cursor: 'pointer' }}
              >
                <div className="room-progress-label">
                  <span className="room-progress-icon">✅</span>
                  <span className="room-progress-text">
                    {progress.completedStudents}/{Math.max(0, (room.members?.length || 1) - 1)} 학생이 학습 완료했습니다
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div className="room-progress-bar-container">
                    <div 
                      className="room-progress-bar-fill" 
                      style={{ width: `${Math.max(0, (room.members?.length || 1) - 1) === 0 ? 0 : Math.round((progress.completedStudents / Math.max(0, (room.members?.length || 1) - 1)) * 100)}%` }}
                    />
                  </div>
                  <span className="room-progress-percentage">{Math.max(0, (room.members?.length || 1) - 1) === 0 ? 0 : Math.round((progress.completedStudents / Math.max(0, (room.members?.length || 1) - 1)) * 100)}%</span>
                </div>
              </div>
            )}
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
          {progress && (
            <div className="room-progress-inline">
              <span className="room-progress-icon">✅</span>
              <span className="room-progress-text">
                {progress.completedStudents}/{progress.totalStudents} 완료
              </span>
              <div className="room-progress-bar-mini">
                <div 
                  className="room-progress-bar-fill-mini" 
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
              <span className="room-progress-percentage-mini">{progress.percentage}%</span>
            </div>
          )}
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

const StudentCodeModal = ({ open, onClose, studentName, problemTitle, code, passed, updatedAt, studentId, roomId, problemId }) => {
  const [feedback, setFeedback] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [activeTab, setActiveTab] = useState('manual'); // 'manual', 'ai', 'template'
  const [aiReview, setAiReview] = useState(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [ratings, setRatings] = useState({ readability: 0, efficiency: 0, correctness: 0 });

  // 피드백 템플릿
  const feedbackTemplates = [
    { id: 1, title: '잘 작성했습니다', content: '코드가 전반적으로 잘 작성되었습니다. 로직이 명확하고 테스트도 모두 통과했습니다. 계속 이런 식으로 학습하시길 바랍니다.' },
    { id: 2, title: '개선이 필요합니다', content: '코드의 기본 구조는 괜찮으나 몇 가지 개선이 필요합니다:\n1. 변수명을 더 명확하게 작성하세요\n2. 주석을 추가하여 코드의 의도를 설명하세요\n3. 엣지 케이스를 고려하세요' },
    { id: 3, title: '효율성 개선', content: '현재 코드는 작동하지만 시간 복잡도가 높습니다. 다음을 고려해보세요:\n- 중첩 반복문을 줄일 수 있는 방법\n- 적절한 자료구조 활용 (Map, Set 등)\n- 불필요한 연산 제거' },
    { id: 4, title: '재제출 권장', content: '현재 코드는 테스트를 통과하지 못했습니다. 다음을 확인하세요:\n1. 문제 요구사항을 다시 읽어보세요\n2. 엣지 케이스를 테스트해보세요\n3. console.log로 중간 값을 확인하세요\n막히는 부분이 있다면 AI 힌트를 활용하세요.' },
  ];

  useEffect(() => {
    if (open && studentId && roomId && problemId) {
      const codeData = api.getStudentCode(studentId, roomId, problemId);
      setFeedback(codeData?.feedback || '');
      setAiReview(null);
    }
  }, [open, studentId, roomId, problemId]);

  const handleSaveFeedback = () => {
    setIsSaving(true);
    const success = api.saveFeedback(studentId, roomId, problemId, feedback);
    
    if (success) {
      setSaveMessage('✅ 피드백이 저장되었습니다');
    } else {
      setSaveMessage('❌ 피드백 저장에 실패했습니다');
    }
    
    setIsSaving(false);
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const handleGenerateAIReview = async () => {
    setIsLoadingAI(true);
    try {
      const rooms = await api.rooms();
      const room = rooms.find(r => r.id === roomId);
      const problem = room?.problems.find(p => p.id === problemId);
      
      const { generateCodeReview } = await import('../gemini.js');
      const review = await generateCodeReview(
        code,
        problemTitle,
        problem?.description || '',
        passed
      );
      
      setAiReview(review);
      setActiveTab('ai');
      
      // AI 리뷰를 피드백 텍스트로 포맷팅
      const formattedFeedback = `**AI 코드 리뷰**

📊 **평가**:
- 가독성: ${review.ratings.readability}/5
- 효율성: ${review.ratings.efficiency}/5
- 정확성: ${review.ratings.correctness}/5

✅ **잘한 점**:
${review.strengths.map((s, i) => `${i + 1}. ${s}`).join('\n')}

🔧 **개선 필요**:
${review.improvements.map((i, idx) => `${idx + 1}. ${i}`).join('\n')}

💡 **코드 개선 제안**:
\`\`\`javascript
${review.suggestedCode}
\`\`\`

📚 **학습 조언**:
${review.learningAdvice}`;
      
      setFeedback(formattedFeedback);
    } catch (error) {
      console.error('AI 리뷰 생성 실패:', error);
      const errorMessage = error.message || 'AI 리뷰 생성에 실패했습니다.';
      alert(`❌ ${errorMessage}\n\n현재 API 키: ${api.getGeminiApiKey() ? '✅ 설정됨' : '❌ 미설정'}\n\n상세 오류: ${error.toString()}`);
    } finally {
      setIsLoadingAI(false);
    }
  };

  const handleTemplateSelect = (template) => {
    setFeedback(template.content);
    setActiveTab('manual');
  };

  const handleRatingChange = (category, value) => {
    setRatings(prev => ({ ...prev, [category]: value }));
  };

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 10000 }}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px', width: '90vw' }}>
        <h3 className="modal-title">{studentName}의 코드 - {problemTitle}</h3>
        <div style={{ marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span style={{
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: '600',
            background: passed ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
            color: passed ? '#10b981' : '#ef4444'
          }}>
            {passed ? '✅ 테스트 통과' : '❌ 미완료'}
          </span>
          {updatedAt && (
            <span style={{ fontSize: '13px', color: '#9ca3af' }}>
              마지막 수정: {new Date(updatedAt).toLocaleString('ko-KR')}
            </span>
          )}
        </div>
        <div style={{ 
          background: 'var(--color-bg-darker)', 
          border: '1px solid var(--color-border)',
          borderRadius: '8px',
          padding: '16px',
          maxHeight: '400px',
          overflowY: 'auto',
          marginBottom: '16px'
        }}>
          <pre style={{ 
            margin: 0, 
            fontFamily: 'monospace',
            fontSize: '14px',
            lineHeight: '1.6',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
          }}>
            {code || '작성된 코드가 없습니다.'}
          </pre>
        </div>

        {/* 피드백 섹션 */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <label style={{ 
              fontSize: '16px',
              fontWeight: '700',
              color: 'var(--text-primary)'
            }}>
              🗒️ 교수자 피드백
            </label>
            <button
              onClick={handleGenerateAIReview}
              disabled={isLoadingAI || !code}
              style={{
                padding: '8px 16px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: isLoadingAI ? 'wait' : 'pointer',
                opacity: isLoadingAI || !code ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => !isLoadingAI && (e.target.style.transform = 'translateY(-2px)')}
              onMouseLeave={(e) => (e.target.style.transform = 'translateY(0)')}
            >
              🤖 {isLoadingAI ? 'AI 분석 중...' : 'AI 자동 리뷰'}
            </button>
          </div>

          {/* 탭 네비게이션 */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', borderBottom: '2px solid var(--color-border)' }}>
            <button
              onClick={() => setActiveTab('manual')}
              style={{
                padding: '8px 16px',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'manual' ? '3px solid #3b82f6' : '3px solid transparent',
                color: activeTab === 'manual' ? '#3b82f6' : 'var(--text-secondary)',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
            >
              ✏️ 직접 작성
            </button>
            <button
              onClick={() => setActiveTab('template')}
              style={{
                padding: '8px 16px',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'template' ? '3px solid #3b82f6' : '3px solid transparent',
                color: activeTab === 'template' ? '#3b82f6' : 'var(--text-secondary)',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
            >
              📋 템플릿
            </button>
            {aiReview && (
              <button
                onClick={() => setActiveTab('ai')}
                style={{
                  padding: '8px 16px',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === 'ai' ? '3px solid #3b82f6' : '3px solid transparent',
                  color: activeTab === 'ai' ? '#3b82f6' : 'var(--text-secondary)',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s'
                }}
              >
                🤖 AI 리뷰
              </button>
            )}
          </div>

          {/* 템플릿 선택 */}
          {activeTab === 'template' && (
            <div style={{ marginBottom: '12px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              {feedbackTemplates.map(template => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateSelect(template)}
                  style={{
                    padding: '12px',
                    background: 'var(--color-bg-darker)',
                    border: '2px solid var(--color-border)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.3s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.borderColor = '#3b82f6';
                    e.target.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.borderColor = 'var(--color-border)';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  {template.title}
                </button>
              ))}
            </div>
          )}

          {/* AI 리뷰 결과 */}
          {activeTab === 'ai' && aiReview && (
            <div style={{ marginBottom: '12px', padding: '16px', background: 'var(--color-bg-darker)', borderRadius: '8px', border: '2px solid #667eea' }}>
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px', color: 'var(--text-primary)' }}>📊 코드 평가</h4>
                <div style={{ display: 'flex', gap: '16px' }}>
                  {Object.entries(aiReview.ratings).map(([key, value]) => (
                    <div key={key} style={{ flex: 1 }}>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                        {key === 'readability' ? '가독성' : key === 'efficiency' ? '효율성' : '정확성'}
                      </div>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {[1, 2, 3, 4, 5].map(star => (
                          <span key={star} style={{ fontSize: '16px', color: star <= value ? '#fbbf24' : '#4b5563' }}>⭐</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div style={{ marginBottom: '12px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '8px', color: '#10b981' }}>✅ 잘한 점</h4>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', lineHeight: '1.8' }}>
                  {aiReview.strengths.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '8px', color: '#f59e0b' }}>🔧 개선 필요</h4>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', lineHeight: '1.8' }}>
                  {aiReview.improvements.map((i, idx) => <li key={idx}>{i}</li>)}
                </ul>
              </div>

              {aiReview.suggestedCode && (
                <div style={{ marginBottom: '12px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '8px', color: '#3b82f6' }}>💡 개선 제안</h4>
                  <pre style={{ 
                    padding: '12px', 
                    background: 'var(--color-bg)', 
                    borderRadius: '6px', 
                    fontSize: '12px',
                    overflow: 'auto',
                    border: '1px solid var(--color-border)'
                  }}>{aiReview.suggestedCode}</pre>
                </div>
              )}

              <div>
                <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '8px', color: '#8b5cf6' }}>📚 학습 조언</h4>
                <p style={{ fontSize: '13px', lineHeight: '1.6', margin: 0 }}>{aiReview.learningAdvice}</p>
              </div>
            </div>
          )}

          {/* 피드백 입력 */}
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="학생에게 전달할 피드백을 작성하세요..."
            style={{
              width: '100%',
              minHeight: '250px',
              padding: '16px',
              borderRadius: '8px',
              border: '2px solid var(--color-border)',
              background: 'var(--color-bg-darker)',
              color: 'var(--text-primary)',
              fontSize: '15px',
              lineHeight: '1.8',
              resize: 'vertical',
              fontFamily: 'inherit'
            }}
          />
          
          <div style={{ marginTop: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button 
              className="btn btn-primary"
              onClick={handleSaveFeedback}
              disabled={isSaving}
              style={{ padding: '10px 20px', fontSize: '14px', fontWeight: '600' }}
            >
              {isSaving ? '저장 중...' : '💾 피드백 저장'}
            </button>
            {saveMessage && (
              <span style={{ 
                fontSize: '13px',
                fontWeight: '600',
                color: saveMessage.includes('✅') ? '#10b981' : '#ef4444'
              }}>
                {saveMessage}
              </span>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose}>닫기</button>
        </div>
      </div>
    </div>
  );
};

const StudentProgressModal = ({ open, onClose, roomId, roomName }) => {
  const [students, setStudents] = useState([]);
  const [codeModalOpen, setCodeModalOpen] = useState(false);
  const [selectedCode, setSelectedCode] = useState(null);

  useEffect(() => {
    if (open && roomId) {
      const progress = api.getStudentProgress(roomId);
      setStudents(progress);
    }
  }, [open, roomId]);

  const handleProblemClick = (student, problem) => {
    const codeData = api.getStudentCode(student.studentId, roomId, problem.problemId);
    setSelectedCode({
      studentName: student.studentName,
      problemTitle: problem.problemTitle,
      code: codeData?.code || '',
      passed: codeData?.passed || false,
      updatedAt: codeData?.updatedAt,
      studentId: student.studentId,
      roomId: roomId,
      problemId: problem.problemId
    });
    setCodeModalOpen(true);
  };

  if (!open) return null;

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
          <h3 className="modal-title">학생별 진행 상황 - {roomName}</h3>
          <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
            {students.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                초대된 학생이 없습니다
              </div>
            ) : (
              students.map((student) => (
                <div key={student.studentId} style={{
                  background: 'var(--color-bg-darker)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '12px',
                  padding: '20px',
                  marginBottom: '16px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div>
                      <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--color-text-primary)' }}>
                        {student.studentName}
                      </div>
                      <div style={{ fontSize: '14px', color: '#9ca3af' }}>
                        {student.studentEmail}
                      </div>
                    </div>
                    <div style={{
                      background: student.percentage === 100 ? 'linear-gradient(135deg, #10b981, #059669)' : 'var(--color-bg-dark)',
                      padding: '8px 16px',
                      borderRadius: '20px',
                      fontWeight: '700',
                      fontSize: '14px'
                    }}>
                      {student.completedCount}/{student.totalProblems} 완료 ({student.percentage}%)
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '8px', marginTop: '12px' }}>
                    {student.problems.map((problem) => (
                      <div 
                        key={problem.problemId} 
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '8px',
                          padding: '8px 12px',
                          background: problem.completed ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          border: `1px solid ${problem.completed ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                          borderRadius: '8px',
                          fontSize: '13px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                          <span>{problem.completed ? '✅' : '❌'}</span>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {problem.problemTitle}
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleProblemClick(student, problem);
                          }}
                          style={{
                            padding: '4px 10px',
                            background: 'rgba(59, 130, 246, 0.2)',
                            border: '1px solid rgba(59, 130, 246, 0.4)',
                            borderRadius: '6px',
                            color: '#3b82f6',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.background = 'rgba(59, 130, 246, 0.3)';
                            e.target.style.transform = 'translateY(-1px)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = 'rgba(59, 130, 246, 0.2)';
                            e.target.style.transform = 'translateY(0)';
                          }}
                        >
                          📝 코드 보기
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="modal-footer">
            <button className="btn btn-primary" onClick={onClose}>닫기</button>
          </div>
        </div>
      </div>

      <StudentCodeModal
        open={codeModalOpen}
        onClose={() => {
          setCodeModalOpen(false);
          setSelectedCode(null);
        }}
        studentName={selectedCode?.studentName}
        problemTitle={selectedCode?.problemTitle}
        code={selectedCode?.code}
        passed={selectedCode?.passed}
        updatedAt={selectedCode?.updatedAt}
        studentId={selectedCode?.studentId}
        roomId={selectedCode?.roomId}
        problemId={selectedCode?.problemId}
      />
    </>
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
  const [progressModalOpen, setProgressModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);

  const [roomProgress, setRoomProgress] = useState({});

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const who = await api.me();
        setMe(who);
        const list = await api.rooms();
        console.log('Loaded rooms:', list);
        setRooms(list || []);
        
        // 각 룸의 진행도 계산
        const progressData = {};
        list.forEach(room => {
          try {
            progressData[room.id] = api.getRoomProgress(room.id);
          } catch (e) {
            console.error(`Failed to get progress for room ${room.id}:`, e);
            progressData[room.id] = { completedStudents: 0, totalStudents: 0, percentage: 0 };
          }
        });
        setRoomProgress(progressData);
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
            progress={roomProgress[room.id]}
            onProgressClick={() => {
              setSelectedRoom(room);
              setProgressModalOpen(true);
            }}
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

      <StudentProgressModal
        open={progressModalOpen}
        onClose={() => {
          setProgressModalOpen(false);
          setSelectedRoom(null);
        }}
        roomId={selectedRoom?.id}
        roomName={selectedRoom?.name}
      />
    </div>
  );
};

export default Rooms;
