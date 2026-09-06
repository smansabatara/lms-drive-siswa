"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function BuatTugasPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<any[]>([]);

  // State Input
  const [courseName, setCourseName] = useState("");
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchClasses() {
      const { data, error } = await supabase
        .from("classes")
        .select("*")
        .order("name", { ascending: true });

      if (error) {
        console.error("Gagal mengambil data kelas:", error.message);
      } else if (data) {
        setClasses(data);
      }
    }
    fetchClasses();
  }, []);

  const handleClassToggle = (classId: string) => {
    setSelectedClasses((prev) =>
      prev.includes(classId)
        ? prev.filter((id) => id !== classId)
        : [...prev, classId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedClasses.length === 0)
      return alert("Pilih minimal satu target kelas!");
    if (!courseName.trim()) return alert("Mata pelajaran tidak boleh kosong!");

    setLoading(true);

    const teacherName = localStorage.getItem("guruName") || "";
    const teacherEmail = localStorage.getItem("guruEmail") || "";

    try {
      // 1. Simpan Tugas ke tabel assignments
      const { data: assignment, error: assignErr } = await supabase
        .from("assignments")
        .insert([
          {
            course_name: courseName.trim(),
            title,
            description,
            attachment_url: attachmentUrl,
            due_date: new Date(dueDate).toISOString(),
            created_by: teacherName,
            teacher_email: teacherEmail,
          },
        ])
        .select()
        .single();

      if (assignErr) throw assignErr;

      // 2. Hubungkan Tugas dengan Kelas
      const classRelations = selectedClasses.map((classId) => ({
        assignment_id: assignment.id,
        class_id: classId,
      }));

      const { error: relErr } = await supabase
        .from("assignment_classes")
        .insert(classRelations);
      if (relErr) throw relErr;

      alert("Tugas berhasil diterbitkan!");
      router.push("/guru");
    } catch (err: any) {
      alert("Gagal membuat tugas: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white text-black min-h-screen">
      <div className="flex items-center justify-between mb-6 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            ➕ Buat Tugas Baru
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Isi detail tugas yang akan diberikan kepada siswa.
          </p>
        </div>

        <button
          type="button"
          onClick={() => router.push("/guru")}
          className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs px-3.5 py-2 rounded-lg font-bold transition flex items-center gap-1.5 border"
        >
          ⬅️ Kembali ke Dashboard
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block font-medium mb-1 text-sm">
            1. Mata Pelajaran
          </label>
          <input
            type="text"
            value={courseName}
            onChange={(e) => setCourseName(e.target.value)}
            className="w-full p-2.5 border rounded text-black bg-white text-sm"
            placeholder="Ketik Nama Mata Pelajaran (Contoh: Fisika, Matematika)"
            required
          />
        </div>

        <div>
          <label className="block font-medium mb-2 text-sm">
            2. Target Kelas (Bisa Pilih Banyak)
          </label>
          {classes.length === 0 ? (
            <p className="text-xs text-red-500 italic">
              Memuat data kelas...
            </p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 border p-3 rounded bg-gray-50">
              {classes.map((cls) => (
                <label
                  key={cls.id}
                  className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-100 p-1 rounded"
                >
                  <input
                    type="checkbox"
                    checked={selectedClasses.includes(cls.id)}
                    onChange={() => handleClassToggle(cls.id)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="font-semibold text-gray-800">
                    {cls.name}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block font-medium mb-1 text-sm">
            3. Judul Tugas
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2.5 border rounded text-black bg-white text-sm"
            placeholder="Contoh: Tugas 1 - Logaritma"
            required
          />
        </div>

        <div>
          <label className="block font-medium mb-1 text-sm">
            4. Deskripsi & Petunjuk Pengerjaan
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2.5 border rounded text-black bg-white text-sm"
            rows={3}
            placeholder="Tuliskan petunjuk pengerjaan di sini..."
          />
        </div>

        <div>
          <label className="block font-medium mb-1 text-sm">
            5. Link Lampiran Soal (PDF / Gambar / Drive)
          </label>
          <input
            type="url"
            value={attachmentUrl}
            onChange={(e) => setAttachmentUrl(e.target.value)}
            className="w-full p-2.5 border rounded text-black bg-white text-sm"
            placeholder="https://..."
          />
        </div>

        <div>
          <label className="block font-medium mb-1 text-sm">
            6. Batas Waktu Pengumpulan (Tanggal & Jam)
          </label>
          <input
            type="datetime-local"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full p-2.5 border rounded text-black bg-white text-sm"
            required
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.push("/guru")}
            className="w-1/3 bg-gray-200 text-gray-800 py-2.5 rounded font-bold hover:bg-gray-300 text-sm transition"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={loading}
            className="w-2/3 bg-blue-600 text-white py-2.5 rounded font-bold hover:bg-blue-700 disabled:bg-gray-400 text-sm transition"
          >
            {loading ? "Menerbitkan..." : "Terbitkan Tugas"}
          </button>
        </div>
      </form>
    </div>
  );
}