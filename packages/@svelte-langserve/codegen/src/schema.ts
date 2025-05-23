import { readFile } from 'fs/promises';

export interface JSONSchema {
  [key: string]: any;
}

/**
 * Load and parse a JSON schema from file
 */
export async function loadSchema(schemaPath: string): Promise<JSONSchema> {
  try {
    const content = await readFile(schemaPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`Failed to load schema from ${schemaPath}: ${error}`);
  }
}

/**
 * Basic validation of JSON schema structure
 */
export function validateSchema(schema: JSONSchema): boolean {
  // Basic validation - should have type definitions
  if (!schema || typeof schema !== 'object') {
    return false;
  }
  
  // Should have either a definitions section or be a valid schema itself
  return !!(schema.definitions || schema.type || schema.properties);
}