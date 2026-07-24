import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Register() {
  const nav = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', password_confirmation: '' });
  const [message, setMessage] = useState('');
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setMessage('');
    try { await apiClient.post('/auth/register', form); setMessage('Başvurunuz alındı. SUPER_ADMIN onayından sonra Test Adliyesi üzerinden giriş yapabilirsiniz.'); setTimeout(() => nav('/login'), 1800); }
    catch (error: any) { const code = error?.response?.data?.message; setMessage(code === 'EMAIL_EXISTS' ? 'Bu e-posta adresiyle daha önce kayıt oluşturulmuş.' : 'Kayıt oluşturulamadı. Bilgilerinizi kontrol ediniz.'); }
  };
  return <div className="min-h-screen flex items-center justify-center bg-muted p-4"><form onSubmit={submit} className="w-full max-w-lg space-y-4 rounded-lg border bg-card p-8"><h1 className="text-2xl font-semibold">Müdür Kaydı</h1><p className="text-sm text-muted-foreground">Başvurunuz ilk aşamada Test Adliyesi’ne atanır. SUPER_ADMIN daha sonra görev yerinizi güncelleyebilir.</p>{message && <div className="rounded bg-muted p-3 text-sm">{message}</div>}<Input required placeholder="Ad Soyad" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /><Input required type="email" placeholder="E-posta" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /><Input required minLength={6} type="password" placeholder="Şifre" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /><Input required minLength={6} type="password" placeholder="Şifre tekrar" value={form.password_confirmation} onChange={e => setForm({ ...form, password_confirmation: e.target.value })} /><Button className="w-full" type="submit">Başvuru Gönder</Button><p className="text-center text-sm"><Link className="underline" to="/login">Giriş sayfasına dön</Link></p></form></div>;
}
