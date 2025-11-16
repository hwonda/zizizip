import { useQuery } from '@tanstack/react-query';
import { LHApiResponse } from '@/types/lh';

const fetchLHNotices = async (): Promise<LHApiResponse> => {
  const response = await fetch('/api/lh');

  if (!response.ok) {
    throw new Error('LH API 호출 실패');
  }

  return response.json();
};

export const useLHQuery = () => {
  return useQuery({
    queryKey: ['lh', 'notices'],
    queryFn: fetchLHNotices,
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분 (이전 cacheTime)
    retry: 2,
  });
};
