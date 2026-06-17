export const ZODIAC = [
  "Bạch Dương", "Kim Ngưu", "Song Tử", "Cự Giải",
  "Sư Tử", "Xử Nữ", "Thiên Bình", "Bọ Cạp",
  "Nhân Mã", "Ma Kết", "Bảo Bình", "Song Ngư"
];

export const ZODIAC_GLYPHS = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"];

const PLANET_MODELS = [
  { key: "sun", name: "Mặt Trời", glyph: "☉", color: "#d9a521", longitudeAtEpoch: 280.47, dailyMotion: 0.98564736 },
  { key: "moon", name: "Mặt Trăng", glyph: "☽", color: "#6d77d9", longitudeAtEpoch: 218.32, dailyMotion: 13.176396 },
  { key: "mercury", name: "Sao Thủy", glyph: "☿", color: "#52b788", longitudeAtEpoch: 252.25, dailyMotion: 4.092334 },
  { key: "venus", name: "Sao Kim", glyph: "♀", color: "#74c69d", longitudeAtEpoch: 181.98, dailyMotion: 1.602130 },
  { key: "mars", name: "Sao Hỏa", glyph: "♂", color: "#e63946", longitudeAtEpoch: 355.43, dailyMotion: 0.524039 },
  { key: "jupiter", name: "Sao Mộc", glyph: "♃", color: "#4361ee", longitudeAtEpoch: 34.35, dailyMotion: 0.083086 },
  { key: "saturn", name: "Sao Thổ", glyph: "♄", color: "#9d4edd", longitudeAtEpoch: 50.08, dailyMotion: 0.033459 },
  { key: "uranus", name: "Thiên Vương", glyph: "♅", color: "#00b4d8", longitudeAtEpoch: 314.06, dailyMotion: 0.011728 },
  { key: "neptune", name: "Hải Vương", glyph: "♆", color: "#0077b6", longitudeAtEpoch: 304.35, dailyMotion: 0.005981 },
  { key: "pluto", name: "Diêm Vương", glyph: "♇", color: "#8d99ae", longitudeAtEpoch: 251.80, dailyMotion: 0.003964 }
];

const ASTRONOMIA_ESM_URL = "https://esm.sh/astronomia@4";
let astronomiaPromise = null;

export function julianDay(year, month, day, hour = 12) {
  let y = year;
  let m = month;
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  const a = Math.floor(y / 100);
  const b = 2 - a + Math.floor(a / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + hour / 24 + b - 1524.5;
}

export function approximateSolarLongitude(year, month, day, hour) {
  const jd = julianDay(year, month, day, hour);
  const n = jd - 2451545.0;
  const meanLongitude = normalizeDegree(280.46646 + 0.98564736 * n);
  const meanAnomaly = normalizeDegree(357.52911 + 0.98560028 * n);
  const anomalyRad = toRad(meanAnomaly);
  return normalizeDegree(
    meanLongitude +
    (1.914602 - 0.004817 * (n / 36525)) * Math.sin(anomalyRad) +
    0.019993 * Math.sin(2 * anomalyRad) +
    0.000289 * Math.sin(3 * anomalyRad)
  );
}

export function approximateMoonLongitude(year, month, day, hour) {
  const jd = julianDay(year, month, day, hour);
  const d = jd - 2451545.0;
  const meanLongitude = normalizeDegree(218.316 + 13.176396 * d);
  const moonAnomaly = normalizeDegree(134.963 + 13.064993 * d);
  const sunAnomaly = normalizeDegree(357.529 + 0.98560028 * d);
  const elongation = normalizeDegree(297.850 + 12.190749 * d);
  const latitudeArg = normalizeDegree(93.272 + 13.229350 * d);

  return normalizeDegree(
    meanLongitude +
    6.289 * Math.sin(toRad(moonAnomaly)) +
    1.274 * Math.sin(toRad(2 * elongation - moonAnomaly)) +
    0.658 * Math.sin(toRad(2 * elongation)) +
    0.214 * Math.sin(toRad(2 * moonAnomaly)) -
    0.186 * Math.sin(toRad(sunAnomaly)) -
    0.114 * Math.sin(toRad(2 * latitudeArg))
  );
}

export function approximatePlanetaryPositions(year, month, day, hour) {
  const jd = julianDay(year, month, day, hour);
  const days = jd - 2451545.0;
  const sunLongitude = approximateSolarLongitude(year, month, day, hour);
  const moonLongitude = approximateMoonLongitude(year, month, day, hour);

  return PLANET_MODELS.map((planet) => {
    let longitude;
    if (planet.key === "sun") {
      longitude = sunLongitude;
    } else if (planet.key === "moon") {
      longitude = moonLongitude;
    } else {
      const anomaly = normalizeDegree(planet.longitudeAtEpoch + planet.dailyMotion * days);
      const earthViewCorrection = 7.5 * Math.sin(toRad(anomaly - sunLongitude));
      longitude = normalizeDegree(anomaly + earthViewCorrection);
    }
    const sign = longitudeToSign(longitude);
    return {
      ...planet,
      longitude,
      sign: sign.name,
      signIndex: sign.index,
      degree: normalizeDegree(longitude % 30)
    };
  });
}

export async function getPlanetaryPositions(year, month, day, hour) {
  const fallback = approximatePlanetaryPositions(year, month, day, hour);
  const astronomy = await loadAstronomia();
  if (!astronomy) return { planets: fallback, source: "fallback" };

  try {
    const jde = julianDay(year, month, day, hour);
    const byKey = Object.fromEntries(fallback.map((planet) => [planet.key, planet]));
    const enhanced = fallback.map((planet) => {
      const longitude = getAstronomiaLongitude(astronomy, planet.key, jde);
      if (longitude == null || Number.isNaN(longitude)) return planet;
      const sign = longitudeToSign(longitude);
      return {
        ...planet,
        longitude,
        sign: sign.name,
        signIndex: sign.index,
        degree: normalizeDegree(longitude % 30),
        source: "astronomia"
      };
    });

    return {
      planets: enhanced.map((planet) => byKey[planet.key] ? planet : byKey[planet.key]),
      source: "astronomia"
    };
  } catch (error) {
    console.warn("[Astronomia] Không thể tính vị trí hành tinh, dùng fallback.", error);
    return { planets: fallback, source: "fallback" };
  }
}

async function loadAstronomia() {
  if (!astronomiaPromise) {
    astronomiaPromise = import(ASTRONOMIA_ESM_URL)
      .then((module) => module)
      .catch((error) => {
        console.warn("[Astronomia] Không tải được CDN, dùng công thức fallback.", error);
        return null;
      });
  }
  return astronomiaPromise;
}

function getAstronomiaLongitude(astronomy, key, jde) {
  if (key === "sun" && astronomy.solar && astronomy.base) {
    return radToDeg(astronomy.solar.apparentLongitude(astronomy.base.J2000Century(jde)));
  }
  if (key === "moon" && astronomy.moonposition) {
    return radToDeg(astronomy.moonposition.position(jde).lon);
  }
  return getAstronomiaPlanetLongitude(astronomy, key, jde);
}

function getAstronomiaPlanetLongitude(astronomy, key, jde) {
  const dataKey = {
    mercury: "vsop87Bmercury",
    venus: "vsop87Bvenus",
    mars: "vsop87Bmars",
    jupiter: "vsop87Bjupiter",
    saturn: "vsop87Bsaturn",
    uranus: "vsop87Buranus",
    neptune: "vsop87Bneptune"
  }[key];

  if (!dataKey || !astronomy.data || !astronomy.planetposition || !astronomy.data.vsop87Bearth || !astronomy.data[dataKey]) {
    return null;
  }

  const earth = new astronomy.planetposition.Planet(astronomy.data.vsop87Bearth);
  const planet = new astronomy.planetposition.Planet(astronomy.data[dataKey]);
  const earthPos = earth.position(jde);
  const planetPos = planet.position(jde);
  const [sinEarthLat, cosEarthLat] = [Math.sin(earthPos.lat), Math.cos(earthPos.lat)];
  const [sinEarthLon, cosEarthLon] = [Math.sin(earthPos.lon), Math.cos(earthPos.lon)];
  const [sinPlanetLat, cosPlanetLat] = [Math.sin(planetPos.lat), Math.cos(planetPos.lat)];
  const [sinPlanetLon, cosPlanetLon] = [Math.sin(planetPos.lon), Math.cos(planetPos.lon)];
  const x = planetPos.range * cosPlanetLat * cosPlanetLon - earthPos.range * cosEarthLat * cosEarthLon;
  const y = planetPos.range * cosPlanetLat * sinPlanetLon - earthPos.range * cosEarthLat * sinEarthLon;
  const z = planetPos.range * sinPlanetLat - earthPos.range * sinEarthLat;
  const longitude = Math.atan2(y, x);
  const latitude = Math.atan2(z, Math.hypot(x, y));
  const fk5 = astronomy.planetposition.toFK5(longitude, latitude, jde);
  return radToDeg(fk5.lon);
}

export function longitudeToSign(longitude) {
  const index = Math.floor(normalizeDegree(longitude) / 30) % 12;
  return { index, name: ZODIAC[index] };
}

export function normalizeDegree(value) {
  return ((value % 360) + 360) % 360;
}

export function toRad(degree) {
  return degree * Math.PI / 180;
}

export function radToDeg(radian) {
  return normalizeDegree(radian * 180 / Math.PI);
}
