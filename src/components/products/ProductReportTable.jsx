import { ArrowDownToLine } from "lucide-react";

function convertToCsv(rows) {
  if (!rows.length) return "";

  const headers = [
    "Product Name",
    "Category",
    "SKU",
    "EAN",
    "UPC",
  ];

  const body = rows.map((row) =>
    [
      row.product_name,
      row.category,
      row.sku,
      row.ean,
      row.upc,
    ]
      .map(
        (value) =>
          `"${String(value ?? "").replace(/"/g, '""')}"`
      )
      .join(",")
  );

  return [headers.join(","), ...body].join("\n");
}

export default function ProductReportTable({
  title = "Angelbird Product Master",
  products = [],
  preview = false,
}) {
  function exportCsv() {
    const csv = convertToCsv(products);

    if (!csv) {
      alert("No products to export.");
      return;
    }

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "angelbird-product-master-report.csv";
    link.click();

    URL.revokeObjectURL(url);
  }

  return (
    <section className="angel-card overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="angel-mini-label">
            {preview ? "Mapped Preview" : "Product Data"}
          </p>

          <h3 className="mt-2 break-words text-xl font-black tracking-[-0.03em] text-slate-950">
            {title}
          </h3>

          <p className="mt-2 break-words text-sm leading-6 text-slate-500">
            Showing {products.length} product master records.
          </p>
        </div>

        {!preview ? (
          <button
            type="button"
            onClick={exportCsv}
            className="angel-btn angel-btn-dark w-full shrink-0 gap-2 sm:w-auto"
          >
            <ArrowDownToLine size={18} />
            Export Product CSV
          </button>
        ) : null}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] border-collapse text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-[0.14em] text-slate-500">
            <tr>
              <th className="min-w-[260px] px-5 py-4 font-black">
                Product Name
              </th>
              <th className="min-w-[170px] px-5 py-4 font-black">
                Category
              </th>
              <th className="min-w-[190px] px-5 py-4 font-black">
                SKU
              </th>
              <th className="min-w-[180px] px-5 py-4 font-black">
                EAN
              </th>
              <th className="min-w-[180px] px-5 py-4 font-black">
                UPC
              </th>
            </tr>
          </thead>

          <tbody>
            {products.length ? (
              products.map((product, index) => (
                <tr
                  key={`${product.sku || product.product_name}-${index}`}
                  className="border-t border-slate-100 align-top transition hover:bg-slate-50/70"
                >
                  <td className="px-5 py-4 font-black text-slate-800">
                    <span className="block whitespace-normal break-words">
                      {product.product_name || "-"}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className="inline-flex max-w-[220px] whitespace-normal break-words rounded-full px-3 py-1.5 text-xs font-black text-slate-950"
                      style={{ background: "var(--accent-color)" }}
                    >
                      {product.category || "Uncategorized"}
                    </span>
                  </td>

                  <td className="px-5 py-4 font-black text-slate-700">
                    <span className="block whitespace-normal break-all">
                      {product.sku || "-"}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-slate-600">
                    <span className="block break-all">
                      {product.ean || "-"}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-slate-600">
                    <span className="block break-all">
                      {product.upc || "-"}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={5}
                  className="px-5 py-12 text-center text-sm font-bold text-slate-400"
                >
                  No product master records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}