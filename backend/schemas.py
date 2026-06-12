from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional
from models import ProjectStatus, ContractType


# --- Search ---
class SearchResult(BaseModel):
    entity_type: str
    id: int
    name: str
    subtitle: Optional[str] = None


# --- Category ---
class CategoryBase(BaseModel):
    name: str

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(CategoryBase):
    pass

class CategoryOut(CategoryBase):
    id: int
    model_config = {"from_attributes": True}


# --- Provider ---
class ProviderBase(BaseModel):
    name: str
    service_type: str
    phone: Optional[str] = None
    email: Optional[str] = None
    account_number: Optional[str] = None
    contract_terms: Optional[str] = None
    notes: Optional[str] = None

class ProviderCreate(ProviderBase):
    pass

class ProviderUpdate(ProviderBase):
    pass

class ProviderOut(ProviderBase):
    id: int
    model_config = {"from_attributes": True}


# --- Project ---
class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    status: ProjectStatus = ProjectStatus.planned
    budget: Optional[float] = None
    actual_cost: Optional[float] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(ProjectBase):
    pass

class ProjectOut(ProjectBase):
    id: int
    model_config = {"from_attributes": True}


# --- Quote ---
class QuoteBase(BaseModel):
    provider_id: int
    project_id: Optional[int] = None
    amount: float
    date_received: date

class QuoteCreate(QuoteBase):
    pass

class QuoteUpdate(QuoteBase):
    pass

class QuoteOut(QuoteBase):
    id: int
    model_config = {"from_attributes": True}

class QuoteDetail(QuoteOut):
    provider: Optional[ProviderOut] = None
    project: Optional[ProjectOut] = None
    model_config = {"from_attributes": True}


# --- Contract ---
class ContractBase(BaseModel):
    name: str
    type: ContractType
    provider_id: Optional[int] = None
    start_date: date
    end_date: Optional[date] = None
    cost: Optional[float] = None
    payment_terms: Optional[str] = None
    notes: Optional[str] = None

class ContractCreate(ContractBase):
    pass

class ContractUpdate(ContractBase):
    pass

class ContractOut(ContractBase):
    id: int
    model_config = {"from_attributes": True}

class ContractDetail(ContractOut):
    provider: Optional[ProviderOut] = None
    model_config = {"from_attributes": True}


# --- Log Entry ---
class LogEntryBase(BaseModel):
    entry_date: Optional[date] = None
    title: str
    description: Optional[str] = None
    category_id: Optional[int] = None
    provider_id: Optional[int] = None
    project_id: Optional[int] = None
    amount: Optional[float] = None
    usage_value: Optional[float] = None
    usage_unit: Optional[str] = None
    recurring: bool = False
    frequency: Optional[str] = None
    next_due: Optional[date] = None

class LogEntryCreate(LogEntryBase):
    pass

class LogEntryUpdate(LogEntryBase):
    pass

class LogEntryOut(LogEntryBase):
    id: int
    created_at: Optional[datetime] = None
    model_config = {"from_attributes": True}

class LogEntryDetail(LogEntryOut):
    category: Optional[CategoryOut] = None
    provider: Optional[ProviderOut] = None
    project: Optional[ProjectOut] = None
    model_config = {"from_attributes": True}


# --- Reports ---
class CategoryBreakdown(BaseModel):
    category: str
    total: float

class ProviderBreakdown(BaseModel):
    provider_id: int
    provider_name: str
    total: float

class ProjectBreakdown(BaseModel):
    project_id: int
    project_name: str
    total: float

class AnnualReport(BaseModel):
    year: int
    log_total: float
    by_category: list[CategoryBreakdown]
    by_provider: list[ProviderBreakdown]
    by_project: list[ProjectBreakdown]
    contracts_total: float
    contracts: list[ContractOut]
    grand_total: float


# --- File Attachment ---
class FileAttachmentOut(BaseModel):
    id: int
    entity_type: str
    entity_id: int
    filename: str
    filepath: str
    content_type: str | None = None
    uploaded_at: datetime
    model_config = {"from_attributes": True}


# --- Dashboard ---
class DashboardLogEntry(LogEntryOut):
    provider_name: Optional[str] = None

class DashboardData(BaseModel):
    upcoming_reminders: list[LogEntryOut]
    active_projects: list[ProjectOut]
    expiring_contracts: list[ContractOut]
    recent_entries: list[DashboardLogEntry]
