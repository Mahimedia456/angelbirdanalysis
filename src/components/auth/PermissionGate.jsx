import { useAuth } from "../../context/AuthContext";
import {
  hasPermission,
} from "../../utils/permissions";

export default function PermissionGate({
  permission,
  children,
  fallback = null,
}) {
  const { user } = useAuth();

  const permitted = hasPermission(
    user?.role,
    permission
  );

  if (!permitted) {
    return fallback;
  }

  return children;
}