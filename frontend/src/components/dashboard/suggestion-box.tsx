import { Info } from 'lucide-react';

interface SuggestionBoxProps {
  message: string;
}

export function SuggestionBox({ message }: SuggestionBoxProps) {
  return (
    <div className="rounded-[6px] border border-border bg-gradient-to-r from-blue-50 to-gold/5 p-3.5">
      <div className="flex items-start gap-3">
        <Info className="h-4 w-4 text-info mt-0.5 shrink-0" />
        <p className="text-[12px] text-foreground/80">{message}</p>
      </div>
    </div>
  );
}
