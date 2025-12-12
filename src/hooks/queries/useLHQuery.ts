import { useQuery } from '@tanstack/react-query';
import { LHApiResponse } from '@/types/lh';
import { useLHFilterStore } from '@/stores/useLHFilterStore';

export interface LHQueryFilters {
  region?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

const fetchLHNotices = async (filters: LHQueryFilters): Promise<LHApiResponse> => {
  const params = new URLSearchParams();

  if (filters.region) params.append('region', filters.region);
  if (filters.status) params.append('status', filters.status);
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);
  if (filters.search) params.append('search', filters.search);
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.pageSize) params.append('pageSize', filters.pageSize.toString());

  const queryString = params.toString();
  const url = queryString ? `/api/lh?${queryString}` : '/api/lh';

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('LH API 호출 실패');
  }

  return response.json();
};

export const useLHQuery = () => {
  // store에서 필터 상태 가져오기
  const { region, status, startDate, endDate, searchKeyword } = useLHFilterStore();

  const filters: LHQueryFilters = {
    region: region || undefined,
    status: status || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    search: searchKeyword || undefined,
  };

  return useQuery({
    queryKey: ['lh', 'notices', filters],
    queryFn: () => fetchLHNotices(filters),
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분 (이전 cacheTime)
    retry: 2,
  });
};
