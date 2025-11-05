export default function AnimalImage({ src, alt }) {
  return (
    <div style={{ margin:'12px 0' }}>
      <img
        src={src}
        alt={alt}
        style={{ width:'100%', maxHeight:400, objectFit:'cover', borderRadius:8, border:'1px solid #ddd' }}
      />
    </div>
  );
}
