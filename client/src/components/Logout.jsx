// src/pages/Logout.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Logout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.removeItem("role");
    navigate("/login", { replace: true });
  }, [navigate]);

  return null;
};

export default Logout;
