import { create } from 'zustand';
import { settingsApi } from '../api/services';

interface HospitalProfile {
  name: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
}

interface HospitalState extends HospitalProfile {
  update: (profile: Partial<HospitalProfile>) => Promise<void>;
  fetchFromServer: () => Promise<void>;
}

const defaults: HospitalProfile = {
  name: '',
  tagline: '',
  address: '',
  phone: '',
  email: '',
};

function loadFromCache(): HospitalProfile {
  try {
    const saved = localStorage.getItem('hospitalProfile');
    if (saved) return { ...defaults, ...JSON.parse(saved) };
  } catch { /* ignore */ }
  return defaults;
}

function saveToCache(profile: HospitalProfile) {
  try {
    localStorage.setItem('hospitalProfile', JSON.stringify(profile));
  } catch { /* ignore */ }
}

export const useHospitalStore = create<HospitalState>((set) => ({
  ...loadFromCache(),

  fetchFromServer: async () => {
    try {
      const res = await settingsApi.get();
      const profile = res.data.data;
      if (profile) {
        set(profile);
        saveToCache(profile);
      }
    } catch { /* ignore – keep cached/default values */ }
  },

  update: async (profile) => {
    set((state) => {
      const updated = { ...state, ...profile };
      saveToCache({ name: updated.name, tagline: updated.tagline, address: updated.address, phone: updated.phone, email: updated.email });
      return updated;
    });
    try {
      const current = useHospitalStore.getState();
      await settingsApi.update({
        name: current.name,
        tagline: current.tagline,
        address: current.address,
        phone: current.phone,
        email: current.email,
      });
    } catch { /* cache update already applied */ }
  },
}));
