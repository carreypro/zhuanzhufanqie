let timer = null;

chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
  chrome.storage.local.set({
    timerState: {
      mode: 'focus',
      timeLeft: 25 * 60,  // 25分钟专注
      isRunning: false,
      todayCount: 0,
      focusCount: 0,
      lastSaved: new Date().toISOString()
    }
  });
});

// 更新徽章文字
function updateBadge(state) {
  if (!state.isRunning && state.mode === 'rest') {
    // 休息模式且未开始时显示"休息"
    chrome.action.setBadgeText({ text: '休息' });
    chrome.action.setBadgeBackgroundColor({ color: '#9E9E9E' });  // 浅灰色
  } else if (state.isRunning) {
    // 运行中显示剩余分钟数
    const minutes = Math.ceil(state.timeLeft / 60);
    chrome.action.setBadgeText({ text: minutes.toString() });
    chrome.action.setBadgeBackgroundColor({ color: '#9E9E9E' });  // 浅灰色
  } else {
    // 其他情况清除徽章
    chrome.action.setBadgeText({ text: '' });
  }
}

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
        newState.timeLeft = newMode === 'focus' ? 25 * 60 :  // 25分钟专注
                          newMode === 'rest' ? 5 * 60 :      // 5分钟休息
                          15 * 60;                           // 15分钟长休息
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
      
      // 更新徽章
      updateBadge(newState);
      
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
  // 清除徽章
  chrome.action.setBadgeText({ text: '' });
} 