export type TimerState = {
  mode: 'focus' | 'rest' | 'long-rest';
  timeLeft: number;
  isRunning: boolean;
  todayCount: number;
  focusCount: number;
  loadedFromStorage?: boolean;
};

export type TimerAction =
  | { type: 'START' }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'RESET' }
  | { type: 'SKIP' }
  | { type: 'TICK' }
  | { type: 'LOAD_STATE', payload: TimerState };

