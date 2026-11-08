import { PolicyPage, policyMetadata } from "@/components/policy/policy-page";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return policyMetadata((await params).locale, "terms");
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  return <PolicyPage locale={(await params).locale} k="terms" />;
}
