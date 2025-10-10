'use client';

interface LoadingProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function Loading({ message = '로딩 중...', size = 'md' }: LoadingProps) {
  const dotSizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-6">
      <div className="relative">
        {/* Outer gradient rotating ring with glow */}
        <div className="size-16 rounded-full ">
          <div className="w-full h-full bg-white rounded-full" />
        </div>

        {/* Multiple orbiting dots */}
        <div className="absolute inset-0 animate-spin" style={{ animationDuration: '1.5s' }}>
          <div className={`absolute top-0 left-1/2 -translate-x-1/2 ${ dotSizeClasses[size] } bg-primary rounded-full shadow-lg`} />
        </div>
        <div className="absolute inset-0 animate-spin" style={{ animationDuration: '2.5s' }}>
          <div className={`absolute top-0 left-1/2 -translate-x-1/2 ${ dotSizeClasses[size] } bg-primary rounded-full shadow-lg opacity-70`} />
        </div>
        <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3.5s' }}>
          <div className={`absolute top-0 left-1/2 -translate-x-1/2 ${ dotSizeClasses[size] } bg-primary rounded-full shadow-lg opacity-40`} />
        </div>
      </div>

      {message && (
        <div className="flex items-center gap-2">
          <p className={`${ textSizeClasses[size] } font-semibold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent`}>
            {message}
          </p>
          <div className="flex gap-1">
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      )}
    </div>
  );
}
