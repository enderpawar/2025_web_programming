import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, setToken } from '../api.js';
import { useTheme } from '../ThemeContext.jsx';

const Landing = () => {
  const navigate = useNavigate();
  const [me, setMe] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [apiModalOpen, setApiModalOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [stepModalOpen, setStepModalOpen] = useState(false);
  const [selectedStep, setSelectedStep] = useState(null);

  // Mouse tracking for interactive effects
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const who = await api.me();
        setMe(who);
      } catch {}
    })();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const progress = (window.scrollY / totalHeight) * 100;
      setScrollProgress(progress);
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }
      });
    }, observerOptions);

    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    animatedElements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToRooms = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      navigate('/rooms');
    }, 300);
  };

  return (
    <>
      {/* Scroll Progress Bar */}
      <div className="scroll-progress-bar" style={{ width: `${scrollProgress}%` }} />
      
      <div className={`landing-page ${isTransitioning ? 'page-transitioning' : ''} ${apiModalOpen ? 'landing-page-blurred' : ''}`}>
        {/* Mouse spotlight effect */}
        <div 
          className="mouse-spotlight" 
          style={{ 
            left: mousePos.x, 
            top: mousePos.y 
          }} 
        />
        
        {/* Top navigation */}
        <header className="landing-header">
        <div className="landing-header-content">
          <div className="landing-brand">
            <div className="logo">JSC</div>
            <span className="landing-brand-text">JS Online Compiler</span>
          </div>
          <nav className="landing-nav">
            {/* <a href="#blog">Blog</a>
            <a href="#contact">Contact</a>
            <a href="#help">Help</a>
            <a href="#donate">Donate</a> */}
          </nav>
          <LandingRightMenu apiModalOpen={apiModalOpen} setApiModalOpen={setApiModalOpen} />
        </div>
      </header>

      {/* Hero */}
      <main className="landing-hero">
        {/* Background accents */}
        <div aria-hidden className="landing-bg-accents">
          <div className="landing-blob landing-blob-1 jsc-blob1" />
          <div className="landing-blob landing-blob-2 jsc-blob2" />
          <div className="landing-blob landing-blob-3 jsc-blob3" />
        </div>
        
        {/* Floating particles */}
        <div className="landing-particles" aria-hidden="true">
          {[...Array(20)].map((_, i) => (
            <div 
              key={i} 
              className="particle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${15 + Math.random() * 10}s`
              }}
            />
          ))}
        </div>

        {/* Headline */}
        <section className="landing-headline">
          <TypingTitle pre="Turn your ideas into " highlight="code" />
          <p className="landing-subtitle">
            What will you create? The possibilities are endless.
          </p>
          <div className="landing-cta">
            <button
              onClick={handleNavigateToRooms}
              className="landing-btn-primary"
            >
              Start studying
            </button>
          </div>
        </section>

        {/* Prompt-style panel */}
        <section className="landing-prompt-section">
          <div className="landing-prompt-panel">
            <div className="landing-prompt-buttons">
              <button className="landing-prompt-btn">Get suggestions</button>
              <button className="landing-prompt-btn">Write a prompt</button>
            </div>
            <div className="landing-prompt-text">
              <div className="landing-prompt-line">
                <span className="landing-prompt-label">Make me</span>
                <span className="landing-prompt-value"> an algorithm playground</span>
              </div>
              <div className="landing-prompt-line">
                <span className="landing-prompt-label">for</span>
                <span className="landing-prompt-value landing-prompt-value-emerald"> students</span>
              </div>
              <div className="landing-prompt-line">
                <span className="landing-prompt-label">that helps</span>
                <span className="landing-prompt-value landing-prompt-value-purple"> solve coding problems</span>
              </div>
              <div className="landing-prompt-line">
                <span className="landing-prompt-label">instantly</span>
              </div>
            </div>
            <div className="landing-prompt-action">
              <button
                onClick={handleNavigateToRooms}
                className="landing-prompt-action-btn"
              >
                Start building with JSC →
              </button>
            </div>
          </div>
        </section>
        
        {/* Features Section */}
        <section className="landing-features animate-on-scroll">
          <h1 className="landing-section-title">Feature</h1>
          <div className="landing-features-grid">
            <FeatureCard
              icon="🤖"
              title="AI 기반 힌트"
              description="Gemini AI가 제공하는 지능형 힌트로 정답을 알려주지 않고 문제 해결을 도와드립니다"
            />
            <FeatureCard
              icon="📄"
              title="PDF 문제 자동 생성"
              description="PDF를 업로드하면 내용을 분석하여 관련된 코딩 문제를 자동으로 생성합니다"
            />
            <FeatureCard
              icon="👥"
              title="협업 룸"
              description="스터디 룸을 만들고 학생들을 초대하여 함께 문제를 해결하세요"
            />
            <FeatureCard
              icon="⚡"
              title="즉시 실행"
              description="JavaScript 코드를 실시간으로 실행하고 즉각적인 피드백을 받아보세요"
            />
            <FeatureCard
              icon="📊"
              title="진행도 추적"
              description="상세한 문제 해결 통계로 코딩 학습 여정을 모니터링하세요"
            />
            <FeatureCard
              icon="🎯"
              title="커스텀 문제"
              description="커스텀 테스트 케이스로 자신만의 코딩 챌린지를 만들어보세요"
            />
          </div>
        </section>
        
        {/* How It Works Section */}
        <section className="landing-how-it-works animate-on-scroll">
          <h1 className="landing-section-title">How to use</h1>
          <div className="landing-steps">
            <StepCard
              number="1"
              title="회원가입 & 룸 생성"
              description="계정을 만들고 몇 초 안에 첫 번째 스터디 룸을 설정하세요"
              thumbnailUrl={`${import.meta.env.BASE_URL}gifs/step1-signup.jpg`}
              gifUrl={`${import.meta.env.BASE_URL}gifs/step1-signup.gif`}
              onClick={() => {
                setSelectedStep({
                  number: "1",
                  title: "회원가입 & 룸 생성",
                  description: "계정을 만들고 몇 초 안에 첫 번째 스터디 룸을 설정하세요",
                  gifUrl: `${import.meta.env.BASE_URL}gifs/step1-signup.gif`
                });
                setStepModalOpen(true);
              }}
            />
            <StepCard
              number="2"
              title="문제 추가"
              description="PDF를 업로드하거나, 커스텀 문제를 만들거나, 기존 문제를 선택하세요"
              thumbnailUrl={`${import.meta.env.BASE_URL}gifs/step2-add-problem.jpg`}
              gifUrl={`${import.meta.env.BASE_URL}gifs/step2-add-problem.gif`}
              onClick={() => {
                setSelectedStep({
                  number: "2",
                  title: "문제 추가",
                  description: "PDF를 업로드하거나, 커스텀 문제를 만들거나, 기존 문제를 선택하세요",
                  gifUrl: `${import.meta.env.BASE_URL}gifs/step2-add-problem.gif`
                });
                setStepModalOpen(true);
              }}
            />
            <StepCard
              number="3"
              title="코딩 시작"
              description="솔루션을 작성하고, AI 힌트를 받고, 코드를 즉시 테스트하세요"
              thumbnailUrl={`${import.meta.env.BASE_URL}gifs/step3-coding.jpg`}
              gifUrl={`${import.meta.env.BASE_URL}gifs/step3-coding.gif`}
              onClick={() => {
                setSelectedStep({
                  number: "3",
                  title: "코딩 시작",
                  description: "솔루션을 작성하고, AI 힌트를 받고, 코드를 즉시 테스트하세요",
                  gifUrl: `${import.meta.env.BASE_URL}gifs/step3-coding.gif`
                });
                setStepModalOpen(true);
              }}
            />
            <StepCard
              number="4"
              title="진행도 확인"
              description="솔루션을 검토하고 시간이 지남에 따른 개선 사항을 모니터링하세요"
              thumbnailUrl={`${import.meta.env.BASE_URL}gifs/step4-progress.jpg`}
              gifUrl={`${import.meta.env.BASE_URL}gifs/step4-progress.gif`}
              onClick={() => {
                setSelectedStep({
                  number: "4",
                  title: "진행도 확인",
                  description: "솔루션을 검토하고 시간이 지남에 따른 개선 사항을 모니터링하세요",
                  gifUrl: `${import.meta.env.BASE_URL}gifs/step4-progress.gif`
                });
                setStepModalOpen(true);
              }}
            />
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        (c) {new Date().getFullYear()} JSC. All rights reserved.
      </footer>
      </div>
      
      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button className="scroll-to-top" onClick={scrollToTop} aria-label="Scroll to top">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="18 15 12 9 6 15"></polyline>
          </svg>
        </button>
      )}
      
      <LandingApiModal 
        apiModalOpen={apiModalOpen} 
        setApiModalOpen={setApiModalOpen} 
      />

      <StepModal
        open={stepModalOpen}
        onClose={() => {
          setStepModalOpen(false);
          setSelectedStep(null);
        }}
        number={selectedStep?.number}
        title={selectedStep?.title}
        description={selectedStep?.description}
        gifUrl={selectedStep?.gifUrl}
      />
    </>
  );
};

export default Landing;

const LandingRightMenu = ({ apiModalOpen, setApiModalOpen }) => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [me, setMe] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const who = await api.me();
        setMe(who);
      } catch {}
    })();
  }, []);

  const handleNavigateToRooms = () => {
    setOpen(false);
    setTimeout(() => {
      navigate('/rooms');
    }, 100);
  };

  if (!me) {
    return (
      <div className="landing-menu">
        <button
          onClick={toggleTheme}
          className="theme-toggle-btn"
          style={{ marginRight: '0.75rem' }}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
        <button onClick={() => navigate('/login')} className="landing-menu-btn">Log In</button>
        <button onClick={() => navigate('/signup')} className="landing-menu-signup">SIGN UP</button>
      </div>
    );
  }

  return (
    <>
      <div className="landing-dropdown" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button
          onClick={toggleTheme}
          className="theme-toggle-btn"
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
        <button
          onClick={() => setOpen((v) => !v)}
          className="landing-dropdown-trigger"
          aria-haspopup="true"
          aria-expanded={open}
        >
          Profile
        </button>
        {open && (
          <div className="landing-dropdown-menu">
            <div className="landing-dropdown-name">{me.name}</div>
            <div className="landing-dropdown-email">{me.email}</div>
            <div className="landing-dropdown-divider" />
            <button
              className="landing-dropdown-item"
              onClick={handleNavigateToRooms}
            >
              My Group
            </button>
            <button
              className="landing-dropdown-item"
              onClick={() => { setOpen(false); setApiModalOpen(true); }}
            >
              API Setting
            </button>
            <button
              className="landing-dropdown-item"
              onClick={() => { setToken(''); setMe(null); setOpen(false); }}
            >
              Log Out
            </button>
          </div>
        )}
      </div>
    </>
  );
};

// API Modal Component (separate from LandingRightMenu)
const LandingApiModal = ({ apiModalOpen, setApiModalOpen }) => {
  const [apiKey, setApiKey] = useState('');
  const [apiMessage, setApiMessage] = useState('');

  useEffect(() => {
    if (apiModalOpen) {
      // 모달이 열릴 때 저장된 API 키 로드
      const savedKey = api.getGeminiApiKey();
      setApiKey(savedKey);
    }
  }, [apiModalOpen]);

  const handleSaveApiKey = () => {
    try {
      api.setGeminiApiKey(apiKey);
      setApiMessage('API 키가 저장되었습니다.');
      setTimeout(() => {
        setApiMessage('');
        setApiModalOpen(false);
      }, 1500);
    } catch (error) {
      setApiMessage('저장 실패: ' + error.message);
    }
  };

  if (!apiModalOpen) return null;

  return (
    <div className="api-modal-overlay" onClick={() => setApiModalOpen(false)}>
      <div className="api-modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="api-modal-title">Gemini API Setting</h2>
        <p className="api-modal-description">
          Gemini API 키를 입력하세요. <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" style={{color: '#3b82f6', textDecoration: 'underline'}}>API 키 발급받기</a>
        </p>
        <input
          type="password"
          className="api-modal-input"
          placeholder="AIza..."
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
        {apiMessage && <p className="api-modal-message">{apiMessage}</p>}
        <div className="api-modal-actions">
          <button className="api-modal-btn api-modal-btn-cancel" onClick={() => setApiModalOpen(false)}>
            취소
          </button>
          <button className="api-modal-btn api-modal-btn-save" onClick={handleSaveApiKey}>
            저장
          </button>
        </div>
      </div>
    </div>
  );
};

// Title with left-to-right typing animation and gradient highlight for the last word
const TypingTitle = ({ pre = 'Turn your ideas into ', highlight = 'code' }) => {
  const full = pre + highlight;
  const preLen = pre.length;
  const fullLen = full.length;
  const [i, setI] = React.useState(0);

  React.useEffect(() => {
    let idx = 0;
    const speed = 50; // slowed ~25%
    const timer = setInterval(() => {
      idx += 1;
      setI(idx);
      if (idx >= fullLen) {
        clearInterval(timer);
      }
    }, speed);
    return () => clearInterval(timer);
  }, [fullLen]);

  const typedPre = pre.slice(0, Math.min(i, preLen));
  const typedHi = i > preLen ? highlight.slice(0, i - preLen) : '';
  const done = i >= fullLen;

  return (
    <h1 className="landing-title">
      <span>{typedPre}</span>
      <span className="landing-title-highlight">{typedHi}</span>
      {!done && (
        <span
          aria-hidden="true"
          className="typing-cursor"
        />
      )}
      <span className="sr-only">{full}</span>
    </h1>
  );
};

// Stats Counter Component
const StatsCounter = ({ end, suffix = '', label, duration = 2000 }) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const counterRef = React.useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.5 }
    );

    if (counterRef.current) {
      observer.observe(counterRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    let start = 0;
    const increment = end / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [isVisible, end, duration]);

  return (
    <div ref={counterRef} className="landing-stat-item">
      <div className="landing-stat-number">
        {count.toLocaleString()}{suffix}
      </div>
      <div className="landing-stat-label">{label}</div>
    </div>
  );
};

// Feature Card Component with 3D tilt effect
const FeatureCard = ({ icon, title, description }) => {
  const cardRef = React.useRef(null);
  
  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = (y - centerY) / 10;
    const rotateY = (centerX - x) / 10;
    
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
  };
  
  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    cardRef.current.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)';
  };
  
  return (
    <div 
      ref={cardRef}
      className="landing-feature-card"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="landing-feature-icon">{icon}</div>
      <h3 className="landing-feature-title">{title}</h3>
      <p className="landing-feature-description">{description}</p>
    </div>
  );
};

// Step Card Component
const StepCard = ({ number, title, description, gifUrl, thumbnailUrl, onClick }) => {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <div 
      className="landing-step-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      <div className="landing-step-header">
        <div className="landing-step-number">{number}</div>
        <h3 className="landing-step-title">{title}</h3>
      </div>
      <p className="landing-step-description">{description}</p>
      {(gifUrl || thumbnailUrl) && (
        <div className="landing-step-gif-container">
          <img 
            src={isHovered ? gifUrl : thumbnailUrl} 
            alt={`${title} 예시`}
            className="landing-step-gif"
            loading="lazy"
          />
        </div>
      )}
    </div>
  );
};

const StepModal = ({ open, onClose, number, title, description, gifUrl }) => {
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{ 
          maxWidth: '1200px', 
          width: '90vw',
          maxHeight: '90vh',
          overflow: 'auto'
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '24px',
            color: 'var(--color-text-primary)',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
          onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
        >
          ×
        </button>
        
        <div style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              fontWeight: '700',
              color: 'white'
            }}>
              {number}
            </div>
            <div>
              <h2 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '8px' }}>
                {title}
              </h2>
              <p style={{ fontSize: '18px', color: '#9ca3af', margin: 0 }}>
                {description}
              </p>
            </div>
          </div>
          
          {gifUrl && (
            <div style={{ 
              width: '100%',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
            }}>
              <img 
                src={gifUrl}
                alt={`${title} 상세 예시`}
                style={{ 
                  width: '100%',
                  height: 'auto',
                  display: 'block'
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
