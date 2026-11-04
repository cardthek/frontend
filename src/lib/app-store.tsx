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
import { usePathname, useRouter } from "next/navigation";
import {
  apiRequest,
  refreshAccessToken,
  setAccessToken,
  toApiError,
  type AuthSession,
} from "@/lib/api-client";
import type {
  AdminCardInput,
  AdminUserInput,
  AppState,
  AuditLog,
  Card,
  CardContribution,
  CardDraftInput,
  CardField,
  ContributionChanges,
  DictionaryItem,
  MediaAsset,
  PermissionKey,
  ProfileVisibility,
  RegistrationInput,
  ReviewRecord,
  Role,
  SiteSettings,
  ThemeId,
  User,
  VisibilityPrincipal,
} from "@/lib/types";

export interface StoreResult {
  ok: boolean;
  message: string;
}

interface BootstrapPayload {
  installed: boolean;
  settings: SiteSettings | null;
  theme: ThemeId;
  currentUser: User | null;
  roles: Role[];
  users: User[];
  cards: Card[];
  media: MediaAsset[];
  dictionaries: DictionaryItem[];
  contributions: CardContribution[];
  reviews: ReviewRecord[];
  auditLogs: AuditLog[];
}

interface SetupInput {
  siteName: string;
  tagline: string;
  siteUrl: string;
  displayName: string;
  username: string;
  email: string;
  password: string;
  theme: ThemeId;
}

interface AppStoreValue {
  state: AppState;
  currentUser: User | null;
  ready: boolean;
  error: string | null;
  can: (permission: PermissionKey) => boolean;
  refresh: () => Promise<void>;
  login: (identifier: string, password: string) => Promise<StoreResult>;
  logout: () => Promise<void>;
  register: (input: RegistrationInput) => Promise<StoreResult>;
  setTheme: (theme: ThemeId) => void;
  completeSetup: (input: SetupInput) => Promise<StoreResult>;
  createDraft: (input: CardDraftInput, ownerId?: number) => Promise<Card>;
  createCard: (input: AdminCardInput) => Promise<Card>;
  updateCard: (uuid: string, patch: Partial<Card>) => Promise<void>;
  submitCard: (uuid: string) => Promise<void>;
  reviewCard: (
    uuid: string,
    decision: "approved" | "rejected" | "changes_requested",
    comment: string,
  ) => Promise<void>;
  setCardStatus: (uuid: string, status: Card["status"]) => Promise<void>;
  toggleFeatured: (uuid: string) => Promise<void>;
  deleteCard: (uuid: string) => Promise<void>;
  toggleLike: (uuid: string) => Promise<StoreResult>;
  recordCardDownload: (uuid: string) => Promise<void>;
  createContribution: (
    cardUuid: string,
    changes: ContributionChanges,
    note: string,
  ) => Promise<StoreResult>;
  reviewContribution: (
    id: string,
    decision: "approved" | "rejected",
    comment: string,
  ) => Promise<StoreResult>;
  uploadMedia: (file: File) => Promise<StoreResult & { asset?: MediaAsset }>;
  removeMedia: (uuid: string) => Promise<StoreResult>;
  updateMedia: (
    uuid: string,
    patch: Partial<
      Pick<
        MediaAsset,
        "name" | "mimeType" | "size" | "ownerId" | "tone" | "pattern" | "preview"
      >
    >,
  ) => Promise<StoreResult>;
  updateProfile: (patch: Partial<User>) => Promise<StoreResult>;
  updateSettings: (patch: Partial<SiteSettings>) => Promise<StoreResult>;
  updateRole: (roleId: string, patch: Partial<Role>) => Promise<void>;
  createRole: (
    name: string,
    slug: string,
    description: string,
  ) => Promise<StoreResult>;
  deleteRole: (roleId: string) => Promise<StoreResult>;
  createUser: (
    input: AdminUserInput,
  ) => Promise<StoreResult & { uuid?: string }>;
  saveUser: (userId: number, input: AdminUserInput) => Promise<StoreResult>;
  deleteUser: (userId: number) => Promise<StoreResult>;
  changePassword: (userId: number, password: string) => Promise<StoreResult>;
  updateUser: (userId: number, patch: Partial<User>) => Promise<void>;
  addDictionaryItem: (
    item: Omit<DictionaryItem, "id" | "slug" | "active">,
  ) => Promise<StoreResult>;
  updateDictionaryItem: (
    id: string,
    patch: Partial<
      Pick<
        DictionaryItem,
        "label" | "slug" | "description" | "type" | "active" | "parentId"
      >
    >,
  ) => Promise<StoreResult>;
  toggleDictionaryItem: (id: string) => Promise<StoreResult>;
  removeDictionaryItem: (id: string) => Promise<StoreResult>;
  isFieldVisible: (
    card: Card,
    field: CardField,
    viewer?: User | null,
  ) => boolean;
  isProfileVisible: (profile: User, viewer?: User | null) => boolean;
}

const defaultVisibility: Card["visibilityOverrides"] = {};
const emptySettings: SiteSettings = {
  installed: false,
  siteName: "cardthek",
  tagline: "银行卡卡面档案",
  description: "",
  registrationMode: "open",
  emailVerification: false,
  maxImages: 20,
  maxImageSizeMb: 15,
  fieldDefaults: {
    title: ["guest"],
    bin: ["guest"],
    issuer: ["guest"],
    network: ["guest"],
    cardType: ["guest"],
    level: ["guest"],
    country: ["guest"],
    currency: ["guest"],
    releaseYear: ["guest"],
    tags: ["guest"],
    description: ["guest"],
    gallery: ["guest"],
    source: ["authenticated"],
  },
};

const emptyState: AppState = {
  settings: emptySettings,
  users: [],
  roles: [],
  cards: [],
  media: [],
  reviews: [],
  contributions: [],
  dictionaries: [],
  auditLogs: [],
  currentUserId: null,
  theme: "natural",
};

const AppStoreContext = createContext<AppStoreValue | null>(null);

function normalizeMedia(asset: MediaAsset): MediaAsset {
  return {
    ...asset,
    tone: asset.tone ?? "sand",
    pattern: asset.pattern ?? "orbit",
  };
}

function normalizeBootstrap(payload: BootstrapPayload): AppState {
  const media = payload.media.map(normalizeMedia);
  const settings = payload.settings ?? emptySettings;
  return {
    settings,
    roles: payload.roles,
    users: payload.users,
    cards: payload.cards.map((card) => ({
      ...card,
      title: card.title || "未命名卡片",
      issuerId: card.issuerId ?? "",
      networkId: card.networkId ?? "",
      cardTypeId: card.cardTypeId ?? "",
      currencyCodes: card.currencyCodes ?? [],
      tags: card.tags ?? [],
      mediaIds: card.mediaIds ?? [],
      visibilityOverrides: card.visibilityOverrides ?? defaultVisibility,
      featured: card.featured ?? false,
      status: card.status ?? "draft",
    })),
    media,
    reviews: payload.reviews ?? [],
    contributions: payload.contributions,
    dictionaries: payload.dictionaries,
    auditLogs: payload.auditLogs,
    currentUserId: payload.currentUser?.id ?? null,
    theme: payload.theme,
  };
}

function permissionsFor(user: User | null, roles: Role[]) {
  if (!user || user.status !== "active") return new Set<PermissionKey>();
  const roleMap = new Map(roles.map((role) => [role.id, role]));
  return new Set(
    user.roleIds.flatMap((roleId) => roleMap.get(roleId)?.permissions ?? []),
  );
}

function errorMessage(error: unknown) {
  return toApiError(error).message;
}

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [state, setState] = useState<AppState>(emptyState);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const payload = await apiRequest<BootstrapPayload>("/bootstrap");
      const next = normalizeBootstrap(payload.data);
      setState(next);
      setError(null);
      document.documentElement.dataset.theme = next.theme;
    } catch (refreshError) {
      setError(errorMessage(refreshError));
      throw refreshError;
    }
  }, []);

  useEffect(() => {
    let active = true;
    async function boot() {
      try {
        await refreshAccessToken();
        const payload = await apiRequest<BootstrapPayload>("/bootstrap");
        if (!active) return;
        const next = normalizeBootstrap(payload.data);
        setState(next);
        document.documentElement.dataset.theme = next.theme;
        setError(null);
      } catch (bootError) {
        if (active) setError(errorMessage(bootError));
      } finally {
        if (active) setReady(true);
      }
    }
    void boot();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (ready && !state.settings.installed && pathname !== "/setup") {
      router.replace("/setup");
    }
  }, [pathname, ready, router, state.settings.installed]);

  const currentUser = useMemo(
    () => state.users.find((user) => user.id === state.currentUserId) ?? null,
    [state.currentUserId, state.users],
  );
  const permissions = useMemo(
    () => permissionsFor(currentUser, state.roles),
    [currentUser, state.roles],
  );
  const can = useCallback(
    (permission: PermissionKey) => permissions.has(permission),
    [permissions],
  );

  const setTheme = useCallback((theme: ThemeId) => {
    setState((current) => ({ ...current, theme }));
    document.documentElement.dataset.theme = theme;
  }, []);

  const authenticate = useCallback(
    async (session: AuthSession, message: string) => {
      setAccessToken(session.accessToken);
      await refresh();
      return { ok: true, message };
    },
    [refresh],
  );

  const login = useCallback(
    async (identifier: string, password: string): Promise<StoreResult> => {
      try {
        const payload = await apiRequest<AuthSession>("/auth/login", {
          method: "POST",
          body: { identifier, password },
          auth: false,
        });
        return authenticate(
          payload.data,
          `欢迎回来，${(payload.data.user as User).displayName}`,
        );
      } catch (loginError) {
        return { ok: false, message: errorMessage(loginError) };
      }
    },
    [authenticate],
  );

  const logout = useCallback(async () => {
    try {
      await apiRequest("/auth/logout", { method: "POST" });
    } finally {
      setAccessToken(null);
      await refresh().catch(() => {});
    }
  }, [refresh]);

  const register = useCallback(
    async (input: RegistrationInput): Promise<StoreResult> => {
      try {
        const payload = await apiRequest<AuthSession>("/auth/register", {
          method: "POST",
          body: input,
          auth: false,
        });
        return authenticate(payload.data, "账号创建成功");
      } catch (registerError) {
        return { ok: false, message: errorMessage(registerError) };
      }
    },
    [authenticate],
  );

  const completeSetup = useCallback(
    async (input: SetupInput): Promise<StoreResult> => {
      try {
        const payload = await apiRequest<AuthSession>("/setup", {
          method: "POST",
          body: input,
          auth: false,
        });
        return authenticate(payload.data, "站点初始化完成");
      } catch (setupError) {
        return { ok: false, message: errorMessage(setupError) };
      }
    },
    [authenticate],
  );

  const createDraft = useCallback(
    async (input: CardDraftInput, ownerId?: number) => {
      const owner = state.users.find(
        (user) => user.id === (ownerId ?? currentUser?.id),
      );
      const payload = await apiRequest<Card>("/cards", {
        method: "POST",
        body: {
          ...input,
          submit: false,
          ...(owner ? { ownerUuid: owner.uuid } : {}),
        },
      });
      await refresh();
      return payload.data;
    },
    [currentUser?.id, refresh, state.users],
  );

  const createCard = useCallback(
    async (input: AdminCardInput) => {
      const owner = state.users.find((user) => user.id === input.ownerId);
      const payload = await apiRequest<Card>("/cards", {
        method: "POST",
        body: {
          ...input,
          submit: false,
          ownerUuid: owner?.uuid,
        },
      });
      await refresh();
      return payload.data;
    },
    [refresh, state.users],
  );

  const updateCard = useCallback(
    async (uuid: string, patch: Partial<Card>) => {
      await apiRequest<Card>(`/cards/${uuid}`, {
        method: "PATCH",
        body: patch,
      });
      await refresh();
    },
    [refresh],
  );

  const submitCard = useCallback(
    async (uuid: string) => {
      await apiRequest(`/cards/${uuid}/submit`, { method: "POST" });
      await refresh();
    },
    [refresh],
  );

  const reviewCard = useCallback(
    async (
      uuid: string,
      decision: "approved" | "rejected" | "changes_requested",
      comment: string,
    ) => {
      await apiRequest(`/cards/${uuid}/reviews`, {
        method: "POST",
        body: { decision, comment },
      });
      await refresh();
    },
    [refresh],
  );

  const setCardStatus = useCallback(
    async (uuid: string, status: Card["status"]) => {
      await apiRequest(`/cards/${uuid}`, {
        method: "PATCH",
        body: { status },
      });
      await refresh();
    },
    [refresh],
  );

  const toggleFeatured = useCallback(
    async (uuid: string) => {
      const card = state.cards.find((item) => item.uuid === uuid);
      if (!card) return;
      await apiRequest(`/cards/${uuid}`, {
        method: "PATCH",
        body: { featured: !card.featured },
      });
      await refresh();
    },
    [refresh, state.cards],
  );

  const deleteCard = useCallback(
    async (uuid: string) => {
      await apiRequest(`/cards/${uuid}`, { method: "DELETE" });
      await refresh();
    },
    [refresh],
  );

  const toggleLike = useCallback(
    async (uuid: string): Promise<StoreResult> => {
      const card = state.cards.find((item) => item.uuid === uuid);
      const liked = Boolean(
        currentUser &&
          (card?.likedByUserIds?.includes(currentUser.id) ||
            card?.likedByCurrentUser),
      );
      try {
        const payload = await apiRequest<{
          liked: boolean;
          likeCount: number;
        }>(`/cards/${uuid}/like`, {
          method: liked ? "DELETE" : "PUT",
        });
        setState((current) => ({
          ...current,
          cards: current.cards.map((item) =>
            item.uuid === uuid
              ? {
                  ...item,
                  likeCount: payload.data.likeCount,
                  likedByUserIds: payload.data.liked
                    ? [
                        ...new Set([
                          ...(item.likedByUserIds ?? []),
                          ...(currentUser ? [currentUser.id] : []),
                        ]),
                      ]
                    : (item.likedByUserIds ?? []).filter(
                        (id) => id !== currentUser?.id,
                      ),
                }
              : item,
          ),
        }));
        return {
          ok: true,
          message: payload.data.liked ? "已添加到喜欢" : "已取消喜欢",
        };
      } catch (likeError) {
        return { ok: false, message: errorMessage(likeError) };
      }
    },
    [currentUser, state.cards],
  );

  const recordCardDownload = useCallback(async (uuid: string) => {
    try {
      const payload = await apiRequest<{ downloadCount: number }>(
        `/cards/${uuid}/downloads`,
        { method: "POST" },
      );
      setState((current) => ({
        ...current,
        cards: current.cards.map((card) =>
          card.uuid === uuid
            ? { ...card, downloadCount: payload.data.downloadCount }
            : card,
        ),
      }));
    } catch {
      // Download counting must not interrupt the actual file download.
    }
  }, []);

  const createContribution = useCallback(
    async (
      cardUuid: string,
      changes: ContributionChanges,
      note: string,
    ): Promise<StoreResult> => {
      try {
        await apiRequest(`/cards/${cardUuid}/contributions`, {
          method: "POST",
          body: { changes, note },
        });
        await refresh();
        return { ok: true, message: "修改建议已提交审核" };
      } catch (contributionError) {
        return { ok: false, message: errorMessage(contributionError) };
      }
    },
    [refresh],
  );

  const reviewContribution = useCallback(
    async (
      id: string,
      decision: "approved" | "rejected",
      comment: string,
    ): Promise<StoreResult> => {
      try {
        await apiRequest(`/contributions/${id}`, {
          method: "PATCH",
          body: { status: decision, comment },
        });
        await refresh();
        return {
          ok: true,
          message: decision === "approved" ? "协作修改已通过" : "协作修改已拒绝",
        };
      } catch (reviewError) {
        return { ok: false, message: errorMessage(reviewError) };
      }
    },
    [refresh],
  );

  const uploadMedia = useCallback(
    async (file: File): Promise<StoreResult & { asset?: MediaAsset }> => {
      try {
        const formData = new FormData();
        formData.append("file", file);
        const payload = await apiRequest<MediaAsset>("/media", {
          method: "POST",
          body: formData,
        });
        const asset = normalizeMedia(payload.data);
        setState((current) => ({
          ...current,
          media: [...current.media, asset],
        }));
        return { ok: true, message: "卡面图片已上传", asset };
      } catch (uploadError) {
        return { ok: false, message: errorMessage(uploadError) };
      }
    },
    [],
  );

  const removeMedia = useCallback(
    async (uuid: string): Promise<StoreResult> => {
      try {
        await apiRequest(`/media/${uuid}`, { method: "DELETE" });
        setState((current) => ({
          ...current,
          media: current.media.filter((asset) => asset.uuid !== uuid),
        }));
        return { ok: true, message: "媒体已删除" };
      } catch (removeError) {
        return { ok: false, message: errorMessage(removeError) };
      }
    },
    [],
  );

  const updateMedia = useCallback(
    async (
      uuid: string,
      patch: Partial<
        Pick<
          MediaAsset,
          | "name"
          | "mimeType"
          | "size"
          | "ownerId"
          | "tone"
          | "pattern"
          | "preview"
        >
      >,
    ): Promise<StoreResult> => {
      try {
        const payload = await apiRequest<MediaAsset>(`/media/${uuid}`, {
          method: "PATCH",
          body: {
            ...(patch.name !== undefined ? { name: patch.name } : {}),
            ...(patch.ownerId !== undefined ? { ownerId: patch.ownerId } : {}),
          },
        });
        setState((current) => ({
          ...current,
          media: current.media.map((asset) =>
            asset.uuid === uuid ? normalizeMedia(payload.data) : asset,
          ),
        }));
        return { ok: true, message: "媒体信息已更新" };
      } catch (updateError) {
        return { ok: false, message: errorMessage(updateError) };
      }
    },
    [],
  );

  const updateProfile = useCallback(
    async (patch: Partial<User>): Promise<StoreResult> => {
      try {
        await apiRequest("/auth/profile", {
          method: "PATCH",
          body: {
            ...(patch.displayName !== undefined
              ? { displayName: patch.displayName }
              : {}),
            ...(patch.slug !== undefined ? { slug: patch.slug } : {}),
            ...(patch.bio !== undefined ? { bio: patch.bio } : {}),
            ...(patch.avatarTone !== undefined
              ? { avatarTone: patch.avatarTone }
              : {}),
            ...(patch.profileVisibility !== undefined
              ? { profileVisibility: patch.profileVisibility }
              : {}),
            ...(patch.showSubmissions !== undefined
              ? { showSubmissions: patch.showSubmissions }
              : {}),
          },
        });
        await refresh();
        return { ok: true, message: "个人资料已更新" };
      } catch (profileError) {
        return { ok: false, message: errorMessage(profileError) };
      }
    },
    [refresh],
  );

  const updateSettings = useCallback(
    async (patch: Partial<SiteSettings>): Promise<StoreResult> => {
      try {
        await apiRequest("/settings", { method: "PATCH", body: patch });
        await refresh();
        return { ok: true, message: "站点设置已保存" };
      } catch (settingsError) {
        return { ok: false, message: errorMessage(settingsError) };
      }
    },
    [refresh],
  );

  const updateRole = useCallback(
    async (roleId: string, patch: Partial<Role>) => {
      await apiRequest(`/roles/${roleId}`, {
        method: "PATCH",
        body: {
          ...(patch.name !== undefined ? { name: patch.name } : {}),
          ...(patch.slug !== undefined ? { slug: patch.slug } : {}),
          ...(patch.description !== undefined
            ? { description: patch.description }
            : {}),
          ...(patch.permissions !== undefined
            ? { permissions: patch.permissions }
            : {}),
        },
      });
      await refresh();
    },
    [refresh],
  );

  const createRole = useCallback(
    async (
      name: string,
      slug: string,
      description: string,
    ): Promise<StoreResult> => {
      try {
        await apiRequest("/roles", {
          method: "POST",
          body: { name, slug, description, permissions: [] },
        });
        await refresh();
        return { ok: true, message: "用户组已创建" };
      } catch (roleError) {
        return { ok: false, message: errorMessage(roleError) };
      }
    },
    [refresh],
  );

  const deleteRole = useCallback(
    async (roleId: string): Promise<StoreResult> => {
      try {
        await apiRequest(`/roles/${roleId}`, { method: "DELETE" });
        await refresh();
        return { ok: true, message: "用户组已删除" };
      } catch (roleError) {
        return { ok: false, message: errorMessage(roleError) };
      }
    },
    [refresh],
  );

  const createUser = useCallback(
    async (
      input: AdminUserInput,
    ): Promise<StoreResult & { uuid?: string }> => {
      if (!input.password) {
        return { ok: false, message: "新增用户时必须设置初始密码" };
      }
      try {
        const payload = await apiRequest<User>("/users", {
          method: "POST",
          body: {
            username: input.username,
            email: input.email,
            displayName: input.displayName,
            slug: input.slug,
            bio: input.bio,
            avatarTone: input.avatarTone,
            profileVisibility: input.profileVisibility,
            showSubmissions: input.showSubmissions,
            roleId: input.roleIds[0],
            status: input.status === "deleted" ? "suspended" : input.status,
            joinedAt: input.joinedAt,
            password: input.password,
          },
        });
        await refresh();
        return { ok: true, message: "用户已创建", uuid: payload.data.uuid };
      } catch (userError) {
        return { ok: false, message: errorMessage(userError) };
      }
    },
    [refresh],
  );

  const saveUser = useCallback(
    async (userId: number, input: AdminUserInput): Promise<StoreResult> => {
      const user = state.users.find((item) => item.id === userId);
      if (!user) return { ok: false, message: "用户不存在" };
      try {
        await apiRequest(`/users/${user.uuid}`, {
          method: "PATCH",
          body: {
            username: input.username,
            email: input.email,
            displayName: input.displayName,
            slug: input.slug,
            bio: input.bio,
            avatarTone: input.avatarTone,
            profileVisibility: input.profileVisibility,
            showSubmissions: input.showSubmissions,
            roleId: input.roleIds[0],
            status: input.status === "deleted" ? "suspended" : input.status,
            joinedAt: input.joinedAt,
          },
        });
        await refresh();
        return { ok: true, message: "用户信息已保存" };
      } catch (userError) {
        return { ok: false, message: errorMessage(userError) };
      }
    },
    [refresh, state.users],
  );

  const deleteUser = useCallback(
    async (userId: number): Promise<StoreResult> => {
      const user = state.users.find((item) => item.id === userId);
      if (!user) return { ok: false, message: "用户不存在" };
      try {
        await apiRequest(`/users/${user.uuid}`, { method: "DELETE" });
        await refresh();
        return { ok: true, message: "用户已注销，原有卡片保留" };
      } catch (userError) {
        return { ok: false, message: errorMessage(userError) };
      }
    },
    [refresh, state.users],
  );

  const changePassword = useCallback(
    async (userId: number, password: string): Promise<StoreResult> => {
      const user = state.users.find((item) => item.id === userId);
      if (!user) return { ok: false, message: "用户不存在" };
      try {
        await apiRequest(`/users/${user.uuid}/password`, {
          method: "PUT",
          body: { password },
        });
        return { ok: true, message: "密码已更新，旧会话已失效" };
      } catch (passwordError) {
        return { ok: false, message: errorMessage(passwordError) };
      }
    },
    [state.users],
  );

  const updateUser = useCallback(
    async (userId: number, patch: Partial<User>) => {
      const user = state.users.find((item) => item.id === userId);
      if (!user || !patch.status) return;
      await apiRequest(`/users/${user.uuid}`, {
        method: "PATCH",
        body: { status: patch.status },
      });
      await refresh();
    },
    [refresh, state.users],
  );

  const addDictionaryItem = useCallback(
    async (
      item: Omit<DictionaryItem, "id" | "slug" | "active">,
    ): Promise<StoreResult> => {
      try {
        await apiRequest("/dictionaries", {
          method: "POST",
          body: {
            type: item.type,
            parentId: item.parentId,
            label: item.label,
            description: item.description ?? "",
          },
        });
        await refresh();
        return { ok: true, message: "字典项已新增" };
      } catch (dictionaryError) {
        return { ok: false, message: errorMessage(dictionaryError) };
      }
    },
    [refresh],
  );

  const updateDictionaryItem = useCallback(
    async (
      id: string,
      patch: Partial<
        Pick<
          DictionaryItem,
          "label" | "slug" | "description" | "type" | "active" | "parentId"
        >
      >,
    ): Promise<StoreResult> => {
      try {
        await apiRequest(`/dictionaries/${id}`, {
          method: "PATCH",
          body: {
            ...(patch.label !== undefined ? { label: patch.label } : {}),
            ...(patch.slug !== undefined ? { slug: patch.slug } : {}),
            ...(patch.description !== undefined
              ? { description: patch.description }
              : {}),
            ...(patch.active !== undefined ? { active: patch.active } : {}),
            ...(patch.parentId !== undefined
              ? { parentId: patch.parentId }
              : {}),
          },
        });
        await refresh();
        return { ok: true, message: "字典项已更新" };
      } catch (dictionaryError) {
        return { ok: false, message: errorMessage(dictionaryError) };
      }
    },
    [refresh],
  );

  const toggleDictionaryItem = useCallback(
    async (id: string) => {
      const item = state.dictionaries.find((entry) => entry.id === id);
      if (!item) return { ok: false, message: "字典项不存在" };
      return updateDictionaryItem(id, { active: !item.active });
    },
    [state.dictionaries, updateDictionaryItem],
  );

  const removeDictionaryItem = useCallback(
    async (id: string): Promise<StoreResult> => {
      try {
        await apiRequest(`/dictionaries/${id}`, { method: "DELETE" });
        await refresh();
        return { ok: true, message: "字典项已删除" };
      } catch (dictionaryError) {
        return { ok: false, message: errorMessage(dictionaryError) };
      }
    },
    [refresh],
  );

  const isFieldVisible = useCallback(
    (card: Card, field: CardField, viewer: User | null = currentUser) => {
      if (!viewer) return card.visibleFields?.includes(field) ?? true;
      if (
        viewer.id === card.ownerId ||
        permissions.has("cards.update") ||
        permissions.has("submissions.review")
      ) {
        return true;
      }
      if (card.visibleFields) return card.visibleFields.includes(field);
      const rules =
        card.visibilityOverrides[field] ??
        state.settings.fieldDefaults[field] ??
        [];
      return rules.some((principal: VisibilityPrincipal) => {
        if (principal === "guest" || principal === "authenticated") return true;
        if (principal === "owner") return viewer.id === card.ownerId;
        if (principal === "admin") return permissions.has("settings.update");
        if (principal.startsWith("role:")) {
          return viewer.roleIds.includes(principal.slice(5));
        }
        return false;
      });
    },
    [currentUser, permissions, state.settings.fieldDefaults],
  );

  const isProfileVisible = useCallback(
    (profile: User, viewer: User | null = currentUser) => {
      if (profile.status === "deleted") return false;
      if (viewer?.id === profile.id) return true;
      if (viewer && permissions.has("users.update")) return true;
      if (profile.profileVisibility === "public") return true;
      if (profile.profileVisibility === "authenticated") return Boolean(viewer);
      return false;
    },
    [currentUser, permissions],
  );

  const value: AppStoreValue = {
    state,
    currentUser,
    ready,
    error,
    can,
    refresh,
    login,
    logout,
    register,
    setTheme,
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
    uploadMedia,
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

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6 text-center">
        <div>
          <span className="mx-auto block size-8 animate-spin rounded-full border-2 border-border border-t-primary" />
          <p className="mt-4 text-sm text-muted-foreground">正在连接 cardthek 服务…</p>
        </div>
      </div>
    );
  }

  if (error && !state.settings.installed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6 text-center">
        <div className="max-w-md">
          <h1 className="font-serif text-3xl font-bold">无法连接后端服务</h1>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">{error}</p>
          <button
            type="button"
            onClick={() => {
              setReady(false);
              void refresh()
                .catch(() => {})
                .finally(() => setReady(true));
            }}
            className="mt-6 rounded-pill bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            重新连接
          </button>
        </div>
      </div>
    );
  }

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}

export function useAppStore() {
  const context = useContext(AppStoreContext);
  if (!context) throw new Error("useAppStore must be used within AppStoreProvider");
  return context;
}

export function useDictionary() {
  const { state } = useAppStore();
  return useCallback(
    (id?: string) =>
      state.dictionaries.find((item) => item.id === id)?.label ?? "未填写",
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
