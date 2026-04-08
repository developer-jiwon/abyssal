const { GoogleGenAI } = require("/Users/jiwonhwang/Documents/indiehacker/Jiwon-studio/node_modules/@google/genai");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Read API key from Jiwon-studio
const envPath = path.join(__dirname, "../Jiwon-studio/.env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
const API_KEY = envContent.match(/GEMINI_API_KEY=(.+)/)?.[1]?.trim();

const STYLE = `
CRITICAL RULES:
- TRANSPARENT BACKGROUND - absolutely NO colored/white/black background
- Dark, atmospheric, REALISTIC deep ocean style
- NOT cartoon, NOT kawaii, NOT cute - this is DARK and TERRIFYING
- Bioluminescent glow effects where specified
- Scientific illustration meets cinematic concept art
- High detail, dramatic lighting from bioluminescence only
- Deep sea darkness surrounding the creature
- Translucent/transparent body parts where biologically accurate
- NO text, NO labels, NO watermarks
- Single creature, centered
`;

const CREATURES = [
  { name: "anglerfish", prompt: "A terrifying deep-sea anglerfish emerging from pitch darkness, massive jaw with needle-like transparent teeth wide open, bioluminescent lure dangling from esca on head emitting eerie cyan-blue glow that illuminates its horrifying face, dark mottled skin texture, small beady eye, realistic scientific illustration style, dramatic bioluminescent lighting, transparent background" },
  { name: "giant-jellyfish", prompt: "An enormous deep-sea jellyfish with massive translucent bell, dozens of long trailing tentacles glowing with ethereal purple and blue bioluminescence, delicate internal structures visible through transparent body, ghostly and majestic, floating in void, realistic underwater photography style, transparent background" },
  { name: "vampire-squid", prompt: "A vampire squid Vampyroteuthis infernalis with dark crimson-black velvety body, large webbed arms revealing bioluminescent photophores glowing electric blue, enormous glassy red eyes, defensive posture with arms pulled over mantle, realistic deep-sea creature, transparent background" },
  { name: "dumbo-octopus", prompt: "A deep-sea dumbo octopus Grimpoteuthis with large ear-like fins spread wide, semi-translucent pinkish-orange gelatinous body, short stubby arms, hovering gracefully, soft bioluminescent glow from within, realistic deep-sea photography style, transparent background" },
  { name: "gulper-eel", prompt: "A gulper eel pelican eel with impossibly enormous hinged mouth gaping wide showing dark interior, extremely long whip-like tail ending in bioluminescent pink-red glowing organ, sleek black elongated body, terrifying deep-sea predator, realistic style, transparent background" },
  { name: "viperfish", prompt: "A deep-sea viperfish Chauliodus with impossibly long curved needle fangs protruding past jaw, row of bright blue-green bioluminescent photophores running along belly, dark metallic iridescent body, large reflective eye, one of the most terrifying deep-sea predators, realistic, transparent background" },
  { name: "barreleye", prompt: "A barreleye fish macropinna microstoma with completely transparent fluid-filled dome head, two bright green tubular eyes visible through the clear cranium pointing upward, small mouth, dark body below transparent head, one of the most bizarre deep-sea creatures, realistic scientific illustration, transparent background" },
  { name: "giant-isopod", prompt: "A giant deep-sea isopod Bathynomus giganteus, heavily armored segmented exoskeleton, multiple jointed legs, compound eyes reflecting light, pale grey-white chitinous body, curled defensive posture, alien-like prehistoric bottom dweller, highly detailed realistic illustration, transparent background" },
  { name: "sea-angel", prompt: "A sea angel Clione limacina, tiny translucent swimming sea slug with ethereal wing-like parapodia spread wide, glowing white-blue bioluminescent body, visible internal organs through transparent flesh, delicate and otherworldly, floating in darkness, realistic macro photography style, transparent background" },
  { name: "siphonophore", prompt: "A massive siphonophore colonial organism, long spiraling chain of interconnected bioluminescent blue-white glowing zooids, each segment different specialized function, ethereal alien-like deep-sea creature stretching across frame, one of longest animals on Earth, realistic, transparent background" },
  { name: "comb-jelly", prompt: "A ctenophore comb jelly with oval translucent crystalline body, rows of iridescent cilia creating spectacular rainbow light diffraction patterns along meridional canals, prismatic colors shimmering, internal structures visible, mesmerizing bioluminescent display, realistic macro photography, transparent background" },
  { name: "black-dragonfish", prompt: "A black dragonfish Idiacanthus with elongated jet-black body, long chin barbel with bioluminescent lure tip glowing, unique red bioluminescent patches below eyes (one of few deep-sea fish producing red light), rows of tiny photophores, terrifying predator, realistic, transparent background" },
  { name: "tube-worm", prompt: "Giant hydrothermal vent tube worms Riftia pachyptila, cluster of tall white chitinous tubes with bright blood-red feathery plumes extended from tops, growing around volcanic vent with sulfurous mineral deposits, deep ocean floor ecosystem, realistic scientific illustration, transparent background" },
  { name: "yeti-crab", prompt: "A yeti crab Kiwa hirsuta with distinctive long hairy white claws densely covered in filamentous bacteria giving furry appearance, pale white body, living near hydrothermal vent, bizarre deep-sea creature discovered 2005, detailed realistic scientific illustration, transparent background" },
  { name: "fangtooth", prompt: "A fangtooth fish Anoplogaster cornuta with grotesquely disproportionate enormous teeth for its small compressed body, largest teeth relative to body size of any fish in ocean, dark brown-black rough skin, deep-set eyes, absolute deep-sea nightmare, realistic horror illustration, transparent background" },
  { name: "colossal-squid", prompt: "A colossal squid Mesonychoteuthis hamiltoni with massive muscular tentacles lined with rotating hook-like suckers, enormous dark eye the largest in animal kingdom, deep reddish-brown mantle, terrifying apex predator of the deep, dramatic scale showing massive size, realistic, transparent background" },
  { name: "nautilus", prompt: "A chambered nautilus with elegant logarithmic spiral shell, reddish-brown and cream striped pattern, dozens of small tentacles extending from shell opening, ancient living fossil unchanged for 500 million years, floating in deep blue-black water, realistic underwater photography, transparent background" },
  { name: "lanternfish", prompt: "A small group of lanternfish myctophidae with rows of bright photophores running along silvery-blue bodies like tiny city lights, large proportionally huge eyes, small fish that form the largest biomass of fish in the ocean, bioluminescent constellation pattern, realistic, transparent background" },
  { name: "hatchetfish", prompt: "A deep-sea hatchetfish with extremely laterally compressed thin silver body shaped exactly like a hatchet blade, large upward-pointing tubular telescopic eyes, belly lined with photophores for counter-illumination camouflage, eerie metallic appearance, realistic scientific illustration, transparent background" },
  { name: "frilled-shark", prompt: "A frilled shark Chlamydoselachus anguineus with elongated eel-like primitive body, wide flat head, gill slits with distinctive frilly red-pink edges, rows of trident-shaped teeth in 25 rows, dark brown skin, a living fossil from 80 million years ago, terrifying and ancient, realistic, transparent background" },
  { name: "sea-cucumber", prompt: "A deep-sea swimming sea cucumber Enypniastes eximia nicknamed headless chicken monster, translucent reddish-pink gelatinous body with visible internal organs, web-like swimming veil spread wide, bizarre alien-like creature hovering in deep darkness, realistic underwater photography, transparent background" },
  { name: "sea-turtle", prompt: "A large green sea turtle swimming through sunlit shallow ocean water, sunbeams creating dappled light patterns on shell and skin, graceful powerful flippers mid-stroke, crystal clear turquoise water, realistic underwater photography, transparent background" },
  { name: "sunlight-fish-school", prompt: "A vibrant school of tropical reef fish swimming through sunlit shallow water, mix of species in silver and blue tones, light rays penetrating from surface above creating god rays, dynamic movement frozen in time, realistic underwater photography, transparent background" },
  { name: "whale", prompt: "A massive humpback whale diving from sunlit surface into deeper blue water, enormous body with distinctive long pectoral fins, barnacles on skin, light rays from above illuminating its descent, majestic and awe-inspiring scale, realistic underwater photography, transparent background" },
];

const outputDir = path.join(__dirname, "public/creatures");

async function generate(item) {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const fullPrompt = `${STYLE}\n\nCREATE:\n${item.prompt}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
      config: {
        responseModalities: ["Text", "Image"],
        imageGenerationConfig: { aspectRatio: "1:1", outputMimeType: "image/png" },
      },
    });

    const candidates = response.candidates || response.response?.candidates;
    if (candidates?.[0]?.content?.parts) {
      for (const part of candidates[0].content.parts) {
        if (part.inlineData) {
          const imageData = Buffer.from(part.inlineData.data, "base64");
          const outPath = path.join(outputDir, `${item.name}.png`);
          fs.writeFileSync(outPath, imageData);

          // Try bg removal
          try {
            const tmpPath = outPath + ".tmp";
            fs.renameSync(outPath, tmpPath);
            execSync(`python3 -c "
from rembg import remove
from PIL import Image
img = Image.open('${tmpPath}')
out = remove(img)
out.save('${outPath}')
print('OK')
"`, { timeout: 60000 });
            if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
          } catch (e) {
            // If bg removal fails, use original
            const tmpPath = outPath + ".tmp";
            if (fs.existsSync(tmpPath)) {
              if (!fs.existsSync(outPath)) fs.renameSync(tmpPath, outPath);
              else fs.unlinkSync(tmpPath);
            }
          }
          return true;
        }
      }
    }
    return false;
  } catch (err) {
    console.error(`  FAIL ${item.name}: ${err.message?.substring(0, 80)}`);
    return false;
  }
}

async function main() {
  console.log(`Regenerating ${CREATURES.length} creatures (REALISTIC style)...`);
  let ok = 0, fail = 0;

  for (let i = 0; i < CREATURES.length; i++) {
    const c = CREATURES[i];
    process.stdout.write(`[${String(i + 1).padStart(2)}/${CREATURES.length}] ${c.name}...`);
    const success = await generate(c);
    if (success) { ok++; console.log(" OK"); }
    else { fail++; console.log(" FAIL"); }
  }

  console.log(`\nDone: ${ok} ok / ${fail} fail`);
}

main();
