import type { Database } from './database'

/* ================================
   Core Row Types
================================ */

export type Organization =
  Database['public']['Tables']['organizations']['Row']

export type Profile =
  Database['public']['Tables']['profiles']['Row']

export type Asset =
  Database['public']['Tables']['assets']['Row']

export type Vulnerability =
  Database['public']['Tables']['vulnerabilities']['Row']

export type AssetVulnerability =
  Database['public']['Tables']['asset_vulnerabilities']['Row']


/* ================================
   Insert Types
================================ */

export type AssetInsert =
  Database['public']['Tables']['assets']['Insert']

export type VulnerabilityInsert =
  Database['public']['Tables']['vulnerabilities']['Insert']

export type AssetVulnerabilityInsert =
  Database['public']['Tables']['asset_vulnerabilities']['Insert']


/* ================================
   Update Types
================================ */

export type AssetUpdate =
  Database['public']['Tables']['assets']['Update']

export type VulnerabilityUpdate =
  Database['public']['Tables']['vulnerabilities']['Update']

export type AssetVulnerabilityUpdate =
  Database['public']['Tables']['asset_vulnerabilities']['Update']

/* ================================
   Enum Types
================================ */

export type AssetType =
  | 'data'
  | 'hardware'
  | 'software'
  | 'service'
  | 'personnel'
  | 'facility'  