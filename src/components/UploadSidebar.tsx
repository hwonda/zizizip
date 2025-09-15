'use client';

import { useState } from 'react';
import { LocationData, UploadResponse } from '@/types';

interface UploadSidebarProps {
  onDataUploaded?: (data: LocationData[])=> void;
}

export default function UploadSidebar({ onDataUploaded }: UploadSidebarProps) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

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
        // 업로드 성공 시 데이터를 세션 스토리지에 저장
        console.log('데이터를 세션 스토리지에 저장 중...');
        sessionStorage.setItem('locationData', JSON.stringify(data.data));

        // 부모 컴포넌트에 데이터가 업로드되었음을 알림
        if (onDataUploaded) {
          console.log('부모 컴포넌트에 데이터 전달 중...');
          onDataUploaded(data.data);

          // 데이터 업데이트 후 지도 강제 업데이트를 위한 이벤트 발생
          console.log('지도 업데이트 이벤트 발생');
          window.dispatchEvent(new CustomEvent('locationDataUpdated', { detail: data.data }));
        } else {
          console.warn('onDataUploaded 콜백이 제공되지 않았습니다.');
        }
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

  return (
    <div className="bg-white p-4 shadow-md h-full overflow-auto">
      <h2 className="text-xl font-bold mb-4 text-black">{'CSV 파일 업로드'}</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
          <label className="block">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="flex flex-col items-center cursor-pointer">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <span className="mt-2 text-sm text-gray-600">
                {file ? file.name : 'CSV 파일 선택'}
              </span>
              <span className="mt-1 text-xs text-gray-500">
                {'(name, address, price 컬럼 필요)'}
              </span>
            </div>
          </label>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-2 rounded-md text-xs">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={!file || isUploading}
          className={`w-full px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition text-sm ${
            (!file || isUploading) ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isUploading ? '업로드 중...' : '업로드'}
        </button>
      </form>

      {isUploading && (
        <div className="mt-4 text-center text-xs text-gray-600">
          {'파일을 업로드하고 지오코딩 처리 중입니다...'}
        </div>
      )}
    </div>
  );
}
