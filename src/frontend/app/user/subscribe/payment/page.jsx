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
  Divider,
  useMantineTheme,
  Alert,
  Select,
  TextInput,
  Checkbox,
  Loader,
  ActionIcon,
  Radio,
  RadioGroup,
  Grid,
  Badge,
  Modal,
  PinInput,
  Transition,
  Paper,
  useMantineColorScheme,
} from "@mantine/core";
import {
  IconShieldCheck,
  IconCalendar,
  IconArrowLeft,
  IconMapPin,
  IconBuildingBank,
  IconWallet,
  IconCreditCard,
  IconUser,
  IconCheck,
  IconSparkles,
  IconLock,
  IconAlertCircle,
  IconReceipt,
  IconChevronRight,
  IconStar,
  IconBadge,
} from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Helper to get dynamic background/color values
const getBg = (colorScheme, light, dark) =>
  colorScheme === "dark" ? dark : light;
const getTextColor = (colorScheme, light, dark) =>
  colorScheme === "dark" ? dark : light;

export default function PaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();

  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [activeStep, setActiveStep] = useState(1);

  // Get plan from URL
  const planType = searchParams.get("plan") || "annual";
  const [selectedPlan, setSelectedPlan] = useState(planType);

  // Payment method state
  const [paymentMethod, setPaymentMethod] = useState("bank");
  const [billedTo, setBilledTo] = useState("");
  const [selectedBank, setSelectedBank] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [paymentDate, setPaymentDate] = useState("14/11/2025 1:55 PM");
  const [location, setLocation] = useState("Ethiopia");
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Credit card specific state
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCVC, setCardCVC] = useState("");
  const [cardholder, setCardholder] = useState("");

  // Wallet specific state
  const [walletId, setWalletId] = useState("");
  const [walletPin, setWalletPin] = useState("");

  // Banks list
  const banks = [
    "Commercial Bank of Ethiopia",
    "Dashen Bank",
    "Awash Bank",
    "Bank of Abyssinia",
    "NIB International Bank",
    "Hibret Bank",
    "Zemen Bank",
    "Wegagen Bank",
  ];

  // Plan data (gradients stay the same, they look good in both modes)
  const plans = {
    monthly: {
      name: "Monthly",
      badge: "MONTHLY",
      price: "400",
      period: "month",
      total: "400",
      description: "400 birr / month",
      originalPrice: "400",
      borderColor: "#667eea",
      gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      billing: "400.00",
      iconColor: "#667eea",
    },
    annual: {
      name: "Annual",
      badge: "ANNUAL",
      price: "360",
      period: "month",
      total: "4,380",
      description: "360 birr / month",
      savings: "Save 13%",
      originalPrice: "4,800",
      borderColor: "#f093fb",
      gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      billing: "4380.00",
      iconColor: "#f5576c",
    },
  };

  const currentPlan = plans[selectedPlan];

  // Validation function
  const isFormValid = () => {
    if (!billedTo.trim()) return false;
    if (!acceptedTerms) return false;

    switch (paymentMethod) {
      case "bank":
        return selectedBank.trim() !== "" && accountNumber.trim() !== "";
      case "creditCard":
        return (
          cardNumber.trim() !== "" &&
          cardExpiry.trim() !== "" &&
          cardCVC.trim() !== "" &&
          cardholder.trim() !== ""
        );
      case "wallet":
        return walletId.trim() !== "" && walletPin.trim() !== "";
      default:
        return false;
    }
  };

  useEffect(() => {
    setTimeout(() => setLoading(false), 300);
  }, []);

  const handleContinue = () => {
    if (!isFormValid()) {
      setShowValidation(true);
      return;
    }
    setActiveStep(2);
    setShowConfirmation(true);
  };

  const handleConfirmPayment = () => {
    setShowPinModal(true);
  };

  const handlePinSubmit = async () => {
    if (pin.length !== 4) {
      alert("Please enter a 4-digit PIN");
      return;
    }

    setShowPinModal(false);
    setPaymentLoading(true);

    setTimeout(() => {
      setPaymentLoading(false);
      setPin("");

      if (pin === "1234") {
        localStorage.setItem("hasPaidSubscription", "true");
        alert("Payment successful! You can now register additional people.");
        router.push("/register-person");
      } else {
        alert("Incorrect PIN. Please try again.");
        setShowPinModal(true);
      }
    }, 1500);
  };

  const handleEditForm = () => {
    setActiveStep(1);
    setShowConfirmation(false);
  };

  const showError = (fieldValue) => {
    return showValidation && !fieldValue.trim();
  };

  // Stepper Component with dynamic colors
  const Stepper = () => (
    <Box
      style={{
        background: getBg(
          colorScheme,
          "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)",
          `linear-gradient(135deg, ${theme.colors.dark[5]} 0%, ${theme.colors.dark[7]} 100%)`,
        ),
        borderRadius: "12px",
        padding: "24px",
        marginBottom: "32px",
      }}
    >
      <Group justify="center" gap={0}>
        {[1, 2, 3].map((step) => (
          <Box key={step} style={{ position: "relative", flex: 1 }}>
            <Group justify="center">
              <Box
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  background:
                    step <= activeStep
                      ? "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)"
                      : getBg(colorScheme, "#e9ecef", theme.colors.dark[5]),
                  color:
                    step <= activeStep
                      ? "white"
                      : getBg(colorScheme, "#adb5bd", theme.colors.dark[3]),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "bold",
                  fontSize: "16px",
                  boxShadow:
                    step <= activeStep
                      ? "0 4px 12px rgba(79, 70, 229, 0.3)"
                      : "none",
                  transition: "all 0.3s ease",
                  zIndex: 2,
                  position: "relative",
                }}
              >
                {step < activeStep ? <IconCheck size={20} /> : step}
              </Box>
            </Group>
            <Text
              ta="center"
              mt={8}
              fw={600}
              c={
                step <= activeStep
                  ? getBg(colorScheme, "dark", theme.colors.gray[3])
                  : "dimmed"
              }
              size="sm"
            >
              {step === 1
                ? "Payment Details"
                : step === 2
                  ? "Review"
                  : "Confirm"}
            </Text>
            {step < 3 && (
              <Box
                style={{
                  position: "absolute",
                  top: "20px",
                  left: "60%",
                  right: "0",
                  height: "2px",
                  background:
                    step < activeStep
                      ? "linear-gradient(90deg, #4f46e5, #7c3aed)"
                      : getBg(colorScheme, "#e9ecef", theme.colors.dark[5]),
                  zIndex: 1,
                }}
              />
            )}
          </Box>
        ))}
      </Group>
    </Box>
  );

  const renderLeftContent = () => {
    if (showConfirmation) {
      return (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Stack gap="lg">
            <Box>
              <Group>
                <Box
                  style={{
                    padding: "12px",
                    borderRadius: "12px",
                    background:
                      "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                    color: "white",
                  }}
                >
                  <IconAlertCircle size={32} />
                </Box>
                <Title
                  order={2}
                  fw={900}
                  style={{
                    background:
                      "linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Dear, {billedTo || "User"}
                </Title>
              </Group>
              <Text c="dimmed" size="lg" mt={4}>
                Please review your payment information before confirming
              </Text>
            </Box>

            <Divider
              color={getBg(
                colorScheme,
                theme.colors.gray[2],
                theme.colors.dark[5],
              )}
            />

            <Card
              style={{
                background: getBg(
                  colorScheme,
                  "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
                  `linear-gradient(135deg, ${theme.colors.dark[7]} 0%, ${theme.colors.dark[6]} 100%)`,
                ),
                border: "none",
                borderRadius: "20px",
                padding: "32px",
                boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
              }}
            >
              <Stack gap="md">
                <Text
                  fw={700}
                  size="xl"
                  style={{
                    background:
                      "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Order Summary
                </Text>

                <Box>
                  <Text size="sm" c="dimmed">
                    Plan Type
                  </Text>
                  <Group mt={4}>
                    <Badge
                      size="xl"
                      radius="sm"
                      style={{
                        background: currentPlan.gradient,
                        color: "white",
                        padding: "8px 16px",
                        fontSize: "14px",
                      }}
                    >
                      {currentPlan.name}
                    </Badge>
                  </Group>
                </Box>

                {paymentMethod === "bank" && selectedBank && (
                  <>
                    <Divider
                      color={getBg(
                        colorScheme,
                        theme.colors.gray[2],
                        theme.colors.dark[5],
                      )}
                    />
                    <Box>
                      <Text size="sm" c="dimmed">
                        Chosen Bank
                      </Text>
                      <Group mt={4} gap="xs">
                        <IconBuildingBank size={20} color="#3b82f6" />
                        <Text fw={600} size="lg">
                          {selectedBank}
                        </Text>
                      </Group>
                    </Box>
                    <Box>
                      <Text size="sm" c="dimmed">
                        Account Number
                      </Text>
                      <Text fw={600} size="lg" mt={4}>
                        {accountNumber
                          ? `${accountNumber.slice(0, 4)}xxxxxxxxxx`
                          : "Not provided"}
                      </Text>
                    </Box>
                  </>
                )}

                {paymentMethod === "creditCard" && (
                  <>
                    <Divider
                      color={getBg(
                        colorScheme,
                        theme.colors.gray[2],
                        theme.colors.dark[5],
                      )}
                    />
                    <Box>
                      <Text size="sm" c="dimmed">
                        Card Type
                      </Text>
                      <Group mt={4} gap="xs">
                        <IconCreditCard size={20} color="#8b5cf6" />
                        <Text fw={600} size="lg">
                          Credit Card
                        </Text>
                      </Group>
                    </Box>
                    <Box>
                      <Text size="sm" c="dimmed">
                        Card Number
                      </Text>
                      <Text fw={600} size="lg" mt={4}>
                        {cardNumber
                          ? `**** ${cardNumber.slice(-4)}`
                          : "Not provided"}
                      </Text>
                    </Box>
                  </>
                )}

                {paymentMethod === "wallet" && (
                  <>
                    <Divider
                      color={getBg(
                        colorScheme,
                        theme.colors.gray[2],
                        theme.colors.dark[5],
                      )}
                    />
                    <Box>
                      <Text size="sm" c="dimmed">
                        Wallet Type
                      </Text>
                      <Group mt={4} gap="xs">
                        <IconWallet size={20} color="#10b981" />
                        <Text fw={600} size="lg">
                          Digital Wallet
                        </Text>
                      </Group>
                    </Box>
                    <Box>
                      <Text size="sm" c="dimmed">
                        Wallet ID
                      </Text>
                      <Text fw={600} size="lg" mt={4}>
                        {walletId
                          ? `${walletId.slice(0, 4)}...${walletId.slice(-4)}`
                          : "Not provided"}
                      </Text>
                    </Box>
                  </>
                )}

                <Divider
                  color={getBg(
                    colorScheme,
                    theme.colors.gray[2],
                    theme.colors.dark[5],
                  )}
                />

                <Box>
                  <Text size="sm" c="dimmed">
                    Total Amount
                  </Text>
                  <Title
                    order={1}
                    fw={900}
                    style={{
                      background:
                        "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    {currentPlan.billing} birr
                  </Title>
                </Box>
              </Stack>
            </Card>

            <Group grow mt="lg">
              <Button
                variant="outline"
                color="gray"
                size="lg"
                radius="md"
                onClick={handleEditForm}
                leftSection={<IconArrowLeft size={20} />}
                style={{
                  border: `2px solid ${getBg(colorScheme, "#e5e7eb", theme.colors.dark[5])}`,
                  transition: "all 0.3s ease",
                  "&:hover": {
                    transform: "translateX(-4px)",
                  },
                }}
              >
                Edit Details
              </Button>
              <Button
                size="lg"
                radius="md"
                onClick={handleConfirmPayment}
                leftSection={<IconCheck size={20} />}
                style={{
                  background:
                    "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: "0 8px 20px rgba(16, 185, 129, 0.3)",
                  },
                }}
              >
                Confirm & Pay
              </Button>
            </Group>

            <Alert
              style={{
                background: getBg(
                  colorScheme,
                  "linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%)",
                  `linear-gradient(135deg, ${theme.colors.blue[9]} 0%, ${theme.colors.blue[8]} 100%)`,
                ),
                border: "none",
                borderRadius: "12px",
              }}
              icon={<IconShieldCheck size={20} color="#3b82f6" />}
            >
              <Text size="sm">
                Your payment is secured with 256-bit SSL encryption. All data is
                protected.
              </Text>
            </Alert>
          </Stack>
        </motion.div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Stack gap="lg">
          <Box>
            <Title
              order={2}
              fw={800}
              style={{
                background: "linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Complete Your Payment
            </Title>
            <Text c="dimmed" size="md" mt={4}>
              Fill in your payment details to upgrade your plan
            </Text>
          </Box>

          <Divider
            color={getBg(
              colorScheme,
              theme.colors.gray[2],
              theme.colors.dark[5],
            )}
          />

          <Box>
            <Text fw={600} size="md" mb={4}>
              Billed To
            </Text>
            <TextInput
              placeholder="Your full name"
              value={billedTo}
              onChange={(e) => setBilledTo(e.target.value)}
              leftSection={<IconUser size={18} />}
              size="md"
              radius="md"
              error={showError(billedTo) && "Name is required"}
              styles={{
                input: {
                  border: `2px solid ${getBg(colorScheme, "#e5e7eb", theme.colors.dark[5])}`,
                  backgroundColor: getBg(
                    colorScheme,
                    "white",
                    theme.colors.dark[6],
                  ),
                  color: getBg(colorScheme, "black", theme.colors.gray[3]),
                  transition: "all 0.3s ease",
                  "&:focus": {
                    borderColor: "#3b82f6",
                    boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
                  },
                },
              }}
            />
          </Box>

          <Box>
            <Text fw={600} size="md" mb={12}>
              Payment Method
            </Text>
            <RadioGroup value={paymentMethod} onChange={setPaymentMethod}>
              <Group gap="md" mb="md" wrap="nowrap">
                {[
                  {
                    value: "bank",
                    label: "Bank",
                    icon: IconBuildingBank,
                    color: "#3b82f6",
                  },
                  {
                    value: "wallet",
                    label: "Wallet",
                    icon: IconWallet,
                    color: "#10b981",
                  },
                  {
                    value: "creditCard",
                    label: "Card",
                    icon: IconCreditCard,
                    color: "#8b5cf6",
                  },
                ].map((method) => {
                  const IconComponent = method.icon;
                  return (
                    <Card
                      key={method.value}
                      withBorder
                      p="md"
                      radius="md"
                      bg={getBg(colorScheme, "white", theme.colors.dark[7])}
                      style={{
                        cursor: "pointer",
                        borderColor:
                          paymentMethod === method.value
                            ? method.color
                            : getBg(
                                colorScheme,
                                "#e5e7eb",
                                theme.colors.dark[5],
                              ),
                        backgroundColor:
                          paymentMethod === method.value
                            ? getBg(
                                colorScheme,
                                `${method.color}15`,
                                theme.colors.dark[6],
                              )
                            : getBg(colorScheme, "white", theme.colors.dark[7]),
                        flex: 1,
                        transition: "all 0.3s ease",
                        transform:
                          paymentMethod === method.value
                            ? "translateY(-4px)"
                            : "none",
                        boxShadow:
                          paymentMethod === method.value
                            ? `0 8px 20px ${method.color}30`
                            : "none",
                        minWidth: "100px",
                      }}
                      onClick={() => setPaymentMethod(method.value)}
                    >
                      <Stack align="center" gap={8}>
                        <IconComponent
                          size={28}
                          color={
                            paymentMethod === method.value
                              ? method.color
                              : getBg(
                                  colorScheme,
                                  "#9ca3af",
                                  theme.colors.dark[3],
                                )
                          }
                        />
                        <Text fw={500}>{method.label}</Text>
                      </Stack>
                    </Card>
                  );
                })}
              </Group>
            </RadioGroup>
          </Box>

          {renderPaymentForm()}

          <Card
            withBorder
            p="lg"
            radius="lg"
            bg={getBg(colorScheme, "#f8fafc", theme.colors.dark[6])}
            style={{
              border: `1px solid ${getBg(colorScheme, "#e5e7eb", theme.colors.dark[5])}`,
            }}
          >
            <Stack gap="md">
              <Text fw={600}>Payment Details</Text>
              <Grid>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <Box>
                    <Text size="sm" c="dimmed">
                      Date & Time
                    </Text>
                    <Group gap="xs">
                      <IconCalendar size={16} color="#3b82f6" />
                      <Text fw={500}>{paymentDate}</Text>
                    </Group>
                  </Box>
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <Box>
                    <Text size="sm" c="dimmed">
                      Location
                    </Text>
                    <Group gap="xs">
                      <IconMapPin size={16} color="#ef4444" />
                      <Text fw={500}>{location}</Text>
                    </Group>
                  </Box>
                </Grid.Col>
              </Grid>
            </Stack>
          </Card>

          <Group grow mt="lg">
            <Button
              variant="outline"
              color="gray"
              size="lg"
              radius="md"
              onClick={() => router.push("/subscribe")}
              leftSection={<IconArrowLeft size={20} />}
              style={{
                border: `2px solid ${getBg(colorScheme, "#e5e7eb", theme.colors.dark[5])}`,
                transition: "all 0.3s ease",
                "&:hover": {
                  transform: "translateX(-4px)",
                },
              }}
            >
              Back
            </Button>
            <Button
              size="lg"
              radius="md"
              onClick={handleContinue}
              disabled={!isFormValid()}
              leftSection={<IconReceipt size={20} />}
              style={{
                background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                transition: "all 0.3s ease",
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: "0 8px 20px rgba(59, 130, 246, 0.3)",
                },
                "&:disabled": {
                  background: getBg(
                    colorScheme,
                    "#e5e7eb",
                    theme.colors.dark[5],
                  ),
                  transform: "none",
                  boxShadow: "none",
                },
              }}
            >
              Review & Continue
            </Button>
          </Group>

          <Alert
            color={showError(acceptedTerms.toString()) ? "red" : "gray"}
            variant="light"
            mt="md"
            p="md"
            radius="md"
            style={{
              background: getBg(
                colorScheme,
                "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
                `linear-gradient(135deg, ${theme.colors.yellow[9]} 0%, ${theme.colors.yellow[8]} 100%)`,
              ),
              border: "none",
            }}
          >
            <Checkbox
              label={
                <Text size="sm">
                  By providing your payment information, you allow us to charge
                  for future payments in accordance with our terms.
                </Text>
              }
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.currentTarget.checked)}
            />
          </Alert>

          {showValidation && !isFormValid() && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Alert
                color="yellow"
                variant="light"
                icon={<IconAlertCircle size={18} />}
                style={{
                  background: getBg(
                    colorScheme,
                    "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
                    `linear-gradient(135deg, ${theme.colors.yellow[9]} 0%, ${theme.colors.yellow[8]} 100%)`,
                  ),
                  border: "none",
                }}
              >
                <Text size="sm">
                  Please fill in all required fields before continuing.
                </Text>
              </Alert>
            </motion.div>
          )}
        </Stack>
      </motion.div>
    );
  };

  const renderPaymentForm = () => {
    const getPaymentMethodStyle = (color) => ({
      background: getBg(
        colorScheme,
        `linear-gradient(135deg, ${color}15 0%, ${color}08 100%)`,
        `linear-gradient(135deg, ${theme.colors.dark[6]} 0%, ${theme.colors.dark[7]} 100%)`,
      ),
      border: `2px solid ${getBg(colorScheme, `${color}30`, theme.colors.dark[5])}`,
      borderRadius: "16px",
      padding: "24px",
      transition: "all 0.3s ease",
    });

    const inputStyles = {
      input: {
        backgroundColor: getBg(colorScheme, "white", theme.colors.dark[6]),
        color: getBg(colorScheme, "black", theme.colors.gray[3]),
        borderColor: getBg(colorScheme, "#e5e7eb", theme.colors.dark[5]),
        "&:focus": {
          borderColor: "#3b82f6",
          boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
        },
      },
      label: { color: getBg(colorScheme, "black", theme.colors.gray[3]) },
    };

    switch (paymentMethod) {
      case "creditCard":
        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Stack gap="md">
              <Card style={getPaymentMethodStyle("#8b5cf6")}>
                <Stack gap="md">
                  <Text fw={600} mb={4} style={{ color: "#8b5cf6" }}>
                    Card Details
                  </Text>
                  <TextInput
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    leftSection={<IconCreditCard size={18} color="#8b5cf6" />}
                    size="md"
                    error={showError(cardNumber) && "Card number is required"}
                    styles={inputStyles}
                  />
                  <Grid>
                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <TextInput
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.currentTarget.value)}
                        size="md"
                        error={
                          showError(cardExpiry) && "Expiry date is required"
                        }
                        styles={inputStyles}
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <TextInput
                        placeholder="CVC"
                        value={cardCVC}
                        onChange={(e) => setCardCVC(e.currentTarget.value)}
                        size="md"
                        error={showError(cardCVC) && "CVC is required"}
                        styles={inputStyles}
                      />
                    </Grid.Col>
                  </Grid>
                  <TextInput
                    placeholder="Cardholder Name"
                    value={cardholder}
                    onChange={(e) => setCardholder(e.currentTarget.value)}
                    leftSection={<IconUser size={18} color="#8b5cf6" />}
                    size="md"
                    error={
                      showError(cardholder) && "Cardholder name is required"
                    }
                    styles={inputStyles}
                  />
                </Stack>
              </Card>
            </Stack>
          </motion.div>
        );

      case "wallet":
        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Stack gap="md">
              <Card style={getPaymentMethodStyle("#10b981")}>
                <Stack gap="md">
                  <Text fw={600} mb={4} style={{ color: "#10b981" }}>
                    Wallet Details
                  </Text>
                  <TextInput
                    placeholder="Wallet ID or Phone Number"
                    value={walletId}
                    onChange={(e) => setWalletId(e.currentTarget.value)}
                    leftSection={<IconWallet size={18} color="#10b981" />}
                    size="md"
                    error={showError(walletId) && "Wallet ID is required"}
                    styles={inputStyles}
                  />
                  <TextInput
                    placeholder="Wallet PIN"
                    type="password"
                    value={walletPin}
                    onChange={(e) => setWalletPin(e.currentTarget.value)}
                    leftSection={<IconLock size={18} color="#10b981" />}
                    size="md"
                    error={showError(walletPin) && "Wallet PIN is required"}
                    styles={inputStyles}
                  />
                  <Alert
                    color="yellow"
                    variant="light"
                    size="sm"
                    style={{
                      background: getBg(
                        colorScheme,
                        "#fef3c7",
                        theme.colors.yellow[9],
                      ),
                    }}
                  >
                    <Text size="xs">
                      Use your mobile wallet app to complete this payment
                    </Text>
                  </Alert>
                </Stack>
              </Card>
            </Stack>
          </motion.div>
        );

      default: // bank
        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Stack gap="md">
              <Card style={getPaymentMethodStyle("#3b82f6")}>
                <Stack gap="md">
                  <Select
                    label="Select Bank"
                    placeholder="Choose your bank"
                    data={banks}
                    value={selectedBank}
                    onChange={setSelectedBank}
                    leftSection={<IconBuildingBank size={18} color="#3b82f6" />}
                    size="md"
                    error={
                      showError(selectedBank) && "Bank selection is required"
                    }
                    styles={{
                      ...inputStyles,
                      input: {
                        ...inputStyles.input,
                        backgroundColor: getBg(
                          colorScheme,
                          "white",
                          theme.colors.dark[6],
                        ),
                      },
                      dropdown: {
                        backgroundColor: getBg(
                          colorScheme,
                          "white",
                          theme.colors.dark[7],
                        ),
                        borderColor: getBg(
                          colorScheme,
                          "#e5e7eb",
                          theme.colors.dark[5],
                        ),
                      },
                      item: {
                        color: getBg(
                          colorScheme,
                          "black",
                          theme.colors.gray[3],
                        ),
                        "&[data-hovered]": {
                          backgroundColor: getBg(
                            colorScheme,
                            "#f1f5f9",
                            theme.colors.dark[5],
                          ),
                        },
                      },
                    }}
                  />
                  <TextInput
                    label="Account Number"
                    placeholder="Enter account number"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.currentTarget.value)}
                    leftSection={<IconCreditCard size={18} color="#3b82f6" />}
                    size="md"
                    error={
                      showError(accountNumber) && "Account number is required"
                    }
                    styles={inputStyles}
                  />
                </Stack>
              </Card>
            </Stack>
          </motion.div>
        );
    }
  };

  const renderPinModal = () => (
    <Modal
      opened={showPinModal}
      onClose={() => {
        setShowPinModal(false);
        setPin("");
      }}
      size="sm"
      centered
      radius="lg"
      padding="xl"
      styles={{
        content: {
          background: getBg(
            colorScheme,
            "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
            `linear-gradient(135deg, ${theme.colors.dark[7]} 0%, ${theme.colors.dark[6]} 100%)`,
          ),
          borderRadius: "24px",
        },
        header: {
          backgroundColor: getBg(colorScheme, "white", theme.colors.dark[7]),
        },
        title: {
          color: getBg(colorScheme, "black", theme.colors.gray[3]),
        },
      }}
    >
      <Stack gap="lg" align="center">
        <Box
          style={{
            padding: "20px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
            color: "white",
          }}
        >
          <IconLock size={32} />
        </Box>

        <Box ta="center">
          <Title
            order={3}
            style={{
              background: "linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Secure Payment
          </Title>
          <Text c="dimmed" mt={4}>
            Enter your 4-digit PIN to confirm
          </Text>
        </Box>

        <Group justify="center">
          <PinInput
            length={4}
            type="number"
            value={pin}
            onChange={setPin}
            size="lg"
            oneTimeCode
            style={{ gap: "12px" }}
            styles={{
              input: {
                width: "60px",
                height: "60px",
                fontSize: "24px",
                fontWeight: "bold",
                border: `2px solid ${getBg(colorScheme, "#e5e7eb", theme.colors.dark[5])}`,
                borderRadius: "12px",
                backgroundColor: getBg(
                  colorScheme,
                  "white",
                  theme.colors.dark[6],
                ),
                color: getBg(colorScheme, "black", theme.colors.gray[3]),
                transition: "all 0.3s ease",
                "&:focus": {
                  borderColor: "#3b82f6",
                  boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
                },
              },
            }}
          />
        </Group>

        <Box
          ta="center"
          p="md"
          style={{
            background: getBg(colorScheme, "#f8fafc", theme.colors.dark[6]),
            borderRadius: "12px",
            width: "100%",
          }}
        >
          <Text size="sm" c="dimmed">
            Amount to Pay
          </Text>
          <Text
            fw={900}
            size="xl"
            style={{
              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {currentPlan.billing} birr
          </Text>
        </Box>

        <Group grow w="100%">
          <Button
            variant="outline"
            color="gray"
            onClick={() => {
              setShowPinModal(false);
              setPin("");
            }}
            size="md"
            style={{
              borderColor: getBg(colorScheme, "#e5e7eb", theme.colors.dark[5]),
              color: getBg(colorScheme, "black", theme.colors.gray[3]),
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handlePinSubmit}
            loading={paymentLoading}
            disabled={pin.length !== 4}
            size="md"
            style={{
              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: "0 8px 20px rgba(16, 185, 129, 0.3)",
              },
            }}
          >
            Confirm Payment
          </Button>
        </Group>

        <Alert
          color="red"
          variant="light"
          size="sm"
          w="100%"
          style={{
            background: getBg(colorScheme, "#fee2e2", theme.colors.red[9]),
          }}
        >
          <Text size="xs">
            This action cannot be undone. Your account will be charged
            immediately.
          </Text>
        </Alert>
      </Stack>
    </Modal>
  );

  if (loading) {
    return (
      <Box
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        }}
      >
        <Loader color="white" size="xl" />
      </Box>
    );
  }

  return (
    <Box
      style={{
        minHeight: "100vh",
        background: getBg(
          colorScheme,
          "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
          `linear-gradient(135deg, ${theme.colors.dark[8]} 0%, ${theme.colors.dark[9]} 100%)`,
        ),
      }}
    >
      {/* Header */}
      <Box
        bg={getBg(colorScheme, "white", theme.colors.dark[7])}
        py={{ base: "xs", md: "sm" }}
        style={{
          borderBottom: `1px solid ${getBg(colorScheme, "#E9ECEF", theme.colors.dark[5])}`,
          position: "sticky",
          top: 0,
          zIndex: 100,
          backdropFilter: "blur(10px)",
          background: getBg(
            colorScheme,
            "rgba(255,255,255,0.95)",
            `rgba(${theme.colors.dark[7]},0.95)`,
          ),
        }}
      >
        <Container size="xl">
          <Group justify="space-between" wrap="nowrap">
            {/* Logo */}
            <Link href="/" style={{ flexShrink: 0 }}>
              <Image
                src="/logo.jpg"
                alt="Logo"
                width={120}
                height={40}
                style={{
                  width: "auto",
                  height: "40px",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              />
            </Link>

            {/* Back Button */}
            <ActionIcon
              variant="subtle"
              color="gray"
              size="lg"
              onClick={() => router.back()}
            >
              <IconArrowLeft size={24} />
            </ActionIcon>
          </Group>
        </Container>
      </Box>

      {/* Main Content */}
      <Container size="xl" py={40}>
        <Box mb={40}>
          <Title
            order={1}
            fw={900}
            ta="center"
            mb="md"
            style={{
              background: getBg(
                colorScheme,
                "linear-gradient(135deg, #1e293b 0%, #475569 100%)",
                `linear-gradient(135deg, ${theme.colors.gray[3]} 0%, ${theme.colors.gray[1]} 100%)`,
              ),
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {showConfirmation ? "Review Your Order" : "Complete Payment"}
          </Title>
          <Text ta="center" c="dimmed" size="lg">
            {showConfirmation
              ? "Review your details before confirming"
              : "Upgrade your plan with confidence"}
          </Text>
        </Box>

        <Stepper />

        <Grid gutter="xl">
          {/* LEFT: Dynamic Content */}
          <Grid.Col span={{ base: 12, lg: 7 }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Card
                radius="xl"
                p={{ base: "md", lg: "xl" }}
                style={{
                  height: "100%",
                  background: getBg(colorScheme, "white", theme.colors.dark[7]),
                  border: "none",
                  boxShadow: showConfirmation
                    ? "0 20px 40px rgba(72, 187, 120, 0.15)"
                    : "0 20px 40px rgba(59, 130, 246, 0.15)",
                }}
              >
                {renderLeftContent()}
              </Card>
            </motion.div>
          </Grid.Col>

          {/* RIGHT: Plan Selection */}
          <Grid.Col span={{ base: 12, lg: 5 }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <Card
                radius="xl"
                p={{ base: "md", lg: "xl" }}
                style={{
                  height: "100%",
                  background: getBg(
                    colorScheme,
                    "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
                    `linear-gradient(135deg, ${theme.colors.dark[6]} 0%, ${theme.colors.dark[7]} 100%)`,
                  ),
                  border: "none",
                  boxShadow: "0 20px 40px rgba(139, 92, 246, 0.15)",
                }}
              >
                <Stack gap="xl">
                  <Box>
                    <Group justify="center" mb="lg">
                      <IconSparkles size={36} color="#8b5cf6" />
                      <Title
                        order={2}
                        fw={800}
                        ta="center"
                        style={{
                          background:
                            "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                        }}
                      >
                        {showConfirmation ? "Selected Plan" : "Choose Plan"}
                      </Title>
                    </Group>

                    <Stack gap="md">
                      {Object.entries(plans).map(([key, plan]) => (
                        <motion.div
                          key={key}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Card
                            withBorder
                            p="lg"
                            radius="lg"
                            bg={getBg(
                              colorScheme,
                              "white",
                              theme.colors.dark[7],
                            )}
                            style={{
                              cursor: showConfirmation ? "default" : "pointer",
                              border:
                                selectedPlan === key
                                  ? `3px solid ${plan.borderColor}`
                                  : `1px solid ${getBg(colorScheme, "#e5e7eb", theme.colors.dark[5])}`,
                              background:
                                selectedPlan === key
                                  ? getBg(
                                      colorScheme,
                                      `${plan.borderColor}08`,
                                      theme.colors.dark[6],
                                    )
                                  : getBg(
                                      colorScheme,
                                      "white",
                                      theme.colors.dark[7],
                                    ),
                              transition: "all 0.3s ease",
                              position: "relative",
                              overflow: "hidden",
                            }}
                            onClick={
                              showConfirmation
                                ? undefined
                                : () => setSelectedPlan(key)
                            }
                          >
                            {selectedPlan === key && (
                              <Box
                                style={{
                                  position: "absolute",
                                  top: 0,
                                  right: 0,
                                  width: "60px",
                                  height: "60px",
                                  background: plan.gradient,
                                  clipPath: "polygon(100% 0, 0 0, 100% 100%)",
                                }}
                              />
                            )}

                            <Stack gap={12}>
                              <Group justify="space-between" align="center">
                                <Badge
                                  size="lg"
                                  radius="sm"
                                  style={{
                                    background: plan.gradient,
                                    color: "white",
                                  }}
                                >
                                  {plan.badge}
                                </Badge>
                                {plan.savings && (
                                  <Badge
                                    color="green"
                                    variant="filled"
                                    size="sm"
                                    style={{
                                      background:
                                        "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                                    }}
                                  >
                                    {plan.savings}
                                  </Badge>
                                )}
                                {selectedPlan === key && (
                                  <IconStar
                                    size={20}
                                    color="#fbbf24"
                                    fill="#fbbf24"
                                  />
                                )}
                              </Group>

                              <Box>
                                <Text size="sm" c="dimmed">
                                  Total Amount
                                </Text>
                                <Group align="flex-end" gap={4}>
                                  <Title
                                    order={1}
                                    fw={900}
                                    style={{
                                      background: plan.gradient,
                                      WebkitBackgroundClip: "text",
                                      WebkitTextFillColor: "transparent",
                                    }}
                                  >
                                    {plan.total}
                                  </Title>
                                  <Text size="lg" fw={600} c="dimmed">
                                    birr
                                  </Text>
                                </Group>
                              </Box>

                              <Group gap={4}>
                                <Text size="sm" c="dimmed">
                                  {plan.description}
                                </Text>
                              </Group>
                            </Stack>
                          </Card>
                        </motion.div>
                      ))}
                    </Stack>
                  </Box>

                  {/* Order Summary */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Card
                      p="lg"
                      radius="lg"
                      style={{
                        background: getBg(
                          colorScheme,
                          "linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%)",
                          `linear-gradient(135deg, ${theme.colors.blue[9]} 0%, ${theme.colors.blue[8]} 100%)`,
                        ),
                        border: "none",
                        position: "relative",
                        overflow: "hidden",
                      }}
                    >
                      <Box
                        style={{
                          position: "absolute",
                          top: "-50px",
                          right: "-50px",
                          width: "100px",
                          height: "100px",
                          borderRadius: "50%",
                          background: "rgba(59, 130, 246, 0.1)",
                        }}
                      />
                      <Stack gap={12}>
                        <Text fw={700} size="lg" style={{ color: "#1d4ed8" }}>
                          <IconBadge
                            size={20}
                            style={{
                              verticalAlign: "middle",
                              marginRight: "8px",
                            }}
                          />
                          Order Summary
                        </Text>

                        <Group justify="space-between">
                          <Text c="dimmed">Plan</Text>
                          <Text fw={600}>{currentPlan.name}</Text>
                        </Group>

                        <Group justify="space-between">
                          <Text c="dimmed">Billing Cycle</Text>
                          <Text fw={600}>
                            {selectedPlan === "annual" ? "Annual" : "Monthly"}
                          </Text>
                        </Group>

                        <Group justify="space-between">
                          <Text c="dimmed">Amount</Text>
                          <Text fw={600}>
                            {currentPlan.price} birr/{currentPlan.period}
                          </Text>
                        </Group>

                        <Divider
                          color={getBg(
                            colorScheme,
                            "#e5e7eb",
                            theme.colors.dark[5],
                          )}
                        />

                        <Group justify="space-between">
                          <Text fw={700} size="lg">
                            Total
                          </Text>
                          <Title
                            order={2}
                            fw={900}
                            style={{
                              background:
                                "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                              WebkitBackgroundClip: "text",
                              WebkitTextFillColor: "transparent",
                            }}
                          >
                            {currentPlan.billing} birr
                          </Title>
                        </Group>
                      </Stack>
                    </Card>
                  </motion.div>

                  {/* Security */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Card
                      p="lg"
                      radius="lg"
                      style={{
                        background: getBg(
                          colorScheme,
                          "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
                          `linear-gradient(135deg, ${theme.colors.yellow[9]} 0%, ${theme.colors.yellow[8]} 100%)`,
                        ),
                        border: "none",
                      }}
                    >
                      <Group gap="md">
                        <IconShieldCheck size={36} color="#d97706" />
                        <Box>
                          <Text fw={700} size="md" style={{ color: "#92400e" }}>
                            Secure Payment
                          </Text>
                          <Text
                            size="sm"
                            style={{ color: "#92400e", opacity: 0.8 }}
                          >
                            Your payment is protected with bank-level security
                          </Text>
                        </Box>
                      </Group>
                    </Card>
                  </motion.div>
                </Stack>
              </Card>
            </motion.div>
          </Grid.Col>
        </Grid>
      </Container>

      {/* PIN Modal */}
      {renderPinModal()}
    </Box>
  );
}
