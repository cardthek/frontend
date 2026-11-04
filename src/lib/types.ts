export type ThemeId = "natural" | "editorial" | "corporate-clean";

export type PermissionKey =
  | "dashboard.read"
  | "cards.read"
  | "cards.create"
  | "cards.update"
  | "cards.publish"
  | "cards.visibility"
  | "submissions.read"
  | "submissions.create"
  | "submissions.updateOwn"
  | "submissions.review"
  | "submissions.bypassReview"
  | "users.read"
  | "users.update"
  | "roles.read"
  | "roles.update"
  | "dictionaries.manage"
  | "media.manage"
  | "settings.read"
  | "settings.update"
  | "audit.read"
  | "profile.update";

export interface Permission {
  key: PermissionKey;
  module: string;
  label: string;
}

export interface Role {
  id: string;
  uuid: string;
  name: string;
  slug: string;
  description: string;
  permissions: PermissionKey[];
  isSystem?: boolean;
}

export type ProfileVisibility = "public" | "authenticated" | "private";

export interface User {
  id: number;
  uuid: string;
  username: string;
  email: string;
  displayName: string;
  slug: string;
  bio: string;
  avatarTone: "sand" | "sage" | "clay" | "forest";
  profileVisibility: ProfileVisibility;
  showSubmissions: boolean;
  roleIds: string[];
  status: "active" | "suspended" | "deleted";
  joinedAt: string;
  passwordUpdatedAt?: string;
  deletedAt?: string;
}

export interface AdminUserInput {
  username: string;
  email: string;
  displayName: string;
  slug: string;
  bio: string;
  avatarTone: User["avatarTone"];
  profileVisibility: ProfileVisibility;
  showSubmissions: boolean;
  roleIds: string[];
  status: User["status"];
  joinedAt: string;
}

export type DictionaryType = "issuer" | "network" | "cardType" | "level";

export interface DictionaryItem {
  id: string;
  type: DictionaryType;
  /** Parent dictionary id. Card levels are scoped to a card network. */
  parentId?: string;
  label: string;
  slug: string;
  description?: string;
  active: boolean;
}

export type MediaTone = "sand" | "sage" | "clay" | "forest" | "ink";
export type MediaPattern = "orbit" | "arch" | "leaf" | "lines" | "wave";

export interface MediaAsset {
  uuid: string;
  name: string;
  mimeType: string;
  size: number;
  ownerId: number;
  createdAt: string;
  preview?: string;
  tone: MediaTone;
  pattern: MediaPattern;
}

export type CardStatus =
  | "draft"
  | "pending"
  | "changes_requested"
  | "published"
  | "rejected"
  | "hidden";

export type CardField =
  | "title"
  | "bin"
  | "issuer"
  | "network"
  | "cardType"
  | "level"
  | "country"
  | "currency"
  | "releaseYear"
  | "tags"
  | "description"
  | "gallery"
  | "source";

export type VisibilityPrincipal =
  | "guest"
  | "authenticated"
  | "owner"
  | "admin"
  | `role:${string}`;

export type FieldVisibility = Record<CardField, VisibilityPrincipal[]>;

export interface Card {
  uuid: string;
  title: string;
  bin?: string;
  issuerId: string;
  networkId: string;
  cardTypeId: string;
  levelId?: string;
  countryCode?: string;
  currencyCodes?: string[];
  releaseYear?: number;
  tags: string[];
  description?: string;
  sourceUrl?: string;
  mediaIds: string[];
  coverMediaId?: string;
  visibilityOverrides: Partial<FieldVisibility>;
  ownerId: number;
  status: CardStatus;
  featured: boolean;
  likeCount?: number;
  downloadCount?: number;
  likedByUserIds?: number[];
  contributorIds?: number[];
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  reviewComment?: string;
  reviewedBy?: number;
}

export interface ReviewRecord {
  id: string;
  cardUuid: string;
  reviewerId: number;
  decision: "approved" | "rejected" | "changes_requested";
  comment: string;
  createdAt: string;
}

export type ContributionChanges = Partial<Pick<
  Card,
  | "title"
  | "bin"
  | "issuerId"
  | "networkId"
  | "cardTypeId"
  | "levelId"
  | "countryCode"
  | "currencyCodes"
  | "releaseYear"
  | "tags"
  | "description"
  | "sourceUrl"
>>;

export interface CardContribution {
  id: string;
  cardUuid: string;
  contributorId: number;
  note: string;
  changes: ContributionChanges;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  reviewedBy?: number;
  reviewComment?: string;
  reviewedAt?: string;
}

export interface AuditLog {
  id: string;
  actorId?: number;
  action: string;
  resourceType: string;
  resourceId: string;
  detail: string;
  createdAt: string;
}

export interface SiteSettings {
  installed: boolean;
  siteName: string;
  tagline: string;
  description: string;
  registrationMode: "open" | "invite" | "closed";
  emailVerification: boolean;
  maxImages: number;
  maxImageSizeMb: number;
  fieldDefaults: FieldVisibility;
}

export interface RegistrationInput {
  username: string;
  email: string;
  displayName: string;
  password: string;
}

export interface CardDraftInput {
  title: string;
  bin?: string;
  issuerId: string;
  networkId: string;
  cardTypeId: string;
  levelId?: string;
  countryCode?: string;
  currencyCodes?: string[];
  releaseYear?: number;
  tags: string[];
  description?: string;
  sourceUrl?: string;
  mediaIds: string[];
  coverMediaId?: string;
}

export interface AdminCardInput extends CardDraftInput {
  ownerId: number;
  status: CardStatus;
  featured: boolean;
  visibilityOverrides: Partial<FieldVisibility>;
}

export interface DemoState {
  settings: SiteSettings;
  users: User[];
  roles: Role[];
  cards: Card[];
  media: MediaAsset[];
  reviews: ReviewRecord[];
  contributions: CardContribution[];
  dictionaries: DictionaryItem[];
  auditLogs: AuditLog[];
  currentUserId: number | null;
  theme: ThemeId;
}
