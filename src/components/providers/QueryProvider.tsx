'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import { useState } from 'react';
import { store } from '@/store';

export default function QueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // 클라이언트 컴포넌트에서 QueryClient 인스턴스 생성
  const [queryClient] = useState(() => new QueryClient());

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </Provider>
  );
}
