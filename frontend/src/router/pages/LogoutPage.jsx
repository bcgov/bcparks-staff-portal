import { useEffect } from "react";
import useAccess from "@/hooks/useAccess";
import LoadingBar from "@/components/LoadingBar";

export default function LogoutPage() {
  const { logOut } = useAccess();

  useEffect(() => {
    logOut();
  }, [logOut]);

  return (
    <div className="container mt-3">
      <LoadingBar />
    </div>
  );
}
