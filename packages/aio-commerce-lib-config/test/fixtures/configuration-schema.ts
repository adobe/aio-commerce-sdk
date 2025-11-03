export const VALID_CONFIGURATION = [
  {
    name: "exampleList",
    type: "list",
    options: [{ label: "Option 1", value: "option1" }],
    default: "option1",
  },
  {
    name: "currency",
    type: "text",
    label: "Currency",
  },
  {
    name: "paymentMethod",
    type: "text",
    label: "Payment Test Method",
  },
  {
    name: "testField",
    type: "text",
    label: "Test Field",
  },
];

export const INVALID_CONFIGURATION = [
  {
    type: "list",
    options: [{ label: "Option 1", value: "option1" }],
    default: "option1",
  },
  {
    type: "text",
    label: "Currency",
  },
  {
    type: "text",
    label: "Payment Test Method",
  },
  {
    type: "text",
    label: "Test Field",
  },
];
