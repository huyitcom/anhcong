export interface BackgroundTemplate {
  id: string;
  name: string;
  name_vn: string;
  thumbnailUrl: string;
  prompt: string;
  category?: 'wedding-arch' | 'indoor-studio' | 'nature-outdoor' | 'art-luxury';
}

export const BACKGROUND_CATEGORIES = [
  { id: 'all', name: 'Tất cả mẫu' },
  { id: 'wedding-arch', name: 'Cổng hoa' },
  { id: 'indoor-studio', name: 'Indoor' },
  { id: 'nature-outdoor', name: 'Ngoại cảnh' },
  { id: 'art-luxury', name: 'Nghệ thuật' },
];

export const MASTER_PROMPT_TEMPLATE = `ROLE: Professional Photo Editor and High-End Wedding Photographer.
TASK:
Replace ONLY the background of the uploaded image with the specified new environment.
Before editing, FIRST analyze the original image and determine the subject's existing photographic framing and visible body extent.
This is a BACKGROUND REPLACEMENT task, NOT a body reconstruction, pose reconstruction, or subject generation task.
==================================================
FIRST: ANALYZE THE ORIGINAL SUBJECT FRAMING
==================================================
Before generating the final image, visually analyze the uploaded image and classify the original composition into ONE of these categories:
A. CLOSE-UP / HEAD-AND-SHOULDERS PORTRAIT
Head and shoulders are primarily visible.
Chest is partially visible or barely visible.
No waist or lower body is visible.
B. HALF-BODY / MEDIUM PORTRAIT
Subject is visible approximately from chest, torso, or waist upward.
Lower body is not visible.
C. THREE-QUARTER PORTRAIT
Subject is visible approximately from mid-thigh, knees, or upper legs upward.
Some lower body is visible, but the complete body is not shown.
D. FULL-BODY PHOTOGRAPH
The subject is visibly photographed from head to feet.
Legs, feet and shoes are clearly visible within the original frame.
IMPORTANT:
Determine the category from what is ACTUALLY VISIBLE in the uploaded image.
Do NOT assume that every wedding photograph is full-body.
Do NOT create missing body parts to satisfy a composition.
Do NOT extend the original image downward.
Do NOT invent legs, feet, shoes, dress length or lower body if they are not visible in the original image.
==================================================
2. ADAPTIVE COMPOSITION RULE
After determining the original framing, automatically choose the appropriate final composition.
IF A = CLOSE-UP / HEAD-AND-SHOULDERS
Create a professional close-up wedding portrait.
Keep the subject framed approximately as in the original image.
Show only the head, shoulders and the amount of upper body already visible in the original photograph.
Do NOT reveal or generate the waist, hips, legs or feet.
Use the new environment strictly as a luxurious portrait background.
The background should be significantly blurred with realistic optical bokeh.
The architectural elements, flowers, trees and decorations should remain recognizable but softly out of focus.
No large floor, lawn or foreground environment should dominate the image.
The subjects must remain sharply focused.
Use an approximately 85mm–105mm portrait lens aesthetic with a wide aperture around f/1.8–f/2.8.
IF B = HALF-BODY / MEDIUM PORTRAIT
Create a professional medium or waist-up wedding portrait.
Preserve approximately the same visible body extent as the original image.
Do NOT extend the body below the original visible area.
Do NOT generate legs, feet, shoes or additional dress length if they are not visible.
Use the new environment as a sophisticated portrait backdrop.
The background should be softly blurred with realistic shallow depth of field and creamy bokeh.
Keep the couple sharply focused.
The architectural elements, flowers and greenery should be visible enough to communicate the location but should not compete with the subjects.
Use an approximately 85mm–105mm portrait lens aesthetic with a wide aperture around f/1.8–f/2.8.
IF C = THREE-QUARTER PORTRAIT
Create a refined three-quarter wedding portrait.
Preserve the original visible body extent.
Do NOT extend the subjects into a full-body composition.
Show approximately the same amount of lower body that is already visible in the original image.
Use a moderately shallow depth of field.
The new environment should be recognizable and elegant, but remain softer than the subjects.
The background may show more architectural context, flowers, garden elements and floor or lawn, but these elements must not dominate the composition.
Use a natural portrait photography perspective, approximately 70mm–105mm.
IF D = FULL-BODY PHOTOGRAPH
Create a professional full-body wedding photograph.
Preserve the complete visible body of the subject exactly as shown in the original image.
Keep the head, torso, legs, feet, shoes, wedding dress, dress train and all visible clothing within the composition.
DO NOT crop out the feet.
DO NOT transform the photograph into a waist-up portrait.
DO NOT remove the lower body.
The new background should function as a complete environmental setting.
Show appropriate architectural context, garden, floor, lawn, staircase or other environmental elements according to the specified background.
Use realistic depth and perspective.
The background may be moderately detailed and moderately sharp, while the subjects remain the strongest visual focus.
Use an approximately 35mm–70mm professional wedding photography perspective depending on the original composition.
Create realistic contact shadows beneath the feet and dress.
==================================================
3. CRITICAL RULE: NEVER INVENT BODY PARTS
The original subject is immutable.
Use ONLY the body parts that are actually visible in the uploaded image.
If a body part is outside the original frame, it must remain outside the final frame.
NEVER reconstruct or hallucinate:
legs
feet
shoes
hips
lower torso
additional arms
additional hands
additional fingers
additional dress length
wedding dress train
If the original image is cropped at the waist, keep it cropped at approximately the waist.
If the original image is cropped at the chest, keep it cropped at approximately the chest.
If the original image is full-body, preserve the full body.
The final framing must be determined by the ORIGINAL SUBJECT FRAMING, not by the background.
==================================================
4. SUBJECT PRESERVATION — HIGHEST PRIORITY
Preserve the original subject exactly as provided.
Do NOT change:
identity
facial features
face shape
eyes
nose
mouth
facial expression
hairstyle
hairline
skin tone
skin texture
body proportions
body shape
pose
posture
hand position
fingers
bouquet
jewelry
accessories
clothing
wedding dress
suit
shoes
dress train
all visible original details
Do NOT:
regenerate the face
beautify the face
reshape the face
slim the body
enlarge the body
alter body proportions
change the pose
change the posture
redesign clothing
redesign the wedding dress
redesign the suit
modify the bouquet
The subjects must remain clearly recognizable as the exact people from the uploaded image.
==================================================
5. SUBJECT EXTRACTION
Precisely isolate the original subjects from the original background.
Preserve natural edges around:
hair
individual hair strands
ears
face
shoulders
arms
hands
fingers
clothing
bouquet
jewelry
dress
suit
Remove all remnants of the original background.
Do not create artificial cutout edges.
Do not allow the new background to leak through the subjects.
Do not place flowers, branches, columns, furniture or architectural elements through or over the subjects.
==================================================
6. NEW BACKGROUND
Replace the original background with:
[INSERT BACKGROUND DESCRIPTION HERE]
The new background must be adapted to the subject framing automatically.
For portrait images:
Treat the environment as a luxurious photographic backdrop.
Keep the background softly blurred and visually subordinate to the subjects.
For three-quarter images:
Show enough environmental context to establish the location while maintaining portrait-oriented depth of field.
For full-body images:
Show the environment as a complete wedding setting with appropriate floor, lawn, architecture and spatial depth.
Do NOT force the same background composition onto every type of photograph.
==================================================
7. BACKGROUND DEPTH OF FIELD
Depth of field MUST adapt to the original subject framing.
For CLOSE-UP and HALF-BODY portraits:
strong background separation
shallow depth of field
creamy optical bokeh
soft architectural details
blurred flowers and foliage
blurred distant structures
subjects sharply focused
For THREE-QUARTER portraits:
moderate background blur
recognizable architectural details
natural portrait depth
For FULL-BODY photographs:
moderate environmental depth of field
enough background detail to establish the location
realistic perspective and spatial depth
subjects remain the primary visual focus
The background must NEVER be sharper than the subjects.
==================================================
8. LIGHTING INTEGRATION
Match the subjects naturally to the new environment.
Preserve the original facial appearance and physical details.
Do NOT repaint or regenerate the face.
Only apply subtle global compositing adjustments required for realistic integration.
Match:
light direction
exposure
color temperature
ambient illumination
contrast
highlights
shadows
subtle rim light
environmental bounce light
Create realistic contact shadows where physically appropriate.
The result must look as though the subjects were actually photographed in the new environment.
==================================================
9. CAMERA AND PERSPECTIVE
Match the new environment to the original subject photograph.
Maintain physically consistent:
camera height
camera angle
focal length
perspective
subject scale
horizon line
depth
vanishing points
Do NOT use an exaggerated wide-angle perspective for portrait images.
Do NOT distort facial proportions.
Do NOT make the subjects appear pasted onto the background.
==================================================
10. COMPOSITION PRIORITY
The PRIORITY ORDER is:
Preserve the original subjects.
Preserve the original visible body extent.
Preserve the original pose and proportions.
Determine the appropriate photographic framing from the original image.
Replace only the background.
Adapt the background depth of field to the framing.
Harmonize lighting, perspective and color.
Create a realistic professional photograph.
NEVER allow the background requirements to override the original subject framing.
==================================================
11. STRICT NEGATIVE CONSTRAINTS
NO body reconstruction.
NO body extension.
NO invented legs.
NO invented feet.
NO invented shoes.
NO invented dress train.
NO additional body parts.
NO full-body conversion when the original is a portrait.
NO portrait conversion when the original is clearly full-body.
NO automatic zooming out.
NO automatic zooming in unless necessary for natural composition.
NO pose change.
NO posture change.
NO identity change.
NO face regeneration.
NO facial alteration.
NO body reshaping.
NO slimming.
NO beautification.
NO clothing alteration.
NO bouquet alteration.
NO duplicated subjects.
NO extra people.
NO distorted hands.
NO extra fingers.
NO missing fingers.
NO warped clothing.
NO objects intersecting the subjects.
NO flowers covering the faces.
NO branches passing through the bodies.
NO columns passing through the subjects.
NO artificial cutout edges.
NO pasted-on appearance.
NO CGI appearance.
NO illustration.
NO text.
NO logo.
NO watermark.
==================================================
12. FINAL OUTPUT
Generate ONE photorealistic professional wedding photograph.
The final composition must automatically correspond to the original subject framing:
CLOSE-UP → close-up portrait + blurred background.
HALF-BODY → waist-up / medium portrait + blurred background.
THREE-QUARTER → three-quarter portrait + moderately blurred environment.
FULL-BODY → full-body wedding photograph + complete environmental background.
Do not force one composition onto all images.
The original subject always determines the final framing.
Only the background changes.
The subjects remain exactly as photographed.
The final result must look like a genuine professional wedding photograph captured in the specified environment.`;

export function createMasterPrompt(backgroundDescription: string): string {
  return MASTER_PROMPT_TEMPLATE.replace(
    '[INSERT BACKGROUND DESCRIPTION HERE]',
    backgroundDescription.trim()
  );
}

export const backgroundTemplates: BackgroundTemplate[] = [
  {
    id: 'floral-arch-door',
    name: 'Floral Arch Doorway',
    name_vn: 'Cổng hoa',
    thumbnailUrl: 'https://www.photobookvietnam.net/app/images/background1.jpg',
    category: 'wedding-arch',
    prompt: createMasterPrompt(
      'A magnificent, ornate arched doorway of a stately building, lavishly adorned with a voluminous floral garland. The garland features a romantic blend of lush blush pink garden roses, smaller spray roses, and large, fluffy creamy white dahlias, interspersed with rich, dark green foliage (such as eucalyptus or ferns). The floral arrangement follows the entire arch, extending generously down both sides of the entrance, and culminates in two large, symmetrical floral arrangements flanking the base of the doorway. The doorway itself consists of double, dark, rich brown wooden doors with intricate carved panels and classic dark metal door handles/knobs. The arch is framed by light-colored stone or stucco, suggesting classic architectural details. The ground in front is a natural stone pathway, gently scattered with creamy white and pale pink rose petals. A few delicate petals appear to be floating or falling in the air, adding a whimsical touch. The scene is bathed in bright, soft natural daylight, creating gentle highlights and shadows that enhance texture and depth. The overall aesthetic is romantic, elegant, luxurious, and inviting.'
    ),
  },
  {
    id: 'grand-window-room',
    name: 'Grand Window Room',
    name_vn: 'Phòng cửa sổ lớn',
    thumbnailUrl: 'https://www.photobookvietnam.net/app/images/background2.jpg',
    category: 'indoor-studio',
    prompt: createMasterPrompt(
      'A grand, elegantly lit interior hall with a pristine, bright aesthetic. The central focus is positioned directly in front of a vast, ornate arched window. This window features intricate leaded glass detailing in the upper fanlight section, with multiple clear panes below, allowing abundant natural light to flood the space. The window is flanked by classical fluted columns with detailed golden Corinthian capitals, all set within a beautifully molded archway. The walls are smooth, rendered in a pristine palette of creamy white, ivory, and soft beige tones. The polished floor, also in light cream or white, reflects the bright light, creating a luminous and expansive feel. Sunlight streams through the window, casting soft, elongated shadows and bright highlights on the floor and architecture. The overall atmosphere is one of serene grandeur, classical elegance, and bright sophistication, reminiscent of a luxurious event space or neo-classical palace.'
    ),
  },
  {
    id: 'double-happiness',
    name: 'Double Happiness',
    name_vn: 'Song Hỷ',
    thumbnailUrl: 'https://www.photobookvietnam.net/app/images/background4.jpg',
    category: 'wedding-arch',
    prompt: createMasterPrompt(
      'A large, central three-dimensional structure of "double happiness" (囍) symbol is meticulously wrapped in rich, deep red satin fabric. The fabric exhibits elegant, soft folds and subtle creases, creating a luxurious, slightly ruffled texture and enhancing its three-dimensionality. Two vibrant floral arrangements adorn this red structure: one is positioned at its top-left, and the other at its bottom-right. Each arrangement features a lavish mix of crimson and scarlet flowers (such as small poinsettias or wild strawberries), delicate white or cream blossoms (like jasmine or tiny apple blossoms), clusters of bright red berries, and abundant dark green pine-like foliage. Numerous individual red flower petals are scattered throughout the scene, some gently floating in the mid-air around the central red form, and a higher concentration softly resting on the ground in the bottom half of the frame. The background is a clean, warm, and uniform light beige or off-white, providing a neutral canvas that makes the red and green elements pop. The lighting is soft, diffuse, and even, casting gentle shadows that define the contours of the fabric-wrapped form.'
    ),
  },
  {
    id: 'pink-heart-garden',
    name: 'Pink heart garden',
    name_vn: 'Trái tim hồng',
    thumbnailUrl: 'https://www.photobookvietnam.net/app/images/background5.jpg',
    category: 'nature-outdoor',
    prompt: createMasterPrompt(
      'A breathtaking, romantic landscape designed to embody the essence of love and devotion, perfect for a romantic wedding setting. The scene is set in a vast field of delicate pink cherry blossoms, with soft petals gently swaying in the breeze. The entire landscape is immersed in a romantic pink hue, with rolling hills and distant mountains in the background, adding depth to the composition. The sky is a brilliant azure blue, scattered with fluffy white clouds, illuminated by the golden rays of the sun, casting a warm, ethereal glow over the scenery. At the center, a magnificent floral heart sculpture made entirely of vibrant pink blossoms stands as a grand centerpiece. The heart is adorned with delicate white butterflies, their wings shimmering in the sunlight as they flutter gracefully in the air. The foreground is filled with blooming rose bushes and cherry blossom branches.'
    ),
  },
  {
    id: 'metallic-black',
    name: 'Metallic black',
    name_vn: 'Nền đen kim tuyến',
    thumbnailUrl: 'https://www.photobookvietnam.net/app/images/background6.jpg',
    category: 'art-luxury',
    prompt: createMasterPrompt(
      'A dramatic and deep sense of space. A powerful, defined, and volumetric light ray originates from the top-center, extending downwards and slightly fanning out, dramatically cutting through the scene and illuminating floating particles. The bottom third of the image is dominated by a dense, horizontal band of finely textured, glowing golden and silver glitter, resembling a magical ground or reflective surface. The mid-ground is densely filled with numerous bokeh circles and sparkling particulate matter, varying significantly in size from large, soft-focus spheres to tiny, pinprick glimmers. Rich, deep obsidian black background with enchanting golden bokeh illumination.'
    ),
  },
  {
    id: 'mistery-black',
    name: 'Mistery black',
    name_vn: 'Nền đen huyền ảo',
    thumbnailUrl: 'https://www.photobookvietnam.net/app/images/background7.jpg',
    category: 'art-luxury',
    prompt: createMasterPrompt(
      'A detailed, atmospheric cosmic dreamscape featuring a dramatic, ethereal beam of light originating from the top center and fanning downwards through a dark, deep indigo-blue and black starry night sky. Countless small, shimmering white and silver star-like dust particles are scattered across the entire image, appearing denser and more luminous within the celestial light beam. Some larger, brighter star glints are also present, adding depth to the starry field. The overall style is dreamy, romantic, and enchanting, with a soft, glowing ambiance.'
    ),
  },
  {
    id: 'white-ribbon',
    name: 'White ribbon',
    name_vn: 'Nơ trắng hoa',
    thumbnailUrl: 'https://www.photobookvietnam.net/app/images/background (1).jpg',
    category: 'wedding-arch',
    prompt: createMasterPrompt(
      'A beautiful, grand backdrop featuring a gigantic, luxurious fabric bow in white, adorned with small, delicate 3D appliqué pastel flowers. This bow serves as an exquisite, elegant setting for the couple, draping elegantly behind and around them without overpowering their presence. The fabric has a smooth, lustrous texture (silk, satin). The background is a seamless, high-key studio backdrop in a very light, warm off-white or cream. Delicate clusters of realistic wild-style flowers and greenery in complementary pastel tones appear on the ground plane, subtly enhancing the scene. The image is illuminated by soft, diffused, and even studio lighting that creates subtle shadows and gentle highlights.'
    ),
  },
  {
    id: 'butterfly-house',
    name: 'Butterfly house',
    name_vn: 'Ngôi nhà bươm bướm',
    thumbnailUrl: 'https://www.photobookvietnam.net/app/images/background (2).jpg',
    category: 'wedding-arch',
    prompt: createMasterPrompt(
      'Monochromatic white ethereal scene, grand neoclassical archways, abundant white flowers and branches, numerous white butterflies, soft lighting, serene, dreamy, elegant, wedding aesthetic, with a pristine reflective floor and soft atmospheric depth.'
    ),
  },
  {
    id: 'flower-butterfly',
    name: 'Flower and butterfly',
    name_vn: 'Cổng hoa và bướm',
    thumbnailUrl: 'https://www.photobookvietnam.net/app/images/background (3).jpg',
    category: 'wedding-arch',
    prompt: createMasterPrompt(
      "A multi-tiered white circular podium or stage with a backdrop of white architectural arches, creating depth and elegance. Delicate white flowering branches (resembling cherry blossoms or baby's breath) are artfully draped around and through the arches, as well as surrounding the base of the podium. Interspersed with the white flowers are clusters of light pink flowers, providing a gentle pop of color and warmth. Numerous butterflies in shades of white and soft pink are scattered throughout the scene. The lighting appears soft and even, highlighting the clean lines of the architecture and the delicate details of the flowers and butterflies."
    ),
  },
  {
    id: 'blue-sunset',
    name: 'Blue sunset',
    name_vn: 'Hoàng hôn tím',
    thumbnailUrl: 'https://www.photobookvietnam.net/app/images/background (5).jpg',
    category: 'nature-outdoor',
    prompt: createMasterPrompt(
      'A dreamy landscape featuring a large floral arch covered in purple wisteria flowers, flying butterflies, a sunset sky with purple and pink clouds, a calm reflective lake, and mountains in the background, creating a serene, magical atmosphere.'
    ),
  },
  {
    id: 'white-flower-arch',
    name: 'White flower arch',
    name_vn: 'Cổng hoa trắng',
    thumbnailUrl: 'https://www.photobookvietnam.net/app/images/background (9).jpg',
    category: 'wedding-arch',
    prompt: createMasterPrompt(
      'A breathtakingly ethereal and serene classical grand hallway stretching into the distance, lined with elegant white columns and majestic arches. The entire space is bathed in brilliant, soft, diffused light, emanating from a distant opening at the end of the hall. Abundant, delicate white blossoms cascade throughout the scene along the base of the columns and the sides of the pathway. Slender branches heavily laden with white blossoms frame the arched pathways with crisp, artistic shadows on the pale, reflective floor.'
    ),
  },
  {
    id: 'sunset-flower-arch',
    name: 'Sunset flower arch',
    name_vn: 'Cổng hoa hoàng hôn',
    thumbnailUrl: 'https://www.photobookvietnam.net/app/images/background (10).jpg',
    category: 'wedding-arch',
    prompt: createMasterPrompt(
      "A breathtaking, romantic backdrop featuring a majestic floral archway, richly adorned with lush pastel pink roses, lavender, and various purple blossoms. The background opens up to a serene, still body of water, leading to a soft, glowing horizon under a sky painted with gentle blues, purples, lavenders, and blush pinks. Numerous vibrant purple and pink butterflies flutter around the arch and above the water. Delicate blossoming tree branches extend from the top corners of the frame, and the reflective water surface mirrors the pastel hues."
    ),
  },
  {
    id: 'heaven',
    name: 'Heaven',
    name_vn: 'Thiên đường',
    thumbnailUrl: 'https://www.photobookvietnam.net/app/images/background (11).jpg',
    category: 'art-luxury',
    prompt: createMasterPrompt(
      'A magnificent, ethereal classical interior. The ground is a highly reflective white marble floor, dramatically filled with soft, billowy white cumulus clouds. In the background, three tall, arched windows look out onto a sky filled with more white clouds, allowing bright, atmospheric light and dramatic shafts of warm sunlight to stream into the room. The walls and ornate ceiling display intricate white classical plasterwork.'
    ),
  },
  {
    id: 'white-flower-arch-2',
    name: 'White flower arch II',
    name_vn: 'Cổng hoa trắng sang trọng',
    thumbnailUrl: 'https://www.photobookvietnam.net/app/images/background (12).jpg',
    category: 'wedding-arch',
    prompt: createMasterPrompt(
      "A grand, opulent archway meticulously adorned with an abundance of pristine white floral arrangements, primarily featuring dense clusters of white cherry blossoms, delicate baby's breath, and full, elegant white hydrangeas and roses, creating a lush, cascading, and voluminous effect. Numerous ethereal white and cream-colored butterflies are gracefully scattered throughout the floral arch and artfully fluttering around it. To the left, a classic off-white paneled wall with subtle architectural molding. To the right, tall arched windows with sheer translucent white curtains allow diffused, bright natural light to stream in across a seamless, luminous white floor."
    ),
  },
  {
    id: 'heaven-flower-arch',
    name: 'Heaven flower arch',
    name_vn: 'Cổng hoa thiên đường',
    thumbnailUrl: 'https://www.photobookvietnam.net/app/images/background (20).jpg',
    category: 'wedding-arch',
    prompt: createMasterPrompt(
      'A grand, classical white architectural archway, heavily adorned and overflowing with abundant, delicate white blossoms and lush, subtle green foliage. The arch is centered in the frame, serving as a majestic gateway. Beyond the arch, a vibrant, clear light blue sky with soft, wispy white clouds stretches across the background. Through the archway, a distant landscape reveals pristine white steps leading up to an elevated platform, surrounded by fields of delicate white flowers and foliage.'
    ),
  },
  {
    id: 'green-hills',
    name: 'Green Hills',
    name_vn: 'Cỏ xanh',
    thumbnailUrl: 'https://www.photobookvietnam.net/app/images/background (15).jpg',
    category: 'nature-outdoor',
    prompt: createMasterPrompt(
      "A lush, vibrant green field with softly blurred trees and foliage in the distance. The lighting is warm and soft golden hour sunlight, with gentle luminous backlighting creating an ethereal effect. The colors are dominated by vibrant greens, pristine whites, and warm natural tones."
    ),
  },
  {
    id: 'sunset-beach',
    name: 'Sunset beach',
    name_vn: 'Bãi biển hoàng hôn',
    thumbnailUrl: 'https://www.photobookvietnam.net/app/images/background (19).jpg',
    category: 'nature-outdoor',
    prompt: createMasterPrompt(
      'A serene beach at sunrise or sunset. The sky is a stunning gradient of soft blues at the top, transitioning into warm oranges, pinks, and purples towards the horizon, illuminated by a radiant, glowing sun slightly above the horizon casting a bright reflection path across the water. Fluffy, voluminous cumulus clouds catch the warm light with their undersides. Gentle ocean waves roll onto a sandy beach, leaving foamy white surf. In the immediate foreground, vibrant white and pink daisy-like flowers with green foliage are artfully arranged along the edge of the sand.'
    ),
  },
  {
    id: 'mirror-flower',
    name: 'Mirror flower',
    name_vn: 'Cổng hoa gương',
    thumbnailUrl: 'https://www.photobookvietnam.net/app/images/background%20(25).jpg',
    category: 'wedding-arch',
    prompt: createMasterPrompt(
      'A tranquil and ethereal outdoor setting with prominent classical architectural elements. The scene features two large, elegant white arched structures framing a central view. Abundant clusters of delicate white cherry blossoms with subtle green foliage are gracefully draped over and around these arches. The ground beneath is a highly reflective, polished marble water mirror surface, mirroring the blue sky, white clouds, and the white blossoms above. In the background is a bright, clear blue sky dotted with soft, fluffy white cumulus clouds.'
    ),
  },
  {
    id: 'flower-table',
    name: 'Flower table',
    name_vn: 'Vải lụa hoa',
    thumbnailUrl: 'https://www.photobookvietnam.net/app/images/background%20(26).jpg',
    category: 'wedding-arch',
    prompt: createMasterPrompt(
      'An elegant and lush wedding or event decor setup. The background features a soft, flowing backdrop of pristine white fabric drapes, artfully gathered and draped with a prominent central U-shaped swag. From the top of the drapes, graceful strands of dark green foliage cascade downwards. In the midground, an opulent display of fresh floral arrangements predominantly in white and off-white (roses, hydrangeas, dahlias, and delicate blossoms with light green foliage) forms a continuous celebratory garland across the table and along the ground paving.'
    ),
  },
  {
    id: 'foggy-dalat',
    name: 'Foggy Dalat',
    name_vn: 'Đà Lạt mù sương',
    thumbnailUrl: 'https://www.photobookvietnam.net/app/images/background%20(27).jpg',
    category: 'nature-outdoor',
    prompt: createMasterPrompt(
      'A vibrant and ethereal sunrise landscape capturing a sunrise over a vast, dense sea of mist and clouds in Da Lat. In the foreground, a verdant, dew-kissed grassy hillside slopes downward. The midground reveals the tops of dark, silhouetted pine trees, partially submerged and softly outlined by a thick, glowing blanket of golden-orange and pale pink fog that fills the valleys. Dominating the background is a brilliant, radiant sun casting warm, golden light across the entire mist-laden vista.'
    ),
  },
  {
    id: 'green-grass',
    name: 'Green grass',
    name_vn: 'Sân cỏ xanh',
    thumbnailUrl: 'https://www.photobookvietnam.net/app/images/background%20(28).jpg',
    category: 'nature-outdoor',
    prompt: createMasterPrompt(
      'A tranquil natural scene comprising a vast, meticulously maintained, vibrant green lawn occupying the foreground. In the midground, a dark, gently winding asphalt path traverses the scene. Beyond the path, a dense, extensive forest of tall, slender pine trees fills the entire background with vertical trunks and rich green canopies receding into the distance.'
    ),
  },
  {
    id: 'pine-hill',
    name: 'Pine hill',
    name_vn: 'Đồi thông bình minh',
    thumbnailUrl: 'https://www.photobookvietnam.net/app/images/background%20(29).jpg',
    category: 'nature-outdoor',
    prompt: createMasterPrompt(
      'A serene, ethereal forest landscape during sunrise golden hour. The composition features a vibrant, lush green grass field in the immediate foreground with individual blades and dew drops reflecting warm, low-angle light. Several prominent, tall conifer tree trunks stand in the foreground casting long, dramatic diagonal shadows across the grass. The background is dominated by thick, soft, atmospheric golden mist glowing with warm morning light.'
    ),
  },
  {
    id: 'mountain-pass',
    name: 'Mountain pass',
    name_vn: 'Đường đèo',
    thumbnailUrl: 'https://www.photobookvietnam.net/app/images/background%20(30).jpg',
    category: 'nature-outdoor',
    prompt: createMasterPrompt(
      'A serene, winding asphalt mountain road cuts through a dense forest of towering pine trees, bathed in bright, dappled sunlight. The road curves gently into the distant woods, creating strong leading lines. Lush, vibrant green grass and undergrowth carpet the forest floor with strong, sharp shadows cast by the trees, creating a peaceful and inviting forest road setting.'
    ),
  },
  {
    id: 'Lieng-chi-falls',
    name: 'Liengchi falls',
    name_vn: 'Thác Liêng Chi',
    thumbnailUrl: 'https://www.photobookvietnam.net/app/images/background%20(31).jpg',
    category: 'nature-outdoor',
    prompt: createMasterPrompt(
      "A grand, multi-tiered waterfall cascading forcefully down a towering, dark, moss-covered rock cliff surrounded by rich, tropical forest. The sky above is soft, overcast light grey, providing diffused illumination. The ground in the foreground is covered with vibrant green grass and clusters of rich orange and warm yellow roses, with an artistic floral arch interwoven with abundant dark green foliage."
    ),
  },
  {
    id: 'cloud-hunting',
    name: 'Cloud hunting',
    name_vn: 'Săn mây',
    thumbnailUrl: 'https://www.photobookvietnam.net/app/images/background%20(32).jpg',
    category: 'nature-outdoor',
    prompt: createMasterPrompt(
      'A majestic landscape featuring rolling hills and mountains partially obscured by a thick, ethereal sea of white and light gray mist and clouds, creating a dreamlike and serene atmosphere. Scattered dark green pine trees dot the midground hills. The scene is illuminated by a warm, radiant backlight from the setting golden sun on the horizon, casting a glowing golden hue over the entire vista.'
    ),
  },
  {
    id: 'secret-garden',
    name: 'Secret garden',
    name_vn: 'Khu vườn bí mật',
    thumbnailUrl: 'https://www.photobookvietnam.net/app/images/background%20(33).jpg',
    category: 'nature-outdoor',
    prompt: createMasterPrompt(
      'A rustic, weathered wooden barrier or fence made of thick logs in the foreground, with vibrant purple flowering bougainvillea bushes. The midground reveals rolling, densely forested hills and valleys bathed in soft atmospheric mist that blankets the lower elevations. The background is dominated by a majestic display of massive snow-capped mountains under a sky transitioning from soft blues to whites.'
    ),
  },
  {
    id: 'white-palace',
    name: 'White palace',
    name_vn: 'Dinh thự trắng',
    thumbnailUrl: 'https://www.photobookvietnam.net/app/images/background%20(34).jpg',
    category: 'art-luxury',
    prompt: createMasterPrompt(
      'A grand, symmetrical, neoclassical architectural scene. The image features a wide, expansive bright green lawn leading up to a majestic, multi-tiered white building with a grand stone staircase flanked by elegant classical statues under a bright, clear sky.'
    ),
  },
  {
    id: 'indoor-1',
    name: 'Indoor 1',
    name_vn: 'Studio Cổ Điển',
    thumbnailUrl: 'https://www.photobookvietnam.net/app/images/background%20(35).jpg',
    category: 'indoor-studio',
    prompt: createMasterPrompt(
      'An elegant photo studio set designed like a classic European living room. The background wall is painted dark sage green featuring intricate gold wall molding and ornate decorative classic panels. The floor is made of light whitewashed wood planks. On the left, a classic round wooden accent table holding a gold two-tier dessert stand and a vase with tall pink floral branches. On the right, an elegant cream-colored vintage French provincial loveseat with carved wooden trim. Soft, diffused, warm studio lighting.'
    ),
  },
  {
    id: 'indoor-2',
    name: 'Indoor 2',
    name_vn: 'Nhà Kính Châu Âu',
    thumbnailUrl: 'https://www.photobookvietnam.net/app/images/background%20(36).jpg',
    category: 'indoor-studio',
    prompt: createMasterPrompt(
      'An empty bright photo studio set resembling a classic European conservatory. Light grey-green walls, large white paned windows. Central arched trellis covered in climbing pink roses and green vines. Light wood floor with small scattered floor flowers. Two-tiered green topiary spheres in white classic urn planters on both sides. A pink vintage French loveseat under bright, soft natural studio lighting.'
    ),
  },
  {
    id: 'indoor-3',
    name: 'Indoor 3',
    name_vn: 'Phòng Xanh Navy',
    thumbnailUrl: 'https://www.photobookvietnam.net/app/images/background%20(37).jpg',
    category: 'indoor-studio',
    prompt: createMasterPrompt(
      'An empty elegant photo studio set of a vintage European living room. Deep navy blue walls with classic panel molding. Large arched paned window on the right side. Light grey wood floor. A classic French cane-back armchair with a cream cushion. Stacked vintage suitcases covered with a white lace cloth, topped with vintage teacups and pearls under soft diffused lighting.'
    ),
  },
  {
    id: 'indoor-4',
    name: 'Indoor 4',
    name_vn: 'Mùa Thu Hoàng Gia',
    thumbnailUrl: 'https://www.photobookvietnam.net/app/images/background%20(38).jpg',
    category: 'indoor-studio',
    prompt: createMasterPrompt(
      'An empty opulent photo studio set in autumnal tones. Rich brown walls featuring intricate classical bronze molding and pillar columns. Central arched paned window with bright backlighting. Flanked by massive, lavish dried floral arrangements including pampas grass, dried ferns, and dusty pink roses. A vintage French armchair with gold trim under warm soft studio lighting.'
    ),
  },
  {
    id: 'indoor-5',
    name: 'Indoor 5',
    name_vn: 'Cung Điện Hoàng Gia',
    thumbnailUrl: 'https://www.photobookvietnam.net/app/images/background%20(38).jpg',
    category: 'indoor-studio',
    prompt: createMasterPrompt(
      'A luxurious grand European Baroque palace ballroom. Monumental symmetrical architecture, massive cream marble Corinthian columns, elaborate carved stone ornaments, ornate classical arches and Renaissance-style decorative reliefs. A huge central arched opening reveals a romantic ancient European city with classical buildings, statues, trees, distant mountains and blue sky. Elegant white and blush floral arrangements in large marble urns on both sides, antique gold candle stands, highly polished cream and warm brown geometric marble floor with realistic reflections, and warm golden sunlight entering from tall windows on the left.'
    ),
  },
];
