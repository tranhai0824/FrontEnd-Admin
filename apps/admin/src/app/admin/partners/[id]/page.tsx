import { redirect } from "next/navigation";
export default function PartnerDetailPage({ params }: { params: { id: string } }) {
  redirect(`/admin/partners?selected=${encodeURIComponent(params.id)}`);
}
