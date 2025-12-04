// Dữ liệu khi Đăng ký
export interface RegisterDTO {
  name: string;
  email: string;
  password: string;
}

// Dữ liệu khi Đăng nhập
export interface LoginDTO {
  email: string;
  password: string;
}

// Dữ liệu User trả về
export interface UserResponseDTO {
  id: string;
  email: string;
  name: string;
  role: string;
}

// Dữ liệu xác thực OTP
export type OtpType = 'REGISTER' | 'RESET_PASSWORD';

export interface SendOtpDTO {
  email: string;
  type: OtpType;
}

export interface VerifyOtpDTO {
  email: string;
  otp: string;
  type: OtpType;
}

// Dữ liệu địa chỉ của user
export interface AddAddressDTO {
  label?: string;
  street: string;
  ward?: string;
  district?: string;
  city?: string;
  provinceId?: number;
  districtId?: number;
  wardCode?: string;
  zipCode?: string;
  country?: string;
  phone?: string;
  isDefault?: boolean;
}