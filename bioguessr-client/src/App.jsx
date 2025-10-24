import { Routes, Route } from 'react-router-dom';
import './App.css'
import HomePage from './homePage.jsx';
import PlayPage from './playPage.jsx';

function App() {
    return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      
      <Route path="/play" element={<PlayPage />} />
    </Routes>
    )
}

export default App
