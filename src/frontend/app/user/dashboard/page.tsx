// app/user/dashboard/page.tsx (or app/dashboard/page.tsx)
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Loader,
  Center,
  Text,
  useMantineColorScheme,
} from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import DashboardHeader from "./DashboardHeader";
import DashboardMainContent from "./DashboardMainContent";
import { apiClient } from "../../lib/apiClient";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";
const MISSING_PERSONS_API = `${API_BASE_URL}/missing-persons`;
const MISSING_VEHICLES_API = `${API_BASE_URL}/missing-vehicles`;
const MY_MISSING_PERSONS_API = `${API_BASE_URL}/missing-persons/my-reports`;
const MY_MISSING_VEHICLES_API = `${API_BASE_URL}/missing-vehicles/my-reports`;
const MY_SIGHTINGS_API = `${API_BASE_URL}/sightings/my-sightings`;
const MY_NOTIFICATIONS_API = `${API_BASE_URL}/notifications/my-notifications`;

export default function Dashboard() {
  const router = useRouter();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const isTablet = useMediaQuery("(max-width: 1024px)");

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [missingPersons, setMissingPersons] = useState([]);
  const [missingVehicles, setMissingVehicles] = useState([]);
  const [userReports, setUserReports] = useState([]);
  const [recentSightings, setRecentSightings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [dataLoading, setDataLoading] = useState(false);

  const extractArray = (payload: any) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
  };

  // ---------- Helper functions ----------
  const getUserInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "blue";
      case "resolved":
        return "green";
      case "investigation":
        return "orange";
      default:
        return "gray";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "red";
      case "medium":
        return "yellow";
      case "low":
        return "green";
      default:
        return "gray";
    }
  };

  const getUserRoute = (path) => {
    if (!user) return path;
    if (path === "/login") return "/authentication/login";
    if (path === "/signup") return "/authentication/signup";
    const publicRoutes = ["/"];
    if (publicRoutes.includes(path)) return path;
    if (path.startsWith("/user")) return path;
    return `/user${path}`;
  };

  // ---------- Authentication check & redirect ----------
  useEffect(() => {
    const checkAuth = async () => {
      const userData = localStorage.getItem("currentUser");

      if (!userData) {
        router.push("/authentication/login");
        return;
      }

      try {
        const parsedUser = JSON.parse(userData);
        // Optional: redirect admin users to admin panel
        if (parsedUser.role && parsedUser.role.toLowerCase() === "admin") {
          router.push("/admin");
          return;
        }
        setUser(parsedUser);
      } catch (error) {
        router.push("/authentication/login");
        return;
      }
      setLoading(false);
    };

    checkAuth();

    const handleStorageChange = (e) => {
      if (e.key === "currentUser") {
        checkAuth();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [router]);

  // ---------- Fetch missing persons and vehicles ----------
  useEffect(() => {
    const fetchMissingData = async () => {
      setDataLoading(true);
      try {
        const [personsRes, vehiclesRes] = await Promise.all([
          apiClient(MISSING_PERSONS_API),
          apiClient(MISSING_VEHICLES_API),
        ]);

        if (personsRes.ok) {
          const persons = extractArray(await personsRes.json());
          setMissingPersons(persons.filter((p: any) => p.status === "Active"));
        }
        if (vehiclesRes.ok) {
          const vehicles = extractArray(await vehiclesRes.json());
          setMissingVehicles(vehicles.filter((v: any) => v.status === "Active"));
        }
      } catch (error) {
        console.error("Error fetching missing data:", error);
      } finally {
        setDataLoading(false);
      }
    };

    fetchMissingData();
  }, []);

  // ---------- Fetch recent sightings ----------
  useEffect(() => {
    const fetchSightings = async () => {
      try {
        const res = await apiClient(MY_SIGHTINGS_API);
        if (res.ok) {
          const payload = await res.json();
          const data = extractArray(payload);
          const sorted = data.sort(
            (a: any, b: any) => new Date(b.reportedAt || b.reportDate).getTime() - new Date(a.reportedAt || a.reportDate).getTime()
          );
          setRecentSightings(sorted.slice(0, 5));
        }
      } catch (error) {
        console.error("Error fetching sightings:", error);
      }
    };
    fetchSightings();
  }, []);

  // ---------- Fetch notifications ----------
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await apiClient(MY_NOTIFICATIONS_API);
        if (res.ok) {
          const payload = await res.json();
          const notifs = extractArray(payload);
          setNotifications(notifs);
          setUnreadCount(notifs.filter((n: any) => !n.isRead).length);
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };
    fetchNotifications();
  }, []);

  // ---------- Fetch only this user's registered cases ----------
  useEffect(() => {
    const fetchUserReports = async () => {
      if (!user) return;

      try {
        const [personsRes, vehiclesRes] = await Promise.all([
          apiClient(MY_MISSING_PERSONS_API),
          apiClient(MY_MISSING_VEHICLES_API),
        ]);

        let reports: any[] = [];

        if (personsRes.ok) {
          reports = reports.concat(extractArray(await personsRes.json()));
        }
        if (vehiclesRes.ok) {
          reports = reports.concat(extractArray(await vehiclesRes.json()));
        }

        setUserReports(reports);
      } catch (error) {
        console.error("Error fetching user reports:", error);
      }
    };

    fetchUserReports();
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("currentUser");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    setUser(null);
    router.push("/");
  };

  // Show loader while checking authentication
  if (loading) {
    return (
      <Center
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        }}
      >
        <Box
          style={{
            background: colorScheme === "dark" ? "#1A1B1E" : "white",
            padding: 40,
            borderRadius: 20,
            textAlign: "center",
          }}
        >
          <Loader size="xl" color="#2f80ed" />
          <Text mt="md">Loading your dashboard...</Text>
        </Box>
      </Center>
    );
  }

  return (
    <Box
      bg={colorScheme === "dark" ? "#1A1B1E" : "white"}
      style={{ minHeight: "100vh" }}
    >
      <DashboardHeader
        user={user}
        notifications={notifications}
        unreadCount={unreadCount}
        colorScheme={colorScheme}
        toggleColorScheme={toggleColorScheme}
        onLogout={handleLogout}
        getUserInitials={getUserInitials}
        getUserRoute={getUserRoute}
      />

      <DashboardMainContent
        user={user}
        missingPersons={missingPersons}
        missingVehicles={missingVehicles}
        userReports={userReports}
        recentSightings={recentSightings}
        dataLoading={dataLoading}
        colorScheme={colorScheme}
        getUserRoute={getUserRoute}
        getStatusColor={getStatusColor}
        getPriorityColor={getPriorityColor}
      />
    </Box>
  );
}