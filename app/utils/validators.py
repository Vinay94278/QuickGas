from datetime import datetime, timedelta
from pydantic import ValidationError

def validate_backdate(entered: datetime | None):
    if not entered:
        return True
    now = datetime.now()
    # allow up to 2 days back
    if entered < (now - timedelta(days=2)):
        raise ValidationError("created_at cannot be older than 2 days.")
    if entered > (now + timedelta(hours=1)):
        raise ValidationError("created_at cannot be in the future.")
    return True
