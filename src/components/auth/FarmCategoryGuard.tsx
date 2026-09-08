import { ReactNode } from "react";
import { Navigate } from "@/lib/router-compat";
import { useEffectiveFarmCategory } from "@/hooks/useEffectiveFarmCategory";
import { isLoggedIn } from "@/hooks/api/auth";
import { canAccessAgriculture } from "@/utils/agricultureAccess";
import AgricultureUpcomingNotice from "@/components/AgricultureUpcomingNotice";

type Props = {
  require: "LIVESTOCK" | "AGRICULTURE";
  children: ReactNode;
};

export default function FarmCategoryGuard({ require, children }: Props) {
  const user = isLoggedIn();
  const { farmCategory, loading } = useEffectiveFarmCategory();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px] text-gray-500">
        Loading…
      </div>
    );
  }

  if (require === "AGRICULTURE" && !canAccessAgriculture(user?.role)) {
    return <AgricultureUpcomingNotice />;
  }

  if (farmCategory !== require) {
    return <Navigate to="/account" replace />;
  }

  return <>{children}</>;
}
