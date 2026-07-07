/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Employee {
  id: string;
  name: string;
  department: string;
  role: string;
  age: number;
  monthly_income: number;
  years_at_company: number;
  years_since_last_promotion: number;
  distance_from_home_km: number;
  overtime: string; // "Yes" | "No"
  job_satisfaction: number; // 1 to 4
  work_life_balance: number; // 1 to 4
  environment_satisfaction: number; // 1 to 4
  num_companies_worked: number;
  training_hours_last_year: number;
  attrition?: string; // "Yes" | "No"
  
  // Scored outputs (from backend)
  riskScore?: number; // 0 to 100
  riskLevel?: "Low" | "Medium" | "High";
  topRiskFactors?: {
    factor: string;
    label: string;
    impact: number;
    currentValue: string;
    description: string;
  }[];
}

export type ThemeName = "slate" | "emerald" | "coral" | "midnight" | "trendex" | "sage-hr";

export interface Locale {
  title: string;
  subtitle: string;
  uploadBtn: string;
  dragDropText: string;
  atRiskCount: string;
  avgRisk: string;
  filterAll: string;
  filterHigh: string;
  filterMed: string;
  filterLow: string;
  searchPlaceholder: string;
  colName: string;
  colDept: string;
  colRisk: string;
  colScore: string;
  riskLow: string;
  riskMed: string;
  riskHigh: string;
  factorsTitle: string;
  assistantTitle: string;
  generateBtn: string;
  talkingPointsTab: string;
  emailTab: string;
  copiedMsg: string;
  noSelectionMsg: string;
  backToAllBtn: string;
  overtime: string;
  satisfaction: string;
  workLife: string;
  commute: string;
  salary: string;
  reTrainSuccess: string;
  reTrainError: string;
  unsupportedColumns: string;
  downloadSample: string;
  analyzingData: string;
  creatingPlan: string;
  draftingEmail: string;
  personnelCount: string;
  flightRisk: string;
  aiEngineStatus: string;
  copy: string;
  regenerate: string;
  disclaimer: string;
}
