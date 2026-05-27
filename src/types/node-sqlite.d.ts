declare module "node:sqlite" {
  export class DatabaseSync {
    constructor(path: string);
    close(): void;
    exec(sql: string): void;
    prepare(sql: string): StatementSync;
    transaction<T extends (...args: never[]) => unknown>(fn: T): T;
  }

  export class StatementSync {
    all<T = unknown>(...anonymousParameters: unknown[]): T[];
    all<T = unknown>(namedParameters: Record<string, unknown>): T[];
    get<T = unknown>(...anonymousParameters: unknown[]): T | undefined;
    get<T = unknown>(namedParameters: Record<string, unknown>): T | undefined;
    run(...anonymousParameters: unknown[]): { changes: number; lastInsertRowid: number | bigint };
    run(namedParameters: Record<string, unknown>): { changes: number; lastInsertRowid: number | bigint };
  }
}
