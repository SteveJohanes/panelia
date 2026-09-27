"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);

      router.push("/");
    } catch (error: any) {
      console.error("Login error:", error);

      if (
        error.code === "auth/invalid-credential" ||
        error.code === "auth/wrong-password" ||
        error.code === "auth/user-not-found"
      ) {
        setError("Email atau password salah.");
      } else if (error.code === "auth/invalid-email") {
        setError("Format email tidak valid.");
      } else {
        setError("Login gagal. Silakan coba lagi.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#ede9df] px-4 py-10">
      <div className="mx-auto flex min-h-[80vh] max-w-md items-center justify-center">
        <div className="w-full border-[3px] border-[#17191b] bg-[#fffbea] p-6 shadow-[8px_8px_0_#17191b]">
          
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-black text-[#17191b]">
              Login Panelia
            </h1>

            <p className="mt-2 text-sm text-[#5b5f5a]">
              Login untuk menyimpan komik dan riwayat bacaan.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="mb-1 block text-sm font-bold text-[#17191b]"
              >
                Email
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                required
                className="w-full border-2 border-[#17191b] bg-white px-3 py-3 text-[#17191b] outline-none placeholder:text-gray-500 focus:ring-2 focus:ring-[#f5c430]"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1 block text-sm font-bold text-[#17191b]"
              >
                Password
              </label>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                className="w-full border-2 border-[#17191b] bg-white px-3 py-3 text-[#17191b] outline-none placeholder:text-gray-500 focus:ring-2 focus:ring-[#f5c430]"
              />
            </div>

            {error && (
              <div className="border-2 border-red-700 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full border-[3px] border-[#17191b] bg-[#e23d28] px-5 py-3 font-bold text-[#ede9df] transition hover:bg-[#17191b] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Memproses..." : "Login"}
            </button>
          </form>

          <div className="mt-6 border-t-2 border-[#17191b] pt-5 text-center">
            <p className="text-sm text-[#5b5f5a]">
              Belum punya akun?
            </p>

            <Link
              href="/register"
              className="mt-1 inline-block font-bold text-[#17191b] underline"
            >
              Daftar sekarang
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}