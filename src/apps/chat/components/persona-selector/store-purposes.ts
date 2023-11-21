import { createWithEqualityFn } from 'zustand/traditional';
import { persist } from 'zustand/middleware';

interface PurposeStore {
  // state
  hiddenPurposeIDs: string[];

  // actions
  toggleHiddenPurposeId: (purposeId: string) => void;
}

export const usePurposeStore = createWithEqualityFn<PurposeStore>()(
  persist(
    (set) => ({
      // default state
      hiddenPurposeIDs: ['Designer'],

      toggleHiddenPurposeId: (purposeId: string) => {
        set((state) => {
          const hiddenPurposeIDs = state.hiddenPurposeIDs.includes(purposeId)
            ? state.hiddenPurposeIDs.filter((id) => id !== purposeId)
            : [...state.hiddenPurposeIDs, purposeId];
          return {
            hiddenPurposeIDs,
          };
        });
      },
    }),
    {
      name: 'app-purpose',
    },
  ),
);
