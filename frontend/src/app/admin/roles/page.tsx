"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Users, ShieldCheck, Plus, FileText, BarChart3 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { adminGet, adminPost } from "@/lib/admin-api";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import MiniBarChart from "@/components/common/MiniBarChart";
import LineChart from "@/components/common/LineChart";
import { Suspense } from "react";
import { useTranslations } from "next-intl";

const demoRoles = [
  {
    id: "r1",
    name: "System Admin",
    members: 4,
    scope: "Global",
  },
  {
    id: "r2",
    name: "Institution Admin",
    members: 18,
    scope: "Institution",
  },
  {
    id: "r3",
    name: "Mentor",
    members: 86,
    scope: "Department",
  },
];

const demoAccessRequests = [
  {
    id: "a1",
    requester: "jamal@northbay.edu",
    role: "Institution Admin",
    status: "Pending",
  },
  {
    id: "a2",
    requester: "sana@atlas.edu",
    role: "Mentor",
    status: "Pending",
  },
];

type RoleAuditEntry = {
  id: string;
  actor: string;
  action: string;
  role: string;
  time: string;
  severity: string;
};

type RoleAuditResponse = {
  items: RoleAuditEntry[];
  total: number;
};

const demoRoleAudit: RoleAuditEntry[] = [
  {
    id: "ra1",
    actor: "security@ilmora.ai",
    action: "Permission updated",
    role: "Mentor",
    time: "16 min ago",
    severity: "Medium",
  },
  {
    id: "ra2",
    actor: "admin@atlas.edu",
    action: "Role created",
    role: "Institution Admin",
    time: "2 hours ago",
    severity: "Low",
  },
  {
    id: "ra3",
    actor: "ops@ilmora.ai",
    action: "Access revoked",
    role: "System Admin",
    time: "Yesterday",
    severity: "High",
  },
];

const actorWidthClass = (count: number) => {
  if (count >= 6) return "w-full";
  if (count >= 5) return "w-5/6";
  if (count >= 4) return "w-4/5";
  if (count >= 3) return "w-3/5";
  if (count >= 2) return "w-2/5";
  return "w-1/5";
};

const permissionGroups = [
  {
    group: "data",
    permissions: ["db.read", "db.write", "db.export"],
  },
  {
    group: "security",
    permissions: ["audit.view", "audit.export", "incident.manage"],
  },
  {
    group: "aiContent",
    permissions: ["content.review", "model.configure", "studio.manage"],
  },
  {
    group: "operations",
    permissions: [
      "integrations.manage",
      "roles.manage",
      "system.health",
    ],
  },
];

const permissionTemplates = {
  Administrator: [
    "db.read",
    "db.write",
    "db.export",
    "audit.view",
    "audit.export",
    "incident.manage",
    "content.review",
    "model.configure",
    "studio.manage",
    "integrations.manage",
    "roles.manage",
    "system.health",
  ],
  Operator: [
    "db.read",
    "db.write",
    "audit.view",
    "incident.manage",
    "content.review",
    "studio.manage",
    "system.health",
  ],
  "Read Only": ["db.read", "audit.view", "system.health"],
} as const;

const templateLabelKey: Record<keyof typeof permissionTemplates, string> = {
  Administrator: "administrator",
  Operator: "operator",
  "Read Only": "readOnly",
};

const auditLevels = ["All", "High", "Medium", "Low"] as const;

function RolesContent() {
  const searchParams = useSearchParams();
  const { token, demoMode } = useAuth();
  const { showToast } = useToast();
  const t = useTranslations("adminRoles");
  const templateLabelMap: Record<keyof typeof permissionTemplates, string> = {
    Administrator: t("templates.labels.administrator"),
    Operator: t("templates.labels.operator"),
    "Read Only": t("templates.labels.readOnly"),
  };
  const auditLevelLabels: Record<(typeof auditLevels)[number], string> = {
    All: t("audit.levels.all"),
    High: t("audit.levels.high"),
    Medium: t("audit.levels.medium"),
    Low: t("audit.levels.low"),
  };
  const [roles, setRoles] = useState(demoRoles);
  const [accessRequests, setAccessRequests] = useState(demoAccessRequests);
  const [roleName, setRoleName] = useState("");
  const [roleScope, setRoleScope] = useState("Institution");
  const [selectedRoleId, setSelectedRoleId] = useState(demoRoles[0]?.id ?? "");
  const [rolePermissions, setRolePermissions] = useState<
    Record<string, Record<string, boolean>>
  >(() => ({
    r1: {
      "db.read": true,
      "db.write": true,
      "db.export": true,
      "audit.view": true,
      "audit.export": true,
      "incident.manage": true,
      "content.review": true,
      "model.configure": true,
      "studio.manage": true,
      "integrations.manage": true,
      "roles.manage": true,
      "system.health": true,
    },
    r2: {
      "db.read": true,
      "db.write": true,
      "db.export": false,
      "audit.view": true,
      "audit.export": false,
      "incident.manage": true,
      "content.review": true,
      "model.configure": false,
      "studio.manage": true,
      "integrations.manage": true,
      "roles.manage": true,
      "system.health": true,
    },
    r3: {
      "db.read": true,
      "db.write": false,
      "db.export": false,
      "audit.view": false,
      "audit.export": false,
      "incident.manage": false,
      "content.review": true,
      "model.configure": false,
      "studio.manage": true,
      "integrations.manage": false,
      "roles.manage": false,
      "system.health": true,
    },
  }));
  const [confirm, setConfirm] = useState<{
    open: boolean;
    title: string;
    description: string;
    tone?: "default" | "danger";
    onConfirm: () => void;
  } | null>(null);
  const [roleAudit, setRoleAudit] = useState<RoleAuditEntry[]>(demoRoleAudit);
  const [auditTotal, setAuditTotal] = useState(demoRoleAudit.length);
  const [auditFilter, setAuditFilter] = useState("All");
  const [auditSearch, setAuditSearch] = useState("");
  const [auditPage, setAuditPage] = useState(1);
  const auditPageSize = 6;

  const handleExportMatrix = () => {
    const csvCell = (value: string | number) =>
      `"${String(value).replace(/"/g, '""')}"`;
    const rows: string[] = [
      "role_id,role_name,scope,members,permission_id,enabled",
    ];
    const permissionIds = permissionGroups.flatMap((group) =>
      group.permissions.map((permission) => permission.id),
    );

    roles.forEach((role) => {
      permissionIds.forEach((permissionId) => {
        const enabled =
          rolePermissions[role.id]?.[permissionId] === true ? "true" : "false";
        rows.push(
          [
            csvCell(role.id),
            csvCell(role.name),
            csvCell(role.scope),
            csvCell(role.members),
            csvCell(permissionId),
            csvCell(enabled),
          ].join(","),
        );
      });
    });

    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "role-permissions.csv";
    link.click();
    URL.revokeObjectURL(url);
    showToast(t("toast.matrixExported"), "success");
  };

  const handleExportAudit = async () => {
    const csvCell = (value: string | number) =>
      `"${String(value).replace(/"/g, '""')}"`;
    let exportItems = roleAudit;

    if (demoMode) {
      exportItems = getDemoAuditFiltered();
    } else {
      const params = new URLSearchParams({
        skip: "0",
        limit: "5000",
      });
      if (auditFilter !== "All") params.set("severity", auditFilter);
      if (auditSearch.trim()) params.set("search", auditSearch.trim());
      const data = await adminGet<RoleAuditResponse>(
        `/api/v1/admin/roles/audit?${params.toString()}`,
        token,
      );
      exportItems = data.items;
    }

    const rows = [
      "id,actor,action,role,time,severity",
      ...exportItems.map((event) =>
        [
          csvCell(event.id),
          csvCell(event.actor),
          csvCell(event.action),
          csvCell(event.role),
          csvCell(event.time),
          csvCell(event.severity),
        ].join(","),
      ),
    ];
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "role-audit.csv";
    link.click();
    URL.revokeObjectURL(url);
    showToast(t("toast.auditExported"), "success");
  };

  const handleCloneRole = async () => {
    if (!selectedRole) {
      showToast(t("toast.cloneSelect"), "info");
      return;
    }
    const newRoleName = `${selectedRole.name} Copy`;
    if (demoMode) {
      const newRoleId = `demo-${Date.now()}`;
      setRoles((prev) => [
        ...prev,
        {
          id: newRoleId,
          name: newRoleName,
          members: 0,
          scope: selectedRole.scope,
        },
      ]);
      setRolePermissions((prev) => ({
        ...prev,
        [newRoleId]: { ...prev[selectedRole.id] },
      }));
      showToast(t("toast.cloneDemo"), "success");
      return;
    }
    try {
      const created = await adminPost<(typeof demoRoles)[number]>(
        `/api/v1/admin/roles/${selectedRole.id}/clone`,
        token,
        { name: newRoleName },
      );
      setRoles((prev) => [...prev, created]);
      setRolePermissions((prev) => ({
        ...prev,
        [created.id]: { ...prev[selectedRole.id] },
      }));
      showToast(t("toast.clone"), "success");
    } catch (error) {
      console.error(error);
      showToast(t("toast.cloneFailed"), "error");
    }
  };

  const getDemoAuditFiltered = useCallback(() => {
    const needle = auditSearch.trim().toLowerCase();
    return demoRoleAudit.filter((event) => {
      const matchesFilter =
        auditFilter === "All" || event.severity === auditFilter;
      const matchesSearch = needle
        ? [event.actor, event.action, event.role]
            .join(" ")
            .toLowerCase()
            .includes(needle)
        : true;
      return matchesFilter && matchesSearch;
    });
  }, [auditFilter, auditSearch]);

  const loadRoleAudit = useCallback(async () => {
    if (demoMode) {
      const filtered = getDemoAuditFiltered();
      setAuditTotal(filtered.length);
      setRoleAudit(
        filtered.slice(
          (auditPage - 1) * auditPageSize,
          auditPage * auditPageSize,
        ),
      );
      return;
    }

    try {
      const params = new URLSearchParams({
        skip: String((auditPage - 1) * auditPageSize),
        limit: String(auditPageSize),
      });
      if (auditFilter !== "All") params.set("severity", auditFilter);
      if (auditSearch.trim()) params.set("search", auditSearch.trim());
      const data = await adminGet<RoleAuditResponse>(
        `/api/v1/admin/roles/audit?${params.toString()}`,
        token,
      );
      setRoleAudit(data.items);
      setAuditTotal(data.total);
    } catch (error) {
      console.error(error);
      showToast(t("toast.auditDemo"), "warning");
    }
  }, [
    auditFilter,
    auditPage,
    auditPageSize,
    auditSearch,
    demoMode,
    getDemoAuditFiltered,
    showToast,
    token,
  ]);

  useEffect(() => {
    if (demoMode) return;
    const load = async () => {
      try {
        const [roleData, requestData] = await Promise.all([
          adminGet<typeof demoRoles>("/api/v1/admin/roles", token),
          adminGet<typeof demoAccessRequests>(
            "/api/v1/admin/access-requests",
            token,
          ),
        ]);
        setRoles(roleData);
        setAccessRequests(requestData);
        if (roleData.length > 0) setSelectedRoleId(roleData[0].id);
      } catch (error) {
        console.error(error);
        showToast(t("toast.rolesDemo"), "warning");
      }
    };
    load();
  }, [demoMode, token, showToast]);

  useEffect(() => {
    void loadRoleAudit();
  }, [loadRoleAudit]);

  useEffect(() => {
    const query = searchParams.get("q");
    if (query !== null) setAuditSearch(query);
  }, [searchParams]);

  const selectedRole = useMemo(
    () => roles.find((role) => role.id === selectedRoleId),
    [roles, selectedRoleId],
  );

  const severityData = useMemo(() => {
    const counts = roleAudit.reduce(
      (acc, event) => {
        acc[event.severity] = (acc[event.severity] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
    return [
      { label: "High", value: counts.High ?? 0 },
      { label: "Medium", value: counts.Medium ?? 0 },
      { label: "Low", value: counts.Low ?? 0 },
    ];
  }, [roleAudit]);

  const severityTrend = useMemo(() => {
    const weightMap: Record<string, number> = { High: 3, Medium: 2, Low: 1 };
    return roleAudit.map((event, index) => ({
      label: `T${index + 1}`,
      value: weightMap[event.severity] ?? 1,
    }));
  }, [roleAudit]);

  const topActors = useMemo(() => {
    const counts = roleAudit.reduce<Record<string, number>>((acc, event) => {
      acc[event.actor] = (acc[event.actor] ?? 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([actor, count]) => ({ actor, count }));
  }, [roleAudit]);

  useEffect(() => {
    setAuditPage(1);
  }, [auditFilter, auditSearch]);

  const auditTotalPages = Math.max(1, Math.ceil(auditTotal / auditPageSize));
  const paginatedAudit = roleAudit;

  const handlePermissionToggle = async (permissionId: string) => {
    const current = rolePermissions[selectedRoleId]?.[permissionId] ?? false;
    const nextValue = !current;
    if (demoMode) {
      setRolePermissions((prev) => ({
        ...prev,
        [selectedRoleId]: {
          ...prev[selectedRoleId],
          [permissionId]: nextValue,
        },
      }));
      showToast(t("toast.permissionDemo"), "success");
      return;
    }
    try {
      await adminPost(
        `/api/v1/admin/roles/${selectedRoleId}/permissions`,
        token,
        { permission: permissionId, enabled: nextValue },
      );
      setRolePermissions((prev) => ({
        ...prev,
        [selectedRoleId]: {
          ...prev[selectedRoleId],
          [permissionId]: nextValue,
        },
      }));
      showToast(t("toast.permissionUpdated"), "success");
    } catch (error) {
      console.error(error);
      showToast(t("toast.permissionFailed"), "error");
    }
  };

  const handleBulkAccess = async (approved: boolean) => {
    if (accessRequests.length === 0) {
      showToast(t("toast.noAccessRequests"), "info");
      return;
    }
    if (demoMode) {
      setAccessRequests([]);
      showToast(t("toast.accessUpdatedDemo"), "success");
      return;
    }
    try {
      await adminPost("/api/v1/admin/access-requests/bulk", token, {
        action: approved ? "approve" : "deny",
      });
      setAccessRequests([]);
      showToast(t("toast.accessUpdated"), "success");
    } catch (error) {
      console.error(error);
      showToast(t("toast.bulkFailed"), "error");
    }
  };

  const handleApplyTemplate = (
    templateName: keyof typeof permissionTemplates,
  ) => {
    const template = permissionTemplates[templateName];
    const templateLabel = templateLabelMap[templateName];
    setConfirm({
      open: true,
      title: t("templates.confirmTitle", { name: templateLabel }),
      description: t("templates.confirmBody"),
      tone: "danger",
      onConfirm: async () => {
        const nextPermissions = template.reduce<Record<string, boolean>>(
          (acc, permissionId) => {
            acc[permissionId] = true;
            return acc;
          },
          {},
        );
        if (demoMode) {
          setRolePermissions((prev) => ({
            ...prev,
            [selectedRoleId]: nextPermissions,
          }));
          showToast(t("toast.templateDemo"), "success");
          return;
        }
        try {
          await adminPost(
            `/api/v1/admin/roles/${selectedRoleId}/permissions/template`,
            token,
            { template: templateName },
          );
          setRolePermissions((prev) => ({
            ...prev,
            [selectedRoleId]: nextPermissions,
          }));
          showToast(t("toast.templateApplied"), "success");
        } catch (error) {
          console.error(error);
          showToast(t("toast.templateFailed"), "error");
        }
      },
    });
  };

  const handleCreateRole = async () => {
    if (!roleName.trim()) {
      showToast(t("toast.roleNameRequired"), "info");
      return;
    }
    if (demoMode) {
      setRoles((prev) => [
        ...prev,
        {
          id: `demo-${Date.now()}`,
          name: roleName,
          members: 0,
          scope: roleScope,
        },
      ]);
      setRoleName("");
      showToast(t("toast.roleCreatedDemo"), "success");
      return;
    }
    try {
      const created = await adminPost<(typeof demoRoles)[number]>(
        "/api/v1/admin/roles",
        token,
        { name: roleName, scope: roleScope },
      );
      setRoles((prev) => [...prev, created]);
      setRoleName("");
      showToast(t("toast.roleCreated"), "success");
    } catch (error) {
      console.error(error);
      showToast(t("toast.roleCreateFailed"), "error");
    }
  };

  const handleAccessDecision = async (id: string, approved: boolean) => {
    if (demoMode) {
      setAccessRequests((prev) => prev.filter((req) => req.id !== id));
      showToast(t("toast.accessDecisionDemo"), "success");
      return;
    }
    try {
      await adminPost(
        `/api/v1/admin/access-requests/${id}/${approved ? "approve" : "deny"}`,
        token,
      );
      setAccessRequests((prev) => prev.filter((req) => req.id !== id));
      showToast(t("toast.accessDecision"), "success");
    } catch (error) {
      console.error(error);
      showToast(t("toast.accessDecisionFailed"), "error");
    }
  };

  return (
    <div className="relative min-h-screen ilmora-ambient bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.25),_transparent_45%),radial-gradient(circle_at_20%_20%,_rgba(251,191,36,0.2),_transparent_45%),linear-gradient(180deg,_rgba(248,250,252,0.98),_rgba(226,232,240,0.9),_rgba(248,250,252,0.98))] text-slate-900 dark:bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.22),_transparent_40%),radial-gradient(circle_at_20%_20%,_rgba(251,191,36,0.15),_transparent_45%),linear-gradient(180deg,_rgba(2,6,23,0.98),_rgba(8,47,73,0.85),_rgba(2,6,23,0.98))] dark:text-white">
      <ConfirmDialog
        open={!!confirm?.open}
        title={confirm?.title ?? ""}
        description={confirm?.description}
        tone={confirm?.tone ?? "default"}
        confirmLabel={t("confirm.proceed")}
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          confirm?.onConfirm();
          setConfirm(null);
        }}
      />
      <div className="ilmora-noise relative">
        <div className="pointer-events-none absolute inset-0 ilmora-grid opacity-20" />
        <div className="relative z-10 p-6">
          <header className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-xs uppercase tracking-[0.3em] text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-white/70">
                <Users size={14} /> {t("eyebrow")}
              </p>
              <h1 className="mt-4 text-3xl font-semibold">
                {t("title")}
              </h1>
              <p className="text-slate-500 dark:text-white/60">
                {t("subtitle")}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={roleName}
                onChange={(event) => setRoleName(event.target.value)}
                placeholder={t("create.placeholder")}
                className="rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-700 outline-none focus:border-amber-300 dark:border-white/10 dark:bg-white/10 dark:text-white"
              />
              <select
                value={roleScope}
                onChange={(event) => setRoleScope(event.target.value)}
                aria-label={t("create.scopeAria")}
                className="rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-700 outline-none focus:border-amber-300 dark:border-white/10 dark:bg-white/10 dark:text-white"
              >
                <option value="Global">{t("create.scopes.global")}</option>
                <option value="Institution">{t("create.scopes.institution")}</option>
                <option value="Department">{t("create.scopes.department")}</option>
              </select>
              <button
                onClick={handleCreateRole}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-700 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
              >
                <Plus className="h-4 w-4" /> {t("create.submit")}
              </button>
            </div>
          </header>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white/70 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
              <div className="border-b border-slate-200 px-6 py-4 dark:border-white/10">
                <h3 className="text-lg font-medium">{t("activeRoles")}</h3>
              </div>
              <div className="divide-y divide-slate-200 dark:divide-white/10">
                {roles.map((role) => (
                  <div
                    key={role.id}
                    className="flex items-center justify-between p-6"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {role.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-white/60">
                        {t("roleMeta", {
                          count: role.members,
                          scope: role.scope,
                        })}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedRoleId(role.id)}
                      className={`text-xs uppercase tracking-[0.2em] ${
                        selectedRoleId === role.id
                          ? "text-slate-900 dark:text-white"
                          : "text-slate-600 hover:text-slate-900 dark:text-white/70 dark:hover:text-white"
                      }`}
                    >
                      {t("manage")}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white/70 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
              <div className="border-b border-slate-200 px-6 py-4 dark:border-white/10">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-lg font-medium">{t("access.title")}</h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setConfirm({
                          open: true,
                          title: t("access.approveAllTitle"),
                          description: t("access.approveAllBody"),
                          onConfirm: () => handleBulkAccess(true),
                        })
                      }
                      className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-emerald-700 hover:bg-emerald-100 dark:border-emerald-200/30 dark:bg-emerald-200/10 dark:text-emerald-200 dark:hover:bg-emerald-200/20"
                    >
                      {t("access.approveAll")}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setConfirm({
                          open: true,
                          title: t("access.denyAllTitle"),
                          description: t("access.denyAllBody"),
                          tone: "danger",
                          onConfirm: () => handleBulkAccess(false),
                        })
                      }
                      className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-rose-600 hover:bg-rose-100 dark:border-rose-200/40 dark:bg-rose-200/10 dark:text-rose-200 dark:hover:bg-rose-200/20"
                    >
                      {t("access.denyAll")}
                    </button>
                  </div>
                </div>
              </div>
              <div className="space-y-4 p-6">
                {accessRequests.map((req) => (
                  <div
                    key={req.id}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm dark:border-white/10 dark:bg-white/10"
                  >
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {req.requester}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-white/60">
                        {req.role} • {req.status}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAccessDecision(req.id, true)}
                        className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-600 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
                      >
                        {t("access.approve")}
                      </button>
                      <button
                        onClick={() => handleAccessDecision(req.id, false)}
                        className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs uppercase tracking-[0.2em] text-rose-600 hover:bg-rose-100 dark:border-rose-200/40 dark:bg-rose-200/10 dark:text-rose-200 dark:hover:bg-rose-200/20"
                      >
                        {t("access.deny")}
                      </button>
                    </div>
                  </div>
                ))}
                <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 text-xs text-slate-500 dark:border-white/10 dark:bg-white/10 dark:text-white/60">
                  {t("access.notice")}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                  <h3 className="text-lg font-medium">
                    {t("permissions.title")}
                  </h3>
                <p className="text-sm text-slate-500 dark:text-white/60">
                    {t("permissions.subtitle", {
                      name:
                        selectedRole?.name ?? t("permissions.subtitleFallback"),
                    })}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={selectedRoleId}
                  onChange={(event) => setSelectedRoleId(event.target.value)}
                    aria-label={t("permissions.selectRole")}
                  className="rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-700 outline-none focus:border-amber-300 dark:border-white/10 dark:bg-white/10 dark:text-white"
                >
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleExportMatrix}
                  className="rounded-full border border-slate-200 bg-white/80 px-3 py-2 text-xs uppercase tracking-[0.2em] text-slate-600 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/20"
                >
                  {t("permissions.export")}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setConfirm({
                      open: true,
                      title: t("permissions.cloneTitle"),
                      description: t("permissions.cloneBody"),
                      onConfirm: handleCloneRole,
                    })
                  }
                  className="rounded-full border border-slate-200 bg-white/80 px-3 py-2 text-xs uppercase tracking-[0.2em] text-slate-600 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/20"
                >
                  {t("permissions.clone")}
                </button>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {Object.keys(permissionTemplates).map((template) => (
                <button
                  key={template}
                  type="button"
                  onClick={() =>
                    handleApplyTemplate(
                      template as keyof typeof permissionTemplates,
                    )
                  }
                  className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-600 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/20"
                >
                  {
                    templateLabelMap[
                      template as keyof typeof permissionTemplates
                    ]
                  }
                </button>
              ))}
            </div>
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {permissionGroups.map((group) => (
                <div
                  key={group.group}
                  className="rounded-2xl border border-slate-200 bg-white/80 p-4 text-sm dark:border-white/10 dark:bg-white/10"
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-white/60">
                    {t(`permissions.groups.${group.group}`)}
                  </p>
                  <div className="mt-3 space-y-2">
                    {group.permissions.map((permissionId) => {
                      const enabled =
                        rolePermissions[selectedRoleId]?.[permissionId] ??
                        false;
                      return (
                        <button
                          key={permissionId}
                          type="button"
                          onClick={() => handlePermissionToggle(permissionId)}
                          className={`flex w-full items-center justify-between rounded-2xl border px-3 py-2 text-xs uppercase tracking-[0.2em] ${
                            enabled
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-200/30 dark:bg-emerald-200/10 dark:text-emerald-200"
                              : "border-slate-200 bg-white/80 text-slate-600 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/20"
                          }`}
                        >
                          <span>
                            {t(`permissions.labels.${permissionId}`)}
                          </span>
                          <span>
                            {enabled
                              ? t("permissions.state.on")
                              : t("permissions.state.off")}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">
                    {t("insights.title")}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-white/60">
                    {t("insights.subtitle")}
                  </p>
                </div>
                <BarChart3 className="h-5 w-5 text-slate-500 dark:text-white/60" />
              </div>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 text-sm dark:border-white/10 dark:bg-white/10">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-white/60">
                    {t("insights.mix")}
                  </p>
                  <div className="mt-3 text-slate-700 dark:text-white/70">
                    <MiniBarChart data={severityData} />
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 text-sm dark:border-white/10 dark:bg-white/10">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-white/60">
                    {t("insights.trend")}
                  </p>
                  <div className="mt-3">
                    <LineChart data={severityTrend} unit="lvl" />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">
                    {t("actors.title")}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-white/60">
                    {t("actors.subtitle")}
                  </p>
                </div>
                <FileText className="h-5 w-5 text-slate-500 dark:text-white/60" />
              </div>
              <div className="mt-4 space-y-3">
                {topActors.length === 0 ? (
                  <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 text-xs text-slate-500 dark:border-white/10 dark:bg-white/10 dark:text-white/60">
                    {t("actors.empty")}
                  </div>
                ) : (
                  topActors.map((actor) => (
                    <div
                      key={actor.actor}
                      className="rounded-2xl border border-slate-200 bg-white/80 p-3 text-xs dark:border-white/10 dark:bg-white/10"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-slate-700 dark:text-white/80">
                          {actor.actor}
                        </span>
                        <span className="text-slate-500 dark:text-white/60">
                          {t("actors.events", { count: actor.count })}
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 w-full rounded-full bg-slate-200 dark:bg-white/10">
                        <div
                          className={`h-1.5 rounded-full bg-slate-800 dark:bg-white ${actorWidthClass(actor.count)}`}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-3xl border border-slate-200 bg-white/70 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
            <div className="border-b border-slate-200 px-6 py-4 dark:border-white/10">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-slate-500 dark:text-white/60" />
                  <h3 className="text-lg font-medium">
                    {t("audit.title")}
                  </h3>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {auditLevels.map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setAuditFilter(level)}
                      className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.2em] transition ${
                        auditFilter === level
                          ? "border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-black"
                          : "border-slate-200 bg-white/70 text-slate-600 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/20"
                      }`}
                    >
                      {auditLevelLabels[level]}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={handleExportAudit}
                    className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-600 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/20"
                  >
                    {t("audit.export")}
                  </button>
                </div>
              </div>
              <input
                value={auditSearch}
                onChange={(event) => setAuditSearch(event.target.value)}
                placeholder={t("audit.search")}
                className="mt-4 w-full rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-700 outline-none focus:border-amber-300 dark:border-white/10 dark:bg-white/10 dark:text-white"
              />
            </div>
            <div className="divide-y divide-slate-200 dark:divide-white/10">
              {paginatedAudit.length === 0 ? (
                <div className="flex flex-col items-center gap-4 p-10 text-center text-slate-500 dark:text-white/60">
                  <div className="rounded-full border border-slate-200 bg-white/80 p-3 text-slate-500 dark:border-white/10 dark:bg-white/10 dark:text-white/70">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {t("audit.empty.title")}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-white/60">
                      {t("audit.empty.body")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAuditFilter("All");
                      setAuditSearch("");
                    }}
                    className="rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-600 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/20"
                  >
                    {t("audit.empty.clear")}
                  </button>
                </div>
              ) : (
                paginatedAudit.map((event) => (
                  <div
                    key={event.id}
                    className="flex flex-wrap items-center justify-between gap-4 p-6"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {event.action}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-white/60">
                        {event.actor} • {event.role} • {event.time}
                      </p>
                    </div>
                    <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-white/70">
                      {event.severity}
                    </span>
                  </div>
                ))
              )}
            </div>
            <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4 text-xs uppercase tracking-[0.2em] text-slate-500 dark:border-white/10 dark:text-white/60">
              <span>
                {t("audit.pagination", {
                  page: auditPage,
                  total: auditTotalPages,
                })}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAuditPage((prev) => Math.max(1, prev - 1))}
                  disabled={auditPage <= 1}
                  className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-slate-600 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/20"
                >
                  {t("audit.prev")}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setAuditPage((prev) => Math.min(auditTotalPages, prev + 1))
                  }
                  disabled={auditPage >= auditTotalPages}
                  className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-slate-600 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/20"
                >
                  {t("audit.next")}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
              <p className="text-sm text-slate-600 dark:text-white/70">
                {t("footer.notice")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RolesPage() {
  const t = useTranslations("adminRoles");
  return (
    <Suspense fallback={<div className="p-6">{t("loading")}</div>}>
      <RolesContent />
    </Suspense>
  );
}
