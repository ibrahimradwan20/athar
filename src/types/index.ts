export type UserRole = "admin" | "moderator" | "donor" | "organization" | "beneficiary";
export type CampaignStatus = "pending" | "approved" | "rejected" | "active" | "completed";
export type CampaignCategory = "health" | "education" | "food" | "shelter" | "emergency" | "orphans" | "water" | "other";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  cover_url?: string;
  role: UserRole;
  bio?: string;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  website?: string;
  facebook?: string;
  twitter?: string;
  instagram?: string;
  occupation?: string;
  gender?: "male" | "female" | "prefer_not_to_say";
  date_of_birth?: string;
  is_verified: boolean;
  can_donate: boolean;
  can_create_campaign: boolean;
  created_at: string;
  updated_at: string;
}

export interface Campaign {
  id: string;
  title: string;
  description: string;
  images: string[];
  target_amount: number;
  raised_amount: number;
  category: CampaignCategory;
  status: CampaignStatus;
  owner_id: string;
  owner?: Profile;
  is_beneficiary_campaign: boolean;
  location?: string;
  comments_locked?: boolean;
  donors_count?: number;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Donation {
  id: string;
  campaign_id: string;
  campaign?: Campaign;
  donor_id: string;
  donor?: Profile;
  amount: number;
  currency: "USD" | "USDT";
  payment_method: "paypal" | "usdt" | "card";
  transaction_id?: string;
  status: "pending" | "completed" | "failed";
  message?: string;
  is_anonymous: boolean;
  created_at: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}
