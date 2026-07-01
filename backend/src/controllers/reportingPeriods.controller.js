import { z } from "zod";

import {
  supabaseAdmin,
} from "../config/supabase.js";

import {
  ensureCurrentReportingPeriod,
} from "../services/reportingPeriods.service.js";

const createPeriodSchema =
  z.object({
    reportYear: z.coerce
      .number()
      .int()
      .min(2000)
      .max(2100),

    reportMonth: z.coerce
      .number()
      .int()
      .min(1)
      .max(12),

    notes: z
      .string()
      .trim()
      .max(1000)
      .optional()
      .nullable(),
  });

const updateStatusSchema =
  z.object({
    status: z.enum([
      "open",
      "locked",
      "archived",
    ]),
  });

export async function listReportingPeriods(
  request,
  response,
  next
) {
  try {
    /*
     * Har list request par current calendar
     * month aur year database mein ensure hoga.
     *
     * Example:
     * July 2026 start hote hi 2026-07 create hoga.
     * January 2027 start hote hi 2027-01 create hoga.
     */
    await ensureCurrentReportingPeriod({
      createdBy:
        request.profile?.id ||
        null,
    });

    const {
      data,
      error,
    } = await request.supabase
      .from(
        "reporting_periods"
      )
      .select(`
        id,
        report_year,
        report_month,
        period_key,
        period_name,
        period_start,
        period_end,
        status,
        notes,
        created_at,
        updated_at
      `)
      .order(
        "period_start",
        {
          ascending: false,
        }
      );

    if (error) {
      throw error;
    }

    response.json({
      success: true,
      data: data || [],
    });
  } catch (error) {
    next(error);
  }
}

export async function createReportingPeriod(
  request,
  response,
  next
) {
  try {
    const input =
      createPeriodSchema.parse(
        request.body
      );

    const {
      data,
      error,
    } = await supabaseAdmin
      .from(
        "reporting_periods"
      )
      .insert({
        report_year:
          input.reportYear,

        report_month:
          input.reportMonth,

        notes:
          input.notes ||
          null,

        created_by:
          request.profile.id,
      })
      .select()
      .single();

    if (error) {
      if (
        error.code === "23505"
      ) {
        return response
          .status(409)
          .json({
            success: false,

            message:
              "This reporting month already exists.",
          });
      }

      throw error;
    }

    response
      .status(201)
      .json({
        success: true,

        message:
          "Reporting period created successfully.",

        data,
      });
  } catch (error) {
    next(error);
  }
}

export async function updateReportingPeriodStatus(
  request,
  response,
  next
) {
  try {
    const input =
      updateStatusSchema.parse(
        request.body
      );

    const {
      data,
      error,
    } = await supabaseAdmin
      .from(
        "reporting_periods"
      )
      .update({
        status:
          input.status,
      })
      .eq(
        "id",
        request.params.id
      )
      .select()
      .single();

    if (error) {
      throw error;
    }

    response.json({
      success: true,

      message:
        "Reporting period status updated.",

      data,
    });
  } catch (error) {
    next(error);
  }
}