"use client";

import { CardEditor } from "@/components/cards/card-editor";
import type { Card } from "@/lib/types";

export function SubmissionForm({ card }: { card?: Card }) {
  return <CardEditor mode="submission" card={card} />;
}
