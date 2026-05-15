export type ValueOf<T extends object> = T[keyof T];

export interface ListResponse<T> {
  previous: string | null;
  next: string | null;
  count: number;
  results: T[];
}
