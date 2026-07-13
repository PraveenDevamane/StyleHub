const LOCATION_RULES = [
  // 1. Footwear
  {
    code: 'GD-FW',
    areaCode: 'GD',
    zoneCode: 'FW',
    shelfCode: 'FW',
    areaName: 'Glass Display Section',
    zoneName: 'Footwear Storage',
    shelfLabel: 'Footwear Section',
    keywords: ['shoe', 'shoes', 'sneaker', 'sneakers', 'sandal', 'sandals', 'slipper', 'slippers', 'boot', 'boots', 'loafer', 'loafers', 'heel', 'heels', 'belly', 'bellies', 'kolhapuri', 'footwear', 'crocs', 'socks'],
    boostKeywords: ['footwear', 'shoes', 'sports shoes', 'running shoes'],
    targetCategories: ['footwear'],
    targetSubcategories: ['sneakers', 'formal shoes', 'sandals', 'slippers', 'sports shoes', 'boots', 'loaders', 'heels', 'bellies', 'kolhapuri', 'kids footwear'],
    reasonTemplate: 'Matches footwear category or shoes-related keywords.',
  },
  // 2. Category Rack - Jeans Bottom (CR-02B)
  {
    code: 'CR-02B',
    areaCode: 'CR',
    zoneCode: '02',
    shelfCode: 'B',
    areaName: 'Category Rack',
    zoneName: 'Level 2',
    shelfLabel: 'Jeans Bottom (02B)',
    keywords: ['jeans', 'denim', 'denims', 'pants', 'pant', 'trousers', 'trouser', 'chinos', 'chino', 'bottom', 'bottoms', 'cargo', 'cargos', 'shorts'],
    boostKeywords: ['jeans', 'denim jacket', 'denim shirt'],
    targetCategories: ['jeans'],
    targetSubcategories: ['slim fit', 'straight fit', 'skinny', 'bootcut', 'wide leg', 'ripped', 'high waist', 'mom jeans', 'denim shirts'],
    reasonTemplate: 'Matches jeans or denim/bottoms keywords.',
  },
  // 3. Category Rack - Dhoti Section (CR-02A)
  {
    code: 'CR-02A',
    areaCode: 'CR',
    zoneCode: '02',
    shelfCode: 'A',
    areaName: 'Category Rack',
    zoneName: 'Level 2',
    shelfLabel: 'Dhoti Section (02A)',
    keywords: ['dhoti', 'dhotis', 'veshti', 'mundu', 'panche', 'traditional bottom', 'panchalu'],
    boostKeywords: ['dhoti', 'veshti'],
    targetSubcategories: ['dhoti', 'veshti'],
    reasonTemplate: 'Matches traditional Indian wear dhoti/veshti keywords.',
  },
  // 4. Category Rack - Sarees (CR-03B)
  {
    code: 'CR-03B',
    areaCode: 'CR',
    zoneCode: '03',
    shelfCode: 'B',
    areaName: 'Category Rack',
    zoneName: 'Level 3',
    shelfLabel: 'Sarees (03B)',
    keywords: ['saree', 'sarees', 'sari', 'saris', 'silk saree', 'cotton saree', 'chiffon', 'georgette', 'banarasi', 'kanjeevaram', 'linen saree', 'designer saree', 'pattu', 'kanchipuram'],
    boostKeywords: ['saree', 'sarees', 'sari'],
    targetCategories: ['saree'],
    targetSubcategories: ['silk saree', 'cotton saree', 'chiffon saree', 'georgette saree', 'banarasi saree', 'kanjeevaram', 'linen saree', 'designer saree', 'half saree'],
    reasonTemplate: 'Matches saree category or saree fabric types.',
  },
  // 5. Category Rack - Boys Wear (CR-03A)
  {
    code: 'CR-03A',
    areaCode: 'CR',
    zoneCode: '03',
    shelfCode: 'A',
    areaName: 'Category Rack',
    zoneName: 'Level 3',
    shelfLabel: 'Boys Wear (03A)',
    keywords: ['boy', 'boys', 'junior boy', 'son', 'kid boy', 'male kid', 'boys clothing'],
    boostKeywords: ['boys clothing', 'boys wear'],
    targetSubcategories: ['boys clothing'],
    reasonTemplate: 'Allotted to Boys Wear shelf.',
  },
  // 6. Category Rack - Girls Wear (CR-04A)
  {
    code: 'CR-04A',
    areaCode: 'CR',
    zoneCode: '04',
    shelfCode: 'A',
    areaName: 'Category Rack',
    zoneName: 'Level 4',
    shelfLabel: 'Girls Wear (04A)',
    keywords: ['girl', 'girls', 'frock', 'frocks', 'skirt', 'skirts', 'junior girl', 'daughter', 'kids girls', 'girls clothing', 'gown', 'gowns', 'dress', 'dresses'],
    boostKeywords: ['girls clothing', 'girls wear', 'frock'],
    targetCategories: ['dress', 'lehenga'],
    targetSubcategories: ['girls clothing', 'maxi dress', 'a-line dress', 'cocktail dress', 'evening gown', 'bridal lehenga', 'lehenga choli'],
    reasonTemplate: 'Matches girl-specific attire or dress category.',
  },
  // 7. Category Rack - Children\'s (CR-04B)
  {
    code: 'CR-04B',
    areaCode: 'CR',
    zoneCode: '04',
    shelfCode: 'B',
    areaName: 'Category Rack',
    zoneName: 'Level 4',
    shelfLabel: "Children's (04B)",
    keywords: ['children', 'child', 'kids', 'kid', 'baby', 'babies', 'toddler', 'toddlers', 'infant', 'infants', 'newborn', 'romper', 'rompers', 'onesie', 'cradle'],
    boostKeywords: ['kids wear', 'baby rompers', 'childrens'],
    targetCategories: ['kids wear'],
    targetSubcategories: ['baby rompers', 'kids ethnic', 'school uniforms', 'children\'s'],
    reasonTemplate: 'Matches toddler/baby rompers or general kids wear.',
  },
  // 8. Glass Display Left - Premium Jewelry & Watches (GD-L)
  {
    code: 'GD-L',
    areaCode: 'GD',
    zoneCode: 'L',
    shelfCode: 'L',
    areaName: 'Glass Display Section',
    zoneName: 'Left Glass Display',
    shelfLabel: 'Left Glass',
    keywords: ['watch', 'watches', 'smartwatch', 'smartwatches', 'analog', 'digital', 'jewelry', 'jewel', 'jewellery', 'gold', 'silver', 'diamond', 'necklace', 'necklaces', 'ring', 'rings', 'bracelet', 'bracelets', 'earring', 'earrings', 'pendant', 'premium', 'luxury', 'precious'],
    boostKeywords: ['watches', 'luxury watches', 'smart watches', 'jewelry', 'gold watch', 'diamond ring'],
    targetCategories: ['watches'],
    targetSubcategories: ['analog', 'digital', 'smart watches', 'luxury watches', 'sports watches', 'jewelry'],
    reasonTemplate: 'High-value premium accessory (watch/jewelry) requiring a secure glass display.',
  },
  // 9. Glass Display Right - Premium Perfumes & Sunglasses (GD-R)
  {
    code: 'GD-R',
    areaCode: 'GD',
    zoneCode: 'R',
    shelfCode: 'R',
    areaName: 'Glass Display Section',
    zoneName: 'Right Glass Display',
    shelfLabel: 'Right Glass',
    keywords: ['perfume', 'perfumes', 'cologne', 'colognes', 'scent', 'fragrance', 'fragrances', 'sunglass', 'sunglasses', 'goggles', 'shades', 'spectacles', 'cosmetic', 'cosmetics', 'makeup', 'deodorant', 'deodorants', 'luxury bag', 'expensive bag'],
    boostKeywords: ['sunglasses', 'perfume', 'luxury bag'],
    targetSubcategories: ['sunglasses', 'clutches', 'laptop bags'],
    reasonTemplate: 'Premium cosmetics, fragrances, or optical wear suitable for glass shelving.',
  },
  // 10. Accessory Rack (RS-AR)
  {
    code: 'RS-AR',
    areaCode: 'RS',
    zoneCode: 'AR',
    shelfCode: '01',
    areaName: 'Right Storage Room',
    zoneName: 'Accessory Rack',
    shelfLabel: 'Shelf 1',
    keywords: ['accessory', 'accessories', 'belt', 'belts', 'wallet', 'wallets', 'cap', 'caps', 'hat', 'hats', 'scarf', 'scarves', 'glove', 'gloves', 'muffler', 'mufflers', 'shawl', 'shawls', 'tie', 'ties', 'socks', 'hair accessories', 'bangles'],
    boostKeywords: ['accessories', 'belt', 'wallet', 'bags'],
    targetCategories: ['accessories', 'bags'],
    targetSubcategories: ['watches', 'belts', 'bags', 'wallets', 'hats', 'scarves', 'hair accessories', 'bangles', 'handbags', 'backpacks', 'sling bags', 'tote bags', 'clutches'],
    reasonTemplate: 'Matches accessory category items (belts, wallets, bags, etc.).',
  },
  // 11. Category Rack - Top Shelf (CR-01)
  {
    code: 'CR-01',
    areaCode: 'CR',
    zoneCode: '01',
    shelfCode: 'Top',
    areaName: 'Category Rack',
    zoneName: 'Level 1 (Top)',
    shelfLabel: 'Top Shelf (Garments)',
    keywords: ['jacket', 'jackets', 'coat', 'coats', 'blazer', 'blazers', 'suit', 'suits', 'outerwear', 'windcheater', 'puffer', 'bomber', 'hoodie', 'hoodies', 'sweater', 'sweaters'],
    boostKeywords: ['jackets', 'coats', 'winterwear'],
    targetCategories: ['jackets', 'winterwear'],
    targetSubcategories: ['denim jacket', 'leather jacket', 'bomber jacket', 'windcheater', 'blazer', 'puffer jacket', 'sweaters', 'hoodies', 'coats'],
    reasonTemplate: 'Suited for Level 1 hanging racks (jackets, coats, winterwear).',
  },
  // 12. Main Showroom - Center Display Table (SR-DT)
  {
    code: 'SR-DT',
    areaCode: 'SR',
    zoneCode: 'DT',
    shelfCode: 'DT',
    areaName: 'Main Showroom',
    zoneName: 'Center Display Table',
    shelfLabel: 'Main Table Surface',
    keywords: ['t-shirt', 'tshirts', 't-shirts', 'tee', 'tees', 'polo', 'polos', 'shirt', 'shirts', 'formal shirt', 'casual shirt', 'linen shirt', 'checked shirt', 'printed shirt', 'top', 'tops', 'kurta', 'kurtas', 'sherwani', 'sportswear', 'jersey'],
    boostKeywords: ['t-shirts', 'shirts', 'kurta', 'sportswear'],
    targetCategories: ['t-shirts', 'shirts', 'kurta', 'sportswear'],
    targetSubcategories: ['round neck', 'v-neck', 'polo', 'oversized', 'graphic tees', 'printed', 'plain', 'formal shirts', 'casual shirts', 'linen shirts', 'checked shirts', 'printed shirts', 'straight kurta', 'a-line kurta', 'anarkali', 'kurta set', 'pathani', 'nehru jacket', 'jerseys', 'track pants', 'gym wear', 'yoga wear'],
    reasonTemplate: 'Standard folded display items (shirts, t-shirts, kurtas) belong on the showroom tables.',
  },
  // 13. Left Storage Backstock Room (LS-L-01)
  {
    code: 'LS-L-01',
    areaCode: 'LS',
    zoneCode: 'L',
    shelfCode: '01',
    areaName: 'Left Storage Room',
    zoneName: 'Left Storage Rack',
    shelfLabel: 'Shelf 1',
    keywords: ['storage', 'backstock', 'excess', 'bulk', 'box', 'carton', 'reserve', 'warehouse', 'left', 'stockroom', 'unsold'],
    boostKeywords: ['backstock', 'storage room', 'excess stock'],
    reasonTemplate: 'Indicated as excess, backstock, or bulk storage.',
  },
];

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
  'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
  'to', 'was', 'were', 'will', 'with', 'or', 'this', 'but', 'how'
]);

function tokenize(text) {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // remove punctuation except hyphens
    .split(/[\s_]+/) // split by whitespace or underscores
    .filter(token => token.length > 1 && !STOP_WORDS.has(token));
}

function classifyStorageLocation(name, description, categoryName, subcategoryName) {
  const nameTokens = tokenize(name);
  const descTokens = tokenize(description);
  const catNormalized = (categoryName || '').toLowerCase().trim();
  const subcatNormalized = (subcategoryName || '').toLowerCase().trim();

  const allTokens = [...nameTokens, ...descTokens, ...tokenize(subcategoryName)];

  const suggestions = LOCATION_RULES.map(rule => {
    let score = 0;
    let matches = [];

    // 1. Direct Category Match Boost
    if (rule.targetCategories && rule.targetCategories.includes(catNormalized)) {
      score += 15;
      matches.push(`Category: ${categoryName}`);
    }

    // 2. Direct Subcategory Match Boost
    if (rule.targetSubcategories && rule.targetSubcategories.includes(subcatNormalized)) {
      score += 25;
      matches.push(`Subcategory: ${subcategoryName}`);
    }

    // 3. Keyword Match Scores
    for (const token of allTokens) {
      // Exact keyword match
      if (rule.keywords.includes(token)) {
        score += 3;
        matches.push(token);
      } else {
        // Partial substring matches (e.g. "sneaker" -> "sneakers")
        for (const kw of rule.keywords) {
          if (token.includes(kw) || kw.includes(token)) {
            score += 1.5;
            matches.push(`${token}~${kw}`);
            break;
          }
        }
      }

      // Boost keywords (extra priority terms)
      if (rule.boostKeywords && rule.boostKeywords.includes(token)) {
        score += 5;
        matches.push(`boost:${token}`);
      }
    }

    // 4. Special descriptive boosts (e.g., premium/expensive words boost glass display)
    const isPremiumWord = allTokens.some(t => ['premium', 'luxury', 'expensive', 'gold', 'diamond', 'imported'].includes(t));
    if (isPremiumWord && rule.areaCode === 'GD') {
      score += 8;
      matches.push('Premium item label');
    }

    // 5. Backstock / storage keywords boost storage rooms
    const isStorageWord = allTokens.some(t => ['storage', 'backstock', 'excess', 'bulk', 'box', 'warehouse', 'reserve'].includes(t));
    if (isStorageWord && (rule.areaCode === 'LS' || rule.areaCode === 'RS')) {
      score += 10;
      matches.push('Storage indicator');
    }

    // Format matches string for reasons
    const uniqueMatches = Array.from(new Set(matches)).slice(0, 3);
    const reasonText = uniqueMatches.length > 0
      ? `${rule.reasonTemplate} (Matched: ${uniqueMatches.join(', ')})`
      : rule.reasonTemplate;

    return {
      code: rule.code,
      areaCode: rule.areaCode,
      zoneCode: rule.zoneCode,
      shelfCode: rule.shelfCode,
      areaName: rule.areaName,
      zoneName: rule.zoneName,
      shelfLabel: rule.shelfLabel,
      score,
      reason: reasonText,
    };
  });

  // Sort by score descending and take the top 3 with positive scores
  const sorted = suggestions.sort((a, b) => b.score - a.score);
  const positiveSuggestions = sorted.filter(s => s.score > 0);

  if (positiveSuggestions.length > 0) {
    return positiveSuggestions.slice(0, 3);
  }

  // Fallbacks if no score matches
  return [
    {
      code: 'SR-DT',
      areaCode: 'SR',
      zoneCode: 'DT',
      shelfCode: 'DT',
      areaName: 'Main Showroom',
      zoneName: 'Center Display Table',
      shelfLabel: 'Main Table Surface',
      score: 0.1,
      reason: 'Fallback: Standard customer display table.',
    },
    {
      code: 'RS-AR',
      areaCode: 'RS',
      zoneCode: 'AR',
      shelfCode: '01',
      areaName: 'Right Storage Room',
      zoneName: 'Accessory Rack',
      shelfLabel: 'Shelf 1',
      score: 0.05,
      reason: 'Fallback: Right storage accessory rack.',
    },
    {
      code: 'LS-L-01',
      areaCode: 'LS',
      zoneCode: 'L',
      shelfCode: '01',
      areaName: 'Left Storage Room',
      zoneName: 'Left Storage Rack',
      shelfLabel: 'Shelf 1',
      score: 0.01,
      reason: 'Fallback: Backstock room shelf.',
    },
  ];
}

module.exports = { classifyStorageLocation };
