import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, IconButton } from '@/components/button';
import { Chip } from '@/components/chip';
import { Icon } from '@/components/icon';
import { StateView } from '@/components/state-view';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { Fonts, NoOutline, Radius, Spacing } from '@/constants/theme';
import { useToast } from '@/context/toast-context';
import { useUtensils } from '@/context/utensils-context';
import { useTheme } from '@/hooks/use-theme';
import {
  ApiError,
  CATEGORIES,
  getUtensil,
  type Category,
  type FieldErrors,
  type ImageChange,
  type Utensil,
} from '@/lib/api';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const CONTENT_WIDTH = 640;

type Values = {
  name: string;
  category: Category | null;
  material: string;
  quantity: string;
  description: string;
};

type Photo = { kind: 'none' } | { kind: 'existing'; uri: string } | { kind: 'new'; asset: ImagePicker.ImagePickerAsset };

function close() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

/** Client-side rules mirror the API's validation in api/index.php. */
function validate(v: Values): FieldErrors {
  const errors: FieldErrors = {};
  const name = v.name.trim();
  if (!name) errors.name = 'Give your utensil a name.';
  else if (name.length < 2 || name.length > 80) errors.name = 'Name must be 2–80 characters.';
  if (!v.category) errors.category = 'Pick a category.';
  if (v.material.trim().length > 60) errors.material = 'Keep material under 60 characters.';
  const qty = Number(v.quantity);
  if (!/^\d+$/.test(v.quantity) || qty < 1 || qty > 999) errors.quantity = 'Enter a whole number from 1 to 999.';
  if (v.description.trim().length > 500) errors.description = 'Notes must be at most 500 characters.';
  return errors;
}

export default function UtensilFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editingId = id ? Number(id) : null;
  const { utensils, status } = useUtensils();
  const fromList = editingId ? utensils.find((u) => u.id === editingId) : undefined;
  const [fetched, setFetched] = useState<Utensil | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!editingId || fromList || status === 'loading') return;
    getUtensil(editingId)
      .then(setFetched)
      .catch((e: Error) => setLoadError(e.message));
  }, [editingId, fromList, status]);

  if (!editingId) {
    return <UtensilForm />;
  }
  const existing = fromList ?? fetched;
  if (existing) {
    return <UtensilForm key={existing.id} existing={existing} />;
  }
  return (
    <FormShell title="Edit utensil">
      {loadError ? (
        <StateView icon="warning" tone="danger" title="Couldn't load this utensil" message={loadError} actionLabel="Close" onAction={close} />
      ) : (
        <ActivityIndicator size="large" style={{ marginTop: Spacing.six }} />
      )}
    </FormShell>
  );
}

function FormShell({ title, children, footer }: { title: string; children: React.ReactNode; footer?: React.ReactNode }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const topPadding = Platform.OS === 'ios' ? Spacing.three : insets.top + Spacing.two;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.flex, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { paddingTop: topPadding, borderColor: theme.border }]}>
        <View style={styles.headerInner}>
          <IconButton icon="close" size={40} accessibilityLabel="Close" onPress={close} />
          <ThemedText type="subtitle">{title}</ThemedText>
          <View style={{ width: 40 }} />
        </View>
      </View>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>
        <View style={styles.column}>{children}</View>
      </ScrollView>
      {footer && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.three, borderColor: theme.border }]}>
          <View style={styles.column}>{footer}</View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

function UtensilForm({ existing }: { existing?: Utensil }) {
  const theme = useTheme();
  const toast = useToast();
  const { create, update } = useUtensils();

  const [values, setValues] = useState<Values>({
    name: existing?.name ?? '',
    category: existing?.category ?? null,
    material: existing?.material ?? '',
    quantity: String(existing?.quantity ?? 1),
    description: existing?.description ?? '',
  });
  const [photo, setPhoto] = useState<Photo>(existing?.image_url ? { kind: 'existing', uri: existing.image_url } : { kind: 'none' });
  const [touched, setTouched] = useState<Partial<Record<keyof Values, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [serverErrors, setServerErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const clientErrors = validate(values);
  const errorFor = (field: keyof Values) =>
    ((submitted || touched[field]) && clientErrors[field]) || serverErrors[field] || undefined;

  function set<K extends keyof Values>(field: K, value: Values[K]) {
    setValues((v) => ({ ...v, [field]: value }));
    setServerErrors(({ [field]: _removed, ...rest }) => rest);
  }
  const blur = (field: keyof Values) => () => setTouched((t) => ({ ...t, [field]: true }));

  function stepQuantity(delta: number) {
    const current = Number(values.quantity) || 0;
    set('quantity', String(Math.min(999, Math.max(1, current + delta))));
  }

  async function pickPhoto(source: 'library' | 'camera') {
    setFormError(null);
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.7 };
    if (source === 'camera') {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setFormError('Camera access is needed to take a photo. You can enable it in Settings.');
        return;
      }
    }
    const result = source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
    if (result.canceled) return;

    const asset = result.assets[0];
    if (asset.fileSize && asset.fileSize > MAX_IMAGE_BYTES) {
      setServerErrors((e) => ({ ...e, image: 'That photo is larger than 5 MB. Please choose a smaller one.' }));
      return;
    }
    setServerErrors(({ image: _removed, ...rest }) => rest);
    setPhoto({ kind: 'new', asset });
  }

  async function submit() {
    setSubmitted(true);
    setFormError(null);
    if (Object.keys(clientErrors).length > 0 || !values.category) {
      setFormError('Please fix the highlighted fields.');
      return;
    }

    const input = {
      name: values.name.trim(),
      category: values.category,
      material: values.material.trim(),
      quantity: Number(values.quantity),
      description: values.description.trim(),
    };
    let image: ImageChange = { type: 'keep' };
    if (photo.kind === 'new') image = { type: 'upload', asset: photo.asset };
    else if (photo.kind === 'none' && existing?.image_url) image = { type: 'remove' };

    setSaving(true);
    try {
      if (existing) {
        await update(existing.id, input, image);
        toast('Changes saved');
      } else {
        await create(input, image);
        toast(`${input.name} added to your kitchen`);
      }
      close();
    } catch (e) {
      if (e instanceof ApiError) {
        setServerErrors(e.fieldErrors);
        setFormError(e.message);
      } else {
        setFormError('Something went wrong. Please try again.');
      }
      setSaving(false);
    }
  }

  const photoUri = photo.kind === 'new' ? photo.asset.uri : photo.kind === 'existing' ? photo.uri : null;
  const canUseCamera = Platform.OS !== 'web';

  return (
    <FormShell
      title={existing ? 'Edit utensil' : 'New utensil'}
      footer={
        <View style={styles.footerContent}>
          {formError && (
            <View style={[styles.formError, { backgroundColor: theme.dangerSoft }]}>
              <Icon name="warning" size={16} color={theme.danger} />
              <ThemedText type="small" themeColor="danger" style={styles.flex}>
                {formError}
              </ThemedText>
            </View>
          )}
          <Button
            label={existing ? 'Save changes' : 'Add to kitchen'}
            icon={existing ? 'check' : 'add'}
            size="lg"
            loading={saving}
            onPress={submit}
          />
        </View>
      }>
      {/* Photo */}
      <View style={styles.field}>
        <ThemedText type="smallBold">Photo</ThemedText>
        {photoUri ? (
          <View style={[styles.photo, { backgroundColor: theme.backgroundSelected }]}>
            <Image source={{ uri: photoUri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
            <View style={styles.photoActions}>
              {canUseCamera && <IconButton icon="camera" variant="glass" size={42} accessibilityLabel="Take a new photo" onPress={() => pickPhoto('camera')} />}
              <IconButton icon="photo" variant="glass" size={42} accessibilityLabel="Choose a different photo" onPress={() => pickPhoto('library')} />
              <IconButton icon="trash" variant="glass" size={42} accessibilityLabel="Remove photo" onPress={() => setPhoto({ kind: 'none' })} />
            </View>
          </View>
        ) : (
          <View style={[styles.photo, styles.dropzone, { borderColor: serverErrors.image ? theme.danger : theme.border, backgroundColor: theme.backgroundElement }]}>
            <View style={[styles.dropIcon, { backgroundColor: theme.tintSoft }]}>
              <Icon name="photo" size={28} color={theme.tint} />
            </View>
            <ThemedText type="label">Show off your utensil</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
              JPG, PNG or WebP · up to 5 MB
            </ThemedText>
            <View style={styles.photoButtons}>
              <Button label="Choose photo" icon="photo" variant="secondary" onPress={() => pickPhoto('library')} />
              {canUseCamera && <Button label="Camera" icon="camera" variant="secondary" onPress={() => pickPhoto('camera')} />}
            </View>
          </View>
        )}
        {serverErrors.image && (
          <ThemedText type="small" themeColor="danger">
            {serverErrors.image}
          </ThemedText>
        )}
      </View>

      <TextField
        label="Name"
        required
        value={values.name}
        onChangeText={(t) => set('name', t)}
        onBlur={blur('name')}
        placeholder="e.g. Cast Iron Skillet"
        maxLength={80}
        autoCapitalize="words"
        returnKeyType="next"
        error={errorFor('name')}
      />

      <View style={styles.field}>
        <ThemedText type="smallBold">
          Category<ThemedText type="smallBold" themeColor="tint"> *</ThemedText>
        </ThemedText>
        <View style={styles.categoryGrid}>
          {CATEGORIES.map((c) => (
            <Chip key={c} label={c} icon={c} selected={values.category === c} onPress={() => set('category', c)} />
          ))}
        </View>
        <ThemedText type="small" themeColor="danger" style={styles.inlineError}>
          {errorFor('category') ?? ''}
        </ThemedText>
      </View>

      <TextField
        label="Material"
        value={values.material}
        onChangeText={(t) => set('material', t)}
        onBlur={blur('material')}
        placeholder="e.g. Stainless steel, bamboo, silicone"
        maxLength={60}
        error={errorFor('material')}
      />

      <View style={styles.field}>
        <ThemedText type="smallBold">Quantity</ThemedText>
        <View style={styles.stepper}>
          <IconButton icon="minus" accessibilityLabel="Decrease quantity" onPress={() => stepQuantity(-1)} />
          <TextInput
            value={values.quantity}
            onChangeText={(t) => set('quantity', t.replace(/[^0-9]/g, ''))}
            onBlur={blur('quantity')}
            keyboardType="number-pad"
            maxLength={3}
            accessibilityLabel="Quantity"
            style={[
              styles.stepperInput,
              NoOutline,
              { color: theme.text, backgroundColor: theme.backgroundElement, borderColor: errorFor('quantity') ? theme.danger : theme.border },
            ]}
          />
          <IconButton icon="add" accessibilityLabel="Increase quantity" onPress={() => stepQuantity(1)} />
        </View>
        <ThemedText type="small" themeColor="danger" style={styles.inlineError}>
          {errorFor('quantity') ?? ''}
        </ThemedText>
      </View>

      <TextField
        label="Notes"
        value={values.description}
        onChangeText={(t) => set('description', t)}
        onBlur={blur('description')}
        placeholder="Care tips, where it's stored, favourite recipes…"
        multiline
        maxLength={500}
        showCounter
        error={errorFor('description')}
      />
    </FormShell>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  center: {
    textAlign: 'center',
  },
  header: {
    paddingHorizontal: Spacing.three,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: CONTENT_WIDTH,
    alignSelf: 'center',
  },
  scroll: {
    padding: 20,
    paddingBottom: Spacing.five,
  },
  column: {
    width: '100%',
    maxWidth: CONTENT_WIDTH,
    alignSelf: 'center',
    gap: Spacing.three,
  },
  field: {
    gap: Spacing.two,
  },
  photo: {
    width: '100%',
    aspectRatio: 16 / 10,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  dropzone: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    padding: Spacing.three,
  },
  dropIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  photoButtons: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: 12,
  },
  photoActions: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    flexDirection: 'row',
    gap: Spacing.two,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  inlineError: {
    fontSize: 13,
    minHeight: 16,
    marginTop: -Spacing.one,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepperInput: {
    width: 80,
    height: 50,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    textAlign: 'center',
    fontFamily: Fonts.sans,
    fontSize: 18,
    fontWeight: 700,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerContent: {
    gap: 10,
  },
  formError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: 12,
    borderRadius: Radius.md,
  },
});
