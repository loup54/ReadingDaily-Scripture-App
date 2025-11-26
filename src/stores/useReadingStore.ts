/**
 * Reading Store using Zustand
 * Manages daily readings state across the app
 */

import { create } from 'zustand';
import { DailyReadings, ReadingType } from '../types/reading.types';
import { ReadingService } from '../services/readings/ReadingService';
import { addDays } from '../utils/timezone';

interface ReadingStoreState {
  currentDate: Date;
  readings: DailyReadings | null;
  loading: boolean;
  error: string | null;
  activeTab: ReadingType;

  // Actions
  loadReadings: (date: Date) => Promise<void>;
  setActiveTab: (tab: ReadingType) => void;
  navigateToDate: (date: Date) => Promise<void>;
  goToToday: () => Promise<void>;
  goToTomorrow: () => Promise<void>;
  goToYesterday: () => Promise<void>;
  clearError: () => void;
}

export const useReadingStore = create<ReadingStoreState>((set, get) => ({
  currentDate: new Date(),
  readings: null,
  loading: false,
  error: null,
  activeTab: 'gospel',

  loadReadings: async (date: Date) => {
    set({ loading: true, error: null });

    try {
      const readings = await ReadingService.getDailyReadings(date);

      set({
        readings,
        currentDate: date,
        loading: false,
        error: null,
      });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load readings',
      });
    }
  },

  setActiveTab: (tab: ReadingType) => {
    set({ activeTab: tab });
  },

  navigateToDate: async (date: Date) => {
    await get().loadReadings(date);
  },

  goToToday: async () => {
    const today = new Date();
    await get().loadReadings(today);
  },

  goToTomorrow: async () => {
    const tomorrow = addDays(new Date(), 1);
    await get().loadReadings(tomorrow);
  },

  goToYesterday: async () => {
    const yesterday = addDays(new Date(), -1);
    await get().loadReadings(yesterday);
  },

  clearError: () => {
    set({ error: null });
  },
}));