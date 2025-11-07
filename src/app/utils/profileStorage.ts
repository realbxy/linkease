// src/app/utils/profileStorage.ts
export type SocialLink = {
  id: string;
  icon: string;
  label: string;
  href: string;
};

export type Profile = {
  displayName: string;
  username: string;
  tag: string;
  tagline: string;
  avatar: string; // data URL or remote URL
  backgroundColor?: string; // e.g. '#000000'
  cardColor?: string; // e.g. '#060607'
  backgroundImage?: string | undefined; // data URL or remote URL
  bgAudio?: string | undefined; // data URL or remote URL
  volume?: number; // 0..1
  badges: string[];
  profileViews: string;
  socials: SocialLink[];
};

const STORAGE_KEY = 'froziprofile_v1';

export const DEFAULT_PROFILE: Profile = {
  displayName: 'realbay',
  username: '@bay',
  tag: '#8888',
  tagline: 'Lowkey the CEO of everything',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=fendziorr&backgroundColor=1a1a1a',
  backgroundColor: '#000000',
  cardColor: '#060607',
  backgroundImage: undefined,
  bgAudio: undefined,
  volume: 0.35,
  badges: ['Verified', 'Early'],
  profileViews: '10.8k',
  socials: [
    { id: '1', icon: 'discord', label: 'Discord', href: '#' },
    { id: '2', icon: 'github', label: 'GitHub', href: '#' },
    { id: '3', icon: 'spotify', label: 'Spotify', href: '#' },
    { id: '4', icon: 'youtube', label: 'YouTube', href: '#' },
    { id: '5', icon: 'tiktok', label: 'TikTok', href: '#' },
    { id: '6', icon: 'coin', label: 'Donate', href: '#' },
  ],
};

export function loadProfile(): Profile {
  if (typeof window === 'undefined') return DEFAULT_PROFILE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROFILE;
    const parsed = JSON.parse(raw) as Partial<Profile>;
    return {
      ...DEFAULT_PROFILE,
      ...parsed,
      badges: parsed.badges ?? DEFAULT_PROFILE.badges,
      socials: parsed.socials ?? DEFAULT_PROFILE.socials,
      backgroundColor: parsed.backgroundColor ?? DEFAULT_PROFILE.backgroundColor,
      cardColor: parsed.cardColor ?? DEFAULT_PROFILE.cardColor,
      backgroundImage: parsed.backgroundImage ?? DEFAULT_PROFILE.backgroundImage,
      bgAudio: parsed.bgAudio ?? DEFAULT_PROFILE.bgAudio,
      volume: typeof parsed.volume === 'number' ? parsed.volume : DEFAULT_PROFILE.volume,
    } as Profile;
  } catch (e) {
    console.error('loadProfile error', e);
    return DEFAULT_PROFILE;
  }
}

/**
 * Save profile to localStorage with a safe size check.
 * Returns true on success, false on failure.
 */
export function saveProfile(profile: Profile): boolean {
  try {
    // shallow copy and stringify
    const copy = { ...profile };
    const json = JSON.stringify(copy);

    // keep under ~4.5MB
    if (json.length > 4_500_000) {
      // caller should show a user-visible message
      console.warn('Profile too large to save to localStorage');
      return false;
    }

    localStorage.setItem(STORAGE_KEY, json);
    return true;
  } catch (e) {
    console.error('saveProfile error', e);
    return false;
  }
}

export function resetProfile(): Profile {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PROFILE));
  } catch (e) {
    console.error('resetProfile error', e);
  }
  return DEFAULT_PROFILE;
}
