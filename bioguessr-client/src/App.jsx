import { Routes, Route } from 'react-router-dom';
import './App.css'
import HomePage from './homePage.jsx';
import PlayPage from './playPage.jsx';
import DailyPage from './dailyPage';

function App() {
    return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      
      <Route path="/play" element={<PlayPage />} />

      <Route path="/daily" element = {<DailyPage/>}/>
    </Routes>
    )
}

export default App
