import { AlertTriangle, Info, Clock } from 'lucide-react';

interface SuggestionBoxProps {
  messages: string[];
}

const PRIORITY_PATTERNS: Array<{ test: (m: string) => boolean; icon: typeof AlertTriangle; color: string; bg: string }> = [
  { test: (m) => m.includes('kritik') || m.includes('Süre Doldu'), icon: AlertTriangle, color: 'text-critical-text', bg: 'bg-critical-bg' },
  { test: (m) => m.includes('geçti') || m.includes('iade'), icon: Clock, color: 'text-gold-dark', bg: 'bg-warning-bg' },
  { test: () => true, icon: Info, color: 'text-info', bg: 'bg-normal-bg' },
];

function getPriority(msg: string) {
  return PRIORITY_PATTERNS.find(p => p.test(msg))!;
}

export function SuggestionBox({ messages }: SuggestionBoxProps) {
  if (!messages.length) return null;

  return (
    <div className="rounded-lg border border-border bg-gradient-to-r from-blue-50/50 to-gold/5 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
        Dikkat Gerektiren Konular
      </p>
      <ul className="space-y-1.5">
        {messages.map((msg, i) => {
          const p = getPriority(msg);
          const Icon = p.icon;
          return (
            <li key={i} className="flex items-start gap-2.5">
              <span className={`flex h-5 w-5 items-center justify-center rounded-full ${p.bg} shrink-0 mt-0.5`}>
                <Icon className={`h-3 w-3 ${p.color}`} />
              </span>
              <span className="text-[12px] text-foreground/75 leading-relaxed">{msg}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
