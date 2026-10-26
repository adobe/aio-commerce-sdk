/**
 * Compatibility subset for the stable aio-lib-db 1.x API.
 * Signatures verified against published versions 1.0.0 through 1.0.4.
 * Use only when package-provided types are absent; see SKILL.md Step 2.
 */
declare module "@adobe/aio-lib-db" {
  export type DbRegion = "amer" | "apac" | "emea" | "aus";
  export type DbDocument = Record<string, unknown>;
  export type DbFilter = Record<string, unknown>;
  export type DbOptions = Record<string, unknown>;
  export type DbIndexSpecification = Record<string, 1 | -1>;

  export type DbCursor<T extends DbDocument = DbDocument> = AsyncIterable<T> & {
    project: (projection: Record<string, 0 | 1>) => DbCursor<T>;
    toArray: () => Promise<T[]>;
  };

  export type DbCollection<T extends DbDocument = DbDocument> = {
    createIndex: (
      specification: DbIndexSpecification,
      options?: DbOptions,
    ) => Promise<string>;
    deleteMany: (filter: DbFilter, options?: DbOptions) => Promise<DbDocument>;
    deleteOne: (filter: DbFilter, options?: DbOptions) => Promise<DbDocument>;
    find: (filter?: DbFilter, options?: DbOptions) => DbCursor<T>;
    findOne: (filter: DbFilter, options?: DbOptions) => Promise<T>;
    findOneAndUpdate: (
      filter: DbFilter,
      update: DbDocument,
      options?: DbOptions,
    ) => Promise<T>;
    insertMany: (documents: T[], options?: DbOptions) => Promise<DbDocument>;
    insertOne: (document: T, options?: DbOptions) => Promise<DbDocument>;
    updateMany: (
      filter: DbFilter,
      update: DbDocument,
      options?: DbOptions,
    ) => Promise<DbDocument>;
    updateOne: (
      filter: DbFilter,
      update: DbDocument,
      options?: DbOptions,
    ) => Promise<DbDocument>;
  };

  export type DbClient = {
    close: () => Promise<void>;
    collection: <T extends DbDocument = DbDocument>(
      name: string,
    ) => DbCollection<T>;
  };

  export type Db = {
    connect: () => Promise<DbClient>;
  };

  export type DbInitOptions = {
    region?: DbRegion;
    token: string;
  };

  export function init(options: DbInitOptions): Promise<Db>;
}
