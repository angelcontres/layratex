export type AppTheme = 'dark' | 'light' | 'system';
export type PaperTone = 'dark' | 'cream' | 'sepia' | 'white';
export type PaperFont = 'serif' | 'sans';
export type SheetMode = 'edit' | 'split' | 'print';
export type CompilationEnginePreference = 'auto' | 'tectonic' | 'pdflatex';

export interface UserPreferences {
  theme: AppTheme;
  paperTone: PaperTone;
  paperFont: PaperFont;
  defaultSheetMode: SheetMode;
  autoSave: boolean;
  autoSaveIntervalSec: number;
  wordWrap: boolean;
  compilationEngine: CompilationEnginePreference;
  autoCompileOnSwitch: boolean;
  scrollSync: boolean;
  showCropMarks: boolean;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'dark',
  paperTone: 'dark',
  paperFont: 'serif',
  defaultSheetMode: 'edit',
  autoSave: true,
  autoSaveIntervalSec: 2,
  wordWrap: true,
  compilationEngine: 'auto',
  autoCompileOnSwitch: true,
  scrollSync: true,
  showCropMarks: true
};

export const PREFS_STORAGE_KEY = 'layratex_user_preferences';

export const preferencesService = {
  getPreferences(): UserPreferences {
    if (typeof window === 'undefined') return { ...DEFAULT_PREFERENCES };
    try {
      const stored = localStorage.getItem(PREFS_STORAGE_KEY);
      if (!stored) return { ...DEFAULT_PREFERENCES };
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_PREFERENCES, ...parsed };
    } catch {
      return { ...DEFAULT_PREFERENCES };
    }
  },

  savePreferences(prefs: Partial<UserPreferences>): UserPreferences {
    const current = this.getPreferences();
    const updated = { ...current, ...prefs };
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.warn('Failed to save preferences to localStorage', err);
      }
      this.applyTheme(updated.theme);
    }
    return updated;
  },

  resolveTheme(theme: AppTheme): 'dark' | 'light' {
    if (theme === 'system') {
      if (typeof window !== 'undefined' && window.matchMedia) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      return 'dark';
    }
    return theme;
  },

  applyTheme(theme: AppTheme): 'dark' | 'light' {
    const resolved = this.resolveTheme(theme);
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      root.setAttribute('data-theme', resolved);
      if (resolved === 'light') {
        root.classList.add('theme-light');
        root.classList.remove('theme-dark');
      } else {
        root.classList.add('theme-dark');
        root.classList.remove('theme-light');
      }
    }
    return resolved;
  },

  reset(): UserPreferences {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(PREFS_STORAGE_KEY);
      } catch {}
    }
    const defaults = { ...DEFAULT_PREFERENCES };
    this.applyTheme(defaults.theme);
    return defaults;
  }
};
