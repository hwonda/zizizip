'use client';

import { useState, useEffect } from 'react';
import { UploadResponse, ExtendedLocationData } from '@/types';
import { useDatasetManager } from '@/hooks/useDatasetManager';
import { Upload, X } from 'lucide-react';
import MapPinIcon from '@/components/icons/MapPinIcon';
import {
  validateUploadResult,
  validateFileSize,
  validateFileFormat,
  validateFileName,
  validateDuplicateFile,
  validateCSVContent,
  validateUploadLimit,
} from '@/utils/fileValidation';

// LoadingDots 컴포넌트
function LoadingDots() {
  const [dots, setDots] = useState('.');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev === '...') return '.';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return <span>{dots}</span>;
}

interface UploadSidebarProps {
  onDataUploaded?: (data: ExtendedLocationData[])=> void;
}

export default function UploadSidebar({ onDataUploaded }: UploadSidebarProps) {
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [loadingStage, setLoadingStage] = useState<'validating' | 'parsing' | 'geocoding' | 'finalizing' | null>(null);
  const [progress, setProgress] = useState(0);

  // 데이터셋 관리 훅 사용
  const {
    datasets,
    selectedIds,
    addDataset,
    toggleDataset,
    removeDataset,
    toggleAllDatasets,
    getSelectedData,
    getDatasetStats,
    isSelected,
    selectedCount,
    totalDatasets,
    hasDatasets,
  } = useDatasetManager();

  // 데이터셋이나 선택 상태가 변경될 때마다 지도 업데이트 (빈 배열도 포함)
  useEffect(() => {
    if (onDataUploaded) {
      const selectedData = getSelectedData();
      console.log('데이터셋 상태 변화 감지, 지도 업데이트:', selectedData.length);
      onDataUploaded(selectedData);
      window.dispatchEvent(new CustomEvent('locationDataUpdated', { detail: selectedData }));
    }
  }, [datasets, selectedIds, getSelectedData, onDataUploaded]);

  // 파일 업로드 함수
  const uploadFile = async (formData: FormData, fileName: string) => {
    console.log('파일 업로드 시작');
    setLoadingStage('parsing');
    setProgress(30);

    try {
      console.log('API 요청 전송 중...');
      setLoadingStage('geocoding');
      setProgress(50);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        console.error(`API 응답 오류: ${ response.status } ${ response.statusText }`);
        throw new Error(`서버 오류 (${ response.status }): 업로드에 실패했습니다.`);
      }

      console.log('API 응답 수신 완료, 데이터 파싱 중...');
      setProgress(80);

      const data: UploadResponse = await response.json();
      console.log(`API 응답 성공 여부: ${ data.success }, 데이터 항목 수: ${ data.data?.length || 0 }`);

      if (data.data) {
        console.log('첫 번째 데이터 항목:', data.data[0]);

        // 좌표 데이터가 있는지 확인
        const validLocations = data.data.filter((loc) => loc.lat && loc.lon);
        console.log(`유효한 좌표가 있는 위치 데이터: ${ validLocations.length }/${ data.data.length }`);
      }

      if (data.success && data.data) {
        setLoadingStage('finalizing');
        setProgress(90);

        // 업로드 결과 validation
        const validationResult = validateUploadResult(data.data);

        if (!validationResult.isValid) {
          setError(validationResult.error);
          return;
        }

        // 새로운 데이터셋 추가 (파일명에서 확장자 제거하여 데이터셋 이름으로 사용)
        const datasetName = fileName.replace('.csv', '');
        console.log(`새 데이터셋 추가: ${ datasetName }, 유효 데이터: ${ validationResult.validCount }/${ data.data.length }`);
        addDataset(data.data, datasetName);

        setProgress(100);

        // 성공 메시지 (잠시 표출 후 자동 사라짐)
        if (validationResult.warnings.length > 0) {
          const warningMsg = `업로드 완료! 경고: ${ validationResult.warnings.join(', ') }`;
          setError(warningMsg);
          setTimeout(() => setError(null), 5000);
        }

        // Note: 지도 업데이트는 useEffect에서 자동으로 처리됩니다
      } else {
        setError(data.error || '업로드 중 오류가 발생했습니다.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류';
      console.error('업로드 중 예외 발생:', errorMessage);
      setError(`업로드 실패: ${ errorMessage }`);
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setLoadingStage(null);
        setProgress(0);
      }, 500);
      console.log('파일 업로드 과정 완료');
    }
  };

  // 공통 파일 처리 함수
  const processFile = async (selectedFile: File) => {
    // 로딩 상태 시작
    setIsUploading(true);
    setLoadingStage('validating');
    setProgress(10);
    setError(null);

    try {
      // 각종 validation 체크
      const validationChecks = [
        () => validateUploadLimit(datasets.length),
        () => validateFileSize(selectedFile),
        () => validateFileFormat(selectedFile.name),
        () => validateFileName(selectedFile.name),
        () => validateDuplicateFile(selectedFile.name, datasets),
      ];

      // 동기 validation 체크
      for (const check of validationChecks) {
        const error = check();
        if (error) {
          setError(error);
          setIsUploading(false);
          setLoadingStage(null);
          setProgress(0);
          return;
        }
      }

      setProgress(20);

      // 비동기 CSV 내용 검증
      const csvError = await validateCSVContent(selectedFile);
      if (csvError) {
        setError(csvError);
        setIsUploading(false);
        setLoadingStage(null);
        setProgress(0);
        return;
      }

      const formData = new FormData();
      formData.append('file', selectedFile);
      await uploadFile(formData, selectedFile.name);
    } catch (err) {
      setError('파일 처리 중 오류가 발생했습니다.');
      console.warn(err);
      setIsUploading(false);
      setLoadingStage(null);
      setProgress(0);
    }
  };

  // 파일 선택 핸들러 - 즉시 업로드
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];

    // 파일 입력 초기화 (같은 파일을 다시 선택할 수 있도록)
    e.target.value = '';

    if (!selectedFile) return;

    await processFile(selectedFile);
  };

  // 드래그 앤 드롭 핸들러들
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragOver) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // 드래그 영역을 완전히 벗어났을 때만 상태 변경
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragOver(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const supportedFile = files.find((file) =>
      file.name.endsWith('.csv')
      || file.name.endsWith('.xlsx')
      || file.name.endsWith('.xls'),
    );

    if (!supportedFile) {
      setError('CSV 또는 Excel 파일(.xlsx, .xls)만 업로드 가능합니다.');
      return;
    }

    if (files.length > 1) {
      setError('한 번에 하나의 파일만 업로드할 수 있습니다.');
      return;
    }

    await processFile(supportedFile);
  };

  // 데이터셋 선택 변경 시 지도 업데이트
  const handleDatasetToggle = (datasetId: string) => {
    toggleDataset(datasetId);
  };

  // 데이터셋 삭제 핸들러
  const handleDatasetRemove = (datasetId: string) => {
    removeDataset(datasetId);
  };

  // 모든 데이터셋 선택/해제 핸들러
  const handleToggleAll = () => {
    const shouldSelectAll = selectedCount < totalDatasets;
    toggleAllDatasets(shouldSelectAll);
  };

  return (
    <div className="h-full bg-background/90 transition p-2 rounded-lg shadow-xl">
      <h2 className="sr-only">{'엑셀(CSV, Excel) 파일 업로드'}</h2>

      {/* 파일 업로드 영역 */}
      <div className="space-y-4">
        <div
          className={`group border border-dashed rounded-lg p-4 text-center transition-all duration-200 hover:bg-secondary/10 hover:border-secondary ${
            datasets.length >= 3
              ? 'opacity-50 cursor-not-allowed border-gray-7'
              : isDragOver
                ? 'border-primary bg-primary/5 cursor-pointer'
                : isUploading
                  ? 'border-secondary cursor-pointer'
                  : 'border-gray-7 cursor-pointer'
          }`}
          onDragOver={datasets.length < 3 && !isUploading ? handleDragOver : undefined}
          onDragLeave={datasets.length < 3 && !isUploading ? handleDragLeave : undefined}
          onDrop={datasets.length < 3 && !isUploading ? handleDrop : undefined}
        >
          <label className="block">
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
              disabled={datasets.length >= 3 || isUploading}
            />
            {!isUploading ? (
              <div className="flex flex-col items-center cursor-pointer">
                <Upload className={`w-6 h-6 transition-colors ${
                  isDragOver
                    ? 'text-primary'
                    : 'text-gray-1 group-hover:text-primary'
                }`}
                />
                <span className={`mt-2 text-sm transition-colors ${
                  isDragOver
                    ? 'text-primary font-medium'
                    : 'text-gray-1 group-hover:text-primary'
                }`}
                >
                  {datasets.length >= 3
                    ? '파일 업로드 제한 (최대 3개)'
                    : 'CSV 또는 Excel 파일 선택'
                  }
                </span>
                <span className="text-xs text-gray-5 group-hover:text-primary transition duration-200">
                  {'파일을 드래그하거나 클릭하여 선택하세요'}
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                {/* Progress bar */}
                <div className="w-full mb-3">
                  <div className="relative w-full h-2 bg-[rgb(235,235,235)] rounded-full overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full transition-all duration-300 ease-out"
                      style={{
                        width: `${ progress }%`,
                        background: 'linear-gradient(90deg, rgb(254,104,29), rgb(255,160,36))',
                      }}
                    />
                  </div>
                  <div className="mt-1 text-right text-xs text-[rgb(115,115,115)]">
                    {progress}{'%'}
                  </div>
                </div>

                {/* Loading message */}
                <div className="text-center">
                  <p className="text-sm font-medium text-[rgb(254,104,29)]">
                    {loadingStage === 'validating' && '파일 검증 중'}
                    {loadingStage === 'parsing' && '파일 파싱 중'}
                    {loadingStage === 'geocoding' && '주소 변환 중'}
                    {loadingStage === 'finalizing' && '마무리 중'}
                    <LoadingDots />
                  </p>
                  <p className="mt-1 text-xs text-[rgb(115,115,115)]">
                    {loadingStage === 'validating' && '파일 형식과 헤더를 확인하고 있어요'}
                    {loadingStage === 'parsing' && '데이터를 읽어들이고 있어요'}
                    {loadingStage === 'geocoding' && '주소를 좌표로 변환하고 있어요'}
                    {loadingStage === 'finalizing' && '데이터셋을 준비하고 있어요'}
                  </p>
                </div>
              </div>
            )}
          </label>
        </div>

        {error && (
          <div className={`p-2 rounded-md text-xs ${
            error.startsWith('업로드 완료!')
              ? 'bg-success/10 text-success border border-success/20'
              : 'bg-error/10 text-error border border-error/20'
          }`}
          >
            {error}
          </div>
        )}
      </div>

      {/* 데이터셋 관리 섹션 */}
      {hasDatasets && (
        <div className="flex flex-col mt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-1">
              {'목록'}{' ['}{selectedCount}{'/'}{totalDatasets}{']'}
            </h3>
            {totalDatasets > 1 && (
              <button
                onClick={handleToggleAll}
                className="text-xs px-2 py-1 text-gray-4 hover:text-gray-1 rounded transition"
              >
                {selectedCount === totalDatasets ? '전체 해제' : '전체 선택'}
              </button>
            )}
          </div>
          <span className="text-xs text-gray-5 mb-2">
            {'최대 3개까지 업로드 가능합니다.'}
          </span>

          <div className="space-y-2">
            {datasets.map((dataset) => {
              const stats = getDatasetStats(dataset.id);
              const selected = isSelected(dataset.id);

              return (
                <div
                  key={dataset.id}
                  className={`p-3 border rounded-lg transition hover:bg-secondary/10 ${
                    selected ? 'border-primary' : 'border-gray-8'
                  } hover:border-secondary`}
                >
                  <div className="flex items-start justify-between">
                    <label className="flex flex-col cursor-pointer flex-1">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => handleDatasetToggle(dataset.id)}
                          className="h-4 w-4 text-primary rounded focus:ring-primary"
                        />
                        <div className="flex flex-1 items-center gap-1">
                          <MapPinIcon
                            color={dataset.color}
                            size={16}
                            className="shrink-0"
                          />
                          <span className="font-medium text-sm text-gray-1 w-[164px] truncate line-clamp-1">
                            {dataset.name}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDatasetRemove(dataset.id)}
                          className="text-error hover:text-error transition"
                          title="데이터셋 삭제"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex-1 ml-6">
                        {stats && (
                          <div className="mt-1 text-xs text-sub">
                            {'업로드 지점'}{' | '}{'총'} {stats.totalItems}{'개'}
                          </div>
                        )}
                        <div className="text-xs text-sub mt-1">
                          {'업로드 시간'}{' | '}
                          {dataset.uploadedAt.toLocaleDateString('ko-KR', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              );
            })}
          </div>

          {selectedCount === 0 && (
            <div className="mt-2 text-center text-xs text-secondary">
              {'표출할 데이터셋을 선택해주세요'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
