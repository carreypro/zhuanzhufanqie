let timer = null;

chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
  chrome.storage.local.set({
    timerState: {
      mode: 'focus',
      timeLeft: 25 * 60,
      isRunning: false,
      todayCount: 0,
      focusCount: 0,
      lastSaved: new Date().toISOString()
    }
  });
});

// 监听来自前台的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'START_TIMER') {
    startTimer();
  } else if (message.type === 'PAUSE_TIMER') {
    pauseTimer();
  }
  sendResponse({ success: true });
  return true;
});

function startTimer() {
  if (timer) {
    clearInterval(timer);
  }
  
  timer = setInterval(async () => {
    const { timerState } = await chrome.storage.local.get(['timerState']);
    if (timerState && timerState.isRunning && timerState.timeLeft > 0) {
      const newState = {
        ...timerState,
        timeLeft: timerState.timeLeft - 1
      };
      
      // 如果时间到了
      if (newState.timeLeft === 0) {
        const newMode = newState.mode === 'focus' ? 
          (newState.focusCount + 1 >= 4 ? 'long-rest' : 'rest') : 
          'focus';
        
        newState.mode = newMode;
        newState.timeLeft = newMode === 'focus' ? 25 * 60 : 
                          newMode === 'rest' ? 5 * 60 : 
                          15 * 60;
        newState.isRunning = false;
        newState.todayCount = newState.mode === 'focus' ? 
          newState.todayCount : newState.todayCount + 1;
        newState.focusCount = newState.mode === 'focus' ? 
          newState.focusCount : (newState.focusCount + 1) % 4;
        
        // 发送通知
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon128.png',
          title: '时间到！',
          message: newState.mode === 'focus' ? '休息结束，开始专注！' : '专注结束，休息一下吧！',
          priority: 2
        });
        
        clearInterval(timer);
        timer = null;
      }
      
      await chrome.storage.local.set({ timerState: newState });
      
      // 广播状态更新
      chrome.runtime.sendMessage({ type: 'STATE_UPDATED', state: newState });
    }
  }, 1000);
}

function pauseTimer() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
} 