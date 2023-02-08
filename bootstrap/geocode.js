const axios = require("axios");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');

const mapboxAccessToken = process.env.MAPBOX_ACCESS_TOKEN;
const rejectedAccuracy = ["street", "approximate", "intersection"];

async function geocodeAddress(address) {
  if (!address || address == "" || address == "TBD" || address.toLowerCase().includes("online"))
    return null;

    const geocodingService = mbxGeocoding({ accessToken: mapboxAccessToken });

    const response = await geocodingService.forwardGeocode({
      query: address,
      types: ["address"],
      limit: 1
    }).send();

    const result = response.body.features[0];
    if (result && !rejectedAccuracy.includes(result.properties.accuracy))
      return result;

    return null;
}

function getCountryCode(json) {
  return json && json.context.filter(item => item.id.includes("country"))[0].short_code.toUpperCase() || null;
}

function getAddress(json) {
  return json && json.place_name || null;
}

function getArea(json) {
  const locality = json && json.context.filter(item => item.id.includes("locality"))[0];
  return locality && locality.text || null;
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


module.exports = { geocodeAddress, getCountryFromCity, getCountryCode, getAddress, getArea };
