'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Text,
  Group,
  Badge,
  Button,
  Stack,
  Loader,
  ScrollArea,
  Card,
  Modal,
  TextInput,
  useMantineTheme,
  useMantineColorScheme,
  Switch,
} from '@mantine/core';
import {
  IconMapPin,
  IconAlertCircle,
  IconRefresh,
  IconCirclePlus,
  IconHistory,
  IconCheck,
  IconCrosshair,
  IconDeviceMobile,
  IconExternalLink,
  IconTarget,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import Link from 'next/link';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
const GPS_DEVICES_API = `${API_BASE_URL}/gpsDevices`;
const GPS_LOCATIONS_API = `${API_BASE_URL}/gpsLocations`;

export default function GpsTracker() {
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  const markersRef = useRef({});
  const geofenceLayersRef = useRef([]);
  const pollInterval = useRef(null);
  const [L, setL] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [locationHistory, setLocationHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [geofenceModalOpen, setGeofenceModalOpen] = useState(false);
  const [newGeofence, setNewGeofence] = useState({ lat: null, lng: null, radius: 100 });
  const [geofenceMode, setGeofenceMode] = useState(false);
  const [showGeofences, setShowGeofences] = useState(true);

  // Dynamically import Leaflet on the client
  useEffect(() => {
    const loadLeaflet = async () => {
      const leaflet = await import('leaflet');
      await import('leaflet/dist/leaflet.css');

      const icon = await import('leaflet/dist/images/marker-icon.png');
      const iconShadow = await import('leaflet/dist/images/marker-shadow.png');
      const DefaultIcon = leaflet.icon({
        iconUrl: icon.default,
        shadowUrl: iconShadow.default,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      });
      leaflet.Marker.prototype.options.icon = DefaultIcon;

      setL(leaflet);
      setMapLoaded(true);
    };
    loadLeaflet();
  }, []);

  const fetchDevices = async () => {
    try {
      const res = await fetch(GPS_DEVICES_API);
      if (!res.ok) throw new Error('Failed to fetch devices');
      const data = await res.json();
      setDevices(data);
    } catch (error) {
      console.error(error);
      notifications.show({
        title: 'Error',
        message: 'Could not load GPS devices',
        color: 'red',
        icon: <IconAlertCircle size={16} />,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
    pollInterval.current = setInterval(fetchDevices, 30000);
    return () => clearInterval(pollInterval.current);
  }, []);

  // Initialize map with street/satellite layers
  useEffect(() => {
    if (!mapLoaded || !L || !mapRef.current) return;

    if (leafletMap.current) {
      leafletMap.current.remove();
      leafletMap.current = null;
      if (mapRef.current) mapRef.current.innerHTML = '';
    }

    // Define tile layers
    const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    });

    const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    });

    const map = L.map(mapRef.current).setView([9.03, 38.74], 12);
    leafletMap.current = map;
    streetLayer.addTo(map);

    // Add layer control
    const baseLayers = {
      'Street View': streetLayer,
      'Satellite View': satelliteLayer,
    };
    L.control.layers(baseLayers).addTo(map);

    // Add Locate Me button as a custom control
    const locateControl = L.Control.extend({
      options: { position: 'topright' },
      onAdd: () => {
        const btn = L.DomUtil.create('button', 'leaflet-bar leaflet-control leaflet-control-custom');
        btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/></svg>';
        btn.style.backgroundColor = 'white';
        btn.style.borderRadius = '4px';
        btn.style.border = '1px solid rgba(0,0,0,0.2)';
        btn.style.width = '34px';
        btn.style.height = '34px';
        btn.style.cursor = 'pointer';
        btn.title = 'Zoom to my location';
        btn.onclick = () => {
          if (!navigator.geolocation) {
            notifications.show({
              title: 'Not supported',
              message: 'Your browser does not support geolocation',
              color: 'yellow',
            });
            return;
          }
          navigator.geolocation.getCurrentPosition(
            (position) => {
              map.flyTo([position.coords.latitude, position.coords.longitude], 15);
            },
            (error) => {
              notifications.show({
                title: 'Location error',
                message: error.message,
                color: 'red',
              });
            }
          );
        };
        return btn;
      },
    });
    map.addControl(new locateControl());

    // Geofence click mode
    map.on('click', (e) => {
      if (geofenceMode) {
        setNewGeofence({ lat: e.latlng.lat, lng: e.latlng.lng, radius: newGeofence.radius });
        setGeofenceMode(false);
        setGeofenceModalOpen(true);
        const tempMarker = L.marker([e.latlng.lat, e.latlng.lng]).addTo(map);
        setTimeout(() => map.removeLayer(tempMarker), 3000);
      }
    });

    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
        if (mapRef.current) mapRef.current.innerHTML = '';
      }
    };
  }, [mapLoaded, L]);

  // Update markers and geofences when devices change
  useEffect(() => {
    const map = leafletMap.current;
    if (!map || !L) return;

    Object.values(markersRef.current).forEach(marker => marker.remove());
    markersRef.current = {};
    geofenceLayersRef.current.forEach(layer => layer.remove());
    geofenceLayersRef.current = [];

    const gpsIcon = L.divIcon({
      html: '📍',
      className: 'gps-marker',
      iconSize: [24, 24],
      popupAnchor: [0, -12],
    });

    devices.forEach((device) => {
      if (device.lastLocation) {
        const marker = L.marker([device.lastLocation.lat, device.lastLocation.lng], { icon: gpsIcon })
          .bindPopup(`
            <b>${device.name}</b><br>
            ${device.lastLocation.address || device.lastLocation.location}<br>
            Last seen: ${new Date(device.lastLocation.timestamp).toLocaleString()}<br>
            Battery: ${device.battery}%<br>
            Status: ${device.status}
          `)
          .addTo(map);
        markersRef.current[device.id] = marker;
      }

      if (showGeofences && device.geofence && device.geofence.lat && device.geofence.lng && device.geofence.radius) {
        const circle = L.circle([device.geofence.lat, device.geofence.lng], {
          radius: device.geofence.radius,
          color: '#2f80ed',
          fillColor: '#2f80ed',
          fillOpacity: 0.2,
          weight: 2,
        }).addTo(map);
        circle.bindPopup(`<b>${device.name}</b><br>Geofence radius: ${device.geofence.radius} meters`);
        geofenceLayersRef.current.push(circle);
      }
    });
  }, [devices, L, showGeofences]);

  const fetchLocationHistory = async (deviceId) => {
    try {
      const res = await fetch(`${GPS_LOCATIONS_API}?deviceId=${deviceId}&_sort=timestamp&_order=desc&_limit=20`);
      if (!res.ok) throw new Error('Failed to fetch history');
      const data = await res.json();
      setLocationHistory(data);
    } catch (error) {
      console.error(error);
      notifications.show({
        title: 'Error',
        message: 'Could not load location history',
        color: 'red',
        icon: <IconAlertCircle size={16} />,
      });
    }
  };

  const handleSelectDevice = (device) => {
    setSelectedDevice(device);
    fetchLocationHistory(device.id);
    if (leafletMap.current && device.lastLocation) {
      leafletMap.current.flyTo([device.lastLocation.lat, device.lastLocation.lng], 14);
    }
  };

  const handleSetGeofence = async () => {
    if (!selectedDevice) return;
    try {
      const response = await fetch(`${GPS_DEVICES_API}/${selectedDevice.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ geofence: newGeofence }),
      });
      if (response.ok) {
        notifications.show({
          title: 'Success',
          message: 'Geofence saved for this device',
          color: 'green',
          icon: <IconCheck size={16} />,
        });
        setGeofenceModalOpen(false);
        setNewGeofence({ lat: null, lng: null, radius: 100 });
        fetchDevices();
      } else {
        throw new Error('Failed to save geofence');
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Could not save geofence',
        color: 'red',
        icon: <IconAlertCircle size={16} />,
      });
    }
  };

  const startGeofenceMode = () => {
    setGeofenceMode(true);
    notifications.show({
      title: 'Select Center',
      message: 'Click on the map to set the geofence center',
      color: 'blue',
      icon: <IconCrosshair size={16} />,
      autoClose: 5000,
    });
  };

  if (loading) {
    return (
      <Box style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Loader />
      </Box>
    );
  }

  return (
    <Box>
      <Group justify="space-between" mb="md">
        <Text size="xl" fw={700}>GPS Smart Belts</Text>
        <Group>
          <Switch
            label="Show Geofences"
            checked={showGeofences}
            onChange={(e) => setShowGeofences(e.currentTarget.checked)}
            size="sm"
          />
          <Button
            component={Link}
            href="/gps/register"
            leftSection={<IconDeviceMobile size={16} />}
            rightSection={<IconExternalLink size={14} />}
            color="blue"
          >
            Register Belt
          </Button>
          <Button leftSection={<IconRefresh size={16} />} variant="light" onClick={fetchDevices}>
            Refresh
          </Button>
        </Group>
      </Group>

      <Paper withBorder radius="md" style={{ overflow: 'hidden', height: '70vh' }}>
        <Group align="stretch" style={{ height: '100%' }}>
          <Box
            style={{
              width: '300px',
              borderRight: `1px solid ${colorScheme === 'dark' ? '#2C2E33' : '#E9ECEF'}`,
              overflow: 'auto',
            }}
          >
            <ScrollArea h="100%">
              <Stack gap="xs" p="xs">
                {devices.length === 0 ? (
                  <Text c="dimmed" ta="center" py="xl">No active GPS devices</Text>
                ) : (
                  devices.map((device) => (
                    <Card
                      key={device.id}
                      withBorder
                      radius="md"
                      p="sm"
                      style={{
                        cursor: 'pointer',
                        backgroundColor:
                          selectedDevice?.id === device.id
                            ? colorScheme === 'dark'
                              ? '#2C2E33'
                              : '#F0F9FF'
                            : undefined,
                      }}
                      onClick={() => handleSelectDevice(device)}
                    >
                      <Group justify="space-between">
                        <Text fw={600}>{device.name}</Text>
                        <Badge
                          color={
                            device.status === 'active'
                              ? 'green'
                              : device.status === 'low_battery'
                              ? 'orange'
                              : 'red'
                          }
                          variant="light"
                        >
                          {device.status === 'active' ? 'Active' : device.status === 'low_battery' ? 'Low Battery' : 'Inactive'}
                        </Badge>
                      </Group>
                      <Text size="sm" c="dimmed" mt={4}>
                        {device.lastLocation?.address || device.lastLocation?.location || 'No location data'}
                      </Text>
                      <Group gap="xs" mt={4}>
                        <IconMapPin size={12} />
                        <Text size="xs" c="dimmed">
                          {device.lastLocation?.timestamp ? new Date(device.lastLocation.timestamp).toLocaleString() : 'Unknown'}
                        </Text>
                      </Group>
                      {device.battery !== undefined && (
                        <Text size="xs" c="dimmed" mt={2}>Battery: {device.battery}%</Text>
                      )}
                    </Card>
                  ))
                )}
              </Stack>
            </ScrollArea>
          </Box>

          <Box style={{ flex: 1, position: 'relative' }}>
            {!mapLoaded && (
              <Box style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 10 }}>
                <Loader />
              </Box>
            )}
            <div ref={mapRef} style={{ height: '100%', width: '100%' }} />
            {geofenceMode && (
              <Box
                style={{
                  position: 'absolute',
                  bottom: 20,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: colorScheme === 'dark' ? '#2C2E33' : 'white',
                  padding: '8px 16px',
                  borderRadius: 8,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  zIndex: 1000,
                  pointerEvents: 'none',
                }}
              >
                <Text size="sm" fw={500}>Click on map to set geofence center</Text>
              </Box>
            )}
          </Box>
        </Group>
      </Paper>

      {selectedDevice && (
        <Paper withBorder radius="md" mt="md" p="md">
          <Group justify="space-between" mb="sm">
            <Group>
              <Text fw={700}>Device: {selectedDevice.name}</Text>
              <Badge color={selectedDevice.status === 'active' ? 'green' : 'orange'}>
                {selectedDevice.status === 'active' ? 'Online' : 'Offline'}
              </Badge>
            </Group>
            <Group>
              <Button
                size="xs"
                variant="light"
                leftSection={<IconCirclePlus size={14} />}
                onClick={startGeofenceMode}
                disabled={geofenceMode}
              >
                Set Geofence
              </Button>
              <Button
                size="xs"
                variant="light"
                leftSection={<IconHistory size={14} />}
                onClick={() => fetchLocationHistory(selectedDevice.id)}
              >
                Refresh History
              </Button>
            </Group>
          </Group>

          <Text size="sm" c="dimmed" mb="sm">
            Last known: {selectedDevice.lastLocation?.address || selectedDevice.lastLocation?.location || 'Unknown'} at{' '}
            {selectedDevice.lastLocation?.timestamp ? new Date(selectedDevice.lastLocation.timestamp).toLocaleString() : 'Unknown'}
          </Text>

          <Text fw={600} mb="xs">Recent Locations</Text>
          <ScrollArea h={200}>
            {locationHistory.length === 0 ? (
              <Text c="dimmed" ta="center" py="md">No location history</Text>
            ) : (
              <Stack gap="xs">
                {locationHistory.map((loc) => (
                  <Group key={loc.id} gap="xs" wrap="nowrap">
                    <IconMapPin size={14} />
                    <Text size="sm" style={{ flex: 1 }}>{loc.address || loc.location}</Text>
                    <Text size="xs" c="dimmed">{new Date(loc.timestamp).toLocaleString()}</Text>
                  </Group>
                ))}
              </Stack>
            )}
          </ScrollArea>
        </Paper>
      )}

      <Modal
        opened={geofenceModalOpen}
        onClose={() => setGeofenceModalOpen(false)}
        title={`Set Geofence for ${selectedDevice?.name || 'Device'}`}
        size="sm"
      >
        <Stack>
          <Text size="sm">Define a circular geofence around the selected point.</Text>
          {newGeofence.lat && newGeofence.lng && (
            <Box>
              <Text size="xs">Center: {newGeofence.lat.toFixed(4)}, {newGeofence.lng.toFixed(4)}</Text>
              <Text size="xs">Radius: {newGeofence.radius} meters</Text>
            </Box>
          )}
          <TextInput
            label="Radius (meters)"
            type="number"
            value={newGeofence.radius}
            onChange={(e) => setNewGeofence({ ...newGeofence, radius: parseInt(e.target.value, 10) })}
          />
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={() => setGeofenceModalOpen(false)}>Cancel</Button>
            <Button color="blue" onClick={handleSetGeofence}>Save Geofence</Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
}