import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import './styles/toast.css'
import 'sweetalert2/dist/sweetalert2.css'

// Restore auth handed off from a opener tab (e.g. video call opened via window.open)
try {
  const handoff = localStorage.getItem('vc_auth_handoff');
  if (handoff) {
    const { token, user } = JSON.parse(handoff);
    if (token) sessionStorage.setItem('token', token);
    if (user) sessionStorage.setItem('user', user);
    localStorage.removeItem('vc_auth_handoff');
  }
} catch (e) {
  localStorage.removeItem('vc_auth_handoff');
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)