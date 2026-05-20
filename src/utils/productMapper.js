export const ANGELBIRD_CATEGORIES = [
  "Cards",
  "SSD",
  "Card readers",
  "Accessories",
  "USB Cables",
  "Current Deals",
];

export const PRODUCT_FIELDS = [
  {
    key: "product_name",
    label: "Product Name",
    required: true,
    aliases: [
      "product_name",
      "products_name",
      "product_names",
      "name",
      "products",
      "item",
      "title",
    ],
  },
  {
    key: "category",
    label: "Category",
    required: true,
    aliases: [
      "category",
      "product_category",
      "products_category",
      "product_type",
      "type",
      "group",
    ],
  },
  {
    key: "sku",
    label: "SKU",
    required: true,
    aliases: [
      "sku",
      "products_sku",
      "product_sku",
      "item_sku",
      "code",
      "article_number",
    ],
  },
  {
    key: "ean",
    label: "EAN",
    required: false,
    aliases: ["ean", "ean_code", "barcode_ean"],
  },
  {
    key: "upc",
    label: "UPC",
    required: false,
    aliases: ["upc", "upc_code", "barcode_upc"],
  },
];

export function normalizeColumnName(value = "") {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/\uFEFF/g, "")
    .replace(/\s+/g, "_")
    .replace(/-/g, "_")
    .replace(/[^\w]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

export function cleanText(value = "") {
  return String(value ?? "")
    .replace(/â„¢/g, "™")
    .replace(/â€™/g, "’")
    .replace(/â€“/g, "–")
    .replace(/â€”/g, "—")
    .replace(/â€˜/g, "‘")
    .replace(/â€œ/g, "“")
    .replace(/â€/g, "”")
    .replace(/Ã¤/g, "ä")
    .replace(/Ã¶/g, "ö")
    .replace(/Ã¼/g, "ü")
    .replace(/ÃŸ/g, "ß")
    .replace(/\s+/g, " ")
    .trim();
}

export function cleanBarcode(value = "") {
  const raw = String(value ?? "").trim();

  if (!raw) return "";

  // Excel sometimes converts barcodes to scientific notation.
  // We keep it as text, but normalize only obvious .0 endings.
  return raw.replace(/\.0$/, "");
}

export function inferCategory(productName = "", category = "", sku = "") {
  const text = `${productName} ${category} ${sku}`.toLowerCase();

  if (
    text.includes("usb") ||
    text.includes("cable") ||
    text.includes("solid flex") ||
    text.includes("tether")
  ) {
    return "USB Cables";
  }

  if (
    text.includes("reader") ||
    text.includes("card reader") ||
    text.includes("cfexpress a card reader") ||
    text.includes("cfexpress b card reader")
  ) {
    return "Card readers";
  }

  if (
    text.includes("media tank") ||
    text.includes("mounting") ||
    text.includes("bracket") ||
    text.includes("pouch") ||
    text.includes("adapter")
  ) {
    return "Accessories";
  }

  if (
    text.includes("ssd") ||
    text.includes("ssdmini") ||
    text.includes("ssd2go") ||
    text.includes("sata") ||
    text.includes("video & audio ssd")
  ) {
    return "SSD";
  }

  if (
    text.includes("sd ") ||
    text.includes("sdxc") ||
    text.includes("microsd") ||
    text.includes("cfexpress") ||
    text.includes("cfast") ||
    text.includes("card") ||
    text.includes("v30") ||
    text.includes("v60") ||
    text.includes("v90")
  ) {
    return "Cards";
  }

  return cleanText(category) || "Current Deals";
}

export function detectProductMapping(columns = []) {
  const mapping = {};
  const normalized = columns.map((column) => ({
    original: column,
    normalized: normalizeColumnName(column),
  }));

  PRODUCT_FIELDS.forEach((field) => {
    const match = normalized.find((column) =>
      field.aliases.includes(column.normalized)
    );

    mapping[field.key] = match?.original || "";
  });

  return mapping;
}

export function applyProductMapping(rows = [], mapping = {}) {
  return rows
    .map((row, index) => {
      const product = {
        id: index + 1,
        product_name: "",
        category: "",
        sku: "",
        ean: "",
        upc: "",
        raw: row,
      };

      PRODUCT_FIELDS.forEach((field) => {
        const sourceColumn = mapping[field.key];

        if (sourceColumn && row[sourceColumn] !== undefined) {
          product[field.key] = row[sourceColumn];
        }
      });

      product.product_name = cleanText(product.product_name);
      product.category = cleanText(product.category);
      product.sku = cleanText(product.sku).toUpperCase();
      product.ean = cleanBarcode(product.ean);
      product.upc = cleanBarcode(product.upc);

      product.category = inferCategory(
        product.product_name,
        product.category,
        product.sku
      );

      return product;
    })
    .filter((product) => product.product_name || product.sku);
}

export function filterProducts(products = [], filters = {}) {
  const search = String(filters.search || "").toLowerCase().trim();
  const category = String(filters.category || "").trim();

  return products.filter((product) => {
    const matchesSearch =
      !search ||
      String(product.product_name || "").toLowerCase().includes(search) ||
      String(product.sku || "").toLowerCase().includes(search) ||
      String(product.category || "").toLowerCase().includes(search) ||
      String(product.ean || "").toLowerCase().includes(search) ||
      String(product.upc || "").toLowerCase().includes(search);

    const matchesCategory = !category || product.category === category;

    return matchesSearch && matchesCategory;
  });
}

export function getProductCategories(products = []) {
  return Array.from(
    new Set(
      products
        .map((product) => String(product.category || "").trim())
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b));
}

export function buildCategoryCounts(products = []) {
  const map = {};

  ANGELBIRD_CATEGORIES.forEach((category) => {
    map[category] = 0;
  });

  products.forEach((product) => {
    const category = product.category || "Current Deals";
    map[category] = (map[category] || 0) + 1;
  });

  return Object.entries(map)
    .map(([name, value]) => ({ name, value }))
    .filter((item) => item.value > 0 || item.name === "Current Deals");
}

export function findDuplicateSkus(products = []) {
  const map = {};

  products.forEach((product) => {
    const sku = String(product.sku || "").trim();
    if (!sku) return;

    map[sku] = map[sku] || [];
    map[sku].push(product);
  });

  return Object.entries(map)
    .filter(([, rows]) => rows.length > 1)
    .map(([sku, rows]) => ({
      name: sku,
      value: rows.length,
      rows,
    }));
}