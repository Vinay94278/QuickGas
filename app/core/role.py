from fastapi import HTTPException, status , Depends
from app.models.users import User
from app.messages.messages import Message
from app.dependencies import get_current_user

class Role:
    ADMIN = 1
    DISPATCHER = 2
    DRIVER = 3
    CUSTOMER = 4

def require_role(required_role: int):
    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role_id != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=Message.Error.FORBIDDEN
            )
        return current_user
    return role_checker

# Role-specific dependencies
AdminOnly = require_role(Role.ADMIN)
DispatcherOnly = require_role(Role.DISPATCHER)
DriverOnly = require_role(Role.DRIVER)
CustomerOnly = require_role(Role.CUSTOMER)

def require_roles(required_roles: list[int]):
    def roles_checker(current_user: User = Depends(get_current_user)):
        if current_user.role_id not in required_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=Message.Error.FORBIDDEN
            )
        return current_user
    return roles_checker

# Common role combinations
AdminOrDispatcher = require_roles([Role.ADMIN, Role.DISPATCHER])
StaffOnly = require_roles([Role.ADMIN, Role.DISPATCHER, Role.DRIVER])