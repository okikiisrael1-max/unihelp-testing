import { useMemo } from "react";

import { Loader2, ShieldAlert } from "lucide-react";
import { Navigate, Outlet } from "react-router-dom";

import useAdmin from "../hooks/useAdmin";

const AdminRoute = ({ children, dark }) => {
  const isAdmin = useAdmin();

  const loadingCard = useMemo(
    () =>
      dark
        ? "bg-[#020617] text-white"
        : "bg-[#f8fafc] text-slate-900",
    [dark]
  );

  if (isAdmin === null) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center px-4 ${loadingCard}`}
      >
        <div className="text-center">
          <Loader2
            size={42}
            className="mx-auto animate-spin text-indigo-500"
          />
          <p className="mt-4 text-sm opacity-70">
            Checking admin access...
          </p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children || <Outlet />;
};

export default AdminRoute;
