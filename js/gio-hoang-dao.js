export const GIO_HOANG_DAO = {
  ty: { label: "Tý", start: 23, mid: 0, can: "Canh/Nhâm/Giáp", branch: "Tý", element: "Thủy" },
  suu: { label: "Sửu", start: 1, mid: 2, can: "Tân/Quý/Ất", branch: "Sửu", element: "Thổ" },
  dan: { label: "Dần", start: 3, mid: 4, can: "Nhâm/Giáp/Bính", branch: "Dần", element: "Mộc" },
  mao: { label: "Mão", start: 5, mid: 6, can: "Quý/Ất/Đinh", branch: "Mão", element: "Mộc" },
  thin: { label: "Thìn", start: 7, mid: 8, can: "Giáp/Bính/Mậu", branch: "Thìn", element: "Thổ" },
  ty2: { label: "Tỵ", start: 9, mid: 10, can: "Ất/Đinh/Kỷ", branch: "Tỵ", element: "Hỏa" },
  ngo: { label: "Ngọ", start: 11, mid: 12, can: "Bính/Mậu/Canh", branch: "Ngọ", element: "Hỏa" },
  mui: { label: "Mùi", start: 13, mid: 14, can: "Đinh/Kỷ/Tân", branch: "Mùi", element: "Thổ" },
  than: { label: "Thân", start: 15, mid: 16, can: "Mậu/Canh/Nhâm", branch: "Thân", element: "Kim" },
  dau: { label: "Dậu", start: 17, mid: 18, can: "Kỷ/Tân/Quý", branch: "Dậu", element: "Kim" },
  tuat: { label: "Tuất", start: 19, mid: 20, can: "Canh/Nhâm/Giáp", branch: "Tuất", element: "Thổ" },
  hoi: { label: "Hợi", start: 21, mid: 22, can: "Tân/Quý/Ất", branch: "Hợi", element: "Thủy" }
};

export function getDecimalHour(gioKey) {
  if (!gioKey || !GIO_HOANG_DAO[gioKey]) return 12;
  return GIO_HOANG_DAO[gioKey].mid;
}

export function getHourInfo(gioKey) {
  return gioKey ? GIO_HOANG_DAO[gioKey] || null : null;
}
