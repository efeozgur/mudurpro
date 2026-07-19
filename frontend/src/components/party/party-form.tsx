import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import apiClient from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const partySchema = z.object({
  type: z.enum(['PERSON', 'ORGANIZATION']),
  name: z.string().min(1, 'Ad zorunludur'),
  role: z.string().min(1, 'Rol zorunludur'),
  tc_kimlik: z.string().optional(),
  vergi_no: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Geçerli e-posta girin').optional().or(z.literal('')),
});

type PartyFormValues = z.infer<typeof partySchema>;

interface PartyFormProps {
  caseFileId: string;
  partyId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function PartyForm({ caseFileId, partyId, onSuccess, onCancel }: PartyFormProps) {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PartyFormValues>({
    resolver: zodResolver(partySchema),
    defaultValues: { type: 'PERSON', name: '', role: '', tc_kimlik: '', vergi_no: '', address: '', phone: '', email: '' },
  });

  const partyType = watch('type');

  useEffect(() => {
    if (partyId) {
      setLoading(true);
      apiClient.get(`/parties/${partyId}`).then((res) => {
        const p = res.data.data;
        reset({
          type: p.type || 'PERSON',
          name: p.name || '',
          role: p.role || '',
          tc_kimlik: p.tc_kimlik || '',
          vergi_no: p.vergi_no || '',
          address: p.address || '',
          phone: p.phone || '',
          email: p.email || '',
        });
      }).finally(() => setLoading(false));
    }
  }, [partyId, reset]);

  const onSubmit = async (values: PartyFormValues) => {
    if (partyId) {
      await apiClient.put(`/parties/${partyId}`, values);
    } else {
      await apiClient.post(`/cases/${caseFileId}/parties`, values);
    }
    onSuccess();
  };

  if (loading) return <p className="text-sm text-muted-foreground text-center py-4">Yükleniyor...</p>;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label>Tür</Label>
        <select {...register('type')} className="flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm">
          <option value="PERSON">Gerçek Kişi</option>
          <option value="ORGANIZATION">Tüzel Kişi</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Ad *</Label>
        <Input id="name" {...register('name')} placeholder="Ad soyad veya unvan" />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Rol * (Örn: Davacı, Davalı)</Label>
        <Input id="role" {...register('role')} placeholder="Davacı" />
        {errors.role && <p className="text-sm text-destructive">{errors.role.message}</p>}
      </div>

      {partyType === 'PERSON' ? (
        <div className="space-y-2">
          <Label htmlFor="tc_kimlik">TC Kimlik No</Label>
          <Input id="tc_kimlik" {...register('tc_kimlik')} placeholder="11111111111" />
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="vergi_no">Vergi No</Label>
          <Input id="vergi_no" {...register('vergi_no')} placeholder="1234567890" />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="address">Adres</Label>
        <Input id="address" {...register('address')} placeholder="Adres..." />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Telefon</Label>
          <Input id="phone" {...register('phone')} placeholder="5551234567" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">E-posta</Label>
          <Input id="email" {...register('email')} placeholder="ornek@mail.com" />
          {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          İptal
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
        </Button>
      </div>
    </form>
  );
}
