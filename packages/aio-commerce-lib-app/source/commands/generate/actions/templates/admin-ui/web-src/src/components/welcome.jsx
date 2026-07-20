import { useIms } from "@adobe/aio-commerce-lib-admin-ui/web";

/** A simple welcome component that displays the IMS token and org ID. */
export function Welcome() {
  const { data, error } = useIms();
  if (error) {
    throw error;
  }

  return (
    <>
      <h1>Welcome to your Adobe Commerce App</h1>
      <p>Your IMS Org ID is {data.imsOrgId}</p>
    </>
  );
}
