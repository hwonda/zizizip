'use client';

import { useState, useEffect } from 'react';
import { UploadResponse, ExtendedLocationData } from '@/types';
import { useDatasetManager } from '@/hooks/useDatasetManager';
import { Upload, File, X } from 'lucide-react';
import {
  validateUploadResult,
  validateFileSize,
  validateFileFormat,
  validateFileName,
  validateDuplicateFile,
  validateCSVContent,
  validateUploadLimit,
} from '@/utils/fileValidation';

interface UploadSidebarProps {
  onDataUploaded?: (data: ExtendedLocationData[])=> void;
}

export default function UploadSidebar({ onDataUploaded }: UploadSidebarProps) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

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
    setIsUploading(true);
    setError(null);

    try {
      console.log('API 요청 전송 중...');
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        console.error(`API 응답 오류: ${ response.status } ${ response.statusText }`);
        throw new Error(`서버 오류 (${ response.status }): 업로드에 실패했습니다.`);
      }

      console.log('API 응답 수신 완료, 데이터 파싱 중...');
      const data: UploadResponse = await response.json();
      console.log(`API 응답 성공 여부: ${ data.success }, 데이터 항목 수: ${ data.data?.length || 0 }`);

      if (data.data) {
        console.log('첫 번째 데이터 항목:', data.data[0]);

        // 좌표 데이터가 있는지 확인
        const validLocations = data.data.filter((loc) => loc.lat && loc.lon);
        console.log(`유효한 좌표가 있는 위치 데이터: ${ validLocations.length }/${ data.data.length }`);
      }

      if (data.success && data.data) {
        // 업로드 결과 validation
        const validationResult = validateUploadResult(data.data);

        if (!validationResult.isValid) {
          setError(validationResult.error);
          setFile(null);
          return;
        }

        // 새로운 데이터셋 추가 (파일명에서 확장자 제거하여 데이터셋 이름으로 사용)
        const datasetName = fileName.replace('.csv', '');
        console.log(`새 데이터셋 추가: ${ datasetName }, 유효 데이터: ${ validationResult.validCount }/${ data.data.length }`);
        addDataset(data.data, datasetName);

        // 파일 입력 초기화
        setFile(null);

        // 성공 메시지 (잠시 표시 후 자동 사라짐)
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
      setIsUploading(false);
      console.log('파일 업로드 과정 완료');
    }
  };

  // 파일 선택 핸들러 - 즉시 업로드
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];

    // 파일 입력 초기화 (같은 파일을 다시 선택할 수 있도록)
    e.target.value = '';

    if (!selectedFile) return;

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
        return;
      }
    }

    // 비동기 CSV 내용 검증
    const csvError = await validateCSVContent(selectedFile);
    if (csvError) {
      setError(csvError);
      return;
    }

    // 검증 통과 시 즉시 업로드
    setFile(selectedFile);
    setError(null);

    const formData = new FormData();
    formData.append('file', selectedFile);
    await uploadFile(formData, selectedFile.name);
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
    <div className="h-full overflow-auto">
      <h2 className="sr-only">{'CSV 파일 업로드'}</h2>

      {/* 파일 업로드 영역 */}
      <div className="space-y-4">
        <div className={`group border border-dashed border-gray-7 rounded-lg p-4 text-center ${ datasets.length >= 3 ? 'opacity-50 cursor-not-allowed' : 'hover:border-secondary cursor-pointer' } ${ isUploading ? 'border-secondary' : '' }`}>
          <label className="block">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              disabled={datasets.length >= 3 || isUploading}
            />
            <div className="flex flex-col items-center cursor-pointer">
              <Upload className={`w-6 h-6 ${ isUploading ? 'text-secondary animate-pulse' : 'text-gray-1' } group-hover:text-secondary`} />
              <span className={`mt-2 text-sm ${ isUploading ? 'text-secondary' : 'text-gray-1' } group-hover:text-secondary`}>
                {isUploading
                  ? `${ file?.name ?? '' } 업로드 중...`
                  : datasets.length >= 3
                    ? '파일 업로드 제한 (최대 3개)'
                    : 'CSV 파일 선택 (자동 업로드)'
                }
              </span>
            </div>
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

      {isUploading && (
        <div className="mt-4 text-center text-xs text-sub">
          {'파일을 업로드하고 지오코딩 처리 중입니다...'}
        </div>
      )}

      {/* 데이터셋 관리 섹션 */}
      {hasDatasets && (
        <div className="mt-6 border-t border-gray-8 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sub">
              {'목록'}{' ('}{selectedCount}{'/'}{totalDatasets}{')'}
            </h3>
            {totalDatasets > 1 && (
              <button
                onClick={handleToggleAll}
                className="text-xs px-2 py-1 bg-background-10 hover:bg-background-20 rounded transition"
              >
                {selectedCount === totalDatasets ? '전체 해제' : '전체 선택'}
              </button>
            )}
          </div>

          <div className="space-y-2">
            {datasets.map((dataset) => {
              const stats = getDatasetStats(dataset.id);
              const selected = isSelected(dataset.id);

              return (
                <div
                  key={dataset.id}
                  className={`p-3 border rounded-lg transition ${
                    selected ? 'border-primary bg-background-10' : 'border-background-20 bg-background'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <label className="flex items-start space-x-2 cursor-pointer flex-1">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => handleDatasetToggle(dataset.id)}
                        className="mt-1 h-4 w-4 text-primary rounded focus:ring-primary"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: dataset.color }}
                          />
                          <span className="font-medium text-sm text-gray-1">
                            {dataset.name}
                          </span>
                        </div>
                        {stats && (
                          <div className="mt-1 text-xs text-sub">
                            {'총'} {stats.totalItems}{'개'}{' | '}{'유효 좌표'} {stats.validCoordinates}{'개'}
                            {stats.averagePrice > 0 && (
                              <>{' | '}{'평균'} {Math.round(stats.averagePrice / 10000)}{'만원'}</>
                            )}
                          </div>
                        )}
                        <div className="text-xs text-sub mt-1">
                          {dataset.uploadedAt.toLocaleDateString('ko-KR', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    </label>

                    <button
                      onClick={() => handleDatasetRemove(dataset.id)}
                      className="ml-2 text-error hover:text-error transition"
                      title="데이터셋 삭제"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {selectedCount === 0 && (
            <div className="mt-3 text-center text-sm text-sub">
              {'표시할 데이터셋을 선택해주세요'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
