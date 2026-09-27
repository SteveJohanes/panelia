"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "@/lib/firebase/config";

type Comic = {
  id: string;
  title: string;
  slug: string;
  description: string;
  author: string;
  status: string;
  genre: string[];
  poster: string;
  rating: number;
};

type Chapter = {
  id: string;
  comicId: string;
  chapterNumber: number;
  title: string;
};

const DESCRIPTION_PREVIEW_LIMIT = 220;

export default function ComicDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [comic, setComic] = useState<Comic | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);

  const [user, setUser] = useState<User | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [descriptionExpanded, setDescriptionExpanded] = useState(false);

  // =========================
  // AUTH
  // =========================

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  // =========================
  // FETCH COMIC + CHAPTER
  // =========================

  useEffect(() => {
    const fetchComic = async () => {
      try {
        setLoading(true);
        setError("");

        const comicQuery = query(
          collection(db, "comics"),
          where("slug", "==", id)
        );

        const comicSnapshot = await getDocs(comicQuery);

        if (comicSnapshot.empty) {
          setError("Komik tidak ditemukan.");
          setLoading(false);
          return;
        }

        const comicDoc = comicSnapshot.docs[0];

        const comicData = {
          id: comicDoc.id,
          ...comicDoc.data(),
        } as Comic;

        setComic(comicData);

        const chapterQuery = query(
          collection(db, "chapter"),
          where("comicId", "==", comicDoc.id)
        );

        const chapterSnapshot = await getDocs(chapterQuery);

        const chapterData: Chapter[] = chapterSnapshot.docs
          .map((chapterDoc) => {
            const data = chapterDoc.data();

            return {
              id: chapterDoc.id,
              comicId: String(data.comicId || ""),
              chapterNumber: Number(data.chapterNumber || 0),
              title: String(data.title || ""),
            };
          })
          .sort((a, b) => a.chapterNumber - b.chapterNumber);

        setChapters(chapterData);
      } catch (error) {
        console.error("Error mengambil detail komik:", error);
        setError("Gagal mengambil data komik.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchComic();
    }
  }, [id]);

  // =========================
  // CHECK BOOKMARK
  // =========================

  useEffect(() => {
    const checkBookmark = async () => {
      if (!user || !comic) {
        setIsBookmarked(false);
        return;
      }

      try {
        const bookmarkRef = doc(db, "users", user.uid, "bookmarks", comic.id);
        const bookmarkSnapshot = await getDoc(bookmarkRef);
        setIsBookmarked(bookmarkSnapshot.exists());
      } catch (error) {
        console.error("Error mengecek bookmark:", error);
      }
    };

    checkBookmark();
  }, [user, comic]);

  // =========================
  // BOOKMARK
  // =========================

  const handleBookmark = async () => {
    if (!user) {
      window.location.href = "/login";
      return;
    }

    if (!comic) {
      return;
    }

    try {
      setBookmarkLoading(true);

      const bookmarkRef = doc(db, "users", user.uid, "bookmarks", comic.id);

      if (isBookmarked) {
        await deleteDoc(bookmarkRef);
        setIsBookmarked(false);
      } else {
        await setDoc(bookmarkRef, {
          comicId: comic.id,
          title: comic.title,
          slug: comic.slug,
          poster: comic.poster || "",
          lastChapterId: null,
          lastChapterNumber: null,
          updatedAt: serverTimestamp(),
        });

        setIsBookmarked(true);
      }
    } catch (error) {
      console.error("Error mengubah bookmark:", error);
    } finally {
      setBookmarkLoading(false);
    }
  };

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <main className="min-h-screen bg-[#ede9df] px-4 py-10">
        <div className="mx-auto max-w-6xl text-center">
          <p className="font-bold text-[#17191b]">Memuat komik...</p>
        </div>
      </main>
    );
  }

  // =========================
  // ERROR
  // =========================

  if (error || !comic) {
    return (
      <main className="min-h-screen bg-[#ede9df] px-4 py-10">
        <div className="mx-auto max-w-6xl">
          <div className="border-[3px] border-[#17191b] bg-white p-8 text-center">
            <h1 className="text-2xl font-black text-[#17191b]">
              Komik Tidak Ditemukan
            </h1>

            <p className="mt-2 text-[#5b5f5a]">
              {error || "Data komik tidak tersedia."}
            </p>

            <Link
              href="/"
              className="mt-6 inline-block border-2 border-[#17191b] bg-[#17191b] px-5 py-3 font-bold text-[#ede9df] transition hover:bg-[#f5c430] hover:text-[#17191b]"
            >
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const description = comic.description || "Belum ada deskripsi.";
  const isLongDescription = description.length > DESCRIPTION_PREVIEW_LIMIT;

  // =========================
  // HALAMAN UTAMA
  // =========================

  return (
    <main className="min-h-screen bg-[#ede9df] px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/"
          className="mb-6 inline-block font-bold text-[#17191b] hover:underline"
        >
          ← Kembali
        </Link>

        <section className="border-[3px] border-[#17191b] bg-white p-6 md:p-8">
          <div className="grid gap-8 md:grid-cols-[260px_1fr]">
            <div>
              {comic.poster ? (
                <img
                  src={comic.poster}
                  alt={comic.title}
                  className="w-full border-[3px] border-[#17191b] object-cover"
                />
              ) : (
                <div className="flex aspect-[2/3] items-center justify-center border-[3px] border-[#17191b] bg-[#ede9df] text-center font-bold text-[#17191b]">
                  Tidak ada poster
                </div>
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="border-2 border-[#17191b] bg-[#f5c430] px-3 py-1.5 text-xs font-black uppercase text-[#17191b]">
                  {comic.status}
                </span>

                <span className="border-2 border-[#17191b] bg-[#ede9df] px-3 py-1.5 text-xs font-black text-[#17191b]">
                  ★ {Number(comic.rating || 0).toFixed(1)}
                </span>
              </div>

              <h1 className="mt-4 text-4xl font-black text-[#17191b]">
                {comic.title}
              </h1>

              <div className="mt-5 space-y-4 text-sm text-[#17191b]">
                <p>
                  <span className="font-black">Author:</span>{" "}
                  {comic.author || "-"}
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-black">Genre:</span>
                  {comic.genre?.length ? (
                    comic.genre.map((genreItem) => (
                      <span
                        key={genreItem}
                        className="border border-[#17191b] px-2.5 py-1 text-xs font-semibold text-[#17191b]"
                      >
                        {genreItem}
                      </span>
                    ))
                  ) : (
                    <span>-</span>
                  )}
                </div>

                <p>
                  <span className="font-black">Jumlah Chapter:</span>{" "}
                  {chapters.length}
                </p>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                {user ? (
                  <button
                    type="button"
                    onClick={handleBookmark}
                    disabled={bookmarkLoading}
                    className={`border-2 border-[#17191b] px-5 py-3 font-black transition ${
                      isBookmarked
                        ? "bg-[#f5c430] text-[#17191b] hover:bg-[#17191b] hover:text-[#ede9df]"
                        : "bg-[#17191b] text-[#ede9df] hover:bg-[#f5c430] hover:text-[#17191b]"
                    } disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    {bookmarkLoading
                      ? "Menyimpan..."
                      : isBookmarked
                        ? "✓ Tersimpan"
                        : "Bookmark"}
                  </button>
                ) : (
                  <Link
                    href="/login"
                    className="border-2 border-[#17191b] bg-[#17191b] px-5 py-3 font-black text-[#ede9df] transition hover:bg-[#f5c430] hover:text-[#17191b]"
                  >
                    Login untuk Bookmark
                  </Link>
                )}
              </div>

              <div className="mt-6">
                <h2 className="text-xl font-black text-[#17191b]">
                  Deskripsi
                </h2>

                <p
                  className={`mt-3 whitespace-pre-line leading-7 text-[#5b5f5a] ${
                    !descriptionExpanded && isLongDescription ? "line-clamp-4" : ""
                  }`}
                >
                  {description}
                </p>

                {isLongDescription && (
                  <button
                    type="button"
                    onClick={() => setDescriptionExpanded((prev) => !prev)}
                    className="mt-2 text-sm font-bold text-[#2c5f9e] hover:underline"
                  >
                    {descriptionExpanded ? "Tampilkan lebih sedikit" : "Baca selengkapnya"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 border-[3px] border-[#17191b] bg-white p-6 md:p-8">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-black text-[#17191b]">
              Daftar Chapter
            </h2>

            <span className="border-2 border-[#17191b] bg-[#ede9df] px-3 py-1.5 text-sm font-bold text-[#17191b]">
              {chapters.length} Chapter
            </span>
          </div>

          {chapters.length === 0 ? (
            <div className="mt-5 border-2 border-dashed border-[#17191b] bg-[#ede9df] p-8 text-center">
              <p className="font-bold text-[#17191b]">Belum ada chapter.</p>
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {chapters.map((chapter) => (
                <Link
                  key={chapter.id}
                  href={`/comics/${comic.slug}/chapter/${chapter.id}`}
                  className="flex items-center justify-between gap-4 border-2 border-[#17191b] bg-[#ede9df] p-4 transition hover:bg-[#f5c430]"
                >
                  <div>
                    <p className="font-black text-[#17191b]">
                      Chapter {chapter.chapterNumber}
                    </p>

                    <p className="mt-1 text-sm text-[#5b5f5a]">
                      {chapter.title}
                    </p>
                  </div>

                  <span className="font-black text-[#17191b]">Baca →</span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}