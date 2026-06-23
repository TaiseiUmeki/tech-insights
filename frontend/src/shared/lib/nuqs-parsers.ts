'use client';

import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from 'nuqs';

// Pagination
export const pageParser = parseAsInteger.withDefault(1);
export const pageSizeParser = parseAsInteger.withDefault(10);

// Sort
export const sortByParser = parseAsString.withDefault('created_at');
export const sortOrderParser = parseAsStringEnum([
  'asc',
  'desc',
] as const).withDefault('desc');

// Search
export const searchParser = parseAsString.withDefault('');

// Fixed filter (multi-value support)
export const fixedFilterParser = parseAsArrayOf(parseAsString);

// Attribute filters (JSON string)
export const attributeFiltersParser = parseAsString;
