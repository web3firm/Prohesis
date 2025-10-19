import { notFound } from "next/navigation";
import db from "@/lib/offchain/services/dbClient";

export default async function PublicUserProfilePage(
	props: { params: Promise<{ username: string }> }
) {
	const { username } = await props.params;
	const uname = username.toLowerCase();
	const user = await db.user.findFirst({
		where: { username: uname },
		select: { username: true, displayName: true, avatarUrl: true, bannerUrl: true, createdAt: true },
	});
	if (!user) return notFound();
	return (
		<div className="min-h-[60vh]">
			<div className="h-40 bg-gradient-to-r from-blue-200 to-blue-100" />
			<div className="max-w-4xl mx-auto -mt-12 p-6">
				<div className="flex items-center gap-4">
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img src={user.avatarUrl || "/favicon.ico"} alt="avatar" className="w-20 h-20 rounded-full border" />
					<div>
						<div className="text-2xl font-semibold">{user.displayName || user.username}</div>
						<div className="text-sm text-gray-500">u/{user.username}</div>
					</div>
				</div>
			</div>
		</div>
	);
}
