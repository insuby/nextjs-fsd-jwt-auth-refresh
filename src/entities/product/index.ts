// Isomorphic public API (schemas + types + query keys). Server calls live in `./server`.
export {
  productSchema,
  productsPageSchema,
  productKeys,
  PRODUCTS_PAGE_SIZE,
  getNextProductsPageParam,
} from './model/product';
export type { Product, ProductsPage } from './model/product';
