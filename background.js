chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({
    focusTime: 25 * 60,
    restTime: 5 * 60,
    todayCount: 0,
    lastDate: new Date().toDateString()
  });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'pomodoroTimer') {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.svg',
      title: '时间到！',
      message: '该休息一下了！',
      priority: 2
    });
  }
}); 