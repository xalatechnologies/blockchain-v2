"use client";

import { create } from "zustand";

interface ShariaFilterState {
  halalOnly: boolean;
  setHalalOnly: (value: boolean) => void;
}

export const useShariaFilter = create<ShariaFilterState>((set) => ({
  halalOnly: false,
  setHalalOnly: (value) => set({ halalOnly: value }),
}));

