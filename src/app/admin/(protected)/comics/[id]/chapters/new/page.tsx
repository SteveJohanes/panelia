"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { addDoc, collection, getDoc, doc } from "firebase/firestore";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase/config";

const inputClass =
  "w-full border-2 border-[#17191b] bg-white px-4 py-3 text-sm text-[#17191b] outline-none transition placeholder:text-[#9a9d96] focus:bg-[#fffbea] focus:shadow-[4px_4px_0_0_#17191b]";

const disabledInputClass =
  "w-full cursor-not-allowed border-2 border-[#d9d8d0] bg-[#ede9df] px-4 py-3 text-sm text-[#5b5f5a]";

const fileInputClass =
  "w-full cursor-pointer border-2 border-[#17191b] bg-white p-2 text-sm text-[#5b5f5a] outline-none transition file:mr-4 file:cursor-pointer file:border-2 file:border-[#17191b] file:bg-[#17191b] file:px-4 file:py-2 file:text-xs file:font-bold file:text-[#ede9df] hover:file:bg-[#ede9df] hover:file:text-[#17191b] focus:bg-[#fffbea] focus:shadow-[4px_4px_0_0_#17191b]";

const labelClass = "mb-2 block text-sm font-bold text-[#17191b]";

export default function NewChapterPage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  const [comicTitle, setComicTitle] = useState("");
  const [chapterNumber, setChapterNumber] = useState("");
  const [title, setTitle] = useState("");
  const [images, setImages] = useState<File[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) {
      return;
    }

    setImages(Array.from(e.target.files));
  };
  useEffect(() => {
    const fetchComic = async () => {
      try {
        const comicSnapshot = await getDoc(doc(db, "comics", id));

        if (!comicSnapshot.exists()) {
          setError("Komik tidak ditemukan.");
          return;
        }

        setComicTitle(comicSnapshot.data().title || "");
      } catch (err) {
        console.error(err);
        setError("Gagal mengambil data komik.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchComic();
    }
  }, [id]);

  const uploadImagesToCloudinary = async () => {
    const uploadedUrls: string[] = [];

    for (const image of images) {
      const formData = new FormData();

      formData.append("file", image);
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

      uploadedUrls.push(data.secure_url);
    }

    return uploadedUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!chapterNumber || !title) {
      setError("Nomor chapter dan judul chapter wajib diisi.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const uploadedUrls = await uploadImagesToCloudinary();

      console.log("URL GAMBAR CLOUDINARY:", uploadedUrls);

      await addDoc(collection(db, "chapter"), {
        comicId: id,
        chapterNumber: Number(chapterNumber),
        title,
        pages: uploadedUrls,
        createdAt: new Date(),
      });

      router.push(`/admin/comics/${id}/chapters`);
    } catch (err) {
      console.error(err);
      setError("Gagal menyimpan chapter.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#ede9df] p-8">
        <div className="mx-auto max-w-3xl border-[3px] border-[#17191b] bg-white p-8 text-center text-sm text-[#5b5f5a]">
          Memuat data komik...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#ede9df] p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 border-b-[3px] border-[#17191b] pb-6">
          <Link
            href={`/admin/comics/${id}/chapters`}
            className="inline-flex items-center border-2 border-[#17191b] bg-[#17191b] px-4 py-2 text-sm font-semibold text-[#ede9df] transition hover:bg-[#ede9df] hover:text-[#17191b]"
          >
            ← Kembali ke Chapter
          </Link>

          <h1 className="mt-4 text-2xl font-bold text-[#17191b]">
            Tambah Chapter
          </h1>

          <p className="mt-2 text-sm text-[#5b5f5a]">
            Tambahkan chapter baru untuk komik{" "}
            <span className="font-bold text-[#17191b]">{comicTitle}</span>.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mx-auto max-w-3xl border-[3px] border-[#17191b] bg-white"
        >
          <div className="space-y-6 p-6 sm:p-8">
            <div>
              <label htmlFor="images" className={labelClass}>
                Gambar Chapter
              </label>

              <input
                id="images"
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className={fileInputClass}
              />

              {images.length > 0 && (
                <div className="mt-3 border-2 border-[#17191b] bg-[#ede9df] p-4">
                  <span className="inline-block border-2 border-[#17191b] bg-[#f5c430] px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-[#17191b]">
                    {images.length} gambar dipilih
                  </span>

                  <ul className="mt-3 max-h-48 space-y-1 overflow-y-auto text-sm text-[#5b5f5a]">
                    {images.map((image, index) => (
                      <li key={index} className="break-all">
                        <span className="font-bold text-[#17191b]">
                          {index + 1}.
                        </span>{" "}
                        {image.name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div>
              <label className={labelClass}>Komik</label>

              <input
                type="text"
                value={comicTitle}
                disabled
                className={disabledInputClass}
              />
            </div>

            <div>
              <label htmlFor="chapterNumber" className={labelClass}>
                Nomor Chapter
              </label>

              <input
                id="chapterNumber"
                type="number"
                min="1"
                value={chapterNumber}
                onChange={(e) => setChapterNumber(e.target.value)}
                placeholder="Contoh: 1"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="title" className={labelClass}>
                Judul Chapter
              </label>

              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Awal Petualangan"
                className={inputClass}
              />
            </div>

            {error && (
              <div
                role="alert"
                className="border-2 border-[#e23d28] bg-[#e23d28]/10 px-4 py-3 text-sm font-semibold text-[#e23d28]"
              >
                {error}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 border-t-[3px] border-[#17191b] bg-[#ede9df] px-6 py-4 sm:px-8">
            <button
              type="button"
              onClick={() => router.push(`/admin/comics/${id}/chapters`)}
              disabled={saving}
              className="border-2 border-[#17191b] px-5 py-2.5 text-sm font-semibold text-[#17191b] transition hover:bg-[#17191b] hover:text-[#ede9df] disabled:opacity-50"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={saving}
              className="border-[3px] border-[#17191b] bg-[#e23d28] px-5 py-2.5 text-sm font-bold text-[#ede9df] transition hover:bg-[#17191b] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Menyimpan..." : "Simpan Chapter"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}