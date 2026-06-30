import { useIms } from "@adobe/aio-commerce-lib-admin-ui/web";

/** A simple welcome component that displays the IMS token and org ID. */
export function Welcome() {
  const { imsToken, imsOrgId } = useIms();
  return (
    <>
      <h1>Welcome to your Adobe Commerce App</h1>

      <p>IMS Token: {`${imsToken.slice(0, 10)}...`}</p>
      <p>IMS Org ID: {imsOrgId}</p>
    </>
  );
}
