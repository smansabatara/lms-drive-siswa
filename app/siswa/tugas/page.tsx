"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useSession, signIn, signOut } from "next-auth/react"; // Menambahkan fungsi signIn dan signOut

export default function SiswaTugasPage() {
  const { data: session, status } = useSession();

  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // State Modal Upload
  const [activeTask, setActiveTask] = useState<any | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // 1. Ambil daftar kelas
  useEffect(() => {
    async function fetchClasses() {
      const { data } = await supabase.from("classes").select("*").order("name");
      if (data) setClasses(data);
    }
    fetchClasses();
  }, []);

  // 2. Ambil daftar tugas berdasarkan kelas
  useEffect(() => {
    if (!selectedClass) return;

    async function fetchAssignments() {
      setLoading(true);
      const { data } = await supabase
        .from("assignment_classes")
        .select(`
          assignment_id,
          assignments (
            id,
            course_name,
            title,
            description,
            attachment_url,
            due_date
          )
        `)
        .eq("class_id", selectedClass);

      if (data) {
        const formatted = data.map((item: any) => item.assignments);
        setAssignments(formatted);
      }
      setLoading(false);
    }

    fetchAssignments();
  }, [selectedClass]);

  // 3. Upload File Jawaban ke Supabase Storage & Simpan ke DB berdasarkan Akun Login
  const handleSubmitJawaban = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return alert("Pilih file tugas dari HP/laptop kamu dulu!");
    if (!activeTask) return;

    const studentName = session?.user?.name || "Siswa";
    const studentEmail = session?.user?.email;

    if (!studentEmail) {
      return alert("Sesi login tidak ditemukan. Silakan login terlebih dahulu!");
    }

    setUploading(true);

    try {
      // A. Upload file ke Supabase Storage via API Route
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("studentName", studentName);
      formData.append("taskTitle", activeTask.title);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Gagal mengunggah file.");
      }

      const uploadedFileUrl = result.fileUrl;

      // B. Simpan data ke tabel submissions
      const { error: dbError } = await supabase.from("submissions").insert([
        {
          assignment_id: activeTask.id || null,
          class_id: selectedClass || null,
          student_name: studentName,
          student_email: studentEmail,
          drive_link: uploadedFileUrl,
          submitted_at: new Date().toISOString(),
        },
      ]);

      if (dbError) throw dbError;

      alert("Tugas berhasil dikumpulkan dengan akun resmi kamu!");

      // Reset Modal & Form
      setActiveTask(null);
      setSelectedFile(null);
    } catch (err: any) {
      alert("Terjadi kesalahan: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white text-black min-h-screen">
      {/* Header & Tombol Login/Logout */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b pb-4">
        <h1 className="text-2xl font-bold">Daftar Tugas Siswa</h1>

        <div>
          {status === "loading" ? (
            <span className="text-xs text-gray-400">Memuat sesi...</span>
          ) : session?.user ? (
            <div className="flex items-center gap-3">
              <div className="text-right text-xs">
                <span className="block font-bold text-gray-800">{session.user.name}</span>
                <span className="text-gray-500">{session.user.email}</span>
              </div>
              <button
                onClick={() => signOut()}
                className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1.5 rounded font-bold transition"
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={() => signIn()}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-2 rounded font-bold transition"
            >
              🔑 Login dengan Google
            </button>
          )}
        </div>
      </div>

      {/* Pilih Kelas */}
      <div className="mb-6">
        <label className="block font-medium mb-1">Pilih Kelas Kamu:</label>
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="w-full sm:w-64 p-2 border rounded bg-white font-semibold text-black"
        >
          <option value="">-- Pilih Kelas --</option>
          {classes.map((cls) => (
            <option key={cls.id} value={cls.id}>
              Kelas {cls.name}
            </option>
          ))}
        </select>
      </div>

      {/* Daftar Tugas */}
      {!selectedClass ? (
        <p className="text-gray-500 italic">Silakan pilih kelas terlebih dahulu untuk melihat tugas.</p>
      ) : loading ? (
        <p className="text-gray-500">Memuat tugas...</p>
      ) : assignments.length === 0 ? (
        <p className="text-gray-500 italic">Belum ada tugas untuk kelas ini.</p>
      ) : (
        <div className="space-y-4">
          {assignments.map((task) => (
            <div key={task.id} className="border p-4 rounded-lg shadow-sm hover:shadow-md transition bg-white">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded uppercase">
                    {task.course_name}
                  </span>
                  <h2 className="text-lg font-bold mt-1 text-gray-900">{task.title}</h2>
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-500 block">Batas Waktu:</span>
                  <span className="text-xs font-semibold text-red-600">
                    {new Date(task.due_date).toLocaleString("id-ID")}
                  </span>
                </div>
              </div>

              {task.description && (
                <p className="text-gray-700 text-sm mb-3 whitespace-pre-line">{task.description}</p>
              )}

              <div className="flex flex-wrap gap-3 items-center pt-3 border-t mt-3">
                {task.attachment_url && (
                  <a
                    href={task.attachment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1.5 rounded font-medium"
                  >
                    📄 Lihat Soal / Lampiran
                  </a>
                )}

                <button
                  onClick={() => {
                    if (!session?.user) {
                      alert("Silakan login terlebih dahulu untuk mengumpulkan tugas!");
                      signIn();
                      return;
                    }
                    setActiveTask(task);
                  }}
                  className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-bold ml-auto"
                >
                  📤 Unggah Jawaban
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Popup Upload File */}
      {activeTask && session?.user && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full text-black shadow-xl">
            <h3 className="text-xl font-bold mb-1">Kumpul Tugas</h3>
            <p className="text-sm text-gray-600 mb-4">{activeTask.title}</p>

            <form onSubmit={handleSubmitJawaban} className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 p-3 rounded text-xs text-blue-900">
                <p className="font-semibold">Informasi Pengirim:</p>
                <p>Nama: <span className="font-bold">{session.user.name}</span></p>
                <p>Email: <span className="font-bold">{session.user.email}</span></p>
                <p className="text-[10px] text-gray-500 mt-1">*Tugas akan tercatat otomatis atas nama akun ini.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Pilih File Tugas (PDF / Gambar / Doc)</label>
                <input
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full p-2 border rounded text-sm bg-gray-50 text-black cursor-pointer"
                  required
                />
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setActiveTask(null)}
                  className="px-4 py-2 text-sm bg-gray-200 rounded font-medium hover:bg-gray-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded font-bold hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {uploading ? "Mengunggah..." : "Unggah Tugas"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
