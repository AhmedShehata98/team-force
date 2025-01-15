export const resultPagination = ({
  limit,
  page,
}: {
  limit: number;
  page: number;
}) => {
  const skip = (page - 1) * limit;
  return { skip, take: limit };
};

export const calcTotalPages = (total: number, limit: number) =>
  Math.ceil(total / limit);

export const calcRemainingPages = (totalPages: number, currentPage: number) =>
  currentPage - totalPages;
