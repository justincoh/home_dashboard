from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional
from models import ProjectStatus, ContractType


# --- Vendor ---
class VendorBase(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    service_type: str

class VendorCreate(VendorBase):
    pass

class VendorUpdate(VendorBase):
    pass

class VendorOut(VendorBase):
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
    vendor_id: int
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
    vendor: Optional[VendorOut] = None
    project: Optional[ProjectOut] = None
    model_config = {"from_attributes": True}


# --- Contract ---
class ContractBase(BaseModel):
    name: str
    type: ContractType
    vendor_id: Optional[int] = None
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
    vendor: Optional[VendorOut] = None
    model_config = {"from_attributes": True}


# --- Maintenance ---
class MaintenanceBase(BaseModel):
    name: str
    frequency: str
    last_completed: Optional[date] = None
    next_due: Optional[date] = None

class MaintenanceCreate(MaintenanceBase):
    pass

class MaintenanceUpdate(MaintenanceBase):
    pass

class MaintenanceOut(MaintenanceBase):
    id: int
    model_config = {"from_attributes": True}


# --- Utility ---
class UtilityBase(BaseModel):
    provider_name: str
    account_number: Optional[str] = None
    contact_info: Optional[str] = None
    contract_terms: Optional[str] = None
    utility_type: str

class UtilityCreate(UtilityBase):
    pass

class UtilityUpdate(UtilityBase):
    pass

class UtilityOut(UtilityBase):
    id: int
    model_config = {"from_attributes": True}


# --- Utility Bill ---
class UtilityBillBase(BaseModel):
    utility_id: int
    bill_date: date
    amount: float
    usage_value: Optional[float] = None
    usage_unit: Optional[str] = None

class UtilityBillCreate(UtilityBillBase):
    pass

class UtilityBillUpdate(UtilityBillBase):
    pass

class UtilityBillOut(UtilityBillBase):
    id: int
    model_config = {"from_attributes": True}


# --- File Attachment ---
class FileAttachmentOut(BaseModel):
    id: int
    entity_type: str
    entity_id: int
    filename: str
    filepath: str
    uploaded_at: datetime
    model_config = {"from_attributes": True}


# --- Dashboard ---
class DashboardData(BaseModel):
    upcoming_maintenance: list[MaintenanceOut]
    active_projects: list[ProjectOut]
    expiring_contracts: list[ContractOut]
    recent_bills: list[UtilityBillOut]
