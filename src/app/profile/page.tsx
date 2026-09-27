"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
} from "firebase/firestore";
import {
  onAuthStateChanged,
  signOut,
  User,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase/config";

type Bookmark = {
  id: string;
  comicId: string;
  title: string;
  slug: string;
  poster: string;
  lastChapterId: string | null;
  lastChapterNumber: number | null;
};

export default function ProfilePage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // =========================
  // CEK USER
  // =========================

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentUser) => {
        if (!currentUser) {
          router.replace("/login");
          return;
        }

        setUser(currentUser);

        try {
          // =========================
          // AMBIL BOOKMARK USER
          // =========================

          const bookmarkRef = collection(
            db,
            "users",
            currentUser.uid,
            "bookmarks"
          );

          const snapshot = await getDocs(bookmarkRef);

          // =========================
          // AMBIL SEMUA DATA KOMIK
          // =========================

          const comicsSnapshot = await getDocs(
            collection(db, "comics")
          );

          // =========================
          // BUAT MAP KOMIK
          // =========================

          const comicsMap = new Map<
            string,
            {
              title: string;
              slug: string;
              poster: string;
            }
          >();

          comicsSnapshot.docs.forEach((comicDoc) => {
            const data = comicDoc.data();

            comicsMap.set(comicDoc.id, {
              title: String(data.title || ""),
              slug: String(data.slug || ""),
              poster: String(data.poster || ""),
            });
          });

          // =========================
          // GABUNGKAN BOOKMARK + DATA KOMIK
          // =========================

          const bookmarkData: Bookmark[] =
            snapshot.docs.map((bookmarkDoc) => {
              const data = bookmarkDoc.data();

              const comicId = String(
                data.comicId || bookmarkDoc.id
              );

              const comicData = comicsMap.get(comicId);

              return {
                id: bookmarkDoc.id,

                comicId,

                title: String(
                  data.title ||
                    comicData?.title ||
                    ""
                ),

                slug: String(
                  data.slug ||
                    comicData?.slug ||
                    ""
                ),

                poster: String(
                  data.poster ||
                    comicData?.poster ||
                    ""
                ),

                lastChapterId:
                  data.lastChapterId || null,

                lastChapterNumber:
                  data.lastChapterNumber !== null &&
                  data.lastChapterNumber !== undefined
                    ? Number(data.lastChapterNumber)
                    : null,
              };
            });

          setBookmarks(bookmarkData);
        } catch (error) {
          console.error(
            "Error mengambil bookmark:",
            error
          );
        } finally {
          setLoading(false);
        }
      }
    );

    return () => unsubscribe();
  }, [router]);

  // =========================
  // LOGOUT
  // =========================

  const handleLogout = async () => {
    await signOut(auth);
    router.replace("/");
  };

  // =========================
  // HAPUS BOOKMARK
  // =========================

  const handleDeleteBookmark = async (
    bookmarkId: string
  ) => {
    if (!user) {
      return;
    }

    try {
      setDeletingId(bookmarkId);

      await deleteDoc(
        doc(
          db,
          "users",
          user.uid,
          "bookmarks",
          bookmarkId
        )
      );

      setBookmarks((currentBookmarks) =>
        currentBookmarks.filter(
          (bookmark) => bookmark.id !== bookmarkId
        )
      );
    } catch (error) {
      console.error(
        "Error menghapus bookmark:",
        error
      );
    } finally {
      setDeletingId(null);
    }
  };

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <main className="min-h-screen bg-[#ede9df] px-4 py-10">
        <div className="mx-auto max-w-6xl text-center">
          <p className="font-bold text-[#17191b]">
            Memuat profil...
          </p>
        </div>
      </main>
    );
  }

  // =========================
  // PROFILE
  // =========================

  return (
    <main className="min-h-screen bg-[#ede9df] px-4 py-8">
      <div className="mx-auto max-w-6xl">

        {/* HEADER */}

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">

          <Link
            href="/"
            className="font-black text-[#17191b] hover:underline"
          >
            ← Kembali ke Beranda
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="border-2 border-[#17191b] bg-[#17191b] px-4 py-2 font-bold text-[#ede9df] transition hover:bg-[#f5c430] hover:text-[#17191b]"
          >
            Keluar
          </button>

        </div>

        {/* =========================
            INFORMASI AKUN
        ========================= */}

        <section className="border-[3px] border-[#17191b] bg-white p-6 md:p-8">

          <p className="text-sm font-bold uppercase text-[#5b5f5a]">
            Akun
          </p>

          <h1 className="mt-1 text-3xl font-black text-[#17191b]">
            Profil Saya
          </h1>

          <div className="mt-5 border-2 border-[#17191b] bg-[#fffbea] p-4">

            <p className="text-sm font-bold text-[#5b5f5a]">
              Email
            </p>

            <p className="mt-1 font-black text-[#17191b]">
              {user?.email || "-"}
            </p>

          </div>

        </section>

        {/* =========================
            BOOKMARK
        ========================= */}

        <section className="mt-6">

          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">

            <h2 className="text-2xl font-black text-[#17191b]">
              Komik Saya
            </h2>

            <span className="border-2 border-[#17191b] bg-[#f5c430] px-3 py-1 text-sm font-black">
              {bookmarks.length} Komik
            </span>

          </div>

          {/* BELUM ADA BOOKMARK */}

          {bookmarks.length === 0 ? (
            <div className="border-[3px] border-[#17191b] bg-white p-10 text-center">

              <div className="text-5xl">
                🔖
              </div>

              <h3 className="mt-4 text-xl font-black text-[#17191b]">
                Belum Ada Komik
              </h3>

              <p className="mt-2 text-[#5b5f5a]">
                Komik yang kamu bookmark akan muncul di sini.
              </p>

              <Link
                href="/"
                className="mt-5 inline-block border-2 border-[#17191b] bg-[#17191b] px-5 py-3 font-black text-[#ede9df] transition hover:bg-[#f5c430] hover:text-[#17191b]"
              >
                Jelajahi Komik
              </Link>

            </div>
          ) : (

            /* ADA BOOKMARK */

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

              {bookmarks.map((bookmark) => (
                <article
                  key={bookmark.id}
                  className="overflow-hidden border-[3px] border-[#17191b] bg-white"
                >

                  {/* POSTER */}

                  <Link
                    href={`/comics/${bookmark.slug}`}
                    className="block"
                  >

                    {bookmark.poster ? (
                      <img
                        src={bookmark.poster}
                        alt={bookmark.title}
                        className="aspect-[2/3] w-full object-cover transition hover:opacity-80"
                      />
                    ) : (
                      <div className="flex aspect-[2/3] items-center justify-center bg-[#fffbea] p-4 text-center font-bold text-[#17191b]">
                        Tidak ada poster
                      </div>
                    )}

                  </Link>

                  {/* INFORMASI */}

                  <div className="p-4">

                    <Link
                      href={`/comics/${bookmark.slug}`}
                      className="block"
                    >

                      <h3 className="text-xl font-black text-[#17191b] hover:underline">
                        {bookmark.title}
                      </h3>

                    </Link>

                    {/* STATUS BACA */}

                    {bookmark.lastChapterNumber !== null ? (
                      <p className="mt-2 text-sm font-bold text-[#5b5f5a]">
                        Terakhir dibaca: Chapter{" "}
                        {bookmark.lastChapterNumber}
                      </p>
                    ) : (
                      <p className="mt-2 text-sm font-bold text-[#5b5f5a]">
                        Belum dibaca
                      </p>
                    )}

                    {/* TOMBOL */}

                    <div className="mt-4 flex flex-wrap gap-2">

                      {bookmark.lastChapterId ? (
                        <Link
                          href={`/comics/${bookmark.slug}/chapter/${bookmark.lastChapterId}`}
                          className="flex-1 border-2 border-[#17191b] bg-[#f5c430] px-3 py-2 text-center text-sm font-black text-[#17191b] transition hover:bg-[#17191b] hover:text-[#ede9df]"
                        >
                          Lanjut
                        </Link>
                      ) : (
                        <Link
                          href={`/comics/${bookmark.slug}`}
                          className="flex-1 border-2 border-[#17191b] bg-[#17191b] px-3 py-2 text-center text-sm font-black text-[#ede9df] transition hover:bg-[#f5c430] hover:text-[#17191b]"
                        >
                          Mulai Baca
                        </Link>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          handleDeleteBookmark(
                            bookmark.id
                          )
                        }
                        disabled={
                          deletingId === bookmark.id
                        }
                        className="border-2 border-[#17191b] bg-white px-3 py-2 text-sm font-black text-[#17191b] transition hover:bg-[#17191b] hover:text-[#ede9df] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {deletingId === bookmark.id
                          ? "..."
                          : "Hapus"}
                      </button>

                    </div>

                  </div>

                </article>
              ))}

            </div>
          )}

        </section>

      </div>
    </main>
  );
}