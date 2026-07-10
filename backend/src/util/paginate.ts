interface PaginationResult<T> {
  data: T[];
  total: number;
  previousPage: number | null;
  nextPage: number | null;
  lastPage: number;
  currentPage: number;
}

export const paginate = <T>(
  data: T[],
  totalCount: number,
  currentPage: number,
  pageSize: number
): PaginationResult<T> => {
  const lastPage = Math.ceil(totalCount / pageSize);
  const previousPage = currentPage > 1 ? currentPage - 1 : null;
  const nextPage = currentPage < lastPage ? currentPage + 1 : null;

  return {
    data,
    total: totalCount,
    previousPage,
    nextPage,
    lastPage,
    currentPage,
  };
};
