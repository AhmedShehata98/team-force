import { RESPONSE_ERROR } from "../../types/response";

type Props<T> = {
  data: Array<T>;
  pagination: {
    page: number;
    remainingPages: number;
    totalPages: number;
  };
  isError?: boolean;
  error?: RESPONSE_ERROR | string | null;
  errorDetails?: string | null;
};

export const paginatedResponseAdapter = <T>({
  data,
  pagination,
  isError = false,
  error = null,
  errorDetails = null,
}: Props<T>) => ({
  data,
  pagination,
  isError,
  error,
  errorDetails,
});
