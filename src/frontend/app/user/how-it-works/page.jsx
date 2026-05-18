
"use client";

import { Box, Container, useMantineColorScheme, Loader, Text, Stack } from "@mantine/core";
import { useEffect, useState } from "react";
import { useMediaQuery } from "@mantine/hooks";

// Import components
import DashboardHeader from "../dashboard/DashboardHeader";
import HowItWorksPageHeader from "../../components/how-it-works/HowItWorksPageHeader";
import StatsCards from "../../components/how-it-works/StatsCards";
import StepGuide from "../../components/how-it-works/StepGuide";
import CaseTypes from "../../components/how-it-works/CaseTypes";
import PricingSection from "../../components/how-it-works/PricingSection";
import FAQSection from "../../components/how-it-works/FAQSection";
import Testimonials from "../../components/how-it-works/Testimonials";
import CTASection from "../../components/how-it-works/CTASection";
import MainFooter from "../../components/MainFooter";

// Helper
const getBg = (colorScheme, light, dark) => (colorScheme === "dark" ? dark : light);

export default function HowItWorksPage() {
  const { colorScheme } = useMantineColorScheme();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem("currentUser");
    if (userData) setUser(JSON.parse(userData));
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <Box style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Stack align="center" gap="md">
          <Loader size="xl" color="blue" />
          <Text size="lg" fw={700} style={{ color: "#2f80ed" }}>Loading...</Text>
        </Stack>
      </Box>
    );
  }

  return (
    <Box bg={getBg(colorScheme, "white", "#1A1B1E")} style={{ minHeight: "100vh" }}>
      <DashboardHeader />
      
      <Container size="xl" py={40}>
        <HowItWorksPageHeader />
        <StatsCards />
        <StepGuide />
        <CaseTypes />
        <PricingSection user={user} />
        <FAQSection />
        <Testimonials />
        <CTASection user={user} />
      </Container>
      
      <MainFooter />
    </Box>
  );
}
