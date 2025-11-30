import { defineConfig } from 'orval';

const swaggerUrl = 'http://localhost:4000/docs-json';
const tags = ['Orders', 'Payments', 'Admin', 'BankTransactions', 'Shipper'];

export default defineConfig({
  orderItYouth: {
    input: {
      target: swaggerUrl,
      tags,
    },
    output: {
      mode: 'single',
      client: 'axios',
      clean: true,
      prettier: true,
      target: 'src/lib/api/generated.ts',
      useOptions: true,
    },
  },
});
