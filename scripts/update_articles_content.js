import fs from "fs";
import path from "path";
import { generateBotanicalArticle } from "../src/services/botanicalAiEngine.ts";

const jsonPath = path.resolve(process.cwd(), "public/latest_articles.json");
if (fs.existsSync(jsonPath)) {
  const data = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
  
  // Update weed control article
  const weedArticle = data.find((a) => 
    a.slug?.includes("zizani") || 
    a.slug?.includes("agrioxort") || 
    a.title?.el?.includes("Ζιζανίων") ||
    a.title?.el?.includes("Αγριόχορτων")
  );

  if (weedArticle) {
    const generated = generateBotanicalArticle("Βιολογική Αντιμετώπιση Αγριόχορτων και Ζιζανίων με Γεωργικό Ξύδι & Corn Gluten", "plant_care");
    weedArticle.title.el = generated.title;
    weedArticle.title.en = "Organic Weed Control with Horticultural Vinegar & Corn Gluten Meal";
    weedArticle.summary.el = generated.summary;
    weedArticle.summary.en = "Complete organic weed control protocol without toxic glyphosate. Using horticultural vinegar 10-20% as contact herbicide, Corn Gluten Meal as natural pre-emergent root inhibitor, organic mulching, and soil solarization.";
    weedArticle.content.el = generated.content;
    weedArticle.content.en = generated.content;
    weedArticle.keyTakeaways.el = generated.keyTakeaways;
    weedArticle.keyTakeaways.en = [
      "Horticultural Vinegar 10-20% + Soap: Destroys plant cell membranes within 2 hours under direct sunlight.",
      "Boiling Water on Pavements & Cracks: Instantly cooks and neutralizes stubborn root crowns in sidewalks without residual chemicals.",
      "Corn Gluten Meal (9-0-0): Natural pre-emergent herbicide that inhibits seedling root formation in established lawns and flowerbeds.",
      "7-10cm Organic Mulching & Solarization: Completely starves weeds of light and sterilizes summer soil beds using 50μm transparent film."
    ];
    console.log("Successfully updated weed article in latest_articles.json!");
  }

  // Update geraniums article
  const geraniumArticle = data.find((a) => 
    a.slug?.includes("gerani") || 
    a.title?.el?.includes("Γερανιών")
  );

  if (geraniumArticle) {
    const generatedG = generateBotanicalArticle("Κλάδεμα & Αναζωογόνηση Γερανιών και Πελαργονίων μετά τον Καύσωνα", "plant_care");
    geraniumArticle.title.el = "Κλάδεμα & Αναζωογόνηση Γερανιών και Πελαργονίων μετά τον Καύσωνα";
    geraniumArticle.title.en = "Pruning & Heatwave Recovery for Geraniums and Pelargoniums";
    geraniumArticle.summary.el = generatedG.summary;
    geraniumArticle.summary.en = "Specialized guide for restoring geraniums and pelargoniums after extreme summer heatwaves. Pruning techniques, Cacyreus butterfly control, Fe-EDDHA iron chelate, and irrigation routines for prolific autumn blooms.";
    geraniumArticle.content.el = generatedG.content;
    geraniumArticle.content.en = generatedG.content;
    geraniumArticle.keyTakeaways.el = generatedG.keyTakeaways;
    geraniumArticle.keyTakeaways.en = [
      "Pruning 1/3 height above outer leaf nodes at the end of August to trigger fresh autumn flowering stems.",
      "Cacyreus marshalli Butterfly Defense: Bacillus thuringiensis spray every 10 days to stop burrowing caterpillars.",
      "Iron Fe-EDDHA & Seaweed Kelp: Rapid reversal of heat-induced leaf chlorosis and root stabilization.",
      "Targeted Micro-Drip: Keeping root zone at 40-55% VWC without wetting foliage to eliminate rust and botrytis."
    ];
    console.log("Successfully updated geranium article in latest_articles.json!");
  }

  fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), "utf-8");
  console.log("latest_articles.json saved successfully.");
} else {
  console.log("File latest_articles.json not found.");
}
