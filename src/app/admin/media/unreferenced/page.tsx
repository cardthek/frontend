"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  HardDrive,
  LoaderCircle,
  RefreshCw,
  ScanSearch,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { AuthGuard } from "@/components/auth/auth-guard";
import { CardPreview } from "@/components/cards/card-preview";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeading } from "@/components/common/page-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiRequest, toApiError } from "@/lib/api-client";
import { useAppStore } from "@/lib/app-store";
import { resolveBackendUrl } from "@/lib/backend-config";
import type { MediaAsset } from "@/lib/types";
import { formatDate, formatFileSize } from "@/lib/utils";

interface UnreferencedMediaResponse {
  assets: MediaAsset[];
  totalCount: number;
  totalSize: number;
}

interface BulkDeleteResponse {
  deletedCount: number;
  totalSize: number;
}

async function fetchUnreferencedMedia() {
  const payload = await apiRequest<UnreferencedMediaResponse>(
    "/media/unreferenced",
  );
  return {
    ...payload.data,
    assets: payload.data.assets.map((asset) => ({
      ...asset,
      preview: resolveBackendUrl(asset.preview),
    })),
  };
}

export default function UnreferencedMediaPage() {
  return (
    <AuthGuard permission="media.manage">
      <UnreferencedMediaManager />
    </AuthGuard>
  );
}

function UnreferencedMediaManager() {
  const { state, refresh, removeMedia } = useAppStore();
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [totalSize, setTotalSize] = useState(0);
  const [scanning, setScanning] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [scanned, setScanned] = useState(false);

  const scan = useCallback(async () => {
    setScanning(true);
    try {
      const result = await fetchUnreferencedMedia();
      setAssets(result.assets);
      setTotalSize(result.totalSize);
      setScanned(true);
    } catch (scanError) {
      toast.error(toApiError(scanError).message);
    } finally {
      setScanning(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void fetchUnreferencedMedia()
      .then((result) => {
        if (!active) return;
        setAssets(result.assets);
        setTotalSize(result.totalSize);
        setScanned(true);
      })
      .catch((scanError) => {
        if (active) toast.error(toApiError(scanError).message);
      })
      .finally(() => {
        if (active) setScanning(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function removeOne(asset: MediaAsset) {
    if (!window.confirm(`确定永久删除「${asset.name}」吗？`)) return;
    const result = await removeMedia(asset.uuid);
    if (!result.ok) return toast.error(result.message);
    setAssets((current) =>
      current.filter((item) => item.uuid !== asset.uuid),
    );
    setTotalSize((current) => Math.max(0, current - asset.size));
    toast.success("未引用素材已删除");
  }

  async function removeAll() {
    if (!assets.length) return;
    if (
      !window.confirm(
        `确定永久删除全部 ${assets.length} 个未引用素材，并释放 ${formatFileSize(totalSize)} 空间吗？`,
      )
    ) {
      return;
    }
    setDeleting(true);
    try {
      const payload = await apiRequest<BulkDeleteResponse>(
        "/media/unreferenced",
        { method: "DELETE" },
      );
      await refresh();
      setAssets([]);
      setTotalSize(0);
      setScanned(true);
      toast.success(
        `已删除 ${payload.data.deletedCount} 个素材，释放 ${formatFileSize(payload.data.totalSize)}`,
      );
    } catch (deleteError) {
      toast.error(toApiError(deleteError).message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <PageHeading
        eyebrow="Media Maintenance"
        title="未引用素材"
        description="扫描没有被任何卡片引用的卡面文件。删除会同时移除数据库记录与磁盘文件，且不可恢复。"
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/admin/media">
                <ArrowLeft className="size-4" />
                返回媒体库
              </Link>
            </Button>
            <Button
              variant="outline"
              onClick={() => void scan()}
              disabled={scanning || deleting}
            >
              {scanning ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <RefreshCw className="size-4" />
              )}
              重新扫描
            </Button>
            <Button
              variant="destructive"
              onClick={() => void removeAll()}
              disabled={!assets.length || scanning || deleting}
            >
              {deleting ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              删除全部未引用素材
            </Button>
          </>
        }
      />

      <div className="mt-7 grid gap-3 sm:grid-cols-3">
        <div className="paper-panel p-4">
          <p className="label-caps">扫描结果</p>
          <p className="mt-2 font-serif text-2xl font-bold">
            {scanning ? "—" : assets.length}
          </p>
        </div>
        <div className="paper-panel p-4">
          <p className="label-caps">可释放空间</p>
          <p className="mt-2 font-serif text-2xl font-bold">
            {scanning ? "—" : formatFileSize(totalSize)}
          </p>
        </div>
        <div className="paper-panel flex items-center gap-3 p-4">
          <span className="flex size-10 items-center justify-center rounded-full bg-secondary/10 text-secondary">
            <ScanSearch className="size-5" />
          </span>
          <div>
            <p className="text-sm font-semibold">实时数据库扫描</p>
            <p className="mt-1 text-xs text-muted-foreground">
              被卡片引用的素材不会出现在这里。
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <p className="text-xs leading-5 text-muted-foreground">
          {scanned
            ? "扫描已完成。删除前会由后端再次确认素材未被引用。"
            : "正在读取媒体引用关系…"}
        </p>
        {assets.length > 0 && (
          <Badge variant="warning">
            <HardDrive className="size-3" />
            {assets.length} 个待清理
          </Badge>
        )}
      </div>

      {scanning ? (
        <div className="mt-5 flex min-h-56 items-center justify-center rounded-card border border-border bg-surface/35">
          <div className="text-center">
            <LoaderCircle className="mx-auto size-6 animate-spin text-secondary" />
            <p className="mt-3 text-sm text-muted-foreground">
              正在扫描未引用素材…
            </p>
          </div>
        </div>
      ) : assets.length ? (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {assets.map((asset) => {
            const owner = state.users.find(
              (user) => user.id === asset.ownerId,
            );
            return (
              <article key={asset.uuid} className="paper-panel p-3">
                <CardPreview
                  title={asset.name}
                  media={asset}
                  showLightbox={false}
                />
                <div className="mt-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-semibold">
                      {asset.name}
                    </h2>
                    <p className="mt-1 text-[0.65rem] text-muted-foreground">
                      {formatFileSize(asset.size)} · {formatDate(asset.createdAt)}
                    </p>
                    <p className="mt-1 text-[0.65rem] text-muted-foreground">
                      {owner?.displayName ?? `用户 #${asset.ownerId}`}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-destructive hover:bg-destructive/10"
                    onClick={() => void removeOne(asset)}
                    aria-label={`删除 ${asset.name}`}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
                <p className="mt-3 truncate rounded-ui bg-surface px-2 py-1.5 font-mono text-[0.58rem] text-muted-foreground">
                  {asset.uuid}
                </p>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="mt-5">
          <EmptyState
            title="没有未引用素材"
            description="当前所有媒体文件都被卡片引用，无需清理。"
            action={
              <Button variant="outline" onClick={() => void scan()}>
                <RefreshCw className="size-4" />
                重新扫描
              </Button>
            }
          />
        </div>
      )}
    </div>
  );
}
