import type { ImagePickerAsset } from 'expo-image-picker';

/** Adds the picked photo to a multipart form (web: the picker gives us a browser File, or a blob: URL). */
export async function appendImage(form: FormData, asset: ImagePickerAsset, fileName: string) {
  const blob = asset.file ?? (await (await fetch(asset.uri)).blob());
  form.append('image', blob, fileName);
}
