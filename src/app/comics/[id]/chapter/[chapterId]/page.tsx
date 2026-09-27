"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "@/lib/firebase/config";

type Comic = {
  id: string;
  title: string;
  slug: string;
  poster?: string;
};

type Chapter = {
  id: string;
  comicId: string;
  chapterNumber: number;
  title: string;
  pages: string[];
};

export default function ChapterReaderPage() {
  const params = useParams();

  const id = params.id as string;
  const chapterId = params.chapterId as string;

  const [comic, setComic] = useState<Comic | null>(null);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [user, setUser] = useState<User | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showHeader, setShowHeader] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY <= 20) {
        setShowHeader(true);
      } else if (currentScrollY > lastScrollY) {
        setShowHeader(false);
      } else if (currentScrollY < lastScrollY) {
        setShowHeader(true);
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    const fetchChapter = async () => {
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
              pages: Array.isArray(data.pages) ? data.pages : [],
            };
          })
          .sort((a, b) => a.chapterNumber - b.chapterNumber);

        setChapters(chapterData);

        const currentChapter = chapterData.find(
          (item) => item.id === chapterId
        );

        if (!currentChapter) {
          setError("Chapter tidak ditemukan.");
          return;
        }

        setChapter(currentChapter);
      } catch (error) {
        console.error("Error mengambil chapter:", error);
        setError("Gagal mengambil data chapter.");
      } finally {
        setLoading(false);
      }
    };

    if (id && chapterId) {
      fetchChapter();
    }
  }, [id, chapterId]);

  useEffect(() => {
    const saveReadingProgress = async () => {
      if (!user || !comic || !chapter) {
        return;
      }

      try {
        const bookmarkRef = doc(db, "users", user.uid, "bookmarks", comic.id);

        await setDoc(
          bookmarkRef,
          {
            comicId: comic.id,
            title: comic.title,
            slug: comic.slug,
            poster: comic.poster || "",
            lastChapterId: chapter.id,
            lastChapterNumber: chapter.chapterNumber,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (error) {
        console.error("Error menyimpan progress membaca:", error);
      }
    };

    saveReadingProgress();
  }, [user, comic, chapter]);

  const currentChapterIndex = chapters.findIndex(
    (item) => item.id === chapterId
  );

  const previousChapter =
    currentChapterIndex > 0 ? chapters[currentChapterIndex - 1] : null;

  const nextChapter =
    currentChapterIndex >= 0 && currentChapterIndex < chapters.length - 1
      ? chapters[currentChapterIndex + 1]
      : null;

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#17191b]">
        <p className="font-bold text-[#ede9df]">Memuat chapter...</p>
      </main>
    );
  }

  if (error || !chapter || !comic) {
    return (
      <main className="min-h-screen bg-[#17191b] px-4 py-10">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-black text-[#ede9df]">
            Chapter Tidak Ditemukan
          </h1>

          <p className="mt-3 text-[#c8c5bc]">
            {error || "Data chapter tidak tersedia."}
          </p>

          <Link
            href={comic ? `/comics/${comic.slug}` : "/"}
            className="mt-6 inline-block border-2 border-[#ede9df] bg-[#ede9df] px-5 py-3 font-bold text-[#17191b] transition hover:bg-[#f5c430]"
          >
            Kembali ke Komik
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#17191b]">
      <header
        className={`fixed left-0 right-0 top-0 z-50 border-b-[3px] border-[#ede9df] bg-[#17191b] transition-transform duration-300 ${
          showHeader ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="mx-auto max-w-5xl px-4 py-3.5">
          <div className="flex items-center justify-between gap-4">
            <Link
              href={`/comics/${comic.slug}`}
              className="shrink-0 font-bold text-[#ede9df] transition hover:text-[#f5c430]"
            >
              ← Kembali
            </Link>

            <div className="min-w-0 space-y-0.5 text-right">
              <p className="truncate text-xs font-bold text-[#c8c5bc]">
                {comic.title}
              </p>

              <p className="truncate text-sm font-black text-[#ede9df]">
                Chapter {chapter.chapterNumber}
              </p>

              <p className="truncate text-xs text-[#c8c5bc]">
                {chapter.title}
              </p>
            </div>
          </div>

          <div className="mt-3.5 grid grid-cols-3 gap-2">
            {previousChapter ? (
              <Link
                href={`/comics/${comic.slug}/chapter/${previousChapter.id}`}
                className="border-2 border-[#ede9df] bg-[#17191b] px-2 py-2.5 text-center text-xs font-black text-[#ede9df] transition hover:bg-[#f5c430] hover:text-[#17191b] sm:text-sm"
              >
                ← Sebelumnya
              </Link>
            ) : (
              <div />
            )}

            <Link
              href={`/comics/${comic.slug}`}
              className="border-2 border-[#ede9df] bg-[#ede9df] px-2 py-2.5 text-center text-xs font-black text-[#17191b] transition hover:bg-[#f5c430] sm:text-sm"
            >
              Daftar Chapter
            </Link>

            {nextChapter ? (
              <Link
                href={`/comics/${comic.slug}/chapter/${nextChapter.id}`}
                className="border-2 border-[#ede9df] bg-[#17191b] px-2 py-2.5 text-center text-xs font-black text-[#ede9df] transition hover:bg-[#f5c430] hover:text-[#17191b] sm:text-sm"
              >
                Selanjutnya →
              </Link>
            ) : (
              <div />
            )}
          </div>
        </div>
      </header>

      <div className="h-[116px]" />

      <div className="mx-auto max-w-4xl">
        {chapter.pages && chapter.pages.length > 0 ? (
          <div>
            {chapter.pages.map((page, index) => (
              <img
                key={`${page}-${index}`}
                src={page}
                alt={`${comic.title} Chapter ${chapter.chapterNumber} halaman ${index + 1}`}
                className="block w-full"
              />
            ))}
          </div>
        ) : (
          <div className="px-4 py-20 text-center">
            <div className="border-[3px] border-[#ede9df] p-8">
              <h2 className="text-2xl font-black text-[#ede9df]">
                Belum Ada Halaman
              </h2>

              <p className="mt-3 text-[#c8c5bc]">
                Chapter ini belum memiliki gambar komik.
              </p>
            </div>
          </div>
        )}
      </div>

      <section className="border-t-[3px] border-[#ede9df] bg-[#17191b] px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {previousChapter ? (
              <Link
                href={`/comics/${comic.slug}/chapter/${previousChapter.id}`}
                className="border-2 border-[#ede9df] bg-[#17191b] px-4 py-3 text-center font-black text-[#ede9df] transition hover:bg-[#f5c430] hover:text-[#17191b]"
              >
                ← Chapter {previousChapter.chapterNumber}
              </Link>
            ) : (
              <div />
            )}

            <Link
              href={`/comics/${comic.slug}`}
              className="border-2 border-[#ede9df] bg-[#ede9df] px-4 py-3 text-center font-black text-[#17191b] transition hover:bg-[#f5c430]"
            >
              Daftar Chapter
            </Link>

            {nextChapter ? (
              <Link
                href={`/comics/${comic.slug}/chapter/${nextChapter.id}`}
                className="border-2 border-[#ede9df] bg-[#17191b] px-4 py-3 text-center font-black text-[#ede9df] transition hover:bg-[#f5c430] hover:text-[#17191b]"
              >
                Chapter {nextChapter.chapterNumber} →
              </Link>
            ) : (
              <div />
            )}
          </div>
        </div>
      </section>

      <footer className="border-t-[3px] border-[#ede9df] px-4 py-8">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-sm font-bold text-[#c8c5bc]">PANELIA</p>
        </div>
      </footer>
    </main>
  );
}