import type { ImagePickerAsset } from 'expo-image-picker';
import { Platform } from 'react-native';

import { API_URL } from '@/config';
import { appendImage } from '@/lib/append-image';

export const CATEGORIES = [
  'Cookware',
  'Bakeware',
  'Cutlery',
  'Prep Tools',
  'Utensils',
  'Appliances',
  'Storage',
  'Serveware',
] as const;

export type Category = (typeof CATEGORIES)[number];

export type Utensil = {
  id: number;
  name: string;
  category: Category;
  material: string | null;
  quantity: number;
  description: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
};

export type UtensilInput = {
  name: string;
  category: Category;
  material: string;
  quantity: number;
  description: string;
};

/** What to do with the photo when saving: leave it, remove it, or upload a new one. */
export type ImageChange =
  | { type: 'keep' }
  | { type: 'remove' }
  | { type: 'upload'; asset: ImagePickerAsset };

export type FieldErrors = Partial<Record<keyof UtensilInput | 'image', string>>;

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly fieldErrors: FieldErrors = {},
  ) {
    super(message);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { Accept: 'application/json', ...init.headers },
      signal: controller.signal,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    // Only real connectivity failures mean the server is unreachable; anything else (e.g. a request
    // body the fetch implementation rejects) is reported as-is so it isn't mistaken for a network problem.
    const isNetworkFailure = controller.signal.aborted || /network|fetch|connect|timed? ?out|offline|host/i.test(message);
    throw new ApiError(isNetworkFailure ? unreachableMessage() : `Couldn't send the request: ${message}`, 0);
  } finally {
    clearTimeout(timeout);
  }

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(body?.error ?? `Request failed (${response.status}).`, response.status, body?.errors ?? {});
  }
  if (body === null) {
    // e.g. a static host answering with its index.html because EXPO_PUBLIC_API_URL isn't set.
    throw new ApiError(`${API_URL} didn't respond like the Kitchlet API. Check EXPO_PUBLIC_API_URL.`, response.status);
  }
  return body as T;
}

function unreachableMessage() {
  const pageIsHttps = Platform.OS === 'web' && typeof window !== 'undefined' && window.location.protocol === 'https:';
  if (pageIsHttps && API_URL.startsWith('http:')) {
    return `This site uses HTTPS, so the Kitchlet API must too. Set EXPO_PUBLIC_API_URL to an https:// address (currently ${API_URL}).`;
  }
  return `Can't reach the Kitchlet API at ${API_URL}. Is XAMPP (Apache + MySQL) running?`;
}

function jsonInit(method: string, payload: unknown): RequestInit {
  return {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  };
}

async function toFormData(input: UtensilInput, asset: ImagePickerAsset) {
  const form = new FormData();
  for (const [key, value] of Object.entries(input)) {
    form.append(key, String(value));
  }

  await appendImage(form, asset, asset.fileName ?? `utensil-${Date.now()}.jpg`);
  return form;
}

export async function listUtensils() {
  const { data } = await request<{ data: Utensil[] }>('/utensils');
  return data;
}

export async function getUtensil(id: number) {
  const { data } = await request<{ data: Utensil }>(`/utensils/${id}`);
  return data;
}

export async function createUtensil(input: UtensilInput, image: ImageChange) {
  const init: RequestInit =
    image.type === 'upload'
      ? { method: 'POST', body: await toFormData(input, image.asset) }
      : jsonInit('POST', input);
  const { data } = await request<{ data: Utensil }>('/utensils', init);
  return data;
}

export async function updateUtensil(id: number, input: UtensilInput, image: ImageChange) {
  // PHP only parses multipart bodies on POST, so photo uploads use POST /utensils/{id};
  // plain edits use a regular PUT with JSON.
  const init: RequestInit =
    image.type === 'upload'
      ? { method: 'POST', body: await toFormData(input, image.asset) }
      : jsonInit('PUT', { ...input, remove_image: image.type === 'remove' });
  const { data } = await request<{ data: Utensil }>(`/utensils/${id}`, init);
  return data;
}

export async function deleteUtensil(id: number) {
  await request(`/utensils/${id}`, { method: 'DELETE' });
}
