export const NICKNAMES = [
  '🧙 Phù Thuỷ Trốn Họp',
  '🕯️ Phù Thuỷ Hắc Hoả',
  '📜 Bùa Chú Tan Ca',
  '🧹 Chổi Thần Cuối Tuần',
  '🐸 Ếch Sô-Cô-La',
  '✨ Học Trò Cưng Dobby',
  '🌙 Phù Thuỷ Gác Trăng',
  '🍵 Trà Thảo Dược Nóng',
  '💎 Kho Báu Gringotts',
  '🪶 Bút Lông Tự Viết',
  '🧦 Thánh Săn Tất Lẻ',
  '🔮 Pháp Sư Hệ Tâm Linh',
  '🦊 Hồ Ly Trốn Deadline',
  '🍄 Nấm Độc Ngủ Trưa',
  '⚡ Tia Chớp Đúng Giờ',
  '🐈‍⬛ Mèo Đen Ngồi Thiền',
  '🧋 Giả Kim Trà Sữa',
  '🪐 Tinh Tú Lạc Đường',
  '🔥 Hoả Tinh Dỗi Việc',
  '🌿 Dược Sư Hệ Chill',
  '🦉 Cú Đêm Săn Lộc',
  '🎭 Ảo Thuật Gia Mỏ Hỗn',
  '🍯 Mật Ong Rừng Cấm',
  '🗝️ Thủ Kho Hầm Vàng',
  '🎐 Chuông Gió Tịnh Tâm',
  '🐉 Tiểu Long Ngái Ngủ',
  '🍪 Bánh Quy Tiên Tri',
  '🌌 Kẻ Gác Sao Đêm',
  '🧿 Bùa Hộ Mệnh Vàng',
  '🎩 Mũ Phân Loại Ngơ',
  '🦢 Thiên Nga Đầm Lầy',
  '🕯️ Nến Thơm Giải Nghiệp',
  '📖 Học Giả Quên Bài',
  '🧪 Lọ Thuốc May Mắn',
  '🌩️ Phù Thuỷ Gọi Mưa',
  '🪙 Đồng Vàng Biết Bay',
  '🪷 Liên Hoa Thoát Tục',
  '🦊 Cáo Nhỏ Đeo Khăn',
  '🌠 Sao Băng Cuối Tháng',
  '🍵 Đạo Sĩ Uống Matcha',
  '🪄 Đũa Phép Full Pin',
  '🐢 Thần Quy Chậm Đãi',
  '🎃 Bí Ngô Biết Cười',
  '❄️ Phù Thuỷ Băng Giá',
  '🌻 Hướng Dương Đón Nắng',
  '🦋 Hồ Điệp Mộng Mơ',
  '🪵 Tiểu Đồng Gõ Mõ',
  '🏮 Đèn Lồng Phố Cổ',
  '🥐 Phù Thuỷ Bánh Sừng',
  '🎧 Pháp Sư Đeo Tai Nghe',
  '🛸 Khách Lạ Hẻm Xéo',
  '🐾 Thần Thú Đi Dạo',
  '🍀 Cỏ Bốn Lá Phép',
  '🔥 Lửa Thiêng Xả Xui',
  '🧊 Tinh Thể Bạc Hà',
  '🎐 Đạo Hữu Ngồi Đệm',
  '🌙 Nguyệt Quang Tự Do',
  '🧦 Sứ Giả Tất Thơm',
  '🍯 Phù Thuỷ Kẹo Bơ',
  '⚡ Đạo Sĩ Né Task',
  '🔮 Thầy Bói Tập Sự',
  '🧹 Tay Đua Chổi Bay',
  '🍵 Tiên Nhân Thưởng Trà',
  '💎 Quý Tộc Hầm Ngầm',
];

const RESERVED_AI_NAMES = new Set([
  '🦉 Cú Mèo Đưa Thư',
  '🧪 Độc Dược Trà Đào',
  '🔮 Tiên Tri Ngủ Gật',
  '🍺 Bia Bơ Ba Chổi',
  '🧦 Hội Trưởng Tất Rách',
  '🪄 Đũa Phép Gãy Ngọn',
]);

const DYNAMIC_PREFIXES = [
  '🧙 Phù Thuỷ',
  '🔮 Pháp Sư',
  '✨ Đạo Hữu',
  '🌙 Học Giả',
  '🧹 Kỵ Sĩ',
  '🕯️ Thuật Sĩ',
  '🧦 Sứ Giả',
  '🍵 Tiên Nhân',
  '🦊 Linh Hồ',
  '⚡ Cao Thủ',
];

const DYNAMIC_SUFFIXES = [
  'Trốn Việc',
  'Hệ Chill',
  'Săn Lộc',
  'Ngồi Thiền',
  'Gác Đêm',
  'Mê Ngủ',
  'Xả Xui',
  'Tự Do',
  'Đón Nắng',
  'Thích Trà',
  'Né Bug',
  'Giữ Ví',
];

export const WIZARD_PALETTES = [
  // Hắc Hoả Lục Bảo (Mystic Emerald & Midnight Violet)
  { hat: '#26173E', cloak: '#342056', scarf: '#10B981', hair: '#4A2E1B', glow: '#6EE7B7' },
  // Đỏ Sư Tử Ánh Vàng (Crimson Lion & Gold)
  { hat: '#631325', cloak: '#7F1D32', scarf: '#F59E0B', hair: '#5A3826', glow: '#FDE047' },
  // Xanh Tinh Vân Ánh Đồng (Astral Sapphire & Sky)
  { hat: '#172554', cloak: '#1E3A8A', scarf: '#38BDF8', hair: '#2C1E18', glow: '#93C5FD' },
  // Mật Ong Thảo Dược (Warm Badger Umber & Buttercup)
  { hat: '#3B2516', cloak: '#4E321F', scarf: '#FACC15', hair: '#9A6B3B', glow: '#FEF08A' },
  // Tím Tiên Tri Hoa Hồng (Divination Plum & Rose)
  { hat: '#3B0764', cloak: '#581C87', scarf: '#F472B6', hair: '#3E2723', glow: '#F9A8D4' },
  // Rừng Cấm Ngọc Bích (Forbidden Pine & Amber)
  { hat: '#064E3B', cloak: '#065F46', scarf: '#FBBF24', hair: '#6D4C41', glow: '#6EE7B7' },
];

export const BOW_BLESSINGS = [
  '+1 Phước Tự Do ✨ Bùa ẩn thân khỏi sếp giao thêm task!',
  '+1 Phước Tự Do 🧦 Deadline tự biến hình lùi sang tuần sau!',
  '+1 Phước Tự Do 🕯️ Hắc Hoả đốt sạch bug khó nhằn!',
  '+1 Phước Tự Do 🧪 Chiều nay có đồng môn khao trà đào!',
  '+1 Phước Tự Do 🪄 Đúng 5h30 cưỡi chổi về nhà nhẹ tênh!',
  '+1 Phước Tự Do 💎 Hầm vàng Gringotts đầy ắp cuối tháng!',
];

export const BOW_TOASTS = [
  'vừa cúi chào Giáo Chủ Dobby cầu bồ chiều nay tan làm đúng 5h!',
  'vừa khấn Giáo Chủ Dobby chúc bồ chạy code một phát ăn ngay!',
  'vừa cúi chào Giáo Chủ Dobby cầu bồ ngủ ngon không mộng mị!',
  'vừa rung chuông gió phép thuật chúc bồ tuần này không họp đột xuất!',
];

export function randomItem(list) {
  return list[Math.floor(Math.random() * list.length)];
}

/**
 * Pick a random wizard nickname on every join / reroll, avoiding excluded names
 * (such as the previous session nickname, current nickname, or active peers in the room).
 */
export function generateRandomNickname(excludeNames = []) {
  const excluded = new Set([...RESERVED_AI_NAMES, ...excludeNames.filter(Boolean)]);

  // Build combined pool of curated + dynamic nicknames so every user gets fresh variety
  const dynamicPool = [];
  for (const p of DYNAMIC_PREFIXES) {
    for (const s of DYNAMIC_SUFFIXES) {
      dynamicPool.push(`${p} ${s}`);
    }
  }

  const fullPool = Array.from(new Set([...NICKNAMES, ...dynamicPool])).filter(
    (name) => !excluded.has(name),
  );

  if (fullPool.length > 0) {
    return randomItem(fullPool);
  }

  const tag = Math.floor(100 + Math.random() * 900);
  return `${randomItem(DYNAMIC_PREFIXES)} #${tag}`;
}
