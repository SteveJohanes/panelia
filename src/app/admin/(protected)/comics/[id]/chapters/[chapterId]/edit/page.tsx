"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase/config";

type Chapter = {
  chapterNumber: number;
  title: string;
  pages: string[];
};

type Comic = {
  title: string;
};

const inputClass =
  "w-full border-2 border-[#17191b] bg-white px-4 py-3 text-sm text-[#17191b] outline-none transition placeholder:text-[#9a9d96] focus:bg-[#fffbea] focus:shadow-[4px_4px_0_0_#17191b]";

const disabledInputClass =
  "w-full cursor-not-allowed border-2 border-[#d9d8d0] bg-[#ede9df] px-4 py-3 text-sm text-[#5b5f5a]";

const labelClass = "mb-2 block text-sm font-bold text-[#17191b]";

export default function EditChapterPage() {
  const params = useParams();

  const id = params.id as string;
  const chapterId = params.chapterId as string;

  const [comic, setComic] = useState<Comic | null>(null);
  const [chapter, setChapter] = useState<Chapter | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");

  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showNoChanges, setShowNoChanges] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Menyimpan halaman yang sedang dipilih
  const [selectedPage, setSelectedPage] = useState<number | null>(null);
  const [replacingImage, setReplacingImage] = useState(false);
  const [targetPage, setTargetPage] = useState("");
  const [movingPage, setMovingPage] = useState(false);

  const [addingImages, setAddingImages] = useState(false);

  const handleReplaceImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file || selectedPage === null || !chapter) {
      return;
    }

    try {
      setReplacingImage(true);
      setError("");

      const formData = new FormData();

      formData.append("file", file);
      formData.append("upload_preset", "panelia-image");

      const response = await fetch(
        "https://api.cloudinary.com/v1_1/t5zi2gmi/image/upload",
        {
          method: "POST",
          body: formData,
        },
      );

      if (!response.ok) {
        const errorData = await response.json();

        console.error("ERROR CLOUDINARY:", errorData);

        throw new Error(
          errorData?.error?.message || "Gagal mengupload gambar ke Cloudinary.",
        );
      }

      const data = await response.json();

      const newPages = [...chapter.pages];

      newPages[selectedPage] = data.secure_url;

      setChapter({
        ...chapter,
        pages: newPages,
      });
      setHasChanges(true);
    } catch (err) {
      console.error("Gagal mengganti gambar:", err);
      setError("Gagal mengganti gambar.");
    } finally {
      setReplacingImage(false);

      e.target.value = "";
    }
  };

  const handleAddImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;

    if (!files || files.length === 0 || !chapter) {
      return;
    }

    try {
      setAddingImages(true);
      setError("");

      const uploadedUrls: string[] = [];

      for (const file of Array.from(files)) {
        const formData = new FormData();

        formData.append("file", file);
        formData.append("upload_preset", "panelia-image");

        const response = await fetch(
          "https://api.cloudinary.com/v1_1/t5zi2gmi/image/upload",
          {
            method: "POST",
            body: formData,
          },
        );

        if (!response.ok) {
          const errorData = await response.json();

          console.error("ERROR CLOUDINARY:", errorData);

          throw new Error(
            errorData?.error?.message ||
              "Gagal mengupload gambar ke Cloudinary.",
          );
        }

        const data = await response.json();

        uploadedUrls.push(data.secure_url);
      }

      const newPages = [...chapter.pages, ...uploadedUrls];

      setChapter({
        ...chapter,
        pages: newPages,
      });
      setHasChanges(true);
    } catch (err) {
      console.error("Gagal menambahkan gambar:", err);
      setError("Gagal menambahkan gambar.");
    } finally {
      setAddingImages(false);

      e.target.value = "";
    }
  };

  const handleMovePage = async () => {
    if (!chapter || selectedPage === null) {
      return;
    }

    const newPosition = Number(targetPage);

    if (!newPosition || newPosition < 1 || newPosition > chapter.pages.length) {
      setError(`Posisi halaman harus antara 1 sampai ${chapter.pages.length}.`);
      return;
    }

    if (newPosition === selectedPage + 1) {
      return;
    }

    try {
      setMovingPage(true);
      setError("");

      const newPages = [...chapter.pages];

      const [movedPage] = newPages.splice(selectedPage, 1);

      newPages.splice(newPosition - 1, 0, movedPage);

      setChapter({
        ...chapter,
        pages: newPages,
      });

      setHasChanges(true);

      setSelectedPage(newPosition - 1);
      setTargetPage("");
    } catch (err) {
      console.error("Gagal memindahkan halaman:", err);
      setError("Gagal memindahkan halaman.");
    } finally {
      setMovingPage(false);
    }
  };

  const handleDeletePage = () => {
    if (!chapter || selectedPage === null) {
      return;
    }

    const newPages = chapter.pages.filter((_, index) => index !== selectedPage);

    setChapter({
      ...chapter,
      pages: newPages,
    });

    setHasChanges(true);
    setShowDeleteConfirm(false);
    setSelectedPage(null);
  };

  const handleSave = async () => {
    if (!chapter) {
      return;
    }

    setActionError("");

    if (!hasChanges) {
      setShowNoChanges(true);

      setTimeout(() => {
        setShowNoChanges(false);
      }, 2500);

      return;
    }

    if (chapter.chapterNumber < 1) {
      setActionError("Nomor chapter harus lebih dari 0.");
      return;
    }

    if (!chapter.title.trim()) {
      setActionError("Judul chapter wajib diisi.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setShowNoChanges(false);

      await updateDoc(doc(db, "chapter", chapterId), {
        chapterNumber: chapter.chapterNumber,
        title: chapter.title,
        pages: chapter.pages,
      });

      setHasChanges(false);
    } catch (err) {
      console.error("Gagal menyimpan perubahan:", err);
      setActionError("Gagal menyimpan perubahan.");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        // Ambil data komik
        const comicSnapshot = await getDoc(doc(db, "comics", id));

        if (!comicSnapshot.exists()) {
          setError("Komik tidak ditemukan.");
          return;
        }

        setComic({
          title: comicSnapshot.data().title || "",
        });

        // Ambil data chapter
        const chapterSnapshot = await getDoc(doc(db, "chapter", chapterId));

        if (!chapterSnapshot.exists()) {
          setError("Chapter tidak ditemukan.");
          return;
        }

        const chapterData = chapterSnapshot.data();

        // Pastikan chapter milik komik yang sedang dibuka
        if (chapterData.comicId !== id) {
          setError("Chapter tidak termasuk dalam komik ini.");
          return;
        }

        setChapter({
          chapterNumber: chapterData.chapterNumber || 0,
          title: chapterData.title || "",
          pages: Array.isArray(chapterData.pages) ? chapterData.pages : [],
        });
      } catch (err) {
        console.error("Gagal mengambil data:", err);
        setError("Gagal mengambil data chapter.");
      } finally {
        setLoading(false);
      }
    };

    if (id && chapterId) {
      fetchData();
    }
  }, [id, chapterId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#ede9df] p-8">
        <div className="mx-auto max-w-6xl border-[3px] border-[#17191b] bg-white p-8 text-center text-sm text-[#5b5f5a]">
          Memuat data chapter...
        </div>
      </main>
    );
  }

  if (error || !chapter || !comic) {
    return (
      <main className="min-h-screen bg-[#ede9df] p-8">
        <div className="mx-auto max-w-6xl border-[3px] border-[#17191b] bg-white p-8 text-center">
          <h1
            role="alert"
            className="border-2 border-[#e23d28] bg-[#e23d28]/10 px-4 py-3 text-base font-bold text-[#e23d28]"
          >
            {error || "Data tidak ditemukan."}
          </h1>

          <Link
            href={`/admin/comics/${id}/chapters`}
            className="mt-6 inline-flex items-center border-2 border-[#17191b] bg-[#17191b] px-4 py-2 text-sm font-semibold text-[#ede9df] transition hover:bg-[#ede9df] hover:text-[#17191b]"
          >
            ← Kembali ke daftar chapter
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#ede9df] p-8">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}
        <div className="mb-8 border-b-[3px] border-[#17191b] pb-6">
          <h1 className="text-2xl font-bold text-[#17191b]">
            Edit Chapter {chapter.chapterNumber}
          </h1>

          <p className="mt-2 text-sm text-[#5b5f5a]">
            {comic.title} • {chapter.title}
          </p>

          <div className="mt-4 flex items-center justify-between gap-4">
            <Link
              href={`/admin/comics/${id}/chapters`}
              className="inline-flex items-center border-2 border-[#17191b] bg-[#17191b] px-4 py-2 text-sm font-semibold text-[#ede9df] transition hover:bg-[#ede9df] hover:text-[#17191b]"
            >
              ← Kembali
            </Link>

            <div className="flex items-center gap-3">
              {showNoChanges && (
                <span className="border-2 border-[#17191b] bg-[#f5c430] px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-[#17191b]">
                  Tidak ada perubahan
                </span>
              )}

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className={`border-[3px] border-[#17191b] px-5 py-2.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  hasChanges
                    ? "bg-[#e23d28] text-[#ede9df] hover:bg-[#17191b]"
                    : "bg-[#d9d8d0] text-[#5b5f5a] hover:bg-[#ede9df]"
                }`}
              >
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>

        {/* DATA CHAPTER */}
        <div className="mb-8 border-[3px] border-[#17191b] bg-white p-6">
          {actionError && (
            <div
              role="alert"
              className="mb-6 border-2 border-[#e23d28] bg-[#e23d28]/10 px-4 py-3 text-sm font-bold text-[#e23d28]"
            >
              {actionError}
            </div>
          )}
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className={labelClass}>Komik</label>

              <input
                type="text"
                value={comic.title}
                disabled
                className={disabledInputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Chapter</label>

              <input
                type="number"
                min={1}
                value={chapter.chapterNumber}
                onChange={(e) => {
                  setChapter({
                    ...chapter,
                    chapterNumber: Number(e.target.value),
                  });

                  setHasChanges(true);
                }}
                className={inputClass}
              />
            </div>

            <div className="md:col-span-2">
              <label className={labelClass}>Judul Chapter</label>

              <input
                type="text"
                value={chapter.title}
                onChange={(e) => {
                  setChapter({
                    ...chapter,
                    title: e.target.value,
                  });

                  setHasChanges(true);
                }}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* DAFTAR GAMBAR */}
        <div className="border-[3px] border-[#17191b] bg-white">
          <div className="flex items-center justify-between gap-4 border-b-[3px] border-[#17191b] bg-[#ede9df] px-6 py-4">
            <div>
              <h2 className="text-lg font-bold text-[#17191b]">
                Halaman Chapter
              </h2>

              <p className="mt-1 text-sm text-[#5b5f5a]">
                {chapter.pages.length} halaman
              </p>
            </div>

            <label
              className={`cursor-pointer border-[3px] border-[#17191b] bg-[#e23d28] px-5 py-3 text-sm font-bold text-[#ede9df] transition hover:bg-[#17191b] ${
                addingImages ? "cursor-not-allowed opacity-50" : ""
              }`}
            >
              {addingImages ? "Mengupload..." : "+ Tambah Gambar"}

              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleAddImages}
                disabled={addingImages}
              />
            </label>
          </div>

          <div className="p-6">
            {chapter.pages.length === 0 ? (
              <div className="border-2 border-dashed border-[#17191b] p-10 text-center text-sm text-[#5b5f5a]">
                Belum ada gambar pada chapter ini.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {chapter.pages.map((imageUrl, index) => (
                  <button
                    key={`${imageUrl}-${index}`}
                    type="button"
                    onClick={() => setSelectedPage(index)}
                    className="group border-2 border-[#17191b] bg-[#ede9df] text-left transition hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_#17191b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e23d28]"
                  >
                    <img
                      src={imageUrl}
                      alt={`Halaman ${index + 1}`}
                      className="aspect-[3/4] w-full object-cover"
                    />

                    <div className="border-t-2 border-[#17191b] bg-[#17191b] px-3 py-1.5 text-center text-xs font-bold text-[#ede9df] transition group-hover:bg-[#e23d28]">
                      Halaman {index + 1}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* POPUP HALAMAN */}
      {selectedPage !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelectedPage(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-md overflow-y-auto border-[3px] border-[#17191b] bg-white p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-[#17191b]">
                  Halaman {selectedPage + 1}
                </h2>

                <p className="mt-1 text-sm text-[#5b5f5a]">
                  Kelola halaman chapter
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedPage(null)}
                aria-label="Tutup"
                className="border-2 border-[#17191b] px-3 py-1 text-lg font-bold leading-none text-[#17191b] transition hover:bg-[#17191b] hover:text-[#ede9df]"
              >
                ×
              </button>
            </div>

            {/* PREVIEW */}
            <div className="mb-5 max-h-[55vh] overflow-y-auto border-2 border-[#17191b] bg-[#ede9df]">
              <img
                src={chapter.pages[selectedPage]}
                alt={`Halaman ${selectedPage + 1}`}
                className="block h-auto w-full object-contain"
              />
            </div>

            {/* GANTI GAMBAR */}
            <label
              className={`mb-4 block w-full cursor-pointer border-2 border-[#17191b] bg-[#17191b] px-4 py-3 text-center text-sm font-bold text-[#ede9df] transition hover:bg-[#ede9df] hover:text-[#17191b] ${
                replacingImage ? "cursor-not-allowed opacity-50" : ""
              }`}
            >
              {replacingImage ? "Mengupload..." : "Ganti Gambar"}

              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleReplaceImage}
                disabled={replacingImage}
              />
            </label>

            {/* UBAH POSISI */}
            {/* UBAH POSISI */}
            <div className="border-2 border-[#17191b] bg-[#ede9df] p-4">
              <label className={labelClass}>Ubah posisi ke</label>

              <div className="flex gap-3">
                <input
                  type="number"
                  min={1}
                  max={chapter.pages.length}
                  value={targetPage}
                  onChange={(e) => setTargetPage(e.target.value)}
                  placeholder={`1 - ${chapter.pages.length}`}
                  className={inputClass}
                />

                <button
                  type="button"
                  onClick={handleMovePage}
                  disabled={movingPage}
                  className="shrink-0 border-2 border-[#2c5f9e] bg-[#2c5f9e] px-5 py-3 text-sm font-bold text-white transition hover:bg-white hover:text-[#2c5f9e] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {movingPage ? "Memindahkan..." : "Pindah"}
                </button>
              </div>
            </div>

            {/* HAPUS HALAMAN */}
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="mt-4 w-full border-2 border-[#e23d28] bg-[#e23d28] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#17191b]"
            >
              Hapus Halaman
            </button>

            {/* TUTUP */}
            <button
              type="button"
              onClick={() => setSelectedPage(null)}
              className="mt-5 w-full border-2 border-[#17191b] px-4 py-3 text-sm font-semibold text-[#17191b] transition hover:bg-[#17191b] hover:text-[#ede9df]"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md border-[3px] border-[#17191b] bg-white p-6">
            <h2 className="text-xl font-bold text-[#17191b]">Hapus Halaman?</h2>

            <p className="mt-3 text-sm leading-6 text-[#5b5f5a]">
              Apakah kamu yakin ingin menghapus halaman ini dari chapter?
              Perubahan akan diterapkan setelah kamu menekan tombol Simpan.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="border-2 border-[#17191b] px-5 py-2.5 text-sm font-semibold text-[#17191b] transition hover:bg-[#17191b] hover:text-[#ede9df]"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleDeletePage}
                className="border-[3px] border-[#17191b] bg-[#e23d28] px-5 py-2.5 text-sm font-bold text-[#ede9df] transition hover:bg-[#17191b]"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
