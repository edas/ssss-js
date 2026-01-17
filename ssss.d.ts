/**
 * Splits a secret string (interpreted as UTF-8) into Shamir's Secret Sharing shares.
 * Use this if your secret is a text string.
 *
 * @param str - The secret as a string (interpreted as utf-8).
 * @param params - Split parameters (threshold, prefix, numberOfKeys).
 * @param options - Optional. Additional entropy/export options.
 * @returns Array of shares, or [shares, exportedEntropy] if exportEntropy=true.
 */
export function splitString(
  str: string,
  params: {
    threshold: number;
    prefix?: string;
    numberOfKeys: number;
  },
  options?: {
    useCustomEntropy?: boolean;
    entropy?: string;
    exportEntropy?: boolean;
  }
): string[] | [string[], string];

/**
 * Splits a secret given as a hexadecimal string into Shamir's Secret Sharing shares.
 * Use this if your secret is hex-formatted data (optionally as buffer).
 *
 * @param hex - The secret as a hex string.
 * @param params - Split parameters (threshold, prefix, numberOfKeys).
 * @param options - Optional. Additional entropy/export options.
 * @returns Array of shares, or [shares, exportedEntropy] if exportEntropy=true.
 */
export function splitHexString(
  hex: string,
  params: {
    threshold: number;
    prefix?: string;
    numberOfKeys: number;
  },
  options?: {
    useCustomEntropy?: boolean;
    entropy?: string;
    exportEntropy?: boolean;
  }
): string[] | [string[], string];

/**
 * Splits a secret given as a Uint8Array (binary buffer) into shares; the bytes are interpreted as hex.
 * Use this only if you want to split binary data directly.
 *
 * @param buf - The secret as a Uint8Array/binary buffer.
 * @param params - Split parameters (threshold, prefix, numberOfKeys).
 * @param options - Optional. Additional entropy/export options.
 * @returns Array of shares, or [shares, exportedEntropy] if exportEntropy=true.
 */
export function splitBuffer(
  buf: Uint8Array,
  params: {
    threshold: number;
    prefix?: string;
    numberOfKeys: number;
  },
  options?: {
    useCustomEntropy?: boolean;
    entropy?: string;
    exportEntropy?: boolean;
  }
): string[] | [string[], string];


/**
 * Combines shares to recover a secret as a UTF-8 string (the original plain text).
 *
 * @param shares - Array of shares.
 * @param params - Parameters: threshold.
 * @returns The recovered secret as a utf-8 string.
 */
export function combineToText(
  shares: string[],
  params: {
    threshold: number;
  }
): string;

/**
 * Combines shares to recover a secret as a hex string (the original hex value).
 *
 * @param shares - Array of shares.
 * @param params - Parameters: threshold.
 * @returns The recovered secret as a hexadecimal string.
 */
export function combineToHexString(
  shares: string[],
  params: {
    threshold: number;
  }
): string;

/**
 * Combines shares to recover secret as a Uint8Array (the original raw bytes).
 *
 * @param shares - Array of shares.
 * @param params - Parameters: threshold.
 * @returns The recovered secret as a Uint8Array binary buffer.
 */
export function combineToBuffer(
  shares: string[],
  params: {
    threshold: number;
  }
): Uint8Array;

/**
 * Generates a new set of shares from an existing set of shares. This is useful for
 * resplitting a secret after threshold recovery, often called re-keying or extending.
 * The recovered secret is not exposed directly in this process.
 *
 * @param shares - Array of share strings (must be at least threshold length).
 * @param params - Parameters for resplitting.
 * @param params.threshold - Minimum number of shares needed to reconstruct the secret. Must be less than numberOfKeys.
 * @param params.inputIsHex - If true, the shares/secret are in hexadecimal format.
 * @param params.prefix - Optional prefix used for all new shares.
 * @param params.numberOfKeys - The number of new shares to generate.
 * @returns An array of newly generated shares
 */
export function resplit(
  shares: string[],
  params: {
    threshold: number;
    prefix?: string;
    numberOfKeys: number;
  }
): string[];

/**
 * Parses a single Shamir share string into its components (prefix, index, value).
 * A share is typically formatted as "prefix-index-value", where each part is delimited by "-".
 * The prefix is optional; if the share has only index and value, prefix is undefined.
 *
 * @param share - The encoded share string.
 *     Expected format: "[prefix-]index-value" (prefix is optional, index is an integer, value is field data as a string).
 * @returns An object containing the optional prefix, the numeric index, and the value part of the share.
 */
export function parseShare(share: string): {
  prefix: string | undefined;
  index: number;
  value: string;
};
