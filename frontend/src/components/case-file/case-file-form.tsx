import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const caseFileSchema = z.object({
  court_id: z.string().uuid('Mahkeme seçimi zorunludur'),
  esas_no: z.string().min(1, 'Esas no zorunludur'),
  karar_no: z.string().optional(),
  karar_tarihi: z.string().optional(),
  karar_sonucu: z.string().optional(),
  kanun_yolu: z.string().optional(),
  aciklama: z.string().optional(),
});

type CaseFileFormValues = z.infer<typeof caseFileSchema>;

interface CaseFileFormProps {
  defaultValues?: Partial<CaseFileFormValues> & { id?: string };
  onSuccess: () => void;
  onCancel: () => void;
}

export function CaseFileForm({ defaultValues, onSuccess, onCancel }: CaseFileFormProps) {
  const { data: courts } = useQuery<{ id: string; name: string }[]>({
    queryKey: ['courts'],
    queryFn: async () => {
      const res = await apiClient.get('/courts');
      return res.data.data || [];
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CaseFileFormValues>({
    resolver: zodResolver(caseFileSchema),
    defaultValues: {
      court_id: defaultValues?.court_id || (courts && courts.length === 1 ? courts[0].id : ''),
      esas_no: defaultValues?.esas_no || '',
      karar_no: defaultValues?.karar_no || '',
      karar_tarihi: defaultValues?.karar_tarihi || '',
      karar_sonucu: defaultValues?.karar_sonucu || '',
      kanun_yolu: defaultValues?.kanun_yolu || '',
      aciklama: defaultValues?.aciklama || '',
    },
  });

  const onSubmit = async (values: CaseFileFormValues) => {
    const payload = {
      ...values,
      karar_tarihi: values.karar_tarihi || undefined,
    };

    if (defaultValues?.id) {
      await apiClient.put(`/cases/${defaultValues.id}`, payload);
    } else {
      await apiClient.post('/cases', payload);
    }
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {courts && courts.length > 1 && (
        <div className="space-y-2">
          <Label htmlFor="court_id">Mahkeme *</Label>
          <select
            id="court_id"
            {...register('court_id')}
            className="flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm"
          >
            <option value="">Seçiniz</option>
            {courts.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {errors.court_id && <p className="text-sm text-destructive">{errors.court_id.message}</p>}
        </div>
      )}
      {courts && courts.length === 0 && (
        <p className="text-sm text-destructive">Henüz bir mahkemeye atanmadınız.</p>
      )}

      <div className="space-y-2">
        <Label htmlFor="esas_no">Esas No *</Label>
        <Input id="esas_no" {...register('esas_no')} placeholder="2024/123" />
        {errors.esas_no && <p className="text-sm text-destructive">{errors.esas_no.message}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="karar_no">Karar No</Label>
          <Input id="karar_no" {...register('karar_no')} placeholder="2024/456" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="karar_tarihi">Karar Tarihi</Label>
          <Input id="karar_tarihi" type="date" {...register('karar_tarihi')} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="karar_sonucu">Karar Sonucu</Label>
        <Input id="karar_sonucu" {...register('karar_sonucu')} placeholder="Karar sonucu..." />
      </div>

      <div className="space-y-2">
        <Label htmlFor="kanun_yolu">Kanun Yolu</Label>
        <Input id="kanun_yolu" {...register('kanun_yolu')} placeholder="Örn: İstinaf" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="aciklama">Açıklama</Label>
        <Input id="aciklama" {...register('aciklama')} placeholder="Açıklama..." />
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
