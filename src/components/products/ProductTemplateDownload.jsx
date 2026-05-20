import { Download } from "lucide-react";

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
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "angelbird-product-master-template.csv";
    link.click();

    URL.revokeObjectURL(url);
  }

  return (
    <div className="angel-card p-6">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="angel-mini-label">Product Master Template</p>

          <h3 className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-900">
            Download the correct Angelbird product CSV format.
          </h3>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Final columns: Product Name, Category, SKU, EAN, UPC.
          </p>
        </div>

        <button onClick={downloadTemplate} className="angel-btn angel-btn-dark gap-2">
          <Download size={18} />
          Download Template
        </button>
      </div>
    </div>
  );
}