import { useEffect, useCallback } from "react";
import Banner from "./components/Banner";
import Container from "./components/Container";
import BestSellers from "./components/homeProducts/BestSellers";
import NewArrivals from "./components/homeProducts/NewArrivals";
import ProductOfTheYear from "./components/homeProducts/ProductOfTheYear";
import SpecialOffers from "./components/homeProducts/SpecialOffers";
import AboutUs from "./components/AboutUs";
import { jwtDecode } from "jwt-decode";
import { useDispatch } from "react-redux";
import {
  addUser,
  removeUser,
  setOrderCount,
  resetOrderCount,
} from "./redux/especialtySlice";
import { serverUrl } from "../config";

function App() {
  const token = localStorage.getItem("token");
  const dispatch = useDispatch();

  // Function to fetch user orders and update count
  const fetchUserOrderCount = useCallback(
    async (token) => {
      try {
        const response = await fetch(`${serverUrl}/api/order`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: 'include'
        });

        const data = await response.json();
        if (data.success) {
          dispatch(setOrderCount(data.orders.length));
        }
      } catch (error) {
        console.error("Error fetching order count:", error);
        // Don't show error to user as this is not critical
      }
    },
    [dispatch]
  );

  useEffect(() => {
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        dispatch(addUser(decodedToken));
        // Fetch order count for authenticated users
        fetchUserOrderCount(token);
      } catch (error) {
        console.error("Invalid token", error);
        localStorage.removeItem("token");
        dispatch(resetOrderCount());
      }
    } else {
      dispatch(removeUser());
      dispatch(resetOrderCount());
    }
  }, [token, dispatch, fetchUserOrderCount]);
  return (
    <main className="w-full overflow-hidden">
      <Banner />
      <AboutUs />
      <Container className="py-5 md:py-2">
        <NewArrivals />
        <BestSellers />
        <ProductOfTheYear />
        <SpecialOffers />
      </Container>
    </main>
  );
}

export default App;
