import { useState, useEffect } from 'react'
import './App.css'

function App() {
    const [title, setTitle] = useState('');

    useEffect(() => {
        const getTitle = async () => {
            const res = await fetch('/api/title');
            return await res.text();
        }

        setTitle(getTitle());
    }, [])

    return (
        <>
            <h1>{title}</h1>
        </>
    )
}

export default App
