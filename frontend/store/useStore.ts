import { create } from 'zustand';
import { AppState } from '@/types';

export const useStore = create<AppState>((set) => ({
    wallet: null,
    user: null,
    card: null,  // New format: single card
    cards: null,  // Old format: backwards compatibility
    loading: false,

    setWallet: (wallet) => set({ wallet }),
    setUser: (user) => set({ user }),
    setCard: (card) => set({ card, cards: null }),  // Set single card, clear old cards
    setCards: (cards) => set({ cards, card: null }),  // Set old cards, clear new card
    setLoading: (loading) => set({ loading }),

    reset: () => set({
        wallet: null,
        user: null,
        card: null,
        cards: null,
        loading: false
    })
}));
