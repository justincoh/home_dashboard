from sqlalchemy import Column, Integer, String, Text, Numeric, Date, DateTime, Enum, ForeignKey, LargeBinary, Boolean
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


class Provider(Base):
    """Any company/person dealt with — utility, contractor, lawn care, etc.
    Merge of the former Vendor + Service. Referenced by Contracts, Quotes, LogEntries."""
    __tablename__ = "providers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    service_type = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    account_number = Column(String, nullable=True)
    contract_terms = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)

    contracts = relationship("Contract", back_populates="provider")
    quotes = relationship("Quote", back_populates="provider")
    log_entries = relationship("LogEntry", back_populates="provider")


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
    log_entries = relationship("LogEntry", back_populates="project")


class Quote(Base):
    __tablename__ = "quotes"
    id = Column(Integer, primary_key=True, index=True)
    provider_id = Column(Integer, ForeignKey("providers.id"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    amount = Column(Numeric(10, 2), nullable=False)
    date_received = Column(Date, nullable=False)

    provider = relationship("Provider", back_populates="quotes")
    project = relationship("Project", back_populates="quotes")


class Contract(Base):
    __tablename__ = "contracts"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    type = Column(Enum(ContractType), nullable=False)
    provider_id = Column(Integer, ForeignKey("providers.id"), nullable=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)
    cost = Column(Numeric(10, 2), nullable=True)
    payment_terms = Column(String, nullable=True)
    notes = Column(Text, nullable=True)

    provider = relationship("Provider", back_populates="contracts")


class LogEntry(Base):
    """The central object: one thing that happened on a date. Optional cost, provider,
    project, and file attachments. Merge of the former Service bill / Maintenance task /
    Bill. Recurrence fields (recurring/frequency/next_due) are inert reminders for
    display only — there is no scheduling engine."""
    __tablename__ = "log_entries"
    id = Column(Integer, primary_key=True, index=True)
    entry_date = Column(Date, nullable=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String, nullable=True)
    provider_id = Column(Integer, ForeignKey("providers.id"), nullable=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    amount = Column(Numeric(10, 2), nullable=True)
    usage_value = Column(Numeric(10, 2), nullable=True)
    usage_unit = Column(String, nullable=True)
    recurring = Column(Boolean, default=False)
    frequency = Column(String, nullable=True)
    next_due = Column(Date, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    provider = relationship("Provider", back_populates="log_entries")
    project = relationship("Project", back_populates="log_entries")


class FileAttachment(Base):
    __tablename__ = "file_attachments"
    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(String, nullable=False)
    entity_id = Column(Integer, nullable=False)
    filename = Column(String, nullable=False)
    filepath = Column(String, nullable=False)
    content_type = Column(String, nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    file_data = relationship("FileData", uselist=False, cascade="all, delete-orphan")


class FileData(Base):
    __tablename__ = "file_data"
    id = Column(Integer, ForeignKey("file_attachments.id", ondelete="CASCADE"), primary_key=True)
    data = Column(LargeBinary, nullable=False)
