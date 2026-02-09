// API configuration
// Ensure proper handling of environment variable
const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  // Check if the env var is actually set and not undefined string
  if (envUrl && envUrl !== 'undefined' && envUrl.trim()) {
    return envUrl.trim();
  }
  
  // ============================================
  // DEVELOPMENT MODE - For localhost testing
  // ============================================
  // Keep this line active for local development
  // return 'http://localhost:5051/api';
  
  // ============================================
  // PRODUCTION MODE - For deployment
  // ============================================
  // For deployment: Comment the localhost line above and uncomment the line below
  return 'https://backend.estaraht.com/api';
};

const API_BASE_URL = getApiBaseUrl();

// Generic API fetch helper with improved error handling
async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    // Handle non-JSON responses
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      throw new Error(text || `HTTP ${response.status}: ${response.statusText}`);
    }

    if (!response.ok) {
      throw new Error(data.message || data.error || `API request failed: ${response.statusText}`);
    }

    return data;
  } catch (error) {
    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to the server. Please check your connection.');
    }
    // Re-throw known errors
    if (error instanceof Error) {
      throw error;
    }
    // Handle unknown errors
    throw new Error('An unexpected error occurred');
  }
}

// API client
export const api = {
  // Auth
  auth: {
    login: (email: string, password: string) => apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
    // Mobile: request reset, returns uid + resetLink for email
    requestPasswordReset: (email: string) => apiFetch('/auth/request-reset', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
    // Web form: set new password (uid from URL + password in body)
    resetPassword: (uid: string, newPassword: string, confirmPassword: string) => apiFetch('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ uid, newPassword, confirmPassword }),
    }),
  },

  // Doctors
  doctors: {
    getAll: () => apiFetch('/doctors'),
    getById: (id: string) => apiFetch(`/doctors/${id}`),
    create: (data: Partial<Doctor>) => apiFetch('/doctors', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: Partial<Doctor>) => apiFetch(`/doctors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => apiFetch(`/doctors/${id}`, { method: 'DELETE' }),
    getStats: () => apiFetch('/doctors/stats'),
  },

  // Patients
  patients: {
    getAll: () => apiFetch('/patients'),
    getById: (id: string) => apiFetch(`/patients/${id}`),
    create: (data: Partial<Patient>) => apiFetch('/patients', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: Partial<Patient>) => apiFetch(`/patients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => apiFetch(`/patients/${id}`, { method: 'DELETE' }),
    getStats: () => apiFetch('/patients/stats'),
  },

  // Users
  users: {
    getAll: () => apiFetch('/users'),
    getById: (id: string) => apiFetch(`/users/${id}`),
    create: (data: Partial<AdminUser>) => apiFetch('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: Partial<AdminUser>) => apiFetch(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => apiFetch(`/users/${id}`, { method: 'DELETE' }),
    getStats: () => apiFetch('/users/stats'),
  },

  // Payment plans
  paymentPlans: {
    getAll: () => apiFetch('/payment-plans'),
    getById: (id: string) => apiFetch(`/payment-plans/${id}`),
    create: (data: Partial<PaymentPlan>) => apiFetch('/payment-plans', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: Partial<PaymentPlan>) => apiFetch(`/payment-plans/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => apiFetch(`/payment-plans/${id}`, { method: 'DELETE' }),
    getStats: () => apiFetch('/payment-plans/stats'),
  },

  // Patient plan subscriptions
  patientPlanSubscriptions: {
    getAll: () => apiFetch('/patient-plan-subscriptions'),
    getById: (id: string) => apiFetch(`/patient-plan-subscriptions/${id}`),
    getByPatient: (patientId: string) => apiFetch(`/patient-plan-subscriptions/patient/${patientId}`),
    getByPlan: (planId: string) => apiFetch(`/patient-plan-subscriptions/plan/${planId}`),
    create: (data: Partial<PatientPlanSubscription>) => apiFetch('/patient-plan-subscriptions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: Partial<PatientPlanSubscription>) => apiFetch(`/patient-plan-subscriptions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => apiFetch(`/patient-plan-subscriptions/${id}`, { method: 'DELETE' }),
    getStats: () => apiFetch('/patient-plan-subscriptions/stats'),
  },

  // Coupons
  coupons: {
    getAll: () => apiFetch('/coupons'),
    getById: (id: string) => apiFetch(`/coupons/${id}`),
    getByCode: (code: string) => apiFetch(`/coupons/code/${code}`),
    create: (data: Partial<Coupon>) => apiFetch('/coupons', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: Partial<Coupon>) => apiFetch(`/coupons/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => apiFetch(`/coupons/${id}`, { method: 'DELETE' }),
    validate: (code: string, userId: string) => apiFetch(`/coupons/validate/${code}`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),
    use: (id: string, userId: string) => apiFetch(`/coupons/${id}/use`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),
    getStats: () => apiFetch('/coupons/stats'),
  },

  // bookings
  bookings: {
    getAll: () => apiFetch('/bookings'),
    getById: (id: string) => apiFetch(`/bookings/${id}`),
    getByDoctor: (doctorId: string) => apiFetch(`/bookings/doctor/${doctorId}`),
    getByPatient: (patientId: string) => apiFetch(`/bookings/patient/${patientId}`),
    create: (data: Partial<Bookings>) => apiFetch('/bookings', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: Partial<Bookings>) => apiFetch(`/bookings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    updateStatus: (id: string, status: string) => apiFetch(`/bookings/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
    delete: (id: string) => apiFetch(`/bookings/${id}`, { method: 'DELETE' }),
    getStats: () => apiFetch('/bookings/stats'),
  },

  // Availabilities
  availabilities: {
    getAll: () => apiFetch('/availabilities'),
    getByDoctor: (doctorId: string) => apiFetch(`/availabilities/doctor/${doctorId}`),
    getById: (id: string) => apiFetch(`/availabilities/${id}`),
    create: (data: Partial<Availability>) => apiFetch('/availabilities', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: Partial<Availability>) => apiFetch(`/availabilities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => apiFetch(`/availabilities/${id}`, { method: 'DELETE' }),
  },

  // Reviews
  reviews: {
    getAll: () => apiFetch('/reviews'),
    getById: (id: string) => apiFetch(`/reviews/${id}`),
    getByBooking: (bookingId: string) => apiFetch(`/reviews/booking/${bookingId}`),
    getByDoctor: (doctorId: string) => apiFetch(`/reviews/doctor/${doctorId}`),
    getByPatient: (patientId: string) => apiFetch(`/reviews/patient/${patientId}`),
    create: (data: Partial<Review>) => apiFetch('/reviews', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: Partial<Review>) => apiFetch(`/reviews/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => apiFetch(`/reviews/${id}`, { method: 'DELETE' }),
    getStats: () => apiFetch('/reviews/stats'),
  },

  // Withdrawals
  withdrawals: {
    getAll: () => apiFetch('/withdrawals'),
    getById: (id: string) => apiFetch(`/withdrawals/${id}`),
    getByDoctor: (doctorId: string) => apiFetch(`/withdrawals/doctor/${doctorId}`),
    create: (data: Partial<Withdrawal>) => apiFetch('/withdrawals', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: Partial<Withdrawal>) => apiFetch(`/withdrawals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => apiFetch(`/withdrawals/${id}`, { method: 'DELETE' }),
    getStats: () => apiFetch('/withdrawals/stats'),
  },
};

// Database types
export type AdminUser = {
  user_id: string;
  email: string;
  password: string;
  role: string;
  status: string;
  created_at: string;
  updated_at: string;
  full_name: string | null;
  last_login: string | null;
};

export type Doctor = {
  doctor_id: string;
  full_name: string | null;
  email: string | null;
  phone_number: string | null;
  age: number | null;
  gender: string | null;
  specialization: string | null;
  bio: string | null;
  years_of_exp: number | null;
  numb_patients: number | null;
  profile_img_url: string | null;
  doctor_fee_per_session: number | null;
  fcm_token: string | null;
  average_rating: number | null;
  numb_session: number | null;
  number_review: number | null;
  total_reviews?: number | null;
  wallet: number | null;
  timezone_offset_hours: number | null;
  updated_at: string;
  approval_status?: 'pending' | 'approved' | 'rejected' | null;
  rejection_reason?: string | null;
};

export type Patient = {
  id: string;
  email: string | null;
  name: string | null;
  role: string | null;
  created_at: string;
  age: number | null;
  gender: string | null;
  phone: string | null;
  fcm_token: string | null;
  login_id: string | null;
  profile_img_url: string | null;
};

export type PaymentPlan = {
  id: string;
  plan_name: string;
  plan_name_ar?: string | null;
  plan_name_fr?: string | null;
  description?: string | null;
  description_ar?: string | null;
  description_fr?: string | null;
  price: number;
  payment_currency?: string | null;
  sessions: number;
  is_first_time_only?: boolean;
  is_active?: boolean;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
};

export type PatientPlanSubscription = {
  id: string;
  patient_id: string;
  plan_id: string;
  payment_id?: string | null;
  sessions_purchased: number;
  sessions_used?: number;
  price_paid: number;
  payment_gateway?: string | null;
  payment_currency?: string | null;
  payment_status?: string | null;
  subscribed_at?: string;
  created_at?: string;
  expires_at?: string | null;
  status: string;
  patients?: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    profile_img_url?: string | null;
  };
  payment_plans?: PaymentPlan;
};

export type Coupon = {
  id: string;
  coupon_code: string;
  valid_until: string;
  one_use: boolean;
  number_of_uses: number;
  for_user: string | null;
  is_used: boolean;
  created_at: string;
  coupon_value: string | null;
};

export type PaymentHistory = {
  id: string;
  doctor_id: string;
  patient_id: string;
  total_amount: number;
  total_actual_amount: number;
  income_history: number;
  withrowl_history: number;
  action_type: string;
  operation_status: string;
  payment_date: string;
  booking_id: string | null;
};

export type Bookings = {
  id: number;
  created_at: string;
  doctor_id: string;
  patient_id: string;
  booking_date: string;
  booking_time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  doctor?: {
    doctor_id: string;
    full_name: string | null;
    email: string | null;
    specialization: string | null;
    profile_img_url: string | null;
  };
  patient?: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    profile_img_url: string | null;
  };
};

export type Availability = {
  id: string;
  doctor_id: string;
  day_number: number;
  time_slots: string[];
  is_available?: boolean;
  created_at?: string;
};

export type Review = {
  id: string;
  booking_id: string;
  patient_id: string;
  doctor_id: string;
  rating: string;
  comment: string;
  created_at: string;
  patients?: { id: string; email: string | null; name: string | null };
  doctors?: { doctor_id: string; email: string | null; full_name: string | null };
};

export type Withdrawal = {
  id: number;
  created_at: string;
  doctor_id: string | null;
  total_amount: string | null;
  total_actual_amount: string | null;
  total_amount_in_MRU?: string | number | null;
  withrowl_history: string | null;
  income_history: number | null;
  action_type: string | null;
  operation_status: string | null;
  payment_date: string | null;
};
