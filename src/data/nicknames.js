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
