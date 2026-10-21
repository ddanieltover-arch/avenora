/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Functional Result Type
 */

export type Result<T, E = Error> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: E };

export function Ok<T>(data: T): Result<T, never> {
  return { success: true, data };
}

export function Err<E = Error>(error: E): Result<never, E> {
  return { success: false, error };
}
