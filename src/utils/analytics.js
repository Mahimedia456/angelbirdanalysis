import {
  buildCategoryCounts,
  findDuplicateSkus,
} from "./productMapper";

function getValue(row, possibleKeys = []) {
  for (const key of possibleKeys) {
    if (row[key] !== undefined && row[key] !== null && row[key] !== "") {
      return row[key];
    }
  }

  return "";
}

function groupCount(rows, keys) {
  const map = {};

  rows.forEach((row) => {
    const label = String(getValue(row, keys) || "Unknown").trim() || "Unknown";
    map[label] = (map[label] || 0) + 1;
  });

  return Object.entries(map)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

function monthlyTrend(rows) {
  const map = {};

  rows.forEach((row) => {
    const dateRaw = getValue(row, [
      "date",
      "created_at",
      "order_date",
      "ticket_date",
      "created",
    ]);

    if (!dateRaw) return;

    const date = new Date(dateRaw);
    if (Number.isNaN(date.getTime())) return;

    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      "0"
    )}`;

    map[key] = (map[key] || 0) + 1;
  });

  return Object.entries(map)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function buildGeneralAnalytics(rows = []) {
  const totalRows = rows.length;

  const productSummary = groupCount(rows, [
    "product",
    "product_name",
    "products_name",
    "sku",
    "products_sku",
    "item",
    "model",
  ]);

  const categorySummary = groupCount(rows, [
    "category",
    "product_category",
    "type",
    "group",
  ]);

  const regionSummary = groupCount(rows, [
    "region",
    "country",
    "market",
    "area",
  ]);

  const monthlySummary = monthlyTrend(rows);

  return {
    kpis: {
      totalRows,
      totalProducts: productSummary.length,
      totalCategories: categorySummary.length,
      totalRegions: regionSummary.length,
    },
    productSummary,
    categorySummary,
    regionSummary,
    monthlySummary,
  };
}

export function buildProductAnalytics(products = []) {
  const totalProducts = products.length;

  const categorySummary = buildCategoryCounts(products);

  const skuSummary = products
    .filter((product) => product.sku)
    .map((product) => ({
      name: product.sku,
      value: 1,
      product_name: product.product_name,
      category: product.category,
    }));

  const missingSku = products.filter((product) => !product.sku);
  const missingCategory = products.filter((product) => !product.category);
  const missingEan = products.filter((product) => !product.ean);
  const missingUpc = products.filter((product) => !product.upc);
  const duplicateSkus = findDuplicateSkus(products);

  const eanCount = products.filter((product) => product.ean).length;
  const upcCount = products.filter((product) => product.upc).length;

  const cardProducts = products.filter((product) => product.category === "Cards");
  const ssdProducts = products.filter((product) => product.category === "SSD");
  const readerProducts = products.filter(
    (product) => product.category === "Card readers"
  );
  const accessoryProducts = products.filter(
    (product) => product.category === "Accessories"
  );
  const cableProducts = products.filter(
    (product) => product.category === "USB Cables"
  );

  return {
    kpis: {
      totalProducts,
      totalSkus: products.filter((product) => product.sku).length,
      totalCategories: categorySummary.filter((item) => item.value > 0).length,
      eanCount,
      upcCount,
      missingSkuCount: missingSku.length,
      missingCategoryCount: missingCategory.length,
      missingEanCount: missingEan.length,
      missingUpcCount: missingUpc.length,
      duplicateSkuCount: duplicateSkus.length,
      cardsCount: cardProducts.length,
      ssdCount: ssdProducts.length,
      readersCount: readerProducts.length,
      accessoriesCount: accessoryProducts.length,
      cablesCount: cableProducts.length,
    },
    categorySummary,
    skuSummary,
    missingSku,
    missingCategory,
    missingEan,
    missingUpc,
    duplicateSkus,
    cardProducts,
    ssdProducts,
    readerProducts,
    accessoryProducts,
    cableProducts,
  };
}

export function getColumns(rows = []) {
  if (!rows.length) return [];
  return Object.keys(rows[0]);
}