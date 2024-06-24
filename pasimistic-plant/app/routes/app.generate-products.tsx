import {
  Card,
  Layout,
  Page,
  Text,
  BlockStack,
  TextField,
  Form,
  FormLayout,
  Button,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { useCallback, useEffect, useState } from "react";
import type { ActionFunctionArgs } from "@remix-run/node";
// import { authenticate } from "~/shopify.server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { useActionData, useSubmit } from "@remix-run/react";
import { json } from "@remix-run/node";
import Markdown from "react-markdown";
import extractLists from "~/utils/extract-lists";

export const action = async ({ request }: ActionFunctionArgs) => {
  const genAI = new GoogleGenerativeAI("AIzaSyBAQrOd0fcf8bCf2ewaH5N795DN41Bnk2I");
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const body = await request.formData();
  const productName = body.get("productName") || "";

  const prompt = `Generate SEO friendly attractive name for a product titled ${productName} also make sure it is unique, catchy and accept all the SEO criteria. The response should only contains the lists not any tips or tricks only send the lists.`;

  const result = await model.generateContent(prompt);
  const response = await result.response;

  const text = response.text();

  return json({
    text,
  });
};

export default function GenerateProductsUsingAI() {
  const [productName, setProductName] = useState("");
  const [list, setLists] = useState("");

  const data = useActionData<typeof action>();
  const submit = useSubmit();

  const handleProductNameChange = useCallback((value: string) => setProductName(value), []);
  const handleClearButtonClick = useCallback(() => setProductName(""), []);

  const generateAiProduct = async () => {
    return submit(
      {
        productName,
      },
      { replace: true, method: "POST" },
    );
  };

  useEffect(() => {
    if (data?.text) {
      const lists = extractLists(data.text);
      setLists(lists);
    }

    return () => {
      setLists("");
    };
  }, [data?.text]);

  return (
    <Page>
      <TitleBar title="Try Generate Products Using AI" />

      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="500">
              <Text as="h2" variant="headingMd">
                Currently available products
              </Text>

              <BlockStack gap="200">
                <Form onSubmit={generateAiProduct}>
                  <FormLayout>
                    {/* The `<TextField>` component is rendering an input field for users to enter a product name. Here is a breakdown of its props: */}
                    <TextField
                      value={productName}
                      onChange={handleProductNameChange}
                      label="Name"
                      type="text"
                      autoComplete="product-name"
                      showCharacterCount
                      clearButton
                      onClearButtonClick={handleClearButtonClick}
                      connectedRight={<Button submit>Generate</Button>}
                      placeholder="Ex: Green plant"
                    />
                  </FormLayout>
                </Form>
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        {list.length ? (
          <Layout.Section>
            <Card>
              <BlockStack>
                <Text as="h2" variant="headingMd">
                  Generated Product Name
                </Text>

                <BlockStack>
                  <Markdown>{list}</Markdown>
                </BlockStack>
              </BlockStack>
            </Card>
          </Layout.Section>
        ) : null}
      </Layout>
    </Page>
  );
}
