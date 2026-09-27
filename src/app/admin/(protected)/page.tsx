"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase/config";

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="border-[3px] border-[#17191b] bg-white p-5">
      <p className="text-sm text-[#5b5f5a]">{label}</p>
      <p className="mt-2 text-3xl font-bold text-[#17191b]">{value}</p>
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.replace("/admin/login");
        return;
      }

      setUser(currentUser);
      setCheckingAuth(false);
    });

    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace("/admin/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (checkingAuth) {
    return (
      <main className="min-h-screen bg-[#ede9df] flex items-center justify-center">
        <p className="font-bold text-[#17191b]">
          Memeriksa sesi login...
        </p>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[#ede9df] p-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex items-center justify-between border-b-[3px] border-[#17191b] pb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#17191b]">
              Admin Panel
            </h1>

            <p className="text-sm text-[#5b5f5a]">
              Kelola komik dan chapter.
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="border-2 border-[#17191b] px-4 py-2 text-sm font-semibold text-[#17191b] transition hover:bg-[#17191b] hover:text-[#ede9df]"
          >
            Keluar
          </button>
        </header>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Total Komik" value={0} />
          <StatCard label="Total Chapter" value={0} />
          <StatCard label="Database" value="Firestore" />
        </section>

        <section className="mt-8 border-[3px] border-[#17191b] bg-white p-6">
          <h2 className="text-xl font-bold text-[#17191b]">
            Kelola Konten
          </h2>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/admin/comics"
              className="border-[3px] border-[#17191b] bg-[#e23d28] px-5 py-3 text-sm font-bold text-[#ede9df] transition hover:bg-[#17191b]"
            >
              Kelola Komik
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}