"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, deleteDoc, doc, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

type Comic = {
  id: string;
  title: string;
  slug: string;
  description: string;
  author: string;
  status: string;
};

export default function ComicsAdminPage() {
  const [comics, setComics] = useState<Comic[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchComics = async () => {
      try {
        const snapshot = await getDocs(collection(db, "comics"));

        const comicData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Comic[];

        setComics(comicData);
      } catch (error) {
        console.error("Gagal mengambil data komik:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchComics();
  }, []);

  const handleDelete = async () => {
    if (!deleteId) {
      return;
    }

    try {
      setDeleting(true);

      await deleteDoc(doc(db, "comics", deleteId));

      setComics((currentComics) =>
        currentComics.filter((comic) => comic.id !== deleteId),
      );

      setDeleteId(null);
    } catch (error) {
      console.error("Gagal menghapus komik:", error);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#ede9df] p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 border-b-[3px] border-[#17191b] pb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#17191b]">Kelola Komik</h1>

            <p className="mt-2 text-sm text-[#5b5f5a]">
              Tambah, edit, dan hapus data komik.
            </p>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <Link
              href="/admin"
              className="inline-flex items-center border-2 border-[#17191b] bg-[#17191b] px-4 py-2 text-sm font-semibold text-[#ede9df] transition hover:bg-[#ede9df] hover:text-[#17191b]"
            >
              ← Kembali
            </Link>

            <Link
              href="/admin/comics/new"
              className="border-[3px] border-[#17191b] bg-[#e23d28] px-5 py-3 text-sm font-bold text-[#ede9df] transition hover:bg-[#17191b]"
            >
              + Tambah Komik
            </Link>
          </div>
        </div>

        <div className="overflow-hidden border-[3px] border-[#17191b] bg-white">
          {loading ? (
            <div className="p-8 text-center text-sm text-[#5b5f5a]">
              Memuat data komik...
            </div>
          ) : comics.length === 0 ? (
            <div className="p-8 text-center text-sm text-[#5b5f5a]">
              Belum ada data komik.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b-[3px] border-[#17191b] bg-[#ede9df]">
                  <tr>
                    <th className="px-6 py-4 text-sm font-bold text-[#17191b] w-[40%]">
                      Judul
                    </th>

                    <th className="px-6 py-4 text-sm font-bold text-[#17191b]">
                      Author
                    </th>

                    <th className="px-6 py-4 text-sm font-bold text-[#17191b]">
                      Status
                    </th>

                    <th className="px-6 py-4 text-sm font-bold text-[#17191b]">
                      Aksi
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {comics.map((comic) => (
                    <tr
                      key={comic.id}
                      className="border-b border-[#d9d8d0] last:border-b-0"
                    >
                      <td className="px-6 py-4 font-semibold text-[#17191b]">
                        <span
                          title={comic.title}
                          className="block max-w-[280px] truncate"
                        >
                          {comic.title}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-[#5b5f5a]">
                        {comic.author || "-"}
                      </td>

                      <td className="px-6 py-4">
                        <span className="border-2 border-[#17191b] bg-[#f5c430] px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-[#17191b]">
                          {comic.status}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/comics/${comic.id}/edit`}
                            className="border-2 border-[#17191b] bg-[#17191b] px-3 py-1 text-xs font-bold text-[#ede9df] transition hover:bg-[#ede9df] hover:text-[#17191b]"
                          >
                            Edit
                          </Link>

                          <Link
                            href={`/admin/comics/${comic.id}/chapters`}
                            className="border-2 border-[#2c5f9e] bg-[#2c5f9e] px-3 py-1 text-xs font-bold text-white transition hover:bg-white hover:text-[#2c5f9e]"
                          >
                            Kelola Chapter
                          </Link>

                          <button
                            type="button"
                            onClick={() => setDeleteId(comic.id)}
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

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md border-[3px] border-[#17191b] bg-white p-6">
            <h2 className="text-xl font-bold text-[#17191b]">Hapus Komik?</h2>

            <p className="mt-3 text-sm leading-6 text-[#5b5f5a]">
              Apakah kamu yakin ingin menghapus komik ini? Data yang sudah
              dihapus tidak dapat dikembalikan.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                disabled={deleting}
                className="border-2 border-[#17191b] px-5 py-2.5 text-sm font-semibold text-[#17191b] transition hover:bg-[#17191b] hover:text-[#ede9df] disabled:opacity-50"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleDelete}
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
