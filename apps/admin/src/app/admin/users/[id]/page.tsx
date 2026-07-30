import { UserDetail } from "@/features/users/user-detail";
export default function UserDetailPage({ params }: { params: { id: string } }) { return <UserDetail id={params.id} />; }
