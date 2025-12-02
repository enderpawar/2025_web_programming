import React from 'react';

const Editor = ({ code, setCode, onRun, isRunning, problem, onCustomTest }) => {
  const [showCustomTest, setShowCustomTest] = React.useState(false);

  return (
    <div className="editor-container">
      <div className="editor-header">
        <h2 className="editor-title">Code Editor</h2>
        <div style={{display: 'flex', gap: '0.5rem'}}>
          {problem && (
            <button
              onClick={() => setShowCustomTest(!showCustomTest)}
              className="btn"
              style={{backgroundColor: showCustomTest ? '#059669' : '#10b981', color: 'white'}}
            >
              {showCustomTest ? '✕ Close Test' : '🧪 Custom Test'}
            </button>
          )}
          <button
            onClick={onRun}
            disabled={isRunning}
            className="btn btn-primary"
          >
            {isRunning ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  style={{width: '1.25rem', height: '1.25rem', display: 'inline-block', marginRight: '0.5rem'}}
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Running...
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  style={{width: '1.25rem', height: '1.25rem', display: 'inline-block', marginRight: '0.5rem'}}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Run
              </>
            )}
          </button>
        </div>
      </div>
      {showCustomTest && problem && (
        <div style={{padding: '0.75rem', backgroundColor: 'var(--color-bg-darker)', borderBottom: '1px solid var(--color-border)'}}>
          <CustomTestPanel code={code} problem={problem} onCustomTest={onCustomTest} />
        </div>
      )}
      <div style={{flex: 1, padding: '0.25rem', position: 'relative'}}>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter your JavaScript code here..."
          className="code-textarea"
          spellCheck="false"
        />
      </div>
    </div>
  );
};

const CustomTestPanel = ({ code, problem, onCustomTest }) => {
  const [customInput, setCustomInput] = React.useState('');
  const [customTestResult, setCustomTestResult] = React.useState(null);

  const handleRunCustomTest = () => {
    if (!customInput.trim()) return;
    
    try {
      const parsedInput = JSON.parse(customInput);
      const inputArray = Array.isArray(parsedInput) ? parsedInput : [parsedInput];
      
      const functionName = problem?.functionName || 'solve';
      const func = new Function(`
        ${code}
        return ${functionName};
      `)();
      
      if (typeof func !== 'function') {
        throw new Error(`${functionName} is not a function`);
      }
      
      const result = func(...inputArray);
      
      setCustomTestResult({
        success: true,
        input: parsedInput,
        output: result
      });
      
      if (onCustomTest) {
        onCustomTest({ success: true, input: parsedInput, output: result });
      }
    } catch (e) {
      setCustomTestResult({
        success: false,
        error: e.message
      });
      
      if (onCustomTest) {
        onCustomTest({ success: false, error: e.message });
      }
    }
  };

  return (
    <>
      <div className="test-case-label" style={{color: '#10b981', marginBottom: '0.5rem', fontWeight: 600}}>
        🧪 Custom Test Input
      </div>
      <div className="test-case-label" style={{marginBottom: '0.5rem', fontSize: '0.75rem'}}>
        Enter input in JSON format (e.g., [[2,7,11,15],9])
      </div>
      <div style={{display: 'flex', gap: '0.5rem'}}>
        <input
          type="text"
          className="input"
          style={{flex: 1, fontFamily: 'monospace', fontSize: '0.875rem'}}
          placeholder='[[2,7,11,15],9]'
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleRunCustomTest();
            }
          }}
        />
        <button
          onClick={handleRunCustomTest}
          disabled={!customInput.trim()}
          className="btn btn-primary"
          style={{backgroundColor: '#10b981', fontSize: '0.875rem'}}
        >
          Run
        </button>
      </div>
      
      {customTestResult && (
        <div 
          className={`test-result-card ${customTestResult.success ? 'test-result-pass' : 'test-result-fail'}`} 
          style={{marginTop: '0.75rem'}}
        >
          {customTestResult.success ? (
            <>
              <div className="test-result-badge-pass">✓ Test Passed</div>
              <div>
                <div>
                  <span className="test-case-label">Input:</span>
                  <pre className="test-case-value">
                    {JSON.stringify(customTestResult.input)}
                  </pre>
                </div>
                <div>
                  <span className="test-case-label">Output:</span>
                  <pre className="test-case-value" style={{color: '#10b981'}}>
                    {JSON.stringify(customTestResult.output)}
                  </pre>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="test-result-badge-fail">✗ Error</div>
              <div className="test-result-badge-fail">{customTestResult.error}</div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default Editor;
