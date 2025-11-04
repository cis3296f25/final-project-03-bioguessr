export default function PrimaryButton({ children, ...props }) {
  return (
    <button
      {...props}
      style={{
        padding: '0.8rem 1.2rem',
        borderRadius: 12,
        fontWeight: 700,
        border: '2px solid #fff',
        background: '#111',
        color: '#fff',
        boxShadow: '0 6px 20px rgba(0,0,0,.35)',
        cursor: 'pointer'
      }}
    >
      {children}
    </button>
  );
}
