import {
  Activity, Award, BookOpen, Calendar, CalendarHeart, Cloud, Compass, Container, Crown, FileCode2, Flame,
  Footprints, Gauge, Gem, GitBranch, GitPullRequestArrow, GraduationCap, Landmark, Layers, Medal, Moon,
  Network, RefreshCcw, Rocket, RotateCcw, Settings2, ShieldCheck, ShipWheel, Sparkles, Star, Target,
  Terminal, Timer, TrendingUp, Workflow, Zap, type LucideIcon,
} from 'lucide-react';

const map: Record<string, LucideIcon> = {
  terminal: Terminal,
  git: GitBranch,
  network: Network,
  script: FileCode2,
  merge: GitPullRequestArrow,
  cloud: Cloud,
  ci: Workflow,
  container: Container,
  ansible: Settings2,
  shield: ShieldCheck,
  deploy: Rocket,
  k8s: ShipWheel,
  iac: Layers,
  observability: Activity,
  gitops: RefreshCcw,
  sre: Gauge,
  crown: Crown,
  foundation: Landmark,
  footprints: Footprints,
  compass: Compass,
  star: Star,
  book: BookOpen,
  graduation: GraduationCap,
  target: Target,
  gem: Gem,
  flame: Flame,
  zap: Zap,
  rotate: RotateCcw,
  timer: Timer,
  calendar: Calendar,
  'calendar-heart': CalendarHeart,
  moon: Moon,
  trending: TrendingUp,
  medal: Medal,
  sparkles: Sparkles,
};

export function Icon({ name, size = 24, className, strokeWidth = 2 }: { name: string; size?: number; className?: string; strokeWidth?: number }) {
  const C = map[name] ?? Award;
  return <C size={size} className={className} strokeWidth={strokeWidth} aria-hidden />;
}
