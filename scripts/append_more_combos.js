const fs = require('fs');
const path = require('path');

const recipesPath = path.join(__dirname, '../src/assets/data/recipes.json');
const r = JSON.parse(fs.readFileSync(recipesPath, 'utf8'));

const moreCombos = [
  {
    id: 55,
    name: 'Combo: Laing na may Tinapa + Pritong Bangus',
    description: 'Bicolano-style gabi leaves simmered in creamy coconut milk with flaked smoked fish, paired with crispy golden fried bangus.',
    category: 'Combos',
    servings: 4,
    prepTimeMinutes: 20,
    cookTimeMinutes: 35,
    totalBudgetEst: 275,
    budgetPerServingEst: 68.75,
    difficulty: 'Easy',
    isBudgetFriendly: true,
    tags: ['Gulay', 'Isda', 'Gata', 'Combos'],
    ingredients: [
      { name: 'Dahon ng Gabi (Tuyo)', quantity: 100, unit: 'g', estimatedPrice: 40 },
      { name: 'Kakang Gata & Gata', quantity: 400, unit: 'ml', estimatedPrice: 50 },
      { name: 'Bangus (Medium)', quantity: 400, unit: 'g', estimatedPrice: 110 },
      { name: 'Tinapa flakes / Luya / Bawang / Siling Haba', quantity: 1, unit: 'set', estimatedPrice: 45 },
      { name: 'Mantika at Asin', quantity: 1, unit: 'serv', estimatedPrice: 30 }
    ],
    instructions: [
      'Gisa ang luya, sibuyas, bawang, at siling labuyo.',
      'Ibuhos ang pangalawang piga ng gata at pakuluin nang mahinang apoy nang hindi hinahalo.',
      'Ilagay ang tuyong dahon ng gabi. Huwag haluin sa unang 10 minuto para hindi kumati.',
      'Ibuhos ang kakang gata at patuyuin nang bahagya hanggang lumabas ang langis.',
      'Sa hiwalay na kawali, iprito ang bangus hanggang malutong at ihain nang magkasama.'
    ],
    nutritionEstimate: { calories: 520, protein: '34g', fat: '38g', carbs: '14g' }
  },
  {
    id: 56,
    name: 'Combo: Sinigang na Bangus + Tortang Talong',
    description: 'Maasim at mainit na sabaw ng bangus sa sampalok na may kangkong at labanos, kapares ang malambot at malasang tortang talong.',
    category: 'Combos',
    servings: 4,
    prepTimeMinutes: 15,
    cookTimeMinutes: 25,
    totalBudgetEst: 260,
    budgetPerServingEst: 65,
    difficulty: 'Easy',
    isBudgetFriendly: true,
    tags: ['Isda', 'Gulay', 'Sabaw', 'Combos'],
    ingredients: [
      { name: 'Bangus (Slices)', quantity: 500, unit: 'g', estimatedPrice: 130 },
      { name: 'Sinigang Mix sa Sampalok', quantity: 1, unit: 'pack', estimatedPrice: 18 },
      { name: 'Kangkong, Labanos, Sitaw', quantity: 1, unit: 'tali', estimatedPrice: 40 },
      { name: 'Talong (Malalaki)', quantity: 3, unit: 'pcs', estimatedPrice: 35 },
      { name: 'Itlog', quantity: 2, unit: 'pcs', estimatedPrice: 18 },
      { name: 'Mantika at Panimpla', quantity: 1, unit: 'serv', estimatedPrice: 19 }
    ],
    instructions: [
      'Pakuluin ang tubig na may kamatis at sibuyas. Ilagay ang labanos at sitaw.',
      'Ilagay ang hiwa ng bangus at sinigang mix. Hayaang maluto nang 7 minuto.',
      'Idagdag ang kangkong at patayin ang apoy.',
      'Ihawin ang mga talong, balatan, pisaing bahagya at isawsaw sa binating itlog na may asin.',
      'Prituhin ang tortang talong hanggang mag-golden brown. Ihain kasama ang mainit na sinigang.'
    ],
    nutritionEstimate: { calories: 380, protein: '32g', fat: '20g', carbs: '16g' }
  },
  {
    id: 57,
    name: 'Combo: Bicol Express + Pritong Galunggong',
    description: 'Maanghang at creamy na baboy sa gata at alamang na tinambalan ng malulutong na pritong galunggong para balanse ang alat at anghang.',
    category: 'Combos',
    servings: 4,
    prepTimeMinutes: 15,
    cookTimeMinutes: 30,
    totalBudgetEst: 295,
    budgetPerServingEst: 73.75,
    difficulty: 'Medium',
    isBudgetFriendly: true,
    tags: ['Baboy', 'Gata', 'Maanghang', 'Combos'],
    ingredients: [
      { name: 'Kasim o Liempo ng Baboy', quantity: 350, unit: 'g', estimatedPrice: 125 },
      { name: 'Gata ng Niyog', quantity: 400, unit: 'ml', estimatedPrice: 50 },
      { name: 'Bagoong Alamang', quantity: 2, unit: 'tbsp', estimatedPrice: 20 },
      { name: 'Siling Haba at Siling Labuyo', quantity: 1, unit: 'cup', estimatedPrice: 30 },
      { name: 'Galunggong', quantity: 400, unit: 'g', estimatedPrice: 90 },
      { name: 'Mantika at Bawang/Sibuyas', quantity: 1, unit: 'serv', estimatedPrice: 25 }
    ],
    instructions: [
      'Gisahin ang bawang, sibuyas, luya at bagoong alamang.',
      'Ilagay ang hiwa ng baboy at lutuin hanggang mamuti.',
      'Ibuhos ang gata at pakuluin nang mahina hanggang lumambot ang baboy.',
      'Ilagay ang sangkaterbang siling haba at pakuluin hanggang mag-langis ang gata.',
      'Iprito ang sariwang galunggong hanggang crispy. Ihain sabay sa maanghang na Bicol Express.'
    ],
    nutritionEstimate: { calories: 590, protein: '38g', fat: '45g', carbs: '9g' }
  },
  {
    id: 58,
    name: 'Combo: Nilagang Baka + Ensaladang Mangga at Bagoong',
    description: 'Malinamnam at malambot na baka na may repolyo at patatas, sinasabayan ng maasim-asim na hilaw na mangga na may bagoong alamang.',
    category: 'Combos',
    servings: 4,
    prepTimeMinutes: 15,
    cookTimeMinutes: 60,
    totalBudgetEst: 370,
    budgetPerServingEst: 92.50,
    difficulty: 'Medium',
    isBudgetFriendly: false,
    tags: ['Baka', 'Sabaw', 'Ensalada', 'Combos'],
    ingredients: [
      { name: 'Puntay o Baka Pang-Nilaga', quantity: 500, unit: 'g', estimatedPrice: 230 },
      { name: 'Repolyo at Pechay Baguio', quantity: 1, unit: 'set', estimatedPrice: 40 },
      { name: 'Patatas at Mais', quantity: 2, unit: 'pcs', estimatedPrice: 40 },
      { name: 'Hilaw na Mangga (Carabao/Indian)', quantity: 2, unit: 'pcs', estimatedPrice: 35 },
      { name: 'Ginisang Bagoong Alamang', quantity: 2, unit: 'tbsp', estimatedPrice: 25 }
    ],
    instructions: [
      'Pakuluin ang baka sa tubig na may sibuyas at buong paminta hanggang maging malambot (mga 50-60 minuto).',
      'Ilagay ang mais at patatas hanggang lumambot.',
      'Timplahan ng patis at ihagis ang repolyo at pechay. Patayin ang apoy.',
      'Hiwain ang hilaw na mangga at ihalo sa bagoong alamang.',
      'Ihain ang umuusok na nilaga kasama ang nakakaganang ensaladang mangga.'
    ],
    nutritionEstimate: { calories: 440, protein: '36g', fat: '22g', carbs: '26g' }
  },
  {
    id: 59,
    name: 'Combo: Kare-Kareng Gulay at Baboy + Bagoong Alamang',
    description: 'Tradisyunal na sarsang mani na may tuwalya o liempo ng baboy, pechay, sitaw, at talong, tinatambalan ng espesyal na ginisang alamang.',
    category: 'Combos',
    servings: 4,
    prepTimeMinutes: 20,
    cookTimeMinutes: 45,
    totalBudgetEst: 340,
    budgetPerServingEst: 85,
    difficulty: 'Medium',
    isBudgetFriendly: false,
    tags: ['Baboy', 'Gulay', 'Mani', 'Combos'],
    ingredients: [
      { name: 'Liempo o Pata ng Baboy', quantity: 450, unit: 'g', estimatedPrice: 165 },
      { name: 'Peanut Butter (Unsweetened)', quantity: 1, unit: 'cup', estimatedPrice: 50 },
      { name: 'Achuete (Pampakulay)', quantity: 1, unit: 'pack', estimatedPrice: 15 },
      { name: 'Talong, Sitaw, Puso ng Saging, Pechay', quantity: 1, unit: 'set', estimatedPrice: 65 },
      { name: 'Ginisang Bagoong Alamang', quantity: 3, unit: 'tbsp', estimatedPrice: 30 },
      { name: 'Bigas na sangag at giling (Pampalapot)', quantity: 2, unit: 'tbsp', estimatedPrice: 15 }
    ],
    instructions: [
      'Pakuluan ang baboy hanggang lumambot. Itabi ang sabaw.',
      'Gisahin ang bawang at sibuyas. Idagdag ang katas ng achuete para sa matingkad na kulay.',
      'Ihalo ang peanut butter at sabaw ng baboy. Haluin nang mabuti hanggang lumapot ang sarsa.',
      'Ihalo ang pinakuluang baboy at mga gulay (talong, sitaw, puso ng saging, pechay).',
      'Ihain nang mainit kapares ang malinamnam na ginisang bagoong alamang.'
    ],
    nutritionEstimate: { calories: 570, protein: '33g', fat: '42g', carbs: '18g' }
  },
  {
    id: 60,
    name: 'Combo: Dinuguan + Pritong Tokwa at Puto',
    description: 'Malinamnam at maasim-asim na dinuguan ng baboy na may siling haba, sinasabayan ng malutong na tokwa at puto.',
    category: 'Combos',
    servings: 4,
    prepTimeMinutes: 15,
    cookTimeMinutes: 40,
    totalBudgetEst: 270,
    budgetPerServingEst: 67.50,
    difficulty: 'Medium',
    isBudgetFriendly: true,
    tags: ['Baboy', 'Classic', 'Combos'],
    ingredients: [
      { name: 'Laman at Taba ng Baboy', quantity: 400, unit: 'g', estimatedPrice: 140 },
      { name: 'Dugo ng Baboy', quantity: 1.5, unit: 'cup', estimatedPrice: 35 },
      { name: 'Suka at Bawang/Sibuyas/Luya', quantity: 1, unit: 'set', estimatedPrice: 25 },
      { name: 'Siling Haba', quantity: 3, unit: 'pcs', estimatedPrice: 15 },
      { name: 'Tokwa (Firm Tofu)', quantity: 2, unit: 'blocks', estimatedPrice: 30 },
      { name: 'Mantika at Panimpla', quantity: 1, unit: 'serv', estimatedPrice: 25 }
    ],
    instructions: [
      'Gisahin ang bawang, luya at sibuyas. Ilagay ang hiwa ng baboy at lutuin hanggang magmantika.',
      'Ibuhos ang suka nang hindi hinahalo. Pakuluin nang 5 minuto.',
      'Ibuhos ang sinalang dugo ng baboy habang patuloy na hinahalo upang hindi mamuo.',
      'Ilagay ang siling haba, timplahan ng asin at paminta, at hayaang lumapot ang sarsa.',
      'Prituhin ang hiwa-hiwang tokwa hanggang crispy. Ihain kasama ang dinuguan at puto o kanin.'
    ],
    nutritionEstimate: { calories: 480, protein: '37g', fat: '31g', carbs: '15g' }
  }
];

// Check if already added
if (r.find(x => x.id === 55)) {
  console.log('Combos 55-60 already exist.');
} else {
  r.push(...moreCombos);
  fs.writeFileSync(recipesPath, JSON.stringify(r, null, 2));
  console.log('Successfully saved! Total recipes:', r.length);
}

