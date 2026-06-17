import { ZODIAC, ZODIAC_GLYPHS, toRad } from "./ephemeris.js";
import { getDecimalHour } from "./gio-hoang-dao.js";
import { buildTuViChart } from "./tuvi.js";
import { buildWesternChart, buildWesternReading } from "./western.js";
import { onResultRendered } from "./privacy.js";

let interpretations = null;
let stars = null;

document.addEventListener("DOMContentLoaded", async () => {
  [interpretations, stars] = await Promise.all([
    fetch("data/interpretations.json").then((res) => res.json()),
    fetch("data/stars.json").then((res) => res.json())
  ]);
  initLandingMoon();
  document.getElementById("birth-form").addEventListener("submit", handleSubmit);
});

function initLandingMoon() {
  const moon = document.getElementById("landing-moon");
  if (!moon) return;

  const phases = ["phase-full", "phase-waning", "phase-half", "phase-crescent", "phase-new"];
  let phaseIndex = 0;

  setInterval(() => {
    moon.classList.remove(phases[phaseIndex]);
    phaseIndex = (phaseIndex + 1) % phases.length;
    moon.classList.add(phases[phaseIndex]);
  }, 5000);
}

async function handleSubmit(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const userData = {
    fullName: String(form.get("fullName") || "").trim(),
    birthDate: String(form.get("birthDate") || ""),
    birthHour: String(form.get("birthHour") || ""),
    birthPlace: String(form.get("birthPlace") || "").trim(),
    gender: String(form.get("gender") || "neutral"),
    chartType: String(form.get("chartType") || "western"),
    focus: String(form.get("focus") || "overview")
  };

  if (!userData.fullName || !userData.birthDate) return;
  const result = await buildReading(userData);
  renderReading(result);
  onResultRendered(userData);
}

async function buildReading(data) {
  const [year, month, day] = data.birthDate.split("-").map(Number);
  const decimalHour = getDecimalHour(data.birthHour);
  const western = await buildWesternChart({ year, month, day, decimalHour });
  const tuvi = buildTuViChart({ year, month, day, birthHour: data.birthHour });
  const westernReading = buildWesternReading(western.sunSign, interpretations, data.focus);
  const tuviFocusText = interpretations.tuviFocus[data.focus] || interpretations.tuviFocus.overview;

  return {
    name: data.fullName,
    dateLabel: formatDate(year, month, day),
    place: data.birthPlace || "Không nêu",
    focus: data.focus,
    chartType: data.chartType,
    hourKey: data.birthHour,
    hourLabel: tuvi.hourInfo ? `Giờ ${tuvi.hourInfo.label}` : "Không rõ giờ sinh",
    lunarLabel: formatLunarDate(tuvi.lunarDate),
    sunSign: western.sunSign,
    sunIndex: western.sunIndex,
    solarLongitude: western.solarLongitude,
    moonSign: western.moonSign,
    moonIndex: western.moonIndex,
    moonLongitude: western.moonLongitude,
    planets: western.planets,
    aspects: western.aspects,
    astronomySource: western.astronomySource,
    yearPillar: tuvi.yearPillar,
    monthPillar: tuvi.monthPillar,
    dayPillar: tuvi.dayPillar,
    hourPillar: tuvi.hourPillar,
    elementBalance: tuvi.elementBalance,
    dominantElement: tuvi.dominantElement,
    weakestElement: tuvi.weakestElement,
    elementSummary: tuvi.elementSummary,
    destinyPalace: tuvi.destinyPalace,
    palaces: tuvi.palaces,
    palaceEvaluations: tuvi.palaceEvaluations,
    destinyEvaluation: tuvi.destinyEvaluation,
    reading: westernReading.reading,
    focusText: westernReading.focusText,
    tuviFocusText,
    hourReading: tuvi.hourInfo ? interpretations.hours[data.birthHour] : "Không có giờ sinh nên lá số bỏ qua trụ giờ và cung mệnh được xem ở mức tham khảo.",
    fixedStars: stars.fixedStars,
    accuracyNotes: [western.accuracyNote, tuvi.accuracyNote],
    generatedAt: new Date().toLocaleString("vi-VN")
  };
}

function renderReading(result) {
  if (result.chartType === "tuvi") {
    renderTuViReading(result);
    return;
  }
  renderWesternReading(result);
}

function buildWesternPersonality(result) {
  const mercury = result.planets.find((planet) => planet.key === "mercury");
  const venus = result.planets.find((planet) => planet.key === "venus");
  const mars = result.planets.find((planet) => planet.key === "mars");
  return [
    `Người này có Mặt Trời ở ${result.sunSign}, nên lớp tính cách chính mang màu ${result.reading.traits.join(", ")}.`,
    `Mặt Trăng ở ${result.moonSign} cho thấy nhu cầu cảm xúc và phản ứng bản năng không nhất thiết giống vẻ ngoài.`,
    mercury ? `Sao Thủy ở ${mercury.sign} khiến cách suy nghĩ và giao tiếp đi theo nhịp của cung này.` : "",
    venus ? `Sao Kim ở ${venus.sign} cho thấy gu yêu, gu thẩm mỹ và cách tạo thiện cảm.` : "",
    mars ? `Sao Hỏa ở ${mars.sign} mô tả cách hành động, động lực và phản ứng khi bị thử thách.` : ""
  ].filter(Boolean).join(" ");
}

function summarizeWesternProfile(planets) {
  const elementBySign = ["Lửa", "Đất", "Khí", "Nước", "Lửa", "Đất", "Khí", "Nước", "Lửa", "Đất", "Khí", "Nước"];
  const modeBySign = ["Tiên phong", "Ổn định", "Linh hoạt", "Tiên phong", "Ổn định", "Linh hoạt", "Tiên phong", "Ổn định", "Linh hoạt", "Tiên phong", "Ổn định", "Linh hoạt"];
  const elementCount = { Lửa: 0, Đất: 0, Khí: 0, Nước: 0 };
  const modeCount = { "Tiên phong": 0, "Ổn định": 0, "Linh hoạt": 0 };
  planets.slice(0, 7).forEach((planet) => {
    elementCount[elementBySign[planet.signIndex]] += 1;
    modeCount[modeBySign[planet.signIndex]] += 1;
  });
  const topElement = Object.entries(elementCount).sort((a, b) => b[1] - a[1])[0];
  const topMode = Object.entries(modeCount).sort((a, b) => b[1] - a[1])[0];
  return `Nhóm hành tinh cá nhân nghiêng về nguyên tố ${topElement[0]} (${topElement[1]} điểm) và tính chất ${topMode[0]} (${topMode[1]} điểm). Điều này cho thấy nhịp tính cách tổng quát: ${westernTone(topElement[0], topMode[0])}`;
}

function westernTone(element, mode) {
  const elementText = {
    "Lửa": "nhanh, chủ động, cần cảm hứng và dễ bùng năng lượng",
    "Đất": "thực tế, bền bỉ, cần kết quả rõ và cảm giác ổn định",
    "Khí": "thiên về tư duy, giao tiếp, quan sát và kết nối ý tưởng",
    "Nước": "nhạy cảm, trực giác, giàu cảm xúc và dễ hấp thụ môi trường"
  }[element];
  const modeText = {
    "Tiên phong": "thường muốn bắt đầu trước và tự mở đường.",
    "Ổn định": "thường giữ lập trường, làm chậm mà chắc.",
    "Linh hoạt": "thường thích ứng nhanh và đổi hướng khi cần."
  }[mode];
  return `${elementText}, ${modeText}`;
}

function focusTitle(focus) {
  return {
    overview: "Tổng quan vận mệnh",
    career: "Sự nghiệp và tài lộc",
    love: "Tình cảm và kết nối",
    inner: "Phát triển bản thân"
  }[focus] || "Tổng quan vận mệnh";
}

function bindTuViPalaceDetails(result) {
  const detail = document.getElementById("palace-detail");
  const canvas = document.getElementById("star-chart");
  const buttons = Array.from(document.querySelectorAll(".tuvi-palace[data-palace]"));
  const render = (palaceName, shouldScroll = false) => {
    const palace = result.palaces.find((item) => item.name === palaceName);
    if (!palace || !detail) return;
    buttons.forEach((button) => button.classList.toggle("selected-palace", button.dataset.palace === palaceName));
    detail.innerHTML = buildPalaceDetailHtml(palace);
    if (shouldScroll) {
      detail.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };
  buttons.forEach((button) => {
    button.addEventListener("click", () => render(button.dataset.palace, true));
  });
  if (canvas) {
    canvas.addEventListener("click", (event) => {
      const palace = getCanvasTuViPalace(canvas, event, result);
      if (palace) render(palace.name, true);
    });
  }
  render("Mệnh");
}

function getCanvasTuViPalace(canvas, event, result) {
  const rect = canvas.getBoundingClientRect();
  const x = (event.clientX - rect.left) * (canvas.width / rect.width);
  const y = (event.clientY - rect.top) * (canvas.height / rect.height);
  const margin = 42;
  const topOffset = 118;
  const cellW = (canvas.width - margin * 2) / 4;
  const cellH = (canvas.height - margin - topOffset) / 3;
  const positions = [
    [0, 0], [1, 0], [2, 0], [3, 0],
    [3, 1], [3, 2], [2, 2], [1, 2],
    [0, 2], [0, 1], [1, 1], [2, 1]
  ];
  const index = positions.findIndex(([col, row]) => (
    x >= margin + col * cellW &&
    x <= margin + (col + 1) * cellW &&
    y >= topOffset + row * cellH &&
    y <= topOffset + (row + 1) * cellH
  ));
  return index >= 0 ? result.palaces[index] : null;
}

function buildPalaceDetailHtml(palace) {
  const base = interpretations.tuviPalaces[palace.name] || "Cung này cần đọc cùng chính tinh, phụ tinh và sát tinh để có kết luận rõ hơn.";
  const levelAdvice = interpretations.tuviAdviceLevels[palace.evaluation.level] || "";
  const palaceAdvice = interpretations.tuviPalaceAdvice[palace.name] || "";
  const starNames = [...palace.mainStars, ...palace.supportStars, ...palace.challengeStars];
  const starMeanings = starNames
    .map((star) => interpretations.tuviStars[star] ? `<li><b>${star}</b>: ${interpretations.tuviStars[star]}</li>` : "")
    .filter(Boolean)
    .join("");
  return `
    <h3>Luận giải cung ${palace.name}: ${palace.evaluation.level} (${palace.evaluation.score}/100)</h3>
    <p>${base}</p>
    <p>${palace.evaluation.summary}</p>
    <ul>${palace.evaluation.details.map((item) => `<li>${item}</li>`).join("")}</ul>
    <h3>Lời khuyên cho cung ${palace.name}</h3>
    <p>${levelAdvice}</p>
    <p>${palaceAdvice}</p>
    ${starMeanings ? `<h3>Ý nghĩa sao trong cung ${palace.name}</h3><ul>${starMeanings}</ul>` : ""}
  `;
}

function renderWesternReading(result) {
  const starRows = result.fixedStars
    .map((star) => `<li>${star.vietnamese} (${star.name}): ${star.theme}</li>`)
    .join("");
  const zodiacCards = ZODIAC.map((sign, index) => `
    <div class="zodiac-card ${index === result.sunIndex ? "sun-card" : ""} ${index === result.moonIndex ? "moon-card" : ""}">
      <b>${ZODIAC_GLYPHS[index]} ${sign}</b>
      <span>${index * 30}° - ${index * 30 + 30}°</span>
    </div>
  `).join("");
  const personalityRows = result.planets.slice(0, 7).map((planet) => {
    const meaning = interpretations.westernPlanets[planet.key] || "Điểm này bổ sung thêm sắc thái tính cách.";
    const signTrait = interpretations.westernSignTraits[planet.sign] || "";
    return `<li><b>${planet.glyph} ${planet.name} ở ${planet.sign}</b>: ${meaning} ${signTrait}</li>`;
  }).join("");
  const dominantSigns = summarizeWesternProfile(result.planets);

  document.getElementById("result").innerHTML = `
    <article class="report">
      <header class="report-head">
        <div>
          <h2>Lá số của ${escapeHtml(result.name)}</h2>
          <p class="meta">${result.dateLabel} · ${result.hourLabel} · ${escapeHtml(result.place)}</p>
          <div class="pill-row">
            <span class="pill">Bản đồ sao</span>
            <span class="pill">Mặt Trời: ${result.sunSign}</span>
            <span class="pill">Mặt Trăng: ${result.moonSign}</span>
          </div>
        </div>
        <div class="actions">
          <button id="download-chart" type="button">Tải ảnh bản đồ sao</button>
        </div>
      </header>

      <section class="chart-wrap">
        <canvas id="star-chart" width="1100" height="1400" aria-label="Bản đồ sao chiêm tinh"></canvas>
        <div class="zodiac-grid">${zodiacCards}</div>
        <div class="key-grid">
          <div class="key-card"><b>Cung Mặt Trời</b>${result.sunSign} · ${result.reading.element} · chủ tinh ${result.reading.ruler}</div>
          <div class="key-card"><b>Cung Mặt Trăng</b>${result.moonSign} · khí chất cảm xúc và phản ứng bản năng</div>
          <div class="key-card"><b>Nguồn thiên văn</b>${result.astronomySource === "astronomia" ? "Astronomia CDN" : "Công thức fallback offline"}</div>
          <div class="key-card"><b>Từ khóa</b>${result.reading.traits.join(", ")}</div>
        </div>
      </section>

      <section class="reading-grid">
        <div class="reading-card full">
          <h3>Hồ sơ tính cách</h3>
          <p>${buildWesternPersonality(result)}</p>
        </div>
        <div class="reading-card">
          <h3>Trục chính</h3>
          <p>Mặt Trời ở ${result.sunSign} cho biết bản sắc cốt lõi; Mặt Trăng ở ${result.moonSign} cho biết nhu cầu cảm xúc. Khi hai cung này khác nhau, người này thường có một mặt thể hiện ra ngoài và một mặt rất riêng chỉ lộ khi thấy an toàn.</p>
        </div>
        <div class="reading-card">
          <h3>Khí chất nổi bật</h3>
          <p>${dominantSigns}</p>
        </div>
        <div class="reading-card full">
          <h3>Luận giải chi tiết từng sao</h3>
          <ul>${personalityRows}</ul>
        </div>
        <div class="reading-card full">
          <h3>Sao cố định tham khảo</h3>
          <ul>${starRows}</ul>
        </div>
      </section>
    </article>
  `;

  drawChart(result);
  document.getElementById("download-chart").addEventListener("click", () => downloadChart(result.name));
}

function renderTuViReading(result) {
  const elementRows = Object.entries(result.elementBalance)
    .map(([name, value]) => `<li>${name}: ${value}/8</li>`)
    .join("");
  const hourPillar = result.hourPillar ? result.hourPillar.label : "Thiếu giờ sinh";
  const palaceCards = result.palaces.map((palace) => `
    <button class="tuvi-palace ${palace.name === "Mệnh" ? "active-palace" : ""}" type="button" data-palace="${palace.name}">
      <div class="palace-top">
        <b>${palace.name}</b>
        <span>${palace.branch} · ${palace.element}</span>
      </div>
      <span class="destiny-badge ${evaluationClass(palace.evaluation.level)}">${palace.evaluation.level} · ${palace.evaluation.score}/100</span>
      <p class="main-stars">${palace.mainStars.join(", ") || "Không có chính tinh"}</p>
      <p>${palace.supportStars.join(", ") || "Phụ tinh nhẹ"}</p>
      <p class="challenge-stars">${palace.challengeStars.join(", ") || "Ít sát tinh"}</p>
    </button>
  `).join("");

  document.getElementById("result").innerHTML = `
    <article class="report">
      <header class="report-head">
        <div>
          <h2>Lá số Tử vi của ${escapeHtml(result.name)}</h2>
          <p class="meta">${result.dateLabel} · ${result.lunarLabel} · ${result.hourLabel} · ${escapeHtml(result.place)}</p>
          <div class="pill-row">
            <span class="pill">Tử vi</span>
            <span class="pill">Mệnh: ${result.destinyPalace}</span>
            <span class="pill ${evaluationClass(result.destinyEvaluation.level)}">Cung Mệnh: ${result.destinyEvaluation.level} · ${result.destinyEvaluation.score}/100</span>
            <span class="pill">Tứ Trụ: ${result.yearPillar.label} | ${result.monthPillar.label} | ${result.dayPillar.label} | ${hourPillar}</span>
          </div>
        </div>
        <div class="actions">
          <button id="download-chart" type="button">Tải ảnh lá số</button>
        </div>
      </header>

      <section class="chart-wrap">
        <canvas id="star-chart" width="1200" height="900" aria-label="Lá số tử vi 12 cung"></canvas>
        <div class="tuvi-grid">${palaceCards}</div>
      </section>

      <section class="reading-grid">
        <div class="reading-card full">
          <h3>${focusTitle(result.focus)}</h3>
          <p>${result.tuviFocusText}</p>
        </div>
        <div id="palace-detail" class="reading-card full palace-detail"></div>
        <div class="reading-card full">
          <h3>Đánh giá Cung Mệnh: ${result.destinyEvaluation.level} (${result.destinyEvaluation.score}/100)</h3>
          <p>${result.destinyEvaluation.summary}</p>
          <ul>${result.destinyEvaluation.details.map((item) => `<li>${item}</li>`).join("")}</ul>
        </div>
        <div class="reading-card full">
          <h3>Điểm 12 cung</h3>
          <div class="palace-score-grid">
            ${result.palaceEvaluations.map((evaluation) => `
              <span class="${evaluationClass(evaluation.level)}">${evaluation.palace.name}: ${evaluation.level} · ${evaluation.score}/100</span>
            `).join("")}
          </div>
        </div>
        <div class="reading-card">
          <h3>Ngũ hành</h3>
          <p>${result.elementSummary}</p>
          <ul>${elementRows}</ul>
        </div>
        <div class="reading-card">
          <h3>Cách cân bằng</h3>
          <p>${interpretations.elementRemedies[result.weakestElement]}</p>
        </div>
        <div class="reading-card">
          <h3>Giờ sinh</h3>
          <p>${result.hourReading}</p>
        </div>
        <div class="reading-card">
          <h3>Ghi chú sao</h3>
          <p>Các sao đang được an theo ngày âm, tháng âm, năm âm và giờ sinh. Để đạt cấp chuyên nghiệp cần bổ sung đủ vòng Tràng Sinh, Lộc Tồn, Bác Sĩ, Thái Tuế, sao theo can năm và hệ an sao truyền thống chi tiết.</p>
        </div>
      </section>
    </article>
  `;

  drawTuViChart(result);
  document.getElementById("download-chart").addEventListener("click", () => downloadChart(result.name));
  bindTuViPalaceDetails(result);
}

function drawChart(result) {
  const canvas = document.getElementById("star-chart");
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  const centerX = width / 2;
  const centerY = 470;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#f7f3ea";
  ctx.fillRect(0, 0, width, height);

  drawAstroWheel(ctx, result, centerX, centerY);
  drawPlanetList(ctx, result, 60, 990);
  drawAspectGrid(ctx, result, 420, 980);
  drawElementModeGrid(ctx, result, 790, 1010);

  ctx.save();
  ctx.translate(1015, 75);
  ctx.rotate(Math.PI / 2);
  ctx.fillStyle = "#3c3a35";
  ctx.font = "bold 20px 'Noto Serif', Georgia";
  ctx.fillText(`Bản đồ sao của ${result.name}`, 0, 0);
  ctx.font = "16px 'Noto Serif', Georgia";
  ctx.fillText(`${result.dateLabel} · ${result.hourLabel} · ${result.place}`, 0, 28);
  ctx.restore();
}

function drawAstroWheel(ctx, result, cx, cy) {
  const outer = 390;
  const signRing = 346;
  const degreeRing = 323;
  const houseRing = 255;
  const aspectRing = 210;

  ctx.fillStyle = "#dbe6f8";
  ctx.beginPath();
  ctx.arc(cx, cy, outer, 0, Math.PI * 2);
  ctx.fill();
  drawCircle(ctx, cx, cy, outer, "#7f8896", 2);
  drawCircle(ctx, cx, cy, signRing, "#9aa8c0", 2);
  drawCircle(ctx, cx, cy, degreeRing, "#b24c4c", 1);
  drawCircle(ctx, cx, cy, houseRing, "#7f8896", 2);
  drawCircle(ctx, cx, cy, aspectRing, "#8fa0b8", 1);

  for (let degree = 0; degree < 360; degree += 1) {
    const angle = wheelAngle(degree);
    const tick = degree % 30 === 0 ? 18 : degree % 10 === 0 ? 12 : degree % 5 === 0 ? 8 : 4;
    const start = degreeRing;
    const end = degreeRing + tick;
    ctx.strokeStyle = degree % 30 === 0 ? "#374151" : "#b45f5f";
    ctx.lineWidth = degree % 30 === 0 ? 2 : 1;
    drawRadialLine(ctx, cx, cy, angle, start, end);
  }

  for (let i = 0; i < 12; i += 1) {
    const startDegree = i * 30;
    const angle = wheelAngle(startDegree);
    drawRadialLine(ctx, cx, cy, angle, houseRing, outer);
    const labelAngle = wheelAngle(startDegree + 15);
    const glyph = polarPoint(cx, cy, labelAngle, 366);
    const label = polarPoint(cx, cy, labelAngle, 286);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#3b7a57";
    ctx.font = "bold 30px Georgia";
    ctx.fillText(ZODIAC_GLYPHS[i], glyph.x, glyph.y);
    ctx.fillStyle = "#7b8794";
    ctx.font = "17px 'Noto Serif', Georgia";
    ctx.fillText(String(i + 1), label.x, label.y);
  }

  drawAspects(ctx, result.aspects, cx, cy, aspectRing);
  drawPlanetsOnWheel(ctx, result.planets, cx, cy, 306);

  ctx.fillStyle = "#6b7280";
  ctx.globalAlpha = 0.18;
  ctx.font = "bold 64px 'Noto Serif', Georgia";
  ctx.textAlign = "center";
  ctx.fillText("Thiên Mệnh", cx, cy - 18);
  ctx.font = "bold 42px 'Noto Serif', Georgia";
  ctx.fillText("Tinh Đồ", cx, cy + 34);
  ctx.globalAlpha = 1;

  ctx.fillStyle = "#475569";
  ctx.font = "18px 'Noto Serif', Georgia";
  ctx.fillText(`${result.name} · ${result.dateLabel}`, cx, cy + 82);
}

function drawPlanetsOnWheel(ctx, planets, cx, cy, radius) {
  planets.forEach((planet, index) => {
    const angle = wheelAngle(planet.longitude);
    const offset = (index % 3) * 18;
    const point = polarPoint(cx, cy, angle, radius + offset);
    const lineStart = polarPoint(cx, cy, angle, 262);
    ctx.strokeStyle = planet.color;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(lineStart.x, lineStart.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();

    ctx.fillStyle = planet.color;
    ctx.font = "bold 27px Georgia";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(planet.glyph, point.x, point.y);
    ctx.fillStyle = "#1f2937";
    ctx.font = "12px 'Noto Sans', Arial";
    ctx.fillText(`${Math.floor(planet.degree)}°`, point.x + 24, point.y + 14);
  });
}

function drawAspects(ctx, aspects, cx, cy, radius) {
  aspects.forEach((aspect) => {
    const from = polarPoint(cx, cy, wheelAngle(aspect.from.longitude), radius);
    const to = polarPoint(cx, cy, wheelAngle(aspect.to.longitude), radius);
    ctx.strokeStyle = aspect.color;
    ctx.globalAlpha = aspect.name === "Vuông góc" || aspect.name === "Đối đỉnh" ? 0.58 : 0.42;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    ctx.globalAlpha = 1;
  });
}

function drawPlanetList(ctx, result, x, y) {
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#1f2937";
  ctx.font = "bold 22px 'Noto Serif', Georgia";
  ctx.fillText("Vị trí hành tinh", x, y);
  ctx.font = "17px 'Noto Serif', Georgia";
  result.planets.forEach((planet, index) => {
    const rowY = y + 34 + index * 28;
    ctx.fillStyle = planet.color;
    ctx.fillText(`${planet.glyph} ${planet.name}`, x, rowY);
    ctx.fillStyle = "#334155";
    ctx.fillText(`${Math.floor(planet.degree)}° ${Math.round((planet.degree % 1) * 60)}' ${planet.sign}`, x + 150, rowY);
  });
}

function drawAspectGrid(ctx, result, x, y) {
  const planets = result.planets.slice(0, 10);
  const cell = 30;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#1f2937";
  ctx.font = "bold 22px 'Noto Serif', Georgia";
  ctx.fillText("Góc chiếu", x, y);
  ctx.strokeStyle = "#9ca3af";
  ctx.lineWidth = 1;
  planets.forEach((planet, index) => {
    ctx.fillStyle = planet.color;
    ctx.font = "18px Georgia";
    ctx.fillText(planet.glyph, x + 88 + index * cell, y + 32);
    ctx.fillText(planet.glyph, x + 48, y + 62 + index * cell);
  });
  for (let row = 0; row < planets.length; row += 1) {
    for (let col = 0; col < planets.length; col += 1) {
      const cellX = x + 74 + col * cell;
      const cellY = y + 42 + row * cell;
      ctx.strokeRect(cellX, cellY, cell, cell);
      if (col < row) {
        const aspect = result.aspects.find((item) =>
          (item.from.key === planets[row].key && item.to.key === planets[col].key) ||
          (item.from.key === planets[col].key && item.to.key === planets[row].key)
        );
        if (aspect) {
          ctx.fillStyle = aspect.color;
          ctx.font = "18px Georgia";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(aspect.glyph, cellX + cell / 2, cellY + cell / 2);
          ctx.textAlign = "left";
          ctx.textBaseline = "alphabetic";
        }
      }
    }
  }
}

function drawElementModeGrid(ctx, result, x, y) {
  const elements = { Lửa: 0, Đất: 0, Khí: 0, Nước: 0 };
  const modes = { "Tiên phong": 0, "Ổn định": 0, "Linh hoạt": 0 };
  const elementBySign = ["Lửa", "Đất", "Khí", "Nước", "Lửa", "Đất", "Khí", "Nước", "Lửa", "Đất", "Khí", "Nước"];
  const modeBySign = ["Tiên phong", "Ổn định", "Linh hoạt", "Tiên phong", "Ổn định", "Linh hoạt", "Tiên phong", "Ổn định", "Linh hoạt", "Tiên phong", "Ổn định", "Linh hoạt"];
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  result.planets.forEach((planet) => {
    elements[elementBySign[planet.signIndex]] += 1;
    modes[modeBySign[planet.signIndex]] += 1;
  });
  ctx.fillStyle = "#1f2937";
  ctx.font = "bold 22px 'Noto Serif', Georgia";
  ctx.fillText("Nguyên tố / Tính chất", x, y);
  ctx.font = "18px 'Noto Serif', Georgia";
  Object.entries(elements).forEach(([name, value], index) => {
    ctx.fillStyle = ["#d9480f", "#2f9e44", "#1971c2", "#364fc7"][index];
    ctx.fillText(`${name}: ${value}`, x, y + 38 + index * 30);
  });
  Object.entries(modes).forEach(([name, value], index) => {
    ctx.fillStyle = "#334155";
    ctx.fillText(`${name}: ${value}`, x + 170, y + 38 + index * 30);
  });
}

function wheelAngle(degree) {
  return toRad(degree - 180);
}

function polarPoint(cx, cy, angle, radius) {
  return {
    x: cx + Math.cos(angle) * radius,
    y: cy + Math.sin(angle) * radius
  };
}

function drawRadialLine(ctx, cx, cy, angle, innerRadius, outerRadius) {
  const start = polarPoint(cx, cy, angle, innerRadius);
  const end = polarPoint(cx, cy, angle, outerRadius);
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();
}

function drawTuViChart(result) {
  const canvas = document.getElementById("star-chart");
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#090d1b";
  ctx.fillRect(0, 0, width, height);

  for (let i = 0; i < 120; i += 1) {
    ctx.fillStyle = i % 6 === 0 ? "rgba(216,184,97,.82)" : "rgba(255,255,255,.55)";
    ctx.fillRect(Math.random() * width, Math.random() * height, 1.4, 1.4);
  }

  drawTuViHeader(ctx, result, width);

  const margin = 42;
  const topOffset = 118;
  const cellW = (width - margin * 2) / 4;
  const cellH = (height - margin - topOffset) / 3;
  const positions = [
    [0, 0], [1, 0], [2, 0], [3, 0],
    [3, 1], [3, 2], [2, 2], [1, 2],
    [0, 2], [0, 1], [1, 1], [2, 1]
  ];

  result.palaces.forEach((palace, index) => {
    const [col, row] = positions[index];
    const x = margin + col * cellW;
    const y = topOffset + row * cellH;
    const evaluation = palace.evaluation;
    ctx.fillStyle = palace.name === "Mệnh" ? "rgba(216,184,97,.14)" : "rgba(5,8,18,.58)";
    ctx.strokeStyle = palace.name === "Mệnh" ? "#f2d98a" : evaluationColor(evaluation.level);
    ctx.lineWidth = palace.name === "Mệnh" ? 3 : 1.5;
    ctx.fillRect(x, y, cellW, cellH);
    ctx.strokeRect(x, y, cellW, cellH);

    ctx.fillStyle = "#d8b861";
    ctx.font = "bold 25px Georgia";
    ctx.textAlign = "left";
    ctx.fillText(`${palace.name} (${palace.branch})`, x + 16, y + 34);
    ctx.fillStyle = "#7ecdc4";
    ctx.font = "14px Georgia";
    ctx.fillText(`Hành ${palace.element}`, x + cellW - 72, y + 34);
    ctx.fillStyle = evaluationColor(evaluation.level);
    ctx.font = "bold 16px Georgia";
    ctx.fillText(`${evaluation.level} ${evaluation.score}/100`, x + 16, y + 58);
    const starStartY = y + 86;
    ctx.fillStyle = "#f3eadb";
    ctx.font = "bold 16px Georgia";
    ctx.fillText("Chính:", x + 16, starStartY);
    ctx.font = "18px Georgia";
    wrapCanvasText(ctx, palace.mainStars.join(", ") || "Vô chính diệu", x + 76, starStartY, cellW - 92, 23, 2);
    ctx.fillStyle = "#b7adc5";
    ctx.font = "bold 15px Georgia";
    ctx.fillText("Phụ:", x + 16, starStartY + 54);
    ctx.font = "16px Georgia";
    wrapCanvasText(ctx, palace.supportStars.join(", "), x + 76, starStartY + 54, cellW - 92, 20, 2);
    ctx.fillStyle = "#d77c87";
    ctx.font = "bold 15px Georgia";
    ctx.fillText("Sát:", x + 16, starStartY + 98);
    ctx.font = "16px Georgia";
    wrapCanvasText(ctx, palace.challengeStars.join(", "), x + 76, starStartY + 98, cellW - 92, 20, 1);
  });
}

function drawTuViHeader(ctx, result, width) {
  ctx.fillStyle = "rgba(9,13,27,.92)";
  ctx.strokeStyle = "rgba(126,205,196,.45)";
  ctx.lineWidth = 2;
  ctx.fillRect(42, 28, width - 84, 66);
  ctx.strokeRect(42, 28, width - 84, 66);
  ctx.fillStyle = "#f3eadb";
  ctx.font = "bold 28px Georgia";
  ctx.textAlign = "left";
  ctx.fillText(result.name, 62, 68);
  ctx.fillStyle = "#d8b861";
  ctx.font = "18px Georgia";
  ctx.fillText(`Mệnh ${result.destinyPalace} · ${result.lunarLabel} · ${result.yearPillar.label} | ${result.monthPillar.label} | ${result.dayPillar.label}`, 260, 68);
  ctx.fillStyle = evaluationColor(result.destinyEvaluation.level);
  ctx.font = "bold 18px Georgia";
  ctx.textAlign = "right";
  ctx.fillText(`Cung Mệnh: ${result.destinyEvaluation.level} · ${result.destinyEvaluation.score}/100`, width - 62, 68);
}

function wrapCanvasText(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
  const words = text.split(/\s+/).filter(Boolean);
  let line = "";
  let lineCount = 0;
  words.forEach((word, index) => {
    const testLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, y + lineCount * lineHeight);
      line = word;
      lineCount += 1;
    } else {
      line = testLine;
    }
    if (index === words.length - 1 && lineCount < maxLines) {
      ctx.fillText(line, x, y + lineCount * lineHeight);
    }
  });
}

function drawCircle(ctx, x, y, radius, color, width) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();
}

function evaluationClass(level) {
  if (level === "Tốt") return "eval-good";
  if (level === "Xấu") return "eval-bad";
  return "eval-normal";
}

function evaluationColor(level) {
  if (level === "Tốt") return "#7ecdc4";
  if (level === "Xấu") return "#d77c87";
  return "#d8b861";
}

function downloadChart(name) {
  const canvas = document.getElementById("star-chart");
  const link = document.createElement("a");
  const safeName = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  link.download = `la-so-${safeName || "tu-vi"}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

function formatDate(year, month, day) {
  return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
}

function formatLunarDate(lunarDate) {
  const leap = lunarDate.isLeap ? " nhuận" : "";
  return `Âm lịch ${String(lunarDate.day).padStart(2, "0")}/${String(lunarDate.month).padStart(2, "0")}${leap}/${lunarDate.year}`;
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#039;"
  }[char]));
}
