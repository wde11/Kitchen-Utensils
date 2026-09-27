import { File } from 'expo-file-system';
import type { ImagePickerAsset } from 'expo-image-picker';

/**
 * Adds the picked photo to a multipart form (iOS / Android).
 *
 * Since SDK 57 the global `fetch` is `expo/fetch`, which rejects React Native's old
 * `{ uri, name, type }` FormData parts before sending anything. It needs a real Blob,
 * and expo-file-system's `File` is one.
 */
export async function appendImage(form: FormData, asset: ImagePickerAsset, fileName: string) {
  form.append('image', new File(asset.uri), fileName);
}
