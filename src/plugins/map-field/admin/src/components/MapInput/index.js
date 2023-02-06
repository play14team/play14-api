import React from 'react';
import { Stack, Typography } from '@strapi/design-system';
import ReactMapGL, { Marker } from 'react-map-gl';

const DEFAULT_VIEWPORT = {
  width: 800,
  height: 600,
  longitude: -122.45,
  latitude: 37.78,
  zoom: 14,
};

const MapField = ({
  description,
  disabled,
  error,
  intlLabel,
  name,
  onChange,
  placeholder,
  required,
  value
}) => {
  const { formatMessage } = useIntl();
  const [marker, setMarker] = useState(value);
  const [viewport, setViewport]= useState(
    value
      ? {...DEFAULT_VIEWPORT, longitude: value.lng, latitude: value.lat }
      : DEFAULT_VIEWPORT
  )

  const handleChange = ({ lngLat }) => {
    const [ lng, lat ] = lngLat;
    const value = JSON.stringify({
      longitude: lng,
      latitude: lat
    });

    setMarker({ lng, lat});
    onChange({ target: { name, value, type: "json" } });
  }

  return (
  <Stack size={1}>
    <Typography
      textColor="neutral800"
      as="label"
      variant="pi"
      fontWeight="bold"
    >
      {formatMessage(intlLabel)}
    </Typography>
    <ReactMapGL
      {...viewport}
      mapStyle={'mapbox://styles/mapbox/streets-v12'}
      onClick={handleChange}
      onViewportChange={(nextViewport) => setViewport(nextViewport)}
      mapboxApiAccessToken={process.env.MAPBOX_ACCESS_TOKEN}
    >
      {marker && <Marker longitude={marker.lng} latitude={marker.lat} anchor="bottom" />}
    </ReactMapGL>
  </Stack>
  );
}

export default MapField;
