import { useState } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import DOMPurify from 'dompurify';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/shared/status-badge';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { EmptyState } from '@/components/shared/empty-state';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import { Plus, Trash, Pencil, Copy, Eye, Globe, MapPin, Building2, Lock, FileText, Search } from 'lucide-react';

interface Template {
  id: string;
  title: string;
  content: string;
  category: string;
  visibility: string;
  isOwner: boolean;
  created_at: string;
  creator_name: string | null;
}

const categoryLabels: Record<string, string> = {
  TEXT: 'Metin',
  DECISION: 'Karar',
  MUZEKKERE: 'Müzekkere',
};

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ align: [] }],
    ['clean'],
  ],
};

const quillFormats = [
  'header',
  'bold',
  'italic',
  'underline',
  'strike',
  'list',
  'bullet',
  'align',
];

function plainTextFromHtml(value: string): string {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}
function sanitizedTemplateContent(value: string): string {
  return DOMPurify.sanitize(value, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'ol', 'ul', 'li'],
    ALLOWED_ATTR: ['class'],
  });
}

function getApiErrorMessage(error: unknown): string | string[] | undefined {
  if (typeof error !== 'object' || error === null || !('response' in error)) return undefined;
  const response = error.response;
  if (typeof response !== 'object' || response === null || !('data' in response)) return undefined;
  const data = response.data;
  if (typeof data !== 'object' || data === null || !('message' in data)) return undefined;
  const message = data.message;
  if (typeof message === 'string') return message;
  if (Array.isArray(message) && message.every((item): item is string => typeof item === 'string')) {
    return message;
  }
  return undefined;
}

const visibilityLabels: Record<string, { label: string; icon: React.ReactNode }> = {
  PRIVATE: { label: 'Özel', icon: <Lock className="h-3 w-3" /> },
  CITY: { label: 'İl', icon: <MapPin className="h-3 w-3" /> },
  DISTRICT: { label: 'İlçe', icon: <Building2 className="h-3 w-3" /> },
  NATIONAL: { label: 'Türkiye', icon: <Globe className="h-3 w-3" /> },
};

const visibilityOptions = [
  { value: 'PRIVATE', label: 'Özel — Sadece ben' },
  { value: 'CITY', label: 'İl — Aynı ildeki müdürler' },
  { value: 'DISTRICT', label: 'İlçe — Aynı ilçedeki müdürler' },
  { value: 'NATIONAL', label: 'Türkiye — Tüm müdürler' },
];

export default function Templates() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [copiedTemplateId, setCopiedTemplateId] = useState<string | null>(null);
  const [copyError, setCopyError] = useState('');
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading } = useQuery<Template[]>({
    queryKey: ['templates'],
    queryFn: async () => {
      const res = await apiClient.get('/templates');
      return res.data.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/templates/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setDeleteId(null);
    },
  });

  const templates = data || [];
  const normalizedSearch = searchQuery.trim().toLocaleLowerCase('tr-TR');
  const filtered = templates.filter((template) => {
    const matchesCategory = !categoryFilter || template.category === categoryFilter;
    if (!normalizedSearch) return matchesCategory;
    const searchableText = `${template.title} ${plainTextFromHtml(template.content)} ${template.category}`.toLocaleLowerCase('tr-TR');
    return matchesCategory && searchableText.includes(normalizedSearch);
  });
  const handleCopy = async (template: Template) => {
    setCopyError('');
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error('Clipboard API kullanılamıyor.');
      }
      await navigator.clipboard.writeText(plainTextFromHtml(template.content));
      setCopiedTemplateId(template.id);
      window.setTimeout(() => {
        setCopiedTemplateId((currentId) => currentId === template.id ? null : currentId);
      }, 2000);
    } catch {
      setCopyError('Şablon panoya kopyalanamadı.');
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-foreground">Şablonlar</h1>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Sık kullandığınız metin, karar ve müzekkere içeriklerini kaydedin, paylaşın.
          </p>
        </div>
        <Button onClick={() => {
          setEditingTemplate(null);
          setShowForm(true);
        }}>
          <Plus className="h-4 w-4 mr-1.5" />
          Şablon Ekle
        </Button>
      </div>
      {copyError && (
        <div role="status" className="rounded-[4px] bg-critical-bg p-3 text-[12px] text-critical-text">
          {copyError}
        </div>
      )}
      {copiedTemplateId && (
        <div role="status" className="rounded-[4px] bg-success-bg p-3 text-[12px] text-success-text">
          Şablon içeriği panoya kopyalandı.
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Başlık veya içerikte ara..."
            className="h-9 pl-9 text-xs"
            aria-label="Şablonlarda ara"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {['', 'TEXT', 'DECISION', 'MUZEKKERE'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`rounded-lg border px-3 py-1.5 text-[11px] font-medium transition-colors ${
                categoryFilter === cat
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-muted-foreground hover:bg-muted'
              }`}
            >
              {cat ? categoryLabels[cat] : 'Tümü'}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : filtered.length === 0 ? (
        <EmptyState message="Henüz şablon bulunmuyor." icon={<FileText className="h-12 w-12" />} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((t) => (
            <Card key={t.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-[13px] font-semibold leading-tight">
                    {t.title}
                  </CardTitle>
                  <div className="flex items-center gap-1 shrink-0">
                    <StatusBadge status={categoryLabels[t.category] ?? t.category} />
                    <span className="text-muted-foreground" title={visibilityLabels[t.visibility]?.label}>
                      {visibilityLabels[t.visibility]?.icon}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 pb-3">
                <p className="text-[11px] text-muted-foreground line-clamp-4 whitespace-pre-wrap">
                  {plainTextFromHtml(t.content)}
                </p>
              </CardContent>
              <CardFooter className="border-t border-border pt-3 flex justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(t.created_at).toLocaleDateString('tr-TR')}
                  </span>
                  {t.isOwner && (
                    <span className="text-[10px] text-gold font-medium">Bu Şablon Size Ait</span>
                  )}
                  {!t.isOwner && t.visibility !== 'PRIVATE' && t.creator_name && (
                    <span className="text-[10px] text-muted-foreground">
                      Oluşturan: {t.creator_name}
                    </span>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="xs"
                    title="Önizle"
                    aria-label="Önizle"
                    onClick={() => setPreviewTemplate(t)}
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="xs"
                    title={copiedTemplateId === t.id ? 'Kopyalandı' : 'Panoya Kopyala'}
                    aria-label={copiedTemplateId === t.id ? 'Kopyalandı' : 'Panoya Kopyala'}
                    onClick={() => void handleCopy(t)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  {t.isOwner && (
                    <>
                      <Button
                        variant="ghost"
                        size="xs"
                        title="Düzenle"
                        aria-label="Düzenle"
                        onClick={() => {
                          setEditingTemplate(t);
                          setShowForm(true);
                        }}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="xs"
                        title="Sil"
                        aria-label="Sil"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => setDeleteId(t.id)}
                      >
                        <Trash className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Dialog
        open={showForm}
        disablePointerDismissal
        onOpenChange={(open, details) => {
          if (open) {
            setShowForm(true);
          } else if (details.reason === 'close-press') {
            setShowForm(false);
            setEditingTemplate(null);
          } else {
            details.cancel();
          }
        }}
      >
        <DialogContent className="w-[92vw] !max-w-[1100px] max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Şablon Düzenle' : 'Yeni Şablon'}
            </DialogTitle>
          </DialogHeader>
          <TemplateForm
            key={editingTemplate?.id ?? 'new'}
            template={editingTemplate}
            onSuccess={() => {
              setShowForm(false);
              setEditingTemplate(null);
              queryClient.invalidateQueries({ queryKey: ['templates'] });
            }}
            onCancel={() => {
              setShowForm(false);
              setEditingTemplate(null);
            }}
          />
        </DialogContent>
      </Dialog>
      {/* Preview Modal */}
      <Dialog open={!!previewTemplate} onOpenChange={(open) => { if (!open) setPreviewTemplate(null); }}>
        <DialogContent className="w-[94vw] !max-w-[980px] overflow-hidden p-0">
          {previewTemplate && (
            <div className="flex max-h-[88vh] flex-col">
              <div className="border-b border-border bg-muted/30 px-6 py-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">Şablon önizleme</p>
                    <DialogHeader className="text-left">
                      <DialogTitle className="truncate text-xl font-semibold tracking-tight">{previewTemplate.title}</DialogTitle>
                    </DialogHeader>
                  </div>
                  <div className="flex shrink-0 flex-wrap justify-end gap-2">
                    <span className="rounded-full border border-border bg-card px-3 py-1 text-[11px] font-medium text-foreground">
                      {categoryLabels[previewTemplate.category] ?? previewTemplate.category}
                    </span>
                    <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-medium text-primary">
                      {visibilityLabels[previewTemplate.visibility]?.label}
                    </span>
                  </div>
                </div>
              </div>
              <div className="min-w-0 overflow-y-auto overflow-x-hidden bg-[#f4f1eb] px-4 py-6 sm:px-10">
                <article
                  className="mx-auto min-h-[260px] w-full max-w-[760px] min-w-0 overflow-hidden rounded-sm border border-[#e5dfd5] bg-white px-6 py-7 text-[14px] leading-7 text-[#302b27] shadow-[0_4px_18px_rgba(50,40,30,0.06)] [overflow-wrap:anywhere] sm:px-12 sm:py-8 [&_h1]:mb-5 [&_h1]:text-3xl [&_h1]:font-semibold [&_h2]:mb-4 [&_h2]:text-2xl [&_h2]:font-semibold [&_h3]:mb-3 [&_h3]:text-xl [&_h3]:font-semibold [&_li]:ml-6 [&_li]:mb-1 [&_ol]:list-decimal [&_p]:mb-4 [&_ul]:list-disc"
                  dangerouslySetInnerHTML={{ __html: sanitizedTemplateContent(previewTemplate.content) }}
                />
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-border bg-card px-6 py-4">
                <p className="text-[11px] text-muted-foreground">İçerik yalnızca önizleme amacıyla gösterilmektedir.</p>
                <Button size="sm" onClick={() => void handleCopy(previewTemplate)}>
                  <Copy className="mr-1.5 h-3.5 w-3.5" />
                  {copiedTemplateId === previewTemplate.id ? 'Kopyalandı' : 'İçeriği Kopyala'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Şablonu Sil</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-[12px] text-muted-foreground">Bu şablonu silmek istediğinize emin misiniz?</p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" size="sm" onClick={() => setDeleteId(null)}>İptal</Button>
              <Button
                size="sm"
                className="bg-destructive hover:bg-destructive/90"
                disabled={deleteMutation.isPending}
                onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              >
                {deleteMutation.isPending ? 'Siliniyor...' : 'Sil'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TemplateForm({ template, onSuccess, onCancel }: {
  template: Template | null;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(template?.title || '');
  const [content, setContent] = useState(template?.content || '');
  const [category, setCategory] = useState(template?.category || 'TEXT');
  const [visibility, setVisibility] = useState(template?.visibility || 'PRIVATE');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError('Başlık gereklidir.'); return; }
    if (!plainTextFromHtml(content)) { setError('İçerik gereklidir.'); return; }
    setSaving(true);
    setError('');
    try {
      const payload = { title, content, category, visibility };
      if (template) {
        await apiClient.put(`/templates/${template.id}`, payload);
      } else {
        await apiClient.post('/templates', payload);
      }
      onSuccess();
    } catch (err: unknown) {
      const msg = getApiErrorMessage(err);
      setError(Array.isArray(msg) ? msg.join(', ') : msg || 'Kayıt başarısız.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-[4px] bg-critical-bg p-3 text-[12px] text-critical-text">
          {error}
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="template-title">Başlık *</Label>
        <Input
          id="template-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Şablon adı..."
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="template-category-trigger">Kategori *</Label>
        <Select value={category} onValueChange={(v) => { if (v) setCategory(v); }}>
          <SelectTrigger id="template-category-trigger">
            <span>{categoryLabels[category] ?? 'Metin'}</span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TEXT">Metin</SelectItem>
            <SelectItem value="DECISION">Karar</SelectItem>
            <SelectItem value="MUZEKKERE">Müzekkere</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="template-visibility-trigger">Görünürlük</Label>
        <Select value={visibility} onValueChange={(v) => { if (v) setVisibility(v); }}>
          <SelectTrigger id="template-visibility-trigger">
            <span>{visibilityOptions.find((option) => option.value === visibility)?.label ?? 'Özel'}</span>
          </SelectTrigger>
          <SelectContent>
            {visibilityOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="template-content">İçerik *</Label>
        <ReactQuill
          id="template-content"
          theme="snow"
          value={content}
          onChange={setContent}
          modules={quillModules}
          formats={quillFormats}
          placeholder="Şablon içeriğini yazın..."
          className="[&_.ql-editor]:min-h-[300px] [&_.ql-toolbar]:rounded-t-[4px] [&_.ql-container]:rounded-b-[4px]"
        />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>İptal</Button>
        <Button type="submit" disabled={saving}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</Button>
      </div>
    </form>
  );
}
