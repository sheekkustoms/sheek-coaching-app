import type { PermissionKey, Profile } from './types';

export const PERMISSION_KEYS: PermissionKey[] = [
  'approve_members',
  'moderate_posts',
  'manage_content',
];

export const PERMISSION_LABELS: Record<PermissionKey, string> = {
  approve_members: 'Approve Members',
  moderate_posts: 'Moderate Posts',
  manage_content: 'Manage Content',
};

export const PERMISSION_DESCRIPTIONS: Record<PermissionKey, string> = {
  approve_members: 'Approve or reject pending signups and remove members',
  moderate_posts: 'Delete any member\u2019s community post',
  manage_content: 'Create, edit, and delete courses, sections, and lessons',
};

export function hasPermission(profile: Profile | null, key: PermissionKey): boolean {
  if (!profile) return false;
  if (profile.is_admin) return true;
  return Boolean(profile.permissions?.[key]);
}

export function hasAnyPermission(profile: Profile | null): boolean {
  if (!profile) return false;
  if (profile.is_admin) return true;
  return PERMISSION_KEYS.some((k) => Boolean(profile.permissions?.[k]));
}
