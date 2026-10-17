import RequestDetailLoader from "@/components/requests/RequestDetailLoader";

export default async function Page({ params }: { params: Promise<{ requestId: string }> }) {
  const { requestId } = await params;
  return <RequestDetailLoader requestId={requestId} />;
}
