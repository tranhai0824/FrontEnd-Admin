import { redirect } from "next/navigation";
export default function ScholarshipDetailPage({ params }: { params: { id: string } }) {
  redirect(`/admin/scholarships?selected=${encodeURIComponent(params.id)}`);
}
