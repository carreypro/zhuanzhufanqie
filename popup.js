let timer;
let timeLeft;
let isRunning = false;

document.addEventListener('DOMContentLoaded', () => {
    const timerDisplay = document.getElementById('timer');
    const startBtn = document.getElementById('startBtn');
    const resetBtn = document.getElementById('resetBtn');
    const workTimeInput = document.getElementById('workTime');

    // 从存储中加载设置
    chrome.storage.sync.get(['workTime'], (result) => {
        if (result.workTime) {
            workTimeInput.value = result.workTime;
        }
    });

    // 保存设置
    workTimeInput.addEventListener('change', () => {
        chrome.storage.sync.set({ workTime: workTimeInput.value });
    });

    startBtn.addEventListener('click', () => {
        if (!isRunning) {
            startTimer();
            startBtn.textContent = '暂停';
        } else {
            pauseTimer();
            startBtn.textContent = '开始';
        }
        isRunning = !isRunning;
    });

    resetBtn.addEventListener('click', resetTimer);

    function startTimer() {
        if (!timeLeft) {
            timeLeft = workTimeInput.value * 60;
        }
        timer = setInterval(() => {
            timeLeft--;
            updateDisplay();
            if (timeLeft <= 0) {
                finishTimer();
            }
        }, 1000);
    }

    function pauseTimer() {
        clearInterval(timer);
    }

    function resetTimer() {
        clearInterval(timer);
        timeLeft = workTimeInput.value * 60;
        isRunning = false;
        startBtn.textContent = '开始';
        updateDisplay();
    }

    function updateDisplay() {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    function finishTimer() {
        clearInterval(timer);
        isRunning = false;
        startBtn.textContent = '开始';
        
        // 发送通知
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon128.png',
            title: '番茄钟时间到！',
            message: '该休息一下了！'
        });
        
        resetTimer();
    }

    // 初始化显示
    resetTimer();
}); 