from __future__ import annotations

from pydantic import BaseModel


class NoticeResponse(BaseModel):
    """Public housing notice summary."""

    pan_id: str
    name: str
    region: str | None = None
    start_date: str | None = None
    end_date: str | None = None
    status: str | None = None
    notice_type: str | None = None
    dtl_url: str | None = None


class NoticeListResponse(BaseModel):
    """Paginated list of notices."""

    items: list[NoticeResponse]
    total: int
    page: int
    size: int


class HousingUnitResponse(BaseModel):
    """Single housing unit."""

    id: str
    notice_id: str
    address: str | None = None
    address_raw: str | None = None
    building: str | None = None
    unit_number: str | None = None
    housing_group: str | None = None
    exclusive_area: float | None = None
    living_area: float | None = None
    total_area: float | None = None
    rooms: int | None = None
    floor: str | None = None
    elevator: bool | None = None
    housing_type: str | None = None
    lat: float | None = None
    lon: float | None = None
    supply_type: str | None = None
    gender_usage: str | None = None


class RentalOptionResponse(BaseModel):
    """Rental pricing option for a housing unit."""

    id: str
    housing_unit_id: str
    eligibility_group: str | None = None
    eligibility_label_raw: str | None = None
    option_type: str | None = None
    deposit: int | None = None
    monthly_rent: int | None = None


class HousingDetailResponse(BaseModel):
    """Housing unit with its rental options."""

    unit: HousingUnitResponse
    rental_options: list[RentalOptionResponse]


class NoticeDetailResponse(BaseModel):
    """Notice with paginated housing units."""

    notice: NoticeResponse
    housing: list[HousingDetailResponse]
    total_housing: int
    page: int
    size: int


class HousingSearchResponse(BaseModel):
    """Paginated housing search results."""

    items: list[HousingDetailResponse]
    total: int
    page: int
    size: int
