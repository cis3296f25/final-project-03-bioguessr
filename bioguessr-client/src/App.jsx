import { useState, useEffect } from 'react'
import './App.css'

function App() {
    const [title, setTitle] = useState('');
    const [bottomTest, setBottomText] = useState('');
    useEffect(() => {
        const getTitle = async () => {
            const res = await fetch('/api/title');
            return await res.text();
        }
        const getBottomText = async () => {
            const res = await fetch('/api/bottomText');
            return await res.text();
        }
        setTitle(getTitle());
        setBottomText(getBottomText());
    }, [])

    return (
        <>
            <h1>{title}</h1>
            <p>{bottomTest}</p>
        </>
    )
}

export default App
