import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Giriş başarısız. Lütfen bilgilerinizi kontrol edin.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy via-[#1a2f4a] to-navy p-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #c9a84c 0, #c9a84c 1px, transparent 1px, transparent 20px)' }} />

      <div className="w-full max-w-[380px] rounded-[8px] border border-border bg-card p-8 shadow-lg relative z-10">
        <div className="text-center mb-7">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-2xl text-gold" dangerouslySetInnerHTML={{ __html: '&#9878;' }} />
            <span className="text-[22px] font-bold text-foreground font-[family-name:Georgia,serif]">MudurPro</span>
          </div>
          <p className="text-[12px] text-muted-foreground">Yazı İşleri Müdürü Süre Takip Sistemi</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-[4px] bg-critical-bg p-3 text-[12px] text-critical-text">
              {error}
            </div>
          )}
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-[11px] font-medium text-foreground/80">E-posta</label>
            <Input
              id="email"
              type="email"
              placeholder="ornek@adliye.gov.tr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="password" className="text-[11px] font-medium text-foreground/80">Şifre</label>
            <Input
              id="password"
              type="password"
              placeholder="••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <Button type="submit" className="w-full h-10 text-[13px] font-semibold" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Giriş Yap
          </Button>
        </form>

        <p className="text-center mt-6 text-[10px] text-muted-foreground">
          MudurPro v1.0 — Tüm hakları saklıdır
        </p>
      </div>
    </div>
  );
}
