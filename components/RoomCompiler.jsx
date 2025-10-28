import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Editor from './Editor.jsx';
import Console from './Console.jsx';
import { OutputType } from '../types.js';
import { storage } from '../storage.js';

const defaultCode = `// Room scoped JS file.\n// Write code here and click Run. Use Save to persist per room.\n\nfunction greet(name) {\n  return \`Hello, \${name}!\`;\n}\n\nconst message = greet('Room');\nconsole.log(message);`;

const TopBar = ({ title, subtitle, onBack, onSave, saving, savedAt }) => (
  <header className="flex-shrink-0 bg-gray-800/50 backdrop-blur-sm border-b border-gray-700/50 shadow-lg p-3 px-4 md:px-6">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white/80">← Back</button>
        <div>
          <div className="text-lg font-bold text-gray-100">{title}</div>
          <div className="text-xs text-white/60">{subtitle}</div>
        </div>
      </div>
      <div className="flex items-center gap-3 text-xs text-white/60">
        {savedAt && <span>Saved {new Date(savedAt).toLocaleTimeString()}</span>}
        <button
          onClick={onSave}
          disabled={saving}
          className="px-3 py-1.5 rounded-md bg-teal-500 hover:bg-teal-400 disabled:bg-teal-800 text-black font-semibold"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  </header>
);

const RoomCompiler = () => {
  const params = useParams();
  const navigate = useNavigate();
  const roomId = params.roomId;
  const room = storage.getRoom(roomId);

  const [code, setCode] = useState('');
  const [output, setOutput] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);

  useEffect(() => {
    if (!room) return;
    const existing = storage.getRoomCode(roomId);
    setCode(existing ?? defaultCode);
  }, [roomId]);

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
      const result = new Function(code)();
      if (result !== undefined) {
        newOutput.push({ type: OutputType.LOG, message: `Return value: ${JSON.stringify(result, null, 2)}` });
      }
      newOutput.push({ type: OutputType.SUCCESS, message: 'Execution finished.' });
    } catch (error) {
      if (error instanceof Error) newOutput.push({ type: OutputType.ERROR, message: error.message });
      else newOutput.push({ type: OutputType.ERROR, message: String(error) });
    } finally {
      window.console = originalConsole;
      setOutput(newOutput);
      setIsRunning(false);
    }
  }, [code]);

  const handleClearConsole = useCallback(() => setOutput([]), []);

  const save = useCallback(async () => {
    setSaving(true);
    storage.setRoomCode(roomId, code);
    setSavedAt(Date.now());
    setSaving(false);
  }, [roomId, code]);

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
    <div className="flex flex-col h-screen bg-gray-900 font-sans">
      <TopBar
        title={room.name}
        subtitle={`${room.groupName} • ${room.authorName}`}
        onBack={() => navigate('/rooms')}
        onSave={save}
        saving={saving}
        savedAt={savedAt}
      />
      <div className="flex-grow flex flex-col md:flex-row overflow-hidden p-2 md:p-4 gap-4">
        <div className="flex-1 flex flex-col min-h-0">
          <Editor code={code} setCode={setCode} onRun={handleRunCode} isRunning={isRunning} />
        </div>
        <div className="flex-1 flex flex-col min-h-0">
          <Console output={output} onClear={handleClearConsole} />
        </div>
      </div>
    </div>
  );
};

export default RoomCompiler;
