from typing import Optional, Dict, Any

class ApiResponse:
    def __init__(self, 
                 status_code: int, 
                 message: str, 
                 data: Optional[Dict[str, Any]] = None, 
                 errors: Optional[Dict[str, Any]] = None):
        self.status_code = status_code
        self.message = message
        self.data = data or {}
        self.errors = errors or {}

    def to_dict(self):
        return {
            "status_code": self.status_code,
            "message": self.message,
            "data": self.data,
            "errors": self.errors
        }
