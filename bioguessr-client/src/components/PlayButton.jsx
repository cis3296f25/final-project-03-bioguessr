export default function PlayButton({
  onClick,
  disabled = false,
  children = "▶ Play Game",
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label="Play Game"
      className="rounded-lg px-4 py-2 font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
    >
      {children}
    </button>
  );
}
