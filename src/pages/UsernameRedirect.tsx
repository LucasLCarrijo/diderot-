import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { normalizeUsername } from "@/lib/username";

/**
 * Redirect component for /@username routes.
 * Automatically redirects to the canonical /username route.
 */
export default function UsernameRedirect() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (username) {
      const normalized = normalizeUsername(username);
      navigate(`/${normalized}`, { replace: true });
    }
  }, [username, navigate]);

  return null;
}
