import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './homePage.jsx'
import PlayPage from './playPage.jsx'
import DailyPage from './dailyPage.jsx'
import './App.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/play" element={<PlayPage />} />
        
        <Route path="/daily" element={<DailyPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)