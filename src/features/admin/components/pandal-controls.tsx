"use client";

import { Eye, EyeOff, Star, StarOff } from "lucide-react";
import { setPandalFeatured, setPandalPublished } from "@/features/admin/actions";
import type { AdminPandalStatus } from "@/types";
import { ActionForm } from "./action-form";

export function PandalControls({
  pandalId,
  status,
  featured,
  hasProfileGaps,
}: {
  pandalId: string;
  status: AdminPandalStatus;
  featured: boolean;
  hasProfileGaps: boolean;
}) {
  if (status === "blocked") {
    return <p className="text-sm text-stone-500">Verify the club on the Clubs page before publishing.</p>;
  }

  if (status === "draft") {
    return (
      <ActionForm
        action={setPandalPublished}
        hidden={{ pandalId, publish: "true" }}
        disabled={hasProfileGaps}
        submitLabel={<><Eye className="size-4" aria-hidden="true" /> Publish</>}
      />
    );
  }

  return (
    <div className="flex flex-wrap items-start gap-2">
      <ActionForm
        action={setPandalFeatured}
        hidden={{ pandalId, featured: String(!featured) }}
        variant="neutral"
        submitLabel={featured ? <><StarOff className="size-4" aria-hidden="true" /> Unfeature</> : <><Star className="size-4" aria-hidden="true" /> Feature</>}
      />
      <ActionForm
        action={setPandalPublished}
        hidden={{ pandalId, publish: "false" }}
        variant="danger"
        submitLabel={<><EyeOff className="size-4" aria-hidden="true" /> Unpublish</>}
      />
    </div>
  );
}
