chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
  chrome.storage.sync.set({
    focusTime: 2 * 60,  // 2 minutes in seconds
    restTime: 2 * 60,   // 2 minutes in seconds
    todayCount: 0,
    lastDate: new Date().toDateString()
  });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  console.log('Alarm triggered:', alarm.name);
  if (alarm.name === 'pomodoroTimer') {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: '时间到！',
      message: '该切换状态了！',
      priority: 2
    });
  }
}); 