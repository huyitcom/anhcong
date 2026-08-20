import { PosterSettings, TemplateDefinition, TextConfig } from '../types';

export const SAMPLE_WEDDING_PHOTOS = [
  'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1529636798458-92182e662485?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1532712938310-34cb3982ef74?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1544078751-58fee2d8a03b?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1524824267900-2fa9cbf7a506?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1587271407850-8d438ca9fdf2?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1591604466107-ec97de577aff?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1509927083803-4bd519298ac4?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=800&q=80'
];

export const TEMPLATES: TemplateDefinition[] = [
  {
    id: 'classic-10',
    name: 'Mẫu 10 Khung Classic (Centered Text)',
    description: '10 khung ảnh bố cục bao quanh cụm chữ trung tâm nghệ thuật',
    slotCount: 10,
    aspectRatio: '2:3'
  },
  {
    id: 'hero-mosaic-13',
    name: 'Mẫu 13 Khung - Hero & Mosaic 4x3 (Love Trip)',
    description: '1 ảnh lớn phía trên, 12 ảnh nhỏ lưới 4x3 ở giữa và cụm chữ nghệ thuật Love Trip sang trọng phía dưới',
    slotCount: 13,
    aspectRatio: '2:3'
  },
  {
    id: 'editorial-5',
    name: 'Mẫu 5 Khung - Tạp Chí Nghệ Thuật (Editorial Love)',
    description: 'Phong cách bìa tạp chí Hàn Quốc với 2 ảnh bên trái lồng chữ nghệ thuật và 3 ảnh xếp dọc bên phải',
    slotCount: 5,
    aspectRatio: '2:3'
  },
  {
    id: 'asymmetric-6',
    name: 'Mẫu 6 Khung So Le Cụm Chữ Dưới (Warm Romantic)',
    description: '6 khung ảnh bố cục so le nghệ thuật, phần tên dâu rể & Save the Date viết cách điệu phía dưới',
    slotCount: 6,
    aspectRatio: '2:3'
  },
  {
    id: 'love-banner-8',
    name: 'Mẫu 8 Khung Chữ L-O-V-E Cắt Lồng (Love Banner)',
    description: '8 khung ảnh xếp tầng kết hợp chữ L-O-V-E cắt lồng nghệ thuật ở khoảng giữa các khung',
    slotCount: 8,
    aspectRatio: '2:3'
  },
  {
    id: 'heart-mosaic-18',
    name: 'Mẫu Trái Tim Mosaic (Dear Love...)',
    description: 'Bố cục khung ảnh xếp hình trái tim nghệ thuật quanh bức ảnh cưới trung tâm',
    slotCount: 19,
    aspectRatio: '2:3'
  },
  {
    id: 'landscape-trio-10',
    name: 'Mẫu Ngang 10 Khung - Song Hero & Lưới Giữa (Forest Romance)',
    description: 'Bố cục ngang 90x60 cm: 2 ảnh chân dung lớn 2 bên, ở giữa là lưới 8 ảnh nhỏ (2x4) kèm chữ nghệ thuật trên ảnh',
    slotCount: 10,
    aspectRatio: '3:2'
  },
  {
    id: 'landscape-duo-6',
    name: 'Mẫu Ngang 6 Khung - Duo Trái & Lưới 2x2 (You Make My Heart Happy)',
    description: 'Bố cục ngang 90x60 cm: 2 ảnh xếp dọc bên trái, bên phải là cụm chữ thiệp cưới lãng mạn cùng lưới 4 ảnh (2x2)',
    slotCount: 6,
    aspectRatio: '3:2'
  },
  {
    id: 'landscape-story-8',
    name: 'Mẫu Ngang 8 Khung - Big Hero & Lưới Phải (Enjoy The Now)',
    description: 'Bố cục ngang 90x60 cm: 1 ảnh lớn chiếm 2/3 khung hình bên trái có tiêu đề phía trên, bên phải là lưới 7 ảnh nhỏ cùng huy hiệu trái tim Love forever',
    slotCount: 8,
    aspectRatio: '3:2'
  },
  {
    id: 'landscape-london-11',
    name: 'Mẫu Ngang 11 Khung - Panorama Magazine Collage (London Trip)',
    description: 'Bố cục ngang 90x60 cm: 11 khung ảnh phong cách tạp chí du lịch lãng mạn, ảnh tháp Big Ben trung tâm lồng chữ Love Trip',
    slotCount: 11,
    aspectRatio: '3:2'
  }
];

export const DEFAULT_TEXT_CONFIG: TextConfig = {
  tagline: 'SAVE THE DATE',
  taglineFont: 'Montserrat',
  taglineFontSize: 18,
  taglineColor: '#1c1917',
  taglineLetterSpacing: 4,

  dateText: '10.06\n2024',
  dateFont: 'Bodoni Moda',
  dateFontSize: 58,
  dateColor: '#1c1917',
  dateLetterSpacing: 1,

  groomName: 'TUẤN ANH',
  brideName: 'BẢO NGỌC',
  connector: 'and',
  namesFont: 'Bodoni Moda',
  connectorFont: 'Great Vibes',
  namesFontSize: 24,
  namesColor: '#1c1917',

  subtext: 'Rất hân hạnh được đón tiếp quý khách',
  subtextFont: 'Plus Jakarta Sans',
  subtextFontSize: 13,
  subtextColor: '#57534e',

  textAlign: 'center',
  textUppercase: true
};

export const DEFAULT_POSTER_SETTINGS: PosterSettings = {
  bgColor: '#ffffff',
  bgPattern: 'solid',
  gap: 6,
  outerMargin: 16,
  cornerRadius: 0,
  borderStyle: 'none',
  borderColor: '#d6d3d1',
  aspectRatio: '2:3'
};

export const FONT_OPTIONS = [
  { name: 'Bodoni Moda (Sang trọng)', family: 'Bodoni Moda' },
  { name: 'Playfair Display (Thơ mộng)', family: 'Playfair Display' },
  { name: 'Cinzel (Cổ điển)', family: 'Cinzel' },
  { name: 'Cormorant Garamond (Tinh tế)', family: 'Cormorant Garamond' },
  { name: 'Montserrat (Hiện đại & Sắc nét)', family: 'Montserrat' },
  { name: 'Great Vibes (Chữ viết tay bay bổng)', family: 'Great Vibes' },
  { name: 'Alex Brush (Chữ mềm mại)', family: 'Alex Brush' },
  { name: 'Dancing Script (Nghệ thuật)', family: 'Dancing Script' },
  { name: 'Pinyon Script (Chữ viết Quý tộc)', family: 'Pinyon Script' },
  { name: 'Plus Jakarta Sans (Hiện đại dễ đọc)', family: 'Plus Jakarta Sans' }
];

export const COLOR_PRESETS = [
  { name: 'Đen Tuyền (Classic Black)', value: '#1c1917' },
  { name: 'Nâu Trầm (Warm Charcoal)', value: '#292524' },
  { name: 'Vàng Đồng (Rose Gold / Bronze)', value: '#b45309' },
  { name: 'Đỏ Đô Wedding (Wine Red)', value: '#881337' },
  { name: 'Xanh Navy (Royal Blue)', value: '#1e3a8a' },
  { name: 'Xanh Rêu (Emerald Sage)', value: '#065f46' },
  { name: 'Trắng Sữa (Soft White)', value: '#f8fafc' },
];

export const BG_PRESETS = [
  { name: 'Trắng Sạch (Pure White)', value: '#ffffff' },
  { name: 'Trắng Kem (Warm Ivory)', value: '#fbf9f5' },
  { name: 'Màu Giấy Lụa (Soft Linen)', value: '#f5f3ef' },
  { name: 'Hồng Phấn Lãng Mạn (Blush Pink)', value: '#fdf2f8' },
  { name: 'Xanh Bạc Hà Nhẹ (Soft Sage)', value: '#f0fdf4' },
  { name: 'Đen Sang Trọng (Luxe Black)', value: '#18181b' },
];

export const PHOTO_FILTERS = [
  { id: 'none', name: 'Gốc (Original)', css: 'none' },
  { id: 'warm', name: 'Nắng Ấm (Warm Sun)', css: 'sepia(0.2) contrast(1.05) saturate(1.15) brightness(1.02)' },
  { id: 'vintage', name: 'Film Cổ Điển (Vintage Film)', css: 'sepia(0.35) contrast(0.95) brightness(1.05) hue-rotate(-10deg)' },
  { id: 'bw', name: 'Trắng Đen (Classic B&W)', css: 'grayscale(1) contrast(1.1) brightness(1.02)' },
  { id: 'airy', name: 'Tươi Sáng (Bright & Airy)', css: 'brightness(1.1) contrast(0.95) saturate(1.05)' },
  { id: 'dramatic', name: 'Nghệ Thuật High-Key', css: 'contrast(1.2) saturate(1.2)' },
];
