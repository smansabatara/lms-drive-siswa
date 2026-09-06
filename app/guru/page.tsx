"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function DashboardGuruPage() {
  const router = useRouter();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [guruName, setGuruName] = useState<string>("");

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    const name = localStorage.getItem("guruName");
    const email = localStorage.getItem("guruEmail");

    if (role !== "guru") {
      router.push("/");
      return;
    }

    if (name) setGuruName(name);

    fetchData(name || "", email || "");
  }, [router]);

  const fetchData = async (currentGuruName: string, currentGuruEmail: string) => {
    setLoading(true);

    // 1. Ambil data Tugas (Filter khusus milik Guru yang sedang login)
    const { data: assignData, error: assignError } = await supabase
      .from("assignments")
      .select("*");

    if (assignError) {
      console.error("Gagal mengambil data tugas:", assignError.message);
    } else if (assignData) {
      // Filter tugas buatan guru aktif (berdasarkan created_by atau teacher_email)
      // Kode baru (hanya menampilkan jika nama/email benar-benar cocok):
          const myAssignments = assignData.filter(
               (task) =>
               (task.created_by && task.created_by === currentGuruName) ||
               (task.teacher_email && task.teacher_email === currentGuruEmail)
            );
      setAssignments(myAssignments);
    }

    // 2. Ambil data Kiriman Siswa
    const { data: subData, error: subError } = await supabase
      .from("submissions")
      .select("*");

    if (subError) {
      console.error("Gagal mengambil data kiriman:", subError.message);
    } else if (subData) {
      setSubmissions(subData);
    }

    setLoading(false);
  };

  const handleUpdateGrade = async (id: string, gradeValue: string) => {
    const { error } = await supabase
      .from("submissions")
      .update({ grade: gradeValue })
      .eq("id", id);

    if (error) {
      alert("Gagal menyimpan nilai: " + error.message);
    } else {
      alert("Nilai berhasil disimpan!");
      const name = localStorage.getItem("guruName") || "";
      const email = localStorage.getItem("guruEmail") || "";
      fetchData(name, email);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("userRole");
    localStorage.removeItem("guruName");
    localStorage.removeItem("guruEmail");
    router.push("/");
  };

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white text-black min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Selamat Datang, {guruName || "Guru"}! 👋
          </h1>
          <p className="text-gray-600 text-sm">
            Dashboard Pengelolaan Tugas & Penilaian Siswa.
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs px-3 py-2 rounded-lg font-bold transition"
        >
          🚪 Keluar (Logout)
        </button>
      </div>

      {/* Navigasi */}
      <div className="flex flex-wrap gap-3 mb-8">
        <a
          href="/guru"
          className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg text-sm shadow-sm"
        >
          📥 Penilaian Tugas
        </a>
        <a
          href="/guru/tugas"
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-sm transition shadow-sm"
        >
          ➕ Buat Tugas Baru
        </a>
        <a
          href="/guru/rekap"
          className="px-4 py-2 bg-gray-100 text-gray-800 font-bold rounded-lg text-sm hover:bg-gray-200 transition"
        >
          📊 Rekap Nilai
        </a>
      </div>

      {/* DAFTAR TUGAS MILIK GURU INI */}
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-bold text-gray-900">
            📋 Daftar Tugas Saya & Penilaian
          </h2>
          <a
            href="/guru/tugas"
            className="text-xs text-blue-600 hover:underline font-semibold"
          >
            + Tambah Tugas
          </a>
        </div>

        {loading ? (
          <p className="text-gray-500 italic text-sm">Memuat data...</p>
        ) : assignments.length === 0 ? (
          <div className="p-6 border rounded-xl bg-gray-50 text-gray-500 text-center text-sm">
            Belum ada tugas yang Anda buat. Klik tombol <b>➕ Buat Tugas Baru</b> untuk menambahkan.
          </div>
        ) : (
          assignments.map((task) => {
            const taskSubmissions = submissions.filter(
              (sub) =>
                sub.assignment_id === task.id ||
                sub.task_id === task.id ||
                sub.assignment_title === task.title
            );

            return (
              <div
                key={task.id}
                className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden"
              >
                {/* Header Kartu Tugas */}
                <div className="p-5 bg-gray-50 border-b border-gray-200">
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <span className="text-xs bg-blue-100 text-blue-800 px-2.5 py-1 rounded-md font-bold">
                      {task.course_name || task.subject || "Mata Pelajaran"}
                    </span>
                    {(task.due_date || task.deadline) && (
                      <span className="text-xs text-red-600 font-medium bg-red-50 px-2 py-0.5 rounded border border-red-100">
                        ⏰ Deadline:{" "}
                        {task.due_date
                          ? new Date(task.due_date).toLocaleDateString("id-ID")
                          : task.deadline}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">{task.title}</h3>
                  {task.description && (
                    <p className="text-xs text-gray-600 mt-1">{task.description}</p>
                  )}
                </div>

                {/* Bagian Kiriman Siswa */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                      📥 Hasil Pengumpulan Siswa ({taskSubmissions.length})
                    </h4>
                  </div>

                  {taskSubmissions.length === 0 ? (
                    <p className="text-xs text-gray-400 italic py-2">
                      Belum ada siswa yang mengumpulkan tugas ini.
                    </p>
                  ) : (
                    <div className="overflow-x-auto border rounded-lg">
                      <table className="w-full text-left border-collapse bg-white">
                        <thead className="bg-gray-100 text-gray-700 text-xs border-b">
                          <tr>
                            <th className="p-2.5 font-bold">Nama Siswa</th>
                            <th className="p-2.5 font-bold">Email</th>
                            <th className="p-2.5 font-bold">Link File Drive</th>
                            <th className="p-2.5 font-bold">Nilai</th>
                            <th className="p-2.5 font-bold">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 text-xs text-gray-800">
                          {taskSubmissions.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50">
                              <td className="p-2.5 font-semibold text-gray-900">
                                {item.student_name}
                              </td>
                              <td className="p-2.5 text-gray-600">{item.student_email}</td>
                              <td className="p-2.5">
                                {item.drive_link ? (
                                  <a
                                    href={item.drive_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline font-medium flex items-center gap-1"
                                  >
                                    📁 Buka File Drive
                                  </a>
                                ) : (
                                  <span className="text-gray-400 italic">Tidak ada link</span>
                                )}
                              </td>
                              <td className="p-2.5">
                                <input
                                  type="number"
                                  defaultValue={item.grade || ""}
                                  id={`grade-${item.id}`}
                                  placeholder="0-100"
                                  className="w-16 p-1 border rounded text-black bg-white font-medium text-xs"
                                />
                              </td>
                              <td className="p-2.5">
                                <button
                                  onClick={() => {
                                    const input = document.getElementById(
                                      `grade-${item.id}`
                                    ) as HTMLInputElement;
                                    handleUpdateGrade(item.id, input.value);
                                  }}
                                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2.5 py-1 rounded font-bold transition"
                                >
                                  Simpan
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}