/**
 * FILTER_TEMPLATES — pre-built search configurations covering common use cases.
 * Each template maps directly to the filter config shape used by useFilters.
 * The user can click to instantly add it as a new saved filter.
 */
export const FILTER_TEMPLATES = [
  {
    id: "tpl_family_suv",
    label: "Rodzinne SUV",
    description: "Auto, diesel/hybryda, do 150 tys. km, 5–12 lat",
    emoji: "🚙",
    config: {
      portal: "both",
      vehicles: [
        { brand: "toyota",     model: "rav4"       },
        { brand: "volkswagen", model: "tiguan"      },
        { brand: "skoda",      model: "kodiaq"      },
        { brand: "hyundai",    model: "tucson"       },
      ],
      params: {
        bodyType: "suv",
        fuelType: "diesel",
        gearbox: "",
        yearFrom: String(new Date().getFullYear() - 12),
        yearTo: "",
        mileageFrom: "",
        mileageTo: "150000",
        priceFrom: "",
        priceTo: "",
        powerFrom: "",
        powerTo: "",
      },
    },
  },
  {
    id: "tpl_city_hatch",
    label: "Miejski hatchback",
    description: "Mały, ekonomiczny, do 200 tys. km",
    emoji: "🏙",
    config: {
      portal: "both",
      vehicles: [
        { brand: "volkswagen", model: "golf"   },
        { brand: "skoda",      model: "octavia" },
        { brand: "opel",       model: "astra"   },
        { brand: "ford",       model: "focus"   },
      ],
      params: {
        bodyType: "hatchback",
        fuelType: "",
        gearbox: "",
        yearFrom: String(new Date().getFullYear() - 10),
        yearTo: "",
        mileageFrom: "",
        mileageTo: "200000",
        priceFrom: "",
        priceTo: "30000",
        powerFrom: "",
        powerTo: "",
      },
    },
  },
  {
    id: "tpl_luxury_sedan",
    label: "Luksusowy sedan",
    description: "Premium, automat, 200+ KM",
    emoji: "🏆",
    config: {
      portal: "otomoto",
      vehicles: [
        { brand: "bmw",            model: "seria-5"    },
        { brand: "mercedes-benz",  model: "klasa-e"    },
        { brand: "audi",           model: "a6"         },
      ],
      params: {
        bodyType: "sedan",
        fuelType: "",
        gearbox: "automatic",
        yearFrom: String(new Date().getFullYear() - 8),
        yearTo: "",
        mileageFrom: "",
        mileageTo: "120000",
        priceFrom: "40000",
        priceTo: "",
        powerFrom: "200",
        powerTo: "",
      },
    },
  },
  {
    id: "tpl_electric",
    label: "Elektryczne",
    description: "BEV, wszystkie marki",
    emoji: "⚡",
    config: {
      portal: "both",
      vehicles: [
        { brand: "tesla",      model: "model-3"  },
        { brand: "volkswagen", model: "id-4"     },
        { brand: "hyundai",    model: "ioniq-5"  },
        { brand: "kia",        model: "ev6"       },
      ],
      params: {
        bodyType: "",
        fuelType: "electric",
        gearbox: "",
        yearFrom: String(new Date().getFullYear() - 5),
        yearTo: "",
        mileageFrom: "",
        mileageTo: "",
        priceFrom: "",
        priceTo: "",
        powerFrom: "",
        powerTo: "",
      },
    },
  },
  {
    id: "tpl_sports",
    label: "Sportowe coupe",
    description: "Coupe, 200+ KM, ciekawa jazda",
    emoji: "🏎",
    config: {
      portal: "otomoto",
      vehicles: [
        { brand: "bmw",            model: "seria-4"  },
        { brand: "audi",           model: "a5"       },
        { brand: "mercedes-benz",  model: "klasa-c"  },
        { brand: "volkswagen",     model: "arteon"   },
      ],
      params: {
        bodyType: "coupe",
        fuelType: "",
        gearbox: "",
        yearFrom: String(new Date().getFullYear() - 7),
        yearTo: "",
        mileageFrom: "",
        mileageTo: "100000",
        priceFrom: "30000",
        priceTo: "",
        powerFrom: "200",
        powerTo: "",
      },
    },
  },
  {
    id: "tpl_cheap_reliable",
    label: "Tanie i niezawodne",
    description: "Do 20k, popularne modele",
    emoji: "💰",
    config: {
      portal: "both",
      vehicles: [
        { brand: "toyota",  model: "corolla" },
        { brand: "honda",   model: "civic"   },
        { brand: "mazda",   model: "3"       },
        { brand: "skoda",   model: "fabia"   },
      ],
      params: {
        bodyType: "",
        fuelType: "petrol",
        gearbox: "",
        yearFrom: String(new Date().getFullYear() - 12),
        yearTo: "",
        mileageFrom: "",
        mileageTo: "180000",
        priceFrom: "",
        priceTo: "20000",
        powerFrom: "",
        powerTo: "",
      },
    },
  },
];

import { buildOtomotoUrlFull, buildOlxUrl } from "../utils/otomotoData.js";

/**
 * Instantiate a template into a full filter object ready for useFilters.addFilter()
 */
export function instantiateTemplate(template, nameSuffix = "") {
  const { config } = template;
  const name = nameSuffix ? `${template.label} — ${nameSuffix}` : template.label;
  const searchUrls = [];

  for (const v of config.vehicles.filter(vv => vv.brand)) {
    const params = { ...config.params, brand: v.brand, model: v.model };
    if (config.portal === "otomoto" || config.portal === "both") {
      searchUrls.push(buildOtomotoUrlFull(params));
    }
    if (config.portal === "olx" || config.portal === "both") {
      searchUrls.push(buildOlxUrl(params));
    }
  }

  return {
    name,
    portal:   config.portal,
    vehicles: config.vehicles.filter(v => v.brand),
    params:   config.params,
    searchUrls,
    searchUrl: searchUrls[0] ?? "",
  };
}
