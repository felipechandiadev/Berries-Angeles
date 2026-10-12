/**
 * Shared helpers for DataGrid server-side search / column filters / sort.
 * Canonical URL keys: search, filters, filtration, sort, sortField, page, limit.
 */

import type { ObjectLiteral, SelectQueryBuilder, WhereExpressionBuilder } from 'typeorm';
import { Brackets } from 'typeorm';

export type GridSortOrder = 'ASC' | 'DESC';

export interface GridQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  filtration?: boolean;
  filters?: string;
  sortField?: string;
  sort?: string;
}

export interface ColumnFilter {
  column: string;
  value: string;
}

/** Normalize free text for accent-insensitive matching (JS side). */
export function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ñ/g, 'n')
    .replace(/ü/g, 'u');
}

/**
 * Wrap a SQL expression so LOWER + accent folding matches `normalizeString`.
 * `expression` must be a trusted column/expression (never user input).
 */
export function normalizeSqlExpr(expression: string): string {
  return `REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(LOWER(COALESCE(${expression}, '')), 'á', 'a'), 'é', 'e'), 'í', 'i'), 'ó', 'o'), 'ú', 'u'), 'ñ', 'n'), 'ü', 'u')`;
}

/**
 * Parse URL column filters: "column1-value1,column2-value2".
 * Values may contain `-` (everything after the first dash).
 */
export function parseColumnFilters(
  filtersString: string | undefined | null,
  allowlist: readonly string[],
): ColumnFilter[] {
  if (!filtersString?.trim()) return [];
  const allowed = new Set(allowlist);
  return filtersString
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.includes('-'))
    .map((part) => {
      const dashIndex = part.indexOf('-');
      return {
        column: part.substring(0, dashIndex).trim(),
        value: decodeURIComponent(part.substring(dashIndex + 1).trim()),
      };
    })
    .filter((item) => item.column && item.value && allowed.has(item.column));
}

export function resolveSortOrder(raw?: string | null, fallback: GridSortOrder = 'DESC'): GridSortOrder {
  const upper = (raw || fallback).toString().toUpperCase();
  return upper === 'ASC' ? 'ASC' : 'DESC';
}

export function resolveSortField(
  raw: string | undefined | null,
  allowlist: readonly string[],
  fallback: string,
): string {
  if (raw && allowlist.includes(raw)) return raw;
  return fallback;
}

export function resolvePage(raw?: number, fallback = 1): number {
  return Math.max(1, Math.floor(raw || fallback));
}

export function resolveLimit(raw?: number, fallback = 25, max = 100): number {
  return Math.min(max, Math.max(5, Math.floor(raw || fallback)));
}

type QbLike = SelectQueryBuilder<ObjectLiteral> | WhereExpressionBuilder;

/**
 * Apply OR text search across trusted SQL expressions (already normalized via normalizeSqlExpr if needed).
 */
export function applyTextSearch(
  qb: QbLike,
  options: {
    columns: string[];
    search: string;
    paramName?: string;
    /** If true, wrap each column with normalizeSqlExpr. Default true. */
    normalizeColumns?: boolean;
  },
): void {
  const term = normalizeString(options.search.trim());
  if (!term || options.columns.length === 0) return;

  const paramName = options.paramName || 'gridSearch';
  const normalizeCols = options.normalizeColumns !== false;
  const like = `%${term}%`;

  qb.andWhere(
    new Brackets((sub) => {
      options.columns.forEach((column, index) => {
        const expr = normalizeCols ? normalizeSqlExpr(column) : column;
        const clause = `${expr} LIKE :${paramName}`;
        if (index === 0) {
          sub.where(clause, { [paramName]: like });
        } else {
          sub.orWhere(clause, { [paramName]: like });
        }
      });
    }),
  );
}

/** Build nav search string preserving canonical keys. */
export function buildGridNavSearch(params: {
  page: number;
  limit: number;
  search?: string;
  filtration?: boolean;
  filters?: string;
  sortField?: string;
  sort?: string;
  extra?: Record<string, string | undefined>;
}): string {
  const nav = new URLSearchParams();
  nav.set('page', String(params.page));
  nav.set('limit', String(params.limit));
  if (params.search) nav.set('search', params.search);
  if (params.filtration) nav.set('filtration', 'true');
  if (params.filters) nav.set('filters', params.filters);
  if (params.sortField) nav.set('sortField', params.sortField);
  if (params.sort) nav.set('sort', params.sort);
  if (params.extra) {
    for (const [key, value] of Object.entries(params.extra)) {
      if (value !== undefined && value !== '') nav.set(key, value);
    }
  }
  return nav.toString();
}
