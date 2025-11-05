export default function AnimalName({ name, locked }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize:12, color:'#666' }}>Animal Name</div>
      <div style={{ fontSize:20, fontWeight:700 }}>{locked ? name : "?"}</div>
    </div>
  );
}
