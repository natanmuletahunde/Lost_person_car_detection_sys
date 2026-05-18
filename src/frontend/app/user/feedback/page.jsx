"use client";
import {
  Box,
  Container,
  Title,
  Text,
  Group,
  Button,
  Paper,
  Stack,
  Avatar,
  Badge,
  ActionIcon,
  Menu,
  UnstyledButton,
  TextInput,
  Textarea,
  Loader,
  Tabs,
  Divider,
  useMantineTheme,
  useMantineColorScheme,
  ThemeIcon,
  Tooltip,
  SimpleGrid,
  Rating,
  Select,
  Grid,
} from "@mantine/core";
import {
  IconHome,
  IconLogout,
  IconUser,
  IconBell,
  IconMessage,
  IconStar,
  IconStarFilled,
  IconSend,
  IconCheck,
  IconClock,
  IconBug,
  IconBulb,
  IconAlertCircle,
  IconInbox,
  IconUserCheck,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { apiClient } from "../../lib/apiClient";
import { notifications as toast } from "@mantine/notifications";
import MainFooter from "../../components/MainFooter";
import DashboardHeader from "../dashboard/DashboardHeader";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";
const FEEDBACK_SUBMIT_API = `${API_BASE_URL}/feedback`;
const MY_FEEDBACK_API = `${API_BASE_URL}/feedback/mine`;

const getBg = (colorScheme, light, dark) =>
  colorScheme === "dark" ? dark : light;

// Feedback type selections with beautiful colors and icons
const feedbackTypes = [
  { value: "general", label: "General Thoughts", icon: IconMessage, color: "blue", desc: "Share suggestions about the app" },
  { value: "bug", label: "Bug Report", icon: IconBug, color: "red", desc: "Report issues or unexpected behavior" },
  { value: "feature", label: "Feature Request", icon: IconBulb, color: "yellow", desc: "Suggest new tools or additions" },
  { value: "complaint", label: "Complaint", icon: IconAlertCircle, color: "orange", desc: "File an official security/system complaint" },
];

// Custom Premium inline styling (declared at top to prevent ReferenceError)
const styleTag = (
  <style dangerouslySetInnerHTML={{ __html: `
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in {
      animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    .hover-lift {
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
    }
    .hover-lift:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 24px -10px rgba(0, 0, 0, 0.12) !important;
    }
    .premium-tab {
      transition: all 0.2s ease;
      border-radius: 9999px !important;
      padding: 8px 18px !important;
      font-weight: 700;
      font-size: 14px;
    }
    .premium-tab[data-active] {
      background-color: #228BE6 !important;
      color: white !important;
    }
  ` }} />
);

export default function UserFeedbackPage() {
  const router = useRouter();
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();

  const [activeTab, setActiveTab] = useState("form");
  const [username, setUsername] = useState("User");
  
  // Submit Form States
  const [selectedType, setSelectedType] = useState("general");
  const [ratingVal, setRatingVal] = useState(5);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState("medium");
  const [submitting, setSubmitting] = useState(false);

  // History States
  const [myFeedback, setMyFeedback] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const mainBg = getBg(colorScheme, "#F4F7FE", "#101113");
  const headerBg = getBg(colorScheme, "rgba(255, 255, 255, 0.85)", "rgba(26, 27, 30, 0.85)");
  const borderColor = getBg(colorScheme, "#E9ECEF", theme.colors.dark[5]);
  const cardBg = getBg(colorScheme, "white", theme.colors.dark[6]);
  const isDark = colorScheme === "dark";

  // Load User Info
  useEffect(() => {
    try {
      const stored = localStorage.getItem("currentUser");
      if (stored) {
        const u = JSON.parse(stored);
        setUsername(
          `${u.firstName || ""} ${u.lastName || ""}`.trim() ||
            u.email?.split("@")[0] ||
            "User"
        );
      }
    } catch (_) {}
  }, []);

  // Auth guard
  useEffect(() => {
    const isAuth = localStorage.getItem("isAuthenticated");
    if (!isAuth || isAuth !== "true") {
      router.push("/authentication/login");
    }
  }, [router]);

  // Fetch Feedback History
  const fetchMyFeedback = async () => {
    try {
      setLoadingHistory(true);
      const res = await apiClient(MY_FEEDBACK_API);
      if (!res.ok) throw new Error("Failed to load");
      const payload = await res.json();
      setMyFeedback(payload.data || []);
    } catch (err) {
      toast.show({
        title: "Error",
        message: "Failed to load your past feedback",
        color: "red",
        icon: <IconAlertCircle size={16} />,
      });
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeTab === "history") {
      fetchMyFeedback();
    }
  }, [activeTab]);

  // Handle Form Submission
  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      toast.show({
        title: "Validation Error",
        message: "Please fill in the subject and message fields",
        color: "red",
      });
      return;
    }

    try {
      setSubmitting(true);
      const res = await apiClient(FEEDBACK_SUBMIT_API, {
        method: "POST",
        body: JSON.stringify({
          type: selectedType,
          rating: ratingVal,
          subject: subject.trim(),
          message: message.trim(),
          priority,
        }),
      });

      if (!res.ok) throw new Error("Submission failed");

      toast.show({
        title: "Feedback Submitted!",
        message: "Thank you! Your feedback has been received and sent to the administrator.",
        color: "green",
        icon: <IconCheck size={18} />,
      });

      // Clear Form
      setSubject("");
      setMessage("");
      setRatingVal(5);
      setSelectedType("general");
      setPriority("medium");
      
      // Navigate to History Tab
      setActiveTab("history");

    } catch (err) {
      toast.show({
        title: "Submission Error",
        message: "Could not submit feedback at this time.",
        color: "red",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("isAuthenticated");
    router.push("/");
  };

  return (
    <Box bg={mainBg} style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      
      {styleTag}

      {/* ── Reusable Unified Header ── */}
      <DashboardHeader />

      {/* ── Main Portal Body ── */}
      <Container size="lg" py={40} style={{ flex: 1 }}>
        <Stack gap="xl" className="animate-fade-in">
          
          {/* Welcome Banner */}
          <Box>
            <Title order={2} fw={900} style={{ letterSpacing: -0.5 }} mb={4}>
              Share Your Thoughts
            </Title>
            <Text c="dimmed" size="sm">
              We continually refine our AI surveillance engine. Submit bug reports, feature requests, or general review ratings.
            </Text>
          </Box>

          {/* Tab Selection */}
          <Paper p="xs" radius="xl" withBorder style={{ background: cardBg, border: `1px solid ${borderColor}` }}>
            <Tabs value={activeTab} onChange={setActiveTab} variant="unstyled">
              <Tabs.List style={{ display: 'flex', gap: '8px' }}>
                <Tabs.Tab value="form" className="premium-tab">
                  Write Feedback Review
                </Tabs.Tab>
                <Tabs.Tab value="history" className="premium-tab">
                  My Feedback & Admin Replies
                </Tabs.Tab>
              </Tabs.List>
            </Tabs>
          </Paper>

          {/* ────── SUBMIT FEEDBACK FORM TAB ────── */}
          {activeTab === "form" && (
            <Grid gutter="xl">
              
              {/* Form Input Side */}
              <Grid.Col span={{ base: 12, md: 7 }}>
                <Paper withBorder radius="lg" p="xl" style={{ background: cardBg }} className="hover-lift">
                  <form onSubmit={handleSubmitFeedback}>
                    <Stack gap="lg">
                      
                      {/* Step 1: Select Category */}
                      <Box>
                        <Text fw={800} size="sm" mb="xs" c={isDark ? "white" : "dark"}>
                          Select Category
                        </Text>
                        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                          {feedbackTypes.map((item) => {
                            const CompIcon = item.icon;
                            const isSelected = selectedType === item.value;
                            return (
                              <Paper
                                key={item.value}
                                p="sm"
                                radius="md"
                                withBorder
                                style={{
                                  cursor: "pointer",
                                  border: isSelected ? `2.5px solid ${theme.colors[item.color][6]}` : undefined,
                                  background: isSelected 
                                    ? (isDark ? "rgba(34, 139, 230, 0.08)" : "rgba(34, 139, 230, 0.03)") 
                                    : getBg(colorScheme, "#F8F9FD", "#1E1F22"),
                                  transition: "all 0.2s ease"
                                }}
                                onClick={() => setSelectedType(item.value)}
                              >
                                <Group gap="xs" wrap="nowrap">
                                  <ThemeIcon size="md" color={item.color} variant={isSelected ? "filled" : "light"}>
                                    <CompIcon size={16} />
                                  </ThemeIcon>
                                  <Box style={{ minWidth: 0 }}>
                                    <Text fw={750} size="xs" truncate>{item.label}</Text>
                                    <Text size="10px" c="dimmed" truncate>{item.desc}</Text>
                                  </Box>
                                </Group>
                              </Paper>
                            );
                          })}
                        </SimpleGrid>
                      </Box>

                      {/* Step 2: Rate Experience */}
                      <Paper p="md" radius="md" withBorder style={{ background: getBg(colorScheme, "#F8F9FD", "#1a1b1e") }}>
                        <Group justify="space-between" align="center">
                          <Box>
                            <Text fw={800} size="sm">Overall Rating</Text>
                            <Text size="xs" c="dimmed">Rate your experience using the portal</Text>
                          </Box>
                          <Stack gap={2} align="center">
                            <Rating
                              value={ratingVal}
                              onChange={setRatingVal}
                              size="lg"
                              color="yellow"
                            />
                            <Text size="xs" fw={700} c="dimmed">
                              {ratingVal === 5 ? "Excellent!" : ratingVal === 4 ? "Good" : ratingVal === 3 ? "Average" : ratingVal === 2 ? "Poor" : "Very Poor"}
                            </Text>
                          </Stack>
                        </Group>
                      </Paper>

                      {/* Step 3: Priority selection */}
                      <Select
                        label="Priority Level"
                        description="Let us know how urgent this review is"
                        data={[
                          { value: "low", label: "Low (General feedback)" },
                          { value: "medium", label: "Medium (Review in 1-2 days)" },
                          { value: "high", label: "High (Review today)" },
                          { value: "urgent", label: "Urgent (System issue)" },
                        ]}
                        value={priority}
                        onChange={setPriority}
                        radius="md"
                      />

                      {/* Step 4: Subject */}
                      <TextInput
                        label="Subject Line"
                        placeholder="Brief summary of your feedback..."
                        radius="md"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        required
                      />

                      {/* Step 5: Details message */}
                      <Textarea
                        label="Details Message"
                        placeholder="Please elaborate on your feedback, feature request, or complaint here..."
                        minRows={5}
                        radius="md"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        required
                        styles={{
                          input: { fontFamily: 'inherit' }
                        }}
                      />

                      <Button
                        type="submit"
                        radius="xl"
                        size="md"
                        leftSection={submitting ? <Loader size="xs" color="white" /> : <IconSend size={18} />}
                        disabled={submitting}
                        bg="linear-gradient(135deg, #4DABF7 0%, #228BE6 100%)"
                        style={{ boxShadow: "0 4px 14px rgba(34, 139, 230, 0.3)" }}
                        className="hover-lift"
                      >
                        {submitting ? "Submitting Review..." : "Submit Feedback"}
                      </Button>

                    </Stack>
                  </form>
                </Paper>
              </Grid.Col>

              {/* Informative Side Card */}
              <Grid.Col span={{ base: 12, md: 5 }}>
                <Stack gap="lg">
                  <Paper withBorder radius="lg" p="xl" style={{ 
                    background: "linear-gradient(135deg, #2B3674 0%, #00B8D9 100%)",
                    color: "white"
                  }}>
                    <ThemeIcon size="xl" radius="md" color="white" variant="white" mb="md">
                      <IconStarFilled size={22} color="#FD7E14" />
                    </ThemeIcon>
                    <Title order={3} fw={900} mb="xs">Help Us Secure the Community</Title>
                    <Text size="sm" mb="md" style={{ opacity: 0.9, lineHeight: 1.6 }}>
                      Your reviews, bug reports, and ratings directly help our developer team stabilize CCTV license plate readers and face identification modules.
                    </Text>
                    <Text size="xs" style={{ opacity: 0.7 }}>
                      Admin officers respond in-app within a few hours. Check the "My Feedback" tab regularly.
                    </Text>
                  </Paper>

                  <Paper withBorder radius="lg" p="xl" style={{ background: cardBg }}>
                    <Title order={4} fw={800} mb="md">Feedback Guidelines</Title>
                    <Stack gap="sm">
                      <Group gap="xs" wrap="nowrap" align="flex-start">
                        <ThemeIcon size="xs" radius="xl" color="green"><IconCheck size={10} /></ThemeIcon>
                        <Text size="xs" c="dimmed">Be specific about camera sighting issues.</Text>
                      </Group>
                      <Group gap="xs" wrap="nowrap" align="flex-start">
                        <ThemeIcon size="xs" radius="xl" color="green"><IconCheck size={10} /></ThemeIcon>
                        <Text size="xs" c="dimmed">File complaints for subscription payment delays.</Text>
                      </Group>
                      <Group gap="xs" wrap="nowrap" align="flex-start">
                        <ThemeIcon size="xs" radius="xl" color="green"><IconCheck size={10} /></ThemeIcon>
                        <Text size="xs" c="dimmed">Suggest map UI features or coordinate tweaks.</Text>
                      </Group>
                    </Stack>
                  </Paper>
                </Stack>
              </Grid.Col>
            </Grid>
          )}

          {/* ────── MY FEEDBACK HISTORY TAB ────── */}
          {activeTab === "history" && (
            <Box>
              {loadingHistory ? (
                <Box py={100} ta="center">
                  <Loader size="xl" color="blue" variant="bars" />
                  <Text size="sm" c="dimmed" mt="md" fw={600}>Loading your past submissions...</Text>
                </Box>
              ) : myFeedback.length === 0 ? (
                <Paper p={60} withBorder radius="lg" style={{ background: cardBg, textAlign: "center", borderStyle: 'dashed' }}>
                  <ThemeIcon size={70} radius="xl" color="gray" variant="light" mx="auto" mb="sm">
                    <IconInbox size={35} />
                  </ThemeIcon>
                  <Title order={4} fw={800}>No Submissions Found</Title>
                  <Text size="sm" c="dimmed" mt={4} style={{ maxWidth: 350, margin: "8px auto 0" }}>
                    You have not submitted feedback reviews yet. Toggle to the first tab to send your first message.
                  </Text>
                </Paper>
              ) : (
                <Stack gap="md">
                  {myFeedback.map((item) => {
                    const typeCfg = feedbackTypes.find(t => t.value === item.type) || feedbackTypes[0];
                    const isResolved = item.status === "resolved" || item.status === "closed";
                    const hasReply = !!item.response?.text;

                    return (
                      <Paper key={item._id} withBorder radius="lg" p="lg" style={{ background: cardBg }} className="hover-lift">
                        <Grid>
                          <Grid.Col span={{ base: 12, md: 8 }}>
                            <Group gap="xs" mb="xs" align="center">
                              <Badge color={typeCfg.color} variant="light" size="xs" style={{ textTransform: 'uppercase' }}>
                                {item.type}
                              </Badge>
                              <Badge color={item.priority === 'urgent' ? 'red' : item.priority === 'high' ? 'orange' : 'gray'} variant="filled" size="xs">
                                {item.priority} priority
                              </Badge>
                              <Text size="xs" c="dimmed">•</Text>
                              <Text size="xs" c="dimmed">{new Date(item.createdAt).toLocaleDateString()}</Text>
                            </Group>

                            <Title order={4} fw={850} mb="xs">
                              {item.subject}
                            </Title>

                            {/* Sighting rating stars */}
                            <Group gap={4} mb="md" align="center">
                              <Rating value={item.rating || 5} readOnly size="sm" />
                              <Text size="xs" fw={700} c="dimmed">( {item.rating || 5} Stars )</Text>
                            </Group>

                            <Text size="sm" c={isDark ? "gray.4" : "gray.8"} style={{ lineHeight: 1.6 }}>
                              {item.message}
                            </Text>
                          </Grid.Col>

                          {/* Response Status Side */}
                          <Grid.Col span={{ base: 12, md: 4 }}>
                            <Stack gap="sm" align="stretch" justify="center" style={{ height: "100%" }}>
                              
                              {/* Status Badge */}
                              <Paper p="sm" radius="md" withBorder style={{ 
                                background: isResolved 
                                  ? "rgba(64, 192, 87, 0.08)" 
                                  : "rgba(253, 126, 20, 0.08)",
                                border: `1px solid ${isResolved ? theme.colors.green[4] : theme.colors.orange[4]}`,
                                textAlign: "center"
                              }}>
                                <Group gap="xs" justify="center">
                                  <ThemeIcon size="xs" radius="xl" color={isResolved ? "green" : "orange"}>
                                    {isResolved ? <IconCheck size={10} /> : <IconClock size={10} />}
                                  </ThemeIcon>
                                  <Text size="xs" fw={800} style={{ textTransform: "uppercase" }} color={isResolved ? "green" : "orange"}>
                                    Status: {item.status}
                                  </Text>
                                </Group>
                              </Paper>

                              {/* Admin reply thread */}
                              {hasReply ? (
                                <Paper p="md" radius="md" withBorder style={{ 
                                  background: isDark ? "rgba(34, 139, 230, 0.08)" : "rgba(34, 139, 230, 0.03)", 
                                  border: `1.5px solid ${theme.colors.blue[4]}`
                                }}>
                                  <Group gap="xs" mb={8} align="center">
                                    <ThemeIcon size="sm" radius="xl" color="blue">
                                      <IconUserCheck size={12} />
                                    </ThemeIcon>
                                    <Text size="xs" fw={800}>Admin Officer Reply:</Text>
                                  </Group>
                                  <Text size="xs" c={isDark ? "gray.3" : "gray.8"} style={{ lineHeight: 1.5, fontStyle: "italic" }}>
                                    "{item.response.text}"
                                  </Text>
                                  {item.response.respondedAt && (
                                    <Text size="9px" c="dimmed" mt={4} ta="right">
                                      Replied: {new Date(item.response.respondedAt).toLocaleDateString()}
                                    </Text>
                                  )}
                                </Paper>
                              ) : (
                                <Paper p="md" radius="md" withBorder style={{ background: getBg(colorScheme, "#F8F9FD", "#1A1B1E"), borderStyle: "dashed" }} ta="center">
                                  <Text size="xs" c="dimmed" fs="italic">
                                    Awaiting Admin review. A notification will arrive when responded.
                                  </Text>
                                </Paper>
                              )}

                            </Stack>
                          </Grid.Col>
                        </Grid>
                      </Paper>
                    );
                  })}
                </Stack>
              )}
            </Box>
          )}

        </Stack>
      </Container>

      <MainFooter />
    </Box>
  );
}
