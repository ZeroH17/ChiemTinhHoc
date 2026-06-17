import { approximateMoonLongitude, approximateSolarLongitude, getPlanetaryPositions, longitudeToSign } from "./ephemeris.js";

export async function buildWesternChart({ year, month, day, decimalHour }) {
  const planetary = await getPlanetaryPositions(year, month, day, decimalHour);
  const sunPlanet = planetary.planets.find((planet) => planet.key === "sun");
  const moonPlanet = planetary.planets.find((planet) => planet.key === "moon");
  const solarLongitude = sunPlanet ? sunPlanet.longitude : approximateSolarLongitude(year, month, day, decimalHour);
  const moonLongitude = moonPlanet ? moonPlanet.longitude : approximateMoonLongitude(year, month, day, decimalHour);
  const planets = planetary.planets;
  const sun = longitudeToSign(solarLongitude);
  const moon = longitudeToSign(moonLongitude);

  return {
    sunSign: sun.name,
    sunIndex: sun.index,
    solarLongitude,
    moonSign: moon.name,
    moonIndex: moon.index,
    moonLongitude,
    planets,
    aspects: buildAspects(planets),
    astronomySource: planetary.source,
    accuracyNote: planetary.source === "astronomia"
      ? "Bản đồ sao đã dùng astronomia cho vị trí thiên thể chính; vẫn nên dùng Swiss Ephemeris nếu cần cấp chuyên nghiệp tuyệt đối."
      : "Bản đồ sao đang dùng công thức xấp xỉ offline vì không tải được astronomia CDN."
  };
}

export function buildWesternReading(signName, interpretations, focus) {
  const reading = interpretations.sunSigns[signName];
  return {
    reading,
    focusText: reading[focus] || reading.overview
  };
}

function buildAspects(planets) {
  const aspectDefs = [
    { name: "Trùng tụ", glyph: "☌", angle: 0, orb: 8, color: "#6d77d9" },
    { name: "Lục hợp", glyph: "✶", angle: 60, orb: 5, color: "#52b788" },
    { name: "Vuông góc", glyph: "□", angle: 90, orb: 6, color: "#e63946" },
    { name: "Tam hợp", glyph: "△", angle: 120, orb: 6, color: "#52b788" },
    { name: "Đối đỉnh", glyph: "☍", angle: 180, orb: 8, color: "#e63946" }
  ];
  const aspects = [];
  for (let i = 0; i < planets.length; i += 1) {
    for (let j = i + 1; j < planets.length; j += 1) {
      const diff = Math.abs(planets[i].longitude - planets[j].longitude);
      const angle = diff > 180 ? 360 - diff : diff;
      const aspect = aspectDefs.find((item) => Math.abs(angle - item.angle) <= item.orb);
      if (aspect) {
        aspects.push({ from: planets[i], to: planets[j], ...aspect, exactness: Math.abs(angle - aspect.angle) });
      }
    }
  }
  return aspects;
}
