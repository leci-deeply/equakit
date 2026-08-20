import React from 'react';
import ReactDOM from 'react-dom/client';
import 'katex/dist/katex.min.css';
import 'mathlive/fonts.css';
import '@equakit/react-answer-steps/styles.css';
import '@equakit/react-clipboard/styles.css';
import '@equakit/react-formula-input/styles.css';
import '@equakit/react-katex/styles.css';
import '@equakit/react-markdown-math/styles.css';
import './styles.css';

import { App } from './App';

const root = document.getElementById('root');
if (!root) throw new Error('缺少示例应用根节点。');

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
