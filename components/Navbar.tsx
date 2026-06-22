import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";
import { useAuth } from "../context/AuthContext";
import { logout } from "../services/authService";

const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const isTransparent = location.pathname === "/";

  const navClass = isTransparent
    ? "bg-gray-200 dark:bg-surface-dark/80 backdrop-blur-md border-b border-[#e7f3e9] dark:border-[#2a4d31]"
    : "bg-surface-light dark:bg-surface-dark border-b border-[#e7f3e9] dark:border-[#2a4d31]";

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <header className={`sticky top-0 z-50 w-full ${navClass}`}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center">
          <img
            src="logo.png"
            alt="TerraVision"
            className="h-20 w-auto object-contain"
          />
        </Link>
        <nav className="hidden md:flex items-center gap-8">
          {isAuthenticated && (
            <>
              <Link
                to="/map"
                className={`text-sm font-medium hover:text-primary transition-colors ${location.pathname === "/map" ? "text-primary" : "text-text-main dark:text-text-main"}`}
              >
                Interactive Map
              </Link>
              <Link
                to="/transform"
                className={`text-sm font-medium hover:text-primary transition-colors ${location.pathname === "/transform" ? "text-primary" : "text-text-main dark:text-text-main"}`}
              >
                AI Transformation
              </Link>
              <Link
                to="/dashboard"
                className={`text-sm font-medium hover:text-primary transition-colors ${location.pathname === "/dashboard" ? "text-primary" : "text-text-main dark:text-text-main"}`}
              >
                Impact Dashboard
              </Link>
            </>
          )}
          {!isAuthenticated && (
            <Link
              to="/login"
              className={`text-sm font-medium hover:text-primary transition-colors ${location.pathname === "/login" ? "text-primary" : "text-text-main dark:text-text-main"}`}
            >
              Login
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || "User"}
                  className="h-9 w-9 rounded-full border-2 border-primary/20 object-cover cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => navigate("/profile")}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") navigate("/profile");
                  }}
                />
              ) : (
                <div
                  className="h-9 w-9 rounded-full border-2 border-primary/20 bg-primary text-white flex items-center justify-center text-sm font-bold cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => navigate("/profile")}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") navigate("/profile");
                  }}
                >
                  {user?.displayName
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2) || "U"}
                </div>
              )}
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          ) : (
            <div
              className="h-9 w-9 overflow-hidden rounded-full border-2 border-primary/20 bg-gray-200 dark:bg-gray-700 cursor-pointer"
              role="button"
              tabIndex={0}
              onClick={() => navigate("/login")}
              onKeyDown={(e) => {
                if ((e as React.KeyboardEvent).key === "Enter")
                  navigate("/login");
              }}
              aria-label="Open login"
            >
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuB9-Nb3aRjGhOZIvN0KnPMSCH1Zq92I-mzZxS0U1KKqDca_jO2kceKq5myUjsXLytS3mDwBh_8JpgvEr5-6NYLgYbrLTOzglmiYqPQvebCV2LI7wmd61GQw_NzYgECi1g85NUmYby48JcdKPo9ikuUXWOibAvfk_bMHMxfugGKzUE8pdBSb1qocLpcEkNrYyQK12HeixNX7J6sf4CPtwSe1qAlTFPmP8z-lpkN3StUs9scGECNNA_6r-dywHEeiRfgosGIY8YTUeg"
                alt="User"
                className="h-full w-full object-cover"
              />
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
