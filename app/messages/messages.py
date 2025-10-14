class Message:
    class Success:
        # Auth
        LOGOUT_SUCCESS = "Successfully logged out."
        SIGNUP_SUCCESSFUL = "Successfully logged in."
        # Company
        COMPANY_CREATED = "New company has been successfully created."
        COMPANY_UPDATED = "Company details have been successfully updated."
        COMPANY_DELETED = "Company has been successfully deleted."
        COMPANY_RETRIEVED = "Companies have been successfully retrieved."
        # Gas
        GAS_CREATED = "New gas has been successfully created."
        GAS_UPDATED = "Gas details have been successfully updated."
        GAS_DELETED = "Gas has been successfully deleted."
        GAS_RETRIEVED = "Gases have been successfully retrieved."
        # Order
        ORDER_CREATED = "Order created successfully."
        ORDER_UPDATED = "Order updated successfully."
        ORDER_DELETED = "Order deleted successfully."
        ORDER_RETRIEVED = "Order retrieved successfully."
        # Order Item
        ORDER_ITEM_CREATED = "Order item created successfully."
        ORDER_ITEM_UPDATED = "Order item updated successfully."
        ORDER_ITEM_DELETED = "Order item deleted successfully."
        ORDER_ITEM_RETRIEVED = "Order item retrieved successfully."
        # Health
        HEALTH_OK = "Service is running."

        # Order Status
        ORDER_STATUS_RETRIEVED = "Order statuses retrieved successfully."

        # User
        USER_CREATED = "New user has been successfully created."
        USER_UPDATED = "User details have been successfully updated."
        USER_DELETED = "User has been successfully deleted."
        USER_RETRIEVED = "Users retrieved successfully."

        # Role
        ROLE_RETRIEVED = "Roles have been successfully retrieved."

        # Dashboard
        FETCHED_SUCCESSFULLY = "Insights fetched successfully."

    class Error:
        # General
        BAD_REQUEST = "Bad request."
        UNAUTHORIZED = "Unauthorized access."
        FORBIDDEN = "Forbidden action."
        NOT_FOUND = "Resource not found."
        INTERNAL_SERVER_ERROR = "Internal server error."
        REQUIRED_FIELD = "This field is required."

        # Auth
        INVALID_CREDENTIALS = "Invalid credentials provided."
        NOT_AUTHENTICATED = "User not authenticated."
        INVALID_TOKEN = "Invalid or expired token."
        EMAIL_ALREADY_EXISTS = "Email is already registered."
        MOBILE_ALREADY_EXISTS = "Mobile number is already registered."

        # Roles & Permissions
        NOT_ADMIN = "Action requires administrator privileges."
        NOT_STAFF = "Action requires staff privileges."
        NOT_DRIVER = "Action requires driver privileges."
        # Company
        COMPANY_NOT_FOUND = "Company not found."
        COMPANY_NAME_EXISTS = "Company with this name already exists."
        COMPANY_REFERENCE_ID_EXISTS = "Company with this reference ID already exists."
        
        # Contact
        CONTACT_NOT_FOUND = "Contact not found."
        CONTACT_NAME_EXISTS = "Contact with this name already exists for the company."

        # Gas
        GAS_NOT_FOUND = "Gas not found."
        GAS_NAME_EXISTS = "Gas with this name already exists."

        # Order
        ORDER_NOT_FOUND = "Order not found."
        MINIMUM_ITEM_REQUIRED = "At least one item is required in an order."
        
        # Order Item
        ORDER_ITEM_NOT_FOUND = "Order item not found."
        ORDER_ITEM_INVALID = "Invalid order item."

        # User
        USER_NOT_FOUND = "User not found."
        
        # Status
        STATUS_NOT_FOUND = "Order status not found."
