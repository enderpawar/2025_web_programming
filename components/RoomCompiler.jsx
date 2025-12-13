import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Editor from './Editor.jsx';
import Console from './Console.jsx';
import ThemeToggleButton from './ThemeToggleButton.jsx';
import { OutputType } from '../types.js';
import { api } from '../api.js';
import { io } from 'socket.io-client';
import '../styles/RoomCompiler.css';

const defaultCode = `// Room scoped JS file.\n// Write code here and click Run. Use Save to persist per room.\n\nfunction greet(name) {\n  return \`Hello, \${name}!\`;\n}\n\nconst message = greet('Room');\nconsole.log(message);`;

// Helper function to format test case input/output in a user-friendly way
const formatTestCaseData = (data) => {
  if (data === null) return 'null';
  if (data === undefined) return 'undefined';
  
  // If it's an array, format each element
  if (Array.isArray(data)) {
    if (data.length === 0) return '[]';
    
    // Check if it's an array of primitives
    const allPrimitives = data.every(item => 
      typeof item !== 'object' || item === null
    );
    
    if (allPrimitives) {
      return `[${data.map(item => JSON.stringify(item)).join(', ')}]`;
    }
    
    // For nested arrays or objects, show structure more clearly
    return data.map((item, i) => {
      if (typeof item === 'object' && item !== null) {
        return `  인자 ${i + 1}: ${JSON.stringify(item)}`;
      }
      return `  인자 ${i + 1}: ${JSON.stringify(item)}`;
    }).join('\n');
  }
  
  // If it's an object
  if (typeof data === 'object') {
    return JSON.stringify(data, null, 2);
  }
  
  // Primitives
  return JSON.stringify(data);
};

const TopBar = ({ title, subtitle, onBack, onSave, saving, savedAt }) => (
  <header className="compiler-header">
    <div className="compiler-header-content">
      <div className="compiler-title-section">
        <button onClick={onBack} className="compiler-back-btn">← Back</button>
        <div>
          <div className="compiler-title">{title}</div>
          <div className="compiler-subtitle">{subtitle}</div>
        </div>
      </div>
      <div className="compiler-actions">
        <ThemeToggleButton />
        {savedAt && <span>Saved {new Date(savedAt).toLocaleTimeString()}</span>}
        <button
          onClick={onSave}
          disabled={saving}
          className="btn btn-primary"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  </header>
);

// Difficulty badge component with icons
const DifficultyBadge = ({ difficulty }) => {
  const getDifficultyConfig = (diff) => {
    const normalized = diff?.toLowerCase() || 'easy';
    
    if (normalized.includes('easy') || normalized.includes('쉬움')) {
      return {
        icon: '⭐',
        className: 'difficulty-easy',
        label: difficulty
      };
    } else if (normalized.includes('medium') || normalized.includes('normal') || normalized.includes('보통')) {
      return {
        icon: '⚡',
        className: 'difficulty-medium',
        label: difficulty
      };
    } else if (normalized.includes('hard') || normalized.includes('어려움')) {
      return {
        icon: '🔥',
        className: 'difficulty-hard',
        label: difficulty
      };
    }
    
    return {
      icon: '📌',
      className: 'difficulty-default',
      label: difficulty
    };
  };

  const config = getDifficultyConfig(difficulty);

  return (
    <div className={`problem-difficulty ${config.className}`}>
      <span className="difficulty-icon">{config.icon}</span>
      <span>{config.label}</span>
    </div>
  );
};

const RoomCompiler = () => {
  const params = useParams();
  const navigate = useNavigate();
  const roomId = params.roomId;
  const problemId = params.problemId;
  const [room, setRoom] = useState(null);
  const [me, setMe] = useState(null);
  const [problem, setProblem] = useState(null);

  const [code, setCode] = useState('');
  const [output, setOutput] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [testResults, setTestResults] = useState(null);
  const [aiHint, setAiHint] = useState('');
  const [loadingHint, setLoadingHint] = useState(false);
  const [showHint, setShowHint] = useState(false);
  
  // Panel widths (in pixels)
  const [leftPanelWidth, setLeftPanelWidth] = useState(468);
  const [rightPanelWidth, setRightPanelWidth] = useState(400);

  useEffect(() => {
    (async () => {
      try {
        const who = await api.me();
        setMe(who);
        const r = await api.room(roomId);
        setRoom(r);
        const p = await api.problem(roomId, problemId);
        setProblem(p);
        const c = await api.getProblemCode(roomId, problemId);
        const starter = p?.starterCode;
        setCode(c?.code ?? starter ?? defaultCode);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [roomId, problemId]);

  // Realtime collaboration (basic): broadcast code changes, apply remote updates
  useEffect(() => {
    if (!roomId || !problemId) return;
    const socket = io(api.API_URL, { transports: ['websocket'] });
    const clientId = Math.random().toString(36).slice(2);
    socket.emit('join', { roomId: `${roomId}:${problemId}` });
    socket.on('code:remote', ({ code: remote, clientId: from }) => {
      if (from === clientId) return;
      setCode((curr) => (curr === remote ? curr : remote));
    });
    const onLocalChange = (value) => {
      socket.emit('code:change', { roomId: `${roomId}:${problemId}`, code: value, clientId });
    };
    // Patch Editor setCode to also broadcast by effect on code state
    // We'll attach a small observer
    let last = null;
    const interval = setInterval(() => {
      if (last !== code) {
        last = code;
        onLocalChange(code);
      }
    }, 600);
    return () => {
      clearInterval(interval);
      socket.disconnect();
    };
  }, [roomId, code]);

  const handleRunCode = useCallback(() => {
    setIsRunning(true);
    const newOutput = [];
    const originalConsole = { ...console };
    const customConsole = {
      log: (...args) => {
        newOutput.push({
          type: OutputType.LOG,
          message: args
            .map((arg) => {
              try {
                return JSON.stringify(arg, null, 2);
              } catch (e) {
                return String(arg);
              }
            })
            .join(' '),
        });
      },
      error: (...args) => {
        newOutput.push({
          type: OutputType.ERROR,
          message: args.map((arg) => (arg instanceof Error ? arg.message : String(arg))).join(' '),
        });
      },
      warn: (...args) => {
        newOutput.push({ type: OutputType.WARN, message: args.map((arg) => String(arg)).join(' ') });
      },
      info: (...args) => {
        newOutput.push({ type: OutputType.INFO, message: args.map((arg) => String(arg)).join(' ') });
      },
    };
    window.console.log = customConsole.log;
    window.console.error = customConsole.error;
    window.console.warn = customConsole.warn;
    window.console.info = customConsole.info;
    
    try {
      newOutput.push({ type: OutputType.INFO, message: 'Executing code...' });
      
      // 문제가 있고 샘플 테스트 케이스가 있으면 자동으로 실행
      if (problem && Array.isArray(problem.samples) && problem.samples.length > 0) {
        const functionName = problem.functionName || 'solve';
        
        try {
          // 부동 소수점 비교를 위한 헬퍼 함수
          const deepEqual = (a, b, epsilon = 1e-10) => {
            if (typeof a === 'number' && typeof b === 'number') {
              if (Number.isNaN(a) && Number.isNaN(b)) return true;
              if (!Number.isFinite(a) || !Number.isFinite(b)) return a === b;
              return Math.abs(a - b) < epsilon;
            }
            if (Array.isArray(a) && Array.isArray(b)) {
              if (a.length !== b.length) return false;
              return a.every((item, i) => deepEqual(item, b[i], epsilon));
            }
            if (typeof a === 'object' && typeof b === 'object' && a !== null && b !== null) {
              const keysA = Object.keys(a);
              const keysB = Object.keys(b);
              if (keysA.length !== keysB.length) return false;
              return keysA.every(key => deepEqual(a[key], b[key], epsilon));
            }
            return a === b;
          };

          // 함수 추출
          const func = new Function(`
            ${code}
            return ${functionName};
          `)();
          
          if (typeof func !== 'function') {
            throw new Error(`${functionName} is not a function`);
          }
          
          newOutput.push({ type: OutputType.INFO, message: `Running ${problem.samples.length} sample test case(s)...` });
          
          // 각 샘플 테스트 케이스 실행
          problem.samples.forEach((sample, idx) => {
            try {
              const input = Array.isArray(sample.input) ? sample.input : [sample.input];
              const result = func(...input);
              const passed = deepEqual(result, sample.output);
              
              if (passed) {
                newOutput.push({ 
                  type: OutputType.SUCCESS, 
                  message: `✓ Sample ${idx + 1}: Passed\n  Input: ${JSON.stringify(sample.input)}\n  Output: ${JSON.stringify(result)}` 
                });
              } else {
                newOutput.push({ 
                  type: OutputType.ERROR, 
                  message: `✗ Sample ${idx + 1}: Failed\n  Input: ${JSON.stringify(sample.input)}\n  Expected: ${JSON.stringify(sample.output)}\n  Got: ${JSON.stringify(result)}` 
                });
              }
            } catch (err) {
              newOutput.push({ 
                type: OutputType.ERROR, 
                message: `✗ Sample ${idx + 1}: Error\n  ${err.message}` 
              });
            }
          });
          
          newOutput.push({ type: OutputType.SUCCESS, message: 'Execution finished.' });
        } catch (err) {
          newOutput.push({ type: OutputType.ERROR, message: err.message });
        }
      } else {
        // 문제가 없거나 샘플이 없으면 기존 방식대로 실행
        const result = new Function(code)();
        if (result !== undefined) {
          newOutput.push({ type: OutputType.LOG, message: `Return value: ${JSON.stringify(result, null, 2)}` });
        }
        newOutput.push({ type: OutputType.SUCCESS, message: 'Execution finished.' });
      }
    } catch (error) {
      if (error instanceof Error) newOutput.push({ type: OutputType.ERROR, message: error.message });
      else newOutput.push({ type: OutputType.ERROR, message: String(error) });
    } finally {
      window.console = originalConsole;
      setOutput(newOutput);
      setIsRunning(false);
    }
  }, [code, problem]);

  const handleClearConsole = useCallback(() => setOutput([]), []);

  const addOutput = useCallback((line) => {
    setOutput((prev) => [...prev, line]);
  }, []);

  const save = useCallback(async () => {
    setSaving(true);
    try {
      await api.saveProblemCode(roomId, problemId, code);
      setSavedAt(Date.now());
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  }, [roomId, problemId, code]);

  const runTests = useCallback(async () => {
    setTestResults(null);
    try {
      const res = await api.submitProblemSolution(roomId, problemId, code);
      setTestResults(res);
    } catch (e) {
      setTestResults({ passed: false, results: [], error: e.message });
    }
  }, [roomId, problemId, code]);

  const getAiHint = useCallback(async () => {
    if (!problem) return;
    setLoadingHint(true);
    setShowHint(true);
    setAiHint(''); // Clear previous hint
    try {
      const result = await api.getHint(
        problem.title,
        problem.description,
        code,
        problem.difficulty
      );
      setAiHint(result.hint);
    } catch (e) {
      console.error('AI Hint Error:', e);
      setAiHint(`❌ Error: ${e.message}\n\n자세한 내용은 브라우저 콘솔을 확인하세요.`);
    } finally {
      setLoadingHint(false);
    }
  }, [problem, code]);

  // Resizer handlers
  const handleLeftResize = useCallback((e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = leftPanelWidth;

    const handleMouseMove = (e) => {
      const delta = e.clientX - startX;
      const newWidth = Math.max(250, Math.min(800, startWidth + delta));
      setLeftPanelWidth(newWidth);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [leftPanelWidth]);

  const handleRightResize = useCallback((e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = rightPanelWidth;

    const handleMouseMove = (e) => {
      const delta = startX - e.clientX;
      const newWidth = Math.max(250, Math.min(800, startWidth + delta));
      setRightPanelWidth(newWidth);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [rightPanelWidth]);

  const [pTitle, setPTitle] = useState('두 수의 합');
  const [pDifficulty, setPDifficulty] = useState('쉬움');
  const [pFunctionName, setPFunctionName] = useState('solve');
  const [pDescription, setPDescription] = useState('정수 배열 nums와 목표값 target이 주어집니다. 배열에서 두 수를 더해서 target이 되는 두 수의 인덱스를 배열로 반환하세요.\n\n각 입력에는 정확히 하나의 해답만 존재하며, 같은 원소를 두 번 사용할 수 없습니다.\n\n예시:\n입력: nums = [2, 7, 11, 15], target = 9\n출력: [0, 1]\n설명: nums[0] + nums[1] = 2 + 7 = 9 이므로 [0, 1]을 반환합니다.');
  const [pStarter, setPStarter] = useState('function solve(nums, target) {\n  // 여기에 코드를 작성하세요\n  // nums: 정수 배열\n  // target: 목표값\n  // 반환: 두 수의 인덱스 [index1, index2]\n}');
  const [pSamples, setPSamples] = useState('[{"input":[[2,7,11,15],9],"output":[0,1]},{"input":[[3,2,4],6],"output":[1,2]}]');
  const [pTests, setPTests] = useState('[{"input":[[2,7,11,15],9],"output":[0,1]},{"input":[[3,2,4],6],"output":[1,2]},{"input":[[3,3],6],"output":[0,1]}]');
  const [perr, setPErr] = useState('');

  const createProblem = useCallback(async () => {
    setPErr('');
    try {
      const samples = pSamples ? JSON.parse(pSamples) : [];
      const tests = pTests ? JSON.parse(pTests) : [];
      const problem = {
        title: pTitle.trim() || 'Problem',
        description: pDescription,
        difficulty: pDifficulty.trim() || 'Easy',
        functionName: pFunctionName.trim() || 'solve',
        language: 'javascript',
        starterCode: pStarter,
        samples,
        tests,
      };
      const created = await api.createProblem(roomId, problem);
      setRoom((prev) => ({ ...prev, problem: created }));
      // If user code is empty/default, seed with starter
      setCode((curr) => (curr && curr !== defaultCode ? curr : (problem.starterCode || curr)));
    } catch (e) {
      setPErr('Invalid JSON in samples/tests or permission denied.');
    }
  }, [roomId, pTitle, pDescription, pDifficulty, pFunctionName, pStarter, pSamples, pTests]);

  if (!room) {
    return (
      <div className="min-h-screen bg-gray-900 text-white grid place-items-center">
        <div className="text-center space-y-4">
          <div className="text-xl">Room not found.</div>
          <button className="px-4 py-2 rounded bg-white/10 hover:bg-white/20" onClick={() => navigate('/rooms')}>
            Back to rooms
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="room-compiler-page">
      <TopBar
        title={room.name}
        subtitle={`${room.groupName} • ${room.authorName}`}
        onBack={() => navigate(`/rooms/${roomId}/problems`)}
        onSave={save}
        saving={saving}
        savedAt={savedAt}
      />
      <div className="compiler-main">
        <div className="compiler-left-panel" style={{ width: `${leftPanelWidth}px` }}>
          {problem && (
            <>
              <div className="problem-name">{problem.title || 'Problem'}</div>
              {problem.difficulty && (
                <DifficultyBadge difficulty={problem.difficulty} />
              )}
              
              {/* Function Name */}
              {problem.functionName && (
                <div className="problem-section">
                  <div className="problem-section-title">Function Name</div>
                  <div className="problem-code-block">
                    {problem.functionName}
                  </div>
                </div>
              )}

              <div className="problem-description">
                {problem.description || 'No description provided.'}
              </div>
              
              {/* Starter Code Preview */}
              {problem.starterCode && (
                <div className="problem-section">
                  <div className="problem-section-title">Starter Code</div>
                  <pre className="problem-code-block">
                    {problem.starterCode}
                  </pre>
                </div>
              )}

              {/* Sample Test Cases */}
              {Array.isArray(problem.samples) && problem.samples.length > 0 && (
                <div className="problem-section">
                  <div className="problem-section-title">샘플 테스트 케이스</div>
                  <div className="test-cases-list">
                    {problem.samples.map((s, idx) => {
                      const isArrayInput = Array.isArray(s.input);
                      const hasMultipleArgs = isArrayInput && s.input.length > 1;
                      
                      return (
                        <div key={idx} className="test-case-card">
                          <div className="problem-section-title">샘플 {idx + 1}</div>
                          <div>
                            <div>
                              <span className="test-case-label">입력:</span>
                              <pre className="test-case-value">
                                {hasMultipleArgs ? (
                                  s.input.map((arg, i) => (
                                    <div key={i} style={{ marginBottom: i < s.input.length - 1 ? '0.25rem' : 0 }}>
                                      <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                                        인자 {i + 1}:{' '}
                                      </span>
                                      {JSON.stringify(arg)}
                                    </div>
                                  ))
                                ) : (
                                  formatTestCaseData(s.input)
                                )}
                              </pre>
                            </div>
                            <div>
                              <span className="test-case-label">출력:</span>
                              <pre className="test-case-value">
                                {formatTestCaseData(s.output)}
                              </pre>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Model Solution (Professor Only) */}
              {me?.role === 'professor' && problem.solution && (
                <div className="problem-section">
                  <div className="problem-section-title" style={{color: '#fbbf24'}}>🔒 Model Solution (Professor Only)</div>
                  <div className="hint-panel">
                    <div className="hint-panel-content">
                      AI-generated reference solution for validation purposes
                    </div>
                    <pre className="hint-code-block">
                      {problem.solution}
                    </pre>
                  </div>
                </div>
              )}

              {/* Hidden Test Cases Info */}
              {Array.isArray(problem.tests) && problem.tests.length > 0 && (
                <div className="problem-section">
                  <div className="problem-section-title">테스트 케이스</div>
                  <div className="test-case-card">
                    <div className="test-case-label">
                      {problem.tests.length}개의 히든 테스트 케이스가 솔루션 평가에 사용됩니다.
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          <div className="problem-section compiler-action-buttons">
            <button onClick={handleRunCode} disabled={isRunning} className="btn btn-primary compiler-run-btn">{isRunning ? '실행 중…' : '실행'}</button>
            {problem && (
              <>
                <button onClick={runTests} className="btn btn-primary compiler-run-btn">테스트 실행</button>
                <button 
                  onClick={getAiHint} 
                  disabled={loadingHint}
                  className="compiler-hint-btn"
                >
                  {loadingHint ? (
                    <>
                      <span>⚡</span>
                      <span>로딩 중...</span>
                    </>
                  ) : (
                    <>
                      <span>💡</span>
                      <span>AI 힌트 받기</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
          {showHint && (
            <div className="hint-panel">
              <div className="hint-panel-header">
                <span className="hint-panel-icon">💡</span>
                <span className="hint-panel-title">AI 힌트</span>
                <button 
                  onClick={() => setShowHint(false)}
                  className="editor-action-btn"
                  style={{marginLeft: 'auto'}}
                >
                  ✕
                </button>
              </div>
              <div className="hint-panel-content">
                {loadingHint ? (
                  <div className="hint-loading">
                    <span>생각하는 중...</span>
                  </div>
                ) : (
                  aiHint || '"AI 힌트 받기"를 클릭하여 도움을 받으세요.'
                )}
              </div>
            </div>
          )}
          {problem && testResults && (
            <div className="problem-section">
              {testResults.error && <div className="test-result-badge-fail">Error: {testResults.error}</div>}
              {!!testResults.results?.length && (
                <div className="test-cases-list">
                  {testResults.results.map((r, i) => (
                    <div key={i} className={`test-result-card ${r.pass ? 'test-result-pass' : 'test-result-fail'}`}>
                      <div className="test-result-badge">Test Case {i + 1}: {r.pass ? '✓ Passed' : '✗ Failed'}</div>
                      {r.error && <div className="test-result-badge-fail">{r.error}</div>}
                      {!r.pass && (
                        <div className="test-case-label">
                          로직을 확인한 후 다시 시도해보세요.
                        </div>
                      )}
                    </div>
                  ))}
                  <div className={`test-result-badge ${testResults.passed ? 'test-result-badge-pass' : 'test-result-badge-fail'}`}>
                    {testResults.passed ? 'All tests passed 🎉' : `${testResults.results.filter(r => r.pass).length} / ${testResults.results.length} tests passed`}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <div 
          className="panel-resizer" 
          onMouseDown={handleLeftResize}
          title="드래그하여 패널 크기 조정"
        />
        <div className="compiler-center-panel">
          <Editor 
            code={code} 
            setCode={setCode} 
            onRun={handleRunCode} 
            isRunning={isRunning}
            problem={problem}
          />
        </div>
        <div 
          className="panel-resizer" 
          onMouseDown={handleRightResize}
          title="드래그하여 패널 크기 조정"
        />
        <div className="compiler-right-panel" style={{ width: `${rightPanelWidth}px` }}>
          <Console 
            output={output} 
            onClear={handleClearConsole} 
            problem={problem}
            code={code}
            addOutput={addOutput}
          />
        </div>
      </div>
    </div>
  );
};

export default RoomCompiler;
