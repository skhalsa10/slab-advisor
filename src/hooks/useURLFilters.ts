'use client'

import { useState, useCallback, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

/**
 * Configuration for a filter parameter
 */
interface FilterConfig<T> {
  /** URL parameter key */
  key: string
  /** Default value (won't be included in URL if current value equals default) */
  defaultValue: T
  /** Optional transform function when reading from URL */
  parse?: (value: string | null) => T
  /** Optional transform function when writing to URL */
  serialize?: (value: T) => string
}

/**
 * Result type for a single filter
 */
interface FilterResult<T> {
  value: T
  setValue: (value: T) => void
}

/**
 * Hook to manage a single URL-synced filter parameter
 *
 * @param basePath - The base path for URL updates (e.g., '/browse/pokemon')
 * @param config - Configuration for the filter parameter
 * @returns Object with current value and setter function
 *
 * @example
 * const { value: searchQuery, setValue: setSearchQuery } = useURLFilter('/browse/pokemon', {
 *   key: 'q',
 *   defaultValue: ''
 * })
 */
export function useURLFilter<T extends string>(
  basePath: string,
  config: FilterConfig<T>
): FilterResult<T> {
  const searchParams = useSearchParams()
  const router = useRouter()

  const { key, defaultValue, parse, serialize } = config

  // Parse initial value from URL
  const getInitialValue = (): T => {
    const urlValue = searchParams.get(key)
    if (parse) {
      return parse(urlValue)
    }
    return (urlValue ?? defaultValue) as T
  }

  const [value, setValueState] = useState<T>(getInitialValue)

  const setValue = useCallback((newValue: T) => {
    setValueState(newValue)

    // Update URL
    const newParams = new URLSearchParams(searchParams.toString())
    const serialized = serialize ? serialize(newValue) : String(newValue)

    if (serialized && serialized !== String(defaultValue)) {
      newParams.set(key, serialized)
    } else {
      newParams.delete(key)
    }

    const queryString = newParams.toString()
    router.replace(`${basePath}${queryString ? `?${queryString}` : ''}`, { scroll: false })
  }, [searchParams, router, basePath, key, defaultValue, serialize])

  return { value, setValue }
}

/**
 * Hook to manage multiple URL-synced filter parameters at once
 *
 * @param basePath - The base path for URL updates (e.g., '/browse/pokemon')
 * @param configs - Record of filter configurations keyed by filter name
 * @returns Object with values, setters, and utility functions
 *
 * @example
 * const { values, setters, queryString } = useURLFilters('/browse/pokemon', {
 *   series: { key: 'series', defaultValue: '' },
 *   search: { key: 'q', defaultValue: '' },
 *   sort: { key: 'sort', defaultValue: 'newest' },
 *   view: { key: 'view', defaultValue: 'grid' }
 * })
 *
 * // Access values
 * values.series, values.search, values.sort, values.view
 *
 * // Update values
 * setters.series('scarlet-violet'), setters.search('pikachu')
 *
 * // Get current query string for navigation
 * const href = `/browse/pokemon/${setId}${queryString ? `?${queryString}` : ''}`
 */
export function useURLFilters<K extends string>(
  basePath: string,
  configs: Record<K, FilterConfig<string>>
): {
  values: Record<K, string>
  setters: Record<K, (value: string) => void>
  queryString: string
  buildHref: (path: string) => string
} {
  const searchParams = useSearchParams()
  const router = useRouter()

  // Initialize state from URL params
  const getInitialValues = (): Record<K, string> => {
    const result = {} as Record<K, string>
    for (const [name, config] of Object.entries(configs) as [K, FilterConfig<string>][]) {
      const urlValue = searchParams.get(config.key)
      result[name] = config.parse
        ? config.parse(urlValue)
        : (urlValue ?? config.defaultValue)
    }
    return result
  }

  const [values, setValues] = useState<Record<K, string>>(getInitialValues)

  // Create setter function for a specific filter
  const createSetter = useCallback((name: K) => {
    return (newValue: string) => {
      setValues(prev => ({ ...prev, [name]: newValue }))

      const config = configs[name]
      const newParams = new URLSearchParams(searchParams.toString())
      const serialized = config.serialize ? config.serialize(newValue) : newValue

      if (serialized && serialized !== config.defaultValue) {
        newParams.set(config.key, serialized)
      } else {
        newParams.delete(config.key)
      }

      const queryString = newParams.toString()
      router.replace(`${basePath}${queryString ? `?${queryString}` : ''}`, { scroll: false })
    }
  }, [configs, searchParams, router, basePath])

  // Build setters object using useMemo to avoid hook-in-loop violation
  const setters = useMemo(() => {
    const result = {} as Record<K, (value: string) => void>
    for (const name of Object.keys(configs) as K[]) {
      result[name] = createSetter(name)
    }
    return result
  }, [configs, createSetter])

  // Current query string (for passing to child navigation)
  const queryString = searchParams.toString()

  // Helper to build href with current params
  const buildHref = useCallback((path: string): string => {
    return `${path}${queryString ? `?${queryString}` : ''}`
  }, [queryString])

  return { values, setters, queryString, buildHref }
}

/**
 * Hook to get current URL query string for navigation purposes
 * Use this in child components that need to preserve parent filters in links
 *
 * @param stripKeys - Optional array of URL parameter keys to remove when building hrefs
 *                    Useful when navigating up the hierarchy (e.g., set detail → browse)
 * @returns Object with queryString and buildHref helper
 *
 * @example
 * // In SetCard component - preserve all params
 * const { buildHref } = usePreserveFilters()
 * const href = buildHref(`/browse/pokemon/${set.id}`)
 *
 * @example
 * // In SetDetailClient - strip set-level params when going back to browse
 * const { buildHref } = usePreserveFilters(['cs', 'cso', 'cv', 'ct'])
 * const backHref = buildHref('/browse/pokemon')
 */
export function usePreserveFilters(stripKeys?: string[]): {
  queryString: string
  buildHref: (path: string) => string
} {
  const searchParams = useSearchParams()
  const queryString = searchParams.toString()

  const buildHref = useCallback((path: string): string => {
    let params = queryString
    if (stripKeys?.length) {
      const urlParams = new URLSearchParams(queryString)
      stripKeys.forEach(key => urlParams.delete(key))
      params = urlParams.toString()
    }
    return `${path}${params ? `?${params}` : ''}`
  }, [queryString, stripKeys])

  return { queryString, buildHref }
}
