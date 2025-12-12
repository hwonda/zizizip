import { NextRequest, NextResponse } from 'next/server';

// 기본 날짜 형식 반환 함수
const getDefaultDates = () => {
  const today = new Date();
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  const formatDate = (date: Date) =>
    `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;

  return {
    startDate: formatDate(oneMonthAgo),
    endDate: formatDate(today),
  };
};

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.NEXT_PUBLIC_LH_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'LH API key is not configured' },
        { status: 500 },
      );
    }

    // URL에서 쿼리 파라미터 추출
    const { searchParams } = new URL(request.url);
    const region = searchParams.get('region') || '';
    const status = searchParams.get('status') || '';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const searchKeyword = searchParams.get('search') || '';
    const page = searchParams.get('page') || '1';
    const pageSize = searchParams.get('pageSize') || '30';

    // 기본 날짜 설정
    const defaultDates = getDefaultDates();
    const finalStartDate = startDate || defaultDates.startDate;
    const finalEndDate = endDate || defaultDates.endDate;

    // LH API 파라미터 구성
    const params = new URLSearchParams({
      ServiceKey: apiKey,
      PG_SZ: pageSize,
      PAGE: page,
      PAN_NT_ST_DT: finalStartDate,
      CLSG_DT: finalEndDate,
    });

    // 선택적 파라미터 추가
    if (region) {
      params.append('CNP_CD', region);
    }
    if (status) {
      params.append('PAN_SS', status);
    }
    if (searchKeyword) {
      params.append('PAN_NM', searchKeyword);
    }

    const apiUrl = `http://apis.data.go.kr/B552555/lhLeaseNoticeInfo1/lhLeaseNoticeInfo1?${params.toString()}`;

    console.log('[LH API] URL:', apiUrl);
    console.log('[LH API] Filters:', { region, status, startDate: finalStartDate, endDate: finalEndDate, searchKeyword });

    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`LH API request failed with status: ${response.status}`);
    }

    const data = await response.json();

    console.log('[LH API] Raw data:', data);

    // API 응답이 배열 형태로 오므로 두 번째 요소를 반환
    if (Array.isArray(data) && data.length > 1) {
      console.log('[LH API] dsList:', data[1].dsList);
      return NextResponse.json(data[1]);
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[LH API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 },
    );
  }
}
