from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..core.database import Base

class PropertyVisit(Base):
    __tablename__ = "property_visits"
    
    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    visit_date = Column(DateTime, nullable=False)
    status = Column(String(50), default="pending")  # pending, confirmed, cancelled, completed
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    property = relationship("Property")
    user = relationship("User")

class RentalAgreement(Base):
    __tablename__ = "rental_agreements"
    
    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=False)
    tenant_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    rent_amount = Column(Integer, nullable=False)
    deposit_amount = Column(Integer, nullable=False)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    status = Column(String(50), default="active")  # active, pending, expired, terminated
    agreement_url = Column(String(500))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    property = relationship("Property")
    tenant = relationship("User", foreign_keys=[tenant_id])
    owner = relationship("User", foreign_keys=[owner_id])