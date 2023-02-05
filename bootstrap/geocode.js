const axios = require("axios");

const mapboxAccessToken = process.env.MAPBOX_ACCESS_TOKEN;

async function geocodeAddress(address) {
  if (!address || address == "" || address == "TBD" || address.toLowerCase().includes("online"))
    return { countryCode: "", coordinates: {}};

  const encodedAddress = encodeURIComponent(address);
  const response = await axios.get(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?limit=1&proximity=ip&types=address%2Cplace&access_token=${mapboxAccessToken}`
  );
  const data = response.data;
  if (data.features.length > 0) {
    const [longitude, latitude] = data.features[0].geometry.coordinates;
    const countryCode = data.features[0].context[data.features[0].context.length-1].short_code;
    return { countryCode: countryCode.toUpperCase(), coordinates: { longitude, latitude }};
  }

  return { countryCode: "", coordinates: {}};
}

async function getCountryFromCity(city) {
  if (city == "bigone" || city == "online")
    return "";

  if (city == "porto")
    return "PT";

  const response = await axios.get(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${city},.json?limit=5&access_token=${mapboxAccessToken}`
  );
  const data = response.data;
  if (data && data.features.length > 0 && data.features[0].context) {
    const countryCode = data.features[0].context[data.features[0].context.length-1].short_code;
    return countryCode ? countryCode.toUpperCase() : "";
  }

  const response2 = await axios.get(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${city}%20city.json?limit=5&access_token=${mapboxAccessToken}`
  );
  const data2 = response2.data;
  if (data2 && data2.features.length > 0 && data2.features[0].context) {
    const countryCode = data2.features[0].context[data2.features[0].context.length-1].short_code;
    return countryCode ? countryCode.toUpperCase() : "";
  }

  return "";
}


async function getCountryFromCoordinates(coordinates) {
  const response = await axios.get(
    `http://api.tiles.mapbox.com/v4/geocode/mapbox.places-country-v1/${coordinates.longitude},${coordinates.latitude}.json?access_token=${mapboxAccessToken}`
  );
  const data = response.data;
  const countryCode = data.features[0].properties.short_code;
  return countryCode;
}

module.exports = { geocodeAddress, getCountryFromCity, getCountryFromCoordinates };
