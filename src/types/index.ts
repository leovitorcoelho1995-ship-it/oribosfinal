export interface Company {
    id: string;
    owner_id: string;
    company_name: string;
    whatsapp_number?: string;
    plan?: string;
    onboarding_completed?: boolean;
    first_login_at?: string;
    created_at: string;
}

export interface Client {
    id: string;
    company_id: string;
    name: string;
    whatsapp?: string;
    email?: string;
    tags?: string[];
    status: 'active' | 'inactive';
    notes?: string;
    created_at: string;
}

export interface Appointment {
    id: string;
    company_id: string;
    client_id?: string;
    client_name?: string;
    title: string;
    date: string;
    time: string;
    professional?: string; // Legacy field, might be deprecated in favor of professional_id
    professional_id?: string;
    status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed';
    notes?: string;
    created_at: string;
    remote_jid?: string;
    phone?: string;
    service_id?: string;
    duration_minutes?: number;
    reminder_sent?: boolean;
    source?: 'manual' | 'whatsapp' | 'form';
}

export interface Lead {
    id: string;
    company_id: string;
    name: string;
    whatsapp?: string;
    email?: string;
    source?: string;
    stage: 'novo' | 'contato' | 'proposta' | 'fechado' | 'perdido';
    value?: number;
    notes?: string;
    assigned_to?: string;
    created_at: string;
}

export interface Payment {
    id: string;
    company_id: string;
    client_id?: string;
    client_name?: string;
    description: string;
    amount: number;
    due_date: string;
    paid_date?: string;
    status: 'pending' | 'paid' | 'overdue';
    created_at: string;
}

export interface Settings {
    id: string;
    company_id: string;
    whatsapp_number?: string;
    business_hours_start?: string;
    business_hours_end?: string;
    welcome_message?: string;
    reminder_message?: string;
    followup_message?: string;
    cobr_message_1?: string;
    cobr_message_2?: string;
    cobr_message_3?: string;
}

export interface Transaction {
    id: string;
    company_id: string;
    client_name: string;
    client_phone: string;
    remote_jid: string;
    description: string;
    amount: number;
    txid?: string;
    pix_key?: string;
    qr_code?: string;
    qr_code_url?: string;
    status: 'pending' | 'paid' | 'expired' | 'cancelled' | 'manual';
    expires_at?: string;
    paid_at?: string;
    confirmed_by?: string;
    source: 'whatsapp' | 'manual' | 'webhook';
    notes?: string;
    created_at: string;
}

export interface Notification {
    id: string;
    company_id: string;
    type: 'new_lead' | 'payment_confirmed' | 'new_appointment' | 'appointment_cancelled' | 'payment_overdue' | 'support_request' | 'support_reply';
    title: string;
    body: string;
    read: boolean;
    reference_id?: string;
    reference_table?: 'leads' | 'transactions' | 'appointments';
    created_at: string;
}

export interface SystemLog {
    id: string;
    company_id: string;
    level: 'info' | 'warning' | 'error';
    source?: 'n8n' | 'webhook' | 'system';
    message: string;
    payload?: any;
    created_at: string;
}

export interface WhatsappMessage {
    id: string;
    company_id: string;
    remote_jid: string;
    client_name?: string;
    direction: 'inbound' | 'outbound';
    type: 'text' | 'audio' | 'image' | 'document';
    content?: string;
    media_url?: string;
    timestamp: string;
    created_at: string;
}

export interface Professional {
    id: string;
    company_id: string;
    name: string;
    role?: string;
    color: string;
    active: boolean;
    created_at: string;
}

export interface Service {
    id: string;
    company_id: string;
    name: string;
    duration_minutes: number;
    price: number;
    color: string;
    active: boolean;
    created_at: string;
}

export interface Availability {
    id: string;
    company_id: string;
    professional_id: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
    slot_duration_minutes: number;
    active: boolean;
}

export interface AvailabilityBlock {
    id: string;
    company_id: string;
    professional_id: string;
    block_date: string;
    start_time?: string;
    end_time?: string;
    reason?: string;
    created_at: string;
}

export interface SupportMessage {
    id: string;
    company_id: string;
    company_name: string;
    subject: string;
    message: string;
    status: 'open' | 'in_progress' | 'resolved';
    priority: 'normal' | 'high';
    admin_reply?: string;
    replied_at?: string;
    created_at: string;
}
