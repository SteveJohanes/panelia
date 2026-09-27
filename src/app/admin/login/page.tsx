"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
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

      router.push("/admin");
    } catch (error) {
      console.error("Login error:", error);

      setError("Email atau password salah.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#ede9df] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-[#fffbea] border-4 border-[#17191b] shadow-[8px_8px_0_#17191b] p-6 sm:p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-black text-[#17191b]">
              Admin Login
            </h1>

            <p className="mt-2 text-[#17191b]">
              Masuk untuk mengelola Panelia.
            </p>
          </div>

          {error && (
            <div className="mb-5 border-3 border-[#17191b] bg-red-100 px-4 py-3 font-bold text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block mb-2 font-bold text-[#17191b]"
              >
                Email
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
                disabled={loading}
                className="w-full border-3 border-[#17191b] bg-white px-4 py-3 text-[#17191b] placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-[#f5c430] disabled:opacity-60"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block mb-2 font-bold text-[#17191b]"
              >
                Password
              </label>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                required
                disabled={loading}
                className="w-full border-3 border-[#17191b] bg-white px-4 py-3 text-[#17191b] placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-[#f5c430] disabled:opacity-60"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full border-4 border-[#17191b] bg-[#f5c430] px-4 py-3 font-black text-[#17191b] shadow-[4px_4px_0_#17191b] transition hover:translate-x-1 hover:translate-y-1 hover:shadow-none disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Memproses..." : "Login"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}