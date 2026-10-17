import {
  Castle,
  Check,
  Code,
  Cog,
  Compass,
  Feather,
  Flame,
  FlaskConical,
  Footprints,
  Gem,
  Key,
  Lightbulb,
  Lock,
  Mountain,
  Orbit,
  PencilRuler,
  Rocket,
  Ruler,
  Scroll,
  Shield,
  Snowflake,
  Sparkles,
  Star,
  Sun,
  Trophy,
  Waves,
  type LucideIcon,
} from 'lucide-react';
import type { AchievementIcon, ThemeId } from '../../types';

export const THEME_ICON: Record<ThemeId, LucideIcon> = {
  meadow: Lightbulb,
  architecture: PencilRuler,
  mechanics: Cog,
  citadel: Code,
  underwater: Waves,
  ice: FlaskConical,
  sky: Rocket,
  cosmos: Sparkles,
};

export const ACHIEVEMENT_ICON: Record<AchievementIcon, LucideIcon> = {
  footprints: Footprints,
  compass: Compass,
  ruler: Ruler,
  cog: Cog,
  castle: Castle,
  waves: Waves,
  snowflake: Snowflake,
  sun: Sun,
  orbit: Orbit,
  gem: Gem,
  shield: Shield,
  flame: Flame,
  scroll: Scroll,
  key: Key,
  star: Star,
  trophy: Trophy,
  feather: Feather,
  mountain: Mountain,
};

export function IslandBadgeIcon({ theme, state, size = 18 }: { theme: ThemeId; state: 'locked' | 'open' | 'complete'; size?: number }) {
  const I = state === 'complete' ? Check : state === 'locked' ? Lock : THEME_ICON[theme];
  return <I size={size} strokeWidth={2.2} aria-hidden />;
}
