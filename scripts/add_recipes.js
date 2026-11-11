const fs = require('fs');

const currentRecipes = require('../src/assets/data/recipes.json');
console.log('Existing recipes:', currentRecipes.length);

const newRecipes = [
  // --- ULAM COMBOS (PARES / TAMBALAN) ---
  {
    id: 27,
    name: "Combo: Ginisang Munggo + Pritong Tilapia",
    category: "Combos",
    servings: 4,
    image: "🫘🐟",
    description: "The timeless Filipino Friday tandem: hearty sautéed mung beans with fresh kangkong paired with crispy golden tilapia.",
    tags: ["Combos", "Budget", "Friday Favorite"],
    ingredients: [
      { commodityName: "Monggo (Mung Beans)", quantity: 0.25, unit: "kg" },
      { commodityName: "Pork Kasim", quantity: 0.15, unit: "kg" },
      { commodityName: "Tilapia", quantity: 0.5, unit: "kg" },
      { commodityName: "Kangkong", quantity: 1, unit: "bundle" },
      { commodityName: "Kamatis", quantity: 0.1, unit: "kg" },
      { commodityName: "Sibuyas", quantity: 0.05, unit: "kg" },
      { commodityName: "Bawang", quantity: 0.03, unit: "kg" }
    ]
  },
  {
    id: 28,
    name: "Combo: Sinigang na Baboy + Pritong Bangus",
    category: "Combos",
    servings: 4,
    image: "🍲🐟",
    description: "Ultimate Pinoy comfort feast: sour tamarind pork rib soup paired with crisp fried milkfish and tomato relish.",
    tags: ["Combos", "Soup", "Classic"],
    ingredients: [
      { commodityName: "Pork Liempo", quantity: 0.4, unit: "kg" },
      { commodityName: "Bangus", quantity: 0.5, unit: "kg" },
      { commodityName: "Sitaw", quantity: 0.1, unit: "kg" },
      { commodityName: "Labanos", quantity: 0.15, unit: "kg" },
      { commodityName: "Kangkong", quantity: 1, unit: "bundle" },
      { commodityName: "Kamatis", quantity: 0.1, unit: "kg" },
      { commodityName: "Sibuyas", quantity: 0.05, unit: "kg" }
    ]
  },
  {
    id: 29,
    name: "Combo: Tinolang Manok + Tortang Talong",
    category: "Combos",
    servings: 4,
    image: "🍗🍆",
    description: "Nutritious and comforting: warm ginger chicken broth with green papaya paired with smoky pan-fried eggplant omelet.",
    tags: ["Combos", "Healthy", "Soup"],
    ingredients: [
      { commodityName: "Whole Dressed Chicken", quantity: 0.8, unit: "kg" },
      { commodityName: "Sayote", quantity: 0.3, unit: "kg" },
      { commodityName: "Luya", quantity: 0.05, unit: "kg" },
      { commodityName: "Talong", quantity: 0.25, unit: "kg" },
      { commodityName: "Chicken Egg", quantity: 2, unit: "pcs" },
      { commodityName: "Bawang", quantity: 0.03, unit: "kg" },
      { commodityName: "Sibuyas", quantity: 0.05, unit: "kg" }
    ]
  },
  {
    id: 30,
    name: "Combo: Pinakbet + Inihaw na Liempo",
    category: "Combos",
    servings: 4,
    image: "🥦🥩",
    description: "Central Luzon fiesta favorite: medley of native vegetables (kalabasa, sitaw, talong, ampalaya) paired with savory charred grilled pork belly.",
    tags: ["Combos", "Vegetables", "Fiesta"],
    ingredients: [
      { commodityName: "Pork Liempo", quantity: 0.4, unit: "kg" },
      { commodityName: "Kalabasa", quantity: 0.25, unit: "kg" },
      { commodityName: "Sitaw", quantity: 0.1, unit: "kg" },
      { commodityName: "Talong", quantity: 0.15, unit: "kg" },
      { commodityName: "Ampalaya", quantity: 0.15, unit: "kg" },
      { commodityName: "Kamatis", quantity: 0.1, unit: "kg" },
      { commodityName: "Sibuyas", quantity: 0.05, unit: "kg" }
    ]
  },
  {
    id: 31,
    name: "Combo: Adobong Manok + Ensaladang Talong at Itlog na Maalat",
    category: "Combos",
    servings: 4,
    image: "🍗🥚",
    description: "Perfect flavor balance: savory garlicky chicken adobo served alongside smoky grilled eggplant salad with salted egg and ripe tomatoes.",
    tags: ["Combos", "Main Dish", "Classic"],
    ingredients: [
      { commodityName: "Chicken Leg Quarter", quantity: 0.7, unit: "kg" },
      { commodityName: "Talong", quantity: 0.3, unit: "kg" },
      { commodityName: "Salted Duck Egg (Itlog na Maalat)", quantity: 2, unit: "pcs" },
      { commodityName: "Kamatis", quantity: 0.15, unit: "kg" },
      { commodityName: "Sibuyas", quantity: 0.05, unit: "kg" },
      { commodityName: "Bawang", quantity: 0.05, unit: "kg" }
    ]
  },
  {
    id: 32,
    name: "Combo: Ginataang Kalabasa at Sitaw + Pritong Galunggong",
    category: "Combos",
    servings: 4,
    image: "🥥🐟",
    description: "Velvety sweet squash and tender yardlong beans in rich coconut cream paired with crunchy fried local round scad.",
    tags: ["Combos", "Vegetables", "Seafood"],
    ingredients: [
      { commodityName: "Kalabasa", quantity: 0.35, unit: "kg" },
      { commodityName: "Sitaw", quantity: 0.15, unit: "kg" },
      { commodityName: "Galunggong", quantity: 0.5, unit: "kg" },
      { commodityName: "Bawang", quantity: 0.03, unit: "kg" },
      { commodityName: "Sibuyas", quantity: 0.05, unit: "kg" },
      { commodityName: "Luya", quantity: 0.03, unit: "kg" }
    ]
  },
  {
    id: 33,
    name: "Combo: Batutay ng Cabanatuan + Sinangag at Itlog",
    category: "Combos",
    servings: 4,
    image: "🥩🍳",
    description: "The proud signature of Cabanatuan City: garlicky, sweet-savory beef/pork batutay longganisa served with fragrant garlic fried rice and sunny-side eggs.",
    tags: ["Combos", "Nueva Ecija Specialty", "Breakfast/Ulam"],
    ingredients: [
      { commodityName: "Pork Giniling", quantity: 0.4, unit: "kg" },
      { commodityName: "Chicken Egg", quantity: 4, unit: "pcs" },
      { commodityName: "Well-Milled Local Rice (Sinandomeng)", quantity: 0.5, unit: "kg" },
      { commodityName: "Bawang", quantity: 0.06, unit: "kg" }
    ]
  },
  {
    id: 34,
    name: "Combo: Paksiw na Bangus + Tortang Giniling",
    category: "Combos",
    servings: 4,
    image: "🐟🍳",
    description: "Tangy native vinegar and ginger milkfish stew balanced by a thick, hearty pan-fried minced pork and potato egg torta.",
    tags: ["Combos", "Seafood", "Budget"],
    ingredients: [
      { commodityName: "Bangus", quantity: 0.5, unit: "kg" },
      { commodityName: "Pork Giniling", quantity: 0.2, unit: "kg" },
      { commodityName: "Chicken Egg", quantity: 2, unit: "pcs" },
      { commodityName: "Talong", quantity: 0.15, unit: "kg" },
      { commodityName: "Ampalaya", quantity: 0.1, unit: "kg" },
      { commodityName: "Patatas", quantity: 0.15, unit: "kg" },
      { commodityName: "Bawang", quantity: 0.04, unit: "kg" },
      { commodityName: "Luya", quantity: 0.04, unit: "kg" }
    ]
  },
  {
    id: 35,
    name: "Combo: Ginisang Sayote na may Giniling + Pritong Galunggong",
    category: "Combos",
    servings: 4,
    image: "🥒🐟",
    description: "Budget champion weekday combo: tender chayote sautéed with ground pork and tomatoes, accompanied by crispy fried galunggong.",
    tags: ["Combos", "Budget", "Healthy"],
    ingredients: [
      { commodityName: "Sayote", quantity: 0.4, unit: "kg" },
      { commodityName: "Pork Giniling", quantity: 0.2, unit: "kg" },
      { commodityName: "Galunggong", quantity: 0.4, unit: "kg" },
      { commodityName: "Kamatis", quantity: 0.1, unit: "kg" },
      { commodityName: "Sibuyas", quantity: 0.05, unit: "kg" },
      { commodityName: "Bawang", quantity: 0.03, unit: "kg" }
    ]
  },
  {
    id: 36,
    name: "Combo: Inihaw na Tilapia + Ensaladang Talbos ng Kamote at Kamatis",
    category: "Combos",
    servings: 4,
    image: "🐟🥗",
    description: "Fresh palengke grill: char-grilled live tilapia stuffed with tomatoes and onions, served with blanched sweet potato greens and calamansi-bagoong dip.",
    tags: ["Combos", "Healthy", "Seafood"],
    ingredients: [
      { commodityName: "Tilapia", quantity: 0.7, unit: "kg" },
      { commodityName: "Kamatis", quantity: 0.2, unit: "kg" },
      { commodityName: "Sibuyas", quantity: 0.1, unit: "kg" },
      { commodityName: "Talbos ng Kamote", quantity: 2, unit: "bundles" }
    ]
  },
  {
    id: 37,
    name: "Combo: Beef Bulalo + Pritong Isda at Patis-Calamansi",
    category: "Combos",
    servings: 5,
    image: "🥩🐟",
    description: "Sunday family feast: rich bone marrow beef shank soup with tender cabbage and potatoes, paired with crispy fried fish and chili-calamansi dip.",
    tags: ["Combos", "Soup", "Weekend Special"],
    ingredients: [
      { commodityName: "Beef Shank (Bulalo Bone-in)", quantity: 0.75, unit: "kg" },
      { commodityName: "Tilapia", quantity: 0.4, unit: "kg" },
      { commodityName: "Repolyo", quantity: 0.3, unit: "kg" },
      { commodityName: "Patatas", quantity: 0.25, unit: "kg" },
      { commodityName: "Sibuyas", quantity: 0.08, unit: "kg" }
    ]
  },
  {
    id: 38,
    name: "Combo: Pork Pochero + Steamed Kangkong at Bagoong",
    category: "Combos",
    servings: 4,
    image: "🍲🥬",
    description: "Sweet, savory, and rich pork stew cooked with ripe saba bananas, chickpeas, and fresh pechay, served with crisp steamed water spinach.",
    tags: ["Combos", "Main Dish", "Comfort Food"],
    ingredients: [
      { commodityName: "Pork Kasim", quantity: 0.5, unit: "kg" },
      { commodityName: "Patatas", quantity: 0.2, unit: "kg" },
      { commodityName: "Pechay Tagalog", quantity: 1, unit: "bundle" },
      { commodityName: "Kangkong", quantity: 1, unit: "bundle" },
      { commodityName: "Kamatis", quantity: 0.1, unit: "kg" },
      { commodityName: "Sibuyas", quantity: 0.05, unit: "kg" }
    ]
  },
  {
    id: 39,
    name: "Combo: Pork Menudo + Ensaladang Pipino at Kamatis",
    category: "Combos",
    servings: 4,
    image: "🥘🥗",
    description: "Festive pork and liver stew in tomato sauce studded with diced potatoes and carrots, paired with refreshing crisp cucumber-tomato salad.",
    tags: ["Combos", "Main Dish", "Classic"],
    ingredients: [
      { commodityName: "Pork Kasim", quantity: 0.45, unit: "kg" },
      { commodityName: "Patatas", quantity: 0.25, unit: "kg" },
      { commodityName: "Carrots", quantity: 0.15, unit: "kg" },
      { commodityName: "Kamatis", quantity: 0.15, unit: "kg" },
      { commodityName: "Sibuyas", quantity: 0.05, unit: "kg" },
      { commodityName: "Bawang", quantity: 0.03, unit: "kg" }
    ]
  },
  {
    id: 40,
    name: "Combo: Chicken Inasal + Atcharang Papaya",
    category: "Combos",
    servings: 4,
    image: "🍗🥕",
    description: "Charcoal-grilled chicken quarters marinated in calamansi, ginger, and garlic, brushed with annatto oil and served with sweet tangy pickled green papaya.",
    tags: ["Combos", "Chicken", "Grill"],
    ingredients: [
      { commodityName: "Chicken Leg Quarter", quantity: 0.8, unit: "kg" },
      { commodityName: "Papaya (Green)", quantity: 0.3, unit: "kg" },
      { commodityName: "Carrots", quantity: 0.1, unit: "kg" },
      { commodityName: "Luya", quantity: 0.05, unit: "kg" },
      { commodityName: "Bawang", quantity: 0.05, unit: "kg" },
      { commodityName: "Sibuyas", quantity: 0.05, unit: "kg" }
    ]
  },

  // --- POPULAR STANDALONE DISHES ---
  {
    id: 41,
    name: "Kalderetang Baka (Nueva Ecija Fiesta Style)",
    category: "Main Dish",
    servings: 5,
    image: "🥘",
    description: "Slow-simmered tender beef brisket in spiced tomato liver sauce with fried potatoes, carrots, and sweet bell peppers.",
    tags: ["Main Dish", "Beef", "Fiesta"],
    ingredients: [
      { commodityName: "Beef Brisket (Punta y Pecho)", quantity: 0.6, unit: "kg" },
      { commodityName: "Patatas", quantity: 0.25, unit: "kg" },
      { commodityName: "Carrots", quantity: 0.2, unit: "kg" },
      { commodityName: "Sibuyas", quantity: 0.08, unit: "kg" },
      { commodityName: "Bawang", quantity: 0.04, unit: "kg" },
      { commodityName: "Kamatis", quantity: 0.1, unit: "kg" }
    ]
  },
  {
    id: 42,
    name: "Beef Mechado",
    category: "Main Dish",
    servings: 4,
    image: "🥩",
    description: "Classic tender beef stew simmered in citrusy tomato sauce with chunky potatoes and carrots.",
    tags: ["Main Dish", "Beef", "Classic"],
    ingredients: [
      { commodityName: "Beef Rump (Tapadera)", quantity: 0.5, unit: "kg" },
      { commodityName: "Patatas", quantity: 0.25, unit: "kg" },
      { commodityName: "Carrots", quantity: 0.15, unit: "kg" },
      { commodityName: "Sibuyas", quantity: 0.06, unit: "kg" },
      { commodityName: "Bawang", quantity: 0.04, unit: "kg" }
    ]
  },
  {
    id: 43,
    name: "Chicken Sopas (Creamy Vegetable Macaroni)",
    category: "Soup",
    servings: 4,
    image: "🥣",
    description: "Cozy rainy-day milk-infused chicken macaroni soup loaded with crisp Baguio cabbage, carrots, and shredded chicken.",
    tags: ["Soup", "Chicken", "Comfort Food"],
    ingredients: [
      { commodityName: "Chicken Breast", quantity: 0.35, unit: "kg" },
      { commodityName: "Repolyo", quantity: 0.25, unit: "kg" },
      { commodityName: "Carrots", quantity: 0.15, unit: "kg" },
      { commodityName: "Sibuyas", quantity: 0.05, unit: "kg" },
      { commodityName: "Bawang", quantity: 0.03, unit: "kg" }
    ]
  },
  {
    id: 44,
    name: "Sinigang na Ulo ng Bangus sa Miso",
    category: "Soup",
    servings: 4,
    image: "🐟",
    description: "Savory fermented soybean miso soup with milkfish head and belly, soured with tamarind and filled with fresh mustard greens and radish.",
    tags: ["Soup", "Seafood", "Traditional"],
    ingredients: [
      { commodityName: "Bangus", quantity: 0.6, unit: "kg" },
      { commodityName: "Labanos", quantity: 0.2, unit: "kg" },
      { commodityName: "Kamatis", quantity: 0.15, unit: "kg" },
      { commodityName: "Pechay Tagalog", quantity: 1, unit: "bundle" },
      { commodityName: "Sibuyas", quantity: 0.05, unit: "kg" },
      { commodityName: "Luya", quantity: 0.04, unit: "kg" }
    ]
  },
  {
    id: 45,
    name: "Ginisang Pechay at Tokwa",
    category: "Vegetables",
    servings: 4,
    image: "🥬",
    description: "Nutritious, high-protein budget stir-fry of fresh green native pechay and golden fried bean curd seasoned with garlic and onion.",
    tags: ["Vegetables", "Budget", "Healthy"],
    ingredients: [
      { commodityName: "Pechay Tagalog", quantity: 2, unit: "bundles" },
      { commodityName: "Kamatis", quantity: 0.1, unit: "kg" },
      { commodityName: "Bawang", quantity: 0.04, unit: "kg" },
      { commodityName: "Sibuyas", quantity: 0.05, unit: "kg" }
    ]
  },
  {
    id: 46,
    name: "Ginisang Repolyo at Karot na may Giniling",
    category: "Vegetables",
    servings: 4,
    image: "🥗",
    description: "Crunchy sweet Baguio cabbage and carrots quickly stir-fried with ground pork and fragrant garlic — ready in 15 minutes!",
    tags: ["Vegetables", "Quick Cook", "Budget"],
    ingredients: [
      { commodityName: "Repolyo", quantity: 0.35, unit: "kg" },
      { commodityName: "Carrots", quantity: 0.15, unit: "kg" },
      { commodityName: "Pork Giniling", quantity: 0.2, unit: "kg" },
      { commodityName: "Bawang", quantity: 0.03, unit: "kg" },
      { commodityName: "Sibuyas", quantity: 0.05, unit: "kg" }
    ]
  },
  {
    id: 47,
    name: "Lumpiang Shanghai (Budget Family Pack)",
    category: "Main Dish",
    servings: 6,
    image: "🥢",
    description: "Crowd-pleaser golden fried spring rolls filled with seasoned ground pork, finely minced carrots, onions, and egg.",
    tags: ["Main Dish", "Pork", "Party"],
    ingredients: [
      { commodityName: "Pork Giniling", quantity: 0.5, unit: "kg" },
      { commodityName: "Carrots", quantity: 0.15, unit: "kg" },
      { commodityName: "Sibuyas", quantity: 0.08, unit: "kg" },
      { commodityName: "Bawang", quantity: 0.04, unit: "kg" },
      { commodityName: "Chicken Egg", quantity: 2, unit: "pcs" }
    ]
  },
  {
    id: 48,
    name: "Paksiw na Pata",
    category: "Main Dish",
    servings: 5,
    image: "🍖",
    description: "Slow-braised pork hock in sweet tangy native vinegar sauce with dried banana blossoms, peppercorns, and caramelized garlic.",
    tags: ["Main Dish", "Pork", "Comfort Food"],
    ingredients: [
      { commodityName: "Pork Pata (Pork Hock / Knuckle)", quantity: 0.8, unit: "kg" },
      { commodityName: "Bawang", quantity: 0.08, unit: "kg" },
      { commodityName: "Sibuyas", quantity: 0.06, unit: "kg" }
    ]
  },
  {
    id: 49,
    name: "Pork Sisig with Calamansi & Sili",
    category: "Main Dish",
    servings: 4,
    image: "🍳",
    description: "Sizzling minced grilled pork face and belly seasoned with native red onions, green finger chilies, liver spread, and freshly squeezed calamansi.",
    tags: ["Main Dish", "Pork", "Spicy"],
    ingredients: [
      { commodityName: "Pork Maskara & Tenga (For Sisig)", quantity: 0.5, unit: "kg" },
      { commodityName: "Sibuyas", quantity: 0.12, unit: "kg" },
      { commodityName: "Chicken Egg", quantity: 1, unit: "pcs" },
      { commodityName: "Bawang", quantity: 0.04, unit: "kg" }
    ]
  },
  {
    id: 50,
    name: "Pesang Tilapia sa Luya at Pechay",
    category: "Soup",
    servings: 4,
    image: "🍲",
    description: "Light and cleansing freshwater ginger broth with live tilapia and tender native pechay, served with savory fermented soybean dip.",
    tags: ["Soup", "Seafood", "Healthy"],
    ingredients: [
      { commodityName: "Tilapia", quantity: 0.6, unit: "kg" },
      { commodityName: "Pechay Tagalog", quantity: 2, unit: "bundles" },
      { commodityName: "Luya", quantity: 0.06, unit: "kg" },
      { commodityName: "Sibuyas", quantity: 0.05, unit: "kg" },
      { commodityName: "Bawang", quantity: 0.03, unit: "kg" }
    ]
  },
  {
    id: 51,
    name: "Sweet and Sour Tilapia",
    category: "Seafood",
    servings: 4,
    image: "🐟",
    description: "Crisp-fried whole tilapia smothered in vibrant sweet and sour tomato sauce with bell peppers, onions, and carrots.",
    tags: ["Seafood", "Classic", "Main Dish"],
    ingredients: [
      { commodityName: "Tilapia", quantity: 0.65, unit: "kg" },
      { commodityName: "Carrots", quantity: 0.12, unit: "kg" },
      { commodityName: "Kamatis", quantity: 0.15, unit: "kg" },
      { commodityName: "Sibuyas", quantity: 0.06, unit: "kg" },
      { commodityName: "Bawang", quantity: 0.03, unit: "kg" }
    ]
  },
  {
    id: 52,
    name: "Ginisang Baguio Beans na may Baboy",
    category: "Vegetables",
    servings: 4,
    image: "🌱",
    description: "Snap-fresh Baguio green beans quickly sautéed with tender pork strips, tomatoes, and garlic.",
    tags: ["Vegetables", "Quick Cook", "Healthy"],
    ingredients: [
      { commodityName: "Baguio Beans", quantity: 0.35, unit: "kg" },
      { commodityName: "Pork Kasim", quantity: 0.2, unit: "kg" },
      { commodityName: "Kamatis", quantity: 0.1, unit: "kg" },
      { commodityName: "Sibuyas", quantity: 0.05, unit: "kg" },
      { commodityName: "Bawang", quantity: 0.03, unit: "kg" }
    ]
  },
  {
    id: 53,
    name: "Pancit Bihon at Canton Guisado",
    category: "Rice Dish",
    servings: 6,
    image: "🍜",
    description: "Party favorite festive noodle combination loaded with sliced pork, Baguio cabbage, carrots, and savory soy broth.",
    tags: ["Rice Dish", "Noodles", "Party"],
    ingredients: [
      { commodityName: "Pork Kasim", quantity: 0.3, unit: "kg" },
      { commodityName: "Repolyo", quantity: 0.25, unit: "kg" },
      { commodityName: "Carrots", quantity: 0.15, unit: "kg" },
      { commodityName: "Bawang", quantity: 0.04, unit: "kg" },
      { commodityName: "Sibuyas", quantity: 0.06, unit: "kg" }
    ]
  },
  {
    id: 54,
    name: "Ginataang Tilapia sa Dahon ng Mustasa",
    category: "Seafood",
    servings: 4,
    image: "🥥🐟",
    description: "Fresh tilapia simmered in thick coconut milk with spicy finger chilies, ginger, and piquant mustard greens.",
    tags: ["Seafood", "Coconut", "Spicy"],
    ingredients: [
      { commodityName: "Tilapia", quantity: 0.6, unit: "kg" },
      { commodityName: "Luya", quantity: 0.05, unit: "kg" },
      { commodityName: "Bawang", quantity: 0.04, unit: "kg" },
      { commodityName: "Sibuyas", quantity: 0.05, unit: "kg" },
      { commodityName: "Pechay Tagalog", quantity: 1, unit: "bundle" }
    ]
  }
];

const combined = [...currentRecipes, ...newRecipes];
fs.writeFileSync('src/assets/data/recipes.json', JSON.stringify(combined, null, 2), 'utf8');
console.log('Successfully wrote expanded recipes list! Total recipes:', combined.length);

