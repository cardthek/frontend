"use client";

import { ChevronDown, RotateCcw } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { visibilityLabel } from "@/lib/demo-store";
import type { CardField, FieldVisibility, Role, VisibilityPrincipal } from "@/lib/types";
import { cn } from "@/lib/utils";

const fields: Array<{ key: CardField; label: string; note: string }> = [
  { key: "title", label: "卡片标题", note: "卡片在档案中显示的名称" },
  { key: "bin", label: "卡 BIN", note: "卡号前 6–8 位发卡识别码" },
  { key: "issuer", label: "发行方", note: "银行或发卡机构" },
  { key: "network", label: "卡组织", note: "卡面所属网络" },
  { key: "cardType", label: "卡片类型", note: "借记卡、信用卡等" },
  { key: "level", label: "卡片等级", note: "经典、金卡、白金等" },
  { key: "country", label: "发行地区", note: "卡片发行国家或地区" },
  { key: "currency", label: "币种", note: "卡片支持的 ISO 4217 币种" },
  { key: "releaseYear", label: "发行年份", note: "卡片公开发行年份" },
  { key: "tags", label: "设计标签", note: "用于检索的视觉标签" },
  { key: "description", label: "卡面介绍", note: "材质、构图与设计背景" },
  { key: "gallery", label: "卡片图库", note: "正面、背面与细节图片" },
  { key: "source", label: "资料来源", note: "外部参考链接" },
];

const basePrincipals: Array<{ key: VisibilityPrincipal; label: string }> = [
  { key: "guest", label: "所有人" },
  { key: "authenticated", label: "已登录用户" },
  { key: "owner", label: "卡片作者" },
  { key: "admin", label: "管理员" },
];

export function VisibilityEditor({
  value,
  defaults,
  roles,
  onChange,
  showOverrideState = true,
  disabled = false,
}: {
  value: Partial<FieldVisibility>;
  defaults: FieldVisibility;
  roles: Role[];
  onChange: (next: Partial<FieldVisibility>) => void;
  showOverrideState?: boolean;
  disabled?: boolean;
}) {
  function toggle(field: CardField, principal: VisibilityPrincipal) {
    if (disabled) return;
    const current = value[field] ?? defaults[field];
    const next = current.includes(principal) ? current.filter((item) => item !== principal) : [...current, principal];
    onChange({ ...value, [field]: next });
  }

  function reset(field: CardField) {
    if (disabled) return;
    const next = { ...value };
    delete next[field];
    onChange(next);
  }

  return (
    <div className="divide-y divide-border rounded-ui border border-border bg-card">
      {fields.map((field) => {
        const rules = value[field.key] ?? defaults[field.key];
        const overridden = showOverrideState && Boolean(value[field.key]);
        return (
          <details key={field.key} className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3.5 [&::-webkit-details-marker]:hidden">
              <div className="min-w-0">
                <p className="text-sm font-semibold">{field.label}</p>
                <p className="mt-0.5 truncate text-[0.68rem] text-muted-foreground">{visibilityLabel(rules, roles)}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {overridden && <span className="rounded-pill bg-secondary/15 px-2 py-0.5 text-[0.6rem] font-semibold text-secondary">已覆盖</span>}
                <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" />
              </div>
            </summary>
            <div className="border-t border-border/60 bg-surface/45 px-4 py-4">
              <div className="flex flex-wrap gap-x-5 gap-y-3">
                {[...basePrincipals, ...roles.map((role) => ({ key: `role:${role.id}` as VisibilityPrincipal, label: role.name }))].map((principal) => (
                  <label key={principal.key} className="flex cursor-pointer items-center gap-2 text-xs">
                    <Checkbox checked={rules.includes(principal.key)} onCheckedChange={() => toggle(field.key, principal.key)} disabled={disabled} aria-label={`${field.label}对${principal.label}可见`} />
                    {principal.label}
                  </label>
                ))}
              </div>
              <div className="mt-4 flex items-start justify-between gap-4 border-t border-border/50 pt-3">
                <p className={cn("text-[0.65rem] leading-5 text-muted-foreground", !rules.length && "text-warning")}>
                  {rules.length ? `当前：${visibilityLabel(rules, roles)}` : "未选择任何主体，仅拥有管理权限的用户可见。"}
                </p>
                {overridden && !disabled && <button type="button" onClick={() => reset(field.key)} className="flex shrink-0 items-center gap-1 text-[0.65rem] font-semibold text-muted-foreground hover:text-foreground"><RotateCcw className="size-3" />恢复默认</button>}
              </div>
            </div>
          </details>
        );
      })}
    </div>
  );
}
