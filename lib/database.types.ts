export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ai_chat_sessions: {
        Row: {
          created_at: string | null
          id: string
          messages: Json | null
          organization_id: string
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          messages?: Json | null
          organization_id: string
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          messages?: Json | null
          organization_id?: string
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_chat_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_chat_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_vulnerabilities: {
        Row: {
          assessed_at: string | null
          assessed_by: string | null
          asset_id: string
          created_at: string | null
          id: string
          impact: number
          is_accepted: boolean | null
          likelihood: number
          organization_id: string
          risk_level: Database["public"]["Enums"]["risk_level"] | null
          risk_score: number | null
          treatment_notes: string | null
          treatment_option: string | null
          updated_at: string | null
          vulnerability_id: string
        }
        Insert: {
          assessed_at?: string | null
          assessed_by?: string | null
          asset_id: string
          created_at?: string | null
          id?: string
          impact?: number
          is_accepted?: boolean | null
          likelihood?: number
          organization_id: string
          risk_level?: Database["public"]["Enums"]["risk_level"] | null
          risk_score?: number | null
          treatment_notes?: string | null
          treatment_option?: string | null
          updated_at?: string | null
          vulnerability_id: string
        }
        Update: {
          assessed_at?: string | null
          assessed_by?: string | null
          asset_id?: string
          created_at?: string | null
          id?: string
          impact?: number
          is_accepted?: boolean | null
          likelihood?: number
          organization_id?: string
          risk_level?: Database["public"]["Enums"]["risk_level"] | null
          risk_score?: number | null
          treatment_notes?: string | null
          treatment_option?: string | null
          updated_at?: string | null
          vulnerability_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "asset_vulnerabilities_assessed_by_fkey"
            columns: ["assessed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_vulnerabilities_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_vulnerabilities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_vulnerabilities_vulnerability_id_fkey"
            columns: ["vulnerability_id"]
            isOneToOne: false
            referencedRelation: "vulnerabilities"
            referencedColumns: ["id"]
          },
        ]
      }
      assets: {
        Row: {
          availability: number
          confidentiality: number
          created_at: string | null
          created_by: string | null
          criticality: Database["public"]["Enums"]["asset_criticality"] | null
          criticality_score: number | null
          description: string | null
          id: string
          integrity: number
          ip_address: string | null
          is_active: boolean | null
          location: string | null
          name: string
          notes: string | null
          organization_id: string
          owner: string | null
          tags: string[] | null
          type: Database["public"]["Enums"]["asset_type"]
          updated_at: string | null
          vendor: string | null
          version: string | null
        }
        Insert: {
          availability?: number
          confidentiality?: number
          created_at?: string | null
          created_by?: string | null
          criticality?: Database["public"]["Enums"]["asset_criticality"] | null
          criticality_score?: number | null
          description?: string | null
          id?: string
          integrity?: number
          ip_address?: string | null
          is_active?: boolean | null
          location?: string | null
          name: string
          notes?: string | null
          organization_id: string
          owner?: string | null
          tags?: string[] | null
          type: Database["public"]["Enums"]["asset_type"]
          updated_at?: string | null
          vendor?: string | null
          version?: string | null
        }
        Update: {
          availability?: number
          confidentiality?: number
          created_at?: string | null
          created_by?: string | null
          criticality?: Database["public"]["Enums"]["asset_criticality"] | null
          criticality_score?: number | null
          description?: string | null
          id?: string
          integrity?: number
          ip_address?: string | null
          is_active?: boolean | null
          location?: string | null
          name?: string
          notes?: string | null
          organization_id?: string
          owner?: string | null
          tags?: string[] | null
          type?: Database["public"]["Enums"]["asset_type"]
          updated_at?: string | null
          vendor?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_findings: {
        Row: {
          affected_asset_id: string | null
          ai_explanation: string | null
          ai_generated: boolean | null
          assigned_to: string | null
          created_at: string | null
          created_by: string | null
          description: string
          finding_number: string | null
          id: string
          impact: number | null
          likelihood: number | null
          organization_id: string
          recommendation: string | null
          related_control_id: string | null
          remediation_deadline: string | null
          remediation_notes: string | null
          remediation_owner: string | null
          resolved_at: string | null
          risk_level: string | null
          risk_score: number | null
          severity: Database["public"]["Enums"]["finding_severity"]
          source: Database["public"]["Enums"]["finding_source"]
          status: Database["public"]["Enums"]["finding_status"]
          title: string
          updated_at: string | null
          vulnerability_id: string | null
        }
        Insert: {
          affected_asset_id?: string | null
          ai_explanation?: string | null
          ai_generated?: boolean | null
          assigned_to?: string | null
          created_at?: string | null
          created_by?: string | null
          description: string
          finding_number?: string | null
          id?: string
          impact?: number | null
          likelihood?: number | null
          organization_id: string
          recommendation?: string | null
          related_control_id?: string | null
          remediation_deadline?: string | null
          remediation_notes?: string | null
          remediation_owner?: string | null
          resolved_at?: string | null
          risk_level?: string | null
          risk_score?: number | null
          severity?: Database["public"]["Enums"]["finding_severity"]
          source?: Database["public"]["Enums"]["finding_source"]
          status?: Database["public"]["Enums"]["finding_status"]
          title: string
          updated_at?: string | null
          vulnerability_id?: string | null
        }
        Update: {
          affected_asset_id?: string | null
          ai_explanation?: string | null
          ai_generated?: boolean | null
          assigned_to?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string
          finding_number?: string | null
          id?: string
          impact?: number | null
          likelihood?: number | null
          organization_id?: string
          recommendation?: string | null
          related_control_id?: string | null
          remediation_deadline?: string | null
          remediation_notes?: string | null
          remediation_owner?: string | null
          resolved_at?: string | null
          risk_level?: string | null
          risk_score?: number | null
          severity?: Database["public"]["Enums"]["finding_severity"]
          source?: Database["public"]["Enums"]["finding_source"]
          status?: Database["public"]["Enums"]["finding_status"]
          title?: string
          updated_at?: string | null
          vulnerability_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_findings_affected_asset_id_fkey"
            columns: ["affected_asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_findings_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_findings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_findings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_findings_related_control_id_fkey"
            columns: ["related_control_id"]
            isOneToOne: false
            referencedRelation: "iso_controls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_findings_vulnerability_id_fkey"
            columns: ["vulnerability_id"]
            isOneToOne: false
            referencedRelation: "vulnerabilities"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_reports: {
        Row: {
          audit_date: string | null
          auditor_name: string | null
          created_at: string | null
          executive_summary: string | null
          final_opinion: string | null
          generated_at: string | null
          generated_by: string | null
          id: string
          methodology: string | null
          next_audit_date: string | null
          opinion_notes: string | null
          organization_id: string
          scope_description: string | null
          snapshot: Json | null
          status: string | null
          title: string
          updated_at: string | null
          version: string | null
        }
        Insert: {
          audit_date?: string | null
          auditor_name?: string | null
          created_at?: string | null
          executive_summary?: string | null
          final_opinion?: string | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          methodology?: string | null
          next_audit_date?: string | null
          opinion_notes?: string | null
          organization_id: string
          scope_description?: string | null
          snapshot?: Json | null
          status?: string | null
          title: string
          updated_at?: string | null
          version?: string | null
        }
        Update: {
          audit_date?: string | null
          auditor_name?: string | null
          created_at?: string | null
          executive_summary?: string | null
          final_opinion?: string | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          methodology?: string | null
          next_audit_date?: string | null
          opinion_notes?: string | null
          organization_id?: string
          scope_description?: string | null
          snapshot?: Json | null
          status?: string | null
          title?: string
          updated_at?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_reports_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_reports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      control_assessments: {
        Row: {
          control_id: string
          created_at: string | null
          created_by: string | null
          id: string
          implementation_details: string | null
          notes: string | null
          organization_id: string
          responsible_person: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["control_status"]
          target_date: string | null
          updated_at: string | null
        }
        Insert: {
          control_id: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          implementation_details?: string | null
          notes?: string | null
          organization_id: string
          responsible_person?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["control_status"]
          target_date?: string | null
          updated_at?: string | null
        }
        Update: {
          control_id?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          implementation_details?: string | null
          notes?: string | null
          organization_id?: string
          responsible_person?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["control_status"]
          target_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "control_assessments_control_id_fkey"
            columns: ["control_id"]
            isOneToOne: false
            referencedRelation: "iso_controls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "control_assessments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "control_assessments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "control_assessments_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      evidence_files: {
        Row: {
          control_assessment_id: string | null
          control_id: string | null
          created_at: string | null
          description: string | null
          evidence_type: Database["public"]["Enums"]["evidence_type"] | null
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          organization_id: string
          tags: string[] | null
          uploaded_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          control_assessment_id?: string | null
          control_id?: string | null
          created_at?: string | null
          description?: string | null
          evidence_type?: Database["public"]["Enums"]["evidence_type"] | null
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          organization_id: string
          tags?: string[] | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          control_assessment_id?: string | null
          control_id?: string | null
          created_at?: string | null
          description?: string | null
          evidence_type?: Database["public"]["Enums"]["evidence_type"] | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          organization_id?: string
          tags?: string[] | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evidence_files_control_assessment_id_fkey"
            columns: ["control_assessment_id"]
            isOneToOne: false
            referencedRelation: "control_assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evidence_files_control_id_fkey"
            columns: ["control_id"]
            isOneToOne: false
            referencedRelation: "iso_controls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evidence_files_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evidence_files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      iso_controls: {
        Row: {
          control_id: string
          created_at: string | null
          description: string | null
          domain_id: string
          guidance: string | null
          id: string
          is_mandatory: boolean | null
          name: string
          sort_order: number | null
        }
        Insert: {
          control_id: string
          created_at?: string | null
          description?: string | null
          domain_id: string
          guidance?: string | null
          id?: string
          is_mandatory?: boolean | null
          name: string
          sort_order?: number | null
        }
        Update: {
          control_id?: string
          created_at?: string | null
          description?: string | null
          domain_id?: string
          guidance?: string | null
          id?: string
          is_mandatory?: boolean | null
          name?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "iso_controls_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "iso_domains"
            referencedColumns: ["id"]
          },
        ]
      }
      iso_docs: {
        Row: {
          content: string | null
          embedding: string | null
          id: string
        }
        Insert: {
          content?: string | null
          embedding?: string | null
          id?: string
        }
        Update: {
          content?: string | null
          embedding?: string | null
          id?: string
        }
        Relationships: []
      }
      iso_documents: {
        Row: {
          content: string
          created_at: string | null
          embedding: string | null
          id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          embedding?: string | null
          id?: string
        }
        Update: {
          content?: string
          created_at?: string | null
          embedding?: string | null
          id?: string
        }
        Relationships: []
      }
      iso_domains: {
        Row: {
          code: string
          control_count: number | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          sort_order: number | null
        }
        Insert: {
          code: string
          control_count?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          sort_order?: number | null
        }
        Update: {
          code?: string
          control_count?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      iso_knowledge: {
        Row: {
          content: string | null
          embedding: string | null
          id: string
        }
        Insert: {
          content?: string | null
          embedding?: string | null
          id?: string
        }
        Update: {
          content?: string | null
          embedding?: string | null
          id?: string
        }
        Relationships: []
      }
      organizations: {
        Row: {
          address: string | null
          audit_period_end: string | null
          audit_period_start: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          country: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          employee_count: number | null
          exposure_level: Database["public"]["Enums"]["exposure_level"]
          id: string
          logo_url: string | null
          name: string
          risk_appetite: string | null
          scope_description: string | null
          sector: Database["public"]["Enums"]["business_sector"]
          system_types: string[] | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          audit_period_end?: string | null
          audit_period_start?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          employee_count?: number | null
          exposure_level?: Database["public"]["Enums"]["exposure_level"]
          id?: string
          logo_url?: string | null
          name: string
          risk_appetite?: string | null
          scope_description?: string | null
          sector?: Database["public"]["Enums"]["business_sector"]
          system_types?: string[] | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          audit_period_end?: string | null
          audit_period_start?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          employee_count?: number | null
          exposure_level?: Database["public"]["Enums"]["exposure_level"]
          id?: string
          logo_url?: string | null
          name?: string
          risk_appetite?: string | null
          scope_description?: string | null
          sector?: Database["public"]["Enums"]["business_sector"]
          system_types?: string[] | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          organization_id: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          organization_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          organization_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_organization"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      vulnerabilities: {
        Row: {
          base_impact: number
          base_likelihood: number
          category: string | null
          created_at: string | null
          cwe_ids: string[] | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          owasp_id: string
          reference_links: string[] | null
          remediation_guidance: string | null
        }
        Insert: {
          base_impact?: number
          base_likelihood?: number
          category?: string | null
          created_at?: string | null
          cwe_ids?: string[] | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          owasp_id: string
          reference_links?: string[] | null
          remediation_guidance?: string | null
        }
        Update: {
          base_impact?: number
          base_likelihood?: number
          category?: string | null
          created_at?: string | null
          cwe_ids?: string[] | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          owasp_id?: string
          reference_links?: string[] | null
          remediation_guidance?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      match_iso_docs:
        | {
            Args: { query_embedding: string }
            Returns: {
              content: string
              id: string
              similarity: number
            }[]
          }
        | {
            Args: { match_count: number; query_embedding: string }
            Returns: {
              content: string
              id: string
              similarity: number
            }[]
          }
        | {
            Args: {
              filter_org_id?: string
              match_count?: number
              query_embedding: string
            }
            Returns: {
              content: string
              id: string
              metadata: Json
              similarity: number
            }[]
          }
    }
    Enums: {
      asset_criticality: "critical" | "high" | "medium" | "low"
      asset_type:
        | "hardware"
        | "software"
        | "data"
        | "service"
        | "personnel"
        | "facility"
      business_sector:
        | "financial"
        | "healthcare"
        | "government"
        | "education"
        | "retail"
        | "manufacturing"
        | "technology"
        | "telecommunications"
        | "other"
      control_status:
        | "compliant"
        | "partial"
        | "non_compliant"
        | "not_applicable"
      evidence_type:
        | "document"
        | "screenshot"
        | "policy"
        | "procedure"
        | "log"
        | "certificate"
        | "other"
      exposure_level:
        | "internet_facing"
        | "internal"
        | "restricted"
        | "air_gapped"
      finding_severity: "critical" | "high" | "medium" | "low" | "informational"
      finding_source:
        | "risk_assessment"
        | "checklist"
        | "manual"
        | "ai_generated"
      finding_status:
        | "open"
        | "in_progress"
        | "resolved"
        | "accepted"
        | "closed"
      risk_level: "critical" | "high" | "medium" | "low" | "negligible"
      user_role: "admin" | "auditor" | "auditee"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      asset_criticality: ["critical", "high", "medium", "low"],
      asset_type: [
        "hardware",
        "software",
        "data",
        "service",
        "personnel",
        "facility",
      ],
      business_sector: [
        "financial",
        "healthcare",
        "government",
        "education",
        "retail",
        "manufacturing",
        "technology",
        "telecommunications",
        "other",
      ],
      control_status: [
        "compliant",
        "partial",
        "non_compliant",
        "not_applicable",
      ],
      evidence_type: [
        "document",
        "screenshot",
        "policy",
        "procedure",
        "log",
        "certificate",
        "other",
      ],
      exposure_level: [
        "internet_facing",
        "internal",
        "restricted",
        "air_gapped",
      ],
      finding_severity: ["critical", "high", "medium", "low", "informational"],
      finding_source: [
        "risk_assessment",
        "checklist",
        "manual",
        "ai_generated",
      ],
      finding_status: ["open", "in_progress", "resolved", "accepted", "closed"],
      risk_level: ["critical", "high", "medium", "low", "negligible"],
      user_role: ["admin", "auditor", "auditee"],
    },
  },
} as const
