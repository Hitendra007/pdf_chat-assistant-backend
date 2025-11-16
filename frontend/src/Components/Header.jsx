// components/Header.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";

const Header = () => {
  const { isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await logout();
      toast.success("Logged out successfully");
      navigate("/", { replace: true });
    } catch (error) {
      console.log("Error occurred during logout", error);
      toast.error("Failed to logout. Please try again.");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center group-hover:bg-blue-700 transition-colors">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              ChatDoc AI
            </h1>
          </Link>
          
          <nav className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                {user && (
                  <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold">
                        {(user.email && user.email.charAt(0).toUpperCase()) || (user.name && user.name.charAt(0).toUpperCase()) || "U"}
                      </span>
                    </div>
                    <span className="max-w-[150px] truncate" title={user.email || user.name || 'User'}>
                      {user.email || user.name || 'User'}
                    </span>
                  </div>
                )}
                <Link
                  to="/home"
                  className="hidden sm:block px-4 py-2 text-gray-700 hover:text-blue-600 font-medium transition-colors"
                >
                  My Chats
                </Link>
                <Link
                  to="/new-chat"
                  className="hidden sm:block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  New Chat
                </Link>
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    loggingOut
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-red-500 text-white hover:bg-red-600 shadow-md hover:shadow-lg"
                  }`}
                >
                  {loggingOut ? "Logging out..." : "Logout"}
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-gray-700 hover:text-blue-600 font-medium transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  Sign Up
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
