import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, IconButton } from '@/components/button';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Icon, type IconName } from '@/components/icon';
import { StateView } from '@/components/state-view';
import { ThemedText } from '@/components/themed-text';
import { UtensilImage } from '@/components/utensil-card';
import { Radius, Spacing } from '@/constants/theme';
import { useToast } from '@/context/toast-context';
import { useUtensils } from '@/context/utensils-context';
import { useTheme } from '@/hooks/use-theme';
import { getUtensil, type Utensil } from '@/lib/api';

const CONTENT_WIDTH = 720;

function goBack() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function UtensilDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const utensilId = Number(id);
  const { utensils, status } = useUtensils();
  const fromList = utensils.find((u) => u.id === utensilId);

  // Deep links (e.g. refreshing this page on web) may arrive before the item is in the list.
  const [fetched, setFetched] = useState<Utensil | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const deleting = useRef(false);

  useEffect(() => {
    if (fromList || status === 'loading' || deleting.current) return;
    getUtensil(utensilId)
      .then(setFetched)
      .catch((e: Error) => setLoadError(e.message));
  }, [fromList, status, utensilId]);

  const utensil = fromList ?? fetched;
  if (utensil) {
    return (
      <UtensilDetail
        utensil={utensil}
        onDeleting={() => {
          // Keep showing this record while navigating back, after it leaves the list.
          deleting.current = true;
          setFetched(utensil);
        }}
      />
    );
  }
  if (loadError) {
    return (
      <Centered>
        <StateView icon="warning" tone="danger" title="Utensil not found" message={loadError} actionLabel="Back to kitchen" onAction={goBack} />
      </Centered>
    );
  }
  return (
    <Centered>
      <ActivityIndicator size="large" />
    </Centered>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  return <View style={[styles.centered, { backgroundColor: theme.background }]}>{children}</View>;
}

function UtensilDetail({ utensil, onDeleting }: { utensil: Utensil; onDeleting: () => void }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { remove } = useUtensils();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const edit = () => router.push({ pathname: '/utensil/form', params: { id: utensil.id } });

  async function confirmDelete() {
    setDeleting(true);
    setDeleteError(null);
    onDeleting();
    try {
      await remove(utensil.id);
      setConfirmOpen(false);
      toast(`${utensil.name} deleted`, 'trash');
      goBack();
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : 'Could not delete this utensil.');
      setDeleting(false);
    }
  }

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 110 }} contentInsetAdjustmentBehavior="never">
        <View style={styles.column}>
          <View style={[styles.hero, { backgroundColor: theme.accentSoft }]}>
            <UtensilImage uri={utensil.image_url} category={utensil.category} iconSize={96} />
          </View>

          <View style={[styles.sheet, { backgroundColor: theme.background }]}>
            <View style={[styles.categoryPill, { backgroundColor: theme.accentSoft }]}>
              <Icon name={utensil.category} size={14} color={theme.accent} />
              <ThemedText type="smallBold" themeColor="accent">
                {utensil.category}
              </ThemedText>
            </View>
            <ThemedText type="display" style={styles.name}>
              {utensil.name}
            </ThemedText>

            <View style={styles.facts}>
              <Fact icon="layers" label="Quantity" value={`${utensil.quantity} ${utensil.quantity === 1 ? 'piece' : 'pieces'}`} />
              <Fact icon="Prep Tools" label="Material" value={utensil.material ?? 'Not specified'} muted={!utensil.material} />
              <Fact icon="calendar" label="Added" value={formatDate(utensil.created_at)} />
              <Fact icon="edit" label="Last updated" value={formatDate(utensil.updated_at)} />
            </View>

            <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              <ThemedText type="caption" themeColor="textSecondary">
                Notes
              </ThemedText>
              <ThemedText type="default" themeColor={utensil.description ? 'text' : 'textSecondary'}>
                {utensil.description ?? 'No notes yet. Tap Edit to add care tips, where it lives, or who gave it to you.'}
              </ThemedText>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.topBar, { top: insets.top + Spacing.two }]}>
        <IconButton icon="back" variant="glass" accessibilityLabel="Go back" onPress={goBack} />
        <IconButton icon="edit" variant="glass" accessibilityLabel="Edit utensil" onPress={edit} />
      </View>

      <View
        style={[
          styles.actionBar,
          { paddingBottom: insets.bottom + Spacing.three, backgroundColor: theme.background, borderColor: theme.border },
        ]}>
        <View style={styles.actions}>
          <Button label="Delete" icon="trash" variant="dangerSoft" size="lg" onPress={() => setConfirmOpen(true)} />
          <Button label="Edit utensil" icon="edit" size="lg" onPress={edit} style={styles.flex} />
        </View>
      </View>

      <ConfirmDialog
        visible={confirmOpen}
        destructive
        title={`Delete ${utensil.name}?`}
        message="This permanently removes it and its photo from your kitchen. This can't be undone."
        confirmLabel="Delete"
        busy={deleting}
        error={deleteError}
        onConfirm={confirmDelete}
        onCancel={() => {
          setConfirmOpen(false);
          setDeleteError(null);
        }}
      />
    </View>
  );
}

function Fact({ icon, label, value, muted }: { icon: IconName; label: string; value: string; muted?: boolean }) {
  const theme = useTheme();
  return (
    <View style={[styles.fact, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
      <Icon name={icon} size={18} color={theme.accent} />
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="label" themeColor={muted ? 'textSecondary' : 'text'} numberOfLines={2}>
        {value}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  column: {
    width: '100%',
    maxWidth: CONTENT_WIDTH,
    alignSelf: 'center',
  },
  hero: {
    width: '100%',
    aspectRatio: 1,
    maxHeight: 480,
    overflow: 'hidden',
  },
  sheet: {
    marginTop: -Radius.xl,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingHorizontal: 20,
    paddingTop: Spacing.four,
    gap: Spacing.three,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.pill,
  },
  name: {
    marginTop: -Spacing.one,
  },
  facts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  fact: {
    flexGrow: 1,
    flexBasis: '45%',
    padding: 14,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 2,
  },
  card: {
    padding: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.two,
  },
  topBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    maxWidth: CONTENT_WIDTH,
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    pointerEvents: 'box-none',
  },
  actionBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 12,
    paddingHorizontal: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    maxWidth: CONTENT_WIDTH - 40,
    alignSelf: 'center',
  },
});
