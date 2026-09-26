import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import type { ColorValue } from 'react-native';

import type { Category } from '@/lib/api';

type SymbolName = Extract<SymbolViewProps['name'], object>;

const CATEGORY_ICONS: Record<Category, SymbolName> = {
  Cookware: { ios: 'frying.pan', android: 'skillet', web: 'skillet' },
  Bakeware: { ios: 'birthday.cake', android: 'cake', web: 'cake' },
  Cutlery: { ios: 'fork.knife', android: 'restaurant', web: 'restaurant' },
  'Prep Tools': { ios: 'scalemass', android: 'scale', web: 'scale' },
  Utensils: { ios: 'fork.knife.circle', android: 'flatware', web: 'flatware' },
  Appliances: { ios: 'microwave', android: 'microwave', web: 'microwave' },
  Storage: { ios: 'archivebox', android: 'kitchen', web: 'kitchen' },
  Serveware: { ios: 'cup.and.saucer', android: 'coffee', web: 'coffee' },
};

/** SF Symbols on iOS, Material Symbols on Android and web. */
const ICONS = {
  ...CATEGORY_ICONS,
  add: { ios: 'plus', android: 'add', web: 'add' },
  back: { ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' },
  close: { ios: 'xmark', android: 'close', web: 'close' },
  search: { ios: 'magnifyingglass', android: 'search', web: 'search' },
  edit: { ios: 'pencil', android: 'edit', web: 'edit' },
  trash: { ios: 'trash', android: 'delete', web: 'delete' },
  camera: { ios: 'camera', android: 'photo_camera', web: 'photo_camera' },
  photo: { ios: 'photo.on.rectangle', android: 'add_photo_alternate', web: 'add_photo_alternate' },
  music: { ios: 'music.note', android: 'music_note', web: 'music_note' },
  external: { ios: 'arrow.up.right', android: 'open_in_new', web: 'open_in_new' },
  warning: { ios: 'exclamationmark.triangle', android: 'warning', web: 'warning' },
  offline: { ios: 'wifi.slash', android: 'wifi_off', web: 'wifi_off' },
  refresh: { ios: 'arrow.clockwise', android: 'refresh', web: 'refresh' },
  minus: { ios: 'minus', android: 'remove', web: 'remove' },
  check: { ios: 'checkmark', android: 'check', web: 'check' },
  chevron: { ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' },
  calendar: { ios: 'calendar', android: 'calendar_today', web: 'calendar_today' },
  layers: { ios: 'square.stack.3d.up', android: 'layers', web: 'layers' },
  grid: { ios: 'square.grid.2x2', android: 'grid_view', web: 'grid_view' },
  key: { ios: 'key', android: 'key', web: 'key' },
} satisfies Record<string, SymbolName>;

export type IconName = keyof typeof ICONS;

type IconProps = {
  name: IconName;
  size?: number;
  color: ColorValue;
  weight?: SymbolViewProps['weight'];
};

export function Icon({ name, size = 20, color, weight }: IconProps) {
  return <SymbolView name={ICONS[name]} size={size} tintColor={color} weight={weight} />;
}
