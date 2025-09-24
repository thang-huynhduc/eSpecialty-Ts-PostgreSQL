import { Router } from "express";
import {
  adminLogin,
  getUsers,
  removeUser,
  updateUser,
  userLogin,
  userRegister,
  getUserProfile,
  updateUserProfile,
  addToCart,
  updateCart,
  getUserCart,
  clearCart,
  createAdmin,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  getUserAddresses,
  uploadUserAvatar,
  verifyOtp,
  requestPasswordReset,
  resetPassword,
  changePassword,
  requestUnlock,
  unlockAccount,
} from "../controllers/userController.mjs";
import adminAuth from "../middleware/adminAuth.js";
import userAuth from "../middleware/userAuth.js";
import { avatarUpload } from "../middleware/avatarUpload.mjs";

const router = Router();

const routeValue = "/api/user/";

// Public routes
router.post(`${routeValue}register`, userRegister);
router.post(`${routeValue}login`, userLogin);
router.post(`${routeValue}admin`, adminLogin);
router.post(`${routeValue}verify-otp`, verifyOtp); // For OTP verification (register/unlock/etc.)
router.post(`${routeValue}request-reset`, requestPasswordReset); // Request password reset OTP
router.post(`${routeValue}reset-password`, resetPassword); // Reset password with OTP
router.post(`${routeValue}request-unlock`, requestUnlock); // Request unlock OTP
router.post(`${routeValue}unlock-account`, unlockAccount); // Unlock with OTP

// User-protected routes
router.get(`${routeValue}profile`, userAuth, getUserProfile);
router.put(`${routeValue}profile`, userAuth, updateUserProfile);
router.put(`${routeValue}change-password`, userAuth, changePassword); // Change password (authenticated, no OTP)
router.post(`${routeValue}cart/add`, userAuth, addToCart);
router.put(`${routeValue}cart/update`, userAuth, updateCart);
router.get(`${routeValue}cart`, userAuth, getUserCart);
router.delete(`${routeValue}cart/clear`, userAuth, clearCart);

// User address management routes
router.get(`${routeValue}addresses`, userAuth, getUserAddresses);
router.post(`${routeValue}addresses`, userAuth, addAddress);
router.put(`${routeValue}addresses/:addressId`, userAuth, updateAddress);
router.delete(`${routeValue}addresses/:addressId`, userAuth, deleteAddress);
router.put(
  `${routeValue}addresses/:addressId/default`,
  userAuth,
  setDefaultAddress
);

// Avatar upload route (admin only)
router.post(
  `${routeValue}upload-avatar`,
  adminAuth,
  avatarUpload.single("avatar"),
  uploadUserAvatar
);

// Address management routes (admin only)
router.get(`${routeValue}:userId/addresses`, adminAuth, getUserAddresses);
router.post(`${routeValue}:userId/addresses`, adminAuth, addAddress);
router.put(
  `${routeValue}:userId/addresses/:addressId`,
  adminAuth,
  updateAddress
);
router.delete(
  `${routeValue}:userId/addresses/:addressId`,
  adminAuth,
  deleteAddress
);
router.put(
  `${routeValue}:userId/addresses/:addressId/default`,
  adminAuth,
  setDefaultAddress
);

// Admin-protected routes
router.get(`${routeValue}users`, adminAuth, getUsers);
router.post(`${routeValue}remove`, adminAuth, removeUser);
router.put(`${routeValue}update/:id`, adminAuth, updateUser);
router.post(`${routeValue}create-admin`, adminAuth, createAdmin);

export default router;