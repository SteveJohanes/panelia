"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, getDocs, collection, updateDoc } from "firebase/firestore";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase/config";

type Comic = {
  id: string;
  title: string;
};

export default function EditChapterPage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  const [comics, setComics] = useState<Comic[]>([]);
  const [comicId, setComicId] = useState("");
  const [chapterNumber, setChapterNumber] = useState("");
  const [title, setTitle] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [chapterSnapshot, comicSnapshot] = await Promise.all([
          getDoc(doc(db, "chapter", id)),
          getDocs(collection(db, "comics")),
        ]);

        if (!chapterSnapshot.exists()) {
          setError("Chapter tidak ditemukan.");
          return;
        }

        const chapterData = chapterSnapshot.data();

        setComicId(chapterData.comicId || "");
        setChapterNumber(
          chapterData.chapterNumber?.toString() || ""
        );
        setTitle(chapterData.title || "");

        const comicData = comicSnapshot.docs.map((doc) => ({
          id: doc.id,
          title: doc.data().title || "",
        }));

        setComics(comicData);
      } catch (err) {
        console.error(err);
        setError("Gagal mengambil data chapter.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!comicId || !chapterNumber || !title) {
      setError("Komik, nomor chapter, dan judul chapter wajib diisi.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      await updateDoc(doc(db, "chapter", id), {
        comicId,
        chapterNumber: Number(chapterNumber),
        title,
      });

      router.push("/admin/chapter");
    } catch (err) {
      console.error(err);
      setError("Gagal memperbarui chapter.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 p-8">
        <div className="mx-auto max-w-3xl">
          <p className="text-gray-500">
            Memuat data chapter...
          </p>
        </div>
      </main>
    );
  }

  if (error && !title) {
    return (
      <main className="min-h-screen bg-gray-100 p-8">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-lg bg-red-50 p-4 text-red-600">
            {error}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Edit Chapter
          </h1>

          <p className="mt-2 text-gray-600">
            Ubah informasi chapter.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-xl bg-white p-6 shadow-sm"
        >
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Komik
            </label>

            <select
              value={comicId}
              onChange={(e) => setComicId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-black"
            >
              <option value="">
                Pilih komik
              </option>

              {comics.map((comic) => (
                <option key={comic.id} value={comic.id}>
                  {comic.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Nomor Chapter
            </label>

            <input
              type="number"
              min="1"
              value={chapterNumber}
              onChange={(e) => setChapterNumber(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Judul Chapter
            </label>

            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.push("/admin/chapter")}
              className="rounded-lg border border-gray-300 px-5 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}