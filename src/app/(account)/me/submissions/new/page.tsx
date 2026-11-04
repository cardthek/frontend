"use client";

import { AuthGuard } from "@/components/auth/auth-guard";
import { SubmissionForm } from "@/components/submissions/submission-form";

export default function NewSubmissionPage() {
  return (
    <AuthGuard permission="submissions.create">
      <div>
        <p className="label-caps mb-3">New Contribution</p>
        <h1 className="section-title">新建投稿</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">先保存草稿，完善资料后再提交审核。提交前请确认不包含任何敏感支付信息。</p>
        <div className="mt-7"><SubmissionForm /></div>
      </div>
    </AuthGuard>
  );
}
