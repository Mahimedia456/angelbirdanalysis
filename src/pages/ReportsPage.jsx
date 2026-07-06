import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  FileSpreadsheet,
  Loader2,
  RefreshCw,
  SmilePlus,
  Sheet,
} from "lucide-react";

import * as XLSX from "xlsx";

import TicketFilters from "../components/tickets/TicketFilters";
import TicketKpiCards from "../components/tickets/TicketKpiCards";
import ChartPanel from "../components/dashboard/ChartPanel";
import ExportActions from "../components/export/ExportActions";

import SatisfactionFilters from "../components/satisfaction/SatisfactionFilters";
import SatisfactionKpiCards from "../components/satisfaction/SatisfactionKpiCards";
import SatisfactionAnalyticsPanel from "../components/satisfaction/SatisfactionAnalyticsPanel";
import SatisfactionReportTable from "../components/satisfaction/SatisfactionReportTable";

import {
  getChartSettings,
} from "../utils/storage";

import {
  getSelectedReportingPeriod,
  saveSelectedReportingPeriod,
} from "../utils/reportingPeriod";

import {
  fetchReportsData,
} from "../services/reportsApi";

import {
  filterTickets,
} from "../utils/ticketMapper";

import {
  buildTicketAnalytics,
} from "../utils/ticketAnalytics";

import {
  filterSatisfaction,
} from "../utils/satisfactionMapper";

import {
  buildSatisfactionAnalytics,
} from "../utils/satisfactionAnalytics";

function cleanText(value) {
  return String(
    value ?? ""
  )
    .trim()
    .replace(/\s+/g, " ");
}

function normalizeKey(value) {
  return cleanText(value)
    .toLowerCase();
}

function getTicketValue(
  row,
  keys
) {
  for (const key of keys) {
    const value = row?.[key];

    if (
      value !== undefined &&
      value !== null &&
      cleanText(value) !== ""
    ) {
      return cleanText(value);
    }
  }

  return "Unknown";
}

function makeSummary(
  rows,
  keys
) {
  const map = new Map();

  rows.forEach((row) => {
    const name =
      getTicketValue(
        row,
        keys
      );

    const normalizedName =
      normalizeKey(name);

    if (
      !map.has(
        normalizedName
      )
    ) {
      map.set(
        normalizedName,
        {
          name,
          value: 0,
        }
      );
    }

    map.get(
      normalizedName
    ).value += 1;
  });

  return Array.from(
    map.values()
  ).sort(
    (a, b) =>
      Number(
        b.value || 0
      ) -
      Number(
        a.value || 0
      )
  );
}

function makeDateSummary(
  rows
) {
  const map = new Map();

  rows.forEach((row) => {
    const date =
      getTicketValue(
        row,
        [
          "date",
          "ticketDate",
          "ticket_date",
          "createdDate",
          "submittedDate",
        ]
      );

    if (
      !date ||
      date === "Unknown"
    ) {
      return;
    }

    map.set(
      date,
      (map.get(date) || 0) +
        1
    );
  });

  return Array.from(
    map.entries()
  )
    .map(
      ([
        name,
        value,
      ]) => ({
        name,
        value,
      })
    )
    .sort((a, b) =>
      String(
        a.name
      ).localeCompare(
        String(b.name)
      )
    );
}

function makeTicketChartData(
  rows
) {
  return {
    region: makeSummary(
      rows,
      [
        "region",
        "Region",
      ]
    ),

    tse: makeSummary(
      rows,
      [
        "tse",
        "TSE",
        "agent",
        "engineer",
      ]
    ),

    date:
      makeDateSummary(rows),

    supportCategory:
      makeSummary(
        rows,
        [
          "supportCategory",
          "support_category",
          "category",
        ]
      ),

    productCategory:
      makeSummary(
        rows,
        [
          "productCategory",
          "product_category",
        ]
      ),

    procedure:
      makeSummary(
        rows,
        [
          "procedure",
          "Procedure",
        ]
      ),

    product:
      makeSummary(
        rows,
        [
          "product",
          "productName",
          "product_name",
          "product1",
          "product_1",
          "products",
        ]
      ),
  };
}

function safeExcelFilename(
  value
) {
  return cleanText(value)
    .replace(
      /[\\/:*?"<>|]/g,
      "-"
    )
    .replace(/\s+/g, "-")
    .toLowerCase();
}

function exportRowsToExcel({
  rows,
  filename,
  sheetName,
  mapRow,
  columnWidths = [],
}) {
  if (!rows.length) {
    window.alert(
      "No records to export."
    );

    return;
  }

  const exportRows =
    rows.map(mapRow);

  const worksheet =
    XLSX.utils.json_to_sheet(
      exportRows
    );

  if (
    columnWidths.length
  ) {
    worksheet["!cols"] =
      columnWidths.map(
        (width) => ({
          wch: width,
        })
      );
  }

  worksheet["!autofilter"] = {
    ref:
      worksheet["!ref"] ||
      "A1:A1",
  };

  const workbook =
    XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    sheetName
  );

  XLSX.writeFile(
    workbook,
    `${safeExcelFilename(
      filename
    )}.xlsx`
  );
}

function exportTicketExcel({
  rows,
  periodName,
  tableMode = "all",
}) {
  exportRowsToExcel({
    rows,

    filename:
      `angelbird-${periodName}-ticket-${tableMode}-report`,

    sheetName:
      "Ticket Report",

    mapRow: (row) => ({
      Date:
        row.date_display ||
        row.date ||
        row.ticketDate ||
        row.ticket_date ||
        "",

      "Ticket #":
        row.ticketNumber ||
        row.ticket_number ||
        row.ticketNo ||
        "",

      Region:
        row.region ||
        "",

      TSE:
        row.tse ||
        row.TSE ||
        row.agent ||
        row.engineer ||
        "",

      Product:
        row.product ||
        row.productName ||
        row.product_name ||
        row.product1 ||
        row.product_1 ||
        row.products ||
        "",

      "Support Category":
        row.supportCategory ||
        row.support_category ||
        row.category ||
        "",

      "Product Category":
        row.productCategory ||
        row.product_category ||
        "",

      Procedure:
        row.procedure ||
        row.Procedure ||
        "",

      Subject:
        row.ticketSubject ||
        row.ticket_subject ||
        row.subject ||
        "",
    }),

    columnWidths: [
      15,
      14,
      12,
      22,
      34,
      24,
      24,
      22,
      70,
    ],
  });
}

function exportSatisfactionExcel({
  rows,
  periodName,
}) {
  exportRowsToExcel({
    rows,

    filename:
      `angelbird-${periodName}-satisfaction-report`,

    sheetName:
      "Satisfaction Report",

    mapRow: (row) => ({
      Date:
        row.date_display ||
        row.date ||
        row.updatedDate ||
        row.updated_date ||
        row.responseDate ||
        row.response_date ||
        "",

      "Ticket #":
        row.ticketNumber ||
        row.ticket_number ||
        row.ticketId ||
        row.ticket_id ||
        "",

      Rating:
        row.rating ||
        "",

      "Solved Status":
        row.solvedStatus ||
        row.solved_status ||
        row.status ||
        "",

      Comment:
        row.comment ||
        row.comments ||
        row.feedback ||
        "",
    }),

    columnWidths: [
      15,
      15,
      16,
      20,
      80,
    ],
  });
}

const TICKET_TABLE_TABS = [
  {
    key: "all",
    label: "All Tickets",
  },
  {
    key: "region",
    label: "Region Wise",
  },
  {
    key: "tse",
    label:
      "TSE / Agent Wise",
  },
  {
    key: "support",
    label:
      "Support Category",
  },
  {
    key: "productCategory",
    label:
      "Product Category",
  },
  {
    key: "product",
    label: "Product Wise",
  },
  {
    key: "procedure",
    label: "Procedure Wise",
  },
];

function ReportModeButton({
  active,
  icon: Icon,
  children,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-black transition",

        active
          ? "bg-slate-900 text-white shadow-sm"
          : "text-slate-500 hover:bg-slate-100 hover:text-slate-900",
      ].join(" ")}
    >
      <Icon size={16} />

      {children}
    </button>
  );
}

function ReportsLoading() {
  return (
    <div className="flex min-h-[420px] items-center justify-center rounded-[28px] border border-slate-200 bg-white">
      <div className="text-center">
        <Loader2
          size={34}
          className="mx-auto animate-spin text-slate-700"
        />

        <p className="mt-4 text-sm font-black text-slate-600">
          Loading monthly reports...
        </p>
      </div>
    </div>
  );
}

function EmptyPeriodState() {
  return (
    <section className="flex min-h-[320px] items-center justify-center rounded-[28px] border border-slate-200 bg-white p-8 text-center">
      <div>
        <CalendarDays
          size={38}
          className="mx-auto text-slate-300"
        />

        <h2 className="mt-5 text-2xl font-extrabold text-slate-950">
          No reporting month available
        </h2>

        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
          Upload full CSV data first,
          then select a reporting month.
        </p>
      </div>
    </section>
  );
}

function TicketTabbedTable({
  tickets = [],
  title,
  periodName,
}) {
  const [
    activeTab,
    setActiveTab,
  ] = useState("all");

  const [
    selectedValue,
    setSelectedValue,
  ] = useState("");

  const tabConfig = {
    all: {
      label: "All Tickets",
      keys: [],
    },

    region: {
      label: "Region",
      keys: [
        "region",
        "Region",
      ],
    },

    tse: {
      label: "TSE / Agent",
      keys: [
        "tse",
        "TSE",
        "agent",
        "engineer",
      ],
    },

    support: {
      label:
        "Support Category",

      keys: [
        "supportCategory",
        "support_category",
        "category",
      ],
    },

    productCategory: {
      label:
        "Product Category",

      keys: [
        "productCategory",
        "product_category",
      ],
    },

    product: {
      label: "Product",

      keys: [
        "product",
        "productName",
        "product_name",
        "product1",
        "product_1",
        "products",
      ],
    },

    procedure: {
      label: "Procedure",

      keys: [
        "procedure",
        "Procedure",
      ],
    },
  };

  const currentConfig =
    tabConfig[activeTab] ||
    tabConfig.all;

  const filterOptions =
    useMemo(() => {
      if (
        activeTab === "all"
      ) {
        return [];
      }

      const map =
        new Map();

      tickets.forEach(
        (ticket) => {
          const value =
            getTicketValue(
              ticket,
              currentConfig.keys
            );

          if (
            value &&
            value !== "Unknown"
          ) {
            const key =
              normalizeKey(value);

            if (
              !map.has(key)
            ) {
              map.set(
                key,
                value
              );
            }
          }
        }
      );

      return Array.from(
        map.values()
      ).sort((a, b) =>
        String(a).localeCompare(
          String(b)
        )
      );
    }, [
      tickets,
      activeTab,
      currentConfig.keys,
    ]);

  const visibleTickets =
    useMemo(() => {
      if (
        activeTab === "all" ||
        !selectedValue
      ) {
        return tickets;
      }

      return tickets.filter(
        (ticket) => {
          const value =
            getTicketValue(
              ticket,
              currentConfig.keys
            );

          return (
            normalizeKey(value) ===
            normalizeKey(
              selectedValue
            )
          );
        }
      );
    }, [
      tickets,
      activeTab,
      selectedValue,
      currentConfig.keys,
    ]);

  function changeTab(
    tabKey
  ) {
    setActiveTab(tabKey);

    setSelectedValue("");
  }

  return (
    <section className="angel-card overflow-hidden p-0 pdf-export-section">
      <div className="border-b border-slate-200 p-5">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <p className="angel-mini-label">
              Ticket Data Table
            </p>

            <h3 className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950">
              {title}
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Select a category tab
              and filter the actual
              ticket records.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              exportTicketExcel({
                rows:
                  visibleTickets,

                periodName,

                tableMode:
                  activeTab,
              })
            }
            className="no-print no-export inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 text-sm font-black text-white shadow-sm transition hover:bg-sky-700"
          >
            <Sheet
              size={18}
            />

            Export Excel
          </button>
        </div>

        <div className="no-print no-export mt-5 flex flex-wrap gap-2">
          {TICKET_TABLE_TABS.map(
            (tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() =>
                  changeTab(
                    tab.key
                  )
                }
                className={[
                  "rounded-full px-4 py-2.5 text-xs font-black transition",

                  activeTab ===
                  tab.key
                    ? "text-slate-950 shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-950",
                ].join(" ")}
                style={
                  activeTab ===
                  tab.key
                    ? {
                        background:
                          "var(--accent-color)",
                      }
                    : undefined
                }
              >
                {tab.label}
              </button>
            )
          )}
        </div>

        {activeTab !==
        "all" ? (
          <div className="no-print no-export mt-5 max-w-xl rounded-[22px] border border-slate-200 bg-slate-50 p-4">
            <label className="angel-label">
              Filter by{" "}
              {
                currentConfig.label
              }
            </label>

            <select
              className="angel-input h-12 bg-white"
              value={
                selectedValue
              }
              onChange={(
                event
              ) =>
                setSelectedValue(
                  event.target.value
                )
              }
            >
              <option value="">
                All{" "}
                {
                  currentConfig.label
                }
              </option>

              {filterOptions.map(
                (item) => (
                  <option
                    key={
                      normalizeKey(
                        item
                      )
                    }
                    value={item}
                  >
                    {item}
                  </option>
                )
              )}
            </select>
          </div>
        ) : null}

        <div className="mt-5 inline-flex rounded-full bg-slate-100 px-4 py-2 text-xs font-black text-slate-600">
          Showing{" "}
          {visibleTickets.length.toLocaleString()}{" "}
          ticket records
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
            <tr>
              <th className="px-4 py-3">
                Date
              </th>

              <th className="px-4 py-3">
                Ticket #
              </th>

              <th className="px-4 py-3">
                Region
              </th>

              <th className="px-4 py-3">
                TSE
              </th>

              <th className="px-4 py-3">
                Product
              </th>

              <th className="px-4 py-3">
                Support Category
              </th>

              <th className="px-4 py-3">
                Product Category
              </th>

              <th className="px-4 py-3">
                Procedure
              </th>

              <th className="px-4 py-3">
                Subject
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {!visibleTickets.length ? (
              <tr>
                <td
                  colSpan={9}
                  className="px-4 py-8 text-center text-sm text-slate-500"
                >
                  No ticket records found.
                </td>
              </tr>
            ) : null}

            {visibleTickets.map(
              (
                ticket,
                index
              ) => (
                <tr
                  key={
                    ticket.id ||
                    index
                  }
                  className="text-slate-700 transition hover:bg-slate-50"
                >
                  <td className="whitespace-nowrap px-4 py-3">
                    {cleanText(
                      ticket.date_display ||
                        ticket.date ||
                        ticket.ticketDate ||
                        ticket.ticket_date
                    ) || "-"}
                  </td>

                  <td className="whitespace-nowrap px-4 py-3 font-bold text-slate-950">
                    {cleanText(
                      ticket.ticketNumber ||
                        ticket.ticket_number ||
                        ticket.ticketNo
                    ) || "-"}
                  </td>

                  <td className="px-4 py-3">
                    {cleanText(
                      ticket.region
                    ) || "-"}
                  </td>

                  <td className="px-4 py-3">
                    {cleanText(
                      ticket.tse ||
                        ticket.TSE ||
                        ticket.agent ||
                        ticket.engineer
                    ) || "-"}
                  </td>

                  <td className="min-w-[180px] px-4 py-3">
                    {cleanText(
                      ticket.product ||
                        ticket.productName ||
                        ticket.product_name ||
                        ticket.product1 ||
                        ticket.product_1 ||
                        ticket.products
                    ) || "-"}
                  </td>

                  <td className="min-w-[180px] px-4 py-3">
                    {cleanText(
                      ticket.supportCategory ||
                        ticket.support_category ||
                        ticket.category
                    ) || "-"}
                  </td>

                  <td className="min-w-[180px] px-4 py-3">
                    {cleanText(
                      ticket.productCategory ||
                        ticket.product_category
                    ) || "-"}
                  </td>

                  <td className="min-w-[180px] px-4 py-3">
                    {cleanText(
                      ticket.procedure ||
                        ticket.Procedure
                    ) || "-"}
                  </td>

                  <td className="min-w-[320px] px-4 py-3">
                    {cleanText(
                      ticket.ticketSubject ||
                        ticket.ticket_subject ||
                        ticket.subject
                    ) || "-"}
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function ReportsPage() {
  const [
    mode,
    setMode,
  ] = useState("tickets");

  const [
    ticketRows,
    setTicketRows,
  ] = useState([]);

  const [
    satisfactionRows,
    setSatisfactionRows,
  ] = useState([]);

  const [
    periods,
    setPeriods,
  ] = useState([]);

  const [
    selectedPeriod,
    setSelectedPeriod,
  ] = useState(null);

  const [
    selectedPeriodKey,
    setSelectedPeriodKey,
  ] = useState(
    getSelectedReportingPeriod()
  );

  const [
    chartSettings,
    setChartSettings,
  ] = useState(
    getChartSettings()
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    ticketFilters,
    setTicketFilters,
  ] = useState({
    search: "",
    region: "",
    supportCategory: "",
    productCategory: "",
    procedure: "",
    dateFrom: "",
    dateTo: "",
  });

  const [
    satisfactionFilters,
    setSatisfactionFilters,
  ] = useState({
    search: "",
    rating: "",
    solvedStatus: "",
    dateFrom: "",
    dateTo: "",
  });

  useEffect(() => {
    const controller =
      new AbortController();

    loadReports({
      period:
        getSelectedReportingPeriod(),

      signal:
        controller.signal,
    });

    return () => {
      controller.abort();
    };
  }, []);

  async function loadReports({
    period =
      selectedPeriodKey,
    signal,
  } = {}) {
    setLoading(true);
    setError("");

    try {
      const data =
        await fetchReportsData({
          period,
          signal,
        });

      const returnedPeriod =
        data?.selectedPeriod ||
        null;

      const returnedPeriodKey =
        returnedPeriod?.period_key ||
        "";

      setPeriods(
        data?.periods || []
      );

      setSelectedPeriod(
        returnedPeriod
      );

      setSelectedPeriodKey(
        returnedPeriodKey
      );

      saveSelectedReportingPeriod(
        returnedPeriodKey
      );

      setTicketRows(
        data?.tickets || []
      );

      setSatisfactionRows(
        data?.satisfaction || []
      );

      setChartSettings(
        getChartSettings()
      );

      resetFilters();
    } catch (loadError) {
      if (
        loadError.name ===
        "AbortError"
      ) {
        return;
      }

      setError(
        loadError.message ||
          "Unable to load report data."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handlePeriodChange(
    event
  ) {
    const periodKey =
      event.target.value;

    setSelectedPeriodKey(
      periodKey
    );

    saveSelectedReportingPeriod(
      periodKey
    );

    await loadReports({
      period: periodKey,
    });
  }

  function resetFilters() {
    setTicketFilters({
      search: "",
      region: "",
      supportCategory: "",
      productCategory: "",
      procedure: "",
      dateFrom: "",
      dateTo: "",
    });

    setSatisfactionFilters({
      search: "",
      rating: "",
      solvedStatus: "",
      dateFrom: "",
      dateTo: "",
    });
  }

  const filteredTickets =
    useMemo(
      () =>
        filterTickets(
          ticketRows,
          ticketFilters
        ),
      [
        ticketRows,
        ticketFilters,
      ]
    );

  const ticketAnalytics =
    useMemo(
      () =>
        buildTicketAnalytics(
          filteredTickets
        ),
      [filteredTickets]
    );

  const ticketChartData =
    useMemo(
      () =>
        makeTicketChartData(
          filteredTickets
        ),
      [filteredTickets]
    );

  const filteredSatisfaction =
    useMemo(
      () =>
        filterSatisfaction(
          satisfactionRows,
          satisfactionFilters
        ),
      [
        satisfactionRows,
        satisfactionFilters,
      ]
    );

  const satisfactionAnalytics =
    useMemo(
      () =>
        buildSatisfactionAnalytics(
          filteredSatisfaction
        ),
      [
        filteredSatisfaction,
      ]
    );

  const currentModeLabel =
    mode === "tickets"
      ? "Ticket Report"
      : "Satisfaction Report";

  const exportTitle =
    `Angelbird ${
      selectedPeriod?.period_name ||
      "Monthly"
    } ${currentModeLabel}`;

  function handleExcelExport() {
    if (
      mode === "tickets"
    ) {
      exportTicketExcel({
        rows:
          filteredTickets,

        periodName:
          selectedPeriod?.period_name ||
          "monthly",

        tableMode:
          "filtered",
      });

      return;
    }

    exportSatisfactionExcel({
      rows:
        filteredSatisfaction,

      periodName:
        selectedPeriod?.period_name ||
        "monthly",
    });
  }

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[38px] border border-slate-200 bg-slate-900 p-8 text-white shadow-soft md:p-10">
        <div className="absolute right-0 top-0 h-full w-1/2 opacity-20 angel-grid-bg" />

        <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full border-[55px] border-white/[0.035]" />

        <div className="relative grid gap-8 xl:grid-cols-[1fr_0.9fr] xl:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-white/45">
                Angelbird Report Center
              </p>

              {selectedPeriod ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-2 text-xs font-black text-white/80">
                  <CalendarDays
                    size={14}
                  />

                  {
                    selectedPeriod.period_name
                  }
                </span>
              ) : null}
            </div>

            <h1 className="mt-4 max-w-3xl text-4xl font-black leading-none tracking-[-0.06em] md:text-6xl">
Monthly Performance & Analytics Reports
            </h1>

            <p className="mt-5 max-w-2xl text-sm leading-6 text-white/65">
              Generate ticket and satisfaction reports from the selected reporting month.
            </p>
          </div>

          <div
            className="rounded-[30px] p-6 text-slate-900"
            style={{
              background:
                "var(--accent-color)",
            }}
          >
            <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-700">
              Current Report
            </p>

            <h2 className="mt-3 text-4xl font-black leading-none tracking-[-0.07em] md:text-5xl">
              {mode === "tickets"
                ? "Tickets"
                : "Satisfaction"}
            </h2>

            <p className="mt-4 text-sm leading-6 text-slate-700">
              Tickets:{" "}
              {ticketRows.length} ·
              Satisfaction:{" "}
              {
                satisfactionRows.length
              }
            </p>

            <p className="mt-2 text-xs font-black uppercase tracking-[0.14em] text-slate-600">
              {selectedPeriod?.period_name ||
                "No reporting month"}
            </p>
          </div>
        </div>
      </section>

      <section className="no-print no-export rounded-[28px] border border-slate-200 bg-white p-4 shadow-soft">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="flex flex-wrap gap-2">
            <ReportModeButton
              active={
                mode === "tickets"
              }
              icon={
                FileSpreadsheet
              }
              onClick={() =>
                setMode("tickets")
              }
            >
              Ticket Report
            </ReportModeButton>

            <ReportModeButton
              active={
                mode ===
                "satisfaction"
              }
              icon={SmilePlus}
              onClick={() =>
                setMode(
                  "satisfaction"
                )
              }
            >
              Satisfaction Report
            </ReportModeButton>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-end xl:w-auto">
            <div className="min-w-0 sm:w-[240px]">
              <label
                htmlFor="reports-reporting-period"
                className="mb-2 block text-[10px] font-black uppercase tracking-[0.16em] text-slate-500"
              >
                Reporting Month
              </label>

              <select
                id="reports-reporting-period"
                value={
                  selectedPeriodKey
                }
                onChange={
                  handlePeriodChange
                }
                disabled={
                  loading ||
                  !periods.length
                }
                className="angel-input h-12"
              >
                {!periods.length ? (
                  <option value="">
                    No reporting periods
                  </option>
                ) : null}

                {periods.map(
                  (period) => (
                    <option
                      key={
                        period.id
                      }
                      value={
                        period.period_key
                      }
                    >
                      {
                        period.period_name
                      }
                    </option>
                  )
                )}
              </select>
            </div>

            <button
              type="button"
              onClick={() =>
                loadReports({
                  period:
                    selectedPeriodKey,
                })
              }
              disabled={loading}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <Loader2
                  size={17}
                  className="animate-spin"
                />
              ) : (
                <RefreshCw
                  size={17}
                />
              )}

              Refresh
            </button>

            <button
              type="button"
              onClick={
                handleExcelExport
              }
              disabled={loading}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 text-sm font-black text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Sheet size={18} />

              Export Excel
            </button>

            <ExportActions
              targetId="reports-export-area"
              title={exportTitle}
              mode="report"
            />
          </div>
        </div>
      </section>

      {error ? (
        <section className="flex items-start gap-3 rounded-[22px] border border-red-200 bg-red-50 p-5 text-red-700">
          <AlertCircle
            size={20}
            className="mt-0.5 shrink-0"
          />

          <div>
            <p className="font-black">
              Report data could not be loaded
            </p>

            <p className="mt-1 text-sm leading-6">
              {error}
            </p>
          </div>
        </section>
      ) : null}

      {loading ? (
        <ReportsLoading />
      ) : !selectedPeriod ? (
        <EmptyPeriodState />
      ) : (
        <div
          id="reports-export-area"
          className="space-y-8 rounded-[28px] bg-white p-1"
        >
          

          {mode === "tickets" ? (
            <>
              <div className="no-print no-export">
                <TicketFilters
                  tickets={
                    ticketRows
                  }
                  filters={
                    ticketFilters
                  }
                  onChange={
                    setTicketFilters
                  }
                />
              </div>

              <section className="angel-section p-6 pdf-export-section">
                <p className="angel-mini-label">
                  Report Summary
                </p>

                <h2 className="mt-2 angel-page-title">
                  Ticket Analytics Summary
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  Filtered tickets:{" "}
                  {
                    filteredTickets.length
                  }{" "}
                  from{" "}
                  {ticketRows.length}{" "}
                  total records for{" "}
                  {
                    selectedPeriod.period_name
                  }
                  .
                </p>
              </section>

              <TicketKpiCards
                analytics={
                  ticketAnalytics
                }
              />

              <section className="grid gap-6 xl:grid-cols-2">
                <ChartPanel
                  chartId="ticket_by_region"
                  title="Ticket by Region"
                  data={
                    ticketChartData.region
                  }
                  type="pie"
                />

                <ChartPanel
                  chartId="ticket_by_tse"
                  title="Ticket by TSE"
                  data={
                    ticketChartData.tse
                  }
                  type="pie"
                />

                <ChartPanel
                  className="xl:col-span-2"
                  chartId="date_wise_ticket"
                  title="Date Wise Ticket"
                  data={
                    ticketChartData.date
                  }
                  type="line"
                />

                <ChartPanel
                  chartId="ticket_support_category"
                  title="Ticket Support Category"
                  data={
                    ticketChartData.supportCategory
                  }
                  type="bar"
                />

                <ChartPanel
                  chartId="ticket_product_category"
                  title="Ticket Product Category"
                  data={
                    ticketChartData.productCategory
                  }
                  type="line"
                />

                <ChartPanel
                  className="xl:col-span-2"
                  chartId="ticket_procedure"
                  title="Ticket Procedure"
                  data={
                    ticketChartData.procedure
                  }
                  type="bar"
                />

                <ChartPanel
                  className="xl:col-span-2"
                  chartId="top_product_by_ticket_count"
                  title="Top Product by Ticket Count"
                  data={
                    ticketChartData.product
                  }
                  type="bar"
                />
              </section>

              <TicketTabbedTable
                title={`Ticket Report Data — ${selectedPeriod.period_name}`}
                tickets={
                  filteredTickets
                }
                periodName={
                  selectedPeriod.period_name
                }
              />
            </>
          ) : (
            <>
              <div className="no-print no-export">
                <SatisfactionFilters
                  rows={
                    satisfactionRows
                  }
                  filters={
                    satisfactionFilters
                  }
                  onChange={
                    setSatisfactionFilters
                  }
                />
              </div>

              <section className="angel-section p-6 pdf-export-section">
                <p className="angel-mini-label">
                  Report Summary
                </p>

                <h2 className="mt-2 angel-page-title">
                  Customer Satisfaction Summary
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  Filtered responses:{" "}
                  {
                    filteredSatisfaction.length
                  }{" "}
                  from{" "}
                  {
                    satisfactionRows.length
                  }{" "}
                  total records for{" "}
                  {
                    selectedPeriod.period_name
                  }
                  .
                </p>
              </section>

              <SatisfactionKpiCards
                analytics={
                  satisfactionAnalytics
                }
              />

              <SatisfactionAnalyticsPanel
                analytics={
                  satisfactionAnalytics
                }
                chartSettings={
                  chartSettings
                }
                prefix="report"
                showTables={false}
              />

              <SatisfactionReportTable
                title={`Customer Satisfaction Report Data — ${selectedPeriod.period_name}`}
                rows={
                  filteredSatisfaction
                }
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}