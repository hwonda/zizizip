#!/usr/bin/env python3
"""
LH 첨부파일 자동 확보 PoC (검증 완료)

기능:
  1. LH API에서 서울+매입임대 공고 식별
  2. 상세 페이지에서 공급주택목록 Excel fileId 추출
  3. 쿠키 없이 직접 다운로드

사용법:
  export NEXT_PUBLIC_LH_API_KEY=your_key
  python3 poc/lh_attachment_poc.py

  또는 .env.local에 키가 있으면 자동 로드
"""

import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

# ─── 설정 ───────────────────────────────────────────────
API_KEY = os.environ.get('NEXT_PUBLIC_LH_API_KEY', '')
if not API_KEY:
    env_path = Path(__file__).resolve().parent.parent / '.env.local'
    if env_path.exists():
        for line in env_path.read_text().splitlines():
            if line.startswith('NEXT_PUBLIC_LH_API_KEY='):
                API_KEY = line.split('=', 1)[1].strip()
                break

if not API_KEY:
    print('[ERROR] NEXT_PUBLIC_LH_API_KEY 환경변수가 필요합니다.')
    sys.exit(1)

LH_API_BASE = 'http://apis.data.go.kr/B552555/lhLeaseNoticeInfo1/lhLeaseNoticeInfo1'
LH_SITE_BASE = 'https://apply.lh.or.kr'
LH_FILE_URL = f'{LH_SITE_BASE}/lhapply/lhFile.do'
OUTPUT_DIR = Path(__file__).resolve().parent / 'downloads'
OUTPUT_DIR.mkdir(exist_ok=True)

UA = ('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) '
      'AppleWebKit/537.36 (KHTML, like Gecko) '
      'Chrome/120.0.0.0 Safari/537.36')


# ─── Step 1: 공고 목록 조회 ─────────────────────────────
def fetch_notices(date_from: str, page_size: int = 100) -> list[dict]:
    """LH API에서 공고 목록을 페이지 순회하며 전체 수집한다.

    Args:
        date_from: 조회 시작일 (YYYY.MM.DD 형식)
        page_size: 페이지당 건수 (최대 100)

    Returns:
        공고 dict 리스트
    """
    all_notices = []
    page = 1

    while True:
        params = urllib.parse.urlencode({
            'ServiceKey': API_KEY,
            'PG_SZ': str(page_size),
            'PAGE': str(page),
            'PAN_NT_ST_DT': date_from,
        })
        url = f'{LH_API_BASE}?{params}'
        req = urllib.request.Request(url)

        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read())

        # 응답이 [metadata, {dsList: [...]}] 배열 형태
        if isinstance(data, list) and len(data) > 1:
            notices = data[1].get('dsList', [])
        elif isinstance(data, dict):
            notices = data.get('dsList', [])
        else:
            break

        if not notices:
            break

        all_notices.extend(notices)
        print(f'  페이지 {page}: {len(notices)}건 (누적 {len(all_notices)})')

        if len(notices) < page_size:
            break
        page += 1
        time.sleep(0.3)

    return all_notices


def filter_seoul_maeipimdae(notices: list[dict]) -> list[dict]:
    """서울 + 매입임대 공고를 필터링한다."""
    results = []
    for n in notices:
        pan_nm = n.get('PAN_NM', '')
        cnp = n.get('CNP_CD_NM', '')
        is_maeipimdae = '매입임대' in pan_nm
        is_seoul = '서울' in pan_nm or cnp == '서울특별시'
        if is_maeipimdae and is_seoul:
            results.append(n)
    return results


# ─── Step 2: 상세 페이지에서 첨부파일 fileId 추출 ────────
def fetch_html(url: str) -> str:
    """HTML 페이지를 가져온다."""
    req = urllib.request.Request(url, headers={'User-Agent': UA})
    with urllib.request.urlopen(req, timeout=30) as resp:
        charset = resp.headers.get_content_charset() or 'utf-8'
        return resp.read().decode(charset, errors='replace')


def extract_supply_list_files(html: str) -> list[dict]:
    """상세 HTML에서 공급주택목록 첨부파일의 fileId와 파일명을 추출한다.

    탐색 전략:
      1. fileDownLoad('ID');파일명 패턴에서 '공급주택' 포함 항목 추출
      2. 없으면 '공급주택목록' 텍스트 주변 500자에서 fileId 탐색
    """
    results = []

    # 전략 1: fileDownLoad('ID') 바로 뒤에 파일명이 오는 패턴
    # 예: fileDownLoad('68596948');">26년_3차_청년매입임대_공급주택목록_서울지역본부.xlsx</a>
    for m in re.finditer(
        r"fileDownLoad\('(\d+)'\);?\">([^<]+\.xlsx)",
        html
    ):
        file_id, filename = m.group(1), m.group(2).strip()
        if '공급주택' in filename or '주택목록' in filename:
            results.append({'file_id': file_id, 'filename': filename})

    if results:
        return results

    # 전략 2: '공급주택목록' 텍스트 주변에서 fileId 탐색
    for m in re.finditer(r'공급주택목록', html):
        start = max(0, m.start() - 500)
        end = min(len(html), m.end() + 500)
        chunk = html[start:end]

        for fid_match in re.finditer(r"fileDownLoad\('(\d+)'\)", chunk):
            fid = fid_match.group(1)
            # 해당 fileId 주변에서 파일명 추출
            fid_pos = fid_match.start()
            fname_chunk = chunk[fid_pos:fid_pos + 200]
            fname_m = re.search(r'>([^<]*\.xlsx)', fname_chunk)
            filename = fname_m.group(1).strip() if fname_m else f'공급주택목록_{fid}.xlsx'

            if not any(r['file_id'] == fid for r in results):
                results.append({'file_id': fid, 'filename': filename})

    return results


# ─── Step 3: 파일 다운로드 ──────────────────────────────
def download_attachment(file_id: str, dest_path: Path) -> dict:
    """fileId로 첨부파일을 다운로드한다.

    Returns:
        {'success': bool, 'size': int, 'is_xlsx': bool, 'path': str, 'error': str}
    """
    url = f'{LH_FILE_URL}?fileid={file_id}'
    try:
        req = urllib.request.Request(url, headers={'User-Agent': UA})
        with urllib.request.urlopen(req, timeout=60) as resp:
            content = resp.read()
            content_type = resp.headers.get('Content-Type', '')
            is_xlsx = content[:4] == b'PK\x03\x04'

            dest_path.write_bytes(content)

            return {
                'success': True,
                'size': len(content),
                'is_xlsx': is_xlsx,
                'content_type': content_type,
                'path': str(dest_path),
                'error': '',
            }
    except Exception as e:
        return {
            'success': False,
            'size': 0,
            'is_xlsx': False,
            'content_type': '',
            'path': '',
            'error': str(e),
        }


# ─── 메인 실행 ──────────────────────────────────────────
def main():
    import datetime

    print('=' * 60)
    print('LH 첨부파일 자동 확보 PoC')
    print('=' * 60)

    # Step 1: 공고 수집
    print('\n[Step 1] LH API 공고 목록 조회')
    date_from = (datetime.date.today() - datetime.timedelta(days=90)).strftime('%Y.%m.%d')
    print(f'  조회 기간: {date_from} ~ 현재')

    all_notices = fetch_notices(date_from)
    print(f'  전체 공고: {len(all_notices)}건')

    seoul_notices = filter_seoul_maeipimdae(all_notices)
    print(f'  서울+매입임대: {len(seoul_notices)}건')

    for n in seoul_notices:
        print(f'    - [{n.get("PAN_ID")}] {n.get("PAN_NM")}')
        print(f'      기간: {n.get("PAN_NT_ST_DT")} ~ {n.get("CLSG_DT")}')

    if not seoul_notices:
        print('[WARN] 서울+매입임대 공고 없음. 전체 매입임대에서 첫 3건으로 시도.')
        seoul_notices = [n for n in all_notices if '매입임대' in n.get('PAN_NM', '')][:3]

    # Step 2 & 3: 상세 → 추출 → 다운로드
    print(f'\n[Step 2-3] 상세 페이지 탐색 및 다운로드')
    results = []

    for notice in seoul_notices:
        pan_id = notice.get('PAN_ID', '')
        pan_nm = notice.get('PAN_NM', '')
        dtl_url = notice.get('DTL_URL', '')

        print(f'\n  --- {pan_nm} (ID: {pan_id}) ---')

        if not dtl_url:
            print('  [SKIP] 상세 URL 없음')
            continue

        # 상세 HTML 가져오기
        try:
            html = fetch_html(dtl_url)
            print(f'  HTML: {len(html):,} chars')
        except Exception as e:
            print(f'  [ERROR] HTML 로드 실패: {e}')
            continue

        # 공급주택목록 fileId 추출
        files = extract_supply_list_files(html)
        if not files:
            print('  [WARN] 공급주택목록 첨부파일을 찾지 못함')

            # 전체 첨부파일 목록 출력 (디버깅용)
            all_files = re.findall(
                r"fileDownLoad\('(\d+)'\);?\">([^<]+)<",
                html
            )
            if all_files:
                print(f'  전체 첨부파일 ({len(all_files)}건):')
                for fid, fname in all_files:
                    print(f'    {fid}: {fname}')
            continue

        for f in files:
            file_id = f['file_id']
            filename = f['filename']
            safe_name = re.sub(r'[^\w가-힣.\-]', '_', filename)
            dest = OUTPUT_DIR / f'{pan_id}_{safe_name}'

            print(f'  다운로드: {filename} (fileId={file_id})')
            result = download_attachment(file_id, dest)

            results.append({
                'pan_id': pan_id,
                'pan_nm': pan_nm,
                'file_id': file_id,
                'filename': filename,
                **result,
            })

            if result['success']:
                print(f'  => 성공: {result["size"]:,} bytes, XLSX={result["is_xlsx"]}, {dest.name}')
            else:
                print(f'  => 실패: {result["error"]}')

        time.sleep(1)

    # 결과 요약
    print(f'\n{"=" * 60}')
    print('결과 요약')
    print(f'{"=" * 60}')
    success_count = sum(1 for r in results if r['success'])
    print(f'  시도: {len(results)}건, 성공: {success_count}건, 실패: {len(results) - success_count}건')

    for r in results:
        status = 'OK' if r['success'] else 'FAIL'
        print(f'  [{status}] {r["pan_nm"][:40]}')
        print(f'         파일: {r["filename"]}')
        if r['success']:
            print(f'         크기: {r["size"]:,} bytes, XLSX: {r["is_xlsx"]}')
            print(f'         저장: {r["path"]}')
        else:
            print(f'         에러: {r["error"]}')

    # 결과 JSON 저장
    result_path = OUTPUT_DIR / 'poc_result.json'
    with open(result_path, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f'\n  결과 JSON: {result_path}')

    return results


if __name__ == '__main__':
    main()
