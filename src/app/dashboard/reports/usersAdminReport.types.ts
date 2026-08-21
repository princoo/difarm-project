export type UsersAdminReportInput = {
  users: any[];
  activityLogs?: any[];
  generatedBy?: string;
  scopeLabel?: string;
};

export type RoleCount = {
  role: string;
  count: number;
  sharePct: number;
};

export type StatusCount = {
  status: string;
  count: number;
  sharePct: number;
};

export type UserRow = {
  name: string;
  role: string;
  phone: string;
  email: string;
  farm: string;
  status: string;
  lastActive: string;
};

export type UsersAdminReport = {
  scopeLabel: string;
  generatedAt: string;
  generatedBy: string;
  kpis: {
    totalUsers: number;
    activeUsers: number;
    activeRate: number;
    farmers: number;
    veterinarians: number;
    fieldOfficers: number;
    managers: number;
    admins: number;
    pending: number;
    suspended: number;
    newUsers30d: number;
    deviceLinked: number;
  };
  byRole: RoleCount[];
  byStatus: StatusCount[];
  byFarm: Array<{ farm: string; count: number }>;
  activityTrend: Array<{ label: string; value: number }>;
  needsAttention: Array<{ alert: string; example: string; action: string }>;
  users: UserRow[];
  recentActivity: Array<{
    when: string;
    action: string;
    actor: string;
    entity: string;
  }>;
};
