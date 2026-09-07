"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function RekapNilaiPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  // 1. Ambil daftar kelas untuk filter
  useEffect(() => {
    async function fetchClasses() {
      const { data } = await supabase.from("classes").select("*").order("name");
      if (data) setClasses(data);
    }
    fetchClasses();
  }, []);

  // 2. Ambil data pengumpulan & nilai berdasarkan kelas yang dipilih
  useEffect(() => {
    async function fetchRekapData() {
      setLoading(true);

      let query = supabase
        .from("submissions")
        .select(`
          id,
          student_name,
          student_email,
          grade,
          is_late,
          class_id,
          created_at,
          assignments (
            title,
            course_name
          )
        `);

      // Jika kelas dipilih, filter berdasarkan class_id di tabel submissions
      if (selectedClass) {
        query = query.eq("class_id", selectedClass);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Gagal mengambil data rekap:", error.message);
      } else if (data) {
        setSubmissions(data);
      }
      setLoading(false);
    }

    fetchRekapData();
  }, [selectedClass]);

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

        {/* Tombol Cetak / Export */}
        <button
          onClick={() => window.print()}
          className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 rounded font-bold self-start md:self-auto"
        >
          🖨️ Cetak / Simpan PDF
        </button>
      </div>

      {/* Filter & Pencarian */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="w-full sm:w-1/3">
          <label className="block text-xs font-semibold mb-1">Filter Kelas:</label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full p-2 border rounded bg-white text-black font-medium"
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
            className="w-full p-2 border rounded bg-white text-black"
          />
        </div>
      </div>

      {/* Tabel Rekapitulasi */}
      {loading ? (
        <p className="text-gray-500 italic">Memuat rekapan nilai...</p>
      ) : filteredSubmissions.length === 0 ? (
        <div className="p-4 border rounded bg-gray-50 text-gray-500 text-center">
          Belum ada data nilai yang tersimpan. (Pastikan siswa sudah mengumpulkan tugas atau pilih "Semua Kelas").
        </div>
      ) : (
        <div className="overflow-x-auto border rounded-lg shadow-sm">
          <table className="w-full text-left border-collapse bg-white">
            <thead className="bg-gray-100 text-gray-800 border-b">
              <tr>
                <th className="p-3 text-sm font-bold">No</th>
                <th className="p-3 text-sm font-bold">Nama Siswa</th>
                <th className="p-3 text-sm font-bold">Mata Pelajaran</th>
                <th className="p-3 text-sm font-bold">Judul Tugas</th>
                <th className="p-3 text-sm font-bold text-center">Status</th>
                <th className="p-3 text-sm font-bold text-center">Nilai</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm text-gray-800">
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
                    <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-0.5 rounded">
                      {item.assignments?.course_name || "-"}
                    </span>
                  </td>
                  <td className="p-3">{item.assignments?.title || "-"}</td>
                  <td className="p-3 text-center">
                    {item.is_late ? (
                      <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded font-semibold">
                        Terlambat
                      </span>
                    ) : (
                      <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded font-semibold">
                        Tepat Waktu
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-center font-bold text-lg text-blue-600">
                    {item.grade !== null && item.grade !== "" ? (
                      item.grade
                    ) : (
                      <span className="text-gray-300 italic text-sm">Belum dinilai</span>
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