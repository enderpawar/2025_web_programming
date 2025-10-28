import React, { useState, useCallback } from 'react';
import Editor from './components/Editor';
import Console from './components/Console';
import Header from './components/Header';
import { OutputType } from './types.js';

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
  const [code, setCode] = useState(defaultCode);
  const [output, setOutput] = useState([]);
  const [isRunning, setIsRunning] = useState(false);

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
        <div className="flex-1 flex flex-col min-h-0">
          <Editor code={code} setCode={setCode} onRun={handleRunCode} isRunning={isRunning} />
        </div>
        <div className="flex-1 flex flex-col min-h-0">
          <Console output={output} onClear={handleClearConsole} />
        </div>
      </div>
    </div>
  );
}

export default App;
