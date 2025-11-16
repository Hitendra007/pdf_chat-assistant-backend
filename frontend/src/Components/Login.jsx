import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const HandleLogin = async (e) => {
        e.preventDefault();
        const email = e.target.email.value.trim();
        const password = e.target.password.value;

        if (!email || !password) {
            toast.error('Please fill in all fields');
            return;
        }

        try {
            setLoading(true);
            await login(email, password);
            toast.success('Login successful!');
            navigate("/home");
        } catch (error) {
            const errorMsg = error.response?.data?.detail || error.response?.data?.message || 'Login failed. Please check your credentials.';
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-gray-50 px-4">
            <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl">
                <div className="text-center mb-6">
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">Welcome Back</h2>
                    <p className="text-gray-600">Login to ChatDoc AI</p>
                </div>

                <form className="space-y-5" onSubmit={HandleLogin}>
                    <div>
                        <label className="block text-gray-700 text-sm font-medium mb-2">Email</label>
                        <input
                            type="email"
                            name="email"
                            placeholder="you@example.com"
                            required
                            disabled={loading}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                        />
                    </div>

                    <div>
                        <label className="block text-gray-700 text-sm font-medium mb-2">Password</label>
                        <input
                            type="password"
                            name="password"
                            placeholder="••••••••"
                            required
                            disabled={loading}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-3 rounded-lg font-semibold text-white transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-100 ${
                            loading
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                    >
                        {loading ? (
                            <div className="flex items-center justify-center gap-2">
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Logging in...</span>
                            </div>
                        ) : (
                            'Login'
                        )}
                    </button>
                </form>

                <p className="text-center text-sm text-gray-600 mt-6">
                    Don't have an account?{" "}
                    <Link to="/signup" className="text-blue-600 hover:text-blue-700 font-medium hover:underline">
                        Sign Up
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
