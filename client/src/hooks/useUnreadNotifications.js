import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  getUnreadNotificationCounts,
  markNotificationsRead,
} from "../api/notificationsApi";
import { useAuth } from "../context/AuthContext";

const EMPTY_COUNTS = { total: 0, mentor: 0, mentee: 0 };

/**
 * Fetches unread mentee/mentor notification counts for navbar badges.
 * Refreshes on mount, route change, window focus, and a light interval.
 */
export function useUnreadNotifications() {
  const { user } = useAuth();
  const location = useLocation();
  const [counts, setCounts] = useState(EMPTY_COUNTS);

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setCounts(EMPTY_COUNTS);
      return EMPTY_COUNTS;
    }

    try {
      const next = await getUnreadNotificationCounts();
      setCounts(next);
      return next;
    } catch (err) {
      console.error("Failed to load unread notifications:", err);
      return EMPTY_COUNTS;
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) {
      setCounts(EMPTY_COUNTS);
      return undefined;
    }

    let cancelled = false;

    (async () => {
      try {
        if (location.pathname === "/my-requests") {
          await markNotificationsRead({ audience: "mentee" });
        } else if (location.pathname === "/mentor-inbox") {
          await markNotificationsRead({ audience: "mentor" });
        }

        const next = await getUnreadNotificationCounts();
        if (!cancelled) setCounts(next);
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to refresh notification badges:", err);
        }
      }
    })();

    const onFocus = () => {
      void getUnreadNotificationCounts()
        .then((next) => {
          if (!cancelled) setCounts(next);
        })
        .catch(() => {});
    };

    window.addEventListener("focus", onFocus);
    const intervalId = window.setInterval(onFocus, 60000);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
      window.clearInterval(intervalId);
    };
  }, [user?.id, location.pathname]);

  return { counts, refresh };
}

export default useUnreadNotifications;
