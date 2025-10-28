import React from 'react';
import { OutputType } from '../types.js';

const getIconForType = (type) => {
  switch (type) {
    case OutputType.LOG:
      return <span className="text-gray-400 mr-2 text-xs">◆</span>;
    case OutputType.ERROR:
      return <span className="text-red-400 mr-2 font-bold text-xs">✖</span>;
    case OutputType.INFO:
      return <span className="text-blue-400 mr-2 font-bold text-xs">ℹ</span>;
    case OutputType.WARN:
      return <span className="text-yellow-400 mr-2 font-bold text-xs">⚠</span>;
    case OutputType.SUCCESS:
      return <span className="text-green-400 mr-2 font-bold text-xs">✔</span>;
    default:
      return null;
  }
};

const getStyleForType = (type) => {
  switch (type) {
    case OutputType.ERROR:
      return 'text-red-400';
    case OutputType.SUCCESS:
      return 'text-green-400';
    case OutputType.WARN:
      return 'text-yellow-400';
    case OutputType.INFO:
      return 'text-blue-400 italic';
    default:
      return 'text-gray-200';
  }
};

const Console = ({ output, onClear }) => {
  return (
    <div className="flex flex-col h-full bg-gray-800 rounded-lg shadow-2xl overflow-hidden border border-gray-700/50">
      <div className="flex-shrink-0 flex justify-between items-center p-3 bg-gray-900/70 border-b border-gray-700/50">
        <h2 className="text-lg font-semibold text-gray-300">Console</h2>
        <button
          onClick={onClear}
          className="flex items-center px-4 py-2 bg-gray-600 text-white font-semibold rounded-md hover:bg-gray-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-75"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
          Clear
        </button>
      </div>
      <div className="flex-grow p-4 overflow-y-auto font-mono text-sm leading-6 space-y-2">
        {output.length === 0 ? (
          <p className="text-gray-500 italic">Console output will appear here...</p>
        ) : (
          output.map((line, index) => (
            <div key={index} className={`flex items-start break-words ${getStyleForType(line.type)}`}>
              <div className="flex-shrink-0 mt-0.5">{getIconForType(line.type)}</div>
              <pre className="whitespace-pre-wrap flex-1">{line.message}</pre>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Console;
