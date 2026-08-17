import React from 'react';
import ReactDOM from 'react-dom/client';
import 'katex/dist/katex.min.css';
import '@equakit/react/styles.css';
import './styles.css';

import { App } from './App';

const root = document.getElementById('root');
if (!root) throw new Error('缺少示例应用根节点。');

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
