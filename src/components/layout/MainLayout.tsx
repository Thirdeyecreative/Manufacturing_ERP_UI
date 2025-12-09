import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { Navigate } from "react-router-dom";
import { BASE_URL, Token } from "@/hooks/baseUrls";
import { useEffect, useState } from "react";
import axios from "axios";
import { usePermissions } from "@/hooks/usePermissions";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const token = localStorage.getItem("token");
    const { getPermissions } = usePermissions();

  useEffect(() => {
    const validateToken = async () => {

      if (!token) {
        console.log("No token found, redirecting to login.");

        return;
      }

      try {
        const backendUrl = `${BASE_URL}/admin-users/token/validate`;
        const formData = new FormData();
        formData.append("token", token);
        const response = await axios.post(backendUrl, formData);
        console.log("Token validation response:", response.data);

        if (response.data.errFlag !== 0) {
          localStorage.removeItem("token");
          localStorage.removeItem("permission");
          setIsAuthenticated(false);
          return;
        }

        setIsAuthenticated(true);
      } catch (error) {
        console.error("Token validation failed:", error);

        // Type guard to check if the error is an AxiosError
        if (axios.isAxiosError(error)) {
          console.error("Axios error details:", error.response?.data);
        }

        localStorage.removeItem("token");
        localStorage.removeItem("permission");
        setIsAuthenticated(false);
      }
    };

    validateToken();
  }, []);

  // Check if user has any permissions at all
  const hasAnyPermission = getPermissions().length > 0;

  if (localStorage.getItem("token") === null || isAuthenticated === false) {
    return <Navigate to="/login" />;
  }

  // If authenticated but no permissions, redirect to login (or show error)
  // if (isAuthenticated === true && !hasAnyPermission) {
  //   console.log("User has no permissions, redirecting to login");
  //   localStorage.removeItem("token");
  //   return <Navigate to="/login" />;
  // }
  return (
    <div className="h-screen flex bg-background">
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
