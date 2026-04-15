// src/pages/Profile.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Loader2,
  Trash2,
  Save,
  UserCircle2,
  ImagePlus,
  Pencil,
  X,
} from "lucide-react";
import http from "../api/http";

const Profile = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    address: "",
    tag: "",
    email: "",
    role: "",
    imageUrl: "",
  });

  const [originalData, setOriginalData] = useState(null);

  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  const [editState, setEditState] = useState({
    image: false,
    name: false,
    mobile: false,
    tag: false,
    address: false,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isAnyEditing = useMemo(
    () => Object.values(editState).some(Boolean),
    [editState]
  );

  // Fetch profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        setError("");

        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }

        const res = await http.get("/users/profile");

        const user = res.data.user || res.data;
        const data = {
          name: user.name || "",
          mobile: user.mobile || "",
          address: user.address || "",
          tag: user.tag || "",
          email: user.email || "",
          role: user.role || "",
          imageUrl: user.image || "",
        };

        setFormData(data);
        setOriginalData(data);
        setPreviewUrl(user.image || "");
      } catch (err) {
        console.error(err);
        setError(
          err?.response?.data?.message ||
            "Failed to load profile. Please try again."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  // Text change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
    setSuccess("");
  };

  // Image change
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setError("");
    setSuccess("");
  };

  // Toggle edit for a field
  const toggleEdit = (field) => {
    setEditState((prev) => {
      const newState = { ...prev, [field]: !prev[field] };

      // If we are cancelling edit, reset that field to original
      if (prev[field] === true && originalData) {
        setFormData((fd) => ({
          ...fd,
          [field === "image" ? "imageUrl" : field]:
            originalData[field === "image" ? "imageUrl" : field],
        }));

        if (field === "image") {
          setPreviewUrl(originalData.imageUrl || "");
          setImageFile(null);
        }
      }

      setError("");
      setSuccess("");
      return newState;
    });
  };

  // Save changes
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setIsSaving(true);
      setError("");
      setSuccess("");

      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const data = new FormData();
      data.append("name", formData.name);
      data.append("mobile", formData.mobile);
      data.append("address", formData.address);
      data.append("tag", formData.tag);

      if (imageFile) {
        data.append("image", imageFile);
      }

      const res = await http.put("/users/profile", data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const updatedUser = res.data.user || res.data;
      const updatedData = {
        name: updatedUser.name || "",
        mobile: updatedUser.mobile || "",
        address: updatedUser.address || "",
        tag: updatedUser.tag || "",
        email: updatedUser.email || "",
        role: updatedUser.role || "",
        imageUrl: updatedUser.image || "",
      };

      setFormData(updatedData);
      setOriginalData(updatedData);
      setPreviewUrl(updatedUser.image || "");
      setImageFile(null);

      setEditState({
        image: false,
        name: false,
        mobile: false,
        tag: false,
        address: false,
      });

      setSuccess("Profile updated successfully.");
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
          "Failed to update profile. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Delete account
  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete your account? This action cannot be undone."
    );
    if (!confirmed) return;

    try {
      setIsDeleting(true);
      setError("");
      setSuccess("");

      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      await http.delete("/users/profile");

      localStorage.removeItem("token");
      localStorage.removeItem("role");
      navigate("/login", { replace: true });
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
          "Failed to delete account. Please try again."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink-900 text-paper-50">
        <div className="flex items-center gap-2 text-paper-200">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading profile...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink-900 text-paper-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-1 rounded-full bg-brand" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              My Profile
            </h1>
            <p className="text-sm text-paper-300">
              View and update your account information.
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-ink-800/80 border border-ink-700 rounded-2xl p-6 shadow-xl">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar & role */}
            <div className="md:w-1/3 flex flex-col items-center gap-4">
              <div className="h-28 w-28 rounded-full bg-ink-700 flex items-center justify-center border border-ink-600 overflow-hidden">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt={formData.name || "Profile"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <UserCircle2 className="h-14 w-14 text-paper-400" />
                )}
              </div>
              <div className="text-center">
                <p className="font-semibold text-lg">
                  {formData.name || "User"}
                </p>
                <p className="text-xs uppercase tracking-wide text-brand-300 mt-1">
                  {formData.role || "User"}
                </p>
              </div>
            </div>

            {/* Form */}
            <div className="md:w-2/3">
              <form className="space-y-4" onSubmit={handleSubmit}>
                {/* Image section */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm text-paper-300">
                      Profile image
                    </label>
                    <button
                      type="button"
                      onClick={() => toggleEdit("image")}
                      className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg border border-ink-600 hover:bg-ink-700 transition"
                    >
                      {editState.image ? (
                        <>
                          <X className="h-3 w-3" />
                          Cancel
                        </>
                      ) : (
                        <>
                          <Pencil className="h-3 w-3" />
                          Edit
                        </>
                      )}
                    </button>
                  </div>

                  {editState.image ? (
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
                        />
                      </label>
                    </div>
                  ) : (
                    <p className="text-[11px] text-paper-400">
                      Current profile picture. Click Edit to change.
                    </p>
                  )}
                </div>

                {/* Name & Tag */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Name */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium text-paper-200">
                        Name
                      </label>
                      <button
                        type="button"
                        onClick={() => toggleEdit("name")}
                        className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg border border-ink-600 hover:bg-ink-700 transition"
                      >
                        {editState.name ? (
                          <>
                            <X className="h-3 w-3" />
                            Cancel
                          </>
                        ) : (
                          <>
                            <Pencil className="h-3 w-3" />
                            Edit
                          </>
                        )}
                      </button>
                    </div>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      disabled={!editState.name}
                      className={`w-full rounded-lg px-3 py-2 text-sm bg-ink-900 border ${
                        editState.name
                          ? "border-ink-600 focus:outline-none focus:ring-2 focus:ring-brand/70 focus:border-brand"
                          : "border-ink-700 text-paper-300 cursor-default"
                      }`}
                    />
                  </div>

                  {/* Tag */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium text-paper-200">
                        Tag
                      </label>
                      <button
                        type="button"
                        onClick={() => toggleEdit("tag")}
                        className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg border border-ink-600 hover:bg-ink-700 transition"
                      >
                        {editState.tag ? (
                          <>
                            <X className="h-3 w-3" />
                            Cancel
                          </>
                        ) : (
                          <>
                            <Pencil className="h-3 w-3" />
                            Edit
                          </>
                        )}
                      </button>
                    </div>
                    <input
                      type="text"
                      name="tag"
                      value={formData.tag}
                      onChange={handleChange}
                      disabled={!editState.tag}
                      placeholder="e.g., Student, Working Professional"
                      className={`w-full rounded-lg px-3 py-2 text-sm bg-ink-900 border ${
                        editState.tag
                          ? "border-ink-600 focus:outline-none focus:ring-2 focus:ring-brand/70 focus:border-brand"
                          : "border-ink-700 text-paper-300 cursor-default"
                      }`}
                    />
                  </div>
                </div>

                {/* Mobile & Email */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Mobile */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium text-paper-200">
                        Mobile
                      </label>
                      <button
                        type="button"
                        onClick={() => toggleEdit("mobile")}
                        className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg border border-ink-600 hover:bg-ink-700 transition"
                      >
                        {editState.mobile ? (
                          <>
                            <X className="h-3 w-3" />
                            Cancel
                          </>
                        ) : (
                          <>
                            <Pencil className="h-3 w-3" />
                            Edit
                          </>
                        )}
                      </button>
                    </div>
                    <input
                      type="tel"
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleChange}
                      disabled={!editState.mobile}
                      className={`w-full rounded-lg px-3 py-2 text-sm bg-ink-900 border ${
                        editState.mobile
                          ? "border-ink-600 focus:outline-none focus:ring-2 focus:ring-brand/70 focus:border-brand"
                          : "border-ink-700 text-paper-300 cursor-default"
                      }`}
                    />
                  </div>

                  {/* Email (read-only) */}
                  <div>
                    <label className="block text-sm font-medium text-paper-200 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      disabled
                      className="w-full rounded-lg px-3 py-2 text-sm bg-ink-900 border border-ink-700 text-paper-400 cursor-not-allowed"
                    />
                    <p className="text-[11px] text-paper-400 mt-1">
                      Email can’t be changed from here.
                    </p>
                  </div>
                </div>

                {/* Address */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-paper-200">
                      Address
                    </label>
                    <button
                      type="button"
                      onClick={() => toggleEdit("address")}
                      className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg border border-ink-600 hover:bg-ink-700 transition"
                    >
                      {editState.address ? (
                        <>
                          <X className="h-3 w-3" />
                          Cancel
                        </>
                      ) : (
                        <>
                          <Pencil className="h-3 w-3" />
                          Edit
                        </>
                      )}
                    </button>
                  </div>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows={3}
                    disabled={!editState.address}
                    className={`w-full rounded-lg px-3 py-2 text-sm bg-ink-900 border resize-none ${
                      editState.address
                        ? "border-ink-600 focus:outline-none focus:ring-2 focus:ring-brand/70 focus:border-brand"
                        : "border-ink-700 text-paper-300 cursor-default"
                    }`}
                  />
                </div>

                {/* Messages */}
                {error && (
                  <div className="text-sm text-red-400 bg-red-950/40 border border-red-900/60 rounded-md px-3 py-2">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="text-sm text-emerald-400 bg-emerald-950/30 border border-emerald-900/50 rounded-md px-3 py-2">
                    {success}
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={isSaving || !isAnyEditing}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-brand text-sm font-medium text-paper-50 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    disabled={isDeleting}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-700/90 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-60 disabled:cursor-not-allowed transition"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4" />
                        Delete Account
                      </>
                    )}
                  </button>
                </div>
              </form>

              <p className="text-[11px] text-paper-500 mt-4">
                Note: Password changes should be done from the{" "}
                <span className="text-brand-300">Change Password</span> or
                Forgot Password flow.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
