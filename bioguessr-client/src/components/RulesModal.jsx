export default function RulesModal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {children}
        <button onClick={onClose} style={{ marginTop: 12 }}>Close</button>
      </div>
    </div>
  );
}
