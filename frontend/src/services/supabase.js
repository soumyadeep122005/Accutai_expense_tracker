import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://trbrkrukddadkcmdjyta.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyYnJrcnVrZGRhZGtjbWRqeXRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgxNTkzNjMsImV4cCI6MjEwMzczNTM2M30.wEEsQ5X7Ze6WuYYlnZLpANG2KRfqUUcy_qbRySIdNPY';
export const SUPABASE_BUCKET = import.meta.env.VITE_SUPABASE_BUCKET || 'accutai_expense_bills';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function uploadReceiptDirect(file) {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `receipts/${fileName}`;

    const { data, error } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.warn('Direct Supabase upload error:', error.message);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from(SUPABASE_BUCKET)
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (err) {
    console.error('Direct Supabase upload exception:', err);
    return null;
  }
}
