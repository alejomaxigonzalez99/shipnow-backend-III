const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

const parsePagination = (query = {}) => {
  const parse = (value, fallback) => {
    if (value === undefined) return fallback;
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
  };
  return {
    page: parse(query.page, DEFAULT_PAGE),
    limit: Math.min(parse(query.limit, DEFAULT_LIMIT), MAX_LIMIT),
  };
};
module.exports = { parsePagination, DEFAULT_PAGE, DEFAULT_LIMIT, MAX_LIMIT };
