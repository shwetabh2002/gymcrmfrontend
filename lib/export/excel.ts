export async function downloadExcelRows(
  rows: Record<string, unknown>[],
  sheetName: string,
  filename: string,
  columnOrder?: string[],
): Promise<void> {
  if (rows.length === 0) {
    throw new Error("No records to export for the selected filters");
  }

  const XLSX = await import("xlsx");
  const worksheet = columnOrder
    ? XLSX.utils.json_to_sheet(rows, { header: columnOrder })
    : XLSX.utils.json_to_sheet(rows);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31));
  XLSX.writeFile(workbook, filename);
}

export interface PaginatedFetchParams {
  page: number;
  limit: number;
  [key: string]: string | number | undefined;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination?: {
    totalPages?: number;
  };
}

export async function fetchAllPaginated<T>(
  fetchPage: (params: PaginatedFetchParams) => Promise<PaginatedResponse<T>>,
  baseParams: Omit<PaginatedFetchParams, "page" | "limit">,
  pageSize = 100,
): Promise<T[]> {
  const first = await fetchPage({ ...baseParams, page: 1, limit: pageSize });
  const totalPages = first.pagination?.totalPages ?? 1;
  const all = [...first.data];

  for (let page = 2; page <= totalPages; page += 1) {
    const next = await fetchPage({ ...baseParams, page, limit: pageSize });
    all.push(...next.data);
  }

  return all;
}
