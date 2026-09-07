import { environment } from '../../../environments/environment';

// The backend's static file server lives one level above the API prefix:
// api base is http://localhost:5000/api/v1, uploads are served from
// http://localhost:5000/api/v1/uploads/<books|users>/<filename>.
//
// coverImage / profilePicture can be either:
//   - a bare filename from a local multer upload (e.g. "book-123.jpeg")
//   - a full external URL (e.g. a manually-set https://... link)
// This resolves either case to something an <img> tag can actually load.

function resolveMediaUrl(value: string | null | undefined, folder: 'books' | 'users'): string | null {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  return `${environment.apiUrl}/uploads/${folder}/${value}`;
}

export function bookCoverUrl(coverImage: string | null | undefined): string {
  const resolved = resolveMediaUrl(coverImage, 'books');
  return resolved || '/assets/images/book-placeholder.svg';
}

export function userAvatarUrl(profilePicture: string | null | undefined): string | null {
  return resolveMediaUrl(profilePicture, 'users');
}
