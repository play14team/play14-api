import React, { useState } from 'react';
import { useIntl } from 'react-intl';
import { Stack, Typography, Box, TextInput } from '@strapi/design-system';
import Map, {FullscreenControl, GeolocateControl, NavigationControl} from 'react-map-gl';
import GeocoderControl from './geocoder-control'
import '../../../../node_modules/mapbox-gl/dist/mapbox-gl.css'

const TOKEN = "pk.eyJ1IjoicGxheTE0IiwiYSI6ImNsZGVtZXRiaTAwcXMzcW8xeWRocWNwbWgifQ.eSlehQdOi60URb4U1ILH9g"

const MapField = ({
  intlLabel,
  name,
  onChange,
  value
}) => {
  const result = JSON.parse(value);
  const longitude = result.geometry.coordinates[0] || 15;
  const latitude = result.geometry.coordinates[1] || 45;
  const { formatMessage } = useIntl();
  const [viewState, setViewState] = React.useState({
    longitude: longitude,
    latitude: latitude,
    zoom: 3.5
  });
  const [address, setAddress] = useState('');


  const handleChange = (evt) => {
    const {result} = evt;
    console.log(result);
    const value = JSON.stringify(result);

    setAddress(result.place_name);
    onChange({ target: { name, value, type: "json" } });
  }

  return (
  <Stack spacing={4}>
    <Typography
      textColor="neutral800"
      as="label"
      variant="pi"
      fontWeight="bold"
    >
      {formatMessage(intlLabel)}
    </Typography>

    <Map
      {...viewState}
      onMove={evt => setViewState(evt.viewState)}
      onClick={handleChange}
      mapStyle="mapbox://styles/mapbox/streets-v12"
      mapboxAccessToken={TOKEN}
      attributionControl={false}
      style={{ height:"500px", width:"100%" }}
    >
      <FullscreenControl />
      <NavigationControl />
      <GeolocateControl />
      <GeocoderControl mapboxAccessToken={TOKEN} position="top-left" onResult={handleChange} marker={{longitude: longitude, latitude: latitude}} />
    </Map>
    <Box padding={10}>
          <TextInput label="Address" name="address" hint="Address selected on the map" value={address} disabled />
        </Box>;
  </Stack>
  );
}

export default MapField;
