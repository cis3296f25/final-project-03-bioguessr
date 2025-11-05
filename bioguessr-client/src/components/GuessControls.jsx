export default function GuessControls({
  options, guess, setGuess,
  locked, onSubmit, onNext, onBack
}) {
  return (
    <div style={{ display:'flex', gap:8, alignItems:'center', marginTop:8 }}>
      <select value={guess} onChange={e=>setGuess(e.target.value)} disabled={locked}>
        <option value="" disabled>Choose an animal…</option>
        {options.map(n => <option key={n} value={n}>{n}</option>)}
      </select>

      <button onClick={onSubmit} disabled={!guess || locked}>Submit Guess</button>
      <button onClick={onNext} disabled={!locked}>Next Round</button>
      <button onClick={onBack} style={{ marginLeft:'auto' }}>Back To Home</button>
    </div>
  );
}
