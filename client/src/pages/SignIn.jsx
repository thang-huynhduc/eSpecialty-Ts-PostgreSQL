import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import axios from "axios";
import { serverUrl } from "../../config";
import { useDispatch } from "react-redux";
import { setOrderCount } from "../redux/especialtySlice";
import {
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaUserCircle,
  FaArrowRight,
  FaKey,
} from "react-icons/fa";
import Container from "../components/Container";
import { useTranslation } from "react-i18next";

const SignIn = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errEmail, setErrEmail] = useState("");
  const [errPassword, setErrPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [errResetEmail, setErrResetEmail] = useState("");
  const [errOtp, setErrOtp] = useState("");
  const [errNewPassword, setErrNewPassword] = useState("");
  const [userId, setUserId] = useState("");
  const [showOtpStep, setShowOtpStep] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [hasMaliciousInput, setHasMaliciousInput] = useState(false);

  // Rate limiting constants
  const MAX_ATTEMPTS = 5;
  const LOCKOUT_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/");
    }

    // Check for lockout status
    const lockoutData = JSON.parse(localStorage.getItem("loginLockout") || "{}");
    const now = Date.now();
    if (lockoutData?.lockedUntil && now < lockoutData.lockedUntil) {
      setIsLocked(true);
      setLoginAttempts(lockoutData.attempts || 0);
      toast.error(
        t("auth.lockout_message", {
          minutes: Math.ceil((lockoutData.lockedUntil - now) / 1000 / 60),
        }) || `Tài khoản bị tạm khóa. Vui lòng thử lại sau ${Math.ceil(
          (lockoutData.lockedUntil - now) / 1000 / 60
        )} phút.`
      );
    } else if (lockoutData?.lockedUntil) {
      // Clear lockout if time has passed
      localStorage.removeItem("loginLockout");
      setIsLocked(false);
      setLoginAttempts(0);
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

  const handleEmail = (e) => {
    const value = e.target.value;
    setEmail(value);
    if (!validateInputForMaliciousContent(value, true)) {
      setErrEmail(t("auth.suspected_injection") || "Ký tự không hợp lệ, vui lòng tránh các ký tự đặc biệt nguy hiểm.");
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
      setErrPassword(t("auth.suspected_injection") || "Ký tự không hợp lệ, vui lòng tránh các ký tự đặc biệt nguy hiểm.");
      setHasMaliciousInput(true);
    } else {
      setErrPassword("");
      setHasMaliciousInput(false);
    }
  };

  const handleResetEmail = (e) => {
    const value = e.target.value;
    setResetEmail(value);
    if (!validateInputForMaliciousContent(value, true)) {
      setErrResetEmail(t("auth.suspected_injection") || "Ký tự không hợp lệ, vui lòng tránh các ký tự đặc biệt nguy hiểm.");
      setHasMaliciousInput(true);
    } else {
      setErrResetEmail("");
      setHasMaliciousInput(false);
    }
  };

  const handleOtp = (e) => {
    const value = e.target.value;
    setOtp(value);
    if (!validateInputForMaliciousContent(value)) {
      setErrOtp(t("auth.suspected_injection") || "Ký tự không hợp lệ, vui lòng tránh các ký tự đặc biệt nguy hiểm.");
      setHasMaliciousInput(true);
    } else {
      setErrOtp("");
      setHasMaliciousInput(false);
    }
  };

  const handleNewPassword = (e) => {
    const value = e.target.value;
    setNewPassword(value);
    if (!validateInputForMaliciousContent(value)) {
      setErrNewPassword(t("auth.suspected_injection") || "Ký tự không hợp lệ, vui lòng tránh các ký tự đặc biệt nguy hiểm.");
      setHasMaliciousInput(true);
    } else {
      setErrNewPassword("");
      setHasMaliciousInput(false);
    }
  };

  const checkLoginAttempts = () => {
    if (loginAttempts >= MAX_ATTEMPTS) {
      setIsLocked(true);
      const lockedUntil = Date.now() + LOCKOUT_DURATION;
      localStorage.setItem(
        "loginLockout",
        JSON.stringify({ attempts: loginAttempts, lockedUntil })
      );
      toast.error(
        t("auth.too_many_attempts", {
          minutes: LOCKOUT_DURATION / 1000 / 60,
        }) || `Quá nhiều lần thử đăng nhập. Vui lòng thử lại sau ${LOCKOUT_DURATION / 1000 / 60} phút.`
      );
      return false;
    }
    return true;
  };

  const fetchUserOrderCount = async (token) => {
    try {
      const response = await fetch(`${serverUrl}/api/order/my-orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        dispatch(setOrderCount(data.orders.length));
      }
    } catch (error) {
      console.error("Lỗi khi lấy số lượng đơn hàng:", error);
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrEmail("");
    setErrPassword("");

    let hasError = false;

    if (!email) {
      setErrEmail(t("auth.enter_email") || "Vui lòng nhập email");
      hasError = true;
    } else if (!validateEmail(email)) {
      setErrEmail(t("auth.valid_email") || "Vui lòng nhập địa chỉ email hợp lệ");
      hasError = true;
    }

    if (!password) {
      setErrPassword(t("auth.enter_password") || "Vui lòng nhập mật khẩu");
      hasError = true;
    }

    if (hasMaliciousInput) {
      hasError = true;
    }

    if (hasError || !checkLoginAttempts()) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${serverUrl}/api/user/login`, {
        email,
        password,
      });
      const data = response?.data;
      if (data?.success) {
        localStorage.setItem("token", data?.token);
        await fetchUserOrderCount(data?.token);
        toast.success(data?.message);
        localStorage.removeItem("loginLockout");
        setLoginAttempts(0);
        navigate("/");
      } else {
        setLoginAttempts((prev) => {
          const newAttempts = prev + 1;
          localStorage.setItem(
            "loginLockout",
            JSON.stringify({ attempts: newAttempts, lockedUntil: 0 })
          );
          return newAttempts;
        });
        toast.error(data?.message);
      }
    } catch (error) {
      setLoginAttempts((prev) => {
        const newAttempts = prev + 1;
        localStorage.setItem(
          "loginLockout",
          JSON.stringify({ attempts: newAttempts, lockedUntil: 0 })
        );
        return newAttempts;
      });
      console.error("Lỗi đăng nhập người dùng", error);
      toast.error(error?.response?.data?.message || t("auth.signin_failed") || "Đăng nhập thất bại");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrResetEmail("");

    let hasError = false;
    if (!resetEmail) {
      setErrResetEmail(t("auth.enter_email") || "Vui lòng nhập email");
      hasError = true;
    } else if (!validateEmail(resetEmail)) {
      setErrResetEmail(t("auth.valid_email") || "Vui lòng nhập địa chỉ email hợp lệ");
      hasError = true;
    }

    if (hasMaliciousInput) {
      hasError = true;
    }

    if (hasError || !checkLoginAttempts()) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${serverUrl}/api/user/request-reset`, {
        email: resetEmail,
      });
      const data = response?.data;
      if (data?.success) {
        toast.success(data?.message);
        setUserId(data.userId);
        setShowOtpStep(true);
      } else {
        toast.error(data?.message);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || t("auth.request_reset_failed") || "Yêu cầu thất bại");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrOtp("");
    setErrNewPassword("");

    let hasError = false;
    if (!otp || otp.length !== 6) {
      setErrOtp(t("auth.valid_otp") || "Vui lòng nhập mã OTP 6 chữ số hợp lệ");
      hasError = true;
    }

    if (!newPassword || newPassword.length < 8) {
      setErrNewPassword(t("auth.password_min_length") || "Mật khẩu phải có ít nhất 8 ký tự");
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
      const response = await axios.post(`${serverUrl}/api/user/reset-password`, {
        userId,
        otpCode: otp,
        newPassword,
      });
      const data = response?.data;
      if (data?.success) {
        toast.success(data?.message);
        setShowResetForm(false);
        setShowOtpStep(false);
      } else {
        toast.error(data?.message);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || t("auth.reset_password_failed") || "Đặt lại mật khẩu thất bại");
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
            {!showResetForm ? (
              <>
                <div className="text-center mb-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4"
                  >
                    <FaUserCircle className="text-2xl text-white" />
                  </motion.div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {t("auth.welcome_back") || "Chào mừng trở lại"}
                  </h1>
                  <p className="text-gray-600">{t("auth.signin_subtitle") || "Đăng nhập để tiếp tục mua sắm"}</p>
                </div>

                <form onSubmit={handleSignIn} className="space-y-6">
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
                        placeholder={t("auth.password_placeholder") || "Nhập mật khẩu của bạn"}
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

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setShowResetForm(true)}
                      className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                      disabled={isLocked}
                    >
                      {t("auth.forgot_password") || "Quên mật khẩu?"}
                    </button>
                  </div>

                  <motion.button
                    whileHover={{ scale: !hasMaliciousInput && !isLocked ? 1.02 : 1 }}
                    whileTap={{ scale: !hasMaliciousInput && !isLocked ? 0.98 : 1 }}
                    type="submit"
                    disabled={isLoading || isLocked || hasMaliciousInput}
                    className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white transition-all duration-200 ${
                      !hasMaliciousInput && !isLocked
                        ? "bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                        : "bg-gray-400 cursor-not-allowed"
                    } disabled:opacity-50`}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        {t("auth.signing_in") || "Đang đăng nhập..."}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        {t("auth.signin") || "Đăng nhập"}
                        <FaArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    )}
                  </motion.button>
                </form>
              </>
            ) : (
              <>
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {t("auth.reset_password_title") || "Đặt lại mật khẩu"}
                  </h1>
                  <p className="text-gray-600">
                    {t("auth.reset_password_subtitle") || "Nhập email của bạn để nhận mã OTP"}
                  </p>
                </div>

                {!showOtpStep ? (
                  <form onSubmit={handleRequestReset} className="space-y-6">
                    <div>
                      <label
                        htmlFor="resetEmail"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        {t("auth.email_address") || "Địa chỉ email"}
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FaEnvelope className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          id="resetEmail"
                          type="email"
                          value={resetEmail}
                          onChange={handleResetEmail}
                          className={`block w-full pl-10 pr-3 py-3 border ${
                            errResetEmail ? "border-red-300" : "border-gray-300"
                          } rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-colors`}
                          placeholder={t("auth.email_placeholder") || "Nhập email của bạn"}
                        />
                      </div>
                      {errResetEmail && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-2 text-sm text-red-600 flex items-center gap-1"
                        >
                          <span className="font-bold">!</span>
                          {errResetEmail}
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
                          {t("auth.sending_otp") || "Đang gửi OTP..."}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          {t("auth.send_otp") || "Gửi OTP"}
                          <FaArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      )}
                    </motion.button>

                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => setShowResetForm(false)}
                        className="text-sm text-gray-600 hover:text-gray-900"
                      >
                        {t("auth.back_to_signin") || "Quay lại đăng nhập"}
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleResetPassword} className="space-y-6">
                    <div>
                      <label
                        htmlFor="otp"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        {t("auth.otp_label") || "Mã OTP"}
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FaKey className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          id="otp"
                          type="text"
                          value={otp}
                          onChange={handleOtp}
                          className={`block w-full pl-10 pr-3 py-3 border ${
                            errOtp ? "border-red-300" : "border-gray-300"
                          } rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-colors`}
                          placeholder={t("auth.otp_placeholder") || "Nhập mã OTP 6 chữ số"}
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

                    <div>
                      <label
                        htmlFor="newPassword"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        {t("auth.new_password") || "Mật khẩu mới"}
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FaLock className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          id="newPassword"
                          type={showPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={handleNewPassword}
                          className={`block w-full pl-10 pr-12 py-3 border ${
                            errNewPassword ? "border-red-300" : "border-gray-300"
                          } rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-colors`}
                          placeholder={t("auth.new_password_placeholder") || "Nhập mật khẩu mới"}
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <FaEyeSlash className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                          ) : (
                            <FaEye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                          )}
                        </button>
                      </div>
                      {errNewPassword && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-2 text-sm text-red-600 flex items-center gap-1"
                        >
                          <span className="font-bold">!</span>
                          {errNewPassword}
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
                          {t("auth.resetting_password") || "Đang đặt lại..."}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          {t("auth.reset_password") || "Đặt lại mật khẩu"}
                          <FaArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      )}
                    </motion.button>

                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setShowOtpStep(false);
                          setShowResetForm(false);
                        }}
                        className="text-sm text-gray-600 hover:text-gray-900"
                      >
                        {t("auth.back_to_signin") || "Quay lại đăng nhập"}
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}

            {!showResetForm && (
              <>
                <div className="mt-8">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">
                        {t("auth.no_account") || "Chưa có tài khoản?"}
                      </span>
                    </div>
                  </div>
                  <div className="mt-6 text-center">
                    <Link
                      to="/signup"
                      className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
                    >
                      {t("auth.create_account") || "Tạo tài khoản"}
                      <FaArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </div>
      </Container>
    </div>
  );
};

export default SignIn;