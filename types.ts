export interface Property {
  name: string;
  source: string;
  sourceType: string | null;
  receiver: string;
  receiverType: string | null;
  conversionRuleCode: string | null;
  code: string;
  isSearch: boolean;
  properties: Property[];
  handler: string | null;
  getFromIncomingData?: boolean;
}

export interface Rule {
  type: 'ПКО' | 'ПВД' | 'Алгоритм' | 'Параметр' | 'Запрос';
  id: string;
  name: string;
  rawXml?: string;
  source?: string;
  receiver?: string;
  properties?: Property[];
  afterLoad?: string;
  onLoad?: string;
  beforeConvert?: string;
  afterLoadParams?: string;
  conversionRuleCode?: string;
  dataSelectionMethod?: string;
  beforeRuleProcessing?: string;
  code?: string;
}

export interface RuleGroup {
  name: string;
  rules?: Rule[];
  subGroups?: RuleGroup[];
  path?: string; // Unique path for state management (e.g., collapse)
}

export interface ParsedData {
  name: string;
  sourceConfig: string;
  receiverConfig: string;
  beforeExport: string;
  afterLoad: string;
  pko: RuleGroup[];
  pvd: Rule[];
  algorithms: Rule[];
  parameters: Rule[];
  requests: Rule[];
}