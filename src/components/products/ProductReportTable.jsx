import { ArrowDownToLine } from "lucide-react";

function convertToCsv(rows) {
  if (!rows.length) return "";

  const headers = ["Product Name", "Category", "SKU", "EAN", "UPC"];

  const body = rows.map((row) =>
    [
      row.product_name,
      row.category,
      row.sku,
      row.ean,
      row.upc,
    ]
      .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
      .join(",")
  );

  return [headers.join(","), ...body].join("\n");
}

export default function ProductReportTable({
  title = "Angelbird Product Master",
  products = [],
}) {
  function exportCsv() {
    const csv = convertToCsv(products);

    if (!csv) {
      alert("No products to export.");
      return;
    }

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "angelbird-product-master-report.csv";
    link.click();

    URL.revokeObjectURL(url);
  }

  return (
    <div className="angel-card overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-slate-200 p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-xl font-black tracking-[-0.03em] text-slate-900">
            {title}
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Showing {products.length} product master records.
          </p>
        </div>

        <button onClick={exportCsv} className="angel-btn angel-btn-dark gap-2">
          <ArrowDownToLine size={18} />
          Export Product Master CSV
        </button>
      </div>

      <div className="overflow-auto">
        <table className="min-w-[1000px] w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-[0.15em] text-slate-500">
            <tr>
              <th className="px-5 py-4 font-black">Product Name</th>
              <th className="px-5 py-4 font-black">Category</th>
              <th className="px-5 py-4 font-black">SKU</th>
              <th className="px-5 py-4 font-black">EAN</th>
              <th className="px-5 py-4 font-black">UPC</th>
            </tr>
          </thead>

          <tbody>
            {products.length ? (
              products.map((product, index) => (
                <tr
                  key={`${product.sku || product.product_name}-${index}`}
                  className="border-t border-slate-100"
                >
                  <td className="px-5 py-4 font-black text-slate-800">
                    {product.product_name || "-"}
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className="rounded-full px-3 py-1 text-xs font-black text-slate-900"
                      style={{ background: "var(--accent-color)" }}
                    >
                      {product.category || "Current Deals"}
                    </span>
                  </td>

                  <td className="px-5 py-4 font-black text-slate-700">
                    {product.sku || "-"}
                  </td>

                  <td className="px-5 py-4 text-slate-600">
                    {product.ean || "-"}
                  </td>

                  <td className="px-5 py-4 text-slate-600">
                    {product.upc || "-"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="px-5 py-10 text-center text-slate-500">
                  No product master records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}