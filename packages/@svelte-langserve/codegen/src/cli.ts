#!/usr/bin/env node

import { Command } from 'commander';
import { generateTypesFromSchema } from './generators/typescript.js';
import { generatePydanticFromSchema } from './generators/python.js';
import { loadSchema } from './schema.js';

const program = new Command();

program
  .name('@svelte-langserve/codegen')
  .description('Generate TypeScript and Python types from JSON schemas')
  .version('0.1.0');

program
  .command('typescript')
  .description('Generate TypeScript types from schema')
  .argument('<schema>', 'Path to JSON schema file')
  .option('-o, --output <file>', 'Output file path', 'types.ts')
  .action(async (schemaPath: string, options: { output: string }) => {
    try {
      const schema = await loadSchema(schemaPath);
      const types = await generateTypesFromSchema(schema);
      
      // Write to output file
      const fs = await import('fs/promises');
      await fs.writeFile(options.output, types);
      console.log(`TypeScript types generated: ${options.output}`);
    } catch (error) {
      console.error('Error generating TypeScript types:', error);
      process.exit(1);
    }
  });

program
  .command('python')
  .description('Generate Python Pydantic models from schema')
  .argument('<schema>', 'Path to JSON schema file')
  .option('-o, --output <file>', 'Output file path', 'models.py')
  .action(async (schemaPath: string, options: { output: string }) => {
    try {
      const schema = await loadSchema(schemaPath);
      const models = await generatePydanticFromSchema(schema);
      
      // Write to output file
      const fs = await import('fs/promises');
      await fs.writeFile(options.output, models);
      console.log(`Python models generated: ${options.output}`);
    } catch (error) {
      console.error('Error generating Python models:', error);
      process.exit(1);
    }
  });

program
  .command('all')
  .description('Generate both TypeScript and Python types from schema')
  .argument('<schema>', 'Path to JSON schema file')
  .option('--ts-output <file>', 'TypeScript output file path', 'types.ts')
  .option('--py-output <file>', 'Python output file path', 'models.py')
  .action(async (schemaPath: string, options: { tsOutput: string; pyOutput: string }) => {
    try {
      const schema = await loadSchema(schemaPath);
      
      // Generate both
      const [types, models] = await Promise.all([
        generateTypesFromSchema(schema),
        generatePydanticFromSchema(schema)
      ]);
      
      // Write both files
      const fs = await import('fs/promises');
      await Promise.all([
        fs.writeFile(options.tsOutput, types),
        fs.writeFile(options.pyOutput, models)
      ]);
      
      console.log(`TypeScript types generated: ${options.tsOutput}`);
      console.log(`Python models generated: ${options.pyOutput}`);
    } catch (error) {
      console.error('Error generating types:', error);
      process.exit(1);
    }
  });

program.parse();