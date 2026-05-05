import { Button } from "@sports-system/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@sports-system/ui/components/card";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { toast } from "sonner";

import { client, unwrap } from "@/shared/lib/api";

function isAdmin(session: { role: string; email: string } | null | undefined) {
  if (!session) return false;
  if (session.email === "raphael@andrews.sh") return true;
  return session.role === "ADMIN" || session.role === "SUPERADMIN";
}

export const Route = createFileRoute("/_authenticated/admin/")({
  beforeLoad: ({ context }) => {
    if (!isAdmin(context.session)) {
      throw redirect({ to: "/" });
    }
  },
  component: AdminPage,
});

function AdminPage() {
  const handleSeed1 = async () => {
    try {
      await unwrap(client.POST("/admin/seed"));
      toast.success("Seed 1 completed successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to run seed 1");
    }
  };

  const handleSeed2 = async () => {
    try {
      await unwrap(client.POST("/admin/seed/2"));
      toast.success("Seed 2 completed successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to run seed 2");
    }
  };

  return (
    <div className="container mx-auto max-w-2xl px-4 py-10 space-y-6">
      <h1 className="text-2xl font-semibold">Admin</h1>
      <Card>
        <CardHeader>
          <CardTitle>Seed 1 — Sports Hub</CardTitle>
          <CardDescription>
            Populate the first complete demo dataset: Sports Hub league with 8 delegations (Brasil, Argentina, USA, etc.), athletes, competitions, events, enrollments, and brackets.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleSeed1}>Run Seed 1</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Seed 2 — Sports Hub Winter</CardTitle>
          <CardDescription>
            Populate the second complete demo dataset: Sports Hub Winter league with 8 different delegations (Canada, Mexico, Korea, etc.), athletes, competitions, events, enrollments, and brackets.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleSeed2}>Run Seed 2</Button>
        </CardContent>
      </Card>
    </div>
  );
}
