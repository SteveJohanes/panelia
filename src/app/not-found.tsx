export default function NotFound() {
  return (
    <main className="not-found-page">
      <div className="not-found-container">
        <div className="not-found-card">
          <p className="not-found-code">404</p>

          <h1>Halaman tidak ditemukan</h1>

          <p className="not-found-description">
            Halaman yang kamu cari tidak tersedia atau mungkin sudah
            dipindahkan.
          </p>

          <a href="/" className="not-found-button">
            ← Kembali ke beranda
          </a>
        </div>
      </div>
    </main>
  );
}