import React, { useState } from 'react';
import { useIntl } from 'react-intl';
import { Stack, Typography, TextInput, Grid, GridItem } from '@strapi/design-system';
import Map, {FullscreenControl, GeolocateControl, Marker, NavigationControl} from 'react-map-gl';
import GeocoderControl from './geocoder-control'
import '../../../../node_modules/mapbox-gl/dist/mapbox-gl.css'

const TOKEN = "pk.eyJ1IjoicGxheTE0IiwiYSI6ImNsZGVtZXRiaTAwcXMzcW8xeWRocWNwbWgifQ.eSlehQdOi60URb4U1ILH9g"

const MapField = ({
  intlLabel,
  name,
  onChange,
  value
}) => {
  const { formatMessage } = useIntl();
  const result = JSON.parse(value);
  const isDefaultViewState = (result == null)

  const [longitude, setLongitude] = useState(result && result.geometry.coordinates[0] || null);
  const [latitude, setLatitude] = useState(result && result.geometry.coordinates[1] || null);
  const [address, setAddress] = useState(result && result.place_name || '');

  const [viewState, setViewState] = useState({
    longitude: longitude || 15,
    latitude: latitude || 45,
    zoom: 3.5
  });


  const handleChange = (evt) => {
    const {result} = evt;
    if (! result) return;

    const value = JSON.stringify(result);

    setAddress(result.place_name);
    setLongitude(result.geometry.coordinates[0]);
    setLatitude(result.geometry.coordinates[1]);
    onChange({ target: { name, value, type: "json" } });
  }

  const reverseGeocode= (evt) => {
    evt.preventDefault();
    console.log(evt);

    //TODO reverse geocode address

    setLongitude(evt.lngLat.lng);
    setLatitude(evt.lngLat.lat);
  }

  const flyTo = (evt) => {
    if (isDefaultViewState) return;
    const map = evt.target;
    map.flyTo({center: [longitude, latitude], zoom: 15})
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
      onDblClick={reverseGeocode}
      onLoad={flyTo}
      mapStyle="mapbox://styles/mapbox/streets-v12"
      mapboxAccessToken={TOKEN}
      attributionControl={false}
      style={{ height:"500px", width:"100%" }}
    >
      <FullscreenControl />
      <NavigationControl />
      <GeolocateControl />
      <GeocoderControl mapboxAccessToken={TOKEN} position="top-left" onResult={handleChange}/>
      <Marker longitude={longitude} latitude={latitude} color="#ff5200" />
    </Map>

    <Grid gap={{
        desktop: 5,
        tablet: 2,
        mobile: 1
      }} >
      <GridItem padding={1} col={8} xs={12}>
        <TextInput label="address" name="address" value={address} disabled />
      </GridItem>
      <GridItem padding={1} col={2} xs={12}>
        <TextInput label="longitude" name="longitude" value={longitude} disabled />
      </GridItem>
      <GridItem padding={1} col={2} xs={12}>
        <TextInput label="latitude" name="latitude" value={latitude} disabled />
      </GridItem>
    </Grid>
  </Stack>
  );
}

export default MapField;
