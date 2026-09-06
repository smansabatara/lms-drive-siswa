"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ALLOWED_GURUS } from "@/lib/gurulist";

export default function HomePage() {
  const router = useRouter();

  // State Modal Login Guru
  const [showGuruModal, setShowGuruModal] = useState(false);
  const [guruEmail, setGuruEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleGuruLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const formattedEmail = guruEmail.trim().toLowerCase();

    // Cari guru berdasarkan email yang diinput
    const foundGuru = ALLOWED_GURUS.find(
      (g) => g.email.toLowerCase() === formattedEmail
    );

    if (foundGuru) {
      // Simpan nama & email guru yang terverifikasi ke browser
      localStorage.setItem("userRole", "guru");
      localStorage.setItem("guruName", foundGuru.name);
      localStorage.setItem("guruEmail", foundGuru.email);

      // Arahkan ke dashboard guru
      router.push("/guru");
    } else {
      setErrorMessage("Akses Ditolak! Email Anda tidak terdaftar sebagai Guru.");
    }
  };

  const handleSiswaAccess = () => {
    localStorage.setItem("userRole", "siswa");
    router.push("/siswa/tugas");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4 text-black">
      <div className="max-w-md w-full bg-white rounded-xl shadow-md p-8 border text-center">
        <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Portal LMS Sekolah</h1>
        <p className="text-gray-600 text-sm mb-8">
          Selamat datang! Silakan pilih peran kamu untuk melanjutkan.
        </p>

        <div className="space-y-4">
          {/* Tombol Masuk sebagai Guru */}
          <button
            onClick={() => setShowGuruModal(true)}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow transition flex items-center justify-center gap-2"
          >
            👨‍🏫 Masuk sebagai Guru
          </button>

          {/* Tombol Masuk sebagai Siswa */}
          <button
            onClick={handleSiswaAccess}
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow transition flex items-center justify-center gap-2"
          >
            🎓 Masuk sebagai Siswa
          </button>
        </div>
      </div>

      {/* Modal Verifikasi Email Guru */}
      {showGuruModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full text-black shadow-xl">
            <h2 className="text-xl font-bold mb-1">Login Guru</h2>
            <p className="text-xs text-gray-500 mb-4">
              Masukkan email terdaftar Anda untuk masuk ke Dashboard.
            </p>

            <form onSubmit={handleGuruLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Email Guru</label>
                <input
                  type="email"
                  value={guruEmail}
                  onChange={(e) => setGuruEmail(e.target.value)}
                  placeholder="contoh: guru@sekolah.sch.id"
                  className="w-full p-2.5 border rounded-lg text-sm bg-white text-black"
                  required
                />
              </div>

              {errorMessage && (
                <p className="text-xs font-semibold text-red-600 bg-red-50 p-2 rounded border border-red-200">
                  {errorMessage}
                </p>
              )}

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowGuruModal(false);
                    setErrorMessage("");
                  }}
                  className="px-4 py-2 text-sm bg-gray-200 rounded-lg font-medium hover:bg-gray-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700"
                >
                  Masuk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}