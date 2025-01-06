'use client'

import { useReducer, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { timerReducer } from '../reducers/timerReducer'
import { formatTime } from '../utils/formatTime'
import { motivationalPhrases } from '../utils/motivationalPhrases'
import { TimerState } from '../types/timer'

const FOCUS_TIME = 25 * 60;    // 25 minutes in seconds
const REST_TIME = 5 * 60;     // 5 minutes in seconds
const LONG_REST_TIME = 15 * 60; // 15 minutes in seconds
const FOCUS_IMAGES = 4;    // 专注状态图片数量
const FOCUS_COUNT_FOR_LONG_REST = 4; // 4次专注后进入长休息

const initialState: TimerState = {
  mode: 'focus',
  timeLeft: FOCUS_TIME,
  isRunning: false,
  todayCount: 0,
  focusCount: 0,
  loadedFromStorage: false
};

export default function Timer() {
  const [state, dispatch] = useReducer(timerReducer, initialState)
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0)
  const [currentImageIndex, setCurrentImageIndex] = useState(1)
  const [isMounted, setIsMounted] = useState(false)

  // 从 Chrome 存储加载状态
  useEffect(() => {
    chrome.storage.local.get(['timerState', 'currentImageIndex'], (result) => {
      if (result.timerState) {
        const savedState = result.timerState;
        // 检查是否是同一天
        const lastDate = new Date(savedState.lastSaved).toDateString();
        const today = new Date().toDateString();
        
        if (lastDate !== today) {
          // 如果不是同一天，重置今日计数
          dispatch({ type: 'LOAD_STATE', payload: { ...savedState, todayCount: 0, loadedFromStorage: true } });
        } else {
          dispatch({ type: 'LOAD_STATE', payload: { ...savedState, loadedFromStorage: true } });
        }
      }
      // 恢复保存的图片索引
      if (result.currentImageIndex) {
        setCurrentImageIndex(result.currentImageIndex);
      }
      // 标记组件已完成初始加载
      setIsMounted(true);
    });

    // 监听来自后台的状态更新
    const listener = (message: any) => {
      if (message.type === 'STATE_UPDATED') {
        dispatch({ type: 'LOAD_STATE', payload: { ...message.state, loadedFromStorage: true } });
      }
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  // 保存状态到 Chrome 存储
  useEffect(() => {
    chrome.storage.local.set({
      timerState: {
        ...state,
        lastSaved: new Date().toISOString()
      }
    });
  }, [state]);

  // 计算进度
  const calculateProgress = () => {
    const totalTime = state.mode === 'focus' ? FOCUS_TIME : 
                     state.mode === 'rest' ? REST_TIME :
                     LONG_REST_TIME;
    const progress = ((totalTime - state.timeLeft) / totalTime) * 100;
    return Math.min(100, Math.max(0, progress));
  }

  // 计算圆环路径
  const calculateCirclePath = () => {
    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    const progress = calculateProgress();
    const offset = circumference - (progress / 100) * circumference;
    return {
      radius,
      circumference,
      offset
    };
  }

  // 随机切换背景图片并保存
  const changeBackgroundImage = () => {
    if (state.mode === 'focus') {
      const nextIndex = Math.floor(Math.random() * FOCUS_IMAGES) + 1;
      setCurrentImageIndex(nextIndex);
      // 保存当前图片索引
      chrome.storage.local.set({ currentImageIndex: nextIndex });
    }
  }

  // 获取当前背景样式
  const getBackgroundStyle = () => {
    const imagePath = state.mode === 'focus' 
      ? `/images/focus/${currentImageIndex}.jpg`
      : '/images/rest/1.jpg';
    
    return {
      backgroundImage: `url(${imagePath})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    };
  }

  // 设置通知
  useEffect(() => {
    if (state.timeLeft === 0) {
      const message = state.mode === 'focus' ? '专注时间结束！' : '休息时间结束！';
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: '时间到！',
        message: message,
        priority: 2
      });
    }
  }, [state.timeLeft, state.mode]);

  // 修改背景图片更换逻辑
  useEffect(() => {
    // 添加 isMounted 检查
    if (!isMounted) return;

    // 只在以下条件同时满足时更换图片：
    // 1. 模式为专注模式
    // 2. 时间为初始时间（新的专注）
    // 3. 计时器未运行
    // 4. 不是从存储中加载的状态
    if (state.mode === 'focus' && 
        state.timeLeft === FOCUS_TIME && 
        !state.isRunning && 
        !state.loadedFromStorage) {
      setCurrentPhraseIndex((prevIndex) => (prevIndex + 1) % motivationalPhrases.length);
      changeBackgroundImage();
    }
  }, [state.mode, state.timeLeft, state.isRunning, state.loadedFromStorage, isMounted]);

  const handleStart = () => {
    console.log('Starting timer...')
    dispatch({ type: 'START' })
    chrome.runtime.sendMessage({ type: 'START_TIMER' });
  }

  const handlePause = () => {
    console.log('Pausing timer...')
    dispatch({ type: 'PAUSE' })
    chrome.runtime.sendMessage({ type: 'PAUSE_TIMER' });
  }

  const handleResume = () => {
    console.log('Resuming timer...')
    dispatch({ type: 'RESUME' })
    chrome.runtime.sendMessage({ type: 'START_TIMER' });
  }

  const handleAbandon = () => {
    console.log('Abandoning timer...')
    dispatch({ type: 'RESET' })
    chrome.runtime.sendMessage({ type: 'PAUSE_TIMER' });
  }

  const handleSkip = () => {
    console.log('Skipping timer...')
    dispatch({ type: 'SKIP' })
    chrome.runtime.sendMessage({ type: 'PAUSE_TIMER' });
  }

  const { radius, circumference, offset } = calculateCirclePath();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div 
        className="w-[320px] h-[480px] text-white shadow-xl relative overflow-hidden"
        style={getBackgroundStyle()}
      >
        {/* 半透明遮罩 - 使用渐变背景 */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/50" />
        
        {/* 内容区域 */}
        <div className="relative z-10 h-full flex flex-col">
          {/* 顶部标语 */}
          <header className="flex-none pt-4 px-8">
            <h1 className="text-lg font-normal text-center leading-relaxed tracking-wide min-h-[3rem]">
              {state.mode === 'focus' 
                ? motivationalPhrases[currentPhraseIndex]
                : state.mode === 'long-rest'
                ? '恭喜完成4次专注！'
                : '闭上眼睛休息一下'}
            </h1>
          </header>

          {/* 中间计时器区域 */}
          <div className="flex-1 flex flex-col items-center justify-center -mt-12">
            <div className="relative mb-8">
              {/* 计时器圆环 */}
              <svg className="w-[240px] h-[240px] transform -rotate-90">
                <circle
                  cx="120"
                  cy="120"
                  r={radius}
                  stroke="rgba(255, 255, 255, 0.12)"
                  strokeWidth="6"
                  fill="none"
                />
                <circle
                  cx="120"
                  cy="120"
                  r={radius}
                  stroke="white"
                  strokeWidth="6"
                  fill="none"
                  strokeLinecap="round"
                  style={{
                    strokeDasharray: circumference,
                    strokeDashoffset: offset,
                    transition: 'stroke-dashoffset 0.5s ease'
                  }}
                />
              </svg>
              {/* 时间显示 */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[2.5rem] font-medium tracking-wide">
                  {formatTime(state.timeLeft)}
                </span>
              </div>
            </div>

            {/* 按钮区域 */}
            <div className="space-y-2.5 w-full flex flex-col items-center -mt-2">
              <div className="w-56">
                {state.isRunning ? (
                  <Button
                    onClick={handlePause}
                    variant="outline"
                    className="w-full h-11 bg-white/15 text-white border-white/20 hover:bg-white/25 backdrop-blur-sm transition-colors"
                  >
                    暂停
                  </Button>
                ) : state.timeLeft < (state.mode === 'focus' ? FOCUS_TIME : state.mode === 'rest' ? REST_TIME : LONG_REST_TIME) ? (
                  state.mode === 'focus' ? (
                    <div className="flex justify-center space-x-2.5 w-full">
                      <Button
                        onClick={handleResume}
                        variant="outline"
                        className="flex-1 h-11 bg-white/15 text-white border-white/20 hover:bg-white/25 backdrop-blur-sm transition-colors"
                      >
                        继续
                      </Button>
                      <Button
                        onClick={handleAbandon}
                        variant="ghost"
                        className="flex-1 h-11 text-white hover:bg-white/15 backdrop-blur-sm transition-colors"
                      >
                        放弃
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={handleResume}
                      variant="outline"
                      className="w-full h-11 bg-white/15 text-white border-white/20 hover:bg-white/25 backdrop-blur-sm transition-colors"
                    >
                      继续
                    </Button>
                  )
                ) : (
                  <Button
                    onClick={handleStart}
                    variant="outline"
                    className="w-full h-11 bg-white/15 text-white border-white/20 hover:bg-white/25 backdrop-blur-sm transition-colors"
                  >
                    {state.mode === 'focus' ? '开始专注' : state.mode === 'long-rest' ? '开始长休息' : '开始休息'}
                  </Button>
                )}

                {(state.mode === 'rest' || state.mode === 'long-rest') && !state.isRunning && (
                  <Button
                    onClick={handleSkip}
                    variant="ghost"
                    className="w-full h-11 mt-2.5 text-white hover:bg-white/15 backdrop-blur-sm transition-colors"
                  >
                    跳过
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* 底部计数器 */}
          <footer className="flex-none pb-8 px-8">
            <div className="flex justify-center items-center">
              <span className="text-sm font-medium tracking-wider opacity-80">
                今天已完成 {state.todayCount} 次专注
              </span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  )
}

