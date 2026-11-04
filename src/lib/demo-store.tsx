"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { initialDemoState } from "@/data/seed";
import type {
  AdminCardInput,
  AdminUserInput,
  AuditLog,
  Card,
  CardContribution,
  CardDraftInput,
  CardField,
  ContributionChanges,
  DemoState,
  DictionaryItem,
  MediaAsset,
  PermissionKey,
  ProfileVisibility,
  RegistrationInput,
  Role,
  SiteSettings,
  ThemeId,
  User,
  VisibilityPrincipal,
} from "@/lib/types";
import { isNumericUsername, slugify, uid } from "@/lib/utils";

interface StoreResult {
  ok: boolean;
  message: string;
}

interface DemoStoreValue {
  state: DemoState;
  currentUser: User | null;
  can: (permission: PermissionKey) => boolean;
  login: (identifier: string) => StoreResult;
  logout: () => void;
  switchSession: (userId: number | null) => void;
  register: (input: RegistrationInput) => StoreResult;
  setTheme: (theme: ThemeId) => void;
  resetDemo: (installed?: boolean) => void;
  completeSetup: (siteName: string, displayName: string, username: string, email: string) => void;
  createDraft: (input: CardDraftInput, ownerId?: number) => Card;
  createCard: (input: AdminCardInput) => Card;
  updateCard: (uuid: string, patch: Partial<Card>) => void;
  submitCard: (uuid: string) => void;
  reviewCard: (
    uuid: string,
    decision: "approved" | "rejected" | "changes_requested",
    comment: string,
  ) => void;
  setCardStatus: (uuid: string, status: Card["status"]) => void;
  toggleFeatured: (uuid: string) => void;
  deleteCard: (uuid: string) => void;
  toggleLike: (uuid: string) => StoreResult;
  recordCardDownload: (uuid: string) => void;
  createContribution: (cardUuid: string, changes: ContributionChanges, note: string) => StoreResult;
  reviewContribution: (id: string, decision: "approved" | "rejected", comment: string) => StoreResult;
  addMedia: (asset: Omit<MediaAsset, "uuid" | "createdAt">) => MediaAsset;
  removeMedia: (uuid: string) => StoreResult;
  updateProfile: (patch: Partial<User>) => StoreResult;
  updateSettings: (patch: Partial<SiteSettings>) => void;
  updateRole: (roleId: string, patch: Partial<Role>) => void;
  createRole: (name: string, slug: string, description: string) => StoreResult;
  deleteRole: (roleId: string) => StoreResult;
  createUser: (input: AdminUserInput) => StoreResult & { uuid?: string };
  saveUser: (userId: number, input: AdminUserInput) => StoreResult;
  deleteUser: (userId: number) => StoreResult;
  changePassword: (userId: number, password: string) => StoreResult;
  updateUser: (userId: number, patch: Partial<User>) => void;
  addDictionaryItem: (item: Omit<DictionaryItem, "id" | "slug" | "active">) => StoreResult;
  updateDictionaryItem: (id: string, patch: Partial<Pick<DictionaryItem, "label" | "slug" | "description" | "type" | "active" | "parentId">>) => StoreResult;
  toggleDictionaryItem: (id: string) => void;
  removeDictionaryItem: (id: string) => StoreResult;
  updateMedia: (uuid: string, patch: Partial<Pick<MediaAsset, "name" | "mimeType" | "size" | "ownerId" | "tone" | "pattern" | "preview">>) => StoreResult;
  isFieldVisible: (card: Card, field: CardField, viewer?: User | null) => boolean;
  isProfileVisible: (profile: User, viewer?: User | null) => boolean;
}

const DemoStoreContext = createContext<DemoStoreValue | null>(null);

function nowIso() {
  return new Date().toISOString();
}

function createAudit(
  actorId: number | null,
  action: string,
  resourceType: string,
  resourceId: string,
  detail: string,
): AuditLog {
  return {
    id: uid(),
    actorId: actorId ?? undefined,
    action,
    resourceType,
    resourceId,
    detail,
    createdAt: nowIso(),
  };
}

function permissionsFor(user: User | null, roles: Role[]) {
  if (!user || user.status !== "active") return new Set<PermissionKey>();
  const roleMap = new Map(roles.map((role) => [role.id, role]));
  return new Set(
    user.roleIds.flatMap((roleId) => roleMap.get(roleId)?.permissions ?? []),
  );
}

function validateUserInput(users: User[], roles: Role[], input: AdminUserInput, excludeId?: number) {
  if (!input.displayName.trim()) return "请填写显示名称";
  if (!input.username.trim()) return "请填写用户名";
  if (isNumericUsername(input.username)) return "用户名不能是纯数字";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) return "请输入有效邮箱地址";
  if (!input.slug.trim()) return "请填写公开主页 slug";
  if (input.roleIds.length !== 1) return "用户必须选择一个用户组";
  if (!input.roleIds.every((roleId) => roles.some((role) => role.id === roleId))) return "包含无效用户组";
  if (users.some((user) => user.id !== excludeId && user.username.toLowerCase() === input.username.trim().toLowerCase())) return "用户名已被使用";
  if (users.some((user) => user.id !== excludeId && user.email.toLowerCase() === input.email.trim().toLowerCase())) return "邮箱已被使用";
  if (users.some((user) => user.id !== excludeId && user.slug.toLowerCase() === input.slug.trim().toLowerCase())) return "公开主页地址已被使用";
  return null;
}

function nextDictionaryId(
  type: DictionaryItem["type"],
  label: string,
  dictionaries: DictionaryItem[],
): string {
  const base = `${type}-${slugify(label) || "item"}`;
  let id = base;
  let suffix = 2;
  while (dictionaries.some((item) => item.id === id)) {
    id = `${base}-${suffix}`;
    suffix += 1;
  }
  return id;
}

function releasedDeletedValue(
  value: string,
  field: "username" | "email" | "slug",
  users: User[],
  deletedUserId: number,
) {
  let candidate = `${value}.del`;
  let index = 2;
  while (
    users.some(
      (user) =>
        user.id !== deletedUserId &&
        user[field].toLowerCase() === candidate.toLowerCase(),
    )
  ) {
    candidate = `${value}.del-${index}`;
    index += 1;
  }
  return candidate;
}

export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DemoState>(() => structuredClone(initialDemoState));

  const currentUser = useMemo(
    () => state.users.find((user) => user.id === state.currentUserId) ?? null,
    [state.currentUserId, state.users],
  );

  useEffect(() => {
    document.documentElement.dataset.theme = state.theme;
  }, [state.theme]);

  const can = useCallback(
    (permission: PermissionKey) => permissionsFor(currentUser, state.roles).has(permission),
    [currentUser, state.roles],
  );

  const setTheme = useCallback((theme: ThemeId) => {
    setState((current) => ({ ...current, theme }));
  }, []);

  const login = useCallback((identifier: string): StoreResult => {
    const normalized = identifier.trim().toLowerCase();
    let result: StoreResult = { ok: false, message: "未找到匹配的演示账号" };
    setState((current) => {
      const user = current.users.find(
        (candidate) =>
          candidate.username.toLowerCase() === normalized ||
          candidate.email.toLowerCase() === normalized,
      );
      if (!user) return current;
      if (user.status === "deleted") {
        result = { ok: false, message: "该账号已注销，请刷新页面恢复演示数据" };
        return current;
      }
      if (user.status === "suspended") {
        result = { ok: false, message: "该演示账号已被停用，请刷新页面恢复演示数据" };
        return current;
      }
      result = { ok: true, message: `欢迎回来，${user.displayName}` };
      return {
        ...current,
        currentUserId: user.id,
        auditLogs: [
          createAudit(user.id, "session.login", "user", user.uuid, "通过演示登录"),
          ...current.auditLogs,
        ],
      };
    });
    return result;
  }, []);

  const logout = useCallback(() => {
    setState((current) => ({
      ...current,
      currentUserId: null,
      auditLogs: current.currentUserId
        ? [
            createAudit(current.currentUserId, "session.logout", "user", String(current.currentUserId), "退出演示登录"),
            ...current.auditLogs,
          ]
        : current.auditLogs,
    }));
  }, []);

  const switchSession = useCallback((userId: number | null) => {
    setState((current) => ({ ...current, currentUserId: userId }));
  }, []);

  const register = useCallback((input: RegistrationInput): StoreResult => {
    let result: StoreResult = { ok: true, message: "注册成功，已进入演示账号" };
    setState((current) => {
      const username = input.username.trim();
      if (isNumericUsername(username)) {
        result = { ok: false, message: "用户名不能是纯数字" };
        return current;
      }
      const duplicate = current.users.some(
        (user) =>
          user.username.toLowerCase() === username.toLowerCase() ||
          user.email.toLowerCase() === input.email.trim().toLowerCase(),
      );
      if (duplicate) {
        result = { ok: false, message: "用户名或邮箱已被使用" };
        return current;
      }
      const id = Math.max(...current.users.map((user) => user.id)) + 1;
      const user: User = {
        id,
        uuid: uid(),
        username,
        email: input.email.trim().toLowerCase(),
        displayName: input.displayName.trim() || username,
        slug: slugify(username),
        bio: "刚刚加入卡迹，还没有写下简介。",
        avatarTone: "sage",
        profileVisibility: "public",
        showSubmissions: true,
        roleIds: ["member"],
        status: "active",
        joinedAt: nowIso(),
      };
      return {
        ...current,
        users: [...current.users, user],
        currentUserId: id,
        auditLogs: [
          createAudit(id, "user.registered", "user", user.uuid, "注册演示账号"),
          ...current.auditLogs,
        ],
      };
    });
    return result;
  }, []);

  const resetDemo = useCallback((installed = true) => {
    const next = structuredClone(initialDemoState);
    next.settings.installed = installed;
    next.currentUserId = null;
    setState(next);
  }, []);

  const completeSetup = useCallback(
    (siteName: string, displayName: string, username: string, email: string) => {
      setState((current) => {
        const id = Math.max(...current.users.map((user) => user.id)) + 1;
        const user: User = {
          id,
          uuid: uid(),
          username,
          email: email.toLowerCase(),
          displayName,
          slug: slugify(username),
          bio: "站点创建者。",
          avatarTone: "forest",
          profileVisibility: "public",
          showSubmissions: true,
          roleIds: ["super-admin"],
          status: "active",
          joinedAt: nowIso(),
        };
        return {
          ...current,
          settings: { ...current.settings, installed: true, siteName },
          users: [...current.users, user],
          currentUserId: id,
          auditLogs: [
            createAudit(id, "site.installed", "site", "main", `完成 ${siteName} 初始化`),
            ...current.auditLogs,
          ],
        };
      });
    },
    [],
  );

  const createDraft = useCallback((input: CardDraftInput, ownerId?: number): Card => {
    const timestamp = nowIso();
    const actualOwner = ownerId ?? state.currentUserId ?? 3;
    const card: Card = {
      uuid: uid(),
      ...input,
      sourceUrl: input.sourceUrl?.trim() || undefined,
      visibilityOverrides: {},
      ownerId: actualOwner,
      status: "draft",
      featured: false,
      likeCount: 0,
      downloadCount: 0,
      likedByUserIds: [],
      contributorIds: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    setState((current) => ({
      ...current,
      cards: [card, ...current.cards],
      auditLogs: [
        createAudit(actualOwner, "submission.draft_created", "card", card.uuid, `创建草稿「${card.title}」`),
        ...current.auditLogs,
      ],
    }));
    return card;
  }, [state.currentUserId]);

  const createCard = useCallback((input: AdminCardInput): Card => {
    const timestamp = nowIso();
    const card: Card = {
      uuid: uid(),
      ...input,
      sourceUrl: input.sourceUrl?.trim() || undefined,
      likeCount: 0,
      downloadCount: 0,
      likedByUserIds: [],
      contributorIds: [],
      createdAt: timestamp,
      updatedAt: timestamp,
      submittedAt: input.status === "pending" ? timestamp : undefined,
    };
    setState((current) => ({
      ...current,
      cards: [card, ...current.cards],
      auditLogs: [
        createAudit(current.currentUserId, "card.created", "card", card.uuid, `后台新增卡片「${card.title}」`),
        ...current.auditLogs,
      ],
    }));
    return card;
  }, []);

  const updateCard = useCallback((uuid: string, patch: Partial<Card>) => {
    setState((current) => ({
      ...current,
      cards: current.cards.map((card) =>
        card.uuid === uuid ? { ...card, ...patch, updatedAt: nowIso() } : card,
      ),
      auditLogs: [
        createAudit(current.currentUserId, "card.updated", "card", uuid, "更新卡片内容"),
        ...current.auditLogs,
      ],
    }));
  }, []);

  const submitCard = useCallback((uuid: string) => {
    setState((current) => {
      const submitter = current.users.find((user) => user.id === current.currentUserId);
      const bypassReview = Boolean(submitter && permissionsFor(submitter, current.roles).has("submissions.bypassReview"));
      const nextStatus: Card["status"] = bypassReview ? "published" : "pending";
      return {
        ...current,
        cards: current.cards.map((card) =>
          card.uuid === uuid
            ? {
                ...card,
                status: nextStatus,
                submittedAt: nowIso(),
                updatedAt: nowIso(),
                reviewComment: undefined,
                reviewedBy: undefined,
              }
            : card,
        ),
        auditLogs: [
          createAudit(
            current.currentUserId,
            bypassReview ? "submission.auto_published" : "submission.submitted",
            "card",
            uuid,
            bypassReview ? "投稿免审核，自动发布" : "提交卡片审核",
          ),
          ...current.auditLogs,
        ],
      };
    });
  }, []);

  const reviewCard = useCallback(
    (
      uuid: string,
      decision: "approved" | "rejected" | "changes_requested",
      comment: string,
    ) => {
      setState((current) => {
        const reviewerId = current.currentUserId ?? 2;
        const nextStatus: Card["status"] =
          decision === "approved"
            ? "published"
            : decision === "rejected"
              ? "rejected"
              : "changes_requested";
        return {
          ...current,
          cards: current.cards.map((card) =>
            card.uuid === uuid
              ? {
                  ...card,
                  status: nextStatus,
                  reviewComment: comment,
                  reviewedBy: reviewerId,
                  updatedAt: nowIso(),
                }
              : card,
          ),
          reviews: [
            {
              id: uid(),
              cardUuid: uuid,
              reviewerId,
              decision,
              comment,
              createdAt: nowIso(),
            },
            ...current.reviews,
          ],
          auditLogs: [
            createAudit(reviewerId, `submission.${decision}`, "card", uuid, comment || "执行审核"),
            ...current.auditLogs,
          ],
        };
      });
    },
    [],
  );

  const setCardStatus = useCallback((uuid: string, status: Card["status"]) => {
    setState((current) => ({
      ...current,
      cards: current.cards.map((card) =>
        card.uuid === uuid ? { ...card, status, updatedAt: nowIso() } : card,
      ),
      auditLogs: [
        createAudit(current.currentUserId, `card.status.${status}`, "card", uuid, `卡片状态切换为 ${status}`),
        ...current.auditLogs,
      ],
    }));
  }, []);

  const toggleFeatured = useCallback((uuid: string) => {
    setState((current) => ({
      ...current,
      cards: current.cards.map((card) =>
        card.uuid === uuid ? { ...card, featured: !card.featured } : card,
      ),
    }));
  }, []);

  const deleteCard = useCallback((uuid: string) => {
    setState((current) => ({
      ...current,
      cards: current.cards.filter((card) => card.uuid !== uuid),
      auditLogs: [
        createAudit(current.currentUserId, "card.deleted", "card", uuid, "删除卡片"),
        ...current.auditLogs,
      ],
    }));
  }, []);

  const toggleLike = useCallback((uuid: string): StoreResult => {
    let result: StoreResult = { ok: false, message: "点赞失败" };
    setState((current) => {
      if (!current.currentUserId) {
        result = { ok: false, message: "请先登录后点赞" };
        return current;
      }
      const userId = current.currentUserId;
      return {
        ...current,
        cards: current.cards.map((card) => {
          if (card.uuid !== uuid) return card;
          const likedByUserIds = card.likedByUserIds ?? [];
          const liked = likedByUserIds.includes(userId);
          result = { ok: true, message: liked ? "已取消喜欢" : "已加入喜欢" };
          return {
            ...card,
            likedByUserIds: liked ? likedByUserIds.filter((id) => id !== userId) : [...likedByUserIds, userId],
            likeCount: Math.max(0, (card.likeCount ?? 0) + (liked ? -1 : 1)),
          };
        }),
      };
    });
    return result;
  }, []);

  const recordCardDownload = useCallback((uuid: string) => {
    setState((current) => ({
      ...current,
      cards: current.cards.map((card) =>
        card.uuid === uuid
          ? { ...card, downloadCount: (card.downloadCount ?? 0) + 1 }
          : card,
      ),
    }));
  }, []);

  const createContribution = useCallback((cardUuid: string, changes: ContributionChanges, note: string): StoreResult => {
    let result: StoreResult = { ok: false, message: "修改建议提交失败" };
    setState((current) => {
      if (!current.currentUserId) {
        result = { ok: false, message: "请先登录后提交修改建议" };
        return current;
      }
      const card = current.cards.find((item) => item.uuid === cardUuid);
      if (!card) {
        result = { ok: false, message: "卡片不存在" };
        return current;
      }
      if (card.ownerId === current.currentUserId) {
        result = { ok: false, message: "你是卡片作者，不需要提交协作修改" };
        return current;
      }
      if (!Object.keys(changes).length) {
        result = { ok: false, message: "没有检测到修改内容" };
        return current;
      }
      if (!note.trim()) {
        result = { ok: false, message: "请填写修改说明" };
        return current;
      }
      const contribution: CardContribution = {
        id: uid(),
        cardUuid,
        contributorId: current.currentUserId,
        note: note.trim(),
        changes,
        status: "pending",
        createdAt: nowIso(),
      };
      result = { ok: true, message: "修改建议已提交，等待管理员审核" };
      return {
        ...current,
        contributions: [contribution, ...current.contributions],
        auditLogs: [
          createAudit(current.currentUserId, "contribution.submitted", "card", cardUuid, `提交卡片协作修改建议`),
          ...current.auditLogs,
        ],
      };
    });
    return result;
  }, []);

  const reviewContribution = useCallback((id: string, decision: "approved" | "rejected", comment: string): StoreResult => {
    let result: StoreResult = { ok: false, message: "协作修改审核失败" };
    setState((current) => {
      const contribution = current.contributions.find((item) => item.id === id);
      if (!contribution) {
        result = { ok: false, message: "修改建议不存在" };
        return current;
      }
      if (contribution.status !== "pending") {
        result = { ok: false, message: "该修改建议已经处理" };
        return current;
      }
      const reviewedAt = nowIso();
      result = { ok: true, message: decision === "approved" ? "修改建议已通过" : "修改建议已拒绝" };
      return {
        ...current,
        contributions: current.contributions.map((item) =>
          item.id === id
            ? {
                ...item,
                status: decision,
                reviewedBy: current.currentUserId ?? undefined,
                reviewComment: comment.trim() || undefined,
                reviewedAt,
              }
            : item,
        ),
        cards: decision === "approved"
          ? current.cards.map((card) => {
              if (card.uuid !== contribution.cardUuid) return card;
              const contributorIds = new Set(card.contributorIds ?? []);
              if (card.ownerId !== contribution.contributorId) contributorIds.add(contribution.contributorId);
              return {
                ...card,
                ...contribution.changes,
                contributorIds: [...contributorIds],
                updatedAt: reviewedAt,
              };
            })
          : current.cards,
        auditLogs: [
          createAudit(
            current.currentUserId,
            `contribution.${decision}`,
            "card",
            contribution.cardUuid,
            decision === "approved" ? "通过卡片协作修改并增加贡献者" : "拒绝卡片协作修改",
          ),
          ...current.auditLogs,
        ],
      };
    });
    return result;
  }, []);

  const addMedia = useCallback((asset: Omit<MediaAsset, "uuid" | "createdAt">) => {
    const nextAsset: MediaAsset = { ...asset, uuid: uid(), createdAt: nowIso() };
    setState((current) => ({
      ...current,
      media: [nextAsset, ...current.media],
      auditLogs: [
        createAudit(current.currentUserId, "media.created", "media", nextAsset.uuid, `新增媒体「${nextAsset.name}」`),
        ...current.auditLogs,
      ],
    }));
    return nextAsset;
  }, []);

  const removeMedia = useCallback((uuid: string): StoreResult => {
    let result: StoreResult = { ok: true, message: "媒体已从演示库移除" };
    setState((current) => {
      const used = current.cards.some((card) => card.mediaIds.includes(uuid));
      if (used) {
        result = { ok: false, message: "该媒体仍被卡片引用，不能删除" };
        return current;
      }
      const asset = current.media.find((candidate) => candidate.uuid === uuid);
      return {
        ...current,
        media: current.media.filter((candidate) => candidate.uuid !== uuid),
        auditLogs: asset
          ? [
              createAudit(current.currentUserId, "media.deleted", "media", uuid, `删除媒体「${asset.name}」`),
              ...current.auditLogs,
            ]
          : current.auditLogs,
      };
    });
    return result;
  }, []);

  const updateMedia = useCallback((uuid: string, patch: Partial<Pick<MediaAsset, "name" | "mimeType" | "size" | "ownerId" | "tone" | "pattern" | "preview">>): StoreResult => {
    let result: StoreResult = { ok: false, message: "媒体更新失败" };
    setState((current) => {
      const asset = current.media.find((candidate) => candidate.uuid === uuid);
      if (!asset) {
        result = { ok: false, message: "媒体不存在" };
        return current;
      }
      const nextName = patch.name?.trim() ?? asset.name;
      if (!nextName) {
        result = { ok: false, message: "媒体名称不能为空" };
        return current;
      }
      if (patch.ownerId !== undefined && !current.users.some((user) => user.id === patch.ownerId && user.status !== "deleted")) {
        result = { ok: false, message: "媒体所有者无效" };
        return current;
      }
      if (patch.size !== undefined && patch.size < 0) {
        result = { ok: false, message: "文件大小不能为负数" };
        return current;
      }
      result = { ok: true, message: "媒体元数据已保存" };
      return {
        ...current,
        media: current.media.map((candidate) => candidate.uuid === uuid ? { ...candidate, ...patch, name: nextName } : candidate),
        auditLogs: [
          createAudit(current.currentUserId, "media.updated", "media", uuid, `更新媒体「${nextName}」`),
          ...current.auditLogs,
        ],
      };
    });
    return result;
  }, []);

  const updateProfile = useCallback((patch: Partial<User>): StoreResult => {
    let result: StoreResult = { ok: true, message: "个人资料已更新" };
    setState((current) => {
      if (!current.currentUserId) {
        result = { ok: false, message: "请先登录" };
        return current;
      }
      if (patch.username) {
        if (isNumericUsername(patch.username)) {
          result = { ok: false, message: "用户名不能是纯数字" };
          return current;
        }
        const conflict = current.users.some(
          (user) =>
            user.id !== current.currentUserId &&
            user.username.toLowerCase() === patch.username!.trim().toLowerCase(),
        );
        if (conflict) {
          result = { ok: false, message: "用户名已被使用" };
          return current;
        }
      }
      if (patch.email) {
        const conflict = current.users.some(
          (user) =>
            user.id !== current.currentUserId &&
            user.email.toLowerCase() === patch.email!.trim().toLowerCase(),
        );
        if (conflict) {
          result = { ok: false, message: "邮箱已被使用" };
          return current;
        }
      }
      if (patch.slug) {
        const conflict = current.users.some(
          (user) =>
            user.id !== current.currentUserId &&
            user.slug.toLowerCase() === patch.slug!.trim().toLowerCase(),
        );
        if (conflict) {
          result = { ok: false, message: "主页地址已被使用" };
          return current;
        }
      }
      return {
        ...current,
        users: current.users.map((user) =>
          user.id === current.currentUserId ? { ...user, ...patch } : user,
        ),
        auditLogs: [
          createAudit(current.currentUserId, "profile.updated", "user", String(current.currentUserId), "更新个人资料"),
          ...current.auditLogs,
        ],
      };
    });
    return result;
  }, []);

  const updateSettings = useCallback((patch: Partial<SiteSettings>) => {
    setState((current) => ({
      ...current,
      settings: { ...current.settings, ...patch },
      auditLogs: [
        createAudit(current.currentUserId, "settings.updated", "site_settings", "main", "更新站点设置"),
        ...current.auditLogs,
      ],
    }));
  }, []);

  const updateRole = useCallback((roleId: string, patch: Partial<Role>) => {
    setState((current) => ({
      ...current,
      roles: current.roles.map((role) => (role.id === roleId ? { ...role, ...patch } : role)),
      auditLogs: [
        createAudit(current.currentUserId, "role.updated", "role", roleId, "更新角色权限"),
        ...current.auditLogs,
      ],
    }));
  }, []);

  const createRole = useCallback((name: string, slug: string, description: string): StoreResult => {
    const normalized = name.trim();
    if (!normalized) return { ok: false, message: "请填写用户组名称" };
    const normalizedSlug = slugify(slug.trim() || normalized);
    if (!normalizedSlug) return { ok: false, message: "请填写有效用户组 slug" };
    let result: StoreResult = { ok: true, message: "用户组已创建" };
    setState((current) => {
      if (current.roles.some((role) => role.name.toLowerCase() === normalized.toLowerCase())) {
        result = { ok: false, message: "用户组名称已存在" };
        return current;
      }
      if (current.roles.some((role) => role.slug.toLowerCase() === normalizedSlug.toLowerCase())) {
        result = { ok: false, message: "用户组 slug 已存在" };
        return current;
      }
      const role: Role = {
        id: normalizedSlug,
        uuid: uid(),
        name: normalized,
        slug: normalizedSlug,
        description: description.trim() || "自定义用户组",
        permissions: [],
      };
      return {
        ...current,
        roles: [...current.roles, role],
        auditLogs: [
          createAudit(current.currentUserId, "role.created", "role", role.id, `创建用户组「${role.name}」`),
          ...current.auditLogs,
        ],
      };
    });
    return result;
  }, []);

  const deleteRole = useCallback((roleId: string): StoreResult => {
    let result: StoreResult = { ok: true, message: "用户组已删除" };
    setState((current) => {
      const role = current.roles.find((item) => item.id === roleId);
      if (!role) {
        result = { ok: false, message: "用户组不存在" };
        return current;
      }
      if (role.isSystem) {
        result = { ok: false, message: "系统用户组不能删除" };
        return current;
      }
      if (current.users.some((user) => user.roleIds.includes(roleId))) {
        result = { ok: false, message: "仍有用户使用该用户组，不能删除" };
        return current;
      }
      return {
        ...current,
        roles: current.roles.filter((item) => item.id !== roleId),
        auditLogs: [
          createAudit(current.currentUserId, "role.deleted", "role", roleId, `删除用户组「${role.name}」`),
          ...current.auditLogs,
        ],
      };
    });
    return result;
  }, []);

  const updateUser = useCallback((userId: number, patch: Partial<User>) => {
    setState((current) => ({
      ...current,
      users: current.users.map((user) => (user.id === userId ? { ...user, ...patch } : user)),
      auditLogs: [
        createAudit(current.currentUserId, "user.updated", "user", String(userId), "更新用户状态"),
        ...current.auditLogs,
      ],
    }));
  }, []);

  const createUser = useCallback((input: AdminUserInput): StoreResult & { uuid?: string } => {
    let result: StoreResult & { uuid?: string } = { ok: false, message: "用户创建失败" };
    setState((current) => {
      const error = validateUserInput(current.users, current.roles, input);
      if (error) {
        result = { ok: false, message: error };
        return current;
      }
      const user: User = {
        ...input,
        id: Math.max(0, ...current.users.map((candidate) => candidate.id)) + 1,
        uuid: uid(),
        username: input.username.trim(),
        email: input.email.trim().toLowerCase(),
        displayName: input.displayName.trim(),
        slug: input.slug.trim().toLowerCase(),
        bio: input.bio.trim(),
        joinedAt: input.joinedAt || nowIso(),
      };
      result = { ok: true, message: `用户「${user.displayName}」已创建`, uuid: user.uuid };
      return {
        ...current,
        users: [...current.users, user],
        auditLogs: [
          createAudit(current.currentUserId, "user.created", "user", user.uuid, `后台新增用户「${user.displayName}」`),
          ...current.auditLogs,
        ],
      };
    });
    return result;
  }, []);

  const saveUser = useCallback((userId: number, input: AdminUserInput): StoreResult => {
    let result: StoreResult = { ok: false, message: "用户更新失败" };
    setState((current) => {
      const user = current.users.find((candidate) => candidate.id === userId);
      if (!user) {
        result = { ok: false, message: "用户不存在" };
        return current;
      }
      const error = validateUserInput(current.users, current.roles, input, userId);
      if (error) {
        result = { ok: false, message: error };
        return current;
      }
      result = { ok: true, message: "用户信息已保存" };
      return {
        ...current,
        users: current.users.map((candidate) =>
          candidate.id === userId
            ? {
                ...candidate,
                ...input,
                username: input.username.trim(),
                email: input.email.trim().toLowerCase(),
                displayName: input.displayName.trim(),
                slug: input.slug.trim().toLowerCase(),
                bio: input.bio.trim(),
                joinedAt: input.joinedAt || candidate.joinedAt,
              }
            : candidate,
        ),
        auditLogs: [
          createAudit(current.currentUserId, "user.updated", "user", user.uuid, `编辑用户「${input.displayName.trim()}」`),
          ...current.auditLogs,
        ],
      };
    });
    return result;
  }, []);

  const deleteUser = useCallback((userId: number): StoreResult => {
    let result: StoreResult = { ok: false, message: "用户删除失败" };
    setState((current) => {
      const user = current.users.find((candidate) => candidate.id === userId);
      if (!user) {
        result = { ok: false, message: "用户不存在" };
        return current;
      }
      if (current.currentUserId === userId) {
        result = { ok: false, message: "不能删除当前登录账号" };
        return current;
      }
      result = { ok: true, message: `用户「${user.displayName}」已删除` };
      return {
        ...current,
        users: current.users.map((candidate) =>
          candidate.id === userId
            ? {
                ...candidate,
                status: "deleted",
                displayName: "账号已注销",
                username: releasedDeletedValue(candidate.username, "username", current.users, userId),
                email: releasedDeletedValue(candidate.email, "email", current.users, userId),
                slug: releasedDeletedValue(candidate.slug, "slug", current.users, userId),
                profileVisibility: "private",
                showSubmissions: false,
                deletedAt: nowIso(),
              }
            : candidate,
        ),
        auditLogs: [
          createAudit(current.currentUserId, "user.deleted", "user", user.uuid, `删除用户「${user.displayName}」`),
          ...current.auditLogs,
        ],
      };
    });
    return result;
  }, []);

  const changePassword = useCallback((userId: number, password: string): StoreResult => {
    if (password.length < 8) return { ok: false, message: "密码至少需要 8 个字符" };
    let result: StoreResult = { ok: false, message: "密码修改失败" };
    setState((current) => {
      const user = current.users.find((candidate) => candidate.id === userId);
      if (!user) {
        result = { ok: false, message: "用户不存在" };
        return current;
      }
      result = { ok: true, message: "密码已更新" };
      return {
        ...current,
        users: current.users.map((candidate) =>
          candidate.id === userId ? { ...candidate, passwordUpdatedAt: nowIso() } : candidate,
        ),
        auditLogs: [
          createAudit(current.currentUserId, "user.password_changed", "user", user.uuid, `修改用户「${user.displayName}」的密码`),
          ...current.auditLogs,
        ],
      };
    });
    return result;
  }, []);

  const addDictionaryItem = useCallback((item: Omit<DictionaryItem, "id" | "slug" | "active">): StoreResult => {
    let result: StoreResult = { ok: false, message: "字典项新增失败" };
    setState((current) => {
      if (current.dictionaries.some((candidate) =>
        candidate.type === item.type &&
        candidate.label.toLowerCase() === item.label.trim().toLowerCase() &&
        (item.type !== "level" || candidate.parentId === item.parentId)
      )) {
        result = { ok: false, message: "当前分类中已存在同名项目" };
        return current;
      }
      if (item.type === "level" && !item.parentId) {
        result = { ok: false, message: "卡片等级必须选择所属卡组织" };
        return current;
      }
      const nextItem = {
        ...item,
        id: nextDictionaryId(item.type, item.label, current.dictionaries),
        slug: slugify(item.label),
        active: true,
      };
      result = { ok: true, message: "字典项已添加" };
      return {
        ...current,
        dictionaries: [...current.dictionaries, nextItem],
        auditLogs: [
          createAudit(current.currentUserId, "dictionary.created", "dictionary", nextItem.id, `新增字典项「${nextItem.label}」`),
          ...current.auditLogs,
        ],
      };
    });
    return result;
  }, []);

  const updateDictionaryItem = useCallback((id: string, patch: Partial<Pick<DictionaryItem, "label" | "slug" | "description" | "type" | "active" | "parentId">>): StoreResult => {
    let result: StoreResult = { ok: false, message: "字典项更新失败" };
    setState((current) => {
      const item = current.dictionaries.find((candidate) => candidate.id === id);
      if (!item) {
        result = { ok: false, message: "字典项不存在" };
        return current;
      }
      const nextLabel = patch.label?.trim() ?? item.label;
      const nextType = patch.type ?? item.type;
      const nextSlug = patch.slug?.trim() || (patch.label ? slugify(nextLabel) : item.slug);
      const nextParentId = nextType === "level" ? patch.parentId ?? item.parentId : undefined;
      if (!nextLabel) {
        result = { ok: false, message: "字典项名称不能为空" };
        return current;
      }
      if (!nextSlug) {
        result = { ok: false, message: "字典项 slug 不能为空" };
        return current;
      }
      if (nextType === "level" && (!nextParentId || !current.dictionaries.some((candidate) => candidate.id === nextParentId && candidate.type === "network"))) {
        result = { ok: false, message: "卡片等级必须关联有效卡组织" };
        return current;
      }
      if (current.dictionaries.some((candidate) =>
        candidate.id !== id &&
        candidate.type === nextType &&
        candidate.label.toLowerCase() === nextLabel.toLowerCase() &&
        (nextType !== "level" || candidate.parentId === nextParentId)
      )) {
        result = { ok: false, message: "当前分类中已存在同名项目" };
        return current;
      }
      const fieldByType: Record<DictionaryItem["type"], keyof Card> = { issuer: "issuerId", network: "networkId", cardType: "cardTypeId", level: "levelId" };
      if (nextType !== item.type && current.cards.some((card) => card[fieldByType[item.type]] === id)) {
        result = { ok: false, message: "被卡片引用的字典项不能修改分类" };
        return current;
      }
      result = { ok: true, message: "字典项已保存" };
      return {
        ...current,
        dictionaries: current.dictionaries.map((candidate) => candidate.id === id ? { ...candidate, ...patch, label: nextLabel, type: nextType, slug: nextSlug, parentId: nextParentId } : candidate),
        auditLogs: [
          createAudit(current.currentUserId, "dictionary.updated", "dictionary", id, `更新字典项「${nextLabel}」`),
          ...current.auditLogs,
        ],
      };
    });
    return result;
  }, []);

  const toggleDictionaryItem = useCallback((id: string) => {
    setState((current) => {
      const item = current.dictionaries.find((candidate) => candidate.id === id);
      return {
        ...current,
        dictionaries: current.dictionaries.map((candidate) =>
          candidate.id === id ? { ...candidate, active: !candidate.active } : candidate,
        ),
        auditLogs: item
          ? [
              createAudit(current.currentUserId, "dictionary.toggled", "dictionary", id, `${item.active ? "停用" : "启用"}字典项「${item.label}」`),
              ...current.auditLogs,
            ]
          : current.auditLogs,
      };
    });
  }, []);

  const removeDictionaryItem = useCallback((id: string): StoreResult => {
    let result: StoreResult = { ok: true, message: "字典项已删除" };
    setState((current) => {
      const item = current.dictionaries.find((candidate) => candidate.id === id);
      if (!item) {
        result = { ok: false, message: "字典项不存在" };
        return current;
      }
      const fieldByType: Record<DictionaryItem["type"], keyof Card> = {
        issuer: "issuerId",
        network: "networkId",
        cardType: "cardTypeId",
        level: "levelId",
      };
      const field = fieldByType[item.type];
      const childLevels = item.type === "network"
        ? current.dictionaries.filter((candidate) => candidate.type === "level" && candidate.parentId === id)
        : [];
      const targetIds = new Set([id, ...childLevels.map((level) => level.id)]);
      const referenced = current.cards.some((card) =>
        card[field] === id || childLevels.some((level) => card.levelId === level.id),
      );
      if (referenced) {
        result = { ok: false, message: "该字典项仍被卡片引用，不能删除" };
        return current;
      }
      result = childLevels.length
        ? { ok: true, message: `卡组织及其 ${childLevels.length} 个下属等级已删除` }
        : { ok: true, message: "字典项已删除" };
      return {
        ...current,
        dictionaries: current.dictionaries.filter((candidate) => !targetIds.has(candidate.id)),
        auditLogs: [
          createAudit(
            current.currentUserId,
            "dictionary.deleted",
            "dictionary",
            id,
            childLevels.length
              ? `删除卡组织「${item.label}」及其 ${childLevels.length} 个下属等级`
              : `删除字典项「${item.label}」`,
          ),
          ...current.auditLogs,
        ],
      };
    });
    return result;
  }, []);

  const isFieldVisible = useCallback(
    (card: Card, field: CardField, viewer: User | null = currentUser) => {
      if (!viewer) {
        const rules = card.visibilityOverrides[field] ?? state.settings.fieldDefaults[field] ?? [];
        return rules.includes("guest");
      }
      const permissions = permissionsFor(viewer, state.roles);
      if (
        permissions.has("cards.update") ||
        permissions.has("submissions.review") ||
        viewer.id === card.ownerId
      ) {
        return true;
      }
      const rules =
        card.visibilityOverrides[field] ?? state.settings.fieldDefaults[field] ?? [];
      return rules.some((principal: VisibilityPrincipal) => {
        if (principal === "guest" || principal === "authenticated") return true;
        if (principal === "owner") return viewer.id === card.ownerId;
        if (principal === "admin") return permissions.has("settings.update");
        if (principal.startsWith("role:")) return viewer.roleIds.includes(principal.slice(5));
        return false;
      });
    },
    [currentUser, state.roles, state.settings.fieldDefaults],
  );

  const isProfileVisible = useCallback(
    (profile: User, viewer: User | null = currentUser) => {
      if (profile.status === "deleted") return false;
      if (viewer?.id === profile.id) return true;
      if (viewer) {
        const permissions = permissionsFor(viewer, state.roles);
        if (permissions.has("users.update")) return true;
      }
      if (profile.profileVisibility === "public") return true;
      if (profile.profileVisibility === "authenticated") return Boolean(viewer);
      return false;
    },
    [currentUser, state.roles],
  );

  const value: DemoStoreValue = {
    state,
    currentUser,
    can,
    login,
    logout,
    switchSession,
    register,
    setTheme,
    resetDemo,
    completeSetup,
    createDraft,
    createCard,
    updateCard,
    submitCard,
    reviewCard,
    setCardStatus,
    toggleFeatured,
    deleteCard,
    toggleLike,
    recordCardDownload,
    createContribution,
    reviewContribution,
    addMedia,
    removeMedia,
    updateMedia,
    updateProfile,
    updateSettings,
    updateRole,
    createRole,
    deleteRole,
    createUser,
    saveUser,
    deleteUser,
    changePassword,
    updateUser,
    addDictionaryItem,
    updateDictionaryItem,
    toggleDictionaryItem,
    removeDictionaryItem,
    isFieldVisible,
    isProfileVisible,
  };

  return <DemoStoreContext.Provider value={value}>{children}</DemoStoreContext.Provider>;
}

export function useDemoStore() {
  const context = useContext(DemoStoreContext);
  if (!context) throw new Error("useDemoStore must be used inside DemoProvider");
  return context;
}

export function useDictionary() {
  const { state } = useDemoStore();
  return useCallback(
    (id?: string) => state.dictionaries.find((item) => item.id === id)?.label ?? "未填写",
    [state.dictionaries],
  );
}

export function visibilityLabel(principals: VisibilityPrincipal[], roles: Role[]) {
  if (!principals.length) return "仅管理员";
  const labels: string[] = [];
  if (principals.includes("guest")) labels.push("所有人");
  if (principals.includes("authenticated")) labels.push("已登录");
  if (principals.includes("owner")) labels.push("作者");
  if (principals.includes("admin")) labels.push("管理员");
  principals
    .filter((principal) => principal.startsWith("role:"))
    .forEach((principal) => {
      const role = roles.find((item) => item.id === principal.slice(5));
      if (role) labels.push(role.name);
    });
  return labels.join(" · ");
}

export function profileVisibilityLabel(value: ProfileVisibility) {
  if (value === "public") return "所有人可见";
  if (value === "authenticated") return "登录后可见";
  return "仅自己可见";
}
