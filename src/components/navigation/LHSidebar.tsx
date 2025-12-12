'use client';

import { useState, useCallback } from 'react';
import { useLHQuery } from '@/hooks/queries/useLHQuery';
import { usePublicHousingStore } from '@/stores/usePublicHousingStore';
import { useLHFilterStore } from '@/stores/useLHFilterStore';
import { LH_REGION_CODES, LH_STATUS_CODES } from '@/constants/lhCodes';
import { ChevronDown, ChevronUp, RotateCcw, ExternalLink } from 'lucide-react';
import {
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment,
  ThemeProvider,
  createTheme,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

// MUI 테마 커스터마이징 (globals.scss 색상 참고)
const muiTheme = createTheme({
  palette: {
    primary: {
      main: 'rgb(254, 104, 29)', // --primary-color
    },
    secondary: {
      main: 'rgb(255, 160, 36)', // --secondary-color
    },
  },
  components: {
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem',
          backgroundColor: 'var(--gray-9)',
          borderRadius: '8px',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'var(--gray-7)',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'var(--gray-5)',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: 'var(--primary-color)',
          },
        },
        input: {
          color: 'var(--text-sub-color)',
          padding: '10px 14px',
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem',
          color: 'var(--gray-3)',
          '&.Mui-focused': {
            color: 'var(--primary-color)',
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        select: {
          color: 'var(--text-sub-color)',
        },
        icon: {
          color: 'var(--gray-4)',
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem',
          '&.Mui-selected': {
            backgroundColor: 'rgba(254, 104, 29, 0.1)',
          },
          '&.Mui-selected:hover': {
            backgroundColor: 'rgba(254, 104, 29, 0.2)',
          },
        },
      },
    },
  },
});

// 디바운스 훅
function useDebounce<T extends (...args: Parameters<T>)=> void>(
  callback: T,
  delay: number,
): (...args: Parameters<T>)=> void {
  const [timeoutId, setTimeoutId] = useState<ReturnType<typeof setTimeout> | null>(null);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      const newTimeoutId = setTimeout(() => {
        callback(...args);
      }, delay);
      setTimeoutId(newTimeoutId);
    },
    [callback, delay, timeoutId],
  );
}

export default function LHSidebar() {
  const { data, isLoading, error, refetch } = useLHQuery();
  const { selectedLH, toggleSelection, isSelected, selectAll, clearSelections } = usePublicHousingStore();
  const {
    region,
    status,
    searchKeyword,
    setRegion,
    setStatus,
    setSearchKeyword,
    resetFilters,
  } = useLHFilterStore();

  const [isFilterOpen, setIsFilterOpen] = useState(true);
  const [localSearchKeyword, setLocalSearchKeyword] = useState(searchKeyword);

  const notices = data?.dsList || [];

  // 디바운스된 검색
  const debouncedSearch = useDebounce((value: string) => {
    setSearchKeyword(value);
  }, 500);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalSearchKeyword(value);
    debouncedSearch(value);
  };

  const handleSelectAll = () => {
    if (selectedLH.size === notices.length) {
      clearSelections('LH');
    } else {
      selectAll('LH', notices.map((notice) => notice.PAN_ID));
    }
  };

  const handleResetFilters = () => {
    resetFilters();
    setLocalSearchKeyword('');
  };

  return (
    <ThemeProvider theme={muiTheme}>
      <div className="w-full bg-background rounded-lg shadow-lg flex flex-col max-h-[calc(100vh-200px)]">
        {/* Header with Filter Toggle */}
        <div className="p-4 border-b border-gray-8">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sub">{'LH 공고'}</h3>
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center gap-1 text-xs text-gray-3 hover:text-accent-1 transition"
            >
              {'필터'}
              {isFilterOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>

          {/* Filter Section */}
          {isFilterOpen && (
            <div className="mt-4 flex flex-col gap-4">
              {/* 지역 & 상태 필터 (2분할) */}
              <div className="grid grid-cols-2 gap-2 w-full">
                {/* 지역 필터 */}
                <FormControl fullWidth size="small">
                  <InputLabel id="region-label">{'지역'}</InputLabel>
                  <Select
                    labelId="region-label"
                    value={region}
                    label="지역"
                    onChange={(e) => setRegion(e.target.value as typeof region)}
                  >
                    {LH_REGION_CODES.map((item) => (
                      <MenuItem key={item.code} value={item.code}>
                        {item.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* 상태 필터 */}
                <FormControl fullWidth size="small">
                  <InputLabel id="status-label">{'상태'}</InputLabel>
                  <Select
                    labelId="status-label"
                    value={status}
                    label="상태"
                    onChange={(e) => setStatus(e.target.value as typeof status)}
                  >
                    {LH_STATUS_CODES.map((item) => (
                      <MenuItem key={item.code} value={item.code}>
                        {item.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </div>

              {/* 검색어 */}
              <div className="flex flex-col gap-2 w-full">
                <TextField
                  fullWidth
                  size="small"
                  label="검색어"
                  placeholder="공고명을 입력하여 바로 검색"
                  value={localSearchKeyword}
                  onChange={handleSearchChange}
                  style={{ backgroundColor: 'black' }}
                  sx={{ borderRadius: '8px' }}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ color: 'var(--gray-5)', fontSize: 20 }} />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </div>

              {/* 필터 초기화 버튼 */}
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-1 text-xs text-gray-4 hover:text-accent-1 transition self-start"
              >
                <RotateCcw size={12} />
                {'필터 초기화'}
              </button>
            </div>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex-1 flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-1" />
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="p-4">
            <p className="text-red-500 text-sm">{'LH 공고 로딩 실패'}</p>
            <p className="text-gray-3 text-xs mt-1">{error.message}</p>
            <button
              onClick={() => refetch()}
              className="mt-2 text-xs text-accent-1 hover:underline"
            >
              {'다시 시도'}
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && notices.length === 0 && (
          <div className="p-4">
            <p className="text-gray-3 text-sm">{'조건에 맞는 LH 공고가 없습니다.'}</p>
            <button
              onClick={handleResetFilters}
              className="mt-2 text-xs text-accent-1 hover:underline"
            >
              {'필터 초기화하기'}
            </button>
          </div>
        )}

        {/* Notice List */}
        {!isLoading && !error && notices.length > 0 && (
          <>
            {/* List Header */}
            <div className="px-4 py-2 border-b border-gray-9 flex items-center justify-between">
              <span className="text-xs text-gray-3">{`총 ${ notices.length }건`}</span>
              <button
                onClick={handleSelectAll}
                className="text-xs text-accent-1 hover:underline"
              >
                {selectedLH.size === notices.length ? '전체 해제' : '전체 선택'}
              </button>
            </div>

            {/* List Content */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {notices.map((notice) => {
                const selected = isSelected('LH', notice.PAN_ID);

                return (
                  <div
                    key={notice.PAN_ID}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selected
                        ? 'border-accent-1 bg-accent-1/5'
                        : 'border-gray-8 hover:border-gray-3'
                    }`}
                    onClick={() => toggleSelection('LH', notice.PAN_ID)}
                  >
                    <div className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleSelection('LH', notice.PAN_ID)}
                        className="mt-1 cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-sub line-clamp-2">
                          {notice.PAN_NM}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-gray-3">
                            {`${ notice.PAN_NT_ST_DT } ~ ${ notice.CLSG_DT }`}
                          </p>
                          {notice.CNP_CD_NM && (
                            <span className="text-xs text-gray-4">
                              {notice.CNP_CD_NM}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          {notice.AIS_TP_CD_NM && (
                            <span className="inline-block px-2 py-0.5 text-xs bg-gray-8 text-gray-1 rounded">
                              {notice.AIS_TP_CD_NM}
                            </span>
                          )}
                          {notice.PAN_SS && (
                            <span
                              className={`inline-block px-2 py-0.5 text-xs rounded ${
                                notice.PAN_SS === '공고중' || notice.PAN_SS === '접수중'
                                  ? 'bg-accent-1/20 text-accent-1'
                                  : 'bg-gray-7 text-gray-3'
                              }`}
                            >
                              {notice.PAN_SS}
                            </span>
                          )}
                        </div>
                        {notice.DTL_URL && (
                          <a
                            href={notice.DTL_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 mt-2 text-xs text-accent-1 hover:underline"
                          >
                            {'상세보기'}
                            <ExternalLink size={10} />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-9">
              <p className="text-xs text-gray-3">
                {`선택된 공고: ${ selectedLH.size }개`}
              </p>
            </div>
          </>
        )}
      </div>
    </ThemeProvider>
  );
}
