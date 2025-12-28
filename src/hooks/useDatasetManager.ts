'use client';

import { useState, useEffect, useCallback } from 'react';
import { LocationData, LocationDataset, ExtendedLocationData } from '@/types';

// 데이터셋별 색상 팔레트
const dataColors = [
  '#9b59b6', // 보라
  '#34495e', // 회색
  '#e74c3c', // 빨강
  '#f39c12', // 주황
  '#3498db', // 파랑
  '#2ecc71', // 초록
];

interface DatasetManagerState {
  datasets: LocationDataset[];
  selectedIds: string[];
}

const storageKey = 'location-datasets';

export const useDatasetManager = () => {
  const [datasets, setDatasets] = useState<LocationDataset[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Session Storage에서 데이터 로드
  const loadFromStorage = useCallback(() => {
    try {
      const saved = sessionStorage.getItem(storageKey);
      if (saved) {
        const { datasets: savedDatasets, selectedIds: savedSelectedIds }: DatasetManagerState = JSON.parse(saved);

        // Date 객체 복원
        const restoredDatasets = savedDatasets.map((dataset) => ({
          ...dataset,
          uploadedAt: new Date(dataset.uploadedAt),
        }));

        setDatasets(restoredDatasets);
        setSelectedIds(savedSelectedIds || []);
      }
    } catch (error) {
      console.error('데이터셋 로드 실패:', error);
      // 오류 시 초기화
      setDatasets([]);
      setSelectedIds([]);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Session Storage에 데이터 저장 (useCallback 제거)
  const saveToStorage = (datasetsToSave: LocationDataset[], selectedIdsToSave: string[]) => {
    try {
      const dataToSave: DatasetManagerState = {
        datasets: datasetsToSave,
        selectedIds: selectedIdsToSave,
      };
      sessionStorage.setItem(storageKey, JSON.stringify(dataToSave));
    } catch (error) {
      console.error('데이터셋 저장 실패:', error);
    }
  };

  // 초기 로드
  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  // 상태 변경시 Session Storage 동기화 (초기화 완료 후에만)
  useEffect(() => {
    if (isInitialized) {
      // 빈 배열도 저장하여 삭제 상태를 올바르게 반영
      saveToStorage(datasets, selectedIds);
    }
  }, [datasets, selectedIds, isInitialized]);

  // 사용 가능한 색상 찾기
  const getAvailableColor = useCallback((currentDatasets: LocationDataset[]) => {
    const usedColors = currentDatasets.map((dataset) => dataset.color);

    // 사용되지 않은 색상 찾기
    for (const color of dataColors) {
      if (!usedColors.includes(color)) {
        return color;
      }
    }

    // 모든 색상이 사용 중이면 순환하여 할당
    return dataColors[currentDatasets.length % dataColors.length];
  }, []);

  // 새 데이터셋 추가
  const addDataset = useCallback((data: LocationData[], name: string) => {
    const newDataset: LocationDataset = {
      id: `dataset_${ Date.now() }_${ Math.random().toString(36).substr(2, 9) }`,
      name: name || `데이터셋 ${ datasets.length + 1 }`,
      uploadedAt: new Date(),
      data: data,
      color: getAvailableColor(datasets),
    };

    setDatasets((prev) => [...prev, newDataset]);
    setSelectedIds((prev) => [...prev, newDataset.id]);

    return newDataset.id;
  }, [datasets, getAvailableColor]);

  // 데이터셋 선택/해제 토글
  const toggleDataset = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((selectedId) => selectedId !== id)
        : [...prev, id],
    );
  }, []);

  // 데이터셋 삭제
  const removeDataset = useCallback((id: string) => {
    setDatasets((prev) => {
      return prev.filter((dataset) => dataset.id !== id);
    });

    setSelectedIds((prev) => {
      return prev.filter((selectedId) => selectedId !== id);
    });
  }, []);

  // 데이터셋 이름 변경
  const renameDataset = useCallback((id: string, newName: string) => {
    setDatasets((prev) =>
      prev.map((dataset) =>
        dataset.id === id
          ? { ...dataset, name: newName }
          : dataset,
      ),
    );
  }, []);

  // 모든 데이터셋 삭제
  const clearAllDatasets = useCallback(() => {
    setDatasets([]);
    setSelectedIds([]);
    sessionStorage.removeItem(storageKey);
  }, []);

  // 모든 데이터셋 선택/해제
  const toggleAllDatasets = useCallback((selectAll: boolean) => {
    if (selectAll) {
      setSelectedIds(datasets.map((d) => d.id));
    } else {
      setSelectedIds([]);
    }
  }, [datasets]);

  // 선택된 데이터셋들의 데이터 가져오기
  const getSelectedData = useCallback((): ExtendedLocationData[] => {
    return datasets
      .filter((dataset) => selectedIds.includes(dataset.id))
      .flatMap((dataset) =>
        dataset.data.map((location) => ({
          ...location,
          datasetId: dataset.id,
          datasetName: dataset.name,
          datasetColor: dataset.color,
        })),
      );
  }, [datasets, selectedIds]);

  // 특정 데이터셋의 데이터 가져오기
  const getDatasetData = useCallback((id: string): ExtendedLocationData[] => {
    const dataset = datasets.find((d) => d.id === id);
    if (!dataset) return [];

    return dataset.data.map((location) => ({
      ...location,
      datasetId: dataset.id,
      datasetName: dataset.name,
      datasetColor: dataset.color,
    }));
  }, [datasets]);

  // 데이터셋 통계 정보
  const getDatasetStats = useCallback((id: string) => {
    const dataset = datasets.find((d) => d.id === id);
    if (!dataset) return null;

    const validCoordinates = dataset.data.filter((loc) => loc.lat && loc.lon).length;
    const totalItems = dataset.data.length;

    return {
      totalItems,
      validCoordinates,
      invalidCoordinates: totalItems - validCoordinates,
    };
  }, [datasets]);

  return {
    // 상태
    datasets,
    selectedIds,

    // 액션
    addDataset,
    toggleDataset,
    removeDataset,
    renameDataset,
    clearAllDatasets,
    toggleAllDatasets,

    // 데이터 조회
    getSelectedData,
    getDatasetData,
    getDatasetStats,

    // 유틸리티
    isSelected: (id: string) => selectedIds.includes(id),
    selectedCount: selectedIds.length,
    totalDatasets: datasets.length,
    hasDatasets: datasets.length > 0,

    // 수동 새로고침
    reload: loadFromStorage,

    // 디버깅용 유틸리티
    debugStorage: () => {
      const saved = sessionStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : null;
    },
  };
};
