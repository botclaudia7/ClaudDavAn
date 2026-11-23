export type CategoryId =
  | 'produce'
  | 'bakery'
  | 'dairy'
  | 'meat'
  | 'frozen'
  | 'pantry'
  | 'snacks'
  | 'drinks'
  | 'household'
  | 'personal'
  | 'other';

export interface ShoppingItem {
  id: string;
  name: string;
  /** Free text: "2", "500 g", "1 dozen"… Empty means just one. */
  quantity: string;
  category: CategoryId;
  note: string;
  /** In the cart / bought. */
  checked: boolean;
  checkedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ItemInput = Pick<ShoppingItem, 'name' | 'quantity' | 'category' | 'note'>;

/** What you have bought before, keyed by lower-cased name. Powers "Buy again". */
export interface HistoryRecord {
  name: string;
  category: CategoryId;
  /** Quantity from the last time it was bought, reused by "Buy again". */
  quantity?: string;
  count: number;
  lastBought: string;
}
