import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  Home,
  Search,
  Sparkles,
  Music,
  Mic,
  User,
  Settings,
  Heart,
  Share,
  Camera,
  MapPin,
  Calendar,
  Clock,
  Star,
  Play,
  Pause,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  X,
  Check,
  Plus,
  Minus,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Mail,
  Bell,
  TrendingUp,
  Users,
  MessageCircle,
  ThumbsUp,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  LogOut,
  Send,
  type LucideIcon,
} from 'lucide-react-native';
import { theme } from '../../types/theme';

export type IconName =
  | 'home'
  | 'search'
  | 'explore'
  | 'feed'
  | 'music'
  | 'mic'
  | 'user'
  | 'settings'
  | 'heart'
  | 'share'
  | 'camera'
  | 'map-pin'
  | 'calendar'
  | 'clock'
  | 'star'
  | 'play'
  | 'pause'
  | 'volume'
  | 'volume-off'
  | 'chevron-left'
  | 'chevron-right'
  | 'chevron-down'
  | 'chevron-up'
  | 'x'
  | 'check'
  | 'plus'
  | 'minus'
  | 'eye'
  | 'eye-off'
  | 'lock'
  | 'unlock'
  | 'mail'
  | 'bell'
  | 'trending-up'
  | 'users'
  | 'message-circle'
  | 'thumbs-up'
  | 'filter'
  | 'more-vertical'
  | 'edit'
  | 'trash'
  | 'log-out'
  | 'send';

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type IconColor = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'text' | 'textSecondary' | 'textTertiary';

interface IconProps {
  name: IconName;
  size?: IconSize;
  color?: IconColor;
  style?: any;
}

const getIconComponent = (name: IconName): LucideIcon => {
  const iconMap: Record<IconName, LucideIcon> = {
    home: Home,
    search: Search,
    explore: Search,
    feed: Sparkles,
    music: Music,
    mic: Mic,
    user: User,
    settings: Settings,
    heart: Heart,
    share: Share,
    camera: Camera,
    'map-pin': MapPin,
    calendar: Calendar,
    clock: Clock,
    star: Star,
    play: Play,
    pause: Pause,
    volume: Volume2,
    'volume-off': VolumeX,
    'chevron-left': ChevronLeft,
    'chevron-right': ChevronRight,
    'chevron-down': ChevronDown,
    'chevron-up': ChevronUp,
    x: X,
    check: Check,
    plus: Plus,
    minus: Minus,
    eye: Eye,
    'eye-off': EyeOff,
    lock: Lock,
    unlock: Unlock,
    mail: Mail,
    bell: Bell,
    'trending-up': TrendingUp,
    users: Users,
    'message-circle': MessageCircle,
    'thumbs-up': ThumbsUp,
    filter: Filter,
    'more-vertical': MoreVertical,
    edit: Edit,
    trash: Trash2,
    'log-out': LogOut,
    'send': Send,
  };

  return iconMap[name] || Home;
};

const getIconSize = (size: IconSize): number => {
  switch (size) {
    case 'xs':
      return theme.typography.fontSize.xs;
    case 'sm':
      return theme.typography.fontSize.sm;
    case 'lg':
      return theme.typography.fontSize.lg;
    case 'xl':
      return theme.typography.fontSize.xxl;
    case 'md':
    default:
      return theme.typography.fontSize.md;
  }
};

const getIconColor = (color: IconColor): string => {
  switch (color) {
    case 'primary':
      return theme.colors.primary;
    case 'secondary':
      return theme.colors.secondary;
    case 'success':
      return theme.colors.success;
    case 'warning':
      return theme.colors.warning;
    case 'error':
      return theme.colors.error;
    case 'info':
      return theme.colors.info;
    case 'textSecondary':
      return theme.colors.textSecondary;
    case 'textTertiary':
      return theme.colors.textTertiary;
    case 'text':
    default:
      return theme.colors.text;
  }
};

export const Icon: React.FC<IconProps> = ({
  name,
  size = 'md',
  color = 'text',
  style,
}) => {
  const IconComponent = getIconComponent(name);
  const iconSize = getIconSize(size);
  const iconColor = getIconColor(color);

  return (
    <IconComponent
      size={iconSize}
      color={iconColor}
      style={style}
    />
  );
};

// Convenience components for common icons
export const HomeIcon: React.FC<Omit<IconProps, 'name'>> = (props) => (
  <Icon name="home" {...props} />
);

export const SearchIcon: React.FC<Omit<IconProps, 'name'>> = (props) => (
  <Icon name="search" {...props} />
);

export const MusicIcon: React.FC<Omit<IconProps, 'name'>> = (props) => (
  <Icon name="music" {...props} />
);

export const UserIcon: React.FC<Omit<IconProps, 'name'>> = (props) => (
  <Icon name="user" {...props} />
);

export const HeartIcon: React.FC<Omit<IconProps, 'name'>> = (props) => (
  <Icon name="heart" {...props} />
);

export const StarIcon: React.FC<Omit<IconProps, 'name'>> = (props) => (
  <Icon name="star" {...props} />
);

export const MailIcon: React.FC<Omit<IconProps, 'name'>> = (props) => (
  <Icon name="mail" {...props} />
);

export const LockIcon: React.FC<Omit<IconProps, 'name'>> = (props) => (
  <Icon name="lock" {...props} />
);

export const BellIcon: React.FC<Omit<IconProps, 'name'>> = (props) => (
  <Icon name="bell" {...props} />
);

export const MessageSquareIcon: React.FC<Omit<IconProps, 'name'>> = (props) => (
  <Icon name="message-circle" {...props} />
);

export const ClockIcon: React.FC<Omit<IconProps, 'name'>> = (props) => (
  <Icon name="clock" {...props} />
);

export const ChevronRightIcon: React.FC<Omit<IconProps, 'name'>> = (props) => (
  <Icon name="chevron-right" {...props} />
);

export const TrendingUpIcon: React.FC<Omit<IconProps, 'name'>> = (props) => (
  <Icon name="trending-up" {...props} />
);

export const UsersIcon: React.FC<Omit<IconProps, 'name'>> = (props) => (
  <Icon name="users" {...props} />
);

export const ChevronUpIcon: React.FC<Omit<IconProps, 'name'>> = (props) => (
  <Icon name="chevron-up" {...props} />
);

export const ChevronDownIcon: React.FC<Omit<IconProps, 'name'>> = (props) => (
  <Icon name="chevron-down" {...props} />
);

export const XIcon: React.FC<Omit<IconProps, 'name'>> = (props) => (
  <Icon name="x" {...props} />
);

export const MapPinIcon: React.FC<Omit<IconProps, 'name'>> = (props) => (
  <Icon name="map-pin" {...props} />
);

export const CalendarIcon: React.FC<Omit<IconProps, 'name'>> = (props) => (
  <Icon name="calendar" {...props} />
);

export const PlusIcon: React.FC<Omit<IconProps, 'name'>> = (props) => (
  <Icon name="plus" {...props} />
);

export const SendIcon: React.FC<Omit<IconProps, 'name'>> = (props) => (
  <Icon name="send" {...props} />
);
