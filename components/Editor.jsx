import React from 'react';

const Editor = ({ code, setCode, onRun, onSave, isRunning, savedAt }) => {
  return (
    <div className="flex flex-col h-full bg-gray-800 rounded-lg shadow-2xl overflow-hidden border border-gray-700/50">
      <div className="flex-shrink-0 flex justify-between items-center p-3 bg-gray-900/70 border-b border-gray-700/50">
        <h2 className="text-lg font-semibold text-gray-300">Code Editor</h2>
        <div className="flex gap-2 items-center">
          {savedAt && (
            <span className="text-xs text-gray-400">
              Saved {savedAt.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={onSave}
            className="px-3 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75"
          >
            💾 Save
          </button>
          <button
            onClick={onRun}
            disabled={isRunning}
            className="flex items-center px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75"
          >
          {isRunning ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
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
                className="h-5 w-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
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
      <div className="flex-grow p-1 relative">
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter your JavaScript code here..."
          className="w-full h-full p-3 bg-transparent text-gray-200 font-mono text-sm leading-6 resize-none focus:outline-none rounded-b-lg"
          spellCheck="false"
        />
      </div>
    </div>
  );
};

export default Editor;
