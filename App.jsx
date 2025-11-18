import React, { useState, useCallback, useEffect } from 'react';
import Editor from './components/Editor';
import Console from './components/Console';
import Header from './components/Header';
import { OutputType } from './types.js';
import { storage } from './storage.js';

const defaultCode = `// Welcome to the JS Online Compiler!
// You can write and execute JavaScript code directly in your browser.

function greet(name) {
  return \`Hello, \${name}!\`;
}

const message = greet('World');
console.log(message);

// You can also log objects and arrays.
console.log({ a: 1, b: [2, 3] });

// Errors will be caught and displayed in the console.
// uncomment the line below to see an error
// throw new Error("This is a test error!");
`;

function App() {
  const [code, setCode] = useState('');
  const [output, setOutput] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [snippets, setSnippets] = useState([]);

  // 컴포넌트 마운트 시 저장된 코드 불러오기
  useEffect(() => {
    const savedCode = storage.loadCode();
    if (savedCode) {
      setCode(savedCode);
    } else {
      setCode(defaultCode);
    }
    setSnippets(storage.getSnippets());
  }, []);

  // 코드 저장
  const handleSaveCode = useCallback(() => {
    storage.saveCode(code);
    setSavedAt(new Date());
    setOutput(prev => [...prev, {
      type: OutputType.SUCCESS,
      message: '✓ Code saved to local storage!'
    }]);
  }, [code]);

  // 스니펫 저장
  const handleSaveSnippet = useCallback(() => {
    const name = prompt('Enter snippet name:');
    if (name) {
      storage.saveSnippet(name, code);
      setSnippets(storage.getSnippets());
      setOutput(prev => [...prev, {
        type: OutputType.SUCCESS,
        message: `✓ Snippet "${name}" saved!`
      }]);
    }
  }, [code]);

  // 스니펫 로드
  const handleLoadSnippet = useCallback((id) => {
    const snippet = storage.loadSnippet(id);
    if (snippet) {
      setCode(snippet.code);
      setOutput(prev => [...prev, {
        type: OutputType.INFO,
        message: `Loaded snippet: ${snippet.name}`
      }]);
    }
  }, []);

  // 스니펫 삭제
  const handleDeleteSnippet = useCallback((id) => {
    if (confirm('Delete this snippet?')) {
      storage.deleteSnippet(id);
      setSnippets(storage.getSnippets());
      setOutput(prev => [...prev, {
        type: OutputType.INFO,
        message: 'Snippet deleted'
      }]);
    }
  }, []);

  const handleRunCode = useCallback(() => {
    setIsRunning(true);
    const newOutput = [];

    // Override console methods
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
          message: args
            .map((arg) => (arg instanceof Error ? arg.message : String(arg)))
            .join(' '),
        });
      },
      warn: (...args) => {
        newOutput.push({
          type: OutputType.WARN,
          message: args.map((arg) => String(arg)).join(' '),
        });
      },
      info: (...args) => {
        newOutput.push({
          type: OutputType.INFO,
          message: args.map((arg) => String(arg)).join(' '),
        });
      },
    };

    // Temporarily replace global console
    window.console.log = customConsole.log;
    window.console.error = customConsole.error;
    window.console.warn = customConsole.warn;
    window.console.info = customConsole.info;

    try {
      newOutput.push({ type: OutputType.INFO, message: 'Executing code...' });
      // Using Function constructor is safer than eval
      const result = new Function(code)();
      if (result !== undefined) {
        newOutput.push({
          type: OutputType.LOG,
          message: `Return value: ${JSON.stringify(result, null, 2)}`,
        });
      }
      newOutput.push({ type: OutputType.SUCCESS, message: 'Execution finished.' });
    } catch (error) {
      if (error instanceof Error) {
        newOutput.push({ type: OutputType.ERROR, message: error.message });
      } else {
        newOutput.push({ type: OutputType.ERROR, message: String(error) });
      }
    } finally {
      // Restore original console
      window.console = originalConsole;
      setOutput(newOutput);
      setIsRunning(false);
    }
  }, [code]);

  const handleClearConsole = useCallback(() => {
    setOutput([]);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gray-900 font-sans">
      <Header />
      <div className="flex-grow flex flex-col md:flex-row overflow-hidden p-2 md:p-4 gap-4">
        {/* Sidebar for snippets */}
        <div className="w-64 bg-gray-800 rounded-lg p-4 overflow-y-auto">
          <h3 className="text-lg font-semibold text-gray-300 mb-3">Saved Snippets</h3>
          <button
            onClick={handleSaveSnippet}
            className="w-full mb-4 px-3 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-500 transition-all"
          >
            💾 Save as Snippet
          </button>
          <div className="space-y-2">
            {snippets.length === 0 ? (
              <p className="text-gray-500 text-sm italic">No snippets yet</p>
            ) : (
              snippets.map(snippet => (
                <div key={snippet.id} className="bg-gray-700 p-2 rounded">
                  <div className="flex justify-between items-start mb-1">
                    <button
                      onClick={() => handleLoadSnippet(snippet.id)}
                      className="text-sm text-blue-400 hover:text-blue-300 flex-1 text-left"
                    >
                      {snippet.name}
                    </button>
                    <button
                      onClick={() => handleDeleteSnippet(snippet.id)}
                      className="text-red-400 hover:text-red-300 ml-2"
                    >
                      ✕
                    </button>
                  </div>
                  <p className="text-xs text-gray-400">
                    {new Date(snippet.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          <Editor 
            code={code} 
            setCode={setCode} 
            onRun={handleRunCode} 
            onSave={handleSaveCode}
            isRunning={isRunning}
            savedAt={savedAt}
          />
        </div>
        <div className="flex-1 flex flex-col min-h-0">
          <Console output={output} onClear={handleClearConsole} />
        </div>
      </div>
    </div>
  );
}

export default App;
