export type ActivityFormKind = 'earn' | 'spend';

export interface ActivityFormPreferences {
  duration: number;
  ratio: number;
}

const STORAGE_PREFIX = 'habit-hero:activity-form';

const getStorageKey = (kind: ActivityFormKind, userId: string) => {
  return `${STORAGE_PREFIX}:${userId}:${kind}`;
};

const sanitizePositiveInteger = (value: unknown, fallback: number) => {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.round(parsed);
};

export const readActivityFormPreferences = (
  kind: ActivityFormKind,
  userId: string,
  defaults: ActivityFormPreferences,
): ActivityFormPreferences => {
  if (typeof window === 'undefined') {
    return defaults;
  }

  try {
    const rawPreferences = window.localStorage.getItem(getStorageKey(kind, userId));
    if (!rawPreferences) return defaults;

    const savedPreferences = JSON.parse(rawPreferences) as Partial<ActivityFormPreferences>;

    return {
      duration: sanitizePositiveInteger(savedPreferences.duration, defaults.duration),
      ratio: sanitizePositiveInteger(savedPreferences.ratio, defaults.ratio),
    };
  } catch {
    return defaults;
  }
};

export const saveActivityFormPreferences = (
  kind: ActivityFormKind,
  userId: string,
  preferences: ActivityFormPreferences,
) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(getStorageKey(kind, userId), JSON.stringify(preferences));
  } catch {
    // Local storage can be unavailable in private browsing or restricted embeds.
  }
};
