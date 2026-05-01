export interface AnalyticsInventory {
  articlesPublished: number;
  articlesDraft:     number;
  articlesArchived:  number;
  tagsCount:         number;
  treesCount:        number;
}

export interface ArticleSummary {
  id:           string;
  title:        string;
  lastUpdated:  string;
  categoryName?: string | null;
}

export interface TopContributor {
  userId:      string;
  email:       string;
  count:       number;
  recentCount: number;
}

export interface CategoryCoverage {
  categoryId: string;
  name:       string;
  count:      number;
}

export interface TopTag {
  id:          string;
  displayName: string;
  count:       number;
}

export interface UnusedTag {
  id:          string;
  displayName: string;
}

export interface AnalyticsOverview {
  inventory:           AnalyticsInventory;
  articlesToReview:    ArticleSummary[];
  orphanDrafts:        ArticleSummary[];
  articlesWithoutTags: ArticleSummary[];
  topContributors:     TopContributor[];
  coverageByCategory:  CategoryCoverage[];
  topTags:             TopTag[];
  unusedTags:          UnusedTag[];
}
