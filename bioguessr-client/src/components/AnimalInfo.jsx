export default function AnimalInfo({ scientificName, commonName, revealed }) {
  return (
    <>
      <div className="animal-info">
        <div className="animal-name-label">Scientific Name</div>
        <div className="scientific-name">{scientificName}</div>
      </div>
      <div className="animal-info">
        <div className="animal-name-label">Common Name</div>
        <div className={revealed ? "animal-name-revealed" : "animal-name-hidden"}>
          {revealed ? commonName : "?"}
        </div>
      </div>
    </>
  );
}

