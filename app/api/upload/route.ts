import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Inisialisasi Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    const studentName = 
      (formData.get("studentName") || 
       formData.get("student_name") || 
       "Siswa") as string;

    const taskTitle = 
      (formData.get("taskTitle") || 
       formData.get("task_title") || 
       "Tugas") as string;

    if (!file) {
      return NextResponse.json({ error: "File tidak ditemukan!" }, { status: 400 });
    }

    // Buat nama file unik agar tidak saling menimpa
    const fileExt = file.name.split(".").pop();
    const cleanFileName = `${Date.now()}_${studentName.replace(/\s+/g, "_")}_${file.name.replace(/\s+/g, "_")}`;
    const filePath = `${cleanFileName}`;

    // Convert file ke ArrayBuffer untuk diupload
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = new Uint8Array(arrayBuffer);

    // 1. Upload file ke Supabase Storage Bucket 'assignments'
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("assignments")
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      throw uploadError;
    }

    // 2. Dapatkan URL Publik File
    const { data: urlData } = supabase.storage
      .from("assignments")
      .getPublicUrl(filePath);

    console.log("--> Berhasil upload ke Supabase Storage! URL:", urlData.publicUrl);

    return NextResponse.json({
      success: true,
      fileUrl: urlData.publicUrl,
    });
  } catch (error: any) {
    console.error("--> Error Supabase Storage:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}