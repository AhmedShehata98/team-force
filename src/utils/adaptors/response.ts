import { RESPONSE_ERROR } from "../../types/response";

export const responseAdapter = <T>({
  data = [],
  error = null,
  isError = false,
  errorDetails = null,
}: {
  data: T | [];
  error?: RESPONSE_ERROR | string | null;
  isError?: boolean;
  errorDetails?: string | null;
}) => ({
  data,
  error,
  isError,
  errorDetails,
});
