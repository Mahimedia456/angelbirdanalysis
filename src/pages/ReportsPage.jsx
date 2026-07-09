  import {
    useEffect,
    useMemo,
    useState,
  } from "react";

  import {
    useSearchParams,
  } from "react-router-dom";

  import {
    AlertCircle,
    ClipboardList,
    FileSpreadsheet,
    Loader2,
    RefreshCw,
    SmilePlus,
    Sheet,
  } from "lucide-react";

  import * as XLSX from "xlsx";

  import {
    useAuth,
  } from "../context/AuthContext";

  import TicketFilters from "../components/tickets/TicketFilters";
  import TicketKpiCards from "../components/tickets/TicketKpiCards";
  import ChartPanel from "../components/dashboard/ChartPanel";
  import ExportActions from "../components/export/ExportActions";

  import SatisfactionFilters from "../components/satisfaction/SatisfactionFilters";
  import SatisfactionKpiCards from "../components/satisfaction/SatisfactionKpiCards";
  import SatisfactionAnalyticsPanel from "../components/satisfaction/SatisfactionAnalyticsPanel";
  import SatisfactionReportTable from "../components/satisfaction/SatisfactionReportTable";

  import RmaFilters from "../components/rma/RmaFilters";
  import RmaKpiCards from "../components/rma/RmaKpiCards";
  import RmaAnalyticsPanel from "../components/rma/RmaAnalyticsPanel";
  import RmaReportTable from "../components/rma/RmaReportTable";

  import {
    getChartSettings,
  } from "../utils/storage";

  import {
    fetchReportsData,
  } from "../services/reportsApi";

  import {
    fetchUploadedRmaReports,
  } from "../services/rmaReportsApi";

  import {
    buildTicketAnalytics,
  } from "../utils/ticketAnalytics";

  import {
    buildSatisfactionAnalytics,
  } from "../utils/satisfactionAnalytics";

  function cleanText(value) {
    return String(value ?? "")
      .trim()
      .replace(/\s+/g, " ");
  }

  function normalizeKey(value) {
    return cleanText(value).toLowerCase();
  }

  function normalizeProcedure(value) {
    const normalized = normalizeKey(value);

    if (normalized === "data recovery") {
      return "data recovery";
    }

    return normalized;
  }

  function normalizeDate(value) {
    const raw = String(value || "").trim();

    if (!raw) return "";

    const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);

    if (iso) {
      return `${iso[1]}-${iso[2]}-${iso[3]}`;
    }

    const textDate = raw.match(/^(\d{1,2})-([A-Za-z]{3,})-(\d{2,4})$/);

    if (textDate) {
      const day = Number(textDate[1]);
      const monthName = textDate[2].slice(0, 3).toLowerCase();
      let year = Number(textDate[3]);

      if (year < 100) year += 2000;

      const monthMap = {
        jan: 1,
        feb: 2,
        mar: 3,
        apr: 4,
        may: 5,
        jun: 6,
        jul: 7,
        aug: 8,
        sep: 9,
        oct: 10,
        nov: 11,
        dec: 12,
      };

      const month = monthMap[monthName];

      if (month) {
        return [
          String(year).padStart(4, "0"),
          String(month).padStart(2, "0"),
          String(day).padStart(2, "0"),
        ].join("-");
      }
    }

    const slash = raw.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})$/);

    if (slash) {
      let first = Number(slash[1]);
      let second = Number(slash[2]);
      let year = Number(slash[3]);

      if (year < 100) {
        year += 2000;
      }

      let month = first;
      let day = second;

      if (first > 12) {
        day = first;
        month = second;
      }

      return [
        String(year).padStart(4, "0"),
        String(month).padStart(2, "0"),
        String(day).padStart(2, "0"),
      ].join("-");
    }

    const parsed = new Date(raw);

    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 10);
    }

    return "";
  }

  function getTicketDate(row) {
    return normalizeDate(
      row.ticket_date ||
        row.ticketDate ||
        row.date ||
        row.date_display ||
        row.createdDate ||
        row.submittedDate ||
        ""
    );
  }

  function getSatisfactionDate(row) {
    return normalizeDate(
      row.updated_date ||
        row.updatedDate ||
        row.date ||
        row.date_display ||
        row.responseDate ||
        row.response_date ||
        ""
    );
  }

  function getTicketValue(row, keys) {
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

  function normalizeDisplayLabel(value) {
    const text = cleanText(value);

    if (normalizeKey(text) === "troubleshoot") {
      return "Troubleshooting";
    }

    return text;
  }

  function makeSummary(rows, keys) {
    const map = new Map();

    rows.forEach((row) => {
      const name = normalizeDisplayLabel(getTicketValue(row, keys));
      const normalizedName = normalizeKey(name);

      if (!map.has(normalizedName)) {
        map.set(normalizedName, {
          name,
          value: 0,
        });
      }

      map.get(normalizedName).value += 1;
    });

    return Array.from(map.values()).sort(
      (a, b) => Number(b.value || 0) - Number(a.value || 0)
    );
  }

  function makeDateSummary(rows) {
    const map = new Map();

    rows.forEach((row) => {
      const date = getTicketDate(row);

      if (!date) {
        return;
      }

      map.set(date, (map.get(date) || 0) + 1);
    });

    return Array.from(map.entries())
      .map(([name, value]) => ({
        name,
        value,
      }))
      .sort((a, b) => String(a.name).localeCompare(String(b.name)));
  }

  function makeTicketChartData(rows) {
    return {
      region: makeSummary(rows, ["region", "Region"]),
      tse: makeSummary(rows, ["tse", "TSE", "agent", "engineer"]),
      date: makeDateSummary(rows),
      supportCategory: makeSummary(rows, [
        "supportCategory",
        "support_category",
        "category",
      ]),
      productCategory: makeSummary(rows, [
        "productCategory",
        "product_category",
      ]),
      procedure: makeSummary(rows, ["procedure", "Procedure"]),
      product: makeSummary(rows, [
        "product",
        "productName",
        "product_name",
        "product1",
        "product_1",
        "products",
      ]),
    };
  }

  function makeRmaSummary(rows, getter) {
    const map = new Map();

    rows.forEach((row) => {
      const name = cleanText(getter(row)) || "Unknown";
      const key = normalizeKey(name);

      if (!map.has(key)) {
        map.set(key, {
          name,
          value: 0,
        });
      }

      map.get(key).value += 1;
    });

    return Array.from(map.values()).sort(
      (a, b) => Number(b.value || 0) - Number(a.value || 0)
    );
  }

  function buildRmaAnalytics(rows = []) {
    return {
      totalRma: rows.length,
      uniqueTickets: new Set(
        rows.map((row) => cleanText(row.ticketNumber)).filter(Boolean)
      ).size,
      byRegion: makeRmaSummary(rows, (row) => row.region),
      byTse: makeRmaSummary(rows, (row) => row.tse),
      byRmaType: makeRmaSummary(rows, (row) => row.rmaType),
      byDate: makeRmaSummary(rows, (row) => row.date).sort((a, b) =>
        String(a.name).localeCompare(String(b.name))
      ),
      byMonth: makeRmaSummary(rows, (row) =>
        row.date ? String(row.date).slice(0, 7) : "Unknown"
      ).sort((a, b) => String(a.name).localeCompare(String(b.name))),
      byProduct: makeRmaSummary(rows, (row) => row.product1 || row.product2),
    };
  }

  function safeExcelFilename(value) {
    return cleanText(value)
      .replace(/[\\/:*?"<>|]/g, "-")
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
      window.alert("No records to export.");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(rows.map(mapRow));

    if (columnWidths.length) {
      worksheet["!cols"] = columnWidths.map((width) => ({
        wch: width,
      }));
    }

    worksheet["!autofilter"] = {
      ref: worksheet["!ref"] || "A1:A1",
    };

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    XLSX.writeFile(workbook, `${safeExcelFilename(filename)}.xlsx`);
  }

  function exportTicketExcel({
    rows,
    tableMode = "all",
  }) {
    exportRowsToExcel({
      rows,
      filename: `angelbird-all-uploaded-data-ticket-${tableMode}-report`,
      sheetName: "Ticket Report",
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
        Region: row.region || "",
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
      columnWidths: [15, 14, 12, 22, 34, 24, 24, 22, 70],
    });
  }

  function exportSatisfactionExcel({ rows }) {
    exportRowsToExcel({
      rows,
      filename: "angelbird-all-uploaded-data-satisfaction-report",
      sheetName: "Satisfaction Report",
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
        Rating: row.rating || "",
        "Solved Status":
          row.solvedStatus ||
          row.solved_status ||
          row.status ||
          (row.is_solved ? "Solved" : "Not Solved"),
        Comment:
          row.comment ||
          row.comments ||
          row.feedback ||
          "",
      }),
      columnWidths: [15, 15, 16, 20, 80],
    });
  }

  function exportRmaExcel({ rows }) {
    exportRowsToExcel({
      rows,
      filename: "angelbird-rma-report",
      sheetName: "RMA Report",
      mapRow: (row) => ({
        TSE: row.tse || "",
        "Ticket Number": row.ticketNumber || "",
        Region: row.region || "",
        Date: row.date || "",
        "Product 1": row.product1 || "",
        "Product 2": row.product2 || "",
        "Ticket Subject": row.ticketSubject || "",
        "RMA Type": row.rmaType || "",
      }),
      columnWidths: [22, 16, 12, 15, 34, 34, 70, 24],
    });
  }

  const TICKET_TABLE_TABS = [
    { key: "all", label: "All Tickets" },
    { key: "region", label: "Region Wise" },
    { key: "tse", label: "TSE / Agent Wise" },
    { key: "support", label: "Support Category" },
    { key: "productCategory", label: "Product Category" },
    { key: "product", label: "Product Wise" },
    { key: "procedure", label: "Procedure Wise" },
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
            Loading reports...
          </p>
        </div>
      </div>
    );
  }

  function EmptyDataState() {
    return (
      <section className="flex min-h-[320px] items-center justify-center rounded-[28px] border border-slate-200 bg-white p-8 text-center">
        <div>
          <FileSpreadsheet
            size={38}
            className="mx-auto text-slate-300"
          />

          <h2 className="mt-5 text-2xl font-extrabold text-slate-950">
            No uploaded data available
          </h2>

          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
            Upload ticket or satisfaction CSV data from Home first.
          </p>
        </div>
      </section>
    );
  }

  function TicketTabbedTable({
    tickets = [],
    title,
  }) {
    const [activeTab, setActiveTab] = useState("all");
    const [selectedValue, setSelectedValue] = useState("");

    const tabConfig = {
      all: {
        label: "All Tickets",
        keys: [],
      },
      region: {
        label: "Region",
        keys: ["region", "Region"],
      },
      tse: {
        label: "TSE / Agent",
        keys: ["tse", "TSE", "agent", "engineer"],
      },
      support: {
        label: "Support Category",
        keys: ["supportCategory", "support_category", "category"],
      },
      productCategory: {
        label: "Product Category",
        keys: ["productCategory", "product_category"],
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
        keys: ["procedure", "Procedure"],
      },
    };

    const currentConfig = tabConfig[activeTab] || tabConfig.all;

    const filterOptions = useMemo(() => {
      if (activeTab === "all") {
        return [];
      }

      const map = new Map();

      tickets.forEach((ticket) => {
        const value = getTicketValue(ticket, currentConfig.keys);

        if (value && value !== "Unknown") {
          const key = normalizeKey(value);

          if (!map.has(key)) {
            map.set(key, value);
          }
        }
      });

      return Array.from(map.values()).sort((a, b) =>
        String(a).localeCompare(String(b))
      );
    }, [tickets, activeTab, currentConfig.keys]);

    const visibleTickets = useMemo(() => {
      if (activeTab === "all" || !selectedValue) {
        return tickets;
      }

      return tickets.filter((ticket) => {
        const value = getTicketValue(ticket, currentConfig.keys);

        return normalizeKey(value) === normalizeKey(selectedValue);
      });
    }, [tickets, activeTab, selectedValue, currentConfig.keys]);

    function changeTab(tabKey) {
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
                Select a category tab and filter the actual ticket records.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                exportTicketExcel({
                  rows: visibleTickets,
                  tableMode: activeTab,
                })
              }
              className="no-print no-export inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 text-sm font-black text-white shadow-sm transition hover:bg-sky-700"
            >
              <Sheet size={18} />
              Export Excel
            </button>
          </div>

          <div className="no-print no-export mt-5 flex flex-wrap gap-2">
            {TICKET_TABLE_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => changeTab(tab.key)}
                className={[
                  "rounded-full px-4 py-2.5 text-xs font-black transition",
                  activeTab === tab.key
                    ? "text-slate-950 shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-950",
                ].join(" ")}
                style={
                  activeTab === tab.key
                    ? {
                        background: "var(--accent-color)",
                      }
                    : undefined
                }
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab !== "all" ? (
            <div className="no-print no-export mt-5 max-w-xl rounded-[22px] border border-slate-200 bg-slate-50 p-4">
              <label className="angel-label">
                Filter by {currentConfig.label}
              </label>

              <select
                className="angel-input h-12 bg-white"
                value={selectedValue}
                onChange={(event) => setSelectedValue(event.target.value)}
              >
                <option value="">
                  All {currentConfig.label}
                </option>

                {filterOptions.map((item) => (
                  <option
                    key={normalizeKey(item)}
                    value={item}
                  >
                    {item}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div className="mt-5 inline-flex rounded-full bg-slate-100 px-4 py-2 text-xs font-black text-slate-600">
            Showing {visibleTickets.length.toLocaleString()} ticket records
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Ticket #</th>
                <th className="px-4 py-3">Region</th>
                <th className="px-4 py-3">TSE</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Support Category</th>
                <th className="px-4 py-3">Product Category</th>
                <th className="px-4 py-3">Procedure</th>
                <th className="px-4 py-3">Subject</th>
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

              {visibleTickets.map((ticket, index) => (
                <tr
                  key={ticket.id || index}
                  className="text-slate-700 transition hover:bg-slate-50"
                >
                  <td className="whitespace-nowrap px-4 py-3">
                    {getTicketDate(ticket) || "-"}
                  </td>

                  <td className="whitespace-nowrap px-4 py-3 font-bold text-slate-950">
                    {cleanText(
                      ticket.ticketNumber ||
                        ticket.ticket_number ||
                        ticket.ticketNo
                    ) || "-"}
                  </td>

                  <td className="px-4 py-3">
                    {cleanText(ticket.region) || "-"}
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
                    {normalizeDisplayLabel(
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
              ))}
            </tbody>
          </table>
        </div>
      </section>
    );
  }

  export default function ReportsPage() {
    const { user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();

    const normalizedRole = String(user?.role || "")
      .trim()
      .toLowerCase();

    const isReadOnlyReportUser = [
      "analyst",
      "viewer",
    ].includes(normalizedRole);

    const reportType = searchParams.get("type");

    const getValidReportType = (value) =>
      ["tickets", "satisfaction", "rma"].includes(value)
        ? value
        : "tickets";

    const [mode, setMode] = useState(() =>
      getValidReportType(reportType)
    );

    function changeReportMode(nextMode) {
      const validMode = getValidReportType(nextMode);

      setMode(validMode);
      setSearchParams({
        type: validMode,
      });
    }

    const [ticketRows, setTicketRows] = useState([]);
    const [satisfactionRows, setSatisfactionRows] = useState([]);
    const [rmaRows, setRmaRows] = useState([]);

    const [chartSettings, setChartSettings] = useState(getChartSettings());

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [ticketFilters, setTicketFilters] = useState({
      search: "",
      year: "",
      month: "",
      region: "",
      supportCategory: "",
      productCategory: "",
      procedure: "",
      dateFrom: "",
      dateTo: "",
    });

    const [satisfactionFilters, setSatisfactionFilters] = useState({
      search: "",
      year: "",
      month: "",
      rating: "",
      solvedStatus: "",
      dateFrom: "",
      dateTo: "",
    });

    const [rmaFilters, setRmaFilters] = useState({
      search: "",
      year: "",
      month: "",
      region: "",
      rmaType: "",
      dateFrom: "",
      dateTo: "",
    });

    useEffect(() => {
      const validMode = getValidReportType(reportType);

      if (validMode !== mode) {
        setMode(validMode);
      }
    }, [
      reportType,
      mode,
    ]);

    useEffect(() => {
      const controller = new AbortController();

      loadReports({
        signal: controller.signal,
      });

      return () => {
        controller.abort();
      };
    }, []);

    async function loadReports({ signal } = {}) {
      setLoading(true);
      setError("");

      try {
        const [data, rmaData] = await Promise.all([
          fetchReportsData({
            signal,
          }),
          fetchUploadedRmaReports({
            signal,
          }).catch(() => null),
        ]);

        setTicketRows(data?.tickets || []);
        setSatisfactionRows(data?.satisfaction || []);
        setRmaRows(rmaData?.rows || []);
        setChartSettings(getChartSettings());

        resetFilters();
      } catch (loadError) {
        if (loadError.name === "AbortError") {
          return;
        }

        setError(loadError.message || "Unable to load report data.");
      } finally {
        setLoading(false);
      }
    }

    function resetFilters() {
      setTicketFilters({
        search: "",
        year: "",
        month: "",
        region: "",
        supportCategory: "",
        productCategory: "",
        procedure: "",
        dateFrom: "",
        dateTo: "",
      });

      setSatisfactionFilters({
        search: "",
        year: "",
        month: "",
        rating: "",
        solvedStatus: "",
        dateFrom: "",
        dateTo: "",
      });

      setRmaFilters({
        search: "",
        year: "",
        month: "",
        region: "",
        rmaType: "",
        dateFrom: "",
        dateTo: "",
      });
    }

    const filteredTickets = useMemo(() => {
      return ticketRows.filter((ticket) => {
        const search = normalizeKey(ticketFilters.search);

        const searchable = [
          ticket.ticketNumber,
          ticket.ticket_number,
          ticket.ticketNo,
          ticket.product,
          ticket.productName,
          ticket.product_name,
          ticket.product1,
          ticket.product_1,
          ticket.product_2,
          ticket.ticketSubject,
          ticket.ticket_subject,
          ticket.subject,
          ticket.procedure,
          ticket.tse,
          ticket.region,
        ]
          .map(normalizeKey)
          .join(" ");

        if (search && !searchable.includes(search)) return false;

        const ticketDate = getTicketDate(ticket);
        const ticketYear = ticketDate.slice(0, 4);
        const ticketMonth = ticketDate.slice(5, 7);

        if (ticketFilters.year && ticketYear !== ticketFilters.year) return false;
        if (ticketFilters.month && ticketMonth !== ticketFilters.month) return false;

        if (
          ticketFilters.region &&
          normalizeKey(ticket.region) !== normalizeKey(ticketFilters.region)
        ) {
          return false;
        }

        if (
          ticketFilters.supportCategory &&
          normalizeKey(
            ticket.supportCategory ||
              ticket.support_category ||
              ticket.category
          ) !== normalizeKey(ticketFilters.supportCategory)
        ) {
          return false;
        }

        if (
          ticketFilters.productCategory &&
          normalizeKey(
            ticket.productCategory ||
              ticket.product_category
          ) !== normalizeKey(ticketFilters.productCategory)
        ) {
          return false;
        }

        if (
          ticketFilters.procedure &&
          normalizeProcedure(ticket.procedure || ticket.Procedure) !==
            normalizeProcedure(ticketFilters.procedure)
        ) {
          return false;
        }

        if (ticketFilters.dateFrom && ticketDate < ticketFilters.dateFrom) return false;
        if (ticketFilters.dateTo && ticketDate > ticketFilters.dateTo) return false;

        return true;
      });
    }, [ticketRows, ticketFilters]);

    const filteredSatisfaction = useMemo(() => {
      return satisfactionRows.filter((row) => {
        const search = normalizeKey(satisfactionFilters.search);

        const searchable = [
          row.ticketNumber,
          row.ticket_number,
          row.ticketId,
          row.ticket_id,
          row.comment,
          row.comments,
          row.feedback,
          row.reason,
          row.rating,
        ]
          .map(normalizeKey)
          .join(" ");

        if (search && !searchable.includes(search)) return false;

        const rowDate = getSatisfactionDate(row);
        const rowYear = rowDate.slice(0, 4);
        const rowMonth = rowDate.slice(5, 7);

        if (satisfactionFilters.year && rowYear !== satisfactionFilters.year) return false;
        if (satisfactionFilters.month && rowMonth !== satisfactionFilters.month) return false;

        if (
          satisfactionFilters.rating &&
          normalizeKey(row.rating) !== normalizeKey(satisfactionFilters.rating)
        ) {
          return false;
        }

        const solved =
          row.is_solved === true ||
          normalizeKey(row.solvedStatus || row.solved_status || row.status) ===
            "solved";

        if (satisfactionFilters.solvedStatus === "solved" && !solved) return false;
        if (satisfactionFilters.solvedStatus === "not_solved" && solved) return false;

        if (satisfactionFilters.dateFrom && rowDate < satisfactionFilters.dateFrom) return false;
        if (satisfactionFilters.dateTo && rowDate > satisfactionFilters.dateTo) return false;

        return true;
      });
    }, [satisfactionRows, satisfactionFilters]);

    const filteredRma = useMemo(() => {
      return rmaRows.filter((row) => {
        const search = normalizeKey(rmaFilters.search);

        const searchable = [
          row.tse,
          row.ticketNumber,
          row.region,
          row.product1,
          row.product2,
          row.ticketSubject,
          row.rmaType,
        ]
          .map(normalizeKey)
          .join(" ");

        if (search && !searchable.includes(search)) return false;

        const rowDate = normalizeDate(row.date);
        const rowYear = rowDate.slice(0, 4);
        const rowMonth = rowDate.slice(5, 7);

        if (rmaFilters.year && rowYear !== rmaFilters.year) return false;
        if (rmaFilters.month && rowMonth !== rmaFilters.month) return false;

        if (
          rmaFilters.region &&
          normalizeKey(row.region) !== normalizeKey(rmaFilters.region)
        ) {
          return false;
        }

        if (
          rmaFilters.rmaType &&
          normalizeKey(row.rmaType) !== normalizeKey(rmaFilters.rmaType)
        ) {
          return false;
        }

        if (rmaFilters.dateFrom && rowDate < rmaFilters.dateFrom) return false;
        if (rmaFilters.dateTo && rowDate > rmaFilters.dateTo) return false;

        return true;
      });
    }, [rmaRows, rmaFilters]);

    const ticketAnalytics = useMemo(
      () => buildTicketAnalytics(filteredTickets),
      [filteredTickets]
    );

    const ticketChartData = useMemo(
      () => makeTicketChartData(filteredTickets),
      [filteredTickets]
    );

    const satisfactionAnalytics = useMemo(
      () => buildSatisfactionAnalytics(filteredSatisfaction),
      [filteredSatisfaction]
    );

    const rmaAnalytics = useMemo(
      () => buildRmaAnalytics(filteredRma),
      [filteredRma]
    );

    const currentModeLabel =
      mode === "tickets"
        ? "Ticket Report"
        : mode === "satisfaction"
        ? "Satisfaction Report"
        : "RMA Report";

    const exportTitle = `Angelbird All Uploaded Data ${currentModeLabel}`;

    function handleExcelExport() {
      if (mode === "tickets") {
        exportTicketExcel({
          rows: filteredTickets,
          tableMode: "filtered",
        });

        return;
      }

      if (mode === "satisfaction") {
        exportSatisfactionExcel({
          rows: filteredSatisfaction,
        });

        return;
      }

      exportRmaExcel({
        rows: filteredRma,
      });
    }

    const hasAnyData =
      ticketRows.length > 0 ||
      satisfactionRows.length > 0 ||
      rmaRows.length > 0;

    return (
      <div className="space-y-8 bg-white">
        <section
          id="reports-export-header"
          className="relative overflow-hidden rounded-[38px] border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-slate-100 p-8 shadow-soft md:p-10"
        >
          <div className="pointer-events-none absolute inset-0 angel-grid-bg opacity-40" />

          <div
            className="pointer-events-none absolute -right-28 -top-32 h-80 w-80 rounded-full opacity-80 blur-3xl"
            style={{
              background: "var(--accent-color)",
            }}
          />

          <div className="pointer-events-none absolute -bottom-40 left-[30%] h-72 w-72 rounded-full bg-sky-100/70 blur-3xl" />

          <div className="relative grid gap-8 xl:grid-cols-[1fr_0.72fr] xl:items-center">
            <div className="min-w-0">
              <div className="inline-flex items-center rounded-full border border-slate-200 bg-white/90 px-4 py-2 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">
                  Data From Zendesk
                </p>
              </div>

              <h1 className="mt-5 max-w-3xl text-4xl font-black leading-none tracking-[-0.06em] text-slate-950 md:text-6xl">
                Analytics
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-6 text-slate-600">
                Reports read latest ticket, satisfaction, and RMA records from Zendesk.
              </p>
            </div>

            <div className="flex min-w-0 flex-col items-center justify-center rounded-[30px] border border-slate-200 bg-white/80 p-6 text-center shadow-sm backdrop-blur-xl xl:items-end xl:text-right">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
                Presented By
              </p>

              <div className="mt-5 flex h-[72px] w-full max-w-[330px] items-center justify-center xl:justify-end">
                <img
                  src="/mahi.logo.png"
                  alt="Mahimedia Solutions"
                  className="max-h-[58px] max-w-full object-contain"
                />
              </div>

              <p className="mt-3 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                {mode === "tickets"
                  ? "Ticket Analytics"
                  : mode === "satisfaction"
                  ? "Satisfaction Analytics"
                  : "RMA Analytics"}
              </p>
            </div>
          </div>
        </section>

        <section className="no-print no-export rounded-[28px] border border-slate-200 bg-white p-4 shadow-soft">
          <div
            className={[
              "flex flex-col gap-4 xl:flex-row xl:items-end",
              isReadOnlyReportUser
                ? "xl:justify-end"
                : "xl:justify-between",
            ].join(" ")}
          >
            {!isReadOnlyReportUser ? (
              <div className="flex flex-wrap gap-2">
              <ReportModeButton
                active={mode === "tickets"}
                icon={FileSpreadsheet}
                onClick={() => changeReportMode("tickets")}
              >
                Ticket Report
              </ReportModeButton>

              <ReportModeButton
                active={mode === "satisfaction"}
                icon={SmilePlus}
                onClick={() => changeReportMode("satisfaction")}
              >
                Satisfaction Report
              </ReportModeButton>

              <ReportModeButton
                active={mode === "rma"}
                icon={ClipboardList}
                onClick={() => changeReportMode("rma")}
              >
                RMA Report
              </ReportModeButton>
            </div>
            ) : null}

            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-end xl:w-auto">
              <button
                type="button"
                onClick={() => loadReports()}
                disabled={loading}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <RefreshCw size={17} />
                )}

                Refresh
              </button>

              <button
                type="button"
                onClick={handleExcelExport}
                disabled={loading}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 text-sm font-black text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Sheet size={18} />
                Export Excel
              </button>

              <ExportActions
                targetId="reports-export-area"
                title={exportTitle}
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
        ) : !hasAnyData ? (
          <EmptyDataState />
        ) : (
          <div
            id="reports-export-area"
            className="space-y-8 rounded-[28px] bg-white p-1"
          >
            {mode === "tickets" ? (
              <>
                <div className="no-print no-export">
                  <TicketFilters
                    tickets={ticketRows}
                    filters={ticketFilters}
                    onChange={setTicketFilters}
                  />
                </div>

                <TicketKpiCards analytics={ticketAnalytics} />

                <section className="grid gap-6 xl:grid-cols-2">
                  <ChartPanel
                    chartId="ticket_by_region"
                    title="Ticket by Region"
                    data={ticketChartData.region}
                    type="pie"
                  />

                  <ChartPanel
                    chartId="ticket_by_tse"
                    title="Ticket by TSE"
                    data={ticketChartData.tse}
                    type="pie"
                  />

                  <ChartPanel
                    className="xl:col-span-2"
                    chartId="date_wise_ticket"
                    title="Date Wise Ticket"
                    data={ticketChartData.date}
                    type="line"
                  />

                  <ChartPanel
                    chartId="ticket_support_category"
                    title="Ticket Support Category"
                    data={ticketChartData.supportCategory}
                    type="bar"
                  />

                  <ChartPanel
                    chartId="ticket_product_category"
                    title="Ticket Product Category"
                    data={ticketChartData.productCategory}
                    type="line"
                  />

                  <ChartPanel
                    className="xl:col-span-2"
                    chartId="ticket_procedure"
                    title="Ticket Procedure"
                    data={ticketChartData.procedure}
                    type="bar"
                  />

                  <ChartPanel
                    className="xl:col-span-2"
                    chartId="top_product_by_ticket_count"
                    title="Top Product by Ticket Count"
                    data={ticketChartData.product}
                    type="bar"
                  />
                </section>

                <TicketTabbedTable
                  title="Ticket Report Data — All Uploaded Data"
                  tickets={filteredTickets}
                />
              </>
            ) : mode === "satisfaction" ? (
              <>
                <div className="no-print no-export">
                  <SatisfactionFilters
                    rows={satisfactionRows}
                    filters={satisfactionFilters}
                    onChange={setSatisfactionFilters}
                  />
                </div>

            

                <SatisfactionKpiCards analytics={satisfactionAnalytics} />

                <SatisfactionAnalyticsPanel
                  analytics={satisfactionAnalytics}
                  chartSettings={chartSettings}
                  prefix="report"
                  showTables={false}
                />

                <SatisfactionReportTable
                  title="Customer Satisfaction Report Data — All Uploaded Data"
                  rows={filteredSatisfaction}
                />
              </>
            ) : (
              <>
                <div className="no-print no-export">
                  <RmaFilters
                    rows={rmaRows}
                    filters={rmaFilters}
                    onChange={setRmaFilters}
                  />
                </div>

              

                <RmaKpiCards analytics={rmaAnalytics} />

                <RmaAnalyticsPanel
                  analytics={rmaAnalytics}
                  prefix="uploaded"
                />

                <RmaReportTable
                  title="RMA Report Data — Uploaded Ticket CSV"
                  rows={filteredRma}
                />
              </>
            )}
          </div>
        )}
      </div>
    );
  }