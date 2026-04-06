const carData = {

  "Toyota": {
    "Camry": ["LE", "SE", "XLE", "XSE", "Hybrid LE", "Hybrid SE", "Hybrid XLE", "Hybrid XSE", "TRD", "Nightshade", "Platinum", "SE Upgrade", "XLE V6", "SE V6"],
    "Corolla": ["L", "LE", "SE", "XSE", "XLE", "Hybrid LE", "Hybrid SE", "Apex Edition", "Nightshade", "GR Sport", "S", "SE Premium", "LE Eco", "SE 6MT"],
    "RAV4": ["LE", "XLE", "XLE Premium", "Adventure", "TRD Off-Road", "Limited", "Hybrid LE", "Hybrid XLE", "Hybrid XSE", "Hybrid Limited", "Woodland Edition", "Prime SE", "Prime XSE", "Platinum"],
    "Highlander": ["L", "LE", "XLE", "XSE", "Limited", "Platinum", "Hybrid LE", "Hybrid XLE", "Hybrid Limited", "Hybrid Platinum", "Nightshade", "Bronze Edition", "AWD V6", "FWD LE"],
    "Tacoma": ["SR", "SR5", "TRD Sport", "TRD Off-Road", "Limited", "Trail Edition", "TRD Pro", "X-Runner", "PreRunner", "Access Cab", "Double Cab", "Long Bed", "i-Force MAX", "Base 4x2"],
    "Tundra": ["SR", "SR5", "Limited", "Platinum", "1794 Edition", "TRD Pro", "Capstone", "Hybrid i-Force MAX", "CrewMax", "Double Cab", "Standard Bed", "Long Bed", "Off-Road Package", "5.7L V8"],
    "Prius": ["L Eco", "LE", "XLE", "Limited", "AWD-e", "Prime SE", "Prime XSE", "Prime Limited", "c", "v", "Plug-in", "Touring", "One", "Two"],
    "4Runner": ["SR5", "TRD Off-Road", "TRD Off-Road Premium", "TRD Pro", "Limited", "Nightshade", "SR5 Premium", "Trail Edition", "4x2 SR5", "4x4 V6", "KDSS", "Army Green", "Lunar Rock", "Inferno"],
    "Supra": ["2.0", "3.0", "3.0 Premium", "A91 Edition", "Launch Edition", "3.0 GR Supra", "45th Anniversary", "Fujiyama Edition", "A91-CF", "3.0 MT", "Heritage Edition", "GT4", "Concept", "RZ"],
    "Land Cruiser": ["GX", "VX", "VX-R", "Heritage Edition", "GR Sport", "ZX", "Amazon", "Prado", "70 Series", "200 Series", "300 Series", "D-4D", "V8", "VX Limited"]
  },
  "Volkswagen": {
    "Golf": ["Trendline", "Comfortline", "Highline", "GTI", "GTI Autobahn", "GTI Performance", "R", "R-Line", "TSI", "TDI", "GTD", "e-Golf", "Alltrack", "Wolfsburg Edition"],
    "Jetta": ["S", "SE", "SEL", "GLI", "GLI Autobahn", "GLI 35th Anniversary", "Sport", "R-Line", "TDI", "Hybrid", "Wolfsburg", "Limited", "Comfortline", "Highline"],
    "Passat": ["S", "SE", "SEL", "R-Line", "GT", "Wolfsburg Edition", "TDI", "V6", "Comfortline", "Highline", "Alltrack", "GTI Concept", "CC", "R36"],
    "Tiguan": ["S", "SE", "SEL", "SEL R-Line", "SEL Premium R-Line", "4Motion", "Wolfsburg", "Comfortline", "Highline", "TDI", "R", "Allspace", "Nightshade", "PHEV"],
    "Atlas": ["S", "SE", "SE w/ Technology", "SEL", "SEL R-Line", "SEL Premium", "SEL Premium R-Line", "Cross Sport", "4Motion", "V6", "2.0T", "Wolfsburg", "Nightshade", "Tanoak Concept"],
    "ID.4": ["Standard", "Pro", "Pro S", "Pro S Plus", "AWD Pro", "AWD Pro S", "AWD Pro S Plus", "1st Edition", "GTX", "GTX Performance", "Pure", "Pure Performance", "City", "Touring"],
    "Beetle": ["Base", "S", "SE", "Final Edition", "R-Line", "Turbo", "Turbo S", "Dune", "Classic", "Convertible", "TDI", "GSR", "Pink Beetle", "Ultima Edición"]
  },
  "Ford": {
    "F-150": ["XL", "XLT", "Lariat", "King Ranch", "Platinum", "Limited", "Raptor", "Raptor R", "Tremor", "STX", "FX4", "PowerBoost Hybrid", "Lightning Pro", "Lightning Platinum"],
    "Mustang": ["EcoBoost", "EcoBoost Premium", "GT", "GT Premium", "Mach 1", "Dark Horse", "Shelby GT350", "Shelby GT350R", "Shelby GT500", "Bullitt", "California Special", "V6", "Convertible", "Mach-E (EV)"],
    "Explorer": ["Base", "XLT", "Limited", "ST", "ST-Line", "Platinum", "King Ranch", "Timberline", "Police Interceptor", "Hybrid", "4WD", "Sport Trac", "XLT Sport", "Eddie Bauer"],
    "Escape": ["S", "SE", "SEL", "Titanium", "Plug-in Hybrid", "Hybrid", "ST-Line", "ST-Line Elite", "Active", "Vignale", "Kuga (EU)", "1.5L EcoBoost", "2.0L EcoBoost", "PHEV Titanium"],
    "Focus": ["S", "SE", "SEL", "Titanium", "ST", "RS", "Active", "Vignale", "Zetec", "Ghia", "Wagon", "Electric", "1.0L EcoBoost", "ST-Line"],
    "Bronco": ["Base", "Big Bend", "Black Diamond", "Outer Banks", "Badlands", "Wildtrak", "Everglades", "Raptor", "Heritage Edition", "Heritage Limited", "2-Door", "4-Door", "Sasquatch Package", "Manual"]
  },
  "Honda": {
    "Civic": ["LX", "Sport", "EX", "EX-L", "Touring", "Si", "Type R", "Hatchback Sport", "Hatchback EX-L", "Hatchback Touring", "Hybrid", "Natural Gas", "GX", "1.5T"],
    "Accord": ["LX", "Sport", "EX", "EX-L", "Touring", "Hybrid", "Hybrid EX", "Hybrid EX-L", "Hybrid Touring", "Sport 2.0T", "2.0T Touring", "V6", "Plug-in Hybrid", "Crosstour"],
    "CR-V": ["LX", "EX", "EX-L", "Touring", "Hybrid", "Hybrid EX", "Hybrid EX-L", "Hybrid Touring", "Sport", "Sport Touring", "AWD", "SE", "Black Edition", "PHEV"],
    "Pilot": ["LX", "EX", "EX-L", "Touring", "Elite", "TrailSport", "Black Edition", "Special Edition", "AWD", "2WD", "SE", "Sport", "Touring with RES", "Elite with AWD"]
  },
  "Chevrolet": {
    "Silverado": ["WT", "Custom", "LT", "RST", "LTZ", "High Country", "Trail Boss", "ZR2", "HD Work Truck", "HD LTZ", "HD High Country", "Electric", "4x4", "Duramax"],
    "Equinox": ["L", "LS", "LT", "RS", "Premier", "LT Cloth", "LT Leather", "Diesel", "AWD", "FWD", "Redline Edition", "Nightfall Edition", "Sport", "LTZ"],
    "Malibu": ["L", "LS", "RS", "LT", "Premier", "Hybrid", "2.0T", "1.5T", "Redline", "Maxx", "Eco", "Limited", "LTZ", "SS (Concept)"],
    "Tahoe": ["LS", "LT", "RST", "Z71", "Premier", "High Country", "Suburban", "4WD", "2WD", "Diesel", "Hybrid", "Police", "SSV", "LT Cloth"]
  },
  "Nissan": {
    "Altima": ["S", "SR", "SV", "SL", "Platinum", "SR VC-Turbo", "AWD", "2.5", "3.5 SL", "Hybrid", "SE-R", "Midnight Edition", "Edition ONE", "VE"],
    "Sentra": ["S", "SV", "SR", "SL", "NISMO", "Midnight Edition", "SE", "SR Turbo", "1.8", "Special Edition", "FE+", "S Plus", "SV Sport", "SR Premium"],
    "Rogue": ["S", "SV", "SL", "Platinum", "Midnight Edition", "Sport", "Hybrid", "AWD", "FWD", "SV Premium", "SL Premium", "Platinum Hybrid", "Krom Edition", "Black Edition"]
  },
  "Mercedes-Benz": {
    "C-Class": ["C 300", "C 300 4MATIC", "C 350 e", "AMG C 43", "AMG C 63", "AMG C 63 S", "C 200", "C 220 d", "C 300 d", "C 300e PHEV", "C 400", "C 450 AMG", "C 55 AMG", "C 63 S E Performance"],
    "E-Class": ["E 350", "E 350 4MATIC", "E 450 4MATIC", "AMG E 53", "AMG E 63 S", "E 300", "E 400", "E 550", "E 200 d", "E 300 e", "E 400 Hybrid", "All-Terrain", "Cabriolet", "E 500"]
  },
  "BMW": {
    "3 Series": ["320i", "330i", "330i xDrive", "M340i", "M340i xDrive", "M3", "M3 Competition", "M3 CS", "318d", "320d", "330e", "340i", "ActiveHybrid 3", "328i"],
    "5 Series": ["530i", "530i xDrive", "540i", "540i xDrive", "M550i", "M5", "M5 Competition", "M5 CS", "520d", "530d", "530e", "550i", "ActiveHybrid 5", "545i"]
  },
  "Audi": {
    "A4": ["40 TFSI", "45 TFSI", "45 TFSI quattro", "S4", "RS 4 Avant", "35 TDI", "40 TDI", "Allroad", "Premium", "Premium Plus", "Prestige", "Black Edition", "Edition ONE", "S line"],
    "Q5": ["40 TFSI", "45 TFSI", "45 TFSI quattro", "SQ5", "SQ5 Sportback", "55 TFSI e", "Premium", "Premium Plus", "Prestige", "S line", "Black Optic", "Sport", "Edition ONE", "V6 TDI"]
  },
  "Hyundai": {
    "Elantra": ["SE", "SEL", "Limited", "N Line", "Hybrid Blue", "Hybrid SEL", "Hybrid Limited", "N", "GT", "Sport", "Eco", "Value Edition", "GL", "GLS"],
    "Tucson": ["SE", "SEL", "Limited", "N Line", "Hybrid Blue", "Hybrid SEL", "Hybrid Limited", "Plug-in Hybrid SEL", "Plug-in Hybrid Limited", "Sport", "GL", "GLS", "Premium", "Ultimate"]
  },
  "Kia": {
    "Sorento": ["LX", "S", "EX", "SX", "SX-Prestige", "X-Line", "Hybrid", "Plug-in Hybrid", "Turbo", "V6", "AWD", "FWD", "Nightfall Edition", "GT-Line"],
    "Sportage": ["LX", "S", "EX", "SX", "SX-Prestige", "X-Line", "X-Pro", "Hybrid", "Plug-in Hybrid", "GT-Line", "Nightfall", "Turbo", "AWD", "FWD"]
  },
  "Tesla": {
    "Model S": ["Long Range", "Plaid", "60", "70", "75", "85", "P85", "P85+", "P85D", "85D", "90D", "100D", "P100D", "Founders Series"],
    "Model 3": ["Standard Range", "Standard Range Plus", "Long Range", "Performance", "Mid Range", "Rear-Wheel Drive", "Dual Motor", "Stealth Performance", "Plaid (Rumored)", "Ludicrous", "Base", "Plus", "Premium", "SR"]
  },
  "Subaru": {
    "Outback": ["Base", "Premium", "Limited", "Touring", "Wilderness", "Onyx Edition", "XT", "XT Limited", "XT Touring", "2.5i", "3.6R", "Premium with Option", "Limited XT", "Sport"],
    "Forester": ["Base", "Premium", "Sport", "Limited", "Touring", "Wilderness", "XT", "i", "i Touring", "i Limited", "i Premium", "S Edition", "Black Edition", "Sport with Option"]
  },
  "Mazda": {
    "CX-5": ["Sport", "Touring", "Grand Touring", "Grand Touring Reserve", "Signature", "Carbon Edition", "Turbo", "Turbo Signature", "AWD", "FWD", "SE", "GT", "Luxury", "Akera"],
    "Mazda3": ["Sedan Sport", "Sedan Select", "Sedan Preferred", "Sedan Premium", "Hatchback Select", "Hatchback Preferred", "Hatchback Premium", "Turbo", "Turbo Premium Plus", "GT", "Luxury", "Astina", "SP25", "Xe"]
  },
  "Volvo": {
    "XC90": ["Momentum", "R-Design", "Inscription", "Excellence", "T5", "T6", "T8 Twin Engine", "Polestar Engineered", "Plus", "Ultimate", "Core", "Pro", "Black Edition", "Ocean Race"],
    "XC60": ["Momentum", "R-Design", "Inscription", "Polestar Engineered", "T5", "T6", "T8 Twin Engine", "Plus", "Ultimate", "Core", "Pro", "Cross Country", "Sport", "Luxury"]
  },
  "Porsche": {
    "911": ["Carrera", "Carrera S", "Carrera 4", "Carrera 4S", "Targa 4", "Targa 4S", "Turbo", "Turbo S", "GT3", "GT3 RS", "GT2 RS", "Speedster", "R", "Dakar"],
    "Cayenne": ["Base", "S", "GTS", "Turbo", "Turbo GT", "Coupe", "Coupe S", "Coupe Turbo", "E-Hybrid", "Turbo S E-Hybrid", "Platinum Edition", "Diesel", "V6", "V8"]
  },
  "Ferrari": {
    "F8": ["Tributo", "Spider", "Pista", "Pista Spider", "GT3", "Challenge", "MM", "Speciale", "Speciale A", "GTS", "Competizione", "Competizione A", "Stradale", "Corse Clienti"],
    "Portofino": ["M", "M Handling Speciale", "HGTC", "Lusso", "Turismo", "GT", "GTS", "Competizione", "Spider", "Coupe", "Aperta", "Speciale", "Monza SP", "Icona"]
  },
  "Lamborghini": {
    "Huracán": ["EVO", "EVO Spyder", "EVO RWD", "EVO RWD Spyder", "STO", "Tecnica", "LP 610-4", "LP 580-2", "LP 580-2 Spyder", "LP 640-4 Performante", "LP 640-4 Performante Spyder", "GT3", "Super Trofeo", "Sterrato"],
    "Urus": ["Base", "S", "Performante", "Graphite Edition", "Pearl Capsule", "Bronze Edition", "HGTC", "V8", "V8 Twin-Turbo", "V10 (Concept)", "Sterrato (Concept)", "L'Antartica", "ST-X", "GT"]
  },
  "Jeep": {
    "Wrangler": ["Sport", "Sport S", "Willys", "Willys Sport", "Sahara", "Rubicon", "Rubicon 392", "High Altitude", "Moab", "Freedom", "Backcountry", "Altitude", "4xe", "Unlimited"],
    "Grand Cherokee": ["Laredo", "Laredo E", "Limited", "Trailhawk", "Overland", "Summit", "Summit Reserve", "4xe", "SRT", "Trackhawk", "L", "V8", "Diesel", "Night Eagle"]
  },
  "Ram": {
    "1500": ["Tradesman", "Big Horn", "Laramie", "Rebel", "Limited", "Limited Longhorn", "TRX", "Classic", "Sport", "Night Edition", "BackCountry", "Lone Star", "Warlock", "Harvest Edition"],
    "2500": ["Tradesman", "Big Horn", "Laramie", "Power Wagon", "Limited", "Limited Longhorn", "Sport", "Night Edition", "Lone Star", "SLT", "HD", "Cummins Turbo Diesel", "Hemi V8", "Heavy Duty"]
  }
};

export default carData;