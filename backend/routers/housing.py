from __future__ import annotations

from fastapi import APIRouter, Query

from backend.schemas import (
    HousingDetailResponse,
    HousingSearchResponse,
    HousingUnitResponse,
    RentalOptionResponse,
)

router = APIRouter(prefix="/housing", tags=["housing"])

# --- Mock data for stub implementation ---

_MOCK_ITEMS: list[HousingDetailResponse] = [
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
    HousingDetailResponse(
        unit=HousingUnitResponse(
            id="unit-002",
            notice_id="2024-0002",
            address="경기도 성남시 분당구 정자동 456",
            address_raw="경기도 성남시 분당구 정자동 456",
            building="B동",
            unit_number="202호",
            housing_group="신혼부부",
            exclusive_area=46.0,
            living_area=52.0,
            total_area=59.0,
            rooms=2,
            floor="7",
            elevator=True,
            housing_type="아파트",
            lat=37.3595,
            lon=127.1085,
            supply_type="매입임대",
            gender_usage=None,
        ),
        rental_options=[
            RentalOptionResponse(
                id="opt-002",
                housing_unit_id="unit-002",
                eligibility_group="신혼부부",
                eligibility_label_raw="신혼부부(혼인 7년 이내)",
                option_type="임대",
                deposit=15000,
                monthly_rent=500,
            ),
        ],
    ),
]


@router.get("", response_model=HousingSearchResponse)
async def search_housing(
    region: str | None = Query(None, description="지역 필터"),
    min_area: float | None = Query(None, description="최소 전용면적 (m²)"),
    max_area: float | None = Query(None, description="최대 전용면적 (m²)"),
    min_deposit: int | None = Query(None, description="최소 보증금 (만원)"),
    max_deposit: int | None = Query(None, description="최대 보증금 (만원)"),
    bbox: str | None = Query(
        None, description="바운딩 박스 (min_lon,min_lat,max_lon,max_lat)"
    ),
    page: int = Query(1, ge=1, description="페이지 번호"),
    size: int = Query(20, ge=1, le=100, description="페이지 크기"),
    max_results: int = Query(100, ge=1, le=1000, description="최대 결과 수"),
) -> HousingSearchResponse:
    """주택 유닛을 다양한 필터로 검색한다."""
    # TODO: Replace with Supabase query
    filtered = list(_MOCK_ITEMS)

    if region:
        filtered = [h for h in filtered if region in (h.unit.address or "")]

    if min_area is not None:
        filtered = [
            h for h in filtered if h.unit.exclusive_area and h.unit.exclusive_area >= min_area
        ]

    if max_area is not None:
        filtered = [
            h for h in filtered if h.unit.exclusive_area and h.unit.exclusive_area <= max_area
        ]

    if min_deposit is not None:
        filtered = [
            h
            for h in filtered
            if any(o.deposit and o.deposit >= min_deposit for o in h.rental_options)
        ]

    if max_deposit is not None:
        filtered = [
            h
            for h in filtered
            if any(o.deposit and o.deposit <= max_deposit for o in h.rental_options)
        ]

    if bbox:
        try:
            min_lon, min_lat, max_lon, max_lat = (float(v) for v in bbox.split(","))
            filtered = [
                h
                for h in filtered
                if h.unit.lat is not None
                and h.unit.lon is not None
                and min_lat <= h.unit.lat <= max_lat
                and min_lon <= h.unit.lon <= max_lon
            ]
        except (ValueError, TypeError):
            pass  # Ignore invalid bbox

    # Apply max_results cap
    filtered = filtered[:max_results]

    total = len(filtered)
    start = (page - 1) * size
    end = start + size
    items = filtered[start:end]

    return HousingSearchResponse(items=items, total=total, page=page, size=size)
