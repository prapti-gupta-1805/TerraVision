export interface Metric {
  label: string;
  value: string;
  trend?: string;
  trendDirection?: 'up' | 'down';
  trendType?: 'positive' | 'negative';
  icon: string;
  iconColorClass?: string;
  bgColorClass?: string;
}

export interface Layer {
  id: string;
  name: string;
  icon: string;
  active: boolean;
  colorClass: string;
  bgClass: string;
  isAi?: boolean;
}

export interface Project {
  id: string;
  name: string;
  phase: string;
  description: string;
  thumbnail: string;
  metrics: Metric[];
}