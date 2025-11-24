import React, { useState } from 'react';
import { OutputType } from '../types.js';

const getIconForType = (type, isDark) => {
  switch (type) {
    case OutputType.LOG:
      return <span className={`${isDark ? 'text-gray-400' : 'text-gray-500'} mr-2 text-xs`}>◆</span>;
    case OutputType.ERROR:
      return <span className={`${isDark ? 'text-red-400' : 'text-red-600'} mr-2 font-bold text-xs`}>✖</span>;
    case OutputType.INFO:
      return <span className={`${isDark ? 'text-blue-400' : 'text-blue-600'} mr-2 font-bold text-xs`}>ℹ</span>;
    case OutputType.WARN:
      return <span className={`${isDark ? 'text-yellow-400' : 'text-yellow-600'} mr-2 font-bold text-xs`}>⚠</span>;
    case OutputType.SUCCESS:
      return <span className={`${isDark ? 'text-green-400' : 'text-green-600'} mr-2 font-bold text-xs`}>✔</span>;
    default:
      return null;
  }
};

const getStyleForType = (type, isDark) => {
  switch (type) {
    case OutputType.ERROR:
      return isDark ? 'text-red-400' : 'text-red-600';
    case OutputType.SUCCESS:
      return isDark ? 'text-green-400' : 'text-green-600';
    case OutputType.WARN:
      return isDark ? 'text-yellow-400' : 'text-yellow-600';
    case OutputType.INFO:
      return isDark ? 'text-blue-400 italic' : 'text-blue-600 italic';
    default:
      return isDark ? 'text-gray-200' : 'text-gray-800';
  }
};

const Console = ({ output, onClear }) => {
  const [isDark, setIsDark] = useState(true);

  return (
    <div
      className={`flex flex-col h-full rounded-lg shadow-2xl overflow-hidden border ${
        isDark
          ? 'bg-gray-800 border-gray-700/50'
          : 'bg-white border-gray-200'
      }`}
    >
      <div
        className={`flex-shrink-0 flex justify-between items-center p-3 border-b ${
          isDark
            ? 'bg-gray-900/70 border-gray-700/50'
            : 'bg-gray-100 border-gray-200'
        }`}
      >
        <h2 className={`text-lg font-semibold ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>Console</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setIsDark((d) => !d)}
            className={`px-3 py-1 rounded-md font-semibold transition-all duration-200 focus:outline-none focus:ring-2 ${
              isDark
                ? 'bg-gray-700 text-gray-100 hover:bg-gray-600 focus:ring-gray-400'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400'
            }`}
          >
            {isDark ? '라이트 모드' : '다크 모드'}
          </button>
          <button
            onClick={onClear}
            className={`px-3 py-1 font-semibold rounded-md transition-all duration-200 focus:outline-none focus:ring-2 ${
              isDark
                ? 'bg-red-600 text-white hover:bg-red-500 focus:ring-red-400'
                : 'bg-red-500 text-white hover:bg-red-400 focus:ring-red-300'
            }`}
          >
            Clear
          </button>
        </div>
      </div>
      <div
        className={`flex-grow overflow-y-auto p-3 font-mono text-sm leading-relaxed ${
          isDark ? 'text-gray-200' : 'text-gray-800'
        }`}
      >
        {output.length === 0 ? (
          <div className={`${isDark ? 'text-gray-500' : 'text-gray-400'} italic text-center mt-8`}>
            Console output will appear here...
          </div>
        ) : (
          output.map((entry, index) => (
            <div
              key={index}
              className={`mb-2 flex items-start ${getStyleForType(entry.type, isDark)}`}
            >
              {getIconForType(entry.type, isDark)}
              <pre className="whitespace-pre-wrap break-words flex-1">{entry.message}</pre>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Console;
