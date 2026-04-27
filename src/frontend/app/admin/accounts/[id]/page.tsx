"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Title,
  Text,
  Group,
  Avatar,
  Badge,
  Stack,
  Grid,
  Button,
  Loader,
  Divider,
  useMantineTheme,
  useMantineColorScheme,
  Modal,
  TextInput,
  Select,
  Switch,
  ActionIcon,
  Tooltip,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { useForm } from "@mantine/form";
import {
  IconArrowLeft,
  IconEdit,
  IconTrash,
  IconRefresh,
  IconLock,
  IconLockOpen,
  IconCheck,
} from "@tabler/icons-react";

// ✅ Changed base URL to port 3000
const API_BASE_URL = "http://localhost:3000";

// Helper functions
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Map API user to component shape (for the edit form)
const mapApiToEditForm = (apiUser) => ({
  id: apiUser.id,
  name: `${apiUser.firstName} ${apiUser.lastName}`.trim(),
  email: apiUser.email,
  phone: apiUser.phone,
  role: apiUser.role,
  status: apiUser.hasPaidSubscription ? "Paid" : "Free",
  address: apiUser.address || "",
  isActive: apiUser.isActive,
});

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);

  // Modal controls
  const [editModalOpened, editModalHandlers] = useDisclosure(false);
  const [deleteModalOpened, deleteModalHandlers] = useDisclosure(false);
  const [resetPasswordModalOpened, resetPasswordModalHandlers] = useDisclosure(false);

  // Fetch user
  const fetchUser = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/users/${params.id}`);
      if (!response.ok) throw new Error("User not found");
      const data = await response.json();
      setUser(data);
    } catch (error) {
      console.error(error);
      notifications.show({
        title: "Error",
        message: "Could not load user details",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchUser();
    }
  }, [params.id]);

  // Edit form
  const editForm = useForm({
    initialValues: editingUser || {
      id: "",
      name: "",
      email: "",
      phone: "",
      role: "user",
      status: "Free",
      address: "",
      isActive: true,
    },
    validate: {
      name: (v) => (v?.trim().length < 2 ? "Name is too short" : null),
      email: (v) => (/^\S+@\S+\.\S+$/.test(v) ? null : "Invalid email"),
      phone: (v) => (v?.trim().length < 10 ? "Phone number too short" : null),
    },
  });

  // Set form values when editingUser changes
  useEffect(() => {
    if (editingUser) {
      editForm.setValues(editingUser);
      editForm.resetDirty();
    }
  }, [editingUser]);

  // Update user
  const updateUser = async (values) => {
    try {
      // Fetch the existing user to preserve password and other fields
      const existingUserResponse = await fetch(`${API_BASE_URL}/users/${values.id}`);
      if (!existingUserResponse.ok) throw new Error("User not found");
      const existingApiUser = await existingUserResponse.json();

      const nameParts = values.name.split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      const updatedApiUser = {
        ...existingApiUser,
        firstName,
        lastName,
        email: values.email,
        phone: values.phone,
        role: values.role,
        hasPaidSubscription: values.status === "Paid",
        address: values.address,
        isActive: values.isActive,
        updatedAt: new Date().toISOString(),
      };

      const response = await fetch(`${API_BASE_URL}/users/${values.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedApiUser),
      });
      if (!response.ok) throw new Error("Failed to update user");

      const updatedUser = await response.json();
      setUser(updatedUser); // update the displayed user
      notifications.show({
        title: "Updated",
        message: `User ${updatedUser.firstName} ${updatedUser.lastName} updated`,
        color: "blue",
        icon: <IconCheck size={18} />,
      });
      editModalHandlers.close();
    } catch (error) {
      console.error(error);
      notifications.show({
        title: "Error",
        message: "Could not update user",
        color: "red",
      });
    }
  };

  // Delete user
  const deleteUser = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${user.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete user");
      notifications.show({
        title: "Deleted",
        message: "User removed",
        color: "red",
        icon: <IconTrash size={18} />,
      });
      router.push("/admin/accounts"); // redirect to list after deletion
    } catch (error) {
      console.error(error);
      notifications.show({
        title: "Error",
        message: "Could not delete user",
        color: "red",
      });
    }
  };

  // Toggle account status
  const toggleUserStatus = async () => {
    try {
      const newStatus = !user.isActive;
      const updatedApiUser = { ...user, isActive: newStatus, updatedAt: new Date().toISOString() };
      const response = await fetch(`${API_BASE_URL}/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedApiUser),
      });
      if (!response.ok) throw new Error("Failed to update status");
      const updatedUser = await response.json();
      setUser(updatedUser);
      notifications.show({
        title: "Status updated",
        message: `User ${updatedUser.firstName} ${updatedUser.lastName} ${updatedUser.isActive ? "activated" : "deactivated"}`,
        color: "blue",
      });
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Could not update status",
        color: "red",
      });
    }
  };

  // Reset password (simulated)
  const resetPassword = async () => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      notifications.show({
        title: "Password reset",
        message: `A password reset link has been sent to ${user.email}`,
        color: "green",
      });
      resetPasswordModalHandlers.close();
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Password reset failed",
        color: "red",
      });
    }
  };

  if (loading) {
    return (
      <Box p="xl" style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <Loader size="xl" />
      </Box>
    );
  }

  if (!user) {
    return (
      <Box p="xl">
        <Title order={2}>User not found</Title>
        <Button onClick={() => router.push("/admin/accounts")} mt="md">
          Back to users
        </Button>
      </Box>
    );
  }

  // Prepare user data for display
  const fullName = `${user.firstName} ${user.lastName}`.trim();
  const username = user.email.split("@")[0];

  return (
    <Box p="xl" bg={colorScheme === "dark" ? theme.colors.dark[7] : "#F4F7FE"} style={{ minHeight: "100vh" }}>
      <Group justify="space-between" mb="lg">
        <Button
          variant="subtle"
          leftSection={<IconArrowLeft size={16} />}
          onClick={() => router.push("/admin/accounts")}
        >
          Back to users
        </Button>
        <Group gap="sm">
          <Tooltip label={user.isActive ? "Deactivate" : "Activate"}>
            <ActionIcon
              variant="light"
              color={user.isActive ? "yellow" : "green"}
              size="lg"
              onClick={toggleUserStatus}
            >
              {user.isActive ? <IconLockOpen size={20} /> : <IconLock size={20} />}
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Reset password">
            <ActionIcon
              variant="light"
              color="orange"
              size="lg"
              onClick={() => resetPasswordModalHandlers.open()}
            >
              <IconRefresh size={20} />
            </ActionIcon>
          </Tooltip>
          <Button
            variant="light"
            leftSection={<IconEdit size={16} />}
            onClick={() => {
              setEditingUser(mapApiToEditForm(user));
              editModalHandlers.open();
            }}
          >
            Edit User
          </Button>
          <Button
            variant="light"
            color="red"
            leftSection={<IconTrash size={16} />}
            onClick={deleteModalHandlers.open}
          >
            Delete
          </Button>
        </Group>
      </Group>

      <Paper p="xl" radius="lg" shadow="sm" withBorder>
        <Group gap="xl" mb="lg">
          <Avatar size={100} radius="xl" color="blue">
            {fullName.charAt(0)}
          </Avatar>
          <Box>
            <Title order={2}>{fullName}</Title>
            <Text size="sm" c="dimmed">@{username}</Text>
          </Box>
        </Group>

        <Divider my="lg" />

        <Grid>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Stack gap="xs">
              <Text fw={600}>Email</Text>
              <Text>{user.email}</Text>
            </Stack>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Stack gap="xs">
              <Text fw={600}>Phone</Text>
              <Text>{user.phone}</Text>
            </Stack>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Stack gap="xs">
              <Text fw={600}>Role</Text>
              <Badge
                color={
                  user.role === "admin" ? "red" :
                  user.role === "user" ? "blue" : "cyan"
                }
                size="lg"
              >
                {user.role}
              </Badge>
            </Stack>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Stack gap="xs">
              <Text fw={600}>Status</Text>
              <Badge color={user.hasPaidSubscription ? "green" : "gray"} size="lg">
                {user.hasPaidSubscription ? "Paid" : "Free"}
              </Badge>
            </Stack>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Stack gap="xs">
              <Text fw={600}>Joined</Text>
              <Text>{formatDate(user.createdAt)}</Text>
            </Stack>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Stack gap="xs">
              <Text fw={600}>Last Login</Text>
              <Text>{formatDate(user.lastLogin)}</Text>
            </Stack>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Stack gap="xs">
              <Text fw={600}>Registrations</Text>
              <Text>{user.registrations || 0}</Text>
            </Stack>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Stack gap="xs">
              <Text fw={600}>Account Active</Text>
              <Badge color={user.isActive ? "green" : "red"} size="lg">
                {user.isActive ? "Active" : "Inactive"}
              </Badge>
            </Stack>
          </Grid.Col>
          {user.address && (
            <Grid.Col span={12}>
              <Stack gap="xs">
                <Text fw={600}>Address</Text>
                <Text>{user.address}</Text>
              </Stack>
            </Grid.Col>
          )}
        </Grid>
      </Paper>

      {/* Edit User Modal */}
      <Modal
        opened={editModalOpened}
        onClose={editModalHandlers.close}
        title={<Text fw={700} size="lg">Edit User</Text>}
        centered
        size="lg"
        radius="md"
      >
        <form onSubmit={editForm.onSubmit(updateUser)}>
          <Stack gap="sm">
            <TextInput label="Full Name" {...editForm.getInputProps("name")} required />
            <TextInput label="Email" {...editForm.getInputProps("email")} required />
            <TextInput label="Phone" {...editForm.getInputProps("phone")} required />
            <Select
              label="Role"
              data={["admin", "user", "guest"]}
              {...editForm.getInputProps("role")}
              required
            />
            <Select
              label="Status"
              data={["Paid", "Free"]}
              {...editForm.getInputProps("status")}
              required
            />
            <Switch
              label="Account Active"
              checked={editForm.values.isActive}
              onChange={(event) => editForm.setFieldValue("isActive", event.currentTarget.checked)}
            />
            <TextInput label="Address" {...editForm.getInputProps("address")} />
            <Group justify="flex-end" mt="md">
              <Button variant="subtle" onClick={editModalHandlers.close}>Cancel</Button>
              <Button type="submit" bg="#2B3674">Update</Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        opened={deleteModalOpened}
        onClose={deleteModalHandlers.close}
        title="Confirm Delete"
        centered
      >
        <Text>Are you sure you want to delete this user? This action cannot be undone.</Text>
        <Group justify="flex-end" mt="md">
          <Button variant="subtle" onClick={deleteModalHandlers.close}>Cancel</Button>
          <Button color="red" onClick={deleteUser}>Delete</Button>
        </Group>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        opened={resetPasswordModalOpened}
        onClose={resetPasswordModalHandlers.close}
        title="Reset Password"
        centered
      >
        <Text>Send a password reset link to {user.email}?</Text>
        <Group justify="flex-end" mt="md">
          <Button variant="subtle" onClick={resetPasswordModalHandlers.close}>Cancel</Button>
          <Button color="orange" onClick={resetPassword}>Send reset link</Button>
        </Group>
      </Modal>
    </Box>
  );
}