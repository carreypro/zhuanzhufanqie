import { TimerState, TimerAction } from '../types/timer'

const FOCUS_TIME = 3;    // 3 seconds for testing
const REST_TIME = 2;     // 2 seconds for testing
const LONG_REST_TIME = 15 * 60; // 15 minutes in seconds
const FOCUS_COUNT_FOR_LONG_REST = 4; // 4个专注后进入长休息

export function timerReducer(state: TimerState, action: TimerAction): TimerState {
  console.log('Reducer action:', action.type, 'Current state:', state);
  
  switch (action.type) {
    case 'START':
      return {
        ...state,
        isRunning: true,
      };
    case 'PAUSE':
      return {
        ...state,
        isRunning: false,
      };
    case 'RESUME':
      return {
        ...state,
        isRunning: true,
      };
    case 'RESET':
      return {
        ...state,
        timeLeft: state.mode === 'focus' ? FOCUS_TIME : 
                 state.mode === 'rest' ? REST_TIME :
                 LONG_REST_TIME,
        isRunning: false,
      };
    case 'SKIP':
      const skipToMode = state.mode === 'focus' ? 
        (state.focusCount + 1 >= FOCUS_COUNT_FOR_LONG_REST ? 'long-rest' : 'rest') : 
        'focus';
      
      return {
        ...state,
        mode: skipToMode,
        timeLeft: skipToMode === 'focus' ? FOCUS_TIME :
                 skipToMode === 'rest' ? REST_TIME :
                 LONG_REST_TIME,
        isRunning: false,
        focusCount: state.mode === 'focus' ? 
          ((state.focusCount + 1) % FOCUS_COUNT_FOR_LONG_REST) : 
          state.focusCount
      };
    case 'TICK':
      if (state.timeLeft <= 0) {
        const newMode = state.mode === 'focus' ? 
          (state.focusCount + 1 >= FOCUS_COUNT_FOR_LONG_REST ? 'long-rest' : 'rest') : 
          'focus';

        console.log('Timer finished, switching to:', newMode);
        
        return {
          mode: newMode,
          timeLeft: newMode === 'focus' ? FOCUS_TIME :
                   newMode === 'rest' ? REST_TIME :
                   LONG_REST_TIME,
          isRunning: false,
          todayCount: state.mode === 'focus' ? state.todayCount + 1 : state.todayCount,
          focusCount: state.mode === 'focus' ? 
            ((state.focusCount + 1) % FOCUS_COUNT_FOR_LONG_REST) : 
            state.focusCount
        };
      }
      return {
        ...state,
        timeLeft: state.timeLeft - 1,
      };
    default:
      return state;
  }
}

