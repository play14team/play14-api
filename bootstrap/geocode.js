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

  if (city === "porto") return "PT";

  const geocodingService = mbxGeocoding({ accessToken: mapboxAccessToken });
  const response = await geocodingService.forwardGeocode({
    query: city,
    types: [],
    limit: 1
  }).send();

  const result = response.body.features[0];
  if (result && result.id.includes("country")) {
    return result.properties.short_code.toUpperCase();
  }
  if (result && result.context.length > 0) {
    const context = result.context.filter(c => c.id.includes("country"))[0];
    return (context && context.short_code.toUpperCase()) || null;
  }

  return null;
}


module.exports = { geocodeAddress, getCountryFromCity, getCountryCode, getAddress, getArea };
