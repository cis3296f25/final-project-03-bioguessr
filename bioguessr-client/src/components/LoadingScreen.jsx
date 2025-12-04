import GameLayout from './GameLayout';

export default function LoadingScreen({ message }) {
  return (
    <GameLayout centered>
      <h2 className="title" style={{ fontSize: '2rem' }}>{message || "Loading..."}</h2>
    </GameLayout>
  );
}

