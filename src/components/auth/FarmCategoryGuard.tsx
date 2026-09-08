import { ReactNode } from "react";
import { Navigate } from "@/lib/router-compat";
import { useEffectiveFarmCategory } from "@/hooks/useEffectiveFarmCategory";

type Props = {
  require: "LIVESTOCK" | "AGRICULTURE";
  children: ReactNode;
};

export default function FarmCategoryGuard({ require, children }: Props) {
  const { farmCategory, loading } = useEffectiveFarmCategory();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px] text-gray-500">
        Loading…
      </div>
    );
  }

  if (farmCategory !== require) {
    return <Navigate to="/account" replace />;
  }

  return <>{children}</>;
}
