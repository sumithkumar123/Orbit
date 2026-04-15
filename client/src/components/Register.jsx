// src/pages/Register.jsx
import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  User,
  Phone,
  Home,
  ImagePlus,
  Eye,
  EyeOff,
  Radio,
  Loader2,
  Tag,
} from "lucide-react";
import http from "../api/http";

const Register = () => {
  const [formData, setFormData] = useState({
    image: "",
    name: "",
    mobile: "",
    address: "",
    tag: "",
    email: "",
    password: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((s) => ({ ...s, [e.target.name]: e.target.value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    setImageFile(file || null);
    setPreviewUrl(file ? URL.createObjectURL(file) : "");
  };

  // Upload image to Local Server
  const handleImageUpload = async () => {
    if (!imageFile) return null;
    const data = new FormData();
    data.append("file", imageFile);

    try {
      // Use our new local upload endpoint
      const res = await http.post("/upload", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data.url; // Returns local path like /uploads/filename.ext
    } catch (error) {
      console.error("Image upload failed:", error);
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: "", type: "" });

    try {
      const imageUrl = await handleImageUpload();
      if (!imageUrl) {
        setMessage({ text: "Image upload failed", type: "error" });
        setLoading(false);
        return;
      }

      const payload = { ...formData, image: imageUrl };

      await http.post("/users/register", payload);

      setMessage({ text: "User registered successfully!", type: "success" });

      // reset and redirect
      setFormData({
        image: "",
        name: "",
        mobile: "",
        address: "",
        tag: "",
        email: "",
        password: "",
      });
      setImageFile(null);
      setPreviewUrl("");

      // small delay so the toast is visible, then go to login
      setTimeout(() => navigate("/login"), 900);
    } catch (error) {
      console.error(error);
      setMessage({
        text:
          error?.response?.data?.message || "Something went wrong. Try again.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-b from-ink-900 via-ink-900 to-ink-800 text-paper-50 px-4 py-10">
      {/* soft red glow */}
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
        className="w-full max-w-xl rounded-3xl bg-ink-800/60 backdrop-blur-md border border-ink-600 shadow-elev-2 p-6 sm:p-8"
      >
        {/* header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="flex items-center gap-2">
            <Radio className="text-brand h-5 w-5" />
            <h1 className="text-2xl font-semibold tracking-tight">Create account</h1>
          </div>
          <p className="mt-2 text-sm text-paper-400">
            Join OfflineOrbit and start chatting on your LAN securely.
          </p>
        </div>

        {/* image upload */}
        <div className="mb-5">
          <label className="block text-sm mb-2 text-paper-300">Profile image</label>
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-ink-700/60 border border-ink-600 overflow-hidden flex items-center justify-center">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <ImagePlus className="h-6 w-6 text-paper-400" />
              )}
            </div>
            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-ink-600 bg-ink-700/50 hover:bg-ink-700 transition cursor-pointer text-sm">
              <ImagePlus className="h-4 w-4" />
              <span>Upload image</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                required
              />
            </label>
          </div>
        </div>

        {/* fields grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* name */}
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-paper-400 h-4 w-4" />
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full rounded-xl bg-ink-700/60 border border-ink-600 pl-10 pr-3 py-3 text-paper-50 placeholder:text-paper-400 focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>

          {/* mobile */}
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-paper-400 h-4 w-4" />
            <input
              type="text"
              name="mobile"
              placeholder="Mobile Number"
              value={formData.mobile}
              onChange={handleChange}
              required
              className="w-full rounded-xl bg-ink-700/60 border border-ink-600 pl-10 pr-3 py-3 text-paper-50 placeholder:text-paper-400 focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>

          {/* address (full width on mobile) */}
          <div className="relative sm:col-span-2">
            <Home className="absolute left-3 top-1/2 -translate-y-1/2 text-paper-400 h-4 w-4" />
            <input
              type="text"
              name="address"
              placeholder="Address"
              value={formData.address}
              onChange={handleChange}
              required
              className="w-full rounded-xl bg-ink-700/60 border border-ink-600 pl-10 pr-3 py-3 text-paper-50 placeholder:text-paper-400 focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>

          {/* tag */}
          <div className="relative">
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-paper-400 h-4 w-4" />
            <input
              type="text"
              name="tag"
              placeholder="Profile tag / handle"
              value={formData.tag}
              onChange={handleChange}
              required
              className="w-full rounded-xl bg-ink-700/60 border border-ink-600 pl-10 pr-3 py-3 text-paper-50 placeholder:text-paper-400 focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>

          {/* email */}
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-paper-400 h-4 w-4" />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full rounded-xl bg-ink-700/60 border border-ink-600 pl-10 pr-3 py-3 text-paper-50 placeholder:text-paper-400 focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>

          {/* password */}
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-paper-400 h-4 w-4" />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full rounded-xl bg-ink-700/60 border border-ink-600 pl-10 pr-10 py-3 text-paper-50 placeholder:text-paper-400 focus:outline-none focus:ring-2 focus:ring-brand"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-paper-400 hover:text-paper-200 focus:outline-none"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* submit */}
        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full bg-brand hover:bg-brand-600 transition-colors text-paper-50 py-3 rounded-xl font-medium tracking-wide shadow-md disabled:opacity-50 inline-flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Registering...
            </>
          ) : (
            "Register"
          )}
        </button>

        {/* feedback */}
        {message.text && (
          <p
            className={`mt-4 text-center text-sm ${message.type === "success"
                ? "text-green-400"
                : message.type === "error"
                  ? "text-red-400"
                  : "text-paper-400"
              }`}
          >
            {message.text}
          </p>
        )}

        {/* footer */}
        <p className="text-center mt-6 text-sm text-paper-400">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-brand hover:text-brand-400 font-medium transition"
          >
            Login
          </Link>
        </p>
      </form>
    </div>
  );
};

export default Register;
