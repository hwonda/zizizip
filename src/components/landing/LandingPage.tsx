'use client';

import Image from 'next/image';
import { useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Logo from '@/components/icons/Logo';
import { setLandingPreference } from '@/utils/landingPreference';
import { ChevronLeft, ChevronRight, ArrowBigRight, CalendarCheck, Trash2, Pause, Play } from 'lucide-react';

interface Card {
  id: number;
  title: string;
  subtitle: string;
  description: string | ReactNode;
  imageSrc: string;
}

const cards: Card[] = [
  {
    id: 1,
    title: 'Q1. 왜 만들었나요?',
    subtitle: '공공기관(LH, SH 등)에서 제공하는 엑셀 파일, 지도에서 보고 싶지 않으셨나요?',
    description: (
      <div>
        <p>{'매번 주소를 일일이 검색하고 위치를 확인하는 '} <span className='font-bold'>{'번거로움.'}</span></p>
        <p>{'엑셀 파일 속 수백 개의 매물을'} <span className='font-bold'>{'한눈에 보고 싶다는 생각'}</span>{'에서 지지집이 시작되었습니다.'}</p>
      </div>
    ),
    imageSrc: '/images/landing-1.webp',
  },
  {
    id: 2,
    title: 'Q2. 무엇을 해결하나요?',
    subtitle: '파편화된 공공주택 정보를 한눈에 확인하세요!',
    description: (
      <div>
        <p><span className='font-bold'>{'주소, 가격, 면적부터 엘리베이터 유무'}</span>{'까지 기존 공공주택 정보는 파편화되어 알아보기 힘들었습니다.'}</p>
        <p>{'지지집은 공공기관에서 제공하는 엑셀을 그냥 업로드하면'} <span className='font-bold'>{'지도와 팝업으로 모든 정보를 한눈에'}</span>{' 볼 수 있습니다.'}</p>
      </div>
    ),
    imageSrc: '/images/landing-2.webp',
  },
  {
    id: 3,
    title: 'Q3. 어떻게 사용하나요?',
    subtitle: '단 "2단계"로 끝나는 간단한 프로세스',
    description: (
      <div>
        <p>{'복잡한 설정이 필요 없습니다.'}</p>
        <p>{'공공기관 또는 네이버 카페에서 제공하는 부동산 정보 엑셀 파일을 '}<span className='font-bold'>{'다운로드'}</span>{' 받습니다.'}</p>
        <p>{'그리고 지지집에 '}<span className='font-bold'>{'업로드'}</span>{'만 하면 끝!'}</p>
      </div>
    ),
    imageSrc: '/images/landing-3.webp',
  },
];

export default function LandingPage() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % cards.length);
    }, 10000);

    return () => clearInterval(interval);
  }, [currentIndex, isPlaying]);

  const handlePausePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      setCurrentIndex((prev) => (prev + 1) % cards.length);
      setIsPlaying(true);
    }
  };

  const handleDotClick = (index: number) => {
    setCurrentIndex(index);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % cards.length);
  };

  const handleStartClick = () => {
    router.push('/map');
  };

  const handleHideToday = () => {
    setLandingPreference('hide-today');
    router.push('/map');
  };

  const handleNeverShow = () => {
    setLandingPreference('never-show');
    router.push('/map');
  };

  return (
    <div className='min-h-screen flex flex-col bg-gradient-to-br from-[#fafafa] to-[#f5f5f5] overflow-hidden'>
      <header className='fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[800px] p-8 z-10 backdrop-blur-md'>
        <div className="flex items-center gap-2 z-10">
          <Logo />
          <span className="flex flex-col font-bold text-stroke text-sub">
            {'지지집'}
            <span className="text-sm text-gray-1 mt-[-4px]">{'엑셀로 된 부동산 정보를 지도에 표출하세요'}</span>
          </span>
        </div>
      </header>

      <main className='flex-1 flex flex-col items-center justify-center px-6 pt-24 pb-8 max-w-[800px] mx-auto w-full'>
        <div className='relative w-full mb-12'>
          <div className='relative w-full h-[620px]'>
            {cards.map((card, index) => {
              const isActive = index === currentIndex;
              const isPrev = index === (currentIndex - 1 + cards.length) % cards.length;
              const isNext = index === (currentIndex + 1) % cards.length;

              let transformClass = '';
              let opacityClass = '';
              let zIndexClass = '';

              if (isActive) {
                transformClass = 'translate-x-0 scale-100';
                opacityClass = 'opacity-100';
                zIndexClass = 'z-30';
              } else if (isPrev) {
                transformClass = '-translate-x-[15%] scale-[0.92]';
                opacityClass = 'opacity-40';
                zIndexClass = 'z-20';
              } else if (isNext) {
                transformClass = 'translate-x-[15%] scale-[0.92]';
                opacityClass = 'opacity-40';
                zIndexClass = 'z-20';
              } else {
                transformClass = 'translate-x-0 scale-[0.85]';
                opacityClass = 'opacity-0';
                zIndexClass = 'z-10';
              }

              return (
                <div
                  key={card.id}
                  className={`absolute w-full h-full bg-white rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] transition-all duration-[600ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] overflow-hidden ${ transformClass } ${ opacityClass } ${ zIndexClass } ${ !isActive ? 'pointer-events-none' : '' }`}
                  style={{ transform: `${ transformClass } translateZ(${ isActive ? '0' : isPrev || isNext ? '-100px' : '-200px' })` }}
                >
                  <div className='absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#ff9447] via-[#ed6e13] to-[#dc5b00]' />
                  <div className='px-4 py-12 sm:p-8 h-full flex flex-col gap-3'>
                    <h2 className='text-xl font-bold text-main m-0'>
                      {card.title}
                    </h2>
                    <h3 className='text-lg font-bold text-primary m-0 leading-relaxed'>
                      {card.subtitle}
                    </h3>
                    <div className='max-h-[387px] bg-gray-10 rounded-2xl my-1 border border-gray-9'>
                      <Image src={card.imageSrc} alt={card.title} width="688" height="387" className='object-cover rounded-2xl' />
                    </div>
                    <div className='text-base leading-[1.8] text-sub'>
                      {card.description}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            className='absolute top-1/2 -translate-y-1/2 left-[-20px] lg:left-[-60px] w-12 h-12 rounded-full bg-white flex items-center justify-center cursor-pointer transition-all duration-300 z-40 text-gray-5 hover:bg-gradient-to-r hover:from-[#ff9447] hover:to-[#ed6e13] hover:border-transparent hover:text-white hover:scale-110 active:scale-95'
            onClick={handlePrev}
            aria-label='이전 카드'
          >
            <ChevronLeft className='w-6 h-6' />
          </button>

          <button
            className='absolute top-1/2 -translate-y-1/2 right-[-20px] lg:right-[-60px] w-12 h-12 rounded-full bg-white flex items-center justify-center cursor-pointer transition-all duration-300 z-40 text-gray-5 hover:bg-gradient-to-r hover:from-[#ff9447] hover:to-[#ed6e13] hover:border-transparent hover:text-white hover:scale-110 active:scale-95'
            onClick={handleNext}
            aria-label='다음 카드'
          >
            <ChevronRight className='w-6 h-6' />
          </button>

          <div className='flex items-center absolute bottom-[-50px] left-1/2 pr-2 -translate-x-1/2 gap-3 z-10'>
            {isPlaying ? (
              <button
                className='text-gray-6 hover:text-primary transition duration-300'
                onClick={handlePausePlay}
                aria-label='일시 정지'
              >
                <Pause className='size-4' />
              </button>
            )
              : (
                <button
                  className='text-primary hover:text-secondary transition duration-300'
                  onClick={handlePausePlay}
                  aria-label='재생'
                >
                  <Play className='size-4' />
                </button>
              )}
            {cards.map((_, index) => (
              <button
                key={`${ index }-${ index === currentIndex ? currentIndex : '' }`}
                className={`h-3 rounded-full border-none cursor-pointer transition-all duration-300 hover:bg-gray-5 hover:scale-110 ${ index === currentIndex ? `w-8 bg-gray-8 rounded-md progress-bar ${ !isPlaying ? 'paused' : '' }` : 'w-3 bg-gray-8' }`}
                onClick={() => handleDotClick(index)}
                aria-label={`${ index + 1 }번째 카드로 이동`}
              />
            ))}
          </div>
        </div>

        <button
          className='group w-full pl-2 py-5 text-xl font-bold text-white bg-gradient-to-r from-[#ff9447] via-[#ed6e13] to-[#dc5b00] border-none rounded-2xl cursor-pointer transition-all duration-300 flex items-center justify-center gap-3 shadow-[0_8px_24px_rgba(254,104,29,0.3)] mt-16 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(254,104,29,0.4)] active:translate-y-0'
          onClick={handleStartClick}
        >
          <span>{'지금 시작하기'}</span>
          <ArrowBigRight className='w-6 h-6 animate-slide-arrow' />
        </button>

        <div className='flex gap-4 mt-6 justify-center'>
          <button
            className='flex items-center gap-2 px-5 py-3 text-[0.95rem] font-medium text-gray-3 rounded-xl cursor-pointer transition-all duration-300 hover:text-primary active:scale-[0.98]'
            onClick={handleHideToday}
          >
            <CalendarCheck className='w-6 h-6' />
            <span>{'오늘은 그만 보기'}</span>
          </button>
          <button
            className='flex items-center gap-2 px-5 py-3 text-[0.95rem] font-medium text-gray-3 rounded-xl cursor-pointer transition-all duration-300 hover:text-primary active:scale-[0.98]'
            onClick={handleNeverShow}
          >
            <Trash2 className='w-6 h-6' />
            <span>{'다시 보지 않기'}</span>
          </button>
        </div>
      </main>

      <footer className='px-6 py-8 text-center max-w-[800px] mx-auto w-full'>
        <p className='text-sm text-gray-5 m-0'>{'© 2025 지지집. All rights reserved.'}</p>
      </footer>
    </div>
  );
}
