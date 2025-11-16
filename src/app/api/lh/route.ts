import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiKey = process.env.NEXT_PUBLIC_LH_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'LH API key is not configured' },
        { status: 500 },
      );
    }

    const today = new Date();
    const formattedDate = `${ today.getFullYear() }.${ String(today.getMonth() + 1).padStart(2, '0') }.${ String(today.getDate()).padStart(2, '0') }`;

    const params = new URLSearchParams({
      ServiceKey: apiKey,
      PG_SZ: '10',
      PAGE: '1',
      PAN_NT_ST_DT: formattedDate,
      CLSG_DT: formattedDate,
    });

    const apiUrl = `http://apis.data.go.kr/B552555/lhLeaseNoticeInfo1/lhLeaseNoticeInfo1?${ params.toString() }`;

    console.log('[LH API] URL:', apiUrl);
    console.log('[LH API]:', formattedDate);

    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`LH API request failed with status: ${ response.status }`);
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
