export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: 'customer' | 'agent' | 'adjuster' | 'admin';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  user_id: string;
  date_of_birth?: string;
  gender?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  license_number?: string;
  license_expiry?: string;
  driving_experience_years?: number;
  marital_status?: string;
  occupation?: string;
  annual_income?: number;
  risk_score: number;
  created_at: string;
  updated_at: string;
  user?: User;
}

export interface Vehicle {
  id: string;
  customer_id: string;
  make: string;
  model: string;
  year: number;
  vin?: string;
  license_plate?: string;
  color?: string;
  engine_size?: string;
  fuel_type?: string;
  transmission?: string;
  vehicle_type?: string;
  usage_type?: string;
  estimated_value?: number;
  mileage?: number;
  safety_features?: string[];
  anti_theft_devices?: string[];
  garage_type?: string;
  annual_mileage?: number;
  created_at: string;
  updated_at: string;
}

export interface Quote {
  id: string;
  quote_number: string;
  customer_id: string;
  vehicle_id: string;
  agent_id?: string;
  policy_type: 'basica' | 'limitada' | 'amplia';
  status: 'pending' | 'approved' | 'rejected' | 'converted';
  start_date: string;
  end_date: string;
  premium_amount: number;
  payment_frequency: 'monthly' | 'quarterly' | 'biannual' | 'annual';
  auto_renewal: boolean;
  selected_coverages?: any;
  driver_data?: any;
  vehicle_data?: any;
  risk_assessment?: any;
  agent_notes?: string;
  reviewed_at?: string;
  rejected_reason?: string;
  created_at: string;
  updated_at: string;
  expires_at: string;
  customer?: Customer;
  vehicle?: Vehicle;
  agent?: User;
}

export interface Policy {
  id: string;
  policy_number: string;
  customer_id: string;
  vehicle_id: string;
  agent_id?: string;
  policy_type: string;
  status: 'draft' | 'active' | 'expired' | 'cancelled' | 'suspended';
  start_date: string;
  end_date: string;
  premium_amount: number;
  total_coverage_limit?: number;
  payment_frequency: string;
  auto_renewal: boolean;
  risk_assessment?: any;
  discount_applied: number;
  created_at: string;
  updated_at: string;
  customer?: Customer;
  vehicle?: Vehicle;
  agent?: User;
}

export interface Claim {
  id: string;
  claim_number: string;
  policy_id: string;
  customer_id: string;
  adjuster_id?: string;
  incident_date: string;
  report_date: string;
  claim_type: string;
  status:
    | 'submitted'
    | 'under_review'
    | 'pending_documentation'
    | 'waiting_approval'
    | 'investigating'
    | 'approved'
    | 'processing_payment'
    | 'denied'
    | 'closed'
    | 'paid';
  incident_description: string;
  incident_location?: string;
  police_report_number?: string;
  estimated_damage_cost?: number;
  approved_amount?: number;
  paid_amount?: number;
  deductible_amount?: number;
  fault_percentage: number;
  third_party_involved: boolean;
  injury_involved: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
  policy?: Policy;
  customer?: Customer;
  adjuster?: User;
}

export interface ClaimDocument {
  id: string;
  claim_id: string;
  document_type: string;
  file_name: string;
  file_path: string;
  file_size?: number;
  mime_type?: string;
  uploaded_by?: string;
  is_verified: boolean;
  created_at: string;
}

export interface DamageAssessment {
  id: string;
  claim_id: string;
  adjuster_id: string;
  assessment_date: string;
  damage_description: string;
  repair_estimate?: number;
  replacement_estimate?: number;
  recommended_action?: string;
  photos?: string[];
  assessment_notes?: string;
  is_final: boolean;
  created_at: string;
  updated_at: string;
  adjuster?: User;
}

export interface CoverageType {
  id: string;
  name: string;
  description?: string;
  base_premium: number;
  is_mandatory: boolean;
  coverage_limit?: number;
  deductible?: number;
  is_active: boolean;
  created_at: string;
}

export interface PolicyCoverage {
  id: string;
  policy_id: string;
  coverage_type_id: string;
  coverage_limit?: number;
  deductible?: number;
  premium: number;
  is_active: boolean;
  created_at: string;
  coverage_type?: CoverageType;
}

export interface Payment {
  id: string;
  policy_id?: string;
  claim_id?: string;
  customer_id: string;
  payment_type: 'premium' | 'claim' | 'refund';
  amount: number;
  payment_method?: string;
  payment_status: 'pending' | 'completed' | 'failed' | 'cancelled' | 'refunded';
  transaction_id?: string;
  payment_date?: string;
  due_date?: string;
  reference_number?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Communication {
  id: string;
  customer_id: string;
  agent_id?: string;
  policy_id?: string;
  claim_id?: string;
  communication_type: 'email' | 'phone' | 'chat' | 'sms' | 'letter';
  direction: 'inbound' | 'outbound';
  subject?: string;
  content: string;
  status: 'draft' | 'sent' | 'delivered' | 'read' | 'failed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  action_url?: string;
  expires_at?: string;
  created_at: string;
}
