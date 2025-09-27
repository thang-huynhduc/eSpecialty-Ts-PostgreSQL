import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { serverUrl } from "../../config";
import axios from "axios";
import {
  FaUser,
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaUserPlus,
  FaArrowRight,
  FaKey,
} from "react-icons/fa";
import Container from "../components/Container";
import { useTranslation } from "react-i18next";

const SignUp = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [clientName, setClientName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [checked, setChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const [showOtpForm, setShowOtpForm] = useState(false);
  const [userId, setUserId] = useState("");
  const [signupAttempts, setSignupAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [hasMaliciousInput, setHasMaliciousInput] = useState(false);
  const role = "user";

  const [errClientName, setErrClientName] = useState("");
  const [errEmail, setErrEmail] = useState("");
  const [errPassword, setErrPassword] = useState("");
  const [errConfirmPassword, setErrConfirmPassword] = useState("");
  const [errOtp, setErrOtp] = useState("");

  // Rate limiting constants
  const MAX_ATTEMPTS = 5;
  const LOCKOUT_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/");
    }

    const lockoutData = JSON.parse(localStorage.getItem("signupLockout") || "{}");
    const now = Date.now();
    if (lockoutData?.lockedUntil && now < lockoutData.lockedUntil) {
      setIsLocked(true);
      setSignupAttempts(lockoutData.attempts || 0);
      toast.error(
        t("signup.lockout_message", {
          minutes: Math.ceil((lockoutData.lockedUntil - now) / 1000 / 60),
        }) || `Tài khoản bị tạm khóa. Vui lòng thử lại sau ${Math.ceil(
          (lockoutData.lockedUntil - now) / 1000 / 60
        )} phút.`
      );
    } else if (lockoutData?.lockedUntil) {
      localStorage.removeItem("signupLockout");
      setIsLocked(false);
      setSignupAttempts(0);
    }
  }, [navigate, t]);

  const validateEmail = (email) => {
    return String(email)
      .toLowerCase()
      .match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i);
  };

  const validateInputForMaliciousContent = (input, isEmail = false) => {
    const maliciousPatterns = [
      /or\s+.*=.*\s*1/i, // SQL injection: OR 1=1
      /--/, // SQL comment
      /;/, // SQL statement terminator
      /union\s+.*select/i, // SQL UNION SELECT
      /drop\s+.*table/i, // SQL DROP TABLE
      /insert\s+into/i, // SQL INSERT
      /exec\s*\(/i, // SQL EXEC
      /alter\s+table/i, // SQL ALTER
      /delete\s+from/i, // SQL DELETE
      /update\s+.*set/i, // SQL UPDATE
      /<script\s*>/i, // XSS: script tags
      /on\w+\s*=/i, // XSS: event handlers
      /javascript:/i, // XSS: javascript protocol
      /eval\s*\(/i, // XSS: eval function
      /alert\s*\(/i, // XSS: alert function
      /document\./i, // XSS: document object
      /window\./i, // XSS: window object
      /select\s+.*from/i, // SQL SELECT
      /<[^>]+>/, // HTML tags
      isEmail ? /[`~!#$%^&*()_=[\]{}\\|;:'",<>?]/ : /[`~!#%^&*()_=+[\]{}\\|;:'",.<>?]/,
    ];
    return !maliciousPatterns.some((pattern) => pattern.test(input));
  };

  const handleName = (e) => {
    const value = e.target.value;
    setClientName(value);
    if (!validateInputForMaliciousContent(value)) {
      setErrClientName("Ký tự không hợp lệ, vui lòng tránh các ký tự đặc biệt nguy hiểm như ` [] {}.");
      setHasMaliciousInput(true);
    } else {
      setErrClientName("");
      setHasMaliciousInput(false);
    }
  };

  const handleEmail = (e) => {
    const value = e.target.value;
    setEmail(value);
    if (!validateInputForMaliciousContent(value, true)) {
      setErrEmail("Ký tự không hợp lệ, vui lòng tránh các ký tự đặc biệt nguy hiểm` [] {}.");
      setHasMaliciousInput(true);
    } else {
      setErrEmail("");
      setHasMaliciousInput(false);
    }
  };

  const handlePassword = (e) => {
    const value = e.target.value;
    setPassword(value);
    if (!validateInputForMaliciousContent(value)) {
      setErrPassword(t("signup.suspected_injection") || "Mật khẩu bao gồm ít nhất 8 ký tự: 1 in hoa và chữ cái đặc biệt, không bao gồm ` {} [] ");
      setHasMaliciousInput(true);
    } else {
      setErrPassword("");
      setHasMaliciousInput(false);
    }
  };

  const handleConfirmPassword = (e) => {
    const value = e.target.value;
    setConfirmPassword(value);
    if (!validateInputForMaliciousContent(value)) {
      setErrConfirmPassword(t("signup.suspected_injection") || "Mật khẩu bao gồm ít nhất 8 ký tự: 1 in hoa và chữ cái đặc biệt, không bao gồm ` {} [] ");
      setHasMaliciousInput(true);
    } else {
      setErrConfirmPassword("");
      setHasMaliciousInput(false);
    }
  };

  const handleOtp = (e) => {
    const value = e.target.value;
    setOtp(value);
    if (!validateInputForMaliciousContent(value)) {
      setErrOtp(t("signup.suspected_injection") || "Ký tự không hợp lệ, vui lòng tránh các ký tự đặc biệt nguy hiểm.");
      setHasMaliciousInput(true);
    } else {
      setErrOtp("");
      setHasMaliciousInput(false);
    }
  };

  const checkSignupAttempts = () => {
    if (signupAttempts >= MAX_ATTEMPTS) {
      setIsLocked(true);
      const lockedUntil = Date.now() + LOCKOUT_DURATION;
      localStorage.setItem(
        "signupLockout",
        JSON.stringify({ attempts: signupAttempts, lockedUntil })
      );
      toast.error(
        t("signup.too_many_attempts", {
          minutes: LOCKOUT_DURATION / 1000 / 60,
        }) || `Quá nhiều lần thử đăng ký. Vui lòng thử lại sau ${LOCKOUT_DURATION / 1000 / 60} phút.`
      );
      return false;
    }
    return true;
  };

  const handleSignUp = async (e) => {
    e.preventDefault();

    if (!checked) {
      toast.error(t("signup.accept_terms") || "Vui lòng chấp nhận các điều khoản và điều kiện");
      return;
    }

    setIsLoading(true);
    setErrClientName("");
    setErrEmail("");
    setErrPassword("");
    setErrConfirmPassword("");

    let hasError = false;

    if (!clientName) {
      setErrClientName(t("signup.enter_full_name") || "Vui lòng nhập họ và tên");
      hasError = true;
    }

    if (!email) {
      setErrEmail(t("auth.enter_email") || "Vui lòng nhập email");
      hasError = true;
    } else if (!validateEmail(email)) {
      setErrEmail(t("signup.valid_email") || "Vui lòng nhập địa chỉ email hợp lệ");
      hasError = true;
    }

    if (!password) {
      setErrPassword(t("auth.enter_password") || "Vui lòng nhập mật khẩu");
      hasError = true;
    } else if (password.length < 8) {
      setErrPassword(t("signup.password_min_length") || "Mật khẩu phải có ít nhất 8 ký tự");
      hasError = true;
    }

    if (!confirmPassword) {
      setErrConfirmPassword(t("signup.confirm_password") || "Vui lòng xác nhận mật khẩu");
      hasError = true;
    } else if (password !== confirmPassword) {
      setErrConfirmPassword(t("signup.password_mismatch") || "Mật khẩu xác nhận không khớp");
      hasError = true;
    }

    if (hasMaliciousInput) {
      hasError = true;
    }

    if (hasError || !checkSignupAttempts()) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${serverUrl}/api/user/register`, {
        name: clientName,
        email,
        password,
        role,
      });
      const data = response?.data;
      if (data?.success) {
        toast.success(data?.message);
        setUserId(data.userId);
        setShowOtpForm(true);
        localStorage.removeItem("signupLockout");
        setSignupAttempts(0);
      } else {
        setSignupAttempts((prev) => {
          const newAttempts = prev + 1;
          localStorage.setItem(
            "signupLockout",
            JSON.stringify({ attempts: newAttempts, lockedUntil: 0 })
          );
          return newAttempts;
        });
        toast.error(data?.message);
      }
    } catch (error) {
      setSignupAttempts((prev) => {
        const newAttempts = prev + 1;
        localStorage.setItem(
          "signupLockout",
          JSON.stringify({ attempts: newAttempts, lockedUntil: 0 })
        );
        return newAttempts;
      });
      console.error("Lỗi đăng ký người dùng", error);
      toast.error(error?.response?.data?.message || t("signup.registration_failed") || "Đăng ký thất bại");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpVerification = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrOtp("");

    let hasError = false;
    if (!otp || otp.length !== 6) {
      setErrOtp(t("signup.valid_otp") || "Vui lòng nhập mã OTP 6 chữ số hợp lệ");
      hasError = true;
    }

    if (hasMaliciousInput) {
      hasError = true;
    }

    if (hasError) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${serverUrl}/api/user/verify-otp`, {
        userId,
        otpCode: otp,
        type: "register",
      });
      const data = response?.data;
      if (data?.success) {
        toast.success(data?.message);
        localStorage.setItem("token", data.token);
        navigate("/");
      } else {
        toast.error(data?.message);
      }
    } catch (error) {
      console.error("Lỗi xác minh OTP", error);
      toast.error(error?.response?.data?.message || t("signup.otp_verification_failed") || "Xác minh OTP thất bại");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Container>
        <div className="sm:w-[450px] w-full mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-2xl shadow-xl p-8"
          >
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <FaUserPlus className="text-2xl text-white" />
              </motion.div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {showOtpForm
                  ? t("signup.verify_otp_title") || "Xác minh OTP"
                  : t("signup.create_account_title") || "Tạo tài khoản"}
              </h1>
              <p className="text-gray-600">
                {showOtpForm
                  ? t("signup.verify_otp_subtitle") || "Nhập mã OTP đã được gửi đến email của bạn"
                  : t("signup.create_account_subtitle") || "Tham gia eSpecialty Shopping và bắt đầu hành trình của bạn"}
              </p>
            </div>

            {!showOtpForm ? (
              <form onSubmit={handleSignUp} className="space-y-6">
                <div>
                  <label
                    htmlFor="clientName"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    {t("signup.full_name") || "Họ và tên"}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaUser className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="clientName"
                      name="clientName"
                      type="text"
                      value={clientName}
                      onChange={handleName}
                      className={`block w-full pl-10 pr-3 py-3 border ${
                        errClientName ? "border-red-300" : "border-gray-300"
                      } rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-colors`}
                      placeholder={t("signup.full_name_placeholder") || "Nhập họ và tên của bạn"}
                      disabled={isLocked}
                    />
                  </div>
                  {errClientName && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2 text-sm text-red-600 flex items-center gap-1"
                    >
                      <span className="font-bold">!</span>
                      {errClientName}
                    </motion.p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    {t("auth.email_address") || "Địa chỉ email"}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaEnvelope className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={email}
                      onChange={handleEmail}
                      className={`block w-full pl-10 pr-3 py-3 border ${
                        errEmail ? "border-red-300" : "border-gray-300"
                      } rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-colors`}
                      placeholder={t("auth.email_placeholder") || "Nhập email của bạn"}
                      disabled={isLocked}
                    />
                  </div>
                  {errEmail && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2 text-sm text-red-600 flex items-center gap-1"
                    >
                      <span className="font-bold">!</span>
                      {errEmail}
                    </motion.p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    {t("auth.password") || "Mật khẩu"}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaLock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={handlePassword}
                      className={`block w-full pl-10 pr-12 py-3 border ${
                        errPassword ? "border-red-300" : "border-gray-300"
                      } rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-colors`}
                      placeholder={t("signup.password_placeholder") || "Tạo một mật khẩu mạnh"}
                      disabled={isLocked}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLocked}
                    >
                      {showPassword ? (
                        <FaEyeSlash className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <FaEye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>
                  {errPassword && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2 text-sm text-red-600 flex items-center gap-1"
                    >
                      <span className="font-bold">!</span>
                      {errPassword}
                    </motion.p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    {t("signup.confirm_password_label") || "Xác nhận mật khẩu"}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaLock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={handleConfirmPassword}
                      className={`block w-full pl-10 pr-12 py-3 border ${
                        errConfirmPassword ? "border-red-300" : "border-gray-300"
                      } rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-colors`}
                      placeholder={t("signup.confirm_password_placeholder") || "Xác nhận mật khẩu của bạn"}
                      disabled={isLocked}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={isLocked}
                    >
                      {showConfirmPassword ? (
                        <FaEyeSlash className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <FaEye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>
                  {errConfirmPassword && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2 text-sm text-red-600 flex items-center gap-1"
                    >
                      <span className="font-bold">!</span>
                      {errConfirmPassword}
                    </motion.p>
                  )}
                </div>

                <div className="flex items-start space-x-3">
                  <div className="flex items-center h-5">
                    <input
                      id="terms"
                      name="terms"
                      type="checkbox"
                      checked={checked}
                      onChange={() => setChecked(!checked)}
                      className="w-4 h-4 text-gray-600 bg-gray-100 border-gray-300 rounded focus:ring-gray-500 focus:ring-2"
                      disabled={isLocked}
                    />
                  </div>
                  <div className="text-sm">
                    <label htmlFor="terms" className="text-gray-700">
                      {t("signup.terms_agreement") || "Tôi đồng ý với"}{" "}
                      <Link
                        to="#"
                        className="text-gray-900 font-medium hover:underline"
                      >
                        {t("signup.terms_of_service") || "Điều khoản dịch vụ"}
                      </Link>{" "}
                      {t("signup.and") || "và"}{" "}
                      <Link
                        to="#"
                        className="text-gray-900 font-medium hover:underline"
                      >
                        {t("signup.privacy_policy") || "Chính sách bảo mật"}
                      </Link>
                    </label>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: checked && !isLocked && !hasMaliciousInput ? 1.02 : 1 }}
                  whileTap={{ scale: checked && !isLocked && !hasMaliciousInput ? 0.98 : 1 }}
                  type="submit"
                  disabled={!checked || isLoading || isLocked || hasMaliciousInput}
                  className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white transition-all duration-200 ${
                    checked && !isLocked && !hasMaliciousInput
                      ? "bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                      : "bg-gray-400 cursor-not-allowed"
                  } disabled:opacity-50`}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {t("signup.creating_account") || "Đang tạo tài khoản..."}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {t("signup.create_account") || "Tạo tài khoản"}
                      <FaArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  )}
                </motion.button>
              </form>
            ) : (
              <form onSubmit={handleOtpVerification} className="space-y-6">
                <div>
                  <label
                    htmlFor="otp"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    {t("signup.otp_label") || "Mã OTP"}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaKey className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="otp"
                      name="otp"
                      type="text"
                      value={otp}
                      onChange={handleOtp}
                      className={`block w-full pl-10 pr-3 py-3 border ${
                        errOtp ? "border-red-300" : "border-gray-300"
                      } rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-colors`}
                      placeholder={t("signup.otp_placeholder") || "Nhập mã OTP 6 chữ số"}
                    />
                  </div>
                  {errOtp && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2 text-sm text-red-600 flex items-center gap-1"
                    >
                      <span className="font-bold">!</span>
                      {errOtp}
                    </motion.p>
                  )}
                </div>

                <motion.button
                  whileHover={{ scale: !hasMaliciousInput ? 1.02 : 1 }}
                  whileTap={{ scale: !hasMaliciousInput ? 0.98 : 1 }}
                  type="submit"
                  disabled={isLoading || hasMaliciousInput}
                  className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white transition-all duration-200 ${
                    !hasMaliciousInput
                      ? "bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                      : "bg-gray-400 cursor-not-allowed"
                  } disabled:opacity-50`}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {t("signup.verifying_otp") || "Đang xác minh OTP..."}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {t("signup.verify_otp") || "Xác minh OTP"}
                      <FaArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  )}
                </motion.button>
              </form>
            )}

            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">
                    {t("signup.has_account") || "Đã có tài khoản?"}
                  </span>
                </div>
              </div>
              <div className="mt-6 text-center">
                <Link
                  to="/signin"
                  className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
                >
                  {t("auth.signin") || "Đăng nhập vào tài khoản của bạn"}
                  <FaArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </Container>
    </div>
  );
};

export default SignUp;