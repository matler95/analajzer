/**
 * Otomoto brands and models — mirrors what is available on otomoto.pl
 * Slug format matches otomoto URL structure for search building.
 */

export const OTOMOTO_BRANDS = [
  { label: "Alfa Romeo", slug: "alfa-romeo" },
  { label: "Aston Martin", slug: "aston-martin" },
  { label: "Audi", slug: "audi" },
  { label: "Bentley", slug: "bentley" },
  { label: "BMW", slug: "bmw" },
  { label: "Bugatti", slug: "bugatti" },
  { label: "Cadillac", slug: "cadillac" },
  { label: "Chevrolet", slug: "chevrolet" },
  { label: "Chrysler", slug: "chrysler" },
  { label: "Citroën", slug: "citroen" },
  { label: "Cupra", slug: "cupra" },
  { label: "Dacia", slug: "dacia" },
  { label: "Daewoo", slug: "daewoo" },
  { label: "Daihatsu", slug: "daihatsu" },
  { label: "Dodge", slug: "dodge" },
  { label: "DS Automobiles", slug: "ds-automobiles" },
  { label: "Ferrari", slug: "ferrari" },
  { label: "Fiat", slug: "fiat" },
  { label: "Ford", slug: "ford" },
  { label: "Honda", slug: "honda" },
  { label: "Hyundai", slug: "hyundai" },
  { label: "Infiniti", slug: "infiniti" },
  { label: "Jaguar", slug: "jaguar" },
  { label: "Jeep", slug: "jeep" },
  { label: "Kia", slug: "kia" },
  { label: "Lamborghini", slug: "lamborghini" },
  { label: "Lancia", slug: "lancia" },
  { label: "Land Rover", slug: "land-rover" },
  { label: "Lexus", slug: "lexus" },
  { label: "Lincoln", slug: "lincoln" },
  { label: "Lotus", slug: "lotus" },
  { label: "Maserati", slug: "maserati" },
  { label: "Mazda", slug: "mazda" },
  { label: "McLaren", slug: "mclaren" },
  { label: "Mercedes-Benz", slug: "mercedes-benz" },
  { label: "MG", slug: "mg" },
  { label: "Mini", slug: "mini" },
  { label: "Mitsubishi", slug: "mitsubishi" },
  { label: "Nissan", slug: "nissan" },
  { label: "Opel", slug: "opel" },
  { label: "Peugeot", slug: "peugeot" },
  { label: "Polonez", slug: "polonez" },
  { label: "Porsche", slug: "porsche" },
  { label: "Renault", slug: "renault" },
  { label: "Rolls-Royce", slug: "rolls-royce" },
  { label: "Rover", slug: "rover" },
  { label: "Saab", slug: "saab" },
  { label: "SEAT", slug: "seat" },
  { label: "Skoda", slug: "skoda" },
  { label: "Smart", slug: "smart" },
  { label: "SsangYong", slug: "ssangyong" },
  { label: "Subaru", slug: "subaru" },
  { label: "Suzuki", slug: "suzuki" },
  { label: "Tesla", slug: "tesla" },
  { label: "Toyota", slug: "toyota" },
  { label: "Volkswagen", slug: "volkswagen" },
  { label: "Volvo", slug: "volvo" },
];

export const OTOMOTO_MODELS = {
  "alfa-romeo": [
    { label: "147", slug: "147" }, { label: "156", slug: "156" }, { label: "159", slug: "159" },
    { label: "166", slug: "166" }, { label: "Giulia", slug: "giulia" }, { label: "Giulietta", slug: "giulietta" },
    { label: "GT", slug: "gt" }, { label: "GTV", slug: "gtv" }, { label: "MiTo", slug: "mito" },
    { label: "Spider", slug: "spider" }, { label: "Stelvio", slug: "stelvio" }, { label: "Tonale", slug: "tonale" },
  ],
  "audi": [
    { label: "A1", slug: "a1" }, { label: "A2", slug: "a2" }, { label: "A3", slug: "a3" },
    { label: "A4", slug: "a4" }, { label: "A4 Allroad", slug: "a4-allroad" }, { label: "A5", slug: "a5" },
    { label: "A6", slug: "a6" }, { label: "A6 Allroad", slug: "a6-allroad" }, { label: "A7", slug: "a7" },
    { label: "A8", slug: "a8" }, { label: "e-tron", slug: "e-tron" }, { label: "Q2", slug: "q2" },
    { label: "Q3", slug: "q3" }, { label: "Q4 e-tron", slug: "q4-e-tron" }, { label: "Q5", slug: "q5" },
    { label: "Q7", slug: "q7" }, { label: "Q8", slug: "q8" }, { label: "R8", slug: "r8" },
    { label: "RS3", slug: "rs3" }, { label: "RS4", slug: "rs4" }, { label: "RS5", slug: "rs5" },
    { label: "RS6", slug: "rs6" }, { label: "RS7", slug: "rs7" }, { label: "S3", slug: "s3" },
    { label: "S4", slug: "s4" }, { label: "S5", slug: "s5" }, { label: "S6", slug: "s6" },
    { label: "S8", slug: "s8" }, { label: "TT", slug: "tt" },
  ],
  "bmw": [
    { label: "Seria 1", slug: "seria-1" }, { label: "Seria 2", slug: "seria-2" }, { label: "Seria 3", slug: "seria-3" },
    { label: "Seria 4", slug: "seria-4" }, { label: "Seria 5", slug: "seria-5" }, { label: "Seria 6", slug: "seria-6" },
    { label: "Seria 7", slug: "seria-7" }, { label: "Seria 8", slug: "seria-8" }, { label: "i3", slug: "i3" },
    { label: "i4", slug: "i4" }, { label: "i5", slug: "i5" }, { label: "i7", slug: "i7" },
    { label: "iX", slug: "ix" }, { label: "iX3", slug: "ix3" }, { label: "M2", slug: "m2" },
    { label: "M3", slug: "m3" }, { label: "M4", slug: "m4" }, { label: "M5", slug: "m5" },
    { label: "M6", slug: "m6" }, { label: "X1", slug: "x1" }, { label: "X2", slug: "x2" },
    { label: "X3", slug: "x3" }, { label: "X4", slug: "x4" }, { label: "X5", slug: "x5" },
    { label: "X6", slug: "x6" }, { label: "X7", slug: "x7" }, { label: "Z4", slug: "z4" },
  ],
  "chevrolet": [
    { label: "Aveo", slug: "aveo" }, { label: "Camaro", slug: "camaro" }, { label: "Captiva", slug: "captiva" },
    { label: "Corvette", slug: "corvette" }, { label: "Cruze", slug: "cruze" }, { label: "Equinox", slug: "equinox" },
    { label: "Lacetti", slug: "lacetti" }, { label: "Malibu", slug: "malibu" }, { label: "Spark", slug: "spark" },
    { label: "Trax", slug: "trax" },
  ],
  "citroen": [
    { label: "Berlingo", slug: "berlingo" }, { label: "C1", slug: "c1" }, { label: "C2", slug: "c2" },
    { label: "C3", slug: "c3" }, { label: "C3 Aircross", slug: "c3-aircross" }, { label: "C4", slug: "c4" },
    { label: "C4 Cactus", slug: "c4-cactus" }, { label: "C4 Picasso", slug: "c4-picasso" }, { label: "C5", slug: "c5" },
    { label: "C5 Aircross", slug: "c5-aircross" }, { label: "C5 X", slug: "c5-x" }, { label: "C6", slug: "c6" },
    { label: "C8", slug: "c8" }, { label: "Jumpy", slug: "jumpy" }, { label: "Xsara", slug: "xsara" },
  ],
  "cupra": [
    { label: "Ateca", slug: "ateca" }, { label: "Born", slug: "born" }, { label: "Formentor", slug: "formentor" },
    { label: "Leon", slug: "leon" }, { label: "Tavascan", slug: "tavascan" },
  ],
  "dacia": [
    { label: "Duster", slug: "duster" }, { label: "Jogger", slug: "jogger" }, { label: "Logan", slug: "logan" },
    { label: "Lodgy", slug: "lodgy" }, { label: "Sandero", slug: "sandero" }, { label: "Spring", slug: "spring" },
  ],
  "fiat": [
    { label: "500", slug: "500" }, { label: "500L", slug: "500l" }, { label: "500X", slug: "500x" },
    { label: "Bravo", slug: "bravo" }, { label: "Doblo", slug: "doblo" }, { label: "Ducato", slug: "ducato" },
    { label: "Grande Punto", slug: "grande-punto" }, { label: "Multipla", slug: "multipla" },
    { label: "Panda", slug: "panda" }, { label: "Punto", slug: "punto" }, { label: "Tipo", slug: "tipo" },
  ],
  "ford": [
    { label: "B-Max", slug: "b-max" }, { label: "C-Max", slug: "c-max" }, { label: "EcoSport", slug: "ecosport" },
    { label: "Edge", slug: "edge" }, { label: "Explorer", slug: "explorer" }, { label: "Fiesta", slug: "fiesta" },
    { label: "Focus", slug: "focus" }, { label: "Fusion", slug: "fusion" }, { label: "Galaxy", slug: "galaxy" },
    { label: "Ka", slug: "ka" }, { label: "Kuga", slug: "kuga" }, { label: "Mondeo", slug: "mondeo" },
    { label: "Mustang", slug: "mustang" }, { label: "Mustang Mach-E", slug: "mustang-mach-e" },
    { label: "Puma", slug: "puma" }, { label: "Ranger", slug: "ranger" }, { label: "S-Max", slug: "s-max" },
  ],
  "honda": [
    { label: "Accord", slug: "accord" }, { label: "Civic", slug: "civic" }, { label: "CR-V", slug: "cr-v" },
    { label: "CR-Z", slug: "cr-z" }, { label: "HR-V", slug: "hr-v" }, { label: "Jazz", slug: "jazz" },
    { label: "Legend", slug: "legend" }, { label: "NSX", slug: "nsx" },
  ],
  "hyundai": [
    { label: "Bayon", slug: "bayon" }, { label: "Elantra", slug: "elantra" }, { label: "Getz", slug: "getz" },
    { label: "i10", slug: "i10" }, { label: "i20", slug: "i20" }, { label: "i30", slug: "i30" },
    { label: "i40", slug: "i40" }, { label: "IONIQ", slug: "ioniq" }, { label: "IONIQ 5", slug: "ioniq-5" },
    { label: "IONIQ 6", slug: "ioniq-6" }, { label: "ix20", slug: "ix20" }, { label: "ix35", slug: "ix35" },
    { label: "Kona", slug: "kona" }, { label: "Santa Fe", slug: "santa-fe" }, { label: "Tucson", slug: "tucson" },
  ],
  "kia": [
    { label: "Carnival", slug: "carnival" }, { label: "Cee'd", slug: "ceed" }, { label: "EV6", slug: "ev6" },
    { label: "Niro", slug: "niro" }, { label: "Optima", slug: "optima" }, { label: "Picanto", slug: "picanto" },
    { label: "ProCee'd", slug: "pro-ceed" }, { label: "Rio", slug: "rio" }, { label: "Sorento", slug: "sorento" },
    { label: "Soul", slug: "soul" }, { label: "Sportage", slug: "sportage" }, { label: "Stinger", slug: "stinger" },
    { label: "Stonic", slug: "stonic" }, { label: "XCeed", slug: "xceed" },
  ],
  "land-rover": [
    { label: "Defender", slug: "defender" }, { label: "Discovery", slug: "discovery" },
    { label: "Discovery Sport", slug: "discovery-sport" }, { label: "Freelander", slug: "freelander" },
    { label: "Range Rover", slug: "range-rover" }, { label: "Range Rover Evoque", slug: "range-rover-evoque" },
    { label: "Range Rover Sport", slug: "range-rover-sport" }, { label: "Range Rover Velar", slug: "range-rover-velar" },
  ],
  "lexus": [
    { label: "CT", slug: "ct" }, { label: "ES", slug: "es" }, { label: "GS", slug: "gs" },
    { label: "IS", slug: "is" }, { label: "LC", slug: "lc" }, { label: "LS", slug: "ls" },
    { label: "NX", slug: "nx" }, { label: "RC", slug: "rc" }, { label: "RX", slug: "rx" },
    { label: "UX", slug: "ux" },
  ],
  "mazda": [
    { label: "2", slug: "2" }, { label: "3", slug: "3" }, { label: "5", slug: "5" },
    { label: "6", slug: "6" }, { label: "CX-3", slug: "cx-3" }, { label: "CX-30", slug: "cx-30" },
    { label: "CX-5", slug: "cx-5" }, { label: "CX-60", slug: "cx-60" }, { label: "MX-30", slug: "mx-30" },
    { label: "MX-5", slug: "mx-5" }, { label: "RX-8", slug: "rx-8" },
  ],
  "mercedes-benz": [
    { label: "Klasa A", slug: "klasa-a" }, { label: "Klasa B", slug: "klasa-b" }, { label: "Klasa C", slug: "klasa-c" },
    { label: "Klasa CL", slug: "klasa-cl" }, { label: "Klasa CLA", slug: "klasa-cla" }, { label: "Klasa CLK", slug: "klasa-clk" },
    { label: "Klasa CLS", slug: "klasa-cls" }, { label: "Klasa E", slug: "klasa-e" }, { label: "Klasa G", slug: "klasa-g" },
    { label: "Klasa GL", slug: "klasa-gl" }, { label: "Klasa GLA", slug: "klasa-gla" }, { label: "Klasa GLB", slug: "klasa-glb" },
    { label: "Klasa GLC", slug: "klasa-glc" }, { label: "Klasa GLE", slug: "klasa-gle" }, { label: "Klasa GLS", slug: "klasa-gls" },
    { label: "Klasa M", slug: "klasa-m" }, { label: "Klasa R", slug: "klasa-r" }, { label: "Klasa S", slug: "klasa-s" },
    { label: "Klasa SL", slug: "klasa-sl" }, { label: "Klasa SLK", slug: "klasa-slk" }, { label: "Klasa V", slug: "klasa-v" },
    { label: "AMG GT", slug: "amg-gt" }, { label: "EQA", slug: "eqa" }, { label: "EQB", slug: "eqb" },
    { label: "EQC", slug: "eqc" }, { label: "EQE", slug: "eqe" }, { label: "EQS", slug: "eqs" },
    { label: "Sprinter", slug: "sprinter" }, { label: "Viano", slug: "viano" }, { label: "Vito", slug: "vito" },
  ],
  "mini": [
    { label: "Cabrio", slug: "cabrio" }, { label: "Clubman", slug: "clubman" }, { label: "Countryman", slug: "countryman" },
    { label: "Coupe", slug: "coupe" }, { label: "Hatch", slug: "hatch" }, { label: "One", slug: "one" },
    { label: "Paceman", slug: "paceman" },
  ],
  "mitsubishi": [
    { label: "ASX", slug: "asx" }, { label: "Colt", slug: "colt" }, { label: "Eclipse Cross", slug: "eclipse-cross" },
    { label: "Galant", slug: "galant" }, { label: "L200", slug: "l200" }, { label: "Lancer", slug: "lancer" },
    { label: "Outlander", slug: "outlander" }, { label: "Pajero", slug: "pajero" }, { label: "Space Star", slug: "space-star" },
  ],
  "nissan": [
    { label: "350Z", slug: "350z" }, { label: "370Z", slug: "370z" }, { label: "Almera", slug: "almera" },
    { label: "GT-R", slug: "gt-r" }, { label: "Juke", slug: "juke" }, { label: "Leaf", slug: "leaf" },
    { label: "Micra", slug: "micra" }, { label: "Murano", slug: "murano" }, { label: "Navara", slug: "navara" },
    { label: "Pathfinder", slug: "pathfinder" }, { label: "Primera", slug: "primera" }, { label: "Qashqai", slug: "qashqai" },
    { label: "X-Trail", slug: "x-trail" },
  ],
  "opel": [
    { label: "Adam", slug: "adam" }, { label: "Agila", slug: "agila" }, { label: "Astra", slug: "astra" },
    { label: "Cascada", slug: "cascada" }, { label: "Combo", slug: "combo" }, { label: "Corsa", slug: "corsa" },
    { label: "Crossland", slug: "crossland" }, { label: "Frontera", slug: "frontera" }, { label: "Grandland", slug: "grandland" },
    { label: "Insignia", slug: "insignia" }, { label: "Meriva", slug: "meriva" }, { label: "Mokka", slug: "mokka" },
    { label: "Movano", slug: "movano" }, { label: "Omega", slug: "omega" }, { label: "Vectra", slug: "vectra" },
    { label: "Vivaro", slug: "vivaro" }, { label: "Zafira", slug: "zafira" },
  ],
  "peugeot": [
    { label: "107", slug: "107" }, { label: "108", slug: "108" }, { label: "206", slug: "206" },
    { label: "207", slug: "207" }, { label: "208", slug: "208" }, { label: "2008", slug: "2008" },
    { label: "307", slug: "307" }, { label: "308", slug: "308" }, { label: "3008", slug: "3008" },
    { label: "407", slug: "407" }, { label: "408", slug: "408" }, { label: "5008", slug: "5008" },
    { label: "508", slug: "508" }, { label: "607", slug: "607" }, { label: "Partner", slug: "partner" },
    { label: "RCZ", slug: "rcz" }, { label: "Rifter", slug: "rifter" },
  ],
  "porsche": [
    { label: "718", slug: "718" }, { label: "911", slug: "911" }, { label: "Cayenne", slug: "cayenne" },
    { label: "Cayman", slug: "cayman" }, { label: "Macan", slug: "macan" }, { label: "Panamera", slug: "panamera" },
    { label: "Taycan", slug: "taycan" },
  ],
  "renault": [
    { label: "Arkana", slug: "arkana" }, { label: "Austral", slug: "austral" }, { label: "Captur", slug: "captur" },
    { label: "Clio", slug: "clio" }, { label: "Espace", slug: "espace" }, { label: "Grand Scenic", slug: "grand-scenic" },
    { label: "Kadjar", slug: "kadjar" }, { label: "Kangoo", slug: "kangoo" }, { label: "Koleos", slug: "koleos" },
    { label: "Laguna", slug: "laguna" }, { label: "Megane", slug: "megane" }, { label: "Modus", slug: "modus" },
    { label: "Sandero", slug: "sandero" }, { label: "Scenic", slug: "scenic" }, { label: "Symbol", slug: "symbol" },
    { label: "Talisman", slug: "talisman" }, { label: "Twingo", slug: "twingo" }, { label: "Zoe", slug: "zoe" },
  ],
  "seat": [
    { label: "Alhambra", slug: "alhambra" }, { label: "Altea", slug: "altea" }, { label: "Arona", slug: "arona" },
    { label: "Ateca", slug: "ateca" }, { label: "Córdoba", slug: "cordoba" }, { label: "Exeo", slug: "exeo" },
    { label: "Ibiza", slug: "ibiza" }, { label: "Leon", slug: "leon" }, { label: "Mii", slug: "mii" },
    { label: "Tarraco", slug: "tarraco" }, { label: "Toledo", slug: "toledo" },
  ],
  "skoda": [
    { label: "Citigo", slug: "citigo" }, { label: "Enyaq", slug: "enyaq" }, { label: "Fabia", slug: "fabia" },
    { label: "Kamiq", slug: "kamiq" }, { label: "Karoq", slug: "karoq" }, { label: "Kodiaq", slug: "kodiaq" },
    { label: "Octavia", slug: "octavia" }, { label: "Rapid", slug: "rapid" }, { label: "Roomster", slug: "roomster" },
    { label: "Scala", slug: "scala" }, { label: "Superb", slug: "superb" }, { label: "Yeti", slug: "yeti" },
  ],
  "subaru": [
    { label: "BRZ", slug: "brz" }, { label: "Forester", slug: "forester" }, { label: "Impreza", slug: "impreza" },
    { label: "Legacy", slug: "legacy" }, { label: "Levorg", slug: "levorg" }, { label: "Outback", slug: "outback" },
    { label: "WRX STI", slug: "wrx-sti" }, { label: "XV", slug: "xv" },
  ],
  "suzuki": [
    { label: "Alto", slug: "alto" }, { label: "Baleno", slug: "baleno" }, { label: "Celerio", slug: "celerio" },
    { label: "Grand Vitara", slug: "grand-vitara" }, { label: "Ignis", slug: "ignis" }, { label: "Jimny", slug: "jimny" },
    { label: "S-Cross", slug: "s-cross" }, { label: "Swift", slug: "swift" }, { label: "SX4", slug: "sx4" },
    { label: "Vitara", slug: "vitara" },
  ],
  "tesla": [
    { label: "Model 3", slug: "model-3" }, { label: "Model S", slug: "model-s" }, { label: "Model X", slug: "model-x" },
    { label: "Model Y", slug: "model-y" }, { label: "Roadster", slug: "roadster" },
  ],
  "toyota": [
    { label: "Auris", slug: "auris" }, { label: "Avensis", slug: "avensis" }, { label: "Aygo", slug: "aygo" },
    { label: "bZ4X", slug: "bz4x" }, { label: "C-HR", slug: "c-hr" }, { label: "Camry", slug: "camry" },
    { label: "Corolla", slug: "corolla" }, { label: "GR86", slug: "gr86" }, { label: "GR Yaris", slug: "gr-yaris" },
    { label: "GT86", slug: "gt86" }, { label: "Highlander", slug: "highlander" }, { label: "Hilux", slug: "hilux" },
    { label: "Land Cruiser", slug: "land-cruiser" }, { label: "Prius", slug: "prius" }, { label: "ProAce", slug: "proace" },
    { label: "RAV4", slug: "rav4" }, { label: "Supra", slug: "supra" }, { label: "Verso", slug: "verso" },
    { label: "Yaris", slug: "yaris" }, { label: "Yaris Cross", slug: "yaris-cross" },
  ],
  "volkswagen": [
    { label: "Amarok", slug: "amarok" }, { label: "Arteon", slug: "arteon" }, { label: "Beetle", slug: "beetle" },
    { label: "Caddy", slug: "caddy" }, { label: "CC", slug: "cc" }, { label: "Crafter", slug: "crafter" },
    { label: "Eos", slug: "eos" }, { label: "Golf", slug: "golf" }, { label: "Golf Plus", slug: "golf-plus" },
    { label: "ID.3", slug: "id-3" }, { label: "ID.4", slug: "id-4" }, { label: "ID.5", slug: "id-5" },
    { label: "Jetta", slug: "jetta" }, { label: "Multivan", slug: "multivan" }, { label: "Passat", slug: "passat" },
    { label: "Phaeton", slug: "phaeton" }, { label: "Polo", slug: "polo" }, { label: "Scirocco", slug: "scirocco" },
    { label: "Sharan", slug: "sharan" }, { label: "T-Cross", slug: "t-cross" }, { label: "T-Roc", slug: "t-roc" },
    { label: "Tiguan", slug: "tiguan" }, { label: "Touareg", slug: "touareg" }, { label: "Touran", slug: "touran" },
    { label: "Transporter", slug: "transporter" }, { label: "Up", slug: "up" },
  ],
  "volvo": [
    { label: "C30", slug: "c30" }, { label: "C40", slug: "c40" }, { label: "C70", slug: "c70" },
    { label: "EX30", slug: "ex30" }, { label: "EX40", slug: "ex40" }, { label: "S40", slug: "s40" },
    { label: "S60", slug: "s60" }, { label: "S80", slug: "s80" }, { label: "S90", slug: "s90" },
    { label: "V40", slug: "v40" }, { label: "V50", slug: "v50" }, { label: "V60", slug: "v60" },
    { label: "V70", slug: "v70" }, { label: "V90", slug: "v90" }, { label: "XC40", slug: "xc40" },
    { label: "XC60", slug: "xc60" }, { label: "XC70", slug: "xc70" }, { label: "XC90", slug: "xc90" },
  ],
};

export function getModelsForBrand(brandSlug) {
  return OTOMOTO_MODELS[brandSlug] || [];
}

export const BODY_TYPES = [
  { label: "Sedan", slug: "sedan" },
  { label: "Kombi", slug: "kombi" },
  { label: "Hatchback", slug: "hatchback" },
  { label: "SUV", slug: "suv" },
  { label: "Coupe", slug: "coupe" },
  { label: "Kabriolet", slug: "kabriolet" },
  { label: "Van", slug: "van" },
  { label: "Minivan", slug: "minivan" },
  { label: "Pickup", slug: "pickup" },
];

export const GEARBOX_TYPES = [
  { label: "Manualna", slug: "manual" },
  { label: "Automatyczna", slug: "automatic" },
  { label: "Półautomatyczna", slug: "semiautomatic" },
];

export const FUEL_TYPES = [
  { label: "Benzyna", slug: "petrol" },
  { label: "Diesel", slug: "diesel" },
  { label: "Hybryda", slug: "hybrid" },
  { label: "Elektryczny", slug: "electric" },
  { label: "Benzyna+LPG", slug: "petrol-lpg" },
  { label: "Benzyna+CNG", slug: "petrol-cng" },
];

/**
 * Build an otomoto.pl search URL from filter params.
 */
export function buildOtomotoUrl({ brand, model, bodyType, gearbox, fuelType,
  priceFrom, priceTo, yearFrom, yearTo, mileageFrom, mileageTo, powerFrom, powerTo }) {
  if (!brand) return "";
  let path = `https://www.otomoto.pl/osobowe/${brand}`;
  if (model) path += `/${model}`;
  const qp = new URLSearchParams();
  if (bodyType) qp.set("search[filter_enum_body_type][0]", bodyType);
  if (gearbox) qp.set("search[filter_enum_gearbox]", gearbox);
  if (fuelType) qp.set("search[filter_enum_fuel_type][0]", fuelType);
  if (priceFrom) qp.set("search[filter_float_price:from]", priceFrom);
  if (priceTo) qp.set("search[filter_float_price:to]", priceTo);
  if (yearFrom) qp.set("search[filter_float_year:from]", yearFrom);
  if (yearTo) qp.set("search[filter_float_year:to]", yearTo);
  if (mileageFrom) qp.set("search[filter_float_mileage:from]", mileageFrom);
  if (mileageTo) qp.set("search[filter_float_mileage:to]", mileageTo);
  if (powerFrom) qp.set("search[filter_float_engine_power:from]", powerFrom);
  if (powerTo) qp.set("search[filter_float_engine_power:to]", powerTo);
  const qs = qp.toString();
  return qs ? `${path}?${qs}` : path;
}
