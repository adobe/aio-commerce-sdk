# `storage`: Module

## Interfaces

| Interface                                    | Description                        |
| -------------------------------------------- | ---------------------------------- |
| [KeyValueStore](interfaces/KeyValueStore.md) | Generic key-value store interface. |

## Type Aliases

| Type Alias                                                   | Description                                                                                                                         |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| [CombinedStoreOptions](type-aliases/CombinedStoreOptions.md) | Options for creating a combined store.                                                                                              |
| [FilesStoreOptions](type-aliases/FilesStoreOptions.md)       | Options for creating a lib-files based store.                                                                                       |
| [KeyExtractor](type-aliases/KeyExtractor.md)                 | Function to extract a key from data. Used when saving data without explicitly providing a key.                                      |
| [PersistPredicate](type-aliases/PersistPredicate.md)         | Predicate function to determine if data should be persisted. Used by combined stores to decide when to write to persistent storage. |
| [StateStoreOptions](type-aliases/StateStoreOptions.md)       | Options for creating a lib-state based store.                                                                                       |

## Functions

| Function                                                | Description                                                                                                                          |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| [createCombinedStore](functions/createCombinedStore.md) | Creates a combined key-value store that uses: - lib-state for fast cache during active operations - lib-files for persistent storage |
| [createFilesStore](functions/createFilesStore.md)       | Creates a generic key-value store backed by @adobe/aio-lib-files. Provides persistent storage that survives beyond TTL.              |
| [createStateStore](functions/createStateStore.md)       | Creates a generic key-value store backed by @adobe/aio-lib-state. Provides fast, TTL-based caching for temporary data.               |
