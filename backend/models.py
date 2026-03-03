from sqlalchemy import Column, Integer, String, Text, Numeric, Date, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
import enum
from datetime import datetime


class ProjectStatus(str, enum.Enum):
    planned = "planned"
    in_progress = "in_progress"
    done = "done"


class ContractType(str, enum.Enum):
    contract = "contract"
    warranty = "warranty"




class Vendor(Base):
    __tablename__ = "vendors"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    service_type = Column(String, nullable=False)

    contracts = relationship("Contract", back_populates="vendor")
    quotes = relationship("Quote", back_populates="vendor")


class Project(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(Enum(ProjectStatus), default=ProjectStatus.planned, nullable=False)
    budget = Column(Numeric(10, 2), nullable=True)
    actual_cost = Column(Numeric(10, 2), nullable=True)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)

    quotes = relationship("Quote", back_populates="project")


class Quote(Base):
    __tablename__ = "quotes"
    id = Column(Integer, primary_key=True, index=True)
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    amount = Column(Numeric(10, 2), nullable=False)
    date_received = Column(Date, nullable=False)

    vendor = relationship("Vendor", back_populates="quotes")
    project = relationship("Project", back_populates="quotes")


class Contract(Base):
    __tablename__ = "contracts"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    type = Column(Enum(ContractType), nullable=False)
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)
    cost = Column(Numeric(10, 2), nullable=True)
    payment_terms = Column(String, nullable=True)
    notes = Column(Text, nullable=True)

    vendor = relationship("Vendor", back_populates="contracts")


class MaintenanceTask(Base):
    __tablename__ = "maintenance_tasks"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    frequency = Column(String, nullable=False)
    last_completed = Column(Date, nullable=True)
    next_due = Column(Date, nullable=True)


class Utility(Base):
    __tablename__ = "utilities"
    id = Column(Integer, primary_key=True, index=True)
    provider_name = Column(String, nullable=False)
    account_number = Column(String, nullable=True)
    contact_info = Column(String, nullable=True)
    contract_terms = Column(Text, nullable=True)
    utility_type = Column(String, nullable=False)

    bills = relationship("UtilityBill", back_populates="utility", cascade="all, delete-orphan")


class UtilityBill(Base):
    __tablename__ = "utility_bills"
    id = Column(Integer, primary_key=True, index=True)
    utility_id = Column(Integer, ForeignKey("utilities.id"), nullable=False)
    bill_date = Column(Date, nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    usage_value = Column(Numeric(10, 2), nullable=True)
    usage_unit = Column(String, nullable=True)

    utility = relationship("Utility", back_populates="bills")


class FileAttachment(Base):
    __tablename__ = "file_attachments"
    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(String, nullable=False)
    entity_id = Column(Integer, nullable=False)
    filename = Column(String, nullable=False)
    filepath = Column(String, nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
