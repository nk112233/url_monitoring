import React, { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useDispatch, useSelector } from "react-redux";
import { initializeTheme } from "@/features/theme/themeSlice";

import SharedLayout from "@/components/SharedLayout";
import CreateMonitor from "@/pages/create-monitor";
import Monitors from "@/pages/monitors";
import Login from "@/pages/Login";
import Register from "@/pages/register";
import MonitorDetails from "@/pages/monitor-details";
import EmailConfirmation from "@/pages/email-confirmation";
import Incidents from "@/pages/incidents";
import Integrations from "./pages/integrations";
import IncidentAnalytics from "./pages/analytics";

const App = () => {
  const dispatch = useDispatch();
  const { isDarkMode } = useSelector((state) => state.theme);

  useEffect(() => {
    dispatch(initializeTheme());
  }, [dispatch]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  return (
    <>
      <Routes>
        <Route path="/" element={<SharedLayout />}>
          <Route index element={<Monitors />} />
          <Route path="/team/create-monitor" element={<CreateMonitor />} />
          <Route path="/team/incidents" element={<Incidents />} />
          <Route path="/team/analytics" element={<IncidentAnalytics />} />
          <Route path="/team/integrations" element={<Integrations />} />
          <Route
            path="/team/:teamID/monitor/:monitorID"
            element={<MonitorDetails />}
          />
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/email-verification" element={<EmailConfirmation />} />
      </Routes>
      <ToastContainer 
        theme={isDarkMode ? "dark" : "light"}
        style={{ fontSize: "15px" }}
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </>
  );
};

export default App;
