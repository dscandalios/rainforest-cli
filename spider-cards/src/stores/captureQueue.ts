import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { QueuedCapture } from '../types';

interface CaptureQueueState {
  queue: QueuedCapture[];
  enqueue: (c: QueuedCapture) => void;
  dequeue: (localId: string) => void;
  clear: () => void;
}

export const useCaptureQueue = create<CaptureQueueState>()(
  persist(
    (set) => ({
      queue: [],
      enqueue: (c) => set((s) => ({ queue: [...s.queue, c] })),
      dequeue: (localId) =>
        set((s) => ({ queue: s.queue.filter((q) => q.localId !== localId) })),
      clear: () => set({ queue: [] }),
    }),
    {
      name: 'spider-cards-capture-queue',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
