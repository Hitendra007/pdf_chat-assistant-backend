// components/Header.jsx
import React from "react";
import { Link,useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Header = () => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate()
  const HandelLogout = async ()=>{
    try {
        await logout();
        console.log("looged otu")
        navigate('/',{replace:true})
    } catch (error) {
        console.log("Error occured during logout",error)
    }
  }
  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white shadow">
      <h1 className="text-2xl font-bold text-blue-600">
        <Link to="/">ChatDoc AI</Link>
      </h1>
      <nav className="space-x-4">
        {isAuthenticated ? (
          <button
            onClick={HandelLogout}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Logout
          </button>
        ) : (
          <>
            <Link to="/login" className="text-blue-600 hover:underline">
              Login
            </Link>
            <Link
              to="/signup"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Sign Up
            </Link>
          </>
        )}
      </nav>
    </header>
  );
};

export default Header;
