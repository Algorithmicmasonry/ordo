import { getProductWithPackages } from "@/app/actions/products";
import { EmbedOrderFormClient } from "./_components/embed-order-form-client";

interface EmbedOrderFormPageProps {
  searchParams: Promise<{ product?: string }>;
}

export default async function EmbedOrderFormPage({
  searchParams,
}: EmbedOrderFormPageProps) {
  const params = await searchParams;
  const productId = params?.product;

  if (!productId) {
    return (
      <div className="w-full p-4 md:p-6">
        <div className="max-w-2xl mx-auto">
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <h2 className="text-lg font-semibold text-red-800 mb-2">
              Product ID Required
            </h2>
            <p className="text-red-700 text-sm">
              Please provide a product ID in the URL parameter. Example:
              ?product=PRODUCT_ID
            </p>
          </div>
        </div>
      </div>
    );
  }

  const result = await getProductWithPackages(productId);

  if (!result.success || !result.data) {
    return (
      <div className="w-full p-4 md:p-6">
        <div className="max-w-2xl mx-auto">
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <h2 className="text-lg font-semibold text-red-800 mb-2">
              Product Not Found
            </h2>
            <p className="text-red-700 text-sm">
              {result.error ||
                "The requested product could not be found or has no available packages."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <EmbedOrderFormClient product={result.data} />;
}
