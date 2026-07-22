import { useState } from 'react';
import { Lock, CheckCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import apiClient from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function Profile() {
  const { user } = useAuth();

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Yeni şifreler eşleşmiyor.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır.');
      return;
    }

    setSaving(true);
    try {
      await apiClient.patch('/auth/me/password', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setSuccess('Şifre başarıyla değiştirildi.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordForm(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Şifre değiştirilemedi.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-foreground tracking-tight">Profil</h1>
        <p className="text-[13px] text-muted-foreground mt-1">Hesap bilgileriniz ve ayarlarınız</p>
      </div>

      {/* User Info Card */}
      <div className="rounded-xl border border-border bg-card shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-4 pb-4 border-b border-border">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-lg font-bold text-primary">
            {user?.name?.charAt(0) || '?'}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">{user?.name}</h2>
            <p className="text-[13px] text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[13px] text-muted-foreground">Rol</span>
            <span className="text-[13px] font-medium text-foreground">
              {user?.role === 'SUPER_ADMIN' ? 'Süper Admin' : user?.role === 'ADLIYE_ADMIN' ? 'Adliye Admin' : 'Müdür'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[13px] text-muted-foreground">E-posta</span>
            <span className="text-[13px] font-medium text-foreground">{user?.email}</span>
          </div>
        </div>

        <div className="pt-2">
          <Button onClick={() => setShowPasswordForm(true)} className="w-full">
            <Lock className="h-4 w-4 mr-2" />
            Şifre Değiştir
          </Button>
        </div>
      </div>

      {/* Change Password Dialog */}
      <Dialog open={showPasswordForm} onOpenChange={setShowPasswordForm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Şifre Değiştir</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleChangePassword} className="space-y-4">
            {error && (
              <div className="rounded-[4px] bg-critical-bg p-3 text-[12px] text-critical-text">{error}</div>
            )}
            {success && (
              <div className="rounded-[4px] bg-success-bg p-3 text-[12px] text-success-text flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                {success}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="current-password">Mevcut Şifre</Label>
              <Input id="current-password" type="password" value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">Yeni Şifre</Label>
              <Input id="new-password" type="password" value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)} required minLength={6} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Yeni Şifre (Tekrar)</Label>
              <Input id="confirm-password" type="password" value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)} required />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" type="button" onClick={() => setShowPasswordForm(false)}>İptal</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Kaydediliyor...' : 'Değiştir'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
