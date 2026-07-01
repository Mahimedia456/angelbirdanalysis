import { z } from "zod";

import {
  supabaseAdmin,
} from "../config/supabase.js";

const hexColorSchema = z
  .string()
  .regex(
    /^#[0-9a-fA-F]{6}$/,
    "Color must use a valid six-digit HEX value."
  );

const chartTypeSchema = z.enum([
  "bar",
  "line",
  "area",
  "pie",
  "donut",
]);

const themeSchema = z.object({
  headerColor: hexColorSchema,
  footerColor: hexColorSchema,
  accentColor: hexColorSchema,
  kpiColor: hexColorSchema,
  chartColor: hexColorSchema,
  textColor: hexColorSchema,
});

const chartSettingsSchema = z.object({
  productChart: chartTypeSchema,
  categoryChart: chartTypeSchema,
  monthlyChart: chartTypeSchema,
  stockChart: chartTypeSchema,
  ticketDailyChart: chartTypeSchema,
  ticketSupportChart: chartTypeSchema,
  ticketProductCategoryChart:
    chartTypeSchema,
  ticketProcedureChart:
    chartTypeSchema,
});

const chartColorsSchema = z
  .array(hexColorSchema)
  .min(
    2,
    "At least two chart colors are required."
  )
  .max(
    20,
    "A maximum of twenty chart colors is allowed."
  );

const updateSettingsSchema = z.object({
  theme: themeSchema,
  chartSettings:
    chartSettingsSchema,
  chartColors:
    chartColorsSchema,
});

const DEFAULT_THEME = {
  headerColor: "#2f3d46",
  footerColor: "#2f3d46",
  accentColor: "#d7ff00",
  kpiColor: "#f4f6f6",
  chartColor: "#2f3d46",
  textColor: "#2f3d46",
};

const DEFAULT_CHART_SETTINGS = {
  productChart: "bar",
  categoryChart: "bar",
  monthlyChart: "line",
  stockChart: "bar",
  ticketDailyChart: "line",
  ticketSupportChart: "bar",
  ticketProductCategoryChart:
    "bar",
  ticketProcedureChart: "bar",
};

const DEFAULT_CHART_COLORS = [
  "#2f3d46",
  "#d7ff00",
  "#64748b",
  "#94a3b8",
  "#0f172a",
  "#cbd5e1",
];

function mapSettings(rows = []) {
  const settingsMap =
    Object.fromEntries(
      rows.map((row) => [
        row.setting_key,
        row.setting_value,
      ])
    );

  return {
    theme: {
      ...DEFAULT_THEME,
      ...(settingsMap.theme || {}),
    },

    chartSettings: {
      ...DEFAULT_CHART_SETTINGS,
      ...(settingsMap.chart_settings ||
        {}),
    },

    chartColors:
      Array.isArray(
        settingsMap.chart_colors
      ) &&
      settingsMap.chart_colors.length
        ? settingsMap.chart_colors
        : DEFAULT_CHART_COLORS,

    updatedAt:
      rows
        .map(
          (row) => row.updated_at
        )
        .filter(Boolean)
        .sort()
        .at(-1) || null,
  };
}

export async function getUiSettings(
  request,
  response,
  next
) {
  try {
    const {
      data,
      error,
    } = await supabaseAdmin
      .from("ui_settings")
      .select(`
        setting_key,
        setting_value,
        updated_at
      `)
      .in("setting_key", [
        "theme",
        "chart_settings",
        "chart_colors",
      ]);

    if (error) {
      throw error;
    }

    response.json({
      success: true,
      data: mapSettings(
        data || []
      ),
    });
  } catch (error) {
    next(error);
  }
}

export async function updateUiSettings(
  request,
  response,
  next
) {
  try {
    const input =
      updateSettingsSchema.parse(
        request.body
      );

    const userId =
      request.profile.id;

    const rows = [
      {
        setting_key: "theme",
        setting_value:
          input.theme,
        description:
          "Global Angelbird interface theme",
        updated_by: userId,
      },
      {
        setting_key:
          "chart_settings",
        setting_value:
          input.chartSettings,
        description:
          "Global chart type configuration",
        updated_by: userId,
      },
      {
        setting_key:
          "chart_colors",
        setting_value:
          input.chartColors,
        description:
          "Shared chart color palette",
        updated_by: userId,
      },
    ];

    const {
      data,
      error,
    } = await supabaseAdmin
      .from("ui_settings")
      .upsert(rows, {
        onConflict:
          "setting_key",
      })
      .select(`
        setting_key,
        setting_value,
        updated_at
      `);

    if (error) {
      throw error;
    }

    await supabaseAdmin
      .from("audit_logs")
      .insert({
        user_id: userId,
        action:
          "settings.ui.updated",
        entity_type:
          "ui_settings",
        entity_id: null,
        metadata: {
          keys: [
            "theme",
            "chart_settings",
            "chart_colors",
          ],
        },
        ip_address:
          request.ip || null,
        user_agent:
          request.headers[
            "user-agent"
          ] || null,
      });

    response.json({
      success: true,
      message:
        "Application settings saved successfully.",
      data: mapSettings(
        data || []
      ),
    });
  } catch (error) {
    next(error);
  }
}