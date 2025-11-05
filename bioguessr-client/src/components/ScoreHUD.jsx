export default function ScoreHUD({ score, round, totalRounds, logoSrc }) {
  return (
    <header style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
      {logoSrc ? (
        <img src={logoSrc} alt="logo" style={{ width:'40%', height:'auto', border:'2px solid black' }} />
      ) : <div />}
      <div style={{ display:'flex', gap:12 }}>
        <div><strong>Score:</strong> {score}</div>
        <div><strong>Round:</strong> {round} / {totalRounds}</div>
      </div>
    </header>
  );
}
