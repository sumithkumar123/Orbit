// src/components/Login.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, Radio } from "lucide-react";
import http from "../api/http";

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: "", type: "" });

    try {
      const payload = {
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      };

      // OFFLINE MODE: Hardcoded mock login bypass
      let role = "user";
      if (payload.email === "admin@offline.com") {
        role = "admin";
      }
      const token = "mock_offline_jwt_token_12345";

      localStorage.setItem("token", token);
      localStorage.setItem("role", role);
      setMessage({ text: "Login successful!", type: "success" });

      if (role === "admin") navigate("/admin-dashboard");
      else if (role === "user") navigate("/dashboard");
      else navigate("/login");
    } catch (error) {
      console.error("Login failed:", error);
      const messageText = error?.message?.toLowerCase() || "";
      const networkIssue =
        error.code === "ERR_NETWORK" ||
        messageText.includes("network") ||
        !error.response;

      const friendlyMessage = networkIssue
        ? "Cannot reach the API server. Check VITE_API_URL and your network."
        : error?.response?.data?.message || "Invalid email or password";

      setMessage({ text: friendlyMessage, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-b from-ink-900 via-ink-900 to-ink-800 text-paper-50 px-4 py-10">
      {/* Red glow background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 h-72 w-[40rem] rounded-full blur-3xl opacity-20"
          style={{
            background:
              "radial-gradient(closest-side, rgba(231,29,54,0.4), transparent)",
          }}
        />
      </div>

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-3xl bg-ink-800/60 backdrop-blur-md border border-ink-600 shadow-elev-2 p-6 sm:p-8"
      >
        {/* Logo + title */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <Radio className="text-brand h-5 w-5" />
          <h1 className="text-2xl font-semibold tracking-tight">OfflineOrbit</h1>
        </div>

        {/* Inputs */}
        <div className="space-y-4">
          {/* Email */}
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-paper-400 h-4 w-4" />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full rounded-xl bg-ink-700/60 border border-ink-600 pl-10 pr-3 py-3 text-paper-50 placeholder:text-paper-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition"
            />
          </div>

          {/* Password */}
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-paper-400 h-4 w-4" />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full rounded-xl bg-ink-700/60 border border-ink-600 pl-10 pr-10 py-3 text-paper-50 placeholder:text-paper-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-paper-400 hover:text-paper-200 focus:outline-none"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full bg-brand hover:bg-brand-600 transition-colors text-paper-50 py-3 rounded-xl font-medium tracking-wide shadow-md disabled:opacity-50"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        {/* Feedback message */}
        {message.text && (
          <p
            className={`mt-4 text-center text-sm ${
              message.type === "success"
                ? "text-green-400"
                : message.type === "error"
                ? "text-red-400"
                : "text-paper-400"
            }`}
          >
            {message.text}
          </p>
        )}

        {/* Footer link */}
        <p className="text-center mt-6 text-sm text-paper-400">
          New here?{" "}
          <Link
            to="/register"
            className="text-brand hover:text-brand-400 font-medium transition"
          >
            Create an account
          </Link>
        </p>
      </form>
    </div>
  );
};

export default Login;
