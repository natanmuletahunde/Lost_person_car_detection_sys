"use client";

import {
  Box,
  Container,
  Title,
  Text,
  Button,
  Group,
  Card,
  Stack,
  Badge,
  Divider,
  ThemeIcon,
  useMantineTheme,
  ActionIcon,
  Paper,
  useMantineColorScheme,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { apiClient } from "../../lib/apiClient";
import {
  IconCheck,
  IconCrown,
  IconShieldCheck,
  IconBell,
  IconStar,
  IconAlertCircle,
  IconCircle,
  IconCircleFilled,
  IconX,
  IconChevronRight,
  IconSparkles,
  IconGift,
  IconArrowUp,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useMediaQuery } from "@mantine/hooks";
import MainFooter from "../../components/MainFooter";
import { motion, AnimatePresence } from "framer-motion";

export default function SubscriptionPage() {
  const router = useRouter();
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';
  const isMobile = useMediaQuery("(max-width: 768px)");
  const isTablet = useMediaQuery("(max-width: 1024px)");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState("annual");
  const [activeIndex, setActiveIndex] = useState(1);
  const [isHovering, setIsHovering] = useState(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [cardHeights, setCardHeights] = useState([]);
  const cardRefs = useRef([]);

  const primaryColor = "#0034D1";
  const primaryLight = "#3358FF";
  const primaryDark = "#0029A6";
  const accentColor = "#FFD700";
  const accentLight = "#FFF4CC";

  // Optimized spacing scale
  const spacing = {
    xs: isMobile ? 4 : 8,
    sm: isMobile ? 8 : 12,
    md: isMobile ? 12 : 16,
    lg: isMobile ? 16 : 24,
    xl: isMobile ? 24 : 32,
    xxl: isMobile ? 32 : 40,
  };

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleClose = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const fromParam = urlParams.get('from');
    const referrer = typeof document !== 'undefined' ? document.referrer || "" : "";
    
    if (fromParam === 'dashboard' || referrer.includes('dashboard')) {
      router.push('/user/dashboard');
    } else {
      router.push('/');
    }
  };

  useEffect(() => {
    const checkAuth = () => {
      const userData = localStorage.getItem("currentUser");

      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);

        if (parsedUser.hasPaidSubscription) {
          router.push("/user/register");
          return;
        }
      }

      setLoading(false);
    };

    checkAuth();
  }, [router]);

  const plans = [
    {
      id: "monthly",
      name: "Monthly",
      price: "400.00",
      currency: "birr",
      period: "month",
      badge: "Basic Plan",
      badgeColor: "blue",
      features: [
        { text: "2 Providers", included: true },
        { text: "Client billing", included: true },
        { text: "Free staging", included: true },
        { text: "Code licence", included: true },
        { text: "White labelling", included: true },
        { text: "Data protection", included: true },
      ],
      color: `linear-gradient(135deg, ${primaryDark} 0%, ${primaryColor} 100%)`,
      hoverColor: `linear-gradient(135deg, ${primaryDark} 0%, ${primaryLight} 100%)`,
    },
    {
      id: "annual",
      name: "Annual",
      price: "360.00",
      originalPrice: "400.00",
      currency: "birr",
      period: "month",
      badge: "SAVE 10%",
      badgeColor: "green",
      description: "0.00 birr when you have not yet to receive an invoice",
      features: [
        { text: "Everything in Monthly plan", included: true },
        { text: "Referral program", included: true },
        { text: "Web customization", included: true },
        { text: "Marketing tools", included: true },
        { text: "Priority support 24/7", included: true },
        { text: "Advanced analytics", included: true },
      ],
      popular: true,
      color: `linear-gradient(135deg, #001F6E 0%, ${primaryColor} 100%)`,
      hoverColor: `linear-gradient(135deg, #001F6E 0%, ${primaryLight} 100%)`,
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: "Custom",
      currency: "",
      period: "",
      badge: "Premium",
      badgeColor: "violet",
      features: [
        { text: "Everything in Annual plan", included: true },
        { text: "Unlimited providers", included: true },
        { text: "Dedicated account manager", included: true },
        { text: "Custom SLA agreements", included: true },
        { text: "Enterprise-grade support", included: true },
        { text: "Custom development", included: true },
      ],
      color: `linear-gradient(135deg, #1C1C84 0%, ${primaryLight} 100%)`,
      hoverColor: `linear-gradient(135deg, #1C1C84 0%, #4D72FF 100%)`,
    },
  ];

  // Calculate max card height based on content
  useEffect(() => {
    const updateCardHeights = () => {
      const heights = cardRefs.current.map((ref) => {
        if (!ref) return 0;
        return ref.offsetHeight;
      });
      setCardHeights(heights);
    };

    // Update heights on mount and when window resizes
    updateCardHeights();
    window.addEventListener("resize", updateCardHeights);

    // Also update after a short delay to ensure content is rendered
    const timeoutId = setTimeout(updateCardHeights, 100);

    return () => {
      window.removeEventListener("resize", updateCardHeights);
      clearTimeout(timeoutId);
    };
  }, [isMobile, isTablet]);

  const getMaxCardHeight = () => {
    return cardHeights.length > 0
      ? Math.max(...cardHeights) + (isMobile ? 60 : 80)
      : isMobile
        ? 600
        : 650;
  };

  const handleDotClick = (index) => {
    setActiveIndex(index);
    setSelectedPlan(plans[index].id);
  };

  const handleUpgrade = async (planToUpgrade) => {
    const selectedPlanData = planToUpgrade || plans.find((p) => p.id === selectedPlan);

    if (selectedPlanData.id === "enterprise") {
      router.push("/contact?plan=enterprise");
      return;
    }

    if (!user) {
      notifications.show({
        title: "Login Required",
        message: "Please login to subscribe to a premium plan.",
        color: "yellow",
      });
      router.push("/login");
      return;
    }

    notifications.show({
      id: "chapa-init",
      title: "Connecting to Chapa",
      message: "Please wait while we initialize your secure payment...",
      loading: true,
      autoClose: false,
      withCloseButton: false,
    });

    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1';
      
      const nameParts = (user?.name || "").trim().split(/\s+/);
      const firstName = user?.firstName || nameParts[0] || "User";
      const lastName = user?.lastName || nameParts.slice(1).join(" ") || "User";
      const phone = user?.phone || "";

      const response = await apiClient(`${API_BASE_URL}/chapa/initialize`, {
        method: "POST",
        body: JSON.stringify({
          plan: selectedPlanData.id,
          userId: user?._id || user?.id,
          email: user?.email,
          firstName,
          lastName,
          phone: phone.trim(),
        }),
      });

      const data = await response.json();
      
      if (response.ok && data?.success && data?.data?.checkout_url) {
        notifications.update({
          id: "chapa-init",
          title: "Redirecting",
          message: "Redirecting you to Chapa payment portal...",
          color: "green",
          loading: false,
          autoClose: 2000,
        });
        window.location.href = data.data.checkout_url;
      } else {
        let msg = "Failed to initialize payment";
        if (data?.message) {
          if (typeof data.message === "string") {
            msg = data.message;
          } else if (typeof data.message === "object") {
            msg = Object.values(data.message).flat().join(" ");
          }
        }
        throw new Error(msg);
      }
    } catch (error) {
      console.error("Chapa upgrade error:", error);
      notifications.update({
        id: "chapa-init",
        title: "Payment Error",
        message: error.message || "Failed to initiate payment. Please try again later.",
        color: "red",
        loading: false,
        autoClose: 5000,
      });
    }
  };

  const getCardTransform = (index) => {
    const offset = index - activeIndex;

    if (isMobile) {
      return {
        transform: `translateX(${offset * 100}%)`,
        opacity: Math.abs(offset) <= 1 ? 1 : 0,
        zIndex: 10 - Math.abs(offset),
      };
    }

    if (isTablet) {
      const translatePercentage = offset * 85;
      if (offset === 0) {
        return {
          transform: `translateX(${translatePercentage}%) scale(1.05)`,
          zIndex: 30,
          opacity: 1,
          boxShadow: `0 25px 50px -12px ${primaryColor}40`,
        };
      } else if (Math.abs(offset) === 1) {
        return {
          transform: `translateX(${translatePercentage}%) scale(0.92)`,
          zIndex: 20,
          opacity: 0.85,
        };
      } else {
        return {
          transform: `translateX(${translatePercentage}%) scale(0.8)`,
          zIndex: 10,
          opacity: 0.3,
        };
      }
    }

    const translatePercentage = offset * 75;
    if (offset === 0) {
      return {
        transform: `translateX(${translatePercentage}%) scale(1.08)`,
        zIndex: 30,
        opacity: 1,
        boxShadow: `0 30px 60px -15px ${primaryColor}50`,
      };
    } else if (Math.abs(offset) === 1) {
      return {
        transform: `translateX(${translatePercentage}%) scale(0.95)`,
        zIndex: 20,
        opacity: 0.9,
      };
    } else {
      return {
        transform: `translateX(${translatePercentage}%) scale(0.85)`,
        zIndex: 10,
        opacity: 0.4,
      };
    }
  };

  const getPlanPriceDisplay = (plan) => {
    if (plan.id === "enterprise") {
      return (
        <Title order={2} fw={800} c="white">
          Custom Pricing
        </Title>
      );
    }

    if (plan.originalPrice) {
      return (
        <Stack gap={spacing.xs} align="flex-start">
          <Badge
            color="green"
            variant="light"
            size="sm"
            leftSection={<IconSparkles size={12} />}
          >
            Save {plan.originalPrice - plan.price} birr/month
          </Badge>
          <Group gap={spacing.xs} align="center">
            <Title order={2} fw={800} c="white">
              {plan.price}
            </Title>
            <Text size="lg" fw={600} c="white">
              {plan.currency}/{plan.period}
            </Text>
          </Group>
        </Stack>
      );
    }

    return (
      <Group gap={spacing.xs} align="center">
        <Title order={2} fw={800} c="white">
          {plan.price}
        </Title>
        <Text size="lg" fw={600} c="white">
          {plan.currency}/{plan.period}
        </Text>
      </Group>
    );
  };

  if (loading) {
    return (
      <Box
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: isDark ? `linear-gradient(135deg, ${primaryColor}15 0%, ${theme.colors.dark[8]} 100%)` : `linear-gradient(135deg, ${primaryColor}15 0%, white 100%)`,
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Stack align="center" gap={spacing.md}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <IconCrown size={48} color={primaryColor} />
            </motion.div>
            <Text size="lg" fw={500} c={primaryColor}>
              Loading subscription plans...
            </Text>
          </Stack>
        </motion.div>
      </Box>
    );
  }

  return (
    <Box bg={isDark ? "dark.8" : "white"} style={{ minHeight: "100vh", overflowX: "hidden" }}>
      {/* Animated Background Elements */}
      <Box
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 0,
          pointerEvents: "none",
          background: `radial-gradient(circle at 20% 50%, ${primaryColor}08 0%, transparent 50%),
                      radial-gradient(circle at 80% 20%, ${accentColor}05 0%, transparent 50%)`,
        }}
      />

      {/* Close Button */}
      <Container
        size="xl"
        style={{ paddingTop: 20, position: "relative", zIndex: 10 }}
      >
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Group justify="flex-end">
            <ActionIcon
              variant="light"
              size={30}
              radius="md"
              onClick={handleClose}
              style={{
                cursor: "pointer",
                border: `2px solid ${primaryColor}`,
                background: `${primaryColor}10`,
                marginTop: 5,
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <IconX size={20} stroke={2.5} color={primaryColor} />
            </ActionIcon>
          </Group>
        </motion.div>
      </Container>

      {/* Main Content */}
      <Container
        size="xl"
        pt={{ base: spacing.sm, md: spacing.lg }}
        pb={{ base: spacing.xl, md: spacing.xxl }}
        style={{ position: "relative", zIndex: 1 }}
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Stack gap={spacing.xxl} align="center">
            {/* Page Header */}
            <Stack gap={spacing.md} align="center" maw={1600} mx="auto">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Title
                  order={1}
                  size={{ base: 100, md: 20 }}
                  fw={1600}
                  ta="center"
                  style={{
                    background: isDark ? `linear-gradient(135deg, #60A5FA 0%, #93C5FD 100%)` : `linear-gradient(135deg, ${primaryColor} 0%, ${primaryLight} 100%)`,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    marginBottom: spacing.xs,
                  }}
                >
                  Choose Your Perfect Plan
                </Title>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Text
                  size={{ base: "md", md: "lg" }}
                  c="dimmed"
                  ta="center"
                  style={{ marginTop: spacing.xs }}
                >
                  Select the plan that best fits your needs.
                </Text>
              </motion.div>
            </Stack>

            {/* Dynamic Carousel Container */}
            <Box
              style={{
                position: "relative",
                width: "100%",
                maxWidth: "1400px",
                height: `${getMaxCardHeight()}px`,
                margin: `0 auto ${spacing.xl}px auto`,
                overflow: "visible",
                transition: "height 0.3s ease-in-out",
              }}
            >
              {/* Cards Wrapper */}
              <Box
                style={{
                  position: "absolute",
                  width: "100vw",
                  height: "100%",
                  left: "50%",
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                }}
              >
                {/* Cards Container */}
                <Box
                  style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {plans.map((plan, index) => (
                    <motion.div
                      key={plan.id}
                      ref={(el) => (cardRefs.current[index] = el)}
                      initial={false}
                      animate={getCardTransform(index)}
                      transition={{
                        type: "spring",
                        stiffness: 280,
                        damping: 25,
                        mass: 0.8,
                      }}
                      whileHover={index === activeIndex ? { scale: 1.12 } : {}}
                      onMouseEnter={() => setIsHovering(index)}
                      onMouseLeave={() => setIsHovering(null)}
                      style={{
                        position: "absolute",
                        width: isMobile ? "85%" : isTablet ? "320px" : "380px",
                        minHeight: "550px",
                        height: "auto",
                        cursor: "pointer",
                      }}
                      onClick={() => {
                        setActiveIndex(index);
                        setSelectedPlan(plan.id);
                      }}
                    >
                      <Card
                        withBorder
                        radius="lg"
                        p={isMobile ? "lg" : "xl"}
                        h="100%"
                        style={{
                          background:
                            isHovering === index ? plan.hoverColor : plan.color,
                          border: `2px solid ${index === activeIndex ? accentColor : primaryColor}40`,
                          transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                          display: "flex",
                          flexDirection: "column",
                          overflow: "hidden",
                          height: "auto",
                        }}
                      >
                        {/* Popular Badge */}
                        {plan.popular && index === activeIndex && (
                          <motion.div
                            initial={{ y: -20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                          >
                            <Badge
                              color="yellow"
                              size="lg"
                              variant="filled"
                              style={{
                                position: "absolute",
                                top: "-12px",
                                left: "50%",
                                transform: "translateX(-50%)",
                                zIndex: 5,
                                boxShadow: `0 4px 12px ${accentColor}40`,
                              }}
                            >
                              <Group gap={spacing.xs}>
                                <IconStar size={14} />
                                MOST POPULAR
                              </Group>
                            </Badge>
                          </motion.div>
                        )}

                        {/* Plan Header Ribbon */}
                        <Box
                          style={{
                            position: "absolute",
                            top: 0,
                            right: 0,
                            width: "80px",
                            height: "80px",
                            overflow: "hidden",
                          }}
                        >
                          <Box
                            style={{
                              position: "absolute",
                              top: -15,
                              right: -15,
                              width: "60px",
                              height: "60px",
                              background: accentColor,
                              transform: "rotate(45deg)",
                            }}
                          />
                          <IconCrown
                            size={20}
                            color="#000"
                            style={{
                              position: "absolute",
                              top: 10,
                              right: 10,
                              zIndex: 2,
                            }}
                          />
                        </Box>

                        <Stack
                          gap={spacing.lg}
                          style={{
                            flex: 1,
                            height: "auto",
                            minHeight: "500px",
                            paddingTop: spacing.sm,
                            paddingBottom: spacing.md,
                          }}
                        >
                          {/* Plan Header */}
                          <Stack gap={spacing.xs} style={{ flexShrink: 0 }}>
                            <Group justify="space-between" align="flex-start">
                              <Title
                                order={3}
                                c="white"
                                fw={800}
                                size={isMobile ? "h3" : "h2"}
                                style={{ marginBottom: spacing.xs }}
                              >
                                {plan.name}
                              </Title>
                              <motion.div
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <Badge
                                  color={plan.badgeColor}
                                  variant="filled"
                                  size="lg"
                                  radius="sm"
                                  style={{
                                    boxShadow: `0 4px 12px ${primaryColor}40`,
                                  }}
                                >
                                  {plan.badge}
                                </Badge>
                              </motion.div>
                            </Group>

                            {plan.description && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                style={{ marginTop: spacing.xs }}
                              >
                                <Paper
                                  p="xs"
                                  radius="sm"
                                  style={{
                                    background: `${accentColor}20`,
                                    border: `1px solid ${accentColor}40`,
                                  }}
                                >
                                  <Group gap={spacing.xs} align="flex-start">
                                    <IconGift
                                      size={16}
                                      color={accentColor}
                                      style={{ marginTop: "2px" }}
                                    />
                                    <Text
                                      size="sm"
                                      c="white"
                                      opacity={0.95}
                                      style={{ lineHeight: 1.3 }}
                                    >
                                      {plan.description}
                                    </Text>
                                  </Group>
                                </Paper>
                              </motion.div>
                            )}
                          </Stack>

                          {/* Price Section */}
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            transition={{ type: "spring", stiffness: 300 }}
                            style={{
                              flexShrink: 0,
                              marginTop: spacing.xs,
                              marginBottom: spacing.xs,
                            }}
                          >
                            <Box
                              p="md"
                              style={{
                                background: "rgba(255, 255, 255, 0.1)",
                                borderRadius: "12px",
                                backdropFilter: "blur(10px)",
                                height: "100%",
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "center",
                                minHeight: "90px",
                              }}
                            >
                              {getPlanPriceDisplay(plan)}
                              {plan.id !== "enterprise" && (
                                <Text
                                  size="md"
                                  c="white"
                                  opacity={0.9}
                                  mt={spacing.xs}
                                >
                                  Billed{" "}
                                  {plan.id === "annual"
                                    ? "annually"
                                    : "monthly"}
                                </Text>
                              )}
                            </Box>
                          </motion.div>

                          <Divider
                            my={spacing.xs}
                            color="rgba(255, 255, 255, 0.3)"
                            style={{
                              borderStyle: "dashed",
                              flexShrink: 0,
                            }}
                          />

                          {/* Features Section - Flexible Height */}
                          <Box
                            style={{
                              flex: 1,
                              minHeight: "200px",
                              height: "auto",
                              paddingRight: "4px",
                              marginBottom: spacing.md,
                              marginTop: spacing.xs,
                              overflow: "visible",
                            }}
                          >
                            <Text
                              fw={700}
                              c="white"
                              size="md"
                              mb={spacing.md}
                              style={{
                                marginTop: spacing.xs,
                                flexShrink: 0,
                              }}
                            >
                              Included Features:
                            </Text>
                            <Stack gap={spacing.sm} style={{ height: "auto" }}>
                              {plan.features.map((feature, idx) => (
                                <motion.div
                                  key={idx}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: idx * 0.05 }}
                                  whileHover={{ x: 5 }}
                                  style={{ flexShrink: 0 }}
                                >
                                  <Group
                                    gap={spacing.sm}
                                    wrap="nowrap"
                                    align="flex-start"
                                    style={{
                                      minHeight: "36px",
                                    }}
                                  >
                                    <ThemeIcon
                                      color={feature.included ? "green" : "red"}
                                      size={20}
                                      radius="xl"
                                      variant={
                                        feature.included ? "filled" : "outline"
                                      }
                                      style={{
                                        boxShadow: feature.included
                                          ? `0 4px 12px ${primaryColor}40`
                                          : "none",
                                        flexShrink: 0,
                                        marginTop: 2,
                                      }}
                                    >
                                      <IconCheck size={12} />
                                    </ThemeIcon>
                                    <Text
                                      size="sm"
                                      c="white"
                                      opacity={feature.included ? 1 : 0.6}
                                      style={{
                                        lineHeight: 1.4,
                                        flex: 1,
                                        wordBreak: "break-word",
                                      }}
                                    >
                                      {feature.text}
                                    </Text>
                                  </Group>
                                </motion.div>
                              ))}
                            </Stack>
                          </Box>

                          {/* Action Button - Fixed at bottom */}
                          <motion.div
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.98 }}
                            style={{
                              marginTop: "auto",
                              marginBottom: spacing.xs,
                              flexShrink: 0,
                            }}
                          >
                            <Button
                              color={index === activeIndex ? "yellow" : "white"}
                              variant="filled"
                              size="lg"
                              radius="md"
                              fullWidth
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpgrade(plan);
                              }}
                              disabled={
                                plan.id === "monthly" &&
                                user?.subscription === "monthly"
                              }
                              style={{
                                fontWeight: 800,
                                fontSize: isMobile ? "16px" : "18px",
                                height: "56px",
                                color:
                                  index === activeIndex ? "#000" : primaryColor,
                                boxShadow: `0 8px 24px ${index === activeIndex ? accentColor + "40" : primaryColor + "40"}`,
                              }}
                              rightSection={
                                !(
                                  plan.id === "monthly" &&
                                  user?.subscription === "monthly"
                                ) && <IconChevronRight size={20} />
                              }
                            >
                              {plan.id === "monthly" &&
                              user?.subscription === "monthly"
                                ? "Current Plan"
                                : plan.id === "enterprise"
                                  ? "Contact Sales"
                                  : "Get Started"}
                            </Button>
                          </motion.div>
                        </Stack>
                      </Card>
                    </motion.div>
                  ))}
                </Box>
              </Box>
            </Box>

            {/* Navigation Dots */}
            <Group
              justify="center"
              mt={isMobile ? spacing.xl : spacing.lg}
              mb={spacing.md}
              style={{ position: "relative", zIndex: 40 }}
              gap={spacing.xs}
            >
              {plans.map((_, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <ActionIcon
                    variant="transparent"
                    onClick={() => handleDotClick(index)}
                    style={{ cursor: "pointer" }}
                    size="lg"
                  >
                    {index === activeIndex ? (
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <IconCircleFilled size={24} color={primaryColor} />
                      </motion.div>
                    ) : (
                      <IconCircle size={20} color={`${primaryColor}40`} />
                    )}
                  </ActionIcon>
                </motion.div>
              ))}
            </Group>

            {/* Mobile Swipe Hint */}
            {isMobile && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                style={{ width: "100%" }}
              >
                <Paper
                  p="md"
                  radius="lg"
                  style={{
                    background: `${primaryColor}08`,
                    border: `1px dashed ${primaryColor}30`,
                    marginTop: spacing.sm,
                  }}
                >
                  <Group gap={spacing.xs} justify="center">
                    <Text size="sm" c={isDark ? "#60A5FA" : primaryColor} fw={600}>
                      ← Swipe to view plans →
                    </Text>
                  </Group>
                </Paper>
              </motion.div>
            )}

            {/* Selected Plan Summary */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
              style={{
                width: "100%",
                maxWidth: "600px",
                marginTop: spacing.lg,
              }}
            >
              <Paper
                p="lg"
                radius="lg"
                style={{
                  background: isDark ? `linear-gradient(135deg, ${primaryColor}15 0%, ${theme.colors.dark[6]} 100%)` : `linear-gradient(135deg, ${primaryColor}15 0%, ${accentLight} 100%)`,
                  border: `2px solid ${primaryColor}30`,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <Box
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "3px",
                    background: `linear-gradient(90deg, ${primaryColor}, ${accentColor}, ${primaryColor})`,
                    backgroundSize: "200% 100%",
                    animation: "shimmer 3s infinite linear",
                  }}
                />

                <Group justify="center" gap={spacing.md}>
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <IconCrown size={28} color={primaryColor} />
                  </motion.div>
                  <Stack gap={spacing.xs}>
                    <Text fw={700} size="lg">
                      Selected Plan:{" "}
                      <Text span c={isDark ? "#60A5FA" : primaryColor}>
                        {plans.find((p) => p.id === selectedPlan)?.name}
                      </Text>
                    </Text>
                    <Text size="sm" c="dimmed">
                      Click "Get Started" to proceed with your selection
                    </Text>
                  </Stack>
                </Group>
              </Paper>
            </motion.div>
          </Stack>
        </motion.div>
      </Container>

      {/* Scroll to Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            style={{
              position: "fixed",
              bottom: 30,
              right: 30,
              zIndex: 1000,
            }}
          >
            <ActionIcon
              size={60}
              radius="xl"
              variant="filled"
              color={primaryColor}
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              style={{
                boxShadow: `0 8px 32px ${primaryColor}40`,
              }}
            >
              <IconArrowUp size={30} />
            </ActionIcon>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CSS Animations */}
      <style jsx global>{`
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }

        html {
          scroll-behavior: smooth;
        }

        .plan-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .plan-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 40px rgba(0, 52, 209, 0.15);
        }
      `}</style>

      <MainFooter />
    </Box>
  );
}
