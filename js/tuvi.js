import { julianDay } from "./ephemeris.js";
import { GIO_HOANG_DAO } from "./gio-hoang-dao.js";
import { convertSolarToLunar } from "./lunar.js";

export const CAN = ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"];
export const CHI = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];
export const CUNG_TU_VI = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];

const STEM_ELEMENTS = {
  Giáp: "Mộc", Ất: "Mộc", Bính: "Hỏa", Đinh: "Hỏa", Mậu: "Thổ", Kỷ: "Thổ",
  Canh: "Kim", Tân: "Kim", Nhâm: "Thủy", Quý: "Thủy"
};

const BRANCH_ELEMENTS = {
  Tý: "Thủy", Sửu: "Thổ", Dần: "Mộc", Mão: "Mộc", Thìn: "Thổ", Tỵ: "Hỏa",
  Ngọ: "Hỏa", Mùi: "Thổ", Thân: "Kim", Dậu: "Kim", Tuất: "Thổ", Hợi: "Thủy"
};

const PALACE_NAMES = ["Mệnh", "Phụ Mẫu", "Phúc Đức", "Điền Trạch", "Quan Lộc", "Nô Bộc", "Thiên Di", "Tật Ách", "Tài Bạch", "Tử Tức", "Phu Thê", "Huynh Đệ"];
const MAIN_STARS = ["Tử Vi", "Thiên Cơ", "Thái Dương", "Vũ Khúc", "Thiên Đồng", "Liêm Trinh", "Thiên Phủ", "Thái Âm", "Tham Lang", "Cự Môn", "Thiên Tướng", "Thiên Lương", "Thất Sát", "Phá Quân"];
const SUPPORT_STARS = ["Văn Xương", "Văn Khúc", "Tả Phụ", "Hữu Bật", "Thiên Khôi", "Thiên Việt", "Lộc Tồn", "Hóa Lộc", "Hóa Quyền", "Hóa Khoa", "Hồng Loan", "Thiên Hỷ"];
const CHALLENGE_STARS = ["Kình Dương", "Đà La", "Hỏa Tinh", "Linh Tinh", "Địa Không", "Địa Kiếp", "Hóa Kỵ", "Tang Môn"];
const STRONG_MAIN_STARS = ["Tử Vi", "Thiên Phủ", "Thái Dương", "Thái Âm", "Vũ Khúc", "Thiên Tướng", "Thiên Lương"];
const VOLATILE_MAIN_STARS = ["Thất Sát", "Phá Quân", "Tham Lang", "Cự Môn", "Liêm Trinh"];

export function buildTuViChart({ year, month, day, birthHour }) {
  const hourInfo = birthHour ? GIO_HOANG_DAO[birthHour] : null;
  const lunarDate = convertSolarToLunar(day, month, year, 7);
  const yearPillar = getCanChiNam(lunarDate.year);
  const monthPillar = getCanChiMonth(lunarDate.year, lunarDate.month);
  const dayPillar = getCanChiDay(year, month, day);
  const hourPillar = hourInfo ? getCanChiHour(dayPillar.stem, hourInfo.branch) : null;
  const elementBalance = countElements([yearPillar, monthPillar, dayPillar, hourPillar].filter(Boolean));
  const destinyPalace = getCungMenh(lunarDate.month, birthHour);
  const dominantElement = Object.entries(elementBalance).sort((a, b) => b[1] - a[1])[0][0];
  const weakestElement = Object.entries(elementBalance).sort((a, b) => a[1] - b[1])[0][0];
  const palaces = buildTuViPalaces({ lunarDate, birthHour, destinyPalace, yearPillar, monthPillar, dayPillar, hourPillar });
  const palaceEvaluations = evaluateAllPalaces(palaces, dominantElement, weakestElement);
  palaceEvaluations.forEach((evaluation) => {
    evaluation.palace.evaluation = evaluation;
  });
  const destinyEvaluation = palaceEvaluations.find((evaluation) => evaluation.palace.name === "Mệnh") || palaceEvaluations[0];

  return {
    hourInfo,
    lunarDate,
    yearPillar,
    monthPillar,
    dayPillar,
    hourPillar,
    elementBalance,
    destinyPalace,
    dominantElement,
    weakestElement,
    palaces,
    palaceEvaluations,
    destinyEvaluation,
    elementSummary: buildElementSummary(elementBalance, dominantElement, weakestElement),
    accuracyNote: "Đã dùng chuyển đổi âm lịch theo múi giờ Việt Nam cho năm/tháng âm và Cung Mệnh. Phần an sao Tử Vi đầy đủ vẫn cần hệ sao chuyên sâu."
  };
}

export function buildTuViPalaces({ lunarDate, birthHour, destinyPalace, yearPillar, monthPillar, dayPillar, hourPillar }) {
  const destinyIndex = CUNG_TU_VI.indexOf(destinyPalace);
  const startIndex = destinyIndex >= 0 ? destinyIndex : lunarDate.month % 12;
  const seed = lunarDate.day + lunarDate.month * 3 + lunarDate.year + (birthHour ? Object.keys(GIO_HOANG_DAO).indexOf(birthHour) * 5 : 0);
  const palaces = CUNG_TU_VI.map((branch, index) => {
    const palaceOffset = (index - startIndex + 12) % 12;
    return {
      branch,
      name: PALACE_NAMES[palaceOffset],
      mainStars: [],
      supportStars: [],
      challengeStars: [],
      element: BRANCH_ELEMENTS[branch]
    };
  });

  placeStars(palaces, MAIN_STARS, seed, "mainStars", 2);
  placeStars(palaces, SUPPORT_STARS, seed + lunarDate.month, "supportStars", 3);
  placeStars(palaces, CHALLENGE_STARS, seed + lunarDate.day, "challengeStars", 4);

  attachKeyStars(palaces, destinyPalace, yearPillar, monthPillar, dayPillar, hourPillar);
  return palaces;
}

function placeStars(palaces, stars, seed, field, step) {
  stars.forEach((star, index) => {
    const palaceIndex = (seed + index * step) % 12;
    palaces[palaceIndex][field].push(star);
  });
}

function attachKeyStars(palaces, destinyPalace, yearPillar, monthPillar, dayPillar, hourPillar) {
  const destiny = palaces.find((palace) => palace.branch === destinyPalace);
  if (destiny) destiny.supportStars.unshift("Mệnh Chủ");
  const yearPalace = palaces.find((palace) => palace.branch === yearPillar.branch);
  if (yearPalace) yearPalace.supportStars.push("Thái Tuế");
  const monthPalace = palaces.find((palace) => palace.branch === monthPillar.branch);
  if (monthPalace) monthPalace.supportStars.push("Nguyệt Đức");
  const dayPalace = palaces.find((palace) => palace.branch === dayPillar.branch);
  if (dayPalace) dayPalace.supportStars.push("Thiên Đức");
  if (hourPillar) {
    const hourPalace = palaces.find((palace) => palace.branch === hourPillar.branch);
    if (hourPalace) hourPalace.supportStars.push("Thân Cư");
  }
}

export function evaluateDestinyPalace(palaces, destinyPalace, dominantElement, weakestElement) {
  const palace = palaces.find((item) => item.branch === destinyPalace || item.name === "Mệnh");
  if (!palace) {
    return {
      level: "Bình thường",
      score: 50,
      summary: "Chưa đủ dữ liệu giờ sinh để đánh giá Cung Mệnh rõ ràng.",
      details: ["Thiếu cung Mệnh xác định."]
    };
  }

  return evaluatePalace(palace, dominantElement, weakestElement);
}

export function evaluateAllPalaces(palaces, dominantElement, weakestElement) {
  return palaces.map((palace) => evaluatePalace(palace, dominantElement, weakestElement));
}

function evaluatePalace(palace, dominantElement, weakestElement) {
  let score = 50;
  const details = [];
  const strongMain = palace.mainStars.filter((star) => STRONG_MAIN_STARS.includes(star));
  const volatileMain = palace.mainStars.filter((star) => VOLATILE_MAIN_STARS.includes(star));

  score += strongMain.length * 12;
  score -= volatileMain.length * 6;
  score += palace.supportStars.length * 5;
  score -= palace.challengeStars.length * 8;

  if (palace.element === dominantElement) score += 8;
  if (palace.element === weakestElement) score -= 6;
  if (palace.supportStars.includes("Mệnh Chủ")) score += 6;
  if (!palace.mainStars.length) score -= 4;

  if (strongMain.length) details.push(`Có chính tinh nâng đỡ: ${strongMain.join(", ")}.`);
  if (volatileMain.length) details.push(`Có sao biến động, cần dùng đúng hướng: ${volatileMain.join(", ")}.`);
  if (palace.supportStars.length) details.push(`Phụ tinh hỗ trợ: ${palace.supportStars.join(", ")}.`);
  if (palace.challengeStars.length) details.push(`Sát tinh/thử thách: ${palace.challengeStars.join(", ")}.`);
  if (!palace.mainStars.length) details.push("Cung vô chính diệu nên cần đọc kỹ phụ tinh, sát tinh và tam phương.");
  details.push(`Ngũ hành cung ${palace.name} là ${palace.element}; hành nổi bật toàn lá số là ${dominantElement}, hành cần bồi là ${weakestElement}.`);

  const boundedScore = Math.max(0, Math.min(100, score));
  let level = "Bình thường";
  if (boundedScore >= 68) level = "Tốt";
  if (boundedScore <= 42) level = "Xấu";

  const summaryByLevel = {
    "Tốt": `Cung ${palace.name} có lực nâng khá rõ, dễ phát huy nếu chọn đúng môi trường và giữ kỷ luật.`,
    "Bình thường": `Cung ${palace.name} cân bằng, có cả điểm thuận và điểm cần rèn. Kết quả phụ thuộc nhiều vào cách dùng thế mạnh.`,
    "Xấu": `Cung ${palace.name} có nhiều lực thử thách hơn lực nâng. Nên ưu tiên ổn định nền tảng và tránh quyết định nóng.`
  };

  return {
    palace,
    level,
    score: boundedScore,
    summary: summaryByLevel[level],
    details
  };
}

export function getCanChiNam(year) {
  const stem = CAN[(year + 6) % 10];
  const branch = CHI[(year + 8) % 12];
  return makePillar(stem, branch);
}

export function getCanChiMonth(lunarYear, lunarMonth) {
  const yearStemIndex = CAN.indexOf(CAN[(lunarYear + 6) % 10]);
  const stem = CAN[(yearStemIndex * 2 + lunarMonth + 1) % 10];
  const branch = CHI[(lunarMonth + 1) % 12];
  return makePillar(stem, branch);
}

export function getCanChiDay(year, month, day) {
  const jd = Math.floor(julianDay(year, month, day, 12) + 0.5);
  const stem = CAN[(jd + 9) % 10];
  const branch = CHI[(jd + 1) % 12];
  return makePillar(stem, branch);
}

export function getCanChiHour(dayStem, branch) {
  const dayStemIndex = CAN.indexOf(dayStem);
  const branchIndex = CUNG_TU_VI.indexOf(branch);
  const stem = CAN[(dayStemIndex * 2 + branchIndex) % 10];
  return makePillar(stem, branch);
}

export function getCungMenh(month, hourKey) {
  if (!hourKey) return "Tham khảo";
  const hourIndex = Object.keys(GIO_HOANG_DAO).indexOf(hourKey);
  return CUNG_TU_VI[(month + hourIndex) % 12];
}

export function countElements(pillars) {
  const balance = { Kim: 0, Mộc: 0, Thủy: 0, Hỏa: 0, Thổ: 0 };
  pillars.forEach((pillar) => pillar.elements.forEach((element) => balance[element] += 1));
  return balance;
}

function makePillar(stem, branch) {
  return {
    stem,
    branch,
    label: `${stem} ${branch}`,
    elements: [STEM_ELEMENTS[stem], BRANCH_ELEMENTS[branch]]
  };
}

function buildElementSummary(balance, dominantElement, weakestElement) {
  const total = Object.values(balance).reduce((sum, value) => sum + value, 0);
  const dominantScore = balance[dominantElement];
  const weakestScore = balance[weakestElement];
  const intensity = dominantScore >= 3 ? "vượng" : "có điểm nhấn";
  const lack = weakestScore === 0 ? "thiếu rõ" : "khá nhẹ";
  return `Ngũ hành ${dominantElement} ${intensity} trong tứ trụ (${dominantScore}/${total}), còn ${weakestElement} ${lack} (${weakestScore}/${total}). Khi luận giải nên xem ${dominantElement} là khí dễ bộc lộ, còn ${weakestElement} là vùng cần bồi dưỡng để cân bằng.`;
}
