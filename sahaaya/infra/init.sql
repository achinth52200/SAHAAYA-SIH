-- SAHAAYA Database Schema
-- Initialize database with required tables and indexes

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Victims table
CREATE TABLE IF NOT EXISTS victims (
    victim_id VARCHAR(50) PRIMARY KEY,
    age_group VARCHAR(20),
    gender VARCHAR(20),
    preferred_language VARCHAR(10),
    case_registered_date TIMESTAMP WITH TIME ZONE,
    district VARCHAR(100),
    state VARCHAR(100),
    case_type VARCHAR(100),
    consent_given BOOLEAN DEFAULT TRUE,
    consent_date TIMESTAMP WITH TIME ZONE,
    consent_data JSONB DEFAULT '{}',
    communication_preferences TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Check-ins table
CREATE TABLE IF NOT EXISTS checkins (
    checkin_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    victim_id VARCHAR(50) REFERENCES victims(victim_id),
    checkin_date TIMESTAMP WITH TIME ZONE NOT NULL,
    scores JSONB NOT NULL,
    channel VARCHAR(50),
    completed BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Case events table
CREATE TABLE IF NOT EXISTS case_events (
    event_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    victim_id VARCHAR(50) REFERENCES victims(victim_id),
    event_type VARCHAR(100) NOT NULL,
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    description TEXT,
    stress_impact INTEGER DEFAULT 0,
    source VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Text interactions table
CREATE TABLE IF NOT EXISTS text_interactions (
    interaction_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    victim_id VARCHAR(50) REFERENCES victims(victim_id),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    text TEXT NOT NULL,
    language VARCHAR(10),
    source VARCHAR(50),
    predicted_emotion VARCHAR(50),
    emotion_confidence REAL,
    all_probabilities JSONB,
    ground_truth_emotion VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Voice features table
CREATE TABLE IF NOT EXISTS voice_features (
    voice_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    victim_id VARCHAR(50) REFERENCES victims(victim_id),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    features JSONB NOT NULL,
    duration_seconds INTEGER,
    consented BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Behavioural patterns table
CREATE TABLE IF NOT EXISTS behavioural_patterns (
    pattern_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    victim_id VARCHAR(50) REFERENCES victims(victim_id),
    date DATE NOT NULL,
    pattern_type VARCHAR(50) NOT NULL,
    severity INTEGER DEFAULT 1,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Distress scores table
CREATE TABLE IF NOT EXISTS distress_scores (
    score_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    victim_id VARCHAR(50) REFERENCES victims(victim_id),
    week VARCHAR(20) NOT NULL,
    date DATE NOT NULL,
    distress_score REAL NOT NULL,
    band VARCHAR(20) NOT NULL,
    components JSONB NOT NULL,
    personal_baseline REAL,
    contributing_factors JSONB DEFAULT '[]',
    escalation_probability_7d REAL,
    escalation_probability_30d REAL,
    trend_direction VARCHAR(20),
    confidence REAL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Alerts table
CREATE TABLE IF NOT EXISTS alerts (
    alert_id VARCHAR(50) PRIMARY KEY,
    victim_id VARCHAR(50) REFERENCES victims(victim_id),
    distress_score REAL NOT NULL,
    band VARCHAR(20) NOT NULL,
    priority VARCHAR(20) NOT NULL,
    status VARCHAR(50) DEFAULT 'new',
    narrative TEXT,
    clinical_summary TEXT,
    primary_factors JSONB DEFAULT '[]',
    recommended_actions JSONB DEFAULT '[]',
    assigned_to VARCHAR(100),
    assigned_role VARCHAR(50),
    assigned_at TIMESTAMP WITH TIME ZONE,
    reviewed_by VARCHAR(100),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    review_decision VARCHAR(50),
    review_notes TEXT,
    escalated_to VARCHAR(100),
    escalated_at TIMESTAMP WITH TIME ZONE,
    escalation_reason TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    source VARCHAR(50) DEFAULT 'ai_pipeline',
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Interventions table
CREATE TABLE IF NOT EXISTS interventions (
    intervention_id VARCHAR(50) PRIMARY KEY,
    alert_id VARCHAR(50) REFERENCES alerts(alert_id),
    victim_id VARCHAR(50) REFERENCES victims(victim_id),
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    priority VARCHAR(20) NOT NULL,
    status VARCHAR(50) DEFAULT 'planned',
    status_history JSONB DEFAULT '[]',
    assigned_to VARCHAR(100),
    assigned_role VARCHAR(50),
    assigned_by VARCHAR(100),
    planned_start TIMESTAMP WITH TIME ZONE,
    actual_start TIMESTAMP WITH TIME ZONE,
    planned_end TIMESTAMP WITH TIME ZONE,
    actual_end TIMESTAMP WITH TIME ZONE,
    outcome TEXT,
    outcome_notes TEXT,
    effectiveness_rating INTEGER CHECK (effectiveness_rating BETWEEN 1 AND 5),
    victim_feedback TEXT,
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_date TIMESTAMP WITH TIME ZONE,
    follow_up_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Review actions table
CREATE TABLE IF NOT EXISTS review_actions (
    action_id VARCHAR(50) PRIMARY KEY,
    alert_id VARCHAR(50) REFERENCES alerts(alert_id),
    actor_id VARCHAR(100) NOT NULL,
    actor_role VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    notes TEXT,
    interventions_created TEXT[],
    review_duration_seconds INTEGER,
    previous_status VARCHAR(50),
    new_status VARCHAR(50),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    actor_id VARCHAR(100),
    actor_role VARCHAR(50),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id VARCHAR(100),
    details JSONB DEFAULT '{}',
    ip_address VARCHAR(50),
    user_agent TEXT,
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT
);

-- Users table (for auth)
CREATE TABLE IF NOT EXISTS users (
    user_id VARCHAR(50) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    name VARCHAR(200),
    district VARCHAR(100),
    state VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Refresh tokens table
CREATE TABLE IF NOT EXISTS refresh_tokens (
    token_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(50) REFERENCES users(user_id),
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_checkins_victim_date ON checkins(victim_id, checkin_date DESC);
CREATE INDEX IF NOT EXISTS idx_case_events_victim_date ON case_events(victim_id, event_date DESC);
CREATE INDEX IF NOT EXISTS idx_text_interactions_victim_timestamp ON text_interactions(victim_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_voice_features_victim_timestamp ON voice_features(victim_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_behavioural_patterns_victim_date ON behavioural_patterns(victim_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_distress_scores_victim_week ON distress_scores(victim_id, week DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_victim_status ON alerts(victim_id, status);
CREATE INDEX IF NOT EXISTS idx_alerts_priority_status ON alerts(priority, status);
CREATE INDEX IF NOT EXISTS idx_alerts_assigned_to ON alerts(assigned_to);
CREATE INDEX IF NOT EXISTS idx_interventions_alert ON interventions(alert_id);
CREATE INDEX IF NOT EXISTS idx_interventions_victim_status ON interventions(victim_id, status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);

-- Insert demo users (password: demo123 hashed with bcrypt)
INSERT INTO users (user_id, email, password_hash, role, name, district, state) VALUES
('COUNSELLOR_001', 'counsellor@sahaaya.gov.in', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PZvO.S', 'counsellor', 'Dr. Priya Sharma', 'District_12', 'State_2'),
('DISTRICT_001', 'district@sahaaya.gov.in', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PZvO.S', 'district_officer', 'Officer Rajesh Kumar', 'District_14', 'State_2'),
('STATE_001', 'state@sahaaya.gov.in', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PZvO.S', 'state_officer', 'Officer Anjali Patel', NULL, 'State_2'),
('NATIONAL_001', 'national@sahaaya.gov.in', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PZvO.S', 'national_admin', 'Director General', NULL, NULL)
ON CONFLICT (user_id) DO NOTHING;

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO sahaaya;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO sahaaya;