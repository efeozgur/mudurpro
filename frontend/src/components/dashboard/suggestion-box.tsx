import { Info } from 'lucide-react';

interface SuggestionBoxProps {
  message: string;
}

export function SuggestionBox({ message }: SuggestionBoxProps) {
  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
      <div className="flex items-start gap-3">
        <Info className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
        <p className="text-sm text-blue-700">{message}</p>
      </div>
    </div>
  );
}
