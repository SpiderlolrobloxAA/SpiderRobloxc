import { Navigate, Outlet } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";

export default function PrivateRoute() {
  const [user, loading] = useAuthState(auth);
  if (loading) return <div>Loading…</div>;
  return user ? <Outlet /> : <Navigate to="/auth/login" replace />;
}
