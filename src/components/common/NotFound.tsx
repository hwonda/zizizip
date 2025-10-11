'use client';

import { useRouter } from 'next/navigation';
import { Home, ArrowLeft } from 'lucide-react';

interface NotFoundProps {
  title?: string;
  message?: string;
}

export default function NotFound({
  title = '페이지를 찾을 수 없습니다',
  message = '요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.',
}: NotFoundProps) {
  const router = useRouter();

  const handleGoHome = () => {
    router.push('/');
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-gray-10">
      <div className="w-full text-center">
        <div className="mb-8">
          <h1 className="text-[180px] sm:text-[240px] font-bold bg-gradient-to-br from-primary via-secondary to-primary bg-clip-text text-transparent opacity-20 leading-none select-none">
            {'404'}
          </h1>
        </div>

        <div className="space-y-4 mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-main">
            {title}
          </h2>
          <p className="text-base sm:text-lg text-gray-3 mx-auto leading-relaxed">
            {message}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center" style={{ animationDelay: '0.2s' }}>
          <button
            onClick={handleGoBack}
            className="group flex items-center gap-3 px-6 py-3 bg-white border-2 border-gray-8 text-gray-1 font-semibold rounded-xl hover:border-primary hover:text-primary transition-all duration-300"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
            <span>{'이전 페이지'}</span>
          </button>
          <button
            onClick={handleGoHome}
            className="group flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
          >
            <Home className="w-5 h-5" />
            <span>{'홈으로 가기'}</span>
          </button>
        </div>

        <div className="mt-16 flex justify-center gap-2 opacity-30">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}
