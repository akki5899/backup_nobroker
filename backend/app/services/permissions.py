from functools import wraps
from fastapi import HTTPException, Depends
from ..models.user import User, UserType
from .auth import get_current_active_user

def require_owner(current_user: User = Depends(get_current_active_user)):
    """Require user to be an owner or agent"""
    if current_user.user_type not in [UserType.OWNER, UserType.AGENT, UserType.BUILDER]:
        raise HTTPException(
            status_code=403, 
            detail="Only property owners, agents, or builders can perform this action"
        )
    return current_user

def require_owner_or_admin(current_user: User = Depends(get_current_active_user)):
    """Require user to be owner, agent, builder, or admin"""
    if current_user.user_type not in [UserType.OWNER, UserType.AGENT, UserType.BUILDER]:
        raise HTTPException(
            status_code=403,
            detail="Insufficient permissions"
        )
    return current_user

def can_modify_property(property_owner_id: int, current_user: User = Depends(get_current_active_user)):
    """Check if user can modify specific property"""
    if current_user.id != property_owner_id:
        raise HTTPException(
            status_code=403,
            detail="You can only modify your own properties"
        )
    return current_user