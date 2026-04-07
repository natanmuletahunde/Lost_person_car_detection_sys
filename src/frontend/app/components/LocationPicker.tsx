'use client';

import { useState, memo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, LayersControl, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom icon for the selected location (user click)
const selectedIcon = L.divIcon({
  html: '📍',
  className: 'selected-marker',
  iconSize: [24, 24],
  popupAnchor: [0, -12],
});

// Default icon for extra markers (missing persons/vehicles)
const defaultIcon = L.divIcon({
  html: '●',
  className: 'default-marker',
  iconSize: [16, 16],
  popupAnchor: [0, -8],
  style: { color: '#2f80ed', fontSize: '20px', lineHeight: '16px' },
});

// Handler for map clicks (only updates the selected marker)
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

const LocationPicker = memo(({
  onLocationSelect,
  initialPosition = [9.03, 38.74],
  markers = [], // array of { lat, lng, title, type? }
}) => {
  const [position, setPosition] = useState(initialPosition);
  const timeoutRef = useRef(null);

  const handleMapClick = async (lat, lng) => {
    setPosition([lat, lng]);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
        );
        const data = await response.json();
        const address = data.display_name || `${lat}, ${lng}`;
        onLocationSelect(lat, lng, address);
      } catch {
        onLocationSelect(lat, lng, `${lat}, ${lng}`);
      }
    }, 300);
  };

  return (
    <MapContainer
      key="map"
      center={position}
      zoom={13}
      style={{ height: '300px', width: '100%', borderRadius: '12px' }}
      scrollWheelZoom={true}
      dragging={true}
      zoomControl={true}
    >
      {/* Layer switcher: Street / Satellite */}
      <LayersControl position="topright">
        <LayersControl.BaseLayer checked name="Street">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; CartoDB'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Satellite">
          <TileLayer
            attribution='Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
        </LayersControl.BaseLayer>
      </LayersControl>

      {/* Selected location marker (clickable) */}
      <Marker position={position} icon={selectedIcon} />

      {/* Extra markers (e.g., missing persons/vehicles) */}
      {markers.map((m, idx) => (
        <Marker key={idx} position={[m.lat, m.lng]} icon={defaultIcon}>
          {m.title && <Popup>{m.title}</Popup>}
        </Marker>
      ))}

      {/* Click handler to update selected location */}
      <MapClickHandler onMapClick={handleMapClick} />
    </MapContainer>
  );
});

LocationPicker.displayName = 'LocationPicker';
export default LocationPicker;