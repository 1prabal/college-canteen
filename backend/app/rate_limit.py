import time
from typing import Dict, Tuple
from .config import settings

class PickupVerificationRateLimiter:
    """
    In-memory rate limiter tracking failed pickup verification attempts per order.
    Locks out attempts if failed attempts exceed maximum within the lockout window.
    """
    def __init__(self):
        # order_id -> (failed_count, last_failed_timestamp)
        self._attempts: Dict[int, Tuple[int, float]] = {}

    def is_locked(self, order_id: int) -> Tuple[bool, int]:
        """
        Returns (is_locked, remaining_lockout_seconds).
        """
        if order_id not in self._attempts:
            return False, 0
        
        count, last_time = self._attempts[order_id]
        lockout_duration = settings.PICKUP_VERIFICATION_LOCKOUT_MINUTES * 60
        time_passed = time.time() - last_time

        if count >= settings.PICKUP_VERIFICATION_MAX_ATTEMPTS:
            if time_passed < lockout_duration:
                remaining_sec = int(lockout_duration - time_passed)
                return True, remaining_sec
            else:
                # Lockout expired, reset counter
                del self._attempts[order_id]
                return False, 0
        
        return False, 0

    def record_failure(self, order_id: int) -> int:
        """
        Increments failed attempt count and returns current failed attempts.
        """
        now = time.time()
        if order_id in self._attempts:
            count, _ = self._attempts[order_id]
            new_count = count + 1
            self._attempts[order_id] = (new_count, now)
            return new_count
        else:
            self._attempts[order_id] = (1, now)
            return 1

    def reset(self, order_id: int) -> None:
        """
        Resets failed attempts upon successful passcode verification.
        """
        self._attempts.pop(order_id, None)

pickup_rate_limiter = PickupVerificationRateLimiter()
