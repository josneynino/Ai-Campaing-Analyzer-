import React, { useState, useRef } from "react";
import { api } from "../lib/api";

type Variation = {
  id: string;
  style: string;
  url: string;
  description: string;
};

export default function PhotoEditorPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [variations, setVariations] = useState<Variation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      setVariations([]);
      setError(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError(null);
    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await api.post("/photo-editor/process", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 20000 
      });
      setVariations(res.data.variations);
    } catch (err: any) {
      console.error(err);
      setError("Error procesando la imagen con IA.");
    } finally {
      setLoading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selected = e.dataTransfer.files[0];
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      setVariations([]);
      setError(null);
    }
  }

  return (
    <section className="card-grid" style={{ gridTemplateColumns: "1fr" }}>
      <div className="card">
        <div className="card-header-row">
          <div>
            <h2>Transformación Visual con IA</h2>
            <p className="muted" style={{ margin: 0 }}>
              Sube una foto y deja que nuestro motor de IA genere variaciones listas para campañas de marketing (Demostración).
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="analysis-form" style={{ marginTop: "1.5rem" }}>
          <div 
            className="upload-dropzone"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: "2px dashed var(--border-strong)",
              borderRadius: "var(--radius-lg)",
              padding: "3rem 1rem",
              textAlign: "center",
              cursor: "pointer",
              background: "var(--surface-muted)",
              transition: "border-color 0.2s"
            }}
          >
            {preview ? (
              <img src={preview} alt="Upload preview" style={{ maxHeight: "200px", borderRadius: "var(--radius-md)" }} />
            ) : (
              <>
                <p style={{ margin: "0 0 0.5rem", fontWeight: 600 }}>Clica o arrastra aquí tu foto</p>
                <p className="muted" style={{ margin: 0 }}>PNG, JPG hasta 10MB</p>
              </>
            )}
            <input 
              type="file" 
              accept="image/png, image/jpeg, image/webp"
              style={{ display: "none" }} 
              ref={fileInputRef}
              onChange={handleFileChange}
            />
          </div>

          <button 
            type="submit" 
            className="primary-button" 
            disabled={!file || loading}
            style={{ alignSelf: "flex-start", marginTop: "1rem" }}
          >
            {loading ? "Procesando mágicamente..." : "Generar variaciones corporativas"}
          </button>

          {error && <p className="error-text" style={{ marginTop: "1rem" }}>{error}</p>}
        </form>
      </div>

      {variations.length > 0 && (
        <div className="card">
          <h2>Galería Generada</h2>
          <p className="muted" style={{ marginBottom: "1.5rem" }}>Resultados optimizados por estilo y formato para tus campañas.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.5rem" }}>
            {variations.map(v => (
              <div key={v.id} style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
                <img src={v.url} alt={v.style} style={{ width: "100%", height: "200px", objectFit: "cover", display: "block" }} />
                <div style={{ padding: "1rem" }}>
                  <p style={{ margin: "0 0 0.5rem", fontWeight: 600, fontSize: "0.9rem" }}>{v.style}</p>
                  <p className="muted" style={{ margin: 0, fontSize: "0.8rem", lineHeight: 1.4 }}>{v.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
