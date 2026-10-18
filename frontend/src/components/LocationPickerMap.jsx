import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Crosshair, AlertCircle } from 'lucide-react';

// Refined, high-visibility pin for enterprise maps (no harsh neon)
const createEnterprisePin = () => {
  return L.divIcon({
    className: 'enterprise-location-pin',
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px;">
        <div style="width: 22px; height: 22px; border-radius: 50%; background-color: #dc2626; border: 3px solid #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
          <div style="width: 6px; height: 6px; border-radius: 50%; background-color: #ffffff;"></div>
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

function LocationMarker({ position, onPositionChange }) {
  const markerRef = useRef(null);

  useMapEvents({
    click(e) {
      onPositionChange([e.latlng.lat, e.latlng.lng]);
    },
  });

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const newLatLng = marker.getLatLng();
          onPositionChange([newLatLng.lat, newLatLng.lng]);
        }
      },
    }),
    [onPositionChange]
  );

  return (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={position}
      ref={markerRef}
      icon={createEnterprisePin()}
    />
  );
}

function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [center, zoom, map]);
  return null;
}

export default function LocationPickerMap({
  latitude,
  longitude,
  onLocationChange,
}) {
  const [isLocating, setIsLocating] = useState(false);
  const [gpsError, setGpsError] = useState(null);
  const [currentZoom, setCurrentZoom] = useState(13);

  const currentCoords = useMemo(() => {
    const lat = typeof latitude === 'number' && !isNaN(latitude) ? latitude : 20.5734;
    const lng = typeof longitude === 'number' && !isNaN(longitude) ? longitude : 86.7623;
    return [lat, lng];
  }, [latitude, longitude]);

  const handlePositionChange = (newCoords) => {
    onLocationChange({
      lat: parseFloat(newCoords[0].toFixed(6)),
      lng: parseFloat(newCoords[1].toFixed(6)),
    });
  };

  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your current browser.');
      return;
    }

    setIsLocating(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: userLat, longitude: userLng } = pos.coords;
        handlePositionChange([userLat, userLng]);
        setCurrentZoom(15);
        setIsLocating(false);
      },
      (err) => {
        console.warn('GPS detection error:', err);
        setGpsError('GPS signal unavailable or location permission denied. Click anywhere on the map to place your pin.');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  return (
    <div className="space-y-2.5">
      {/* Header action toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
          <MapPin className="w-3.5 h-3.5 text-rose-600" />
          <span>Interactive Location Pinpoint</span>
        </div>

        <button
          type="button"
          onClick={handleDetectGPS}
          disabled={isLocating}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
            bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-sm disabled:opacity-50"
        >
          {isLocating ? (
            <span className="flex items-center gap-1.5 text-blue-600">
              <span className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              Acquiring GPS...
            </span>
          ) : (
            <>
              <Crosshair className="w-3.5 h-3.5 text-blue-600" />
              <span>Detect My Location (GPS)</span>
            </>
          )}
        </button>
      </div>

      {gpsError && (
        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{gpsError}</span>
        </div>
      )}

      {/* Clean White Card Wrapper for Leaflet Map */}
      <div className="relative w-full h-[320px] md:h-[380px] min-h-[300px] rounded-xl overflow-hidden border border-slate-300 bg-slate-100 shadow-sm z-0">
        <MapContainer
          center={currentCoords}
          zoom={currentZoom}
          scrollWheelZoom={true}
          className="w-full h-full min-h-[300px] z-0"
          style={{ width: '100%', height: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ChangeView center={currentCoords} zoom={currentZoom} />
          <LocationMarker position={currentCoords} onPositionChange={handlePositionChange} />
        </MapContainer>

        {/* Map instruction pill */}
        <div className="absolute bottom-2.5 left-2.5 z-[400] pointer-events-none">
          <div className="px-2.5 py-1 rounded-md bg-white/95 backdrop-blur-sm border border-slate-200 text-[11px] font-medium text-slate-600 shadow-sm">
            Click map or drag marker to reposition
          </div>
        </div>

        {/* Live Coordinate Badge */}
        <div className="absolute top-2.5 right-2.5 z-[400]">
          <div className="px-2.5 py-1 rounded-md bg-white/95 backdrop-blur-sm border border-slate-200 text-[11px] font-mono text-slate-800 shadow-sm">
            {currentCoords[0].toFixed(5)}, {currentCoords[1].toFixed(5)}
          </div>
        </div>
      </div>
    </div>
  );
}
