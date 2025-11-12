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
          className="px-3 py-1 bg-red-600 text-white font-semibold rounded-md hover:bg-red-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-75"
        >
          Clear
        </button>
      </div>
      <div className="flex-grow overflow-y-auto p-3 font-mono text-sm leading-relaxed">
        {output.length === 0 ? (
          <div className="text-gray-500 italic text-center mt-8">
            Console output will appear here...
          </div>
        ) : (
          output.map((entry, index) => (
            <div key={index} className={`mb-2 flex items-start ${getStyleForType(entry.type)}`}>
              {getIconForType(entry.type)}
              <pre className="whitespace-pre-wrap break-words flex-1">{entry.message}</pre>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Console;
