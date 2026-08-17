import React from 'react';
import ReactDOM from 'react-dom/client';
import 'katex/dist/katex.min.css';
import '@math-rich-editor/react/styles.css';
import './styles.css';

import { App } from './App';

const root = document.getElementById('root');
if (!root) throw new Error('Demo root element is missing.');

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
