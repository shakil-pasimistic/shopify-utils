import { useEffect } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useActionData, useLoaderData, useNavigation, useSubmit } from "@remix-run/react";
import { Page, Layout, Text, Card, Button, BlockStack, Box, InlineStack } from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";

/**
 * This function fetches the titles of the first 10 products using GraphQL and returns them as a JSON
 * response.
 * @param {LoaderFunctionArgs}  - The code you provided is an example of a loader function in a
 * server-side rendering environment. This function fetches a list of products from a GraphQL endpoint
 * using an authenticated admin user. It then extracts the product titles from the response and returns
 * them as a JSON object.
 * @returns The loader function is returning a JSON object with a key "products" containing an array of
 * product titles fetched from a GraphQL query.
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  const items = await admin.graphql(
    `#graphql
      query {
        products(first: 10) {
          edges {
            node {
              title
            }
          }
        }
      }`,
  );

  const productsJson = await items.json();

  const products = productsJson.data?.products?.edges.map(
    (product: { node: { title: string } }) => {
      return product.node.title;
    },
  );

  return json({
    products,
  });
};

/**
 * This TypeScript React function performs actions related to creating and updating products in a
 * Shopify store.
 * @param {ActionFunctionArgs}  - The code you provided is an asynchronous function that performs
 * several GraphQL queries and mutations to create a new product variant in a Shopify store. Here's a
 * breakdown of what the code does:
 * @returns The `action` function returns a JSON object with the following properties:
 * - `product`: Contains information about the newly created product, including id, title, handle,
 * status, and variants.
 * - `variant`: Contains information about the updated product variant, including id, price, barcode,
 * and createdAt.
 * - `products`: An array of product titles retrieved from the GraphQL query.
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const color = ["Red", "Orange", "Yellow", "Green"][Math.floor(Math.random() * 4)];

  const items = await admin.graphql(
    `#graphql
      query {
        products(first: 10) {
          edges {
            node {
              title
            }
          }
        }
      }`,
  );

  const productsJson = await items.json();

  const products = productsJson.data?.products?.edges.map(
    // eslint-disable-next-line array-callback-return
    (product: { node: { title: string } }) => {
      return product.node.title;
    },
  );

  const response = await admin.graphql(
    `#graphql
      mutation populateProduct($input: ProductInput!) {
        productCreate(input: $input) {
          product {
            id
            title
            handle
            status
            variants(first: 10) {
              edges {
                node {
                  id
                  price
                  barcode
                  createdAt
                }
              }
            }
          }
        }
      }`,
    {
      variables: {
        input: {
          title: `${color} Snowboard`,
        },
      },
    },
  );
  const responseJson = await response.json();

  const variantId = responseJson.data!.productCreate!.product!.variants.edges[0]!.node!.id!;
  const variantResponse = await admin.graphql(
    `#graphql
      mutation shopifyRemixTemplateUpdateVariant($input: ProductVariantInput!) {
        productVariantUpdate(input: $input) {
          productVariant {
            id
            price
            barcode
            createdAt
          }
        }
      }`,
    {
      variables: {
        input: {
          id: variantId,
          price: Math.random() * 100,
        },
      },
    },
  );

  const variantResponseJson = await variantResponse.json();

  return json({
    product: responseJson!.data!.productCreate!.product,
    variant: variantResponseJson!.data!.productVariantUpdate!.productVariant,
    products,
  });
};

/* The above code is a TypeScript React component that displays a page for a fictional "Pasimistic
    Plant" shop. Here is a summary of what the code is doing:
* The `loader` function fetches the titles of the first 10 products from a Shopify store using a GraphQL query. It returns the product titles as a JSON object.
* The `action` function creates a new product variant in the Shopify store by performing GraphQL mutations. It also retrieves information about the newly created product and updated variant. The function returns a JSON object containing this information.
* The `Index` component renders the page layout, including a title bar, product information, and buttons to generate a new product and view the product details. It also displays the GraphQL mutation responses for the created product and updated variant. The component uses hooks like `useActionData`, `useLoaderData`, `useNavigation`, `useSubmit`, and `useAppBridge` to interact with the Shopify App Bridge and handle form submissions.
*/
export default function Index() {
  const nav = useNavigation();
  const actionData = useActionData<typeof action>();
  const submit = useSubmit();
  const shopify = useAppBridge();
  const loaderData = useLoaderData<typeof loader>();

  console.table(loaderData?.products);

  const isLoading = ["loading", "submitting"].includes(nav.state) && nav.formMethod === "POST";

  const productId = actionData?.product?.id.replace("gid://shopify/Product/", "");

  useEffect(() => {
    if (productId) {
      shopify.toast.show("Product created");
    }
  }, [productId, shopify]);

  const generateProduct = () => submit({}, { replace: true, method: "POST" });

  return (
    <Page>
      <TitleBar title="Pasimistic Plant" key="Home page title">
        <button variant="primary">Version 1.0.0</button>
      </TitleBar>

      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <BlockStack gap="500">
              <Card>
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">
                    Currently available products
                  </Text>

                  <BlockStack gap="200">
                    {loaderData?.products?.map((product: string, index: number) => (
                      <InlineStack key={`${index}-${product}`} align="space-between">
                        <Text as="span" variant="bodyMd">
                          {product}
                        </Text>
                      </InlineStack>
                    ))}
                  </BlockStack>
                </BlockStack>
              </Card>
            </BlockStack>
          </Layout.Section>

          <Layout.Section>
            <Card>
              <BlockStack gap="500">
                <InlineStack gap="300">
                  <Button loading={isLoading} onClick={generateProduct}>
                    Generate a product
                  </Button>

                  {actionData?.product && (
                    <Button
                      url={`shopify:admin/products/${productId}`}
                      target="_blank"
                      variant="plain"
                    >
                      View product
                    </Button>
                  )}
                </InlineStack>

                {actionData?.product && (
                  <>
                    <Text as="h3" variant="headingMd">
                      {" "}
                      productCreate mutation
                    </Text>
                    <Box
                      padding="400"
                      background="bg-surface-active"
                      borderWidth="025"
                      borderRadius="200"
                      borderColor="border"
                      overflowX="scroll"
                    >
                      <pre style={{ margin: 0 }}>
                        <code>{JSON.stringify(actionData.product, null, 2)}</code>
                      </pre>
                    </Box>
                    <Text as="h3" variant="headingMd">
                      {" "}
                      productVariantUpdate mutation
                    </Text>
                    <Box
                      padding="400"
                      background="bg-surface-active"
                      borderWidth="025"
                      borderRadius="200"
                      borderColor="border"
                      overflowX="scroll"
                    >
                      <pre style={{ margin: 0 }}>
                        <code>{JSON.stringify(actionData.variant, null, 2)}</code>
                      </pre>
                    </Box>
                  </>
                )}
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
