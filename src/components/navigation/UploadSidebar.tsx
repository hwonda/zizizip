'use client';

import { useState, useEffect } from 'react';
import { UploadResponse, ExtendedLocationData } from '@/types';
import { useDatasetManager } from '@/hooks/useDatasetManager';
import { Upload, File, X } from 'lucide-react';

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
  const uploadFile = async (formData: FormData) => {
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
        throw new Error('Upload failed');
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
        // 새로운 데이터셋 추가 (파일명에서 확장자 제거하여 데이터셋 이름으로 사용)
        const datasetName = file?.name?.replace('.csv', '') || `데이터셋 ${ datasets.length + 1 }`;
        console.log(`새 데이터셋 추가: ${ datasetName }`);
        addDataset(data.data, datasetName);

        // 파일 입력 초기화
        setFile(null);

        // Note: 지도 업데이트는 useEffect에서 자동으로 처리됩니다
      } else {
        console.error('API 응답에 오류가 있습니다:', data.error);
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

  // 파일 선택 핸들러
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        setError('CSV 파일만 업로드 가능합니다.');
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  // 제출 핸들러
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setError('파일을 선택해주세요.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    uploadFile(formData);
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
      <h2 className="text-sm font-bold mb-4 text-black">{'CSV 파일 업로드'}</h2>

      {/* 파일 업로드 폼 */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className={`border border-dashed border-gray-7 rounded-lg p-4 text-center hover:border-secondary ${ (isUploading || file) ? 'border-secondary' : '' }`}>
          <label className="block">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="flex flex-col items-center cursor-pointer">
              {!file || isUploading ? (
                <Upload className="w-6 h-6 text-gray-7" />
              ) : (
                <>
                  <File className="w-6 h-6 text-secondary" />
                </>
              )}
              <span className={`mt-2 text-sm ${ file ? 'text-primary' : 'text-gray-7' }`}>
                {file ? file.name : 'CSV 파일 선택'}
              </span>
            </div>
          </label>
        </div>

        {error && (
          <div className="bg-error text-white p-2 rounded-md text-xs">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={!file || isUploading}
          className={`w-full px-3 py-2 bg-primary text-white rounded-md hover:bg-secondary transition text-sm ${
            !file ? 'hidden' : ''
          }`}
        >
          {isUploading ? `${ file?.name ?? '' } 파일 업로드 중...` : '업로드'}
        </button>
      </form>

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
