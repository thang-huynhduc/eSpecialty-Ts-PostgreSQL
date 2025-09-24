// Updated Login.jsx
// Added Forgot Password functionality with OTP request and reset form.
// This implements password reset flow on frontend.
// For security: Client-side rate limiting can be added via debounce, but server handles it.
// Added modal-like state for reset flow.

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
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/");
    }
  }, [navigate]);

  const handleEmail = (e) => {
    setEmail(e.target.value);
    setErrEmail("");
  };

  const handlePassword = (e) => {
    setPassword(e.target.value);
    setErrPassword("");
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
      console.error("Error fetching order count:", error);
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    setErrEmail("");
    setErrPassword("");

    if (!email) {
      setErrEmail(t("auth.enter_email"));
      setIsLoading(false);
      return;
    }

    if (!password) {
      setErrPassword(t("auth.enter_password"));
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post(serverUrl + "/api/user/login", {
        email,
        password,
      });
      const data = response?.data;
      if (data?.success) {
        localStorage.setItem("token", data?.token);
        await fetchUserOrderCount(data?.token);
        toast.success(data?.message);
        navigate("/");
      } else {
        toast.error(data?.message);
      }
    } catch (error) {
      console.log("User login error", error);
      toast.error(error?.response?.data?.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrResetEmail("");

    if (!resetEmail) {
      setErrResetEmail("Enter your email");
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${serverUrl}/api/user/request-reset`, { email: resetEmail });
      const data = response?.data;
      if (data?.success) {
        toast.success(data?.message);
        setUserId(data.userId);
        setShowOtpStep(true);
      } else {
        toast.error(data?.message);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Request failed");
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
      setErrOtp("Enter valid 6-digit OTP");
      hasError = true;
    }
    if (!newPassword || newPassword.length < 8) {
      setErrNewPassword("Password must be at least 8 characters");
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
      toast.error(error?.response?.data?.message || "Reset failed");
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
                    {t("auth.welcome_back")}
                  </h1>
                  <p className="text-gray-600">{t("auth.signin_subtitle")}</p>
                </div>

                <form onSubmit={handleSignIn} className="space-y-6">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      {t("auth.email_address")}
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
                        placeholder={t("auth.email_placeholder")}
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
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                      {t("auth.password")}
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
                        placeholder={t("auth.password_placeholder")}
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
                    >
                      {t("auth.forgot_password")}
                    </button>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isLoading}
                    className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        {t("auth.signing_in")}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        {t("auth.signin")}
                        <FaArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    )}
                  </motion.button>
                </form>
              </>
            ) : (
              <>
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">Reset Password</h1>
                  <p className="text-gray-600">Enter your email to receive OTP</p>
                </div>

                {!showOtpStep ? (
                  <form onSubmit={handleRequestReset} className="space-y-6">
                    <div>
                      <label htmlFor="resetEmail" className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FaEnvelope className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          id="resetEmail"
                          type="email"
                          value={resetEmail}
                          onChange={(e) => {
                            setResetEmail(e.target.value);
                            setErrResetEmail("");
                          }}
                          className={`block w-full pl-10 pr-3 py-3 border ${
                            errResetEmail ? "border-red-300" : "border-gray-300"
                          } rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-colors`}
                          placeholder="Enter your email"
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
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={isLoading}
                      className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 transition-all duration-200"
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Sending OTP...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          Send OTP
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
                        Back to Sign In
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleResetPassword} className="space-y-6">
                    <div>
                      <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                        OTP Code
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FaKey className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          id="otp"
                          type="text"
                          value={otp}
                          onChange={(e) => {
                            setOtp(e.target.value);
                            setErrOtp("");
                          }}
                          className={`block w-full pl-10 pr-3 py-3 border ${
                            errOtp ? "border-red-300" : "border-gray-300"
                          } rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-colors`}
                          placeholder="Enter 6-digit OTP"
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
                      <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                        New Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FaLock className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          id="newPassword"
                          type={showPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => {
                            setNewPassword(e.target.value);
                            setErrNewPassword("");
                          }}
                          className={`block w-full pl-10 pr-12 py-3 border ${
                            errNewPassword ? "border-red-300" : "border-gray-300"
                          } rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-colors`}
                          placeholder="Enter new password"
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
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={isLoading}
                      className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 transition-all duration-200"
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Resetting...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          Reset Password
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
                        Back to Sign In
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
                        {t("auth.no_account")}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 text-center">
                  <Link
                    to="/signup"
                    className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
                  >
                    {t("auth.create_account")}
                    <FaArrowRight className="w-4 h-4" />
                  </Link>
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