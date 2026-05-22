const DATA_KEY = "angelbird_uploaded_data";

const TICKETS_KEY = "angelbird_tickets_data";
const RAW_TICKETS_KEY = "angelbird_raw_tickets_data";
const TICKET_MAPPING_KEY = "angelbird_ticket_column_mapping";

const PRODUCTS_KEY = "angelbird_products_data";
const RAW_PRODUCTS_KEY = "angelbird_raw_products_data";
const PRODUCT_MAPPING_KEY = "angelbird_product_column_mapping";

const SATISFACTION_KEY = "angelbird_satisfaction_data";
const RAW_SATISFACTION_KEY = "angelbird_raw_satisfaction_data";
const SATISFACTION_MAPPING_KEY = "angelbird_satisfaction_column_mapping";

const THEME_KEY = "angelbird_theme_settings";
const CHART_KEY = "angelbird_chart_settings";
const CHART_COLORS_KEY = "angelbird_chart_colors";
const CHART_TYPE_OVERRIDES_KEY = "angelbird_chart_type_overrides";

export const DEFAULT_CHART_COLORS = [
  "#2f3d46",
  "#d7ff00",
  "#6b7c86",
  "#111827",
  "#94a3b8",
  "#84cc16",
  "#0f766e",
  "#f59e0b",
];

export const DEFAULT_CHART_SETTINGS = {
  productChart: "bar",
  categoryChart: "bar",
  monthlyChart: "area",
  stockChart: "bar",

  ticketDailyChart: "line",
  ticketMonthlyChart: "area",
  ticketSupportChart: "composed",
  ticketProductCategoryChart: "bar",
  ticketProcedureChart: "radial",
  ticketTopProductsChart: "composed",

  reportDateTrendChart: "line",
  reportSupportChart: "area",
  reportProductCategoryChart: "bar",
  reportProcedureChart: "bar",

  satisfactionRatingChart: "donut",
  satisfactionSolvedChart: "pie",
  satisfactionDailyChart: "line",
  satisfactionReasonChart: "bar",
  satisfactionCommentChart: "bar",

  reportSatisfactionRatingChart: "donut",
  reportSatisfactionSolvedChart: "pie",
  reportSatisfactionDailyChart: "line",
  reportSatisfactionReasonChart: "bar",
};

export function saveMainData(rows) {
  localStorage.setItem(DATA_KEY, JSON.stringify(rows || []));
}

export function getMainData() {
  try {
    return JSON.parse(localStorage.getItem(DATA_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveRawTicketsData(rows) {
  localStorage.setItem(RAW_TICKETS_KEY, JSON.stringify(rows || []));
}

export function getRawTicketsData() {
  try {
    return JSON.parse(localStorage.getItem(RAW_TICKETS_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveTicketsData(rows) {
  localStorage.setItem(TICKETS_KEY, JSON.stringify(rows || []));
}

export function getTicketsData() {
  try {
    return JSON.parse(localStorage.getItem(TICKETS_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveTicketMapping(mapping) {
  localStorage.setItem(TICKET_MAPPING_KEY, JSON.stringify(mapping || {}));
}

export function getTicketMapping() {
  try {
    return JSON.parse(localStorage.getItem(TICKET_MAPPING_KEY) || "{}");
  } catch {
    return {};
  }
}

export function saveRawProductsData(rows) {
  localStorage.setItem(RAW_PRODUCTS_KEY, JSON.stringify(rows || []));
}

export function getRawProductsData() {
  try {
    return JSON.parse(localStorage.getItem(RAW_PRODUCTS_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveProductsData(rows) {
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(rows || []));
}

export function getProductsData() {
  try {
    return JSON.parse(localStorage.getItem(PRODUCTS_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveProductMapping(mapping) {
  localStorage.setItem(PRODUCT_MAPPING_KEY, JSON.stringify(mapping || {}));
}

export function getProductMapping() {
  try {
    return JSON.parse(localStorage.getItem(PRODUCT_MAPPING_KEY) || "{}");
  } catch {
    return {};
  }
}

export function saveRawSatisfactionData(rows) {
  localStorage.setItem(RAW_SATISFACTION_KEY, JSON.stringify(rows || []));
}

export function getRawSatisfactionData() {
  try {
    return JSON.parse(localStorage.getItem(RAW_SATISFACTION_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveSatisfactionData(rows) {
  localStorage.setItem(SATISFACTION_KEY, JSON.stringify(rows || []));
}

export function getSatisfactionData() {
  try {
    return JSON.parse(localStorage.getItem(SATISFACTION_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveSatisfactionMapping(mapping) {
  localStorage.setItem(SATISFACTION_MAPPING_KEY, JSON.stringify(mapping || {}));
}

export function getSatisfactionMapping() {
  try {
    return JSON.parse(localStorage.getItem(SATISFACTION_MAPPING_KEY) || "{}");
  } catch {
    return {};
  }
}

export function saveTheme(theme) {
  localStorage.setItem(THEME_KEY, JSON.stringify(theme));
}

export function getTheme() {
  try {
    return (
      JSON.parse(localStorage.getItem(THEME_KEY)) || {
        headerColor: "#2f3d46",
        footerColor: "#2f3d46",
        accentColor: "#d7ff00",
        kpiColor: "#f4f6f6",
        chartColor: "#2f3d46",
        textColor: "#2f3d46",
      }
    );
  } catch {
    return {
      headerColor: "#2f3d46",
      footerColor: "#2f3d46",
      accentColor: "#d7ff00",
      kpiColor: "#f4f6f6",
      chartColor: "#2f3d46",
      textColor: "#2f3d46",
    };
  }
}

export function applyTheme(theme) {
  const root = document.documentElement;

  root.style.setProperty("--header-color", theme.headerColor || "#2f3d46");
  root.style.setProperty("--footer-color", theme.footerColor || "#2f3d46");
  root.style.setProperty("--accent-color", theme.accentColor || "#d7ff00");
  root.style.setProperty("--kpi-color", theme.kpiColor || "#f4f6f6");
  root.style.setProperty("--chart-color", theme.chartColor || "#2f3d46");
  root.style.setProperty("--text-color", theme.textColor || "#2f3d46");
}

export function saveChartSettings(settings) {
  localStorage.setItem(
    CHART_KEY,
    JSON.stringify({
      ...DEFAULT_CHART_SETTINGS,
      ...(settings || {}),
    })
  );
}

export function getChartSettings() {
  try {
    return {
      ...DEFAULT_CHART_SETTINGS,
      ...(JSON.parse(localStorage.getItem(CHART_KEY) || "{}") || {}),
    };
  } catch {
    return DEFAULT_CHART_SETTINGS;
  }
}

export function saveChartColors(colors) {
  localStorage.setItem(
    CHART_COLORS_KEY,
    JSON.stringify(colors || DEFAULT_CHART_COLORS)
  );
}

export function getChartColors() {
  try {
    const colors = JSON.parse(localStorage.getItem(CHART_COLORS_KEY) || "[]");
    return colors.length ? colors : DEFAULT_CHART_COLORS;
  } catch {
    return DEFAULT_CHART_COLORS;
  }
}

export function getChartTypeOverrides() {
  try {
    return JSON.parse(localStorage.getItem(CHART_TYPE_OVERRIDES_KEY) || "{}");
  } catch {
    return {};
  }
}

export function saveChartTypeOverrides(overrides) {
  localStorage.setItem(
    CHART_TYPE_OVERRIDES_KEY,
    JSON.stringify(overrides || {})
  );
}

export function getChartTypeOverride(chartId) {
  const overrides = getChartTypeOverrides();
  return overrides[chartId] || "";
}

export function saveChartTypeOverride(chartId, chartType) {
  const overrides = getChartTypeOverrides();

  if (!chartType) {
    delete overrides[chartId];
  } else {
    overrides[chartId] = chartType;
  }

  saveChartTypeOverrides(overrides);
}

export function resetChartTypeOverrides() {
  localStorage.removeItem(CHART_TYPE_OVERRIDES_KEY);
  localStorage.setItem(CHART_KEY, JSON.stringify(DEFAULT_CHART_SETTINGS));
}

export function clearAllData() {
  localStorage.removeItem(DATA_KEY);

  localStorage.removeItem(TICKETS_KEY);
  localStorage.removeItem(RAW_TICKETS_KEY);
  localStorage.removeItem(TICKET_MAPPING_KEY);

  localStorage.removeItem(PRODUCTS_KEY);
  localStorage.removeItem(RAW_PRODUCTS_KEY);
  localStorage.removeItem(PRODUCT_MAPPING_KEY);

  localStorage.removeItem(SATISFACTION_KEY);
  localStorage.removeItem(RAW_SATISFACTION_KEY);
  localStorage.removeItem(SATISFACTION_MAPPING_KEY);
}