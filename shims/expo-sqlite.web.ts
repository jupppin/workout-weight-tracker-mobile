// Web shim for expo-sqlite - not supported on web
// This shim is used by Metro bundler to replace expo-sqlite imports on web platform
// to prevent bundling errors since expo-sqlite doesn't support web

export function openDatabaseSync(): never {
  throw new Error('SQLite is not supported on web. Please use a mobile device.');
}

export function openDatabaseAsync(): Promise<never> {
  return Promise.reject(new Error('SQLite is not supported on web. Please use a mobile device.'));
}

export function deleteDatabaseSync(): never {
  throw new Error('SQLite is not supported on web. Please use a mobile device.');
}

export function deleteDatabaseAsync(): Promise<never> {
  return Promise.reject(new Error('SQLite is not supported on web. Please use a mobile device.'));
}

// SQLite statement mock
export class SQLiteStatement {
  executeSync(): never {
    throw new Error('SQLite is not supported on web. Please use a mobile device.');
  }

  executeAsync(): Promise<never> {
    return Promise.reject(new Error('SQLite is not supported on web. Please use a mobile device.'));
  }

  getAllSync(): never {
    throw new Error('SQLite is not supported on web. Please use a mobile device.');
  }

  getAllAsync(): Promise<never> {
    return Promise.reject(new Error('SQLite is not supported on web. Please use a mobile device.'));
  }

  getFirstSync(): never {
    throw new Error('SQLite is not supported on web. Please use a mobile device.');
  }

  getFirstAsync(): Promise<never> {
    return Promise.reject(new Error('SQLite is not supported on web. Please use a mobile device.'));
  }

  finalizeSync(): void {}

  finalizeAsync(): Promise<void> {
    return Promise.resolve();
  }
}

// SQLite database mock
export class SQLiteDatabase {
  runSync(): never {
    throw new Error('SQLite is not supported on web. Please use a mobile device.');
  }

  runAsync(): Promise<never> {
    return Promise.reject(new Error('SQLite is not supported on web. Please use a mobile device.'));
  }

  getAllSync(): never {
    throw new Error('SQLite is not supported on web. Please use a mobile device.');
  }

  getAllAsync(): Promise<never> {
    return Promise.reject(new Error('SQLite is not supported on web. Please use a mobile device.'));
  }

  getFirstSync(): never {
    throw new Error('SQLite is not supported on web. Please use a mobile device.');
  }

  getFirstAsync(): Promise<never> {
    return Promise.reject(new Error('SQLite is not supported on web. Please use a mobile device.'));
  }

  execSync(): never {
    throw new Error('SQLite is not supported on web. Please use a mobile device.');
  }

  execAsync(): Promise<never> {
    return Promise.reject(new Error('SQLite is not supported on web. Please use a mobile device.'));
  }

  prepareSync(): SQLiteStatement {
    return new SQLiteStatement();
  }

  prepareAsync(): Promise<SQLiteStatement> {
    return Promise.resolve(new SQLiteStatement());
  }

  closeSync(): void {}

  closeAsync(): Promise<void> {
    return Promise.resolve();
  }

  withTransactionSync(): never {
    throw new Error('SQLite is not supported on web. Please use a mobile device.');
  }

  withTransactionAsync(): Promise<never> {
    return Promise.reject(new Error('SQLite is not supported on web. Please use a mobile device.'));
  }

  withExclusiveTransactionAsync(): Promise<never> {
    return Promise.reject(new Error('SQLite is not supported on web. Please use a mobile device.'));
  }
}

// Export types that might be imported
export type SQLiteOpenOptions = {
  enableChangeListener?: boolean;
  useNewConnection?: boolean;
};

export type SQLiteBindValue = string | number | null | Uint8Array;
export type SQLiteBindParams = SQLiteBindValue[] | Record<string, SQLiteBindValue>;

export type SQLiteRunResult = {
  lastInsertRowId: number;
  changes: number;
};

export type SQLiteColumnNames = string[];
export type SQLiteColumnValues = SQLiteBindValue[];

// Default export
export default {
  openDatabaseSync,
  openDatabaseAsync,
  deleteDatabaseSync,
  deleteDatabaseAsync,
  SQLiteDatabase,
  SQLiteStatement,
};
