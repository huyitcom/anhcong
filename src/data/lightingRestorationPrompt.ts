export const LIGHTING_RESTORATION_PROMPT = `ROLE:
Professional Wedding Photo Editor and Photo Restoration Specialist.

TASK:
Restore and professionally correct the exposure and lighting of the uploaded wedding photograph.

This is an EXPOSURE RESTORATION and PHOTO ENHANCEMENT task ONLY.

Do NOT replace the background.
Do NOT change the composition.
Do NOT regenerate the subjects.
Do NOT reinterpret the photograph.

The goal is to recover the photographic information hidden in the dark areas and make the original photograph look naturally well-exposed, clean and professionally photographed.

==================================================
1. PRESERVE THE ORIGINAL PHOTOGRAPH
==================================================

Treat the uploaded image as the original source photograph.

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
- skin texture
- skin tone
- body proportions
- body shape
- pose
- posture
- hands
- fingers
- wedding dress
- suit
- bouquet
- veil
- jewelry
- accessories
- clothing details
- original framing
- original composition
- original camera perspective
- original background
- original architectural elements

Do not redraw or reconstruct the people.

Do not change their appearance.

==================================================
2. RECOVER THE UNDEREXPOSED IMAGE
==================================================

The original photograph is significantly underexposed.

Carefully recover the dark areas while maintaining realistic photographic contrast.

Increase:

- overall exposure
- shadow detail
- midtone brightness
- facial visibility
- clothing detail
- background detail
- local illumination

Lift the shadows gradually and naturally.

Recover details from the dark suit without making it gray or washed out.

Reveal natural detail in the groom's black suit while keeping it genuinely black.

Brighten the bride's face and dress naturally without overexposing the white fabric.

Preserve highlight detail in the wedding dress.

Do NOT simply increase brightness globally.

Use intelligent tonal recovery similar to professional RAW photo development.

==================================================
3. FACE AND SKIN
==================================================

The faces are currently affected by low exposure.

Recover facial visibility naturally.

Make the faces clearly visible while preserving their exact original appearance.

Do NOT:

- change facial structure
- change facial expression
- enlarge eyes
- reshape nose
- reshape lips
- smooth the face excessively
- whiten the skin unnaturally
- change skin tone
- beautify the subjects
- make the subjects look younger
- create artificial makeup

Preserve realistic skin texture and natural skin imperfections.

The faces should look like the same people photographed with better exposure.

==================================================
4. WEDDING DRESS
==================================================

The wedding dress is white and contains important fabric folds and texture.

Recover the dress detail carefully.

Maintain:

- natural white color
- fabric texture
- folds
- shadows
- highlights
- original shape

Do NOT turn the dress into a flat pure-white area.

Do NOT clip the highlights.

The dress should retain subtle dimensionality and realistic fabric detail.

==================================================
5. GROOM'S DARK SUIT
==================================================

The groom's suit is very dark and currently contains crushed shadow areas.

Recover as much natural fabric detail as possible.

Maintain the suit as a deep black / very dark formal suit.

Do NOT turn the suit gray.

Do NOT invent patterns or textures that were not present.

Reveal subtle natural folds and tonal variation only where photographic information already exists.

==================================================
6. BACKGROUND
==================================================

KEEP THE ORIGINAL BACKGROUND EXACTLY.

Do not replace it.

Do not redesign it.

Do not remove it.

Do not add new objects.

Do not change the architecture.

Do not change the curtains.

Do not change the walls.

Do not change the room layout.

Only improve the exposure, shadow detail, color balance and overall image quality of the existing background.

The background should become naturally visible without looking artificially bright.

==================================================
7. LIGHTING CORRECTION
==================================================

Reconstruct the appearance of a properly exposed version of the ORIGINAL lighting.

Do not introduce a completely new lighting direction.

Do not make the scene look like it was photographed outdoors.

Do not turn the image into bright daylight.

Preserve the original indoor wedding atmosphere.

Create soft, natural, flattering illumination across the subjects.

Maintain realistic light falloff.

Keep the original relationship between light and shadow.

The result should feel like the photographer had used a properly exposed camera setting or gently lifted the exposure during RAW processing.

==================================================
8. COLOR CORRECTION
==================================================

Correct the color balance while preserving the original atmosphere.

Improve:

- white balance
- skin color
- neutral tones
- shadow color
- highlight color
- overall tonal consistency

Keep the wedding atmosphere elegant and natural.

Avoid excessive orange, yellow, green or magenta color casts.

The white wedding dress should remain naturally white.

Skin should remain natural and realistic.

==================================================
9. SHADOW RECOVERY
==================================================

Recover crushed blacks and blocked shadows selectively.

Prioritize shadow recovery around:

- faces
- hair
- groom's suit
- bride's dress folds
- hands
- bouquet
- lower clothing
- important background details

Do not eliminate all shadows.

The final photograph must still have dimensionality and depth.

Maintain realistic blacks and contrast.

==================================================
10. HIGHLIGHT PROTECTION
==================================================

Protect all existing bright areas.

Especially preserve detail in:

- wedding dress
- veil
- skin highlights
- bouquet
- bright wall areas

Do not create blown-out white regions.

Do not make the image excessively bright.

Use a balanced dynamic range.

==================================================
11. NO GENERATIVE RECONSTRUCTION
==================================================

This is extremely important.

DO NOT hallucinate or invent photographic details.

If a dark region contains insufficient information, recover it conservatively.

Do not invent:

- facial details
- hair details
- clothing patterns
- jewelry
- flowers
- architectural details
- objects
- textures

Do not replace missing information with AI-generated content.

The result must remain faithful to the original photograph.

==================================================
12. IMAGE QUALITY
==================================================

After exposure recovery, apply subtle professional photographic finishing:

- mild noise reduction
- subtle sharpening
- natural micro-contrast
- improved dynamic range
- clean tonal transitions
- realistic skin texture
- realistic fabric texture

Do NOT over-sharpen.

Do NOT create HDR halos.

Do NOT create plastic skin.

Do NOT create excessive clarity.

Do NOT make the photograph look like an AI-generated image.

==================================================
13. FINAL LOOK
==================================================

The final image should look like the SAME ORIGINAL WEDDING PHOTOGRAPH photographed with correct exposure.

It should feel like a professional photographer recovered the image from an underexposed RAW file.

The photograph should be:

- brighter
- clearer
- more readable
- naturally illuminated
- professionally color graded
- realistic
- elegant
- cinematic but natural

The original people and their appearance must remain unchanged.

The original background must remain unchanged.

Only exposure, tonal range, color balance and photographic quality should be improved.

==================================================
STRICT NEGATIVE CONSTRAINTS
==================================================

NO identity change.
NO face regeneration.
NO facial beautification.
NO body reshaping.
NO pose change.
NO clothing change.
NO bouquet change.
NO background replacement.
NO composition change.
NO camera angle change.
NO new objects.
NO new people.
NO invented details.
NO artificial skin.
NO excessive smoothing.
NO excessive sharpening.
NO HDR effect.
NO blown highlights.
NO crushed blacks.
NO gray-looking black suit.
NO overexposed wedding dress.
NO unnatural skin whitening.
NO daylight conversion.
NO dramatic new lighting.
NO cinematic relighting that changes the original scene.

OUTPUT:
A naturally restored, professionally exposed version of the original wedding photograph.

Preserve the original image exactly.
Improve ONLY exposure, shadow recovery, tonal balance, color correction and overall photographic quality.`;
