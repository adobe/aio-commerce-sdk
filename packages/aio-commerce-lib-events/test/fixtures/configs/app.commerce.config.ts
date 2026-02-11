export default {
  metadata: {
    id: "test-app",
    displayName: "Test App",
    description: "Test application for integration tests",
    version: "1.0.0",
  },
  eventing: {
    commerce: [
      {
        provider: {
          label: "Test Provider",
          description: "Test provider for integration tests",
        },
        events: [
          {
            name: "observer.catalog_product_save_after",
            label: "Product Save",
            description: "Triggered when a product is saved",
            runtimeActions: ["test-package/handle-product"],
            fields: [
              { name: "price" },
              { name: "_origData" },
              {
                name: "quoteId",
                source: "context_checkout_session.get_quote.get_id",
              },
            ],
            rules: [
              {
                field: "price",
                operator: "lessThan",
                value: "300.00",
              },
            ],
          },
        ],
      },
    ],
  },
};
