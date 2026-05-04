"use client";

import { useState, useEffect } from "react";
import { Card, Text, Group, Badge, Button, Stack, Loader, Box } from "@mantine/core";
import { IconClock } from "@tabler/icons-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";

const getBg = (colorScheme, light, dark) => (colorScheme === "dark" ? dark : light);
const getTextColor = (colorScheme, light, dark) => (colorScheme === "dark" ? dark : light);
const getBorderColor = (colorScheme) => (colorScheme === "dark" ? "#2c2e33" : "#eaeef2");

export default function AlertHistoryTab({ colorScheme }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
        if (!token) throw new Error("No token found");

        const requestHeaders = {
          Authorization: `Bearer ${token}`,
        };

        const [vehiclesRes, personsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/missing-vehicles/my-reports`, { headers: requestHeaders }),
          fetch(`${API_BASE_URL}/missing-persons/my-reports`, { headers: requestHeaders }),
        ]);

        if (!vehiclesRes.ok || !personsRes.ok) {
          throw new Error("Failed to fetch alert history");
        }

        const vehiclesData = await vehiclesRes.json();
        const personsData = await personsRes.json();
        const vehicles = Array.isArray(vehiclesData?.data) ? vehiclesData.data : [];
        const persons = Array.isArray(personsData?.data) ? personsData.data : [];

        const vehicleAlerts = vehicles.map((v) => ({
          id: v._id || v.id,
          type: "Vehicle",
          location: v.location || "Unknown",
          time: v.reportDate ? new Date(v.reportDate).toLocaleDateString() : "Unknown",
          status: v.status || "Active",
        }));

        const personAlerts = persons.map((p) => ({
          id: p._id || p.id,
          type: "Person",
          location: p.location || "Unknown",
          time: p.reportDate ? new Date(p.reportDate).toLocaleDateString() : "Unknown",
          status: p.status || "Active",
        }));

        const allAlerts = [...vehicleAlerts, ...personAlerts].sort((a, b) => b.id - a.id);
        setAlerts(allAlerts.slice(0, 10)); // Show last 10 alerts
      } catch (error) {
        console.error("Error fetching alerts:", error);
        // Fallback mock data
        setAlerts([
          { id: 1, type: "Person", location: "Front Gate", time: "Feb 5, 2026", status: "Reviewed" },
          { id: 2, type: "Vehicle", location: "Driveway", time: "Feb 5, 2026", status: "Active" },
          { id: 3, type: "Person", location: "Backyard", time: "Feb 4, 2026", status: "Reviewed" },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, []);

  if (loading) {
    return (
      <Card withBorder radius="md" padding="lg" bg={getBg(colorScheme, "white", "#2c2e33")}>
        <Box style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 200 }}>
          <Loader size="md" color="blue" />
        </Box>
      </Card>
    );
  }

  return (
    <Card withBorder radius="md" padding="lg" bg={getBg(colorScheme, "white", "#2c2e33")}>
      <Text fw={500} size="md" mb="lg" c={getTextColor(colorScheme, "black", "white")}>
        Alert History
      </Text>

      <Stack gap="sm">
        {alerts.length === 0 ? (
          <Text ta="center" c="dimmed" py="xl">No alerts found</Text>
        ) : (
          alerts.map((alert) => (
            <Group
              key={alert.id}
              justify="space-between"
              py="sm"
              style={{ borderBottom: `1px solid ${getBorderColor(colorScheme)}` }}
            >
              <Group gap="sm">
                <Badge color={alert.type === "Person" ? "blue" : "green"} size="sm">
                  {alert.type}
                </Badge>
                <Box>
                  <Text size="sm" fw={500} c={getTextColor(colorScheme, "black", "white")}>
                    {alert.location}
                  </Text>
                  <Text size="xs" c="dimmed">{alert.time}</Text>
                </Box>
              </Group>
              <Badge color={alert.status === "Active" ? "yellow" : "gray"} size="sm" variant="light">
                {alert.status}
              </Badge>
            </Group>
          ))
        )}
      </Stack>

      <Button variant="subtle" fullWidth mt="md" onClick={() => window.location.href = "/alert"}>
        View all alerts
      </Button>
    </Card>
  );
}