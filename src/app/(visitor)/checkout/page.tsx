import type { Metadata } from "next";
import PageHeader from "@/components/shared/PageHeader";
import { CheckoutForm } from "@/features/checkout/components/checkout-form";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false },
};

export default function CheckoutPage() {
  return (
    <>
      <PageHeader eyebrow="SECURE CHECKOUT" title="Confirm your passes" description="One payment for every slot on your Puja trail." />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <CheckoutForm />
      </div>
    </>
  );
}
