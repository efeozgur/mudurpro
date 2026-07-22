import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight, ChevronsUp, ChevronsDown, Search } from 'lucide-react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  searchPlaceholder?: string;
  onRowClick?: (item: T) => void;
  rowClassName?: (item: T) => string;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  loading?: boolean;
}

export function DataTable<T extends Record<string, unknown> | object>({
  columns,
  data,
  searchPlaceholder = 'Ara...',
  onRowClick,
  rowClassName,
  page = 1,
  totalPages = 1,
  onPageChange,
  loading,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter((item) =>
      columns.some((col) => {
        const val = (item as Record<string, unknown>)[col.key];
        return val != null && String(val).toLowerCase().includes(q);
      })
    );
  }, [data, search, columns]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[sortKey];
      const bVal = (b as Record<string, unknown>)[sortKey];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = String(aVal).localeCompare(String(bVal), 'tr');
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  return (
    <div className="space-y-3">
      <div className="relative max-w-[240px]">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 text-[13px] h-9"
        />
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground text-sm">Yükleniyor...</div>
      ) : (
        <>
          <div className="rounded-[8px] border border-border bg-card overflow-hidden shadow-[0_1px_3px_0_rgba(25,22,21,0.04)]">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((col) => (
                    <TableHead
                      key={col.key}
                      className={col.sortable ? 'cursor-pointer select-none' : ''}
                      onClick={() => col.sortable && handleSort(col.key)}
                    >
                      <div className="flex items-center gap-1">
                        {col.header}
                        {sortKey === col.key && (
                          sortDir === 'asc' ? <ChevronsUp className="h-3 w-3" /> : <ChevronsDown className="h-3 w-3" />
                        )}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="text-center text-muted-foreground py-8">
                      Sonuç bulunamadı.
                    </TableCell>
                  </TableRow>
                ) : (
                  sorted.map((item, i) => (
                    <TableRow
                      key={i}
                      className={`${onRowClick ? 'cursor-pointer' : ''} ${i % 2 === 0 ? 'bg-background' : 'bg-card'} ${rowClassName ? rowClassName(item) : ''}`}
                      onClick={() => onRowClick?.(item)}
                    >
                      {columns.map((col) => (
                        <TableCell key={col.key} className={col.className}>
                          {col.render ? col.render(item) : String((item as Record<string, unknown>)[col.key] ?? '')}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-1">
              <span className="text-[12px] text-muted-foreground">
                Toplam {totalPages} sayfa
              </span>
              <div className="flex items-center gap-1.5">
                <Button variant="outline" size="sm" onClick={() => onPageChange?.(page - 1)} disabled={page <= 1}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="inline-flex items-center justify-center h-7 min-w-[28px] rounded-[4px] bg-primary text-primary-foreground text-[12px] font-semibold px-2">
                  {page}
                </span>
                <Button variant="outline" size="sm" onClick={() => onPageChange?.(page + 1)} disabled={page >= totalPages}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
