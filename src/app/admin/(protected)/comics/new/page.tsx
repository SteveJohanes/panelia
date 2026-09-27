"use client";

import { useState } from "react";
import Link from "next/link";
import { addDoc, collection } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase/config";

const inputClass =
  "w-full border-2 border-[#17191b] bg-white px-4 py-3 text-sm text-[#17191b] outline-none transition placeholder:text-[#9a9d96] focus:bg-[#fffbea] focus:shadow-[4px_4px_0_0_#17191b]";

const labelClass = "mb-2 block text-sm font-bold text-[#17191b]";

export default function NewComicPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [author, setAuthor] = useState("");
  const [status, setStatus] = useState("Ongoing");
  const [rating, setRating] = useState(0);

  const [genre, setGenre] = useState<string[]>([]);
  const [genreSearch, setGenreSearch] = useState("");
  const [genreOpen, setGenreOpen] = useState(false);
  const [genreDropUp, setGenreDropUp] = useState(false);

  const [poster, setPoster] = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const genreOptions = [
    "Action",
    "Adventure",
    "Comedy",
    "Drama",
    "Fantasy",
    "Horror",
    "Mystery",
    "Romance",
    "Sci-Fi",
    "Slice of Life",
    "Sports",
    "Supernatural",
    "Thriller",
  ];

  const filteredGenreOptions = genreOptions.filter((item) =>
    item.toLowerCase().includes(genreSearch.toLowerCase()),
  );

  const toggleGenreDropdown = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!genreOpen) {
      const rect = event.currentTarget.getBoundingClientRect();

      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      setGenreDropUp(spaceBelow < 320 && spaceAbove > spaceBelow);
    }

    setGenreOpen((current) => !current);
  };

  const handlePosterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("File poster harus berupa gambar.");
      return;
    }

    setError("");
    setPoster(file);

    const previewUrl = URL.createObjectURL(file);
    setPosterPreview(previewUrl);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !slug || genre.length === 0) {
      setError("Judul, slug, dan minimal satu genre wajib diisi.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      let posterUrl = "";

      if (poster) {
        const formData = new FormData();

        formData.append("file", poster);
        formData.append("upload_preset", "panelia_poster");

        const cloudinaryResponse = await fetch(
          "https://api.cloudinary.com/v1_1/t5zi2gmi/image/upload",
          {
            method: "POST",
            body: formData,
          },
        );

        if (!cloudinaryResponse.ok) {
          throw new Error("Gagal mengupload poster.");
        }

        const cloudinaryData = await cloudinaryResponse.json();

        posterUrl = cloudinaryData.secure_url || "";
      }

      await addDoc(collection(db, "comics"), {
        title,
        slug,
        description,
        author,
        genre,
        status,
        rating,
        poster: posterUrl,
        createdAt: new Date(),
      });

      router.push("/admin/comics");
    } catch (err) {
      console.error(err);
      setError("Gagal menyimpan data komik atau mengupload poster.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#ede9df] p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 border-b-[3px] border-[#17191b] pb-6">
          <Link
            href="/admin/comics"
            className="inline-flex items-center border-2 border-[#17191b] bg-[#17191b] px-4 py-2 text-sm font-semibold text-[#ede9df] transition hover:bg-[#ede9df] hover:text-[#17191b]"
          >
            ← Kembali
          </Link>

          <h1 className="mt-4 text-2xl font-bold text-[#17191b]">
            Tambah Komik
          </h1>

          <p className="mt-2 text-sm text-[#5b5f5a]">
            Tambahkan komik baru ke Panelia.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mx-auto max-w-3xl border-[3px] border-[#17191b] bg-white"
        >
          <div className="space-y-6 p-6 sm:p-8">
            <div>
              <label htmlFor="title" className={labelClass}>
                Judul Komik
              </label>

              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: One Piece"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="slug" className={labelClass}>
                Slug
              </label>

              <input
                id="slug"
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="Contoh: one-piece"
                className={inputClass}
              />

              <p className="mt-2 text-xs text-[#5b5f5a]">
                Digunakan untuk URL halaman komik.
              </p>
            </div>

            <div>
              <label className={labelClass}>Poster</label>

              <div className="border-2 border-dashed border-[#17191b] bg-[#ede9df] p-4">
                {posterPreview ? (
                  <div className="flex flex-col items-center">
                    <div className="w-48 border-[3px] border-[#17191b] bg-white">
                      <img
                        src={posterPreview}
                        alt="Preview poster"
                        className="aspect-[3/4] w-full object-cover"
                      />
                    </div>

                    <p className="mt-3 text-center text-xs text-[#5b5f5a]">
                      {poster?.name}
                    </p>

                    <label
                      htmlFor="poster"
                      className="mt-3 cursor-pointer border-2 border-[#17191b] bg-[#17191b] px-4 py-2 text-xs font-bold text-[#ede9df] transition hover:bg-[#ede9df] hover:text-[#17191b]"
                    >
                      Ganti Poster
                    </label>
                  </div>
                ) : (
                  <label
                    htmlFor="poster"
                    className="flex cursor-pointer flex-col items-center justify-center px-4 py-8 text-center transition hover:bg-[#fffbea]"
                  >
                    <span className="text-3xl">＋</span>

                    <span className="mt-2 text-sm font-bold text-[#17191b]">
                      Pilih Poster
                    </span>

                    <span className="mt-1 text-xs text-[#5b5f5a]">
                      Format gambar JPG, PNG, atau WEBP
                    </span>
                  </label>
                )}

                <input
                  id="poster"
                  type="file"
                  accept="image/*"
                  onChange={handlePosterChange}
                  className="hidden"
                />
              </div>

              <p className="mt-2 text-xs text-[#5b5f5a]">
                Poster akan diupload ke Cloudinary saat komik disimpan.
              </p>
            </div>

            <div>
              <label htmlFor="description" className={labelClass}>
                Deskripsi
              </label>

              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Deskripsi komik..."
                rows={5}
                className={`${inputClass} resize-none`}
              />
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="author" className={labelClass}>
                  Author
                </label>

                <input
                  id="author"
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Contoh: Eiichiro Oda"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="rating" className={labelClass}>
                  Rating
                </label>

                <input
                  id="rating"
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  placeholder="Contoh: 4.7"
                  className={inputClass}
                />

                <p className="mt-2 text-xs text-[#5b5f5a]">
                  Masukkan rating dari 0 sampai 5. Contoh: 4.7.
                </p>
              </div>

              <div>
                <label className={labelClass}>Genre</label>

                <div className="relative">
                  <button
                    type="button"
                    onClick={toggleGenreDropdown}
                    className={`${inputClass} flex min-h-[50px] cursor-pointer items-center justify-between text-left`}
                  >
                    <span
                      className={
                        genre.length > 0 ? "text-[#17191b]" : "text-[#9a9d96]"
                      }
                    >
                      {genre.length > 0
                        ? `${genre.length} genre dipilih`
                        : "Pilih genre..."}
                    </span>

                    <span
                      className={`ml-4 text-xs transition ${
                        genreOpen ? "rotate-180" : ""
                      }`}
                    >
                      ▼
                    </span>
                  </button>

                  {genreOpen && (
                    <div
                      className={`absolute left-0 right-0 z-20 border-[3px] border-[#17191b] bg-white shadow-[6px_6px_0_0_#17191b] ${
                        genreDropUp ? "bottom-full mb-2" : "top-full mt-2"
                      }`}
                    >
                      <div className="border-b-2 border-[#17191b] p-3">
                        <input
                          type="text"
                          value={genreSearch}
                          onChange={(e) => setGenreSearch(e.target.value)}
                          placeholder="Cari genre..."
                          className="w-full border-2 border-[#17191b] bg-[#fffbea] px-3 py-2.5 text-sm text-[#17191b] outline-none placeholder:text-[#9a9d96]"
                          autoFocus
                        />
                      </div>

                      <div className="max-h-60 overflow-y-auto p-2">
                        {filteredGenreOptions.length > 0 ? (
                          filteredGenreOptions.map((item) => {
                            const selected = genre.includes(item);

                            return (
                              <button
                                key={item}
                                type="button"
                                onClick={() => {
                                  setGenre((current) =>
                                    selected
                                      ? current.filter(
                                          (value) => value !== item,
                                        )
                                      : [...current, item],
                                  );
                                }}
                                className={`flex w-full items-center justify-between border-2 px-3 py-2.5 text-left text-sm font-semibold transition ${
                                  selected
                                    ? "border-[#17191b] bg-[#17191b] text-[#ede9df]"
                                    : "border-transparent text-[#17191b] hover:border-[#17191b] hover:bg-[#ede9df]"
                                }`}
                              >
                                <span>{item}</span>

                                {selected && (
                                  <span className="font-bold">✓</span>
                                )}
                              </button>
                            );
                          })
                        ) : (
                          <p className="px-3 py-4 text-center text-sm text-[#5b5f5a]">
                            Genre tidak ditemukan.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {genre.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {genre.map((item) => (
                      <div
                        key={item}
                        className="inline-flex items-center gap-2 border-2 border-[#17191b] bg-[#f5c430] px-3 py-1.5 text-sm font-bold text-[#17191b]"
                      >
                        <span>{item}</span>

                        <button
                          type="button"
                          onClick={() => {
                            setGenre((current) =>
                              current.filter((value) => value !== item),
                            );
                          }}
                          className="flex h-5 w-5 items-center justify-center border border-[#17191b] bg-[#ede9df] text-xs font-bold transition hover:bg-[#17191b] hover:text-[#ede9df]"
                          aria-label={`Hapus genre ${item}`}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <p className="mt-2 text-xs text-[#5b5f5a]">
                  Cari dan pilih satu atau lebih genre. Genre yang dipilih dapat
                  dihapus kembali.
                </p>
              </div>

              <div>
                <label htmlFor="status" className={labelClass}>
                  Status
                </label>

                <div className="relative">
                  <select
                    id="status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className={`${inputClass} cursor-pointer appearance-none pr-10`}
                  >
                    <option value="Ongoing">Ongoing</option>
                    <option value="Completed">Completed</option>
                    <option value="Hiatus">Hiatus</option>
                  </select>

                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#17191b]"
                  >
                    ▼
                  </span>
                </div>
              </div>
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
              onClick={() => router.push("/admin/comics")}
              disabled={loading}
              className="border-2 border-[#17191b] px-5 py-2.5 text-sm font-semibold text-[#17191b] transition hover:bg-[#17191b] hover:text-[#ede9df] disabled:opacity-50"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={loading}
              className="border-[3px] border-[#17191b] bg-[#e23d28] px-5 py-2.5 text-sm font-bold text-[#ede9df] transition hover:bg-[#17191b] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Menyimpan..." : "Simpan Komik"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
