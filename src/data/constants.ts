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
  'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=800&q=80'
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
