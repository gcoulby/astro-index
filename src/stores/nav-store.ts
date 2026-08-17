/** Screen navigation for the app's 5 screens. No router — a fixed, linear flow. */
import { create } from 'zustand'

export type Screen = 'splash' | 'pageNumberSearch' | 'pageLinks' | 'fuzzySearch'

interface NavState {
  screen: Screen
  selectedPage: number | null
  goTo: (screen: Screen) => void
  openPage: (page: number) => void
}

export const useNavStore = create<NavState>((set) => ({
  screen: 'splash',
  selectedPage: null,
  goTo: (screen) => set({ screen }),
  openPage: (page) => set({ screen: 'pageLinks', selectedPage: page }),
}))
