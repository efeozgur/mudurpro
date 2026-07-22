import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface DonutSegment {
  name: string;
  value: number;
  color: string;
}

interface StatusDonutProps {
  segments: DonutSegment[];
  size?: number;
  thickness?: number;
}

export function StatusDonut({ segments, size = 80, thickness = 16 }: StatusDonutProps) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  // Show neutral empty state
  const data = total === 0 ? [{ name: 'Yok', value: 1, color: 'var(--color-muted)' }] : segments;
  const innerRadius = size / 2 - thickness;
  const outerRadius = size / 2 - 2;

  return (
    <div className="flex flex-col items-center">
      <div style={{ width: size, height: size }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%" cy="50%"
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              dataKey="value"
              stroke="none"
              startAngle={90}
              endAngle={-270}
            >
              {data.map((entry, idx) => (
                <Cell key={idx} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <span className="text-[11px] font-bold text-foreground">{total}</span>
    </div>
  );
}

/** Legend list to accompany a donut chart */
export function DonutLegend({ segments }: { segments: DonutSegment[] }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) {
    return <div className="text-[11px] text-muted-foreground">Kayıt bulunmuyor</div>;
  }
  return (
    <div className="space-y-1.5">
      {segments.filter(s => s.value > 0).map((seg) => (
        <div key={seg.name} className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: seg.color }} />
          <span className="text-[11px] text-muted-foreground flex-1">{seg.name}</span>
          <span className="text-[11px] font-semibold text-foreground">{seg.value}</span>
        </div>
      ))}
    </div>
  );
}

export function createSegment(name: string, value: number, color: string): DonutSegment {
  return { name, value, color };
}
