"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { auth, db } from "@/lib/firebase/config";
import Link from "next/link";

type StatusKomik = "tamat" | "berjalan";

interface Komik {
  id: string;
  slug: string;
  judul: string;
  poster: string;
  genre: string[];
  jumlahEpisode: number;
  status: StatusKomik;
  rating: number;
}

function StoryCard({ komik }: { komik: Komik }) {
  const statusLabel = komik.status === "tamat" ? "Tamat" : "Berjalan";

  return (
    <Link href={`/comics/${komik.slug}`} className="block">
      <article className="story-card">
        <div className="story-poster">
          {komik.poster ? (
            <img
              src={komik.poster}
              alt={`Poster ${komik.judul}`}
              loading="lazy"
            />
          ) : (
            <div className="flex aspect-[3/4] items-center justify-center bg-[#ede9df] text-sm font-semibold text-[#5b5f5a]">
              Belum ada poster
            </div>
          )}

          <span className="rating-badge">★ {komik.rating.toFixed(1)}</span>

          <span className={`status-badge status-badge--${komik.status}`}>
            {statusLabel}
          </span>
        </div>

        <div className="story-card-body">
          <h3>{komik.judul}</h3>

          <p className="story-genre">
            {komik.genre.length > 0 ? komik.genre.join(", ") : "-"}
          </p>

          <div className="story-stats">
            <span className="stat-chip">{komik.jumlahEpisode} Episode</span>
          </div>
        </div>
      </article>
    </Link>
  );
}

export default function Home() {
  const [komikPopuler, setKomikPopuler] = useState<Komik[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "semua" | "tamat" | "berjalan"
  >("semua");

  const [genreFilter, setGenreFilter] = useState("semua");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchComics = async () => {
      try {
        setLoading(true);
        setError("");

        const snapshot = await getDocs(collection(db, "comics"));

        const comicData: Komik[] = await Promise.all(
          snapshot.docs.map(async (comicDoc) => {
            const data = comicDoc.data();

            const chapterQuery = query(
              collection(db, "chapter"),
              where("comicId", "==", comicDoc.id),
            );

            const chapterSnapshot = await getDocs(chapterQuery);

            return {
              id: comicDoc.id,
              slug: data.slug || comicDoc.id,
              judul: data.title || "",
              poster: data.poster || "",
              genre: Array.isArray(data.genre)
                ? data.genre
                : data.genre
                  ? [data.genre]
                  : [],
              jumlahEpisode: chapterSnapshot.size,
              status: data.status === "Completed" ? "tamat" : "berjalan",
              rating: data.rating || 0,
            };
          }),
        );

        setKomikPopuler(comicData);
      } catch (error) {
        console.error("Gagal mengambil data komik:", error);
        setError("Gagal mengambil data komik. Silakan coba lagi.");
      } finally {
        setLoading(false);
      }
    };

    fetchComics();
  }, []);

  const filteredComics = komikPopuler.filter((komik) => {
    const matchesSearch = komik.judul
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "semua" || komik.status === statusFilter;

    const matchesGenre =
      genreFilter === "semua" ||
      komik.genre.some(
        (genre) => genre.toLowerCase() === genreFilter.toLowerCase(),
      );

    return matchesSearch && matchesStatus && matchesGenre;
  });

  const genres = Array.from(
    new Set(
      komikPopuler
        .flatMap((komik) => komik.genre)
        .map((genre) => genre.trim())
        .filter((genre) => genre !== ""),
    ),
  );

  if (loading) {
    return (
      <main className="min-h-screen bg-[#ede9df] p-8">
        <div className="mx-auto max-w-6xl border-[3px] border-[#17191b] bg-white p-8 text-center">
          <p className="text-sm font-semibold text-[#5b5f5a]">
            Memuat komik...
          </p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[#ede9df] p-8">
        <div className="mx-auto flex min-h-[80vh] max-w-6xl items-center justify-center">
          <div className="w-full border-[3px] border-[#17191b] bg-white p-8 text-center">
            <h1 className="mx-auto max-w-none border-2 border-[#e23d28] bg-[#e23d28]/10 px-4 py-3 text-base font-bold leading-normal text-[#e23d28]">
              Terjadi kesalahan
            </h1>

            <p className="mt-4 text-sm text-[#5b5f5a]">{error}</p>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-6 border-2 border-[#17191b] bg-[#17191b] px-4 py-2 text-sm font-semibold text-[#ede9df] transition hover:bg-[#ede9df] hover:text-[#17191b]"
            >
              Coba lagi
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="site-shell">
      <header className="site-header">
        <div className="container header-content">
          <a className="brand" href="#beranda" aria-label="Panelia beranda">
            <span className="brand-mark">P</span>
            <span>panelia</span>
          </a>

          <nav className="main-nav" aria-label="Navigasi utama">
            <a className="active" href="#beranda">
              Beranda
            </a>
            <a href="#populer">Populer</a>
            <a href="#genre">Genre</a>
            <a href="#terbaru">Terbaru</a>
          </nav>

          <div className="flex items-center gap-3">
            <div className="search-button">
              <span aria-hidden="true">⌕</span>

              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari judul..."
                aria-label="Cari judul"
              />
            </div>

            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/profile"
                  className="border-2 border-[#17191b] bg-[#f5c430] px-4 py-2 text-sm font-bold text-[#17191b] transition hover:bg-[#17191b] hover:text-[#ede9df]"
                >
                  Akun
                </Link>

                <button
                  type="button"
                  onClick={async () => {
                    await signOut(auth);
                  }}
                  className="border-2 border-[#17191b] bg-[#ede9df] px-4 py-2 text-sm font-bold text-[#17191b] transition hover:bg-[#17191b] hover:text-[#ede9df]"
                >
                  Keluar
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="border-2 border-[#17191b] bg-[#17191b] px-4 py-2 text-sm font-bold text-[#ede9df] transition hover:bg-[#f5c430] hover:text-[#17191b]"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </header>

      <main id="beranda" className="main-content">
        <section className="container hero-section">
          <div className="hero-copy">
            <h1>Ribuan komik, satu tempat baca.</h1>

            <p className="hero-description">
              Manga, manhwa, dan webtoon pilihan bisa kamu baca langsung dari
              browser. Tandai bab favorit dan lanjutkan kapan pun kamu mau.
            </p>

            <a className="primary-button" href="#populer">
              Mulai baca gratis
            </a>
          </div>
        </section>

        <section id="populer" className="container content-section">
          <div className="section-heading">
            <h2>Yang sedang ramai dibaca</h2>
            <a href="#terbaru">Lihat semua judul</a>
          </div>

          <div className="mb-6 flex flex-wrap gap-2">
            {[
              { value: "semua", label: "Semua" },
              { value: "berjalan", label: "Berjalan" },
              { value: "tamat", label: "Tamat" },
            ].map((filter) => {
              const isActive = statusFilter === filter.value;

              return (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() =>
                    setStatusFilter(
                      filter.value as "semua" | "tamat" | "berjalan",
                    )
                  }
                  className={`border-2 border-[#17191b] px-4 py-2 text-sm font-bold transition ${
                    isActive
                      ? "bg-[#17191b] text-[#ede9df]"
                      : "bg-[#ede9df] text-[#17191b] hover:bg-[#17191b] hover:text-[#ede9df]"
                  }`}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>

          <div className="story-grid">
            {filteredComics.length > 0 ? (
              filteredComics.map((komik) => (
                <StoryCard key={komik.id} komik={komik} />
              ))
            ) : (
              <div className="col-span-full border-[3px] border-[#17191b] bg-white p-8 text-center">
                <h3 className="text-lg font-bold text-[#17191b]">
                  Komik tidak ditemukan
                </h3>

                <p className="mt-2 text-sm text-[#5b5f5a]">
                  Tidak ada komik yang sesuai dengan pencarian atau filter yang
                  dipilih.
                </p>
              </div>
            )}
          </div>
        </section>

        <section id="genre" className="container genre-section">
          <div className="section-heading">
            <h2>Jelajahi genre</h2>
          </div>

          <div className="genre-list">
            <a href="#populer" onClick={() => setGenreFilter("semua")}>
              Semua <span>✦</span>
            </a>

            {genres.map((genre) => (
              <a
                key={genre}
                href="#populer"
                onClick={() => setGenreFilter(genre)}
              >
                {genre} <span>↗</span>
              </a>
            ))}
          </div>
        </section>
      </main>

      <footer id="terbaru" className="site-footer">
        <div className="container footer-content">
          <div>
            <a className="brand footer-brand" href="#beranda">
              <span className="brand-mark">P</span>
              <span>panelia</span>
            </a>

            <p>Tempat cerita menemukan pembacanya.</p>
          </div>

          <div className="footer-links">
            <a href="#beranda">Tentang kami</a>
            <a href="#genre">Genre</a>
            <a href="#populer">Bantuan</a>
          </div>

          <p className="copyright">© 2025 Panelia</p>
        </div>
      </footer>
    </div>
  );
}
