"use client";

import { useEffect, useState } from "react";
import { addDoc, collection, getDocs } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase/config";

type Comic = {
  id: string;
  title: string;
};

export default function NewChapterPage() {
  const router = useRouter();

  const [comics, setComics] = useState<Comic[]>([]);
  const [comicId, setComicId] = useState("");
  const [chapterNumber, setChapterNumber] = useState("");
  const [title, setTitle] = useState("");

  const [loadingComics, setLoadingComics] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchComics = async () => {
      try {
        const snapshot = await getDocs(collection(db, "comics"));

        const comicData = snapshot.docs.map((doc) => ({
          id: doc.id,
          title: doc.data().title || "",
        }));

        setComics(comicData);
      } catch (err) {
        console.error(err);
        setError("Gagal mengambil daftar komik.");
      } finally {
        setLoadingComics(false);
      }
    };

    fetchComics();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!comicId || !chapterNumber || !title) {
      setError("Komik, nomor chapter, dan judul chapter wajib diisi.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      await addDoc(collection(db, "chapters"), {
        comicId,
        chapterNumber: Number(chapterNumber),
        title,
        createdAt: new Date(),
      });

      router.push("/admin/chapter");
    } catch (err) {
      console.error(err);
      setError("Gagal menyimpan chapter.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Tambah Chapter
          </h1>

          <p className="mt-2 text-gray-600">
            Tambahkan chapter baru ke komik.
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
              disabled={loadingComics}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-black disabled:bg-gray-100"
            >
              <option value="">
                {loadingComics ? "Memuat komik..." : "Pilih komik"}
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
              placeholder="Contoh: 1"
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
              placeholder="Contoh: Awal Petualangan"
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
              {saving ? "Menyimpan..." : "Simpan Chapter"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}