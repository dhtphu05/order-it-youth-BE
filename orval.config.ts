import { defineConfig } from 'orval';

const tags = ['Orders', 'Payments', 'Admin', 'BankTransactions', 'Shipper'];
const jsDocFields = ['summary', 'description'] as const;
const swaggerUrl = process.env.ORVAL_SPEC ?? './docs/swagger.json';

const jsDocFilter = (schema: Record<string, unknown>) =>
  jsDocFields
    .map((field) => {
      const value = schema[field];
      return typeof value === 'string'
        ? {
            key: field,
            value,
          }
        : undefined;
    })
    .filter(
      (
        entry,
      ): entry is { key: (typeof jsDocFields)[number]; value: string } =>
        Boolean(entry),
    );

export default defineConfig({
  orderItYouth: {
    input: {
      target: swaggerUrl,
      filters: {
        mode: 'include',
        tags,
      },
    },
    output: {
      mode: 'single',
      client: 'axios',
      clean: true,
      prettier: true,
      target: 'src/lib/api/generated.ts',
      override: {
        jsDoc: {
          filter: jsDocFilter,
        },
      },
    },
  },
});
