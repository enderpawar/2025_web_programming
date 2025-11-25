import React from 'react';
import ReactDOM from 'react-dom/client';
import './localStorage.js'; // localStorage 초기화
import Root from './Root.jsx';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
