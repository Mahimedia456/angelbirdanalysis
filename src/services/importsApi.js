import {
  apiRequest,
} from "./apiClient";

export async function importMonthlyDataset({
  datasetType,
  file,
  rows,
  columnMapping = {},
}) {
  const formData = new FormData();

  formData.append(
    "datasetType",
    datasetType
  );

  formData.append(
    "rows",
    JSON.stringify(rows || [])
  );

  formData.append(
    "columnMapping",
    JSON.stringify(columnMapping || {})
  );

  if (file) {
    formData.append(
      "file",
      file
    );
  }

  const response = await apiRequest(
    "/imports/monthly",
    {
      method: "POST",
      body: formData,
    }
  );

  return response.data;
}