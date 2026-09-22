from __future__ import annotations

from fastapi import APIRouter, Query

from backend.schemas import (
    HousingDetailResponse,
    HousingUnitResponse,
    NoticeDetailResponse,
    NoticeListResponse,
    NoticeResponse,
    RentalOptionResponse,
)

router = APIRouter(prefix="/notices", tags=["notices"])

# --- Mock data for stub implementation ---

_MOCK_NOTICES: list[NoticeResponse] = [
    NoticeResponse(
        pan_id="2024-0001",
        name="서울 행복주택 입주자 모집공고",
        region="서울",
        start_date="2024-09-01",
        end_date="2024-09-30",
        status="접수중",
        notice_type="행복주택",
        dtl_url="https://example.com/notice/2024-0001",
    ),
    NoticeResponse(
        pan_id="2024-0002",
        name="경기 매입임대 입주자 모집공고",
        region="경기",
        start_date="2024-08-15",
        end_date="2024-09-15",
        status="접수마감",
        notice_type="매입임대",
        dtl_url="https://example.com/notice/2024-0002",
    ),
]

_MOCK_HOUSING: list[HousingDetailResponse] = [
    HousingDetailResponse(
        unit=HousingUnitResponse(
            id="unit-001",
            notice_id="2024-0001",
            address="서울특별시 강남구 역삼동 123",
            address_raw="서울특별시 강남구 역삼동 123",
            building="A동",
            unit_number="101호",
            housing_group="청년",
            exclusive_area=26.0,
            living_area=30.0,
            total_area=36.0,
            rooms=1,
            floor="3",
            elevator=True,
            housing_type="아파트",
            lat=37.5013,
            lon=127.0396,
            supply_type="행복주택",
            gender_usage=None,
        ),
        rental_options=[
            RentalOptionResponse(
                id="opt-001",
                housing_unit_id="unit-001",
                eligibility_group="청년",
                eligibility_label_raw="청년(만 19~39세)",
                option_type="임대",
                deposit=5000,
                monthly_rent=300,
            ),
        ],
    ),
]


@router.get("", response_model=NoticeListResponse)
async def list_notices(
    region: str | None = Query(None, description="지역 필터"),
    target_group: str | None = Query(None, description="대상 그룹 필터"),
    status: str | None = Query(None, description="공고 상태 필터 (접수중, 접수마감 등)"),
    page: int = Query(1, ge=1, description="페이지 번호"),
    size: int = Query(20, ge=1, le=100, description="페이지 크기"),
) -> NoticeListResponse:
    """공고 목록을 필터 및 페이지네이션과 함께 조회한다."""
    # TODO: Replace with Supabase query
    filtered = _MOCK_NOTICES

    if region:
        filtered = [n for n in filtered if n.region == region]
    if status:
        filtered = [n for n in filtered if n.status == status]

    total = len(filtered)
    start = (page - 1) * size
    end = start + size
    items = filtered[start:end]

    return NoticeListResponse(items=items, total=total, page=page, size=size)


@router.get("/{pan_id}", response_model=NoticeDetailResponse)
async def get_notice_detail(
    pan_id: str,
    page: int = Query(1, ge=1, description="주택 목록 페이지 번호"),
    size: int = Query(20, ge=1, le=100, description="주택 목록 페이지 크기"),
) -> NoticeDetailResponse:
    """공고 상세 정보를 주택 유닛 목록(페이지네이션)과 함께 조회한다."""
    # TODO: Replace with Supabase query
    notice = next((n for n in _MOCK_NOTICES if n.pan_id == pan_id), None)
    if notice is None:
        notice = NoticeResponse(pan_id=pan_id, name="공고를 찾을 수 없습니다")

    housing = [h for h in _MOCK_HOUSING if h.unit.notice_id == pan_id]
    total_housing = len(housing)
    start = (page - 1) * size
    end = start + size
    paginated = housing[start:end]

    return NoticeDetailResponse(
        notice=notice,
        housing=paginated,
        total_housing=total_housing,
        page=page,
        size=size,
    )
