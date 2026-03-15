export type RiskLevel = 'Low' | 'Medium' | 'High';

export type NewsArticle = {
  number:       number;
  title:        string;
  sourceUrl:    string;
  sourceDomain: string;
  summary:      string;
};

// Partial intake shape used when reading sessions back from localStorage
export type IntakeData = {
  company:      string;
  industry:     string;
  fundingStage: string;
};

export type Session = {
  id:        string;
  createdAt: string;
  intake: {
    company:        string;
    industry:       string;
    fundingStage:   string;
    primaryRegion?: string;
    revenueModel?:  string;
    decision?:      string;
    status?:        string;
  };
  confidence: number;
  riskLevel:  string;
};

export type SortKey = 'industry' | 'confidence' | 'createdAt';
export type SortDir = 'asc' | 'desc';
