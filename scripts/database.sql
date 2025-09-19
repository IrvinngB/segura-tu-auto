-- SeguraTuAuto Database Schema
-- Sistema de gestión de seguros de automóviles

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (integrates with Supabase Auth)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'agent', 'adjuster', 'customer')),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Customers table (extends users for customer-specific data)
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    date_of_birth DATE,
    gender VARCHAR(10) CHECK (gender IN ('M', 'F', 'Other')),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(10),
    license_number VARCHAR(50) UNIQUE,
    license_expiry DATE,
    driving_experience_years INTEGER,
    marital_status VARCHAR(20) CHECK (marital_status IN ('single', 'married', 'divorced', 'widowed')),
    occupation VARCHAR(100),
    annual_income DECIMAL(12,2),
    risk_score INTEGER DEFAULT 50,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    make VARCHAR(50) NOT NULL,
    model VARCHAR(50) NOT NULL,
    year INTEGER NOT NULL,
    vin VARCHAR(17) UNIQUE NOT NULL,
    license_plate VARCHAR(20) UNIQUE NOT NULL,
    color VARCHAR(30),
    engine_size VARCHAR(20),
    fuel_type VARCHAR(20) CHECK (fuel_type IN ('Gasolina', 'Diesel', 'Híbrido', 'Eléctrico', 'GLP')),
    transmission VARCHAR(20) CHECK (transmission IN ('Manual', 'Automático', 'CVT')),
    vehicle_type VARCHAR(30) CHECK (vehicle_type IN ('Sedán', 'SUV', 'Hatchback', 'Pickup', 'Convertible', 'Coupé', 'Wagon')),
    usage_type VARCHAR(20) CHECK (usage_type IN ('personal', 'commercial', 'taxi', 'delivery', 'other')),
    estimated_value DECIMAL(12,2) NOT NULL,
    mileage INTEGER,
    safety_features TEXT[], -- Array of safety features
    anti_theft_devices TEXT[], -- Array of anti-theft devices
    garage_type VARCHAR(20) CHECK (garage_type IN ('enclosed', 'covered', 'street')),
    annual_mileage INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Coverage Types table (defines available insurance coverages)
CREATE TABLE IF NOT EXISTS coverage_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    base_premium DECIMAL(10,2) NOT NULL,
    is_mandatory BOOLEAN DEFAULT false,
    coverage_limit DECIMAL(12,2),
    deductible DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Risk Factors table (for premium calculation)
CREATE TABLE IF NOT EXISTS risk_factors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL, -- demographic, vehicle, history, location, etc.
    weight DECIMAL(3,2) NOT NULL, -- multiplier for risk calculation
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Policies table
CREATE TABLE IF NOT EXISTS policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    policy_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES users(id),
    policy_type VARCHAR(50) NOT NULL CHECK (policy_type IN ('Básica', 'Limitada', 'Amplia', 'Premium')),
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'suspended', 'cancelled', 'expired')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    premium_amount DECIMAL(10,2) NOT NULL,
    total_coverage_limit DECIMAL(12,2),
    auto_renewal BOOLEAN DEFAULT false,
    risk_assessment JSONB, -- Store risk calculation details
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Policy Coverages table (many-to-many between policies and coverage types)
CREATE TABLE IF NOT EXISTS policy_coverages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    policy_id UUID REFERENCES policies(id) ON DELETE CASCADE,
    coverage_type_id UUID REFERENCES coverage_types(id) ON DELETE CASCADE,
    coverage_limit DECIMAL(12,2),
    deductible DECIMAL(10,2),
    premium DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(policy_id, coverage_type_id)
);

-- Claims table
CREATE TABLE IF NOT EXISTS claims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    claim_number VARCHAR(50) UNIQUE NOT NULL,
    policy_id UUID REFERENCES policies(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    adjuster_id UUID REFERENCES users(id),
    incident_date TIMESTAMP WITH TIME ZONE NOT NULL,
    claim_type VARCHAR(50) NOT NULL CHECK (claim_type IN ('Colisión', 'Robo', 'Vandalismo', 'Daño por clima', 'Daño por granizo', 'Incendio', 'Otros')),
    status VARCHAR(20) NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'approved', 'denied', 'closed', 'paid')),
    incident_description TEXT NOT NULL,
    incident_location TEXT,
    estimated_damage_cost DECIMAL(12,2),
    approved_amount DECIMAL(12,2),
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Damage Assessments table
CREATE TABLE IF NOT EXISTS damage_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    claim_id UUID REFERENCES claims(id) ON DELETE CASCADE,
    adjuster_id UUID REFERENCES users(id) ON DELETE SET NULL,
    damage_description TEXT NOT NULL,
    repair_estimate DECIMAL(12,2),
    replacement_estimate DECIMAL(12,2),
    recommended_action VARCHAR(50) CHECK (recommended_action IN ('Reparación', 'Reemplazo', 'Pérdida total')),
    assessment_notes TEXT,
    photos TEXT[], -- Array of photo URLs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    policy_id UUID REFERENCES policies(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    claim_id UUID REFERENCES claims(id) ON DELETE SET NULL, -- For claim payments
    payment_type VARCHAR(20) NOT NULL CHECK (payment_type IN ('premium', 'claim', 'refund', 'fee')),
    amount DECIMAL(12,2) NOT NULL,
    payment_method VARCHAR(30) CHECK (payment_method IN ('Tarjeta de crédito', 'Transferencia bancaria', 'Efectivo', 'Cheque', 'PayPal')),
    payment_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
    payment_date TIMESTAMP WITH TIME ZONE,
    due_date DATE,
    reference_number VARCHAR(100),
    transaction_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Communications table (emails, calls, messages)
CREATE TABLE IF NOT EXISTS communications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES users(id) ON DELETE SET NULL,
    policy_id UUID REFERENCES policies(id) ON DELETE SET NULL,
    claim_id UUID REFERENCES claims(id) ON DELETE SET NULL,
    communication_type VARCHAR(20) NOT NULL CHECK (communication_type IN ('email', 'phone', 'sms', 'chat', 'letter')),
    direction VARCHAR(10) NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    subject VARCHAR(200),
    content TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('draft', 'sent', 'delivered', 'read', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Documents table (for storing policy documents, claims documents, etc.)
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    policy_id UUID REFERENCES policies(id) ON DELETE SET NULL,
    claim_id UUID REFERENCES claims(id) ON DELETE SET NULL,
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('policy', 'claim_form', 'photo', 'repair_estimate', 'police_report', 'medical_report', 'other')),
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Audit Log table (for tracking changes)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(50) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_values JSONB,
    new_values JSONB,
    changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_customer_id ON vehicles(customer_id);
CREATE INDEX IF NOT EXISTS idx_policies_customer_id ON policies(customer_id);
CREATE INDEX IF NOT EXISTS idx_policies_status ON policies(status);
CREATE INDEX IF NOT EXISTS idx_policies_policy_number ON policies(policy_number);
CREATE INDEX IF NOT EXISTS idx_claims_policy_id ON claims(policy_id);
CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status);
CREATE INDEX IF NOT EXISTS idx_claims_claim_number ON claims(claim_number);
CREATE INDEX IF NOT EXISTS idx_payments_policy_id ON payments(policy_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_communications_customer_id ON communications(customer_id);
CREATE INDEX IF NOT EXISTS idx_documents_customer_id ON documents(customer_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON audit_logs(table_name, record_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_policies_updated_at BEFORE UPDATE ON policies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_claims_updated_at BEFORE UPDATE ON claims FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_damage_assessments_updated_at BEFORE UPDATE ON damage_assessments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all users" ON users FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can manage all users" ON users FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- RLS Policies for customers table
CREATE POLICY "Customers can view their own data" ON customers FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Customers can update their own data" ON customers FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Agents and admins can view customer data" ON customers FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'agent', 'adjuster'))
);
CREATE POLICY "Agents and admins can manage customer data" ON customers FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'agent'))
);

-- RLS Policies for vehicles table
CREATE POLICY "Customers can view their own vehicles" ON vehicles FOR SELECT USING (
    customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
);
CREATE POLICY "Customers can manage their own vehicles" ON vehicles FOR ALL USING (
    customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
);
CREATE POLICY "Agents and admins can view all vehicles" ON vehicles FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'agent', 'adjuster'))
);
CREATE POLICY "Agents and admins can manage vehicles" ON vehicles FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'agent'))
);

-- RLS Policies for policies table
CREATE POLICY "Customers can view their own policies" ON policies FOR SELECT USING (
    customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
);
CREATE POLICY "Staff can view all policies" ON policies FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'agent', 'adjuster'))
);
CREATE POLICY "Agents and admins can manage policies" ON policies FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'agent'))
);

-- RLS Policies for claims table
CREATE POLICY "Customers can view their own claims" ON claims FOR SELECT USING (
    customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
);
CREATE POLICY "Customers can create claims" ON claims FOR INSERT WITH CHECK (
    customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
);
CREATE POLICY "Staff can view all claims" ON claims FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'agent', 'adjuster'))
);
CREATE POLICY "Staff can manage claims" ON claims FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'agent', 'adjuster'))
);

-- RLS Policies for payments table
CREATE POLICY "Customers can view their own payments" ON payments FOR SELECT USING (
    customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
);
CREATE POLICY "Staff can view all payments" ON payments FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'agent', 'adjuster'))
);
CREATE POLICY "Agents and admins can manage payments" ON payments FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'agent'))
);

-- RLS Policies for communications table
CREATE POLICY "Customers can view their own communications" ON communications FOR SELECT USING (
    customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
);
CREATE POLICY "Staff can view all communications" ON communications FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'agent', 'adjuster'))
);
CREATE POLICY "Staff can manage communications" ON communications FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'agent', 'adjuster'))
);

-- RLS Policies for documents table
CREATE POLICY "Customers can view their own documents" ON documents FOR SELECT USING (
    customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
);
CREATE POLICY "Customers can upload documents" ON documents FOR INSERT WITH CHECK (
    customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
);
CREATE POLICY "Staff can view all documents" ON documents FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'agent', 'adjuster'))
);
CREATE POLICY "Staff can manage documents" ON documents FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'agent', 'adjuster'))
);
