// 100% Client-Side Vietnamese 12-Palace Tử Vi Engine + Sassy Dark-Humorous Dobby Daily Commentary
// Uses Temporal.PlainDate for location-agnostic calendar values and Intl.DateTimeFormat('en-u-ca-chinese')
// solely for Chinese/Vietnamese lunisolar month/day/year mapping.

import { TUVI_LOVE_DAILY_100, TUVI_MONEY_DAILY_100 } from '../data/tuviLoveAndMoney100.js';
import { TUVI_DECREES_100 } from '../data/tuviDecrees100.js';

export const THIEN_CAN = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'];
export const DIA_CHI = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];

export const BIRTH_HOURS = [
  { value: -1, label: '✨ Không nhớ rõ (Dobby tự suy theo ngày sinh)' },
  { value: 0, label: '🐭 Giờ Tý (23:00 – 00:59)' },
  { value: 1, label: '🐮 Giờ Sửu (01:00 – 02:59)' },
  { value: 2, label: '🐯 Giờ Dần (03:00 – 04:59)' },
  { value: 3, label: '🐱 Giờ Mão (05:00 – 06:59)' },
  { value: 4, label: '🐲 Giờ Thìn (07:00 – 08:59)' },
  { value: 5, label: '🐍 Giờ Tỵ (09:00 – 10:59)' },
  { value: 6, label: '🐴 Giờ Ngọ (11:00 – 12:59)' },
  { value: 7, label: '🐐 Giờ Mùi (13:00 – 14:59)' },
  { value: 8, label: '🐵 Giờ Thân (15:00 – 16:59)' },
  { value: 9, label: '🐔 Giờ Dậu (17:00 – 18:59)' },
  { value: 10, label: '🐶 Giờ Tuất (19:00 – 20:59)' },
  { value: 11, label: '🐷 Giờ Hợi (21:00 – 22:59)' },
];

const PALACE_NAMES = [
  'MỆNH',
  'PHỤ MẪU',
  'PHÚC ĐỨC',
  'ĐIỀN TRẠCH',
  'QUAN LỘC',
  'NÔ BỘC',
  'THIÊN DI',
  'TẬT ÁCH',
  'TÀI BẠCH',
  'TỬ TỨC',
  'PHU THÊ',
  'HUYNH ĐỆ',
];

// Traditional 4x4 outer ring CSS grid placement for Earthly Branches Tý (0) .. Hợi (11)
// Top row: Tỵ (5), Ngọ (6), Mùi (7), Thân (8)
// Middle-upper: Thìn (4), [Thiên Bàn 2x2], Dậu (9)
// Middle-lower: Mão (3), [Thiên Bàn 2x2], Tuất (10)
// Bottom row: Dần (2), Sửu (1), Tý (0), Hợi (11)
export const BRANCH_GRID_POS = [
  { row: 4, col: 3 }, // 0: Tý
  { row: 4, col: 2 }, // 1: Sửu
  { row: 4, col: 1 }, // 2: Dần
  { row: 3, col: 1 }, // 3: Mão
  { row: 2, col: 1 }, // 4: Thìn
  { row: 1, col: 1 }, // 5: Tỵ
  { row: 1, col: 2 }, // 6: Ngọ
  { row: 1, col: 3 }, // 7: Mùi
  { row: 1, col: 4 }, // 8: Thân
  { row: 2, col: 4 }, // 9: Dậu
  { row: 3, col: 4 }, // 10: Tuất
  { row: 4, col: 4 }, // 11: Hợi
];

const NAP_AM_30 = [
  { name: 'Hải Trung Kim', desc: 'Vàng Dưới Biển', element: 'Kim' },
  { name: 'Lư Trung Hoả', desc: 'Lửa Trong Lò', element: 'Hoả' },
  { name: 'Đại Lâm Mộc', desc: 'Gỗ Rừng Già', element: 'Mộc' },
  { name: 'Lộ Bàng Thổ', desc: 'Đất Ven Đường', element: 'Thổ' },
  { name: 'Kiếm Phong Kim', desc: 'Vàng Mũi Kiếm', element: 'Kim' },
  { name: 'Sơn Đầu Hoả', desc: 'Lửa Đầu Núi', element: 'Hoả' },
  { name: 'Giản Hạ Thuỷ', desc: 'Nước Dưới Khe', element: 'Thuỷ' },
  { name: 'Thành Đầu Thổ', desc: 'Đất Đầu Thành', element: 'Thổ' },
  { name: 'Bạch Lạp Kim', desc: 'Vàng Chân Đèn', element: 'Kim' },
  { name: 'Dương Liễu Mộc', desc: 'Gỗ Cây Liễu', element: 'Mộc' },
  { name: 'Tuyền Trung Thuỷ', desc: 'Nước Trong Suối', element: 'Thuỷ' },
  { name: 'Ốc Thượng Thổ', desc: 'Đất Mái Nhà', element: 'Thổ' },
  { name: 'Tích Lịch Hoả', desc: 'Lửa Sấm Sét', element: 'Hoả' },
  { name: 'Tùng Bách Mộc', desc: 'Gỗ Tùng Bách', element: 'Mộc' },
  { name: 'Trường Lưu Thuỷ', desc: 'Nước Chảy Dài', element: 'Thuỷ' },
  { name: 'Sa Trung Kim', desc: 'Vàng Trong Cát', element: 'Kim' },
  { name: 'Sơn Hạ Hoả', desc: 'Lửa Chân Núi', element: 'Hoả' },
  { name: 'Bình Địa Mộc', desc: 'Gỗ Đồng Bằng', element: 'Mộc' },
  { name: 'Bích Thượng Thổ', desc: 'Đất Trên Vách', element: 'Thổ' },
  { name: 'Kim Bạch Kim', desc: 'Vàng Pha Bạc', element: 'Kim' },
  { name: 'Phú Đăng Hoả', desc: 'Lửa Đèn Chụp', element: 'Hoả' },
  { name: 'Thiên Hà Thuỷ', desc: 'Nước Ngân Hà', element: 'Thuỷ' },
  { name: 'Đại Trạch Thổ', desc: 'Đất Đầm Lầy', element: 'Thổ' },
  { name: 'Thoa Xuyến Kim', desc: 'Vàng Trang Sức', element: 'Kim' },
  { name: 'Tang Đố Mộc', desc: 'Gỗ Cây Dâu', element: 'Mộc' },
  { name: 'Đại Khê Thuỷ', desc: 'Nước Khe Lớn', element: 'Thuỷ' },
  { name: 'Sa Trung Thổ', desc: 'Đất Pha Cát', element: 'Thổ' },
  { name: 'Thiên Thượng Hoả', desc: 'Lửa Trên Trời', element: 'Hoả' },
  { name: 'Thạch Lựu Mộc', desc: 'Gỗ Cây Lựu', element: 'Mộc' },
  { name: 'Đại Hải Thuỷ', desc: 'Nước Biển Lớn', element: 'Thuỷ' },
];

const CUC_BY_ELEMENT = {
  Thuỷ: { name: 'Thuỷ Nhị Cục', num: 2 },
  Mộc: { name: 'Mộc Tam Cục', num: 3 },
  Kim: { name: 'Kim Tứ Cục', num: 4 },
  Thổ: { name: 'Thổ Ngũ Cục', num: 5 },
  Hoả: { name: 'Hoả Lục Cục', num: 6 },
};

const CHU_MENH_BY_CHI = [
  'Tham Lang', 'Cự Môn', 'Lộc Tồn', 'Văn Khúc', 'Liêm Trinh', 'Vũ Khúc',
  'Phá Quân', 'Vũ Khúc', 'Liêm Trinh', 'Văn Khúc', 'Lộc Tồn', 'Cự Môn',
];

// Lộc Tồn branch index for each Thiên Can (Giáp..Quý)
const LOC_TON_BY_CAN = [2, 3, 5, 6, 5, 6, 8, 9, 11, 0];

// Tứ Hoá table by Thiên Can (Hoá Lộc, Hoá Quyền, Hoá Khoa, Hoá Kỵ)
const TU_HOA_BY_CAN = [
  ['Liêm Trinh', 'Phá Quân', 'Vũ Khúc', 'Thái Dương'], // Giáp
  ['Thiên Cơ', 'Thiên Lương', 'Tử Vi', 'Thái Âm'],     // Ất
  ['Thiên Đồng', 'Thiên Cơ', 'Văn Xương', 'Liêm Trinh'], // Bính
  ['Thái Âm', 'Thiên Đồng', 'Thiên Cơ', 'Cự Môn'],     // Đinh
  ['Tham Lang', 'Thái Âm', 'Hữu Bật', 'Thiên Cơ'],     // Mậu
  ['Vũ Khúc', 'Tham Lang', 'Thiên Lương', 'Văn Khúc'], // Kỷ
  ['Thái Dương', 'Vũ Khúc', 'Thái Âm', 'Thiên Đồng'],  // Canh
  ['Cự Môn', 'Thái Dương', 'Văn Khúc', 'Văn Xương'],   // Tân
  ['Thiên Lương', 'Tử Vi', 'Tả Phù', 'Vũ Khúc'],       // Nhâm
  ['Phá Quân', 'Cự Môn', 'Thái Âm', 'Tham Lang'],      // Quý
];

const mod12 = (n) => ((n % 12) + 12) % 12;

const lunarFormatter = new Intl.DateTimeFormat('en-u-ca-chinese', {
  timeZone: 'UTC',
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
});

/**
 * Convert a Temporal.PlainDate to Vietnamese/Chinese lunisolar year, month, day.
 * Reads Gregorian .year/.month/.day directly from PlainDate and uses UTC noon ZonedDateTime
 * strictly for lunisolar calendar conversion so local browser timezones never shift the date.
 */
export function plainDateToLunar(plainDate) {
  const epochMs = plainDate
    .toZonedDateTime({
      timeZone: 'UTC',
      plainTime: globalThis.Temporal.PlainTime.from('12:00'),
    })
    .toInstant().epochMilliseconds;

  const parts = lunarFormatter.formatToParts(epochMs);
  let relatedYear = null;
  let rawMonth = '';
  let rawDay = '';

  for (const part of parts) {
    if (part.type === 'relatedYear' || part.type === 'year') {
      const parsedY = parseInt(part.value, 10);
      if (!Number.isNaN(parsedY) && parsedY > 1000) relatedYear = parsedY;
    } else if (part.type === 'month') {
      rawMonth = part.value;
    } else if (part.type === 'day') {
      rawDay = part.value;
    }
  }

  const isLeapMonth = /bis|leap/i.test(rawMonth);
  const lunarMonth = Math.max(1, Math.min(12, parseInt(rawMonth, 10) || plainDate.month));
  const lunarDay = Math.max(1, Math.min(30, parseInt(rawDay, 10) || plainDate.day));
  let lunarYear = relatedYear;
  if (!lunarYear) {
    lunarYear = plainDate.month <= 2 && lunarMonth >= 11 ? plainDate.year - 1 : plainDate.year;
  }

  return {
    solarYear: plainDate.year,
    solarMonth: plainDate.month,
    solarDay: plainDate.day,
    lunarYear,
    lunarMonth,
    lunarDay,
    isLeapMonth,
  };
}

function getSexagenaryIndex(canIdx, chiIdx) {
  // Find k in 0..59 such that k % 10 === canIdx and k % 12 === chiIdx
  for (let k = 0; k < 60; k += 1) {
    if (k % 10 === canIdx && k % 12 === chiIdx) return k;
  }
  return 0;
}

function placeTuViStar(lunarDay, cucNum) {
  const rem = lunarDay % cucNum;
  if (rem === 0) {
    const q = lunarDay / cucNum;
    return mod12(2 + q - 1);
  }
  const add = cucNum - rem;
  const q = (lunarDay + add) / cucNum;
  const shift = add % 2 === 1 ? -add : add;
  return mod12(2 + q - 1 + shift);
}

function buildPalaceShortNote(palaceName, mainStars, auxStars, isThan) {
  const starLabel = mainStars.length > 0 ? mainStars.join(', ') : 'Vô Chính Diệu (mượn sao xung chiếu)';
  const auxLabel = auxStars.slice(0, 3).join(', ');
  const thanNote = isThan ? ' Kiêm cung THÂN nên nửa đời sau ứng cực mạnh vào cung này.' : '';

  const notes = {
    'MỆNH': `Cốt cách đóng tại đây với ${starLabel}: ngoài mặt tỏ vẻ tịnh tâm nhưng bên trong tính toán sắc lẹm, ghét ai nói đạo lý sáo rỗng.${thanNote}`,
    'PHỤ MẪU': `Cung Phụ Mẫu có ${starLabel}: người lớn thương theo kiểu hay càm ràm sát ván, ở xa thì nhớ mà ngồi chung quá 2 tiếng là dễ tranh luận.${thanNote}`,
    'PHÚC ĐỨC': `Phúc phần dòng họ có ${starLabel} hội ${auxLabel}: hay được cứu nguy phút 89 mỗi khi tưởng toang đến nơi.${thanNote}`,
    'ĐIỀN TRẠCH': `Nhà cửa đất cát ứng ${starLabel}: phòng ở hay bày biện theo hứng, càng giữ góc ngủ gọn gàng thì tụ tài càng mạnh.${thanNote}`,
    'QUAN LỘC': `Đường công danh sự nghiệp đóng ${starLabel}: số hay gánh việc khó thiên hạ đùn đẩy, làm chơi không nổi mà làm thật là lên hương.${thanNote}`,
    'NÔ BỘC': `Bạn bè đồng nghiệp ứng ${starLabel}: quen biết thì đông nhưng tri kỷ đếm trên đầu ngón tay, cẩn thận cho mượn tiền bằng niềm tin.${thanNote}`,
    'THIÊN DI': `Bước chân ra đường ứng ${starLabel}: ra ngoài thần thái sang xịn hơn hẳn lúc nằm lướt điện thoại ở nhà.${thanNote}`,
    'TẬT ÁCH': `Sức khoẻ & ách nhỏ có ${starLabel}: bệnh lớn ít lo, chủ yếu tự hại thân vì thức khuya, nhịn ăn sáng và ôm cục tức đi ngủ.${thanNote}`,
    'TÀI BẠCH': `Túi tiền đóng ${starLabel} đi cùng ${auxLabel}: tiền kiếm được không tệ nhưng tốc độ chốt đơn giải sầu cũng thuộc hàng thượng thừa!${thanNote}`,
    'TỬ TỨC': `Duyên con cái / hậu bối ứng ${starLabel}: hợp vía trẻ nhỏ và thú cưng hơn người lớn hay drama.${thanNote}`,
    'PHU THÊ': `Duyên nợ tình cảm đóng ${starLabel} kèm ${auxLabel}: gu vừa lạ vừa cao, miệng bảo tuỳ duyên nhưng mắt soi tiêu chuẩn nét căng!${thanNote}`,
    'HUYNH ĐỆ': `Anh chị em / đồng môn ứng ${starLabel}: mỗi người một cá tính trái ngược, ít nói lời ngọt ngào nhưng hữu sự vẫn đỡ đần nhau.${thanNote}`,
  };
  return notes[palaceName] || `${palaceName}: ${starLabel}.${thanNote}`;
}

export function generateTuViChart({ dobPlainDate, gender = 'nam', birthHourIdx = -1, todayPlainDate }) {
  const lunarDob = plainDateToLunar(dobPlainDate);
  const lunarToday = plainDateToLunar(todayPlainDate);

  // Derive deterministic hour index if user selected "Không nhớ rõ"
  const resolvedHourIdx = birthHourIdx >= 0 && birthHourIdx <= 11
    ? birthHourIdx
    : (dobPlainDate.day * 5 + dobPlainDate.month * 3 + (gender === 'nam' ? 1 : 6)) % 12;
  const isAutoHour = birthHourIdx < 0;

  const yearCanIdx = ((lunarDob.lunarYear - 4) % 10 + 10) % 10;
  const yearChiIdx = ((lunarDob.lunarYear - 4) % 12 + 12) % 12;
  const isDuongYear = yearCanIdx % 2 === 0;
  const amDuongLabel = `${isDuongYear ? 'Dương' : 'Âm'} ${gender === 'nam' ? 'Nam' : 'Nữ'}`;

  const yearCycleIdx = getSexagenaryIndex(yearCanIdx, yearChiIdx);
  const banMenh = NAP_AM_30[Math.floor(yearCycleIdx / 2)];

  // An Cung Mệnh & Cung Thân
  const menhIdx = mod12(2 + (lunarDob.lunarMonth - 1) - resolvedHourIdx);
  const thanIdx = mod12(2 + (lunarDob.lunarMonth - 1) + resolvedHourIdx);

  // Ngũ Hổ Độn to find Thiên Can of Cung Mệnh -> Định Cục
  const danCanIdx = ((yearCanIdx % 5) * 2 + 2) % 10;
  const palacesByBranch = Array.from({ length: 12 }, (_, branchIdx) => {
    const offsetFromDan = mod12(branchIdx - 2);
    const palaceCanIdx = (danCanIdx + offsetFromDan) % 10;
    return {
      branchIdx,
      branchName: DIA_CHI[branchIdx],
      canName: THIEN_CAN[palaceCanIdx],
      palaceName: '',
      isMenh: branchIdx === menhIdx,
      isThan: branchIdx === thanIdx,
      mainStars: [],
      auxStars: [],
      gridPos: BRANCH_GRID_POS[branchIdx],
      dobbyNote: '',
    };
  });

  // Assign 12 Palace names starting from Cung Mệnh
  PALACE_NAMES.forEach((pName, idx) => {
    const bIdx = mod12(menhIdx + idx);
    palacesByBranch[bIdx].palaceName = pName;
  });

  const menhCanIdx = (danCanIdx + mod12(menhIdx - 2)) % 10;
  const menhCycleIdx = getSexagenaryIndex(menhCanIdx, menhIdx);
  const menhElement = NAP_AM_30[Math.floor(menhCycleIdx / 2)].element;
  const cuc = CUC_BY_ELEMENT[menhElement];

  // An 14 Chính Tinh
  const tuViIdx = placeTuViStar(lunarDob.lunarDay, cuc.num);
  const thienPhuIdx = mod12(4 - tuViIdx);

  const tuViGroup = [
    [0, 'Tử Vi'],
    [-1, 'Thiên Cơ'],
    [-3, 'Thái Dương'],
    [-4, 'Vũ Khúc'],
    [-5, 'Thiên Đồng'],
    [-8, 'Liêm Trinh'],
  ];
  for (const [offset, star] of tuViGroup) {
    palacesByBranch[mod12(tuViIdx + offset)].mainStars.push(star);
  }

  const thienPhuGroup = [
    [0, 'Thiên Phủ'],
    [1, 'Thái Âm'],
    [2, 'Tham Lang'],
    [3, 'Cự Môn'],
    [4, 'Thiên Tướng'],
    [5, 'Thiên Lương'],
    [6, 'Thất Sát'],
    [10, 'Phá Quân'],
  ];
  for (const [offset, star] of thienPhuGroup) {
    palacesByBranch[mod12(thienPhuIdx + offset)].mainStars.push(star);
  }

  // An key Phụ Tinh (Lộc Tồn, Kình Đà, Xương Khúc, Tả Hữu, Không Kiếp, Đào Hồng Hỷ, Cô Quả, Thiên Mã)
  const locTonIdx = LOC_TON_BY_CAN[yearCanIdx];
  palacesByBranch[locTonIdx].auxStars.push('Lộc Tồn');
  palacesByBranch[mod12(locTonIdx + 1)].auxStars.push('Kình Dương');
  palacesByBranch[mod12(locTonIdx - 1)].auxStars.push('Đà La');

  const vanXuongIdx = mod12(10 - resolvedHourIdx);
  const vanKhucIdx = mod12(4 + resolvedHourIdx);
  palacesByBranch[vanXuongIdx].auxStars.push('Văn Xương');
  palacesByBranch[vanKhucIdx].auxStars.push('Văn Khúc');

  palacesByBranch[mod12(4 + (lunarDob.lunarMonth - 1))].auxStars.push('Tả Phù');
  palacesByBranch[mod12(10 - (lunarDob.lunarMonth - 1))].auxStars.push('Hữu Bật');

  palacesByBranch[mod12(11 - resolvedHourIdx)].auxStars.push('Địa Không');
  palacesByBranch[mod12(11 + resolvedHourIdx)].auxStars.push('Địa Kiếp');

  const hongLoanIdx = mod12(3 - yearChiIdx);
  palacesByBranch[hongLoanIdx].auxStars.push('Hồng Loan');
  palacesByBranch[mod12(hongLoanIdx + 6)].auxStars.push('Thiên Hỷ');

  // Đào Hoa & Thiên Mã & Cô Thần / Quả Tú by Tam Hợp Địa Chi
  const daoHoaMap = { 2: 3, 6: 3, 10: 3, 8: 9, 0: 9, 4: 9, 5: 6, 9: 6, 1: 6, 11: 0, 3: 0, 7: 0 };
  const thienMaMap = { 2: 8, 6: 8, 10: 8, 8: 2, 0: 2, 4: 2, 5: 11, 9: 11, 1: 11, 11: 5, 3: 5, 7: 5 };
  const coThanMap = { 11: 2, 0: 2, 1: 2, 2: 5, 3: 5, 4: 5, 5: 8, 6: 8, 7: 8, 8: 11, 9: 11, 10: 11 };

  palacesByBranch[daoHoaMap[yearChiIdx]].auxStars.push('Đào Hoa');
  palacesByBranch[thienMaMap[yearChiIdx]].auxStars.push('Thiên Mã');
  const coIdx = coThanMap[yearChiIdx];
  palacesByBranch[coIdx].auxStars.push('Cô Thần');
  palacesByBranch[mod12(coIdx - 4)].auxStars.push('Quả Tú');

  // An Tứ Hoá onto matching palaces
  const [hoaLocStar, hoaQuyenStar, hoaKhoaStar, hoaKyStar] = TU_HOA_BY_CAN[yearCanIdx];
  const hoaPairs = [
    [hoaLocStar, 'Hoá Lộc'],
    [hoaQuyenStar, 'Hoá Quyền'],
    [hoaKhoaStar, 'Hoá Khoa'],
    [hoaKyStar, 'Hoá Kỵ'],
  ];
  for (const p of palacesByBranch) {
    for (const [targetStar, hoaName] of hoaPairs) {
      if (p.mainStars.includes(targetStar) || p.auxStars.includes(targetStar)) {
        p.auxStars.push(hoaName);
      }
    }
    p.dobbyNote = buildPalaceShortNote(p.palaceName, p.mainStars, p.auxStars, p.isThan);
  }

  const phuThePalace = palacesByBranch.find((p) => p.palaceName === 'PHU THÊ');
  const taiBachPalace = palacesByBranch.find((p) => p.palaceName === 'TÀI BẠCH');
  const menhPalace = palacesByBranch[menhIdx];

  // Daily deterministic seed combining full DOB + palace anchors + gender + today's Gregorian date
  const daySeed =
    todayPlainDate.year * 373 +
    todayPlainDate.month * 31 +
    todayPlainDate.day * 17 +
    (dobPlainDate.year % 100) * 29 +
    dobPlainDate.day * 13 +
    dobPlainDate.month * 7 +
    menhIdx * 19 +
    resolvedHourIdx * 5 +
    (gender === 'nam' ? 3 : 11);

  const commentary = buildDarkDobbyDailyRoast({
    phuThePalace,
    taiBachPalace,
    menhPalace,
    banMenh,
    gender,
    daySeed,
    todayPlainDate,
    lunarToday,
  });

  const pad2 = (n) => String(n).padStart(2, '0');

  return {
    meta: {
      solarDobStr: `${pad2(dobPlainDate.day)}/${pad2(dobPlainDate.month)}/${dobPlainDate.year}`,
      lunarDobStr: `${pad2(lunarDob.lunarDay)}/${pad2(lunarDob.lunarMonth)}${lunarDob.isLeapMonth ? ' (Nhuận)' : ''}/${lunarDob.lunarYear} ÂL`,
      yearCanChi: `${THIEN_CAN[yearCanIdx]} ${DIA_CHI[yearChiIdx]}`,
      genderLabel: gender === 'nam' ? 'Nam mạng' : 'Nữ mạng',
      amDuongLabel,
      hourLabel: `${DIA_CHI[resolvedHourIdx]}${isAutoHour ? ' (tự suy)' : ''}`,
      banMenh: `${banMenh.name} (${banMenh.desc})`,
      cucName: cuc.name,
      chuMenh: CHU_MENH_BY_CHI[menhIdx],
      todayStr: `${pad2(todayPlainDate.day)}/${pad2(todayPlainDate.month)}/${todayPlainDate.year} (${pad2(lunarToday.lunarDay)}/${pad2(lunarToday.lunarMonth)} ÂL)`,
    },
    menhIdx,
    thanIdx,
    palaces: palacesByBranch,
    commentary,
  };
}

const tuviSeenMemory = {
  love: new Set(),
  money: new Set(),
  decree: new Set(),
  lastIdx: { love: -1, money: -1, decree: -1 },
};

function pickUnseenFromPool(pool, preferredStartIdx, category) {
  const len = pool.length;
  const seen = tuviSeenMemory[category];
  if (seen.size >= len) {
    seen.clear();
  }
  const start = ((preferredStartIdx % len) + len) % len;
  // Coprime stride 37 (gcd(37, 100) === 1) traverses all 100 items pseudo-randomly without collision
  for (let step = 0; step < len; step += 1) {
    const candidateIdx = (start + step * 37) % len;
    if (!seen.has(candidateIdx) && (len === 1 || candidateIdx !== tuviSeenMemory.lastIdx[category])) {
      seen.add(candidateIdx);
      tuviSeenMemory.lastIdx[category] = candidateIdx;
      return pool[candidateIdx];
    }
  }
  const fallbackIdx = (tuviSeenMemory.lastIdx[category] + 1) % len;
  seen.add(fallbackIdx);
  tuviSeenMemory.lastIdx[category] = fallbackIdx;
  return pool[fallbackIdx];
}

function buildDarkDobbyDailyRoast({
  phuThePalace,
  taiBachPalace,
  daySeed,
}) {
  const loveMain = phuThePalace.mainStars.length > 0
    ? phuThePalace.mainStars.join(' • ')
    : 'Vô Chính Diệu';
  const loveAux = phuThePalace.auxStars;

  const moneyMain = taiBachPalace.mainStars.length > 0
    ? taiBachPalace.mainStars.join(' • ')
    : 'Vô Chính Diệu';
  const moneyAux = taiBachPalace.auxStars;

  // --- LOVE ROASTS (Personalized by DOB stars + 100 Sassy Daily Readings) ---
  let loveIntroPool = [];
  if (phuThePalace.mainStars.some((s) => ['Thất Sát', 'Phá Quân', 'Liêm Trinh'].includes(s))) {
    loveIntroPool = [
      `Cung Phu Thê đóng ${loveMain}: gu tình cảm đúng hệ thích đâm đầu vô bụi rậm — người hiền lành tử tế thì ngáp ngắn ngáp dài chê nhạt, thấy cờ đỏ phấp phới lại lao vô như thiêu thân!`,
      `Sao ${loveMain} chiếu đường tình: lúc mới thích thì cháy như rơm khô gặp lửa, hễ người ta lệch sóng nửa nhịp là bật chế độ tiễn vong lạnh ngắt không thèm nghe trình bày!`,
      `Mang vía ${loveMain} cung tình duyên: ngoài mặt vểnh cằm tỏ vẻ bất cần thiên hạ, bên trong lại sĩ diện ngút trời — ai lươn lẹo một lần là bồ ghim tới bảy kiếp sau!`,
    ];
  } else if (phuThePalace.mainStars.some((s) => ['Tham Lang', 'Thái Âm', 'Thiên Đồng'].includes(s)) || loveAux.includes('Đào Hoa') || loveAux.includes('Hồng Loan')) {
    loveIntroPool = [
      `Cung Phu Thê hội ${loveMain}: duyên lướt qua đời đông như trẩy hội nhưng toàn duyên xem chùa story thả tim dạo chứ chưa ma nào đủ bản lĩnh chốt sổ đỏ tim bồ!`,
      `Vía đào hoa từ ${loveMain}: ra đường dễ làm con nhà người ta tương tư vô cớ, ngặt nỗi người bồ nhắm tới thì cứ lửng lơ còn người bồ trốn thì bám dai như đỉa!`,
      `Tình duyên mang sắc ${loveMain}: đầu óc mộng mơ bay bổng trên mây, người ta mới nhớ giùm ly trà sữa ít đá đã cảm động suýt trao cả cuộc đời!`,
    ];
  } else if (phuThePalace.mainStars.some((s) => ['Tử Vi', 'Thiên Phủ', 'Vũ Khúc', 'Thiên Lương'].includes(s)) || loveAux.includes('Cô Thần') || loveAux.includes('Quả Tú')) {
    loveIntroPool = [
      `Cung tình cảm toạ ${loveMain}: mở miệng ra là than ế mốc meo mà cái nết kén cá chọn canh gắt hơn giám khảo chấm thi hoa hậu hoàn vũ!`,
      `Sao ${loveMain} giữ cửa trái tim: thà độc thân kiêu kỳ ngồi đếm tiền lẻ còn hơn yêu bừa cho có tụ — tiêu chuẩn ngầm cao chót vót ai trèo tới đã hụt hơi!`,
      `Đường duyên nợ đóng ${loveMain}: mặt mũi lúc nào cũng nghiêm như sếp tổng đi thanh tra, không hạ bớt hàng rào phòng vệ xuống thì ông Tơ cũng bó tay chịu trói!`,
    ];
  } else if (phuThePalace.mainStars.some((s) => ['Cự Môn', 'Thái Dương', 'Thiên Cơ'].includes(s))) {
    loveIntroPool = [
      `Cung Phu Thê ứng ${loveMain}: yêu đương mà não chạy phân tích như thám tử điều tra trọng án, người ta nhắn thiếu dấu chấm than cũng suy diễn ra mười tập ngoại truyện!`,
      `Tinh diệu ${loveMain} chiếu duyên: chúa tể khẩu xà tâm phật — trong bụng lo cho người ta sốt vó mà mở mồm ra toàn câu xéo xắt bén đứt tay!`,
      `Bản tính tình cảm hệ ${loveMain}: dị ứng nặng với mấy câu thả thính văn mẫu rẻ tiền, ai nói chuyện nhạt nhẽo thiếu muối quá ba câu là bồ ngáp thẳng mặt!`,
    ];
  } else {
    loveIntroPool = [
      `Cung Phu Thê (${loveMain}): đường tình dạo này chập chờn y hệt sóng Wi-Fi tầng hầm — lúc tưởng căng đét bốn vạch, vừa quay lưng đã mất tín hiệu!`,
      `Đường tình ứng thế ${loveMain}: lúc sục sạo tìm kiếm thì chẳng thấy bóng ma nào, lúc đầu bù tóc rối không phòng bị lại đụng ngay duyên lạ!`,
      `Khí sắc tình cảm (${loveMain}): mấy mối hào nhoáng phông bạt chẳng giữ chân bồ nổi ba bữa, chỉ hợp người lầm lì thực tế nói ít làm nhiều thôi!`,
    ];
  }
  const loveIntro = loveIntroPool[(daySeed + tuviSeenMemory.love.size) % loveIntroPool.length];
  const loveDaily = pickUnseenFromPool(TUVI_LOVE_DAILY_100, daySeed, 'love');

  // --- FINANCE ROASTS (Personalized by DOB stars + 100 Sassy Daily Readings) ---
  let moneyIntroPool = [];
  if (taiBachPalace.mainStars.some((s) => ['Vũ Khúc', 'Thiên Phủ', 'Thái Âm'].includes(s)) || moneyAux.includes('Lộc Tồn') || moneyAux.includes('Hoá Lộc')) {
    moneyIntroPool = [
      `Cung Tài Bạch toạ ${moneyMain}: số có lộc giữ mình không bao giờ đứt bữa, khổ nỗi hễ mắt liếc thấy chữ “giảm sốc nửa đêm” là não tài chính tự động sập nguồn!`,
      `Sao tài lộc ${moneyMain} chiếu ví: ngoài mặt chúa hay than nghèo kể khổ phòng thân, chứ thực chất luôn giấu quỹ đen ngầm kỹ hơn mèo giấu cứt!`,
      `Vía tiền bạc từ ${moneyMain}: tay làm ra tiền nhạy bén có hạng, chỉ cần dẹp tật rinh đồ giảm giá về nhét chật tủ nguyên mác là giàu sụ từ lâu rồi!`,
    ];
  } else if (taiBachPalace.mainStars.some((s) => ['Phá Quân', 'Thất Sát', 'Tham Lang'].includes(s)) || moneyAux.includes('Địa Không') || moneyAux.includes('Địa Kiếp')) {
    moneyIntroPool = [
      `Cung Tài Bạch đóng ${moneyMain}: cày tiền đổ mồ hôi sôi nước mắt mà lúc quẹt thẻ mang phong thái con cưng tỷ phú dầu mỏ — ví chưa kịp ấm đã bay vì câu “đời sống mấy tý”!`,
      `Thế sao ${moneyMain} cung Tài: tiền đổ về từng chập hoành tráng rồi cũng bốc hơi nhanh như cồn vì cái nết sĩ diện hay giành trả chầu cho thiên hạ!`,
      `Mệnh tài chính ứng ${moneyMain}: hợp đánh nhanh thắng lớn, nhưng lương vừa về mà không khoá ngay một phần ba vô két sắt là mùng mười đã thở oxy!`,
    ];
  } else if (taiBachPalace.mainStars.some((s) => ['Cự Môn', 'Thiên Cơ', 'Thiên Đồng', 'Liêm Trinh'].includes(s))) {
    moneyIntroPool = [
      `Cung Tài Bạch hội ${moneyMain}: lập bảng quản lý chi tiêu trên máy tính nhìn chuyên nghiệp như giám đốc tài chính, bước ra đường buồn miệng lại chốt đơn thủng cả đáy bóp!`,
      `Sao ${moneyMain} kiếm tiền bằng chất xám và cái miệng sắc lẹm: đầu tỉnh thì tiền đầy, cứ thức đêm tự suy rồi mua sắm giải khuây là toang sạch!`,
      `Túi tiền mang khí ${moneyMain}: số tay làm hàm nhai bằng thực lực, đừng có mơ mộng mấy trò may rủi ngồi mát ăn bát vàng kẻo mất cả chì lẫn chài!`,
    ];
  } else {
    moneyIntroPool = [
      `Cung Tài Bạch (${moneyMain}): đồng tiền vô cửa trước cứ thích lượn lờ dạo mát ra cửa sau, hễ để dành được một cục là có chuyện trời ơi đất hỡi bắt chi!`,
      `Thế cung Tài (${moneyMain}): ôm khư khư một nguồn thu dễ dậm chân tại chỗ, chịu khó bung nghề tay trái đúng sở trường lại hốt bạc ngon ơ!`,
      `Vận túi tiền (${moneyMain}): cơ hội kiếm chác không thiếu, chỉ cần cứng mặt từ chối mấy kèo đóng góp xã giao vô bổ là tài khoản xanh mướt ngay!`,
    ];
  }
  const moneyIntro = moneyIntroPool[(daySeed * 5 + tuviSeenMemory.money.size) % moneyIntroPool.length];
  const moneyDaily = pickUnseenFromPool(TUVI_MONEY_DAILY_100, daySeed * 7 + 13, 'money');
  const darkDecree = pickUnseenFromPool(TUVI_DECREES_100, daySeed * 11 + 29, 'decree');

  const loveScore = 42 + (daySeed * 7) % 51; // 42..92
  const moneyScore = 38 + (daySeed * 11) % 55; // 38..92

  return {
    loveScore,
    moneyScore,
    loveBadge: `💘 Chỉ số Tình Duyên hôm nay: ${loveScore}/100`,
    loveText: `${loveIntro} ${loveDaily}`,
    moneyBadge: `💰 Chỉ số Tài Chính hôm nay: ${moneyScore}/100`,
    moneyText: `${moneyIntro} ${moneyDaily}`,
    darkDecree,
  };
}
