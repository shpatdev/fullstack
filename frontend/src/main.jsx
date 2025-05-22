// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { BrowserRouter } from 'react-router-dom'; // Sigurohu që importohet këtu

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter> {/* <-- I VETMI BrowserRouter DUHET TË JETË KËTU */}
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)