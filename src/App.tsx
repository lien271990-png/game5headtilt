import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Timer, CheckCircle2, XCircle, Play, RotateCcw, Settings, Plus, Trash2, X, Volume2, VolumeX } from 'lucide-react';
import confetti from 'canvas-confetti';
import { HeadTracker } from './components/HeadTracker';

interface Question {
  id: string;
  text: string;
  optionA: string;
  optionB: string;
  correct: 'A' | 'B';
}

const DEFAULT_QUESTIONS: Question[] = [
  { id: '1', text: "Where are you going to visit this summer?", optionA: "I going to visit Huong River.", optionB: "I'm going to visit Huong River.", correct: 'B' },
  { id: '2', text: "Where are you going to ________ this summer?", optionA: "visit", optionB: "you", correct: 'A' },
  { id: '3', text: "Where are you going to visit this summer?", optionA: "I visited Phong Nha Cave.", optionB: "I'm going to visit Phong Nha Cave", correct: 'B' },
  { id: '4', text: "Where are you going to visit this summer? I'm _______ to visit Phu Quoc Island.", optionA: "visit", optionB: "going", correct: 'B' },
];

const SOUNDS = {
  bg: "https://assets.mixkit.co/music/preview/mixkit-game-level-music-689.mp3",
  correct: "https://assets.mixkit.co/sfx/preview/mixkit-correct-answer-reward-952.mp3",
  wrong: "https://assets.mixkit.co/sfx/preview/mixkit-wrong-answer-buzzer-948.mp3",
  yeah: "https://assets.mixkit.co/sfx/preview/mixkit-human-male-voice-saying-yeah-01-2315.mp3",
  tick: "https://assets.mixkit.co/sfx/preview/mixkit-clock-tick-tock-70.mp3",
  gameOver: "https://assets.mixkit.co/sfx/preview/mixkit-funny-fail-low-tone-2856.mp3",
  applause: "https://assets.mixkit.co/sfx/preview/mixkit-crowd-clapping-and-cheering-444.mp3"
};

export default function App() {
  const [gameState, setGameState] = useState<'start' | 'playing' | 'ended'>('start');
  const [questions, setQuestions] = useState<Question[]>(() => {
    const saved = localStorage.getItem('quiz_questions');
    return saved ? JSON.parse(saved) : DEFAULT_QUESTIONS;
  });
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [tilt, setTilt] = useState<'left' | 'right' | 'center'>('center');
  const [selectionProgress, setSelectionProgress] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [timeLeft, setTimeLeft] = useState(10);
  const [showEditor, setShowEditor] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const audioRefs = {
    bg: useRef<HTMLAudioElement | null>(null),
    correct: useRef<HTMLAudioElement | null>(null),
    wrong: useRef<HTMLAudioElement | null>(null),
    yeah: useRef<HTMLAudioElement | null>(null),
    tick: useRef<HTMLAudioElement | null>(null),
    gameOver: useRef<HTMLAudioElement | null>(null),
    applause: useRef<HTMLAudioElement | null>(null),
  };

  useEffect(() => {
    audioRefs.bg.current = new Audio(SOUNDS.bg);
    audioRefs.bg.current.loop = true;
    audioRefs.correct.current = new Audio(SOUNDS.correct);
    audioRefs.wrong.current = new Audio(SOUNDS.wrong);
    audioRefs.yeah.current = new Audio(SOUNDS.yeah);
    audioRefs.tick.current = new Audio(SOUNDS.tick);
    audioRefs.gameOver.current = new Audio(SOUNDS.gameOver);
    audioRefs.applause.current = new Audio(SOUNDS.applause);
  }, []);

  useEffect(() => {
    localStorage.setItem('quiz_questions', JSON.stringify(questions));
  }, [questions]);

  const playSound = (type: keyof typeof audioRefs) => {
    if (isMuted) return;
    const audio = audioRefs[type].current;
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(e => console.log("Audio play failed", e));
    }
  };

  const stopSound = (type: keyof typeof audioRefs) => {
    const audio = audioRefs[type].current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  };

  const startGame = () => {
    if (questions.length === 0) {
      alert("Vui lòng thêm ít nhất một câu hỏi!");
      setShowEditor(true);
      return;
    }
    setGameState('playing');
    setCurrentQuestionIndex(0);
    setScore(0);
    setTimeLeft(10);
    playSound('bg');
  };

  const handleNextQuestion = useCallback((isCorrect: boolean) => {
    if (isCorrect) {
      setScore(s => s + 1);
      setFeedback('correct');
      playSound('correct');
      playSound('yeah');
      playSound('applause');
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } else {
      setFeedback('wrong');
      playSound('wrong');
    }

    setTimeout(() => {
      setFeedback(null);
      setSelectionProgress(0);
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(i => i + 1);
        setTimeLeft(10);
      } else {
        setGameState('ended');
        stopSound('bg');
        playSound('gameOver');
      }
    }, 1500);
  }, [currentQuestionIndex, questions.length]);

  useEffect(() => {
    if (gameState !== 'playing' || feedback) return;

    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 4 && t > 1) playSound('tick');
        if (t <= 1) {
          handleNextQuestion(false);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, feedback, handleNextQuestion]);

  useEffect(() => {
    if (gameState !== 'playing' || feedback) return;

    let interval: number;
    if (tilt !== 'center') {
      interval = window.setInterval(() => {
        setSelectionProgress(p => {
          if (p >= 100) {
            const currentQ = questions[currentQuestionIndex];
            const selection = tilt === 'left' ? 'A' : 'B';
            handleNextQuestion(selection === currentQ.correct);
            return 100;
          }
          return p + 4; // Slightly slower for better control
        });
      }, 50);
    } else {
      setSelectionProgress(0);
    }

    return () => clearInterval(interval);
  }, [tilt, gameState, feedback, currentQuestionIndex, handleNextQuestion, questions]);

  const addQuestion = () => {
    const newQ: Question = {
      id: Date.now().toString(),
      text: "Câu hỏi mới?",
      optionA: "Đáp án A",
      optionB: "Đáp án B",
      correct: 'A'
    };
    setQuestions([...questions, newQ]);
  };

  const updateQuestion = (id: string, field: keyof Question, value: string) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, [field]: value } : q));
  };

  const deleteQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-emerald-500/30 overflow-x-hidden">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_50%,#1a1a1a_0%,#000_100%)] opacity-50" />
      
      {/* Top Controls */}
      <div className="fixed top-6 right-6 z-50 flex items-center gap-3">
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="p-3 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 transition-all"
        >
          {isMuted ? <VolumeX className="w-5 h-5 text-zinc-400" /> : <Volume2 className="w-5 h-5 text-emerald-500" />}
        </button>
        <button
          onClick={() => setShowEditor(true)}
          className="p-3 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 transition-all"
        >
          <Settings className="w-5 h-5 text-zinc-400" />
        </button>
      </div>

      <main className="relative z-10 max-w-4xl mx-auto px-6 py-12 flex flex-col items-center min-h-screen">
        <AnimatePresence mode="wait">
          {gameState === 'start' && (
            <motion.div
              key="start"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center text-center space-y-8 mt-20"
            >
              <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20 shadow-[0_0_50px_-12px_rgba(16,185,129,0.3)]">
                <Trophy className="w-12 h-12 text-emerald-500" />
              </div>
              <div className="space-y-4">
                <h1 className="text-6xl font-bold tracking-tighter italic font-serif">
                  HEAD TILT <span className="text-emerald-500">QUIZ</span>
                </h1>
                <p className="text-zinc-400 max-w-md mx-auto text-lg">
                  Nghiêng đầu sang <span className="text-white font-medium">Trái (A)</span> hoặc <span className="text-white font-medium">Phải (B)</span> để chọn đáp án.
                </p>
              </div>
              <button
                onClick={startGame}
                className="group relative px-10 py-5 bg-white text-black font-bold rounded-full overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-xl"
              >
                <div className="absolute inset-0 bg-emerald-500 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <span className="relative flex items-center gap-3 text-lg">
                  BẮT ĐẦU CHƠI <Play className="w-5 h-5 fill-current" />
                </span>
              </button>
            </motion.div>
          )}

          {gameState === 'playing' && currentQuestion && (
            <motion.div
              key="playing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full space-y-8"
            >
              {/* Header Stats */}
              <div className="flex justify-between items-center w-full">
                <div className="flex items-center gap-4">
                  <div className="text-xs font-mono uppercase tracking-widest text-zinc-500">Question</div>
                  <div className="text-2xl font-bold italic font-serif">{currentQuestionIndex + 1}/{questions.length}</div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Timer className={`w-5 h-5 ${timeLeft < 4 ? 'text-red-500 animate-pulse' : 'text-emerald-500'}`} />
                    <span className="text-2xl font-mono font-bold">{timeLeft}s</span>
                  </div>
                  <div className="h-8 w-px bg-white/10" />
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    <span className="text-2xl font-mono font-bold">{score}</span>
                  </div>
                </div>
              </div>

              {/* Camera Feed */}
              <div className="w-full aspect-video max-w-2xl mx-auto relative group">
                <HeadTracker onTilt={setTilt} isActive={!feedback} />
                
                {/* Selection Indicators */}
                <div className="absolute inset-0 pointer-events-none flex justify-between p-4">
                  <div className={`w-1/4 h-full border-4 rounded-xl transition-all duration-300 flex items-center justify-center ${tilt === 'left' ? 'border-emerald-500 bg-emerald-500/10' : 'border-transparent'}`}>
                    {tilt === 'left' && (
                      <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="flex flex-col items-center gap-2">
                        <div className="text-5xl font-bold text-emerald-500 drop-shadow-lg">A</div>
                        <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500" style={{ width: `${selectionProgress}%` }} />
                        </div>
                      </motion.div>
                    )}
                  </div>
                  <div className={`w-1/4 h-full border-4 rounded-xl transition-all duration-300 flex items-center justify-center ${tilt === 'right' ? 'border-emerald-500 bg-emerald-500/10' : 'border-transparent'}`}>
                    {tilt === 'right' && (
                      <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="flex flex-col items-center gap-2">
                        <div className="text-5xl font-bold text-emerald-500 drop-shadow-lg">B</div>
                        <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500" style={{ width: `${selectionProgress}%` }} />
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Feedback Overlay */}
                <AnimatePresence>
                  {feedback && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.5 }}
                      className={`absolute inset-0 flex items-center justify-center z-20 rounded-2xl backdrop-blur-md ${feedback === 'correct' ? 'bg-emerald-500/30' : 'bg-red-500/30'}`}
                    >
                      {feedback === 'correct' ? (
                        <div className="flex flex-col items-center gap-4">
                          <CheckCircle2 className="w-24 h-24 text-emerald-500" />
                          <span className="text-5xl font-bold tracking-tighter uppercase italic font-serif">Chính xác!</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-4">
                          <XCircle className="w-24 h-24 text-red-500" />
                          <span className="text-5xl font-bold tracking-tighter uppercase italic font-serif">Sai rồi!</span>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Question UI */}
              <div className="space-y-8 text-center">
                <h2 className="text-4xl font-medium leading-tight max-w-2xl mx-auto font-serif italic">
                  {currentQuestion.text}
                </h2>
                
                <div className="grid grid-cols-2 gap-6 max-w-2xl mx-auto">
                  <div className={`p-8 rounded-3xl border-2 transition-all duration-500 ${tilt === 'left' ? 'border-emerald-500 bg-emerald-500/10 scale-105 shadow-[0_0_30px_-10px_rgba(16,185,129,0.3)]' : 'border-white/10 bg-white/5'}`}>
                    <div className="text-xs font-mono text-zinc-500 uppercase mb-2 tracking-widest">Option A</div>
                    <div className="text-2xl font-bold">{currentQuestion.optionA}</div>
                  </div>
                  <div className={`p-8 rounded-3xl border-2 transition-all duration-500 ${tilt === 'right' ? 'border-emerald-500 bg-emerald-500/10 scale-105 shadow-[0_0_30px_-10px_rgba(16,185,129,0.3)]' : 'border-white/10 bg-white/5'}`}>
                    <div className="text-xs font-mono text-zinc-500 uppercase mb-2 tracking-widest">Option B</div>
                    <div className="text-2xl font-bold">{currentQuestion.optionB}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {gameState === 'ended' && (
            <motion.div
              key="ended"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center text-center space-y-8 mt-20"
            >
              <div className="relative">
                <div className="w-32 h-32 bg-yellow-500/10 rounded-full flex items-center justify-center border border-yellow-500/20 shadow-[0_0_60px_-12px_rgba(234,179,8,0.4)]">
                  <Trophy className="w-16 h-16 text-yellow-500" />
                </div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: 'spring' }}
                  className="absolute -top-2 -right-2 w-12 h-12 bg-white text-black rounded-full flex items-center justify-center font-bold text-xl border-4 border-[#0a0a0a]"
                >
                  {score}
                </motion.div>
              </div>
              
              <div className="space-y-2">
                <h2 className="text-5xl font-bold tracking-tighter italic font-serif">KẾT THÚC!</h2>
                <p className="text-zinc-400 text-lg">
                  Bạn đã trả lời đúng <span className="text-white font-bold">{score}/{questions.length}</span> câu hỏi.
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={startGame}
                  className="group relative px-8 py-4 bg-white text-black font-bold rounded-full overflow-hidden transition-all hover:scale-105 active:scale-95"
                >
                  <div className="absolute inset-0 bg-emerald-500 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                  <span className="relative flex items-center gap-2 transition-colors">
                    CHƠI LẠI <RotateCcw className="w-4 h-4" />
                  </span>
                </button>
                <button
                  onClick={() => setGameState('start')}
                  className="px-8 py-4 border-2 border-white/10 hover:border-white/30 text-white font-bold rounded-full transition-all"
                >
                  VỀ TRANG CHỦ
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Question Editor Modal */}
      <AnimatePresence>
        {showEditor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-[#111] border border-white/10 rounded-3xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl"
            >
              <div className="p-6 border-bottom border-white/5 flex justify-between items-center">
                <h3 className="text-2xl font-bold font-serif italic">Quản lý câu hỏi</h3>
                <button onClick={() => setShowEditor(false)} className="p-2 hover:bg-white/5 rounded-full transition-all">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {questions.map((q, idx) => (
                  <div key={q.id} className="p-6 bg-white/5 rounded-2xl border border-white/5 space-y-4 relative group">
                    <button
                      onClick={() => deleteQuestion(q.id)}
                      className="absolute top-4 right-4 p-2 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                    
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1 block">Câu hỏi {idx + 1}</label>
                        <input
                          type="text"
                          value={q.text}
                          onChange={(e) => updateQuestion(q.id, 'text', e.target.value)}
                          className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 focus:border-emerald-500 outline-none transition-all"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1 block">Đáp án A</label>
                          <input
                            type="text"
                            value={q.optionA}
                            onChange={(e) => updateQuestion(q.id, 'optionA', e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 focus:border-emerald-500 outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1 block">Đáp án B</label>
                          <input
                            type="text"
                            value={q.optionB}
                            onChange={(e) => updateQuestion(q.id, 'optionB', e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 focus:border-emerald-500 outline-none transition-all"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1 block">Đáp án đúng</label>
                        <div className="flex gap-2">
                          {['A', 'B'].map(opt => (
                            <button
                              key={opt}
                              onClick={() => updateQuestion(q.id, 'correct', opt as 'A' | 'B')}
                              className={`px-4 py-2 rounded-xl border transition-all ${q.correct === opt ? 'bg-emerald-500 border-emerald-500 text-black font-bold' : 'border-white/10 hover:border-white/30'}`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-6 border-top border-white/5 flex gap-4">
                <button
                  onClick={addQuestion}
                  className="flex-1 py-3 bg-emerald-500 text-black font-bold rounded-xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-all"
                >
                  <Plus className="w-5 h-5" /> THÊM CÂU HỎI
                </button>
                <button
                  onClick={() => {
                    setQuestions(DEFAULT_QUESTIONS);
                    localStorage.removeItem('quiz_questions');
                  }}
                  className="px-6 py-3 border border-white/10 hover:border-red-500/50 hover:text-red-500 rounded-xl transition-all"
                >
                  RESET
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Info */}
      <footer className="fixed bottom-6 left-0 right-0 z-10 flex justify-center pointer-events-none">
        <div className="px-6 py-3 bg-black/50 backdrop-blur-md border border-white/10 rounded-full flex items-center gap-6 shadow-2xl">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">Tilt Left for A</span>
          </div>
          <div className="w-px h-4 bg-white/10" />
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">Tilt Right for B</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
