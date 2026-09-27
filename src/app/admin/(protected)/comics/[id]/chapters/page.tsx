"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase/config";

type Comic = {
  id: string;
  title: string;
};

type Chapter = {
  id: string;
  comicId: string;
  chapterNumber: number;
  title: string;
};

export default function ComicChaptersPage() {
  const params = useParams();
  const id = params.id as string;

  const [comic, setComic] = useState<Comic | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteChapter, setDeleteChapter] = useState<Chapter | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteChapter = async () => {
    if (!deleteChapter) {
      return;
    }

    try {
      setDeleting(true);

      await deleteDoc(doc(db, "chapter", deleteChapter.id));

      setChapters((prev) =>
        prev.filter((chapter) => chapter.id !== deleteChapter.id),
      );

      setDeleteChapter(null);
    } catch (error) {
      console.error("Gagal menghapus chapter:", error);
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const comicRef = collection(db, "comics");
        const comicSnapshot = await getDocs(comicRef);

        const foundComic = comicSnapshot.docs.find((doc) => doc.id === id);

        if (foundComic) {
          setComic({
            id: foundComic.id,
            title: foundComic.data().title || "",
          });
        }

        const chapterQuery = query(
          collection(db, "chapter"),
          where("comicId", "==", id),
        );

        const chapterSnapshot = await getDocs(chapterQuery);

        const chapterData = chapterSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Chapter[];

        chapterData.sort((a, b) => b.chapterNumber - a.chapterNumber);

        setChapters(chapterData);
      } catch (error) {
        console.error("Gagal mengambil data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#ede9df] p-8">
        <div className="mx-auto max-w-6xl border-[3px] border-[#17191b] bg-white p-8 text-center text-sm text-[#5b5f5a]">
          Memuat data chapter...
        </div>
      </main>
    );
  }

  if (!comic) {
    return (
      <main className="min-h-screen bg-[#ede9df] p-8">
        <div className="mx-auto flex min-h-[80vh] max-w-6xl items-center justify-center">
          <div className="w-full border-[3px] border-[#17191b] bg-white p-8 text-center">
            <h1
              role="alert"
              className="mx-auto max-w-none border-2 border-[#e23d28] bg-[#e23d28]/10 px-4 py-3 text-base font-bold leading-normal text-[#e23d28]"
            >
              Komik tidak ditemukan
            </h1>

            <Link
              href="/admin/comics"
              className="mt-6 inline-flex items-center border-2 border-[#17191b] bg-[#17191b] px-4 py-2 text-sm font-semibold text-[#ede9df] transition hover:bg-[#ede9df] hover:text-[#17191b]"
            >
              ← Kembali ke daftar komik
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#ede9df] p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 border-b-[3px] border-[#17191b] pb-6">
          <h1 className="text-2xl font-bold text-[#17191b]">{comic.title}</h1>

          <p className="mt-2 text-sm text-[#5b5f5a]">
            Kelola chapter untuk komik ini.
          </p>

          <div className="mt-4 flex items-center justify-between gap-4">
            <Link
              href="/admin/comics"
              className="inline-flex items-center border-2 border-[#17191b] bg-[#17191b] px-4 py-2 text-sm font-semibold text-[#ede9df] transition hover:bg-[#ede9df] hover:text-[#17191b]"
            >
              ← Kembali
            </Link>

            <Link
              href={`/admin/comics/${id}/chapters/new`}
              className="shrink-0 border-[3px] border-[#17191b] bg-[#e23d28] px-5 py-3 text-sm font-bold text-[#ede9df] transition hover:bg-[#17191b]"
            >
              + Tambah Chapter
            </Link>
          </div>
        </div>

        <div className="overflow-hidden border-[3px] border-[#17191b] bg-white">
          {chapters.length === 0 ? (
            <div className="p-8 text-center text-sm text-[#5b5f5a]">
              Belum ada chapter untuk komik ini.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b-[3px] border-[#17191b] bg-[#ede9df]">
                  <tr>
                    <th className="px-6 py-4 text-sm font-bold text-[#17191b]">
                      Chapter
                    </th>

                    <th className="px-6 py-4 text-sm font-bold text-[#17191b]">
                      Judul
                    </th>

                    <th className="px-6 py-4 text-sm font-bold text-[#17191b]">
                      Aksi
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {chapters.map((chapter) => (
                    <tr
                      key={chapter.id}
                      className="border-b border-[#d9d8d0] last:border-b-0"
                    >
                      <td className="px-6 py-4 font-semibold text-[#17191b]">
                        Chapter {chapter.chapterNumber}
                      </td>

                      <td className="px-6 py-4 text-[#5b5f5a]">
                        {chapter.title || "-"}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/comics/${id}/chapters/${chapter.id}/edit`}
                            className="border-2 border-[#17191b] bg-[#17191b] px-3 py-1 text-xs font-bold text-[#ede9df] transition hover:bg-[#ede9df] hover:text-[#17191b]"
                          >
                            Edit
                          </Link>

                          <button
                            type="button"
                            onClick={() => setDeleteChapter(chapter)}
                            className="border-2 border-[#e23d28] bg-[#e23d28] px-3 py-1 text-xs font-bold text-white transition hover:bg-white hover:text-[#e23d28]"
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {deleteChapter && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => {
            if (!deleting) {
              setDeleteChapter(null);
            }
          }}
        >
          <div
            className="w-full max-w-md border-[3px] border-[#17191b] bg-white p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-[#17191b]">Hapus Chapter?</h2>

            <p className="mt-3 text-sm leading-6 text-[#5b5f5a]">
              Apakah kamu yakin ingin menghapus{" "}
              <span className="font-bold text-[#17191b]">
                Chapter {deleteChapter.chapterNumber}
              </span>{" "}
              dari komik ini? Data yang sudah dihapus tidak dapat dikembalikan.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteChapter(null)}
                disabled={deleting}
                className="border-2 border-[#17191b] px-5 py-2.5 text-sm font-semibold text-[#17191b] transition hover:bg-[#17191b] hover:text-[#ede9df] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleDeleteChapter}
                disabled={deleting}
                className="border-[3px] border-[#17191b] bg-[#e23d28] px-5 py-2.5 text-sm font-bold text-[#ede9df] transition hover:bg-[#17191b] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting ? "Menghapus..." : "Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
