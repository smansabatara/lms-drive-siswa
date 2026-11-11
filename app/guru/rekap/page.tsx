"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function RekapNilaiPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    const name = localStorage.getItem("guruName");
    const email = localStorage.getItem("guruEmail");

    if (role !== "guru") {
      router.push("/");
      return;
    }

    fetchClassesAndSubmissions(name || "", email || "");
  }, [router]);

  // Ambil data kelas dan rekap nilai khusus tugas milik guru yang login
  const async fetchData = async (guruName: string, guruEmail: string) => {} // placeholder structure handled below
  
  const fetchClassesAndSubmissions = async (guruName: string, guruEmail: string) => {
    setLoading(true);

    // 1. Ambil daftar kelas untuk dropdown filter
    const { data: classData } = await supabase.from("classes").select("*").order("name");
    if (classData) setClasses(classData);

    // 2. Ambil data tugas yang dibuat oleh guru ini saja
    const { data: assignData } = await supabase.from("assignments").select("*");
    
    if (assignData) {
      const myAssignments = assignData.filter(
        (task) =>
          (task.created_by && task.created_by === guruName) ||
          (task.teacher_email && task.teacher_email === guruEmail)
      );
      const myAssignmentIds = myAssignments.map((t) => t.id);

      if (myAssignmentIds.length > 0) {
        // 3. Ambil data submissions yang berelasi dengan tugas guru ini
        const { data: subData, error } = await supabase
          .from("submissions")
          .select(`
            id,
            student_name,
            student_email,
            grade,
            is_late,
            created_at,
            assignment_id,
            assignments (
              id,
              title,
              course_name
            )
          `)
          .in("assignment_id", myAssignmentIds)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Gagal mengambil data rekap:", error.message);
        } else if (subData) {
          setSubmissions(subData);
        }
      } else {
        setSubmissions([]);
      }
    }

    setLoading(false);
  };

  // Filter pencarian nama siswa
  const filteredSubmissions = submissions.filter((item) =>
    item.student_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white text-black min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📊 Rekap Nilai Siswa</h1>
          <p className="text-sm text-gray-600">
            Laporan pengumpulan dan rekapan nilai akhir seluruh siswa.
          </p>
        </div>

        {/* Tombol Navigasi & Cetak */}
        <div className="flex items-center gap-2">
          <a
            href="/guru"
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs px-3 py-2 rounded font-bold transition"
          >
            ← Kembali ke Dashboard
          </a>
          <button
            onClick={() => window.print()}
            className="bg-green-600 hover:bg-green-700 text-white text-xs px-4 py-2 rounded font-bold"
          >
            🖨️ Cetak / Simpan PDF
          </button>
        </div>
      </div>

      {/* Filter & Pencarian */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="w-full sm:w-1/3">
          <label className="block text-xs font-semibold mb-1">Filter Kelas:</label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full p-2 border rounded bg-white text-black font-medium text-xs"
          >
            <option value="">Semua Kelas</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                Kelas {cls.name}
              </option>
            ))}
          </select>
        </div>

        <div className="w-full sm:w-2/3">
          <label className="block text-xs font-semibold mb-1">Cari Nama Siswa:</label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Ketik nama siswa..."
            className="w-full p-2 border rounded bg-white text-black text-xs"
          />
        </div>
      </div>

      {/* Tabel Rekapitulasi */}
      {loading ? (
        <p className="text-gray-500 italic text-sm">Memuat rekapan nilai...</p>
      ) : filteredSubmissions.length === 0 ? (
        <div className="p-6 border rounded bg-gray-50 text-gray-500 text-center text-sm">
          Belum ada data nilai yang tersimpan dari tugas Anda.
        </div>
      ) : (
        <div className="overflow-x-auto border rounded-lg shadow-sm">
          <table className="w-full text-left border-collapse bg-white">
            <thead className="bg-gray-100 text-gray-800 border-b text-xs">
              <tr>
                <th className="p-3 font-bold">No</th>
                <th className="p-3 font-bold">Nama Siswa</th>
                <th className="p-3 font-bold">Mata Pelajaran</th>
                <th className="p-3 font-bold">Judul Tugas</th>
                <th className="p-3 font-bold text-center">Status</th>
                <th className="p-3 font-bold text-center">Nilai</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-xs text-gray-800">
              {filteredSubmissions.map((item, index) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="p-3 font-medium text-gray-500">{index + 1}</td>
                  <td className="p-3 font-semibold text-gray-900">
                    {item.student_name}
                    <span className="block text-xs text-gray-400 font-normal">
                      {item.student_email}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded">
                      {item.assignments?.course_name || "-"}
                    </span>
                  </td>
                  <td className="p-3">{item.assignments?.title || "-"}</td>
                  <td className="p-3 text-center">
                    {item.is_late ? (
                      <span className="bg-red-100 text-red-700 px-2 py-1 rounded font-semibold">
                        Terlambat
                      </span>
                    ) : (
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded font-semibold">
                        Tepat Waktu
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-center font-bold text-sm text-blue-600">
                    {item.grade !== null && item.grade !== "" ? (
                      item.grade
                    ) : (
                      <span className="text-gray-300 italic">Belum dinilai</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}