export const HIGHLIGHT_RESTORATION_PROMPT = `ROLE:
Professional Photo Restoration Specialist and High-End Wedding Photographer.

TASK:
Restore and professionally correct the exposure, tonal range, color and image quality of the uploaded photograph.

This is a PHOTO RESTORATION task, NOT a creative reinterpretation.

FIRST, ANALYZE THE ORIGINAL IMAGE:
Before making any adjustment, determine whether the photograph is:
- underexposed
- overexposed
- mixed exposure
- correctly exposed but low in dynamic range

Automatically apply the appropriate correction based on the actual photographic condition.

Do NOT assume that every image needs to be brighter.

==================================================
1. PRESERVE THE ORIGINAL PHOTOGRAPH
==================================================

Treat the uploaded image as the original source photograph.

Preserve the original photograph as faithfully as possible.

Preserve exactly:

- all people
- identity
- facial features
- face shape
- facial expression
- eyes
- nose
- mouth
- hairstyle
- hairline
- skin tone
- skin texture
- body proportions
- body shape
- pose
- posture
- hands
- fingers
- clothing
- wedding dress
- suit
- bouquet
- veil
- jewelry
- accessories
- original composition
- original camera perspective
- original background
- original environment

DO NOT redesign the photograph.

DO NOT create a new photograph based on the original.

==================================================
2. EXPOSURE DIAGNOSIS AND CORRECTION
==================================================

Analyze the tonal distribution of the original photograph first.

If the image is UNDEREXPOSED:
- recover shadow detail
- gently raise exposure
- lift midtones
- recover dark facial areas
- recover dark clothing detail
- preserve natural blacks
- avoid excessive brightness

If the image is OVEREXPOSED:
- reduce overall exposure where necessary
- recover highlights
- reduce excessive whites
- recover facial and clothing detail from bright areas
- restore tonal separation
- recover sky, vegetation and environmental details
- preserve natural whites
- prevent the image from remaining washed out

If the image has MIXED EXPOSURE:
- perform local tonal correction
- recover dark areas without destroying highlights
- protect bright areas while opening important shadows
- maintain a balanced dynamic range

IMPORTANT:
Never increase exposure automatically.
Choose the correction direction based on the actual image.

==================================================
3. FOR SEVERELY OVEREXPOSED AREAS
==================================================

The uploaded image may contain severe highlight clipping.

Recover all photographic detail that is actually available in the source image.

Prioritize recovery of:

- faces
- hair
- clothing
- wedding attire
- bouquet
- flowers
- foliage
- background objects
- sky
- architectural details

Reduce:

- blown highlights
- excessive white areas
- washed-out skin
- flat bright clothing
- loss of tonal separation

Restore natural contrast between adjacent bright areas.

Do NOT simply darken the entire image.

Do NOT make the restored photograph muddy or underexposed.

IMPORTANT:
If a region is completely clipped to pure white and contains no recoverable photographic information, do not invent unrealistic details.

Any reconstruction of severely damaged areas must remain subtle, conservative and consistent with the surrounding real photograph.

Do not hallucinate complex details that were not supported by the original image.

==================================================
4. FOR UNDEREXPOSED AREAS
==================================================

If dark areas contain recoverable information:

- gently lift shadows
- recover midtones
- reveal natural clothing detail
- reveal facial detail
- preserve realistic blacks
- preserve depth and contrast

Do not flatten the image.

Do not turn black clothing into gray.

Do not make the image excessively bright.

==================================================
5. FACES AND PEOPLE
==================================================

The people in the photograph are the most important elements.

Preserve their exact identity and appearance.

DO NOT:

- regenerate the face
- change facial structure
- change facial expression
- enlarge eyes
- reshape nose
- reshape lips
- alter jawline
- change hairstyle
- change skin tone
- beautify the face
- make the skin plastic
- make the person younger or older
- change body proportions
- change body shape

Only restore visibility and tonal information that was lost because of exposure problems.

The final faces must look like the same real people from the original photograph.

==================================================
6. WHITE WEDDING DRESS AND BRIGHT CLOTHING
==================================================

For overexposed white clothing:

Recover subtle tonal separation and fabric structure wherever source information exists.

Preserve:

- natural white color
- fabric folds
- shadows
- texture
- shape
- dimensionality

Do NOT turn the dress into gray.

Do NOT leave it completely blown out.

Do NOT invent elaborate fabric patterns.

For underexposed white clothing:

gently recover brightness while preserving fabric texture and highlight detail.

==================================================
7. DARK CLOTHING
==================================================

For dark suits and black clothing:

Recover available shadow detail while maintaining the original dark color.

The suit must remain genuinely black or very dark.

Do NOT turn black clothing into gray.

Do NOT invent new patterns or textures.

==================================================
8. BACKGROUND
==================================================

KEEP THE ORIGINAL BACKGROUND.

Do NOT replace the background.

Do NOT redesign the environment.

Do NOT add objects.

Do NOT remove objects unless they are clearly photographic artifacts.

Do not change the architecture, vegetation, furniture, curtains or surrounding environment.

Only correct the exposure, tonal range, color balance, noise and image quality of the existing background.

==================================================
9. COLOR CORRECTION
==================================================

Correct the color balance naturally after exposure correction.

Improve:

- white balance
- skin color
- neutral tones
- shadow color
- highlight color
- overall color consistency

Preserve the original atmosphere of the photograph.

Do not apply an artificial cinematic color grade.

Do not make the image excessively warm or cool.

==================================================
10. RESTORE NATURAL DYNAMIC RANGE
==================================================

The final photograph should have:

- visible shadow detail
- controlled highlights
- natural midtones
- realistic blacks
- realistic whites
- smooth tonal transitions
- natural contrast
- realistic depth

Avoid:

- HDR appearance
- haloing
- excessive clarity
- crushed blacks
- blown whites
- artificial local contrast
- flat gray shadows
- unnatural glowing edges

==================================================
11. IMAGE RESTORATION
==================================================

After exposure correction, apply subtle restoration:

- reduce excessive digital noise
- reduce compression artifacts
- restore reasonable sharpness
- improve micro-detail
- preserve natural skin texture
- preserve fabric texture
- preserve fine environmental details

Do NOT oversharpen.

Do NOT create artificial skin texture.

Do NOT create an AI-generated appearance.

Do NOT make the photograph look like a newly generated image.

==================================================
12. NO GENERATIVE REINTERPRETATION
==================================================

This is extremely important.

The goal is to recover the original photograph, NOT to recreate it.

Do not change:

- people
- faces
- bodies
- clothing
- objects
- environment
- composition
- perspective
- camera angle
- background

Do not add details merely because they would look aesthetically better.

When photographic information is missing, make the most conservative restoration possible.

==================================================
13. FINAL QUALITY
==================================================

The final image should look like the ORIGINAL photograph after professional RAW exposure correction and photographic restoration.

It should feel as if an experienced photographer had properly exposed and processed the original image.

The result should be:

- naturally exposed
- detailed
- clean
- realistic
- photographically authentic
- naturally color balanced
- professionally restored

The people must remain exactly recognizable as the original people.

The original environment must remain the same.

Only exposure, dynamic range, color balance, noise and image quality should be improved.

==================================================
STRICT NEGATIVE CONSTRAINTS
==================================================

NO identity change.
NO face regeneration.
NO facial beautification.
NO body reshaping.
NO pose change.
NO clothing change.
NO background replacement.
NO composition change.
NO new people.
NO duplicated people.
NO new objects.
NO invented facial details.
NO invented clothing details.
NO artificial skin.
NO plastic skin.
NO excessive sharpening.
NO HDR look.
NO cinematic relighting.
NO dramatic new lighting.
NO excessive brightness.
NO excessive darkness.
NO blown highlights.
NO crushed shadows.
NO unnatural color grading.
NO AI-generated appearance.

OUTPUT:
A professionally restored version of the original photograph with corrected exposure and dynamic range.

Preserve the original photograph exactly.
Diagnose the exposure problem first, then apply only the necessary correction.`;
