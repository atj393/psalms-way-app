/**
 * Material Design 3 — Primitive Component Library
 * Sage green tonal palette · Roboto type scale · MD3 shape tokens
 */
import React from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import {getShadowStyle, useTheme, ripple, shape, spacing} from '../theme';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function rippleColor(color: string) {
  return {color, borderless: false};
}

type PressStyle = StyleProp<ViewStyle> | ((state: {pressed: boolean}) => StyleProp<ViewStyle>);

// ─── M3Pressable ─────────────────────────────────────────────────────────────
// Base pressable: android ripple + iOS opacity fallback

type M3PressableProps = PressableProps & {
  rippleColor_?: string;
  style?: PressStyle;
  children: React.ReactNode;
};

export function M3Pressable({
  rippleColor_,
  style,
  children,
  ...rest
}: M3PressableProps) {
  const {isDark} = useTheme();
  const rc = rippleColor_ ?? (isDark ? ripple.onDarkSurface : ripple.onSurface);

  return (
    <Pressable
      android_ripple={rippleColor(rc)}
      style={({pressed}) => {
        const base = typeof style === 'function' ? style({pressed}) : style;
        return [base, Platform.OS === 'ios' && pressed ? {opacity: 0.7} : null];
      }}
      {...rest}>
      {children}
    </Pressable>
  );
}

// ─── M3FilledButton ──────────────────────────────────────────────────────────

type ButtonProps = {
  label: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  disabled?: boolean;
};

export function M3FilledButton({label, onPress, style, textStyle, disabled}: ButtonProps) {
  const {colors, type} = useTheme();
  return (
    <M3Pressable
      onPress={onPress}
      disabled={disabled}
      rippleColor_={ripple.onPrimary}
      style={[
        btn.base,
        {backgroundColor: disabled ? colors.surfaceVariant : colors.primary},
        style,
      ]}>
      <Text
        style={[
          type.labelLarge,
          btn.label,
          {color: disabled ? colors.onSurfaceVariant : colors.onPrimary},
          textStyle,
        ]}>
        {label}
      </Text>
    </M3Pressable>
  );
}

// ─── M3TonalButton ───────────────────────────────────────────────────────────

export function M3TonalButton({label, onPress, style, textStyle, disabled}: ButtonProps) {
  const {colors, type} = useTheme();
  return (
    <M3Pressable
      onPress={onPress}
      disabled={disabled}
      rippleColor_={ripple.onSurface}
      style={[
        btn.base,
        {backgroundColor: disabled ? colors.surfaceVariant : colors.secondaryContainer},
        style,
      ]}>
      <Text
        style={[
          type.labelLarge,
          btn.label,
          {color: disabled ? colors.onSurfaceVariant : colors.onSecondaryContainer},
          textStyle,
        ]}>
        {label}
      </Text>
    </M3Pressable>
  );
}

// ─── M3OutlinedButton ────────────────────────────────────────────────────────

export function M3OutlinedButton({label, onPress, style, textStyle, disabled}: ButtonProps) {
  const {colors, type} = useTheme();
  return (
    <M3Pressable
      onPress={onPress}
      disabled={disabled}
      rippleColor_={isDarkRipple(colors.primary)}
      style={[
        btn.base,
        {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: disabled ? colors.outlineVariant : colors.outline,
        },
        style,
      ]}>
      <Text
        style={[
          type.labelLarge,
          btn.label,
          {color: disabled ? colors.onSurfaceVariant : colors.primary},
          textStyle,
        ]}>
        {label}
      </Text>
    </M3Pressable>
  );
}

// helper — transparent ripple tinted to primary
function isDarkRipple(_color: string) {
  return ripple.onSurface;
}

// ─── M3TextButton ─────────────────────────────────────────────────────────────

export function M3TextButton({label, onPress, style, textStyle, disabled}: ButtonProps) {
  const {colors, type} = useTheme();
  return (
    <M3Pressable
      onPress={onPress}
      disabled={disabled}
      style={[btn.textBase, style]}>
      <Text
        style={[
          type.labelLarge,
          {color: disabled ? colors.onSurfaceVariant : colors.primary},
          textStyle,
        ]}>
        {label}
      </Text>
    </M3Pressable>
  );
}

const btn = StyleSheet.create({
  base: {
    height: 40,
    borderRadius: shape.full,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  label: {
    // fontFamily + weight come from type.labelLarge
  },
  textBase: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: shape.full,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// ─── M3IconButton ─────────────────────────────────────────────────────────────

type IconButtonProps = {
  children: React.ReactNode;
  onPress: () => void;
  accessibilityLabel?: string;
  selected?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function M3IconButton({children, onPress, accessibilityLabel, style}: IconButtonProps) {
  const {isDark} = useTheme();
  const rc = isDark ? ripple.onDarkSurface : ripple.onSurface;
  return (
    <M3Pressable
      onPress={onPress}
      rippleColor_={rc}
      accessibilityLabel={accessibilityLabel}
      style={[ib.base, style]}>
      {children}
    </M3Pressable>
  );
}

// ─── M3FilledIconButton ───────────────────────────────────────────────────────

export function M3FilledIconButton({children, onPress, accessibilityLabel, selected, style}: IconButtonProps) {
  const {colors} = useTheme();
  return (
    <M3Pressable
      onPress={onPress}
      rippleColor_={ripple.onPrimary}
      accessibilityLabel={accessibilityLabel}
      style={[
        ib.base,
        {backgroundColor: selected ? colors.primary : colors.primaryContainer},
        style,
      ]}>
      {children}
    </M3Pressable>
  );
}

const ib = StyleSheet.create({
  base: {
    width: 40,
    height: 40,
    borderRadius: shape.full,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});

// ─── M3Card ──────────────────────────────────────────────────────────────────

type CardVariant = 'elevated' | 'filled' | 'outlined';

type CardProps = {
  variant?: CardVariant;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
};

export function M3Card({variant = 'elevated', children, style, onPress}: CardProps) {
  const {colors, isDark} = useTheme();

  const bg =
    variant === 'filled'
      ? colors.surfaceVariant
      : colors.surface;

  const elev =
    variant === 'elevated' ? (isDark ? 1 : 2) : 0;

  const border =
    variant === 'outlined'
      ? {borderWidth: 1, borderColor: colors.outlineVariant}
      : {};

  const inner = (
    <View
      style={[
        card.base,
        {backgroundColor: bg, ...getShadowStyle(elev)},
        border,
        style,
      ]}>
      {children}
    </View>
  );

  if (onPress) {
    return (
      <M3Pressable
        onPress={onPress}
        style={[card.base, {backgroundColor: bg, ...getShadowStyle(elev)}, border, style]}>
        {children}
      </M3Pressable>
    );
  }

  return inner;
}

const card = StyleSheet.create({
  base: {
    borderRadius: shape.large,
    overflow: 'hidden',
  },
});

// ─── M3Divider ───────────────────────────────────────────────────────────────

export function M3Divider({style}: {style?: StyleProp<ViewStyle>}) {
  const {colors} = useTheme();
  return (
    <View
      style={[{height: StyleSheet.hairlineWidth, backgroundColor: colors.outlineVariant}, style]}
    />
  );
}

// ─── M3ListItem ───────────────────────────────────────────────────────────────

type ListItemProps = {
  headline: string;
  supporting?: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

export function M3ListItem({
  headline,
  supporting,
  leading,
  trailing,
  onPress,
  style,
}: ListItemProps) {
  const {colors, type} = useTheme();

  const content = (
    <View style={[li.container, style]}>
      {leading ? <View style={li.leading}>{leading}</View> : null}
      <View style={li.body}>
        <Text style={[type.bodyLarge, {color: colors.onSurface}]}>{headline}</Text>
        {supporting ? (
          <Text style={[type.bodySmall, {color: colors.onSurfaceVariant}]}>{supporting}</Text>
        ) : null}
      </View>
      {trailing ? <View style={li.trailing}>{trailing}</View> : null}
    </View>
  );

  if (onPress) {
    return (
      <M3Pressable onPress={onPress} style={style}>
        <View style={li.container}>{content}</View>
      </M3Pressable>
    );
  }
  return content;
}

const li = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    gap: spacing.md,
  },
  leading: {width: 24, alignItems: 'center'},
  body: {flex: 1, gap: 2},
  trailing: {alignItems: 'flex-end'},
});

// ─── M3Chip ───────────────────────────────────────────────────────────────────

type ChipType = 'assist' | 'filter' | 'input';

type ChipProps = {
  label: string;
  type?: ChipType;
  selected?: boolean;
  leading?: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

export function M3Chip({label, type: chipType = 'assist', selected = false, leading, onPress, style}: ChipProps) {
  const {colors, type} = useTheme();

  const bg = selected ? colors.secondaryContainer : 'transparent';
  const textColor = selected ? colors.onSecondaryContainer : colors.onSurfaceVariant;
  const borderColor = selected ? colors.secondaryContainer : colors.outlineVariant;

  return (
    <M3Pressable
      onPress={onPress}
      style={[
        chip.base,
        {backgroundColor: bg, borderColor},
        style,
      ]}>
      {leading ? <View>{leading}</View> : null}
      <Text style={[type.labelLarge, {color: textColor}]}>{label}</Text>
    </M3Pressable>
  );
}

const chip = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 32,
    borderRadius: shape.small,
    borderWidth: 1,
    paddingHorizontal: spacing.sm + 4,
    gap: spacing.xs,
    overflow: 'hidden',
  },
});

// ─── M3SegmentedButton ────────────────────────────────────────────────────────

type SegOption<T extends string = string> = {
  label: string;
  value: T;
  a11y?: string;
};

type SegmentedButtonProps<T extends string = string> = {
  options: SegOption<T>[];
  value: T;
  onChange: (v: T) => void;
  style?: StyleProp<ViewStyle>;
};

export function M3SegmentedButton<T extends string = string>({
  options,
  value,
  onChange,
  style,
}: SegmentedButtonProps<T>) {
  const {colors, type} = useTheme();

  return (
    <View style={[seg.container, {borderColor: colors.outline}, style]}>
      {options.map((opt, idx) => {
        const isActive = value === opt.value;
        const isFirst = idx === 0;
        const isLast = idx === options.length - 1;
        return (
          <M3Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            rippleColor_={isActive ? ripple.onPrimary : ripple.onSurface}
            accessibilityLabel={opt.a11y ?? opt.label}
            style={[
              seg.btn,
              {
                backgroundColor: isActive ? colors.secondaryContainer : 'transparent',
                borderLeftWidth: isFirst ? 0 : StyleSheet.hairlineWidth,
                borderLeftColor: colors.outlineVariant,
                borderTopLeftRadius: isFirst ? shape.full : 0,
                borderBottomLeftRadius: isFirst ? shape.full : 0,
                borderTopRightRadius: isLast ? shape.full : 0,
                borderBottomRightRadius: isLast ? shape.full : 0,
              },
            ]}>
            <Text
              style={[
                type.labelLarge,
                {color: isActive ? colors.onSecondaryContainer : colors.onSurfaceVariant},
              ]}>
              {opt.label}
            </Text>
          </M3Pressable>
        );
      })}
    </View>
  );
}

const seg = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 40,
    borderWidth: 1,
    borderRadius: shape.full,
    overflow: 'hidden',
  },
  btn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});

// ─── M3TopAppBar ─────────────────────────────────────────────────────────────

type TopAppBarProps = {
  title: string;
  subtitle?: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode[];
  style?: StyleProp<ViewStyle>;
};

export function M3TopAppBar({title, subtitle, leading, trailing, style}: TopAppBarProps) {
  const {colors, type, isDark} = useTheme();

  return (
    <View
      style={[
        tab_bar.container,
        {
          backgroundColor: colors.surface,
          ...getShadowStyle(isDark ? 1 : 2),
        },
        style,
      ]}>
      {leading ? <View style={tab_bar.leading}>{leading}</View> : null}
      <View style={tab_bar.titleGroup}>
        <Text style={[type.titleLarge, {color: colors.onSurface}]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[type.labelLarge, {color: colors.primary, letterSpacing: 0.1}]} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing && trailing.length > 0 ? (
        <View style={tab_bar.trailing}>
          {trailing.map((t, i) => (
            <View key={i}>{t}</View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const tab_bar = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    gap: spacing.xs,
    minHeight: 64,
  },
  leading: {marginRight: spacing.xs},
  titleGroup: {flex: 1, gap: 1, paddingHorizontal: spacing.xs},
  trailing: {flexDirection: 'row', alignItems: 'center'},
});

// ─── M3TabBar ────────────────────────────────────────────────────────────────

type TabDef = {id: string; label: string};

type TabBarProps = {
  tabs: TabDef[];
  activeTab: string;
  onTabChange: (id: string) => void;
};

export function M3TabBar({tabs, activeTab, onTabChange}: TabBarProps) {
  const {colors, type} = useTheme();

  return (
    <View style={[tb.container, {borderBottomColor: colors.outlineVariant}]}>
      {tabs.map(tab => {
        const isActive = activeTab === tab.id;
        return (
          <M3Pressable
            key={tab.id}
            onPress={() => onTabChange(tab.id)}
            style={tb.tab}>
            <Text
              style={[
                type.labelLarge,
                {
                  color: isActive ? colors.primary : colors.onSurfaceVariant,
                },
              ]}>
              {tab.label}
            </Text>
            <View
              style={[
                tb.indicator,
                {
                  backgroundColor: isActive ? colors.primary : 'transparent',
                  borderRadius: shape.extraSmall,
                },
              ]}
            />
          </M3Pressable>
        );
      })}
    </View>
  );
}

const tb = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm + 4,
    gap: 4,
    overflow: 'hidden',
  },
  indicator: {
    height: 3,
    width: '60%',
  },
});
