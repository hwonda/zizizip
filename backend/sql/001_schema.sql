-- ZIZIZIP 2.0 초기 스키마
-- Supabase SQL Editor에서 실행

-- ─── 공고 ───────────────────────────────────────────────
create table if not exists notices (
  id            bigint generated always as identity primary key,
  pan_id        text unique not null,          -- LH 공고 ID
  name          text not null,                 -- 공고명
  region        text,                          -- 지역명 (CNP_CD_NM)
  notice_type   text,                          -- 공고 유형 (AIS_TP_CD_NM)
  parent_type   text,                          -- 상위 유형 (UPP_AIS_TP_NM)
  start_date    text,                          -- 게시 시작일
  end_date      text,                          -- 마감일
  status        text default '확인필요',        -- 접수중 / 접수마감 / 취소 / 확인필요
  dtl_url       text,                          -- 상세 URL
  dtl_url_mob   text,                          -- 모바일 상세 URL
  raw_data      jsonb,                         -- API 원본 응답 보존
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create index if not exists idx_notices_pan_id on notices(pan_id);
create index if not exists idx_notices_region on notices(region);
create index if not exists idx_notices_status on notices(status);

-- ─── 공고 일정 ──────────────────────────────────────────
create table if not exists notice_schedules (
  id            bigint generated always as identity primary key,
  notice_id     bigint references notices(id) on delete cascade,
  schedule_type text not null,                 -- 접수기간 / 당첨발표 / 계약기간 등
  target_group  text,                          -- 대상 (청년, 신혼부부 등, null이면 공통)
  start_date    text,
  end_date      text,
  note          text,
  created_at    timestamptz default now()
);

-- ─── 첨부파일 ───────────────────────────────────────────
create table if not exists notice_files (
  id            bigint generated always as identity primary key,
  notice_id     bigint references notices(id) on delete cascade,
  file_id       text not null,                 -- LH fileId
  filename      text not null,                 -- HTML에서 추출한 파일명
  file_type     text,                          -- 공급주택목록 / 공고문 / QnA 등
  file_hash     text,                          -- SHA-256 of content
  file_size     int,
  storage_path  text,                          -- Supabase Storage 경로
  parse_status  text default '미처리',          -- 미처리 / 파싱완료 / 파싱실패 / 검토필요
  parse_error   text,
  downloaded_at timestamptz,
  parsed_at     timestamptz,
  created_at    timestamptz default now(),
  unique(notice_id, file_id)
);

-- ─── 주택 ───────────────────────────────────────────────
create table if not exists housing_units (
  id              bigint generated always as identity primary key,
  notice_id       bigint references notices(id) on delete cascade,
  source_file_id  bigint references notice_files(id) on delete set null,
  source_row      int,                          -- Excel 원본 행 번호
  address_raw     text,                         -- 원본 주소 (괄호 포함)
  address         text,                         -- 정제된 주소
  building        text,                         -- 동
  unit_number     text,                         -- 호
  housing_group   text,                         -- 주택군 이름
  exclusive_area  numeric,                      -- 전용면적 (㎡)
  living_area     numeric,                      -- 주거공용면적
  total_area      numeric,                      -- 면적계
  rooms           int,
  floor           text,                         -- 원본 그대로 (예: "2층")
  elevator        boolean,
  housing_type    text,                         -- 주택유형
  supply_type     text,                         -- 공급형 (청년: 단독/셰어 등)
  gender_usage    text,                         -- 성별용도 구분 (청년)
  viewing_info    text,                         -- 주택열람일정
  lat             double precision,
  lon             double precision,
  geocode_status  text default '미처리',         -- 미처리 / 성공 / 실패
  is_active       boolean default true,          -- 정정공고 삭제 시 false
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index if not exists idx_housing_notice on housing_units(notice_id);
create index if not exists idx_housing_coords on housing_units(lat, lon) where lat is not null;
create index if not exists idx_housing_active on housing_units(is_active) where is_active = true;

-- ─── 임대조건 ───────────────────────────────────────────
create table if not exists rental_options (
  id                    bigint generated always as identity primary key,
  housing_unit_id       bigint references housing_units(id) on delete cascade,
  eligibility_group     text not null,           -- 적용 계층 (수급자, 소득70%이하, 청년1순위 등)
  eligibility_label_raw text,                    -- 원본 헤더 문구 그대로
  option_type           text not null,           -- 기본 / 최대전환
  deposit               bigint,                  -- 임대보증금 (원)
  monthly_rent          bigint,                  -- 월임대료 (원)
  source_file_id        bigint references notice_files(id) on delete set null,
  source_row            int,
  created_at            timestamptz default now()
);

create index if not exists idx_rental_housing on rental_options(housing_unit_id);
create index if not exists idx_rental_group on rental_options(eligibility_group);

-- ─── 지오코딩 캐시 ──────────────────────────────────────
create table if not exists geocode_cache (
  id            bigint generated always as identity primary key,
  address_raw   text unique not null,           -- 원본 주소 (키)
  address_refined text,                         -- 정제된 주소
  lat           double precision,
  lon           double precision,
  provider      text default 'vworld',
  status        text default '성공',             -- 성공 / 실패
  error_message text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ─── 수집 실행 이력 ─────────────────────────────────────
create table if not exists collection_runs (
  id              bigint generated always as identity primary key,
  run_type        text not null,                 -- scheduled / manual
  status          text not null default '진행중', -- 진행중 / 완료 / 부분실패 / 실패
  started_at      timestamptz default now(),
  finished_at     timestamptz,
  notices_found   int default 0,
  notices_new     int default 0,
  files_downloaded int default 0,
  files_parsed    int default 0,
  units_created   int default 0,
  units_updated   int default 0,
  geocode_calls   int default 0,
  geocode_cached  int default 0,
  errors          jsonb default '[]'::jsonb,      -- [{stage, notice_id, file_id, message}]
  summary         text
);

-- ─── updated_at 자동 갱신 ───────────────────────────────
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace trigger notices_updated_at
  before update on notices
  for each row execute function update_updated_at();

create or replace trigger housing_units_updated_at
  before update on housing_units
  for each row execute function update_updated_at();

create or replace trigger geocode_cache_updated_at
  before update on geocode_cache
  for each row execute function update_updated_at();

-- ─── RLS 정책 ───────────────────────────────────────────
-- 공고·주택·가격은 모든 사용자 읽기 허용
alter table notices enable row level security;
alter table notice_files enable row level security;
alter table housing_units enable row level security;
alter table rental_options enable row level security;
alter table geocode_cache enable row level security;
alter table collection_runs enable row level security;
alter table notice_schedules enable row level security;

-- 읽기: 모든 인증/비인증 사용자
create policy "공고 읽기" on notices for select using (true);
create policy "첨부파일 읽기" on notice_files for select using (true);
create policy "주택 읽기" on housing_units for select using (true);
create policy "임대조건 읽기" on rental_options for select using (true);
create policy "일정 읽기" on notice_schedules for select using (true);

-- 쓰기: service_role만 (수집기/관리자)
-- service_role은 RLS를 무시하므로 별도 정책 불필요

-- geocode_cache, collection_runs는 서비스 전용 (읽기도 service_role만)
create policy "지오캐시 서비스 전용" on geocode_cache for all using (false);
create policy "수집이력 서비스 전용" on collection_runs for all using (false);
