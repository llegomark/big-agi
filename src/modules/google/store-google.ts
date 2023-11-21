import { createWithEqualityFn } from 'zustand/traditional';
import { persist } from 'zustand/middleware';

interface GoogleSearchStore {
  // Google Custom Search settings

  googleCloudApiKey: string;
  setGoogleCloudApiKey: (googleApiKey: string) => void;

  googleCSEId: string;
  setGoogleCSEId: (cseId: string) => void;
}

export const useGoogleSearchStore = createWithEqualityFn<GoogleSearchStore>()(
  persist(
    (set) => ({
      // Google Custom Search settings

      googleCloudApiKey: '',
      setGoogleCloudApiKey: (googleApiKey: string) => set({ googleCloudApiKey: googleApiKey }),

      googleCSEId: '',
      setGoogleCSEId: (cseId: string) => set({ googleCSEId: cseId }),
    }),
    {
      name: 'app-module-google-search',
    },
  ),
);
