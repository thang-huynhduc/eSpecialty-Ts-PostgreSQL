import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  userInfo: null,
  products: [],
  orderCount: 0,
};

export const especialtySlice = createSlice({
  name: "especialty",
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const item = state.products.find(
        (item) => item.id === action.payload.id
      );
      if (item) {
        item.quantity = (item.quantity || 0) + (action.payload.quantity || 1);
      } else {
        state.products.push({
          ...action.payload,
          // Đảm bảo giá là số (vì PostgreSQL trả về Decimal string)
          price: Number(action.payload.price), 
          quantity: action.payload.quantity || 1,
        });
      }
    },
    increaseQuantity: (state, action) => {
      // action.payload là id
      const item = state.products.find((item) => item.id === action.payload);
      if (item) {
        item.quantity = (item.quantity || 0) + 1;
      }
    },
    decreaseQuantity: (state, action) => {
      const item = state.products.find((item) => item.id === action.payload);
      if (item) {
        const currentQuantity = item.quantity || 1;
        if (currentQuantity === 1) {
          item.quantity = 1;
        } else {
          item.quantity = currentQuantity - 1;
        }
      }
    },
    deleteItem: (state, action) => {
      state.products = state.products.filter(
        (item) => item.id !== action.payload
      );
    },
    resetCart: (state) => {
      state.products = [];
    },
    addUser: (state, action) => {
      state.userInfo = action.payload;
    },
    removeUser: (state) => {
      state.userInfo = null;
    },
    setOrderCount: (state, action) => {
      state.orderCount = action.payload;
    },
    resetOrderCount: (state) => {
      state.orderCount = 0;
    },
  },
});

export const {
  addToCart,
  increaseQuantity,
  decreaseQuantity,
  deleteItem,
  resetCart,
  addUser,
  removeUser,
  setOrderCount,
  resetOrderCount,
} = especialtySlice.actions;
export default especialtySlice.reducer;
