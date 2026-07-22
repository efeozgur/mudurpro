import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import apiClient from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const partySchema = z.object({
  party_type: z.enum(['PERSON', 'ORGANIZATION']),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  organization_name: z.string().optional(),
  role: z.string().min(1, 'Rol zorunludur'),
  national_id: z.string().max(11, 'TC Kimlik numarası en fazla 11 karakter olabilir').optional().or(z.literal('')),
  tax_number: z.string().max(10, 'Vergi numarası en fazla 10 karakter olabilir').optional().or(z.literal('')),
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
    defaultValues: {
      party_type: 'PERSON', first_name: '', last_name: '', organization_name: '',
      role: '', national_id: '', tax_number: '', address: '', phone: '', email: '',
    },
  });

  const partyType = watch('party_type');

  useEffect(() => {
    if (partyId) {
      setLoading(true);
      apiClient.get(`/parties/${partyId}`).then((res) => {
        const p = res.data.data;
        const mappedType = p.party_type === 'REAL' ? 'PERSON' : p.party_type === 'TUZEL' ? 'ORGANIZATION' : p.party_type || 'PERSON';
        reset({
          party_type: mappedType as 'PERSON' | 'ORGANIZATION',
          first_name: p.first_name || '',
          last_name: p.last_name || '',
          organization_name: p.organization_name || '',
          role: p.role || '',
          national_id: p.national_id || p.tc_kimlik || '',
          tax_number: p.tax_number || p.vergi_no || '',
          address: p.address || '',
          phone: p.phone || '',
          email: p.email || '',
        });
      }).finally(() => setLoading(false));
    }
  }, [partyId, reset]);

  const onSubmit = async (values: PartyFormValues) => {
    const payload = { ...values };
    if (partyId) {
      await apiClient.put(`/parties/${partyId}`, payload);
    } else {
      await apiClient.post(`/cases/${caseFileId}/parties`, payload);
    }
    onSuccess();
  };

  if (loading) return <p className="text-sm text-muted-foreground text-center py-4">Yükleniyor...</p>;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label>Tür</Label>
        <select {...register('party_type')} className="flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm">
          <option value="PERSON">Gerçek Kişi</option>
          <option value="ORGANIZATION">Tüzel Kişi</option>
        </select>
      </div>

      {partyType === 'PERSON' ? (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="first_name">Ad</Label>
            <Input id="first_name" {...register('first_name')} placeholder="Ad" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="last_name">Soyad</Label>
            <Input id="last_name" {...register('last_name')} placeholder="Soyad" />
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="organization_name">Kurum Adı *</Label>
          <Input id="organization_name" {...register('organization_name')} placeholder="Şirket veya kurum adı" />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="role">Rol *</Label>
        <select
          id="role"
          {...register('role')}
          className="flex h-9 w-full rounded-md border bg-transparent px-3 py-1.5 text-sm"
        >
          <option value="">Seçiniz</option>
          <option value="PLAINTIFF">Davacı</option>
          <option value="DEFENDANT">Davalı</option>
        </select>
        {errors.role && <p className="text-sm text-destructive">{errors.role.message}</p>}
      </div>

      {partyType === 'PERSON' ? (
        <div className="space-y-2">
          <Label htmlFor="national_id">TC Kimlik No</Label>
          <Input id="national_id" {...register('national_id')} placeholder="11111111111" maxLength={11} />
          {errors.national_id && <p className="text-sm text-destructive">{errors.national_id.message}</p>}
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="tax_number">Vergi No</Label>
          <Input id="tax_number" {...register('tax_number')} placeholder="1234567890" maxLength={10} />
          {errors.tax_number && <p className="text-sm text-destructive">{errors.tax_number.message}</p>}
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
