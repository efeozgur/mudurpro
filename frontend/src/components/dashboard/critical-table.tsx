import { useNavigate } from 'react-router-dom';
import { StatusBadge } from '@/components/shared/status-badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AlertTriangle } from 'lucide-react';

interface CriticalItem {
  id: string;
  caseId: string;
  esasNo: string;
  title?: string;
  remainingDays?: number;
}

interface CriticalTableProps {
  items: CriticalItem[];
  title: string;
}

export function CriticalTable({ items, title }: CriticalTableProps) {
  const navigate = useNavigate();

  if (!items || items.length === 0) return null;

  return (
    <div className="rounded-lg border">
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <AlertTriangle className="h-4 w-4 text-red-500" />
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Esas No</TableHead>
            <TableHead>Durum</TableHead>
            <TableHead className="text-right">Kalan Gün</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.slice(0, 5).map((item) => (
            <TableRow
              key={item.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => navigate(`/cases/${item.caseId}`)}
            >
              <TableCell className="font-medium">{item.esasNo}</TableCell>
              <TableCell>
                {item.remainingDays != null && item.remainingDays <= 0 ? (
                  <StatusBadge status="CRITICAL" />
                ) : item.remainingDays != null && item.remainingDays <= 7 ? (
                  <StatusBadge status="YAKLASIYOR" />
                ) : (
                  <StatusBadge status="TAKIP" />
                )}
              </TableCell>
              <TableCell className="text-right">
                {item.remainingDays != null ? (
                  <span className={item.remainingDays <= 0 ? 'text-red-600 font-bold' : item.remainingDays <= 7 ? 'text-amber-600' : ''}>
                    {item.remainingDays <= 0 ? 'Gecikti' : `${item.remainingDays} gün`}
                  </span>
                ) : (
                  '-'
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
