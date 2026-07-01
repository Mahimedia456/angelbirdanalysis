import { Download, FileCheck2 } from "lucide-react";

const templateRows = [
  {
    "Product Name": "AV PRO SD V30 256 GB",
    Category: "Cards",
    SKU: "AVP256SDV30",
    EAN: "9120000000000",
    UPC: "813000000000",
  },
  {
    "Product Name": "AtomX SSDmini 1 TB",
    Category: "SSD",
    SKU: "ATOMXMINI1000PK",
    EAN: "9120000000000",
    UPC: "813000000000",
  },
  {
    "Product Name": "CFexpress B Card Reader PKT",
    Category: "Card readers",
    SKU: "CFXBCRPKT",
    EAN: "9120000000000",
    UPC: "813000000000",
  },
  {
    "Product Name": "USB-C 4.0 Solid Flex Cable Lime 1 m",
    Category: "USB Cables",
    SKU: "UC4SFL100",
    EAN: "9120000000000",
    UPC: "813000000000",
  },
];

function convertToCsv(rows) {
  const headers = Object.keys(rows[0]);

  const body = rows.map((row) =>
    headers
      .map((header) => {
        const value = String(row[header] ?? "");
        return `"${value.replace(/"/g, '""')}"`;
      })
      .join(",")
  );

  return [headers.join(","), ...body].join("\n");
}

export default function ProductTemplateDownload() {
  function downloadTemplate() {
    const csv = convertToCsv(templateRows);

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "angelbird-product-master-template.csv";
    link.click();

    URL.revokeObjectURL(url);
  }

  return (
    <section className="angel-card overflow-hidden">
      <div className="flex flex-col gap-6 p-6 lg:flex-row lg:items-center lg:justify-between lg:p-7">
        <div className="flex min-w-0 items-start gap-4">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-slate-950"
            style={{ background: "var(--accent-color)" }}
          >
            <FileCheck2 size={24} />
          </div>

          <div className="min-w-0">
            <p className="angel-mini-label">
              Product Master Template
            </p>

            <h3 className="mt-2 break-words text-2xl font-black leading-tight tracking-[-0.04em] text-slate-950">
              Download the approved product master CSV structure.
            </h3>

            <p className="mt-3 max-w-3xl break-words text-sm leading-6 text-slate-500">
              Required reporting fields are Product Name, Category, SKU, EAN
              and UPC. Use the template to reduce mapping errors.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={downloadTemplate}
          className="angel-btn angel-btn-dark w-full shrink-0 gap-2 sm:w-auto"
        >
          <Download size={18} />
          Download Template
        </button>
      </div>
    </section>
  );
}