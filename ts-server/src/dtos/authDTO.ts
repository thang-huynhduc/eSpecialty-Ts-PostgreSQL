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