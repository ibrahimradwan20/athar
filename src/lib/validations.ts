import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("البريد الإلكتروني غير صالح"),
  password: z.string().min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل"),
});

export const registerSchema = z.object({
  full_name: z.string().min(3, "الاسم يجب أن يكون 3 أحرف على الأقل"),
  email: z.string().email("البريد الإلكتروني غير صالح"),
  password: z.string().min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل"),
  confirm_password: z.string(),
  role: z.enum(["donor", "organization", "beneficiary"]),
}).refine((data) => data.password === data.confirm_password, {
  message: "كلمات المرور غير متطابقة",
  path: ["confirm_password"],
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("البريد الإلكتروني غير صالح"),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل"),
  confirm_password: z.string(),
}).refine((data) => data.password === data.confirm_password, {
  message: "كلمات المرور غير متطابقة",
  path: ["confirm_password"],
});

export const campaignSchema = z.object({
  title: z.string().min(5, "العنوان يجب أن يكون 5 أحرف على الأقل"),
  description: z.string().min(50, "الوصف يجب أن يكون 50 حرف على الأقل"),
  target_amount: z.number().min(100, "المبلغ المستهدف يجب أن يكون 100 على الأقل"),
  category: z.enum(["health", "education", "food", "shelter", "emergency", "orphans", "water", "other"]),
  end_date: z.string().optional(),
});

export const profileSchema = z.object({
  full_name: z.string().min(3, "الاسم يجب أن يكون 3 أحرف على الأقل"),
  bio: z.string().max(500, "النبذة يجب ألا تتجاوز 500 حرف").optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().url("رابط غير صالح").optional().or(z.literal("")),
  facebook: z.string().optional(),
  twitter: z.string().optional(),
  instagram: z.string().optional(),
  occupation: z.string().optional(),
  gender: z.enum(["male", "female", "prefer_not_to_say"]).optional(),
  date_of_birth: z.string().optional(),
});

export const donationSchema = z.object({
  amount: z.number().min(1, "المبلغ يجب أن يكون أكبر من صفر"),
  payment_method: z.enum(["paypal", "usdt", "card"]),
  message: z.string().max(200).optional(),
  is_anonymous: z.boolean().default(false),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CampaignInput = z.infer<typeof campaignSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type DonationInput = z.infer<typeof donationSchema>;
