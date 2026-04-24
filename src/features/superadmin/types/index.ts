export interface SuperadminSession {
  accessToken: string;
  superadmin: {
    id:        string;
    email:     string;
    firstName: string | null;
    lastName:  string | null;
  };
}

export interface OrgStats {
  membersActive:   number;
  membersDisabled: number;
  articlesCount:   number;
}

export interface OrgRow {
  id:          string;
  name:        string;
  slug:        string;
  plan:        string;
  created_at:  string;
  disabled_at: string | null;
  stats:       OrgStats;
}
