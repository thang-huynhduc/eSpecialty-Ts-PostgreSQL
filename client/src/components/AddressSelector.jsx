import { useState, useEffect, useMemo } from "react";
import PropTypes from "prop-types";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const AddressSelector = ({ onAddressChange, initialValues = null }) => {
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedWard, setSelectedWard] = useState("");
  const [loading, setLoading] = useState({
    provinces: false,
    districts: false,
    wards: false,
  });
  const [isInitializing, setIsInitializing] = useState(false);

  // Memoize provinces, districts, and wards to prevent new references
  const memoizedProvinces = useMemo(() => {
    return provinces;
  }, [provinces]);
  const memoizedDistricts = useMemo(() => {
    return districts;
  }, [districts]);
  const memoizedWards = useMemo(() => {
    return wards;
  }, [wards]);

  // Fetch provinces on component mount
  useEffect(() => {
    fetchProvinces();
  }, []);

  // Initialize with default values if provided
  useEffect(() => {
    if (initialValues && provinces.length > 0 && !isInitializing) {
      initializeAddressData();
    }
  }, [initialValues, provinces]);

  const initializeAddressData = async () => {
    setIsInitializing(true);
    try {
      const province = provinces.find(
        (p) => p.ProvinceName.toLowerCase() === initialValues.provinceName?.toLowerCase() ||
               p.ProvinceID === initialValues.provinceId
      );

      if (province) {
        setSelectedProvince(province.ProvinceID);

        const districtResponse = await fetch(`${API_BASE_URL}/api/ghn/districts/${province.ProvinceID}`);
        const districtResult = await districtResponse.json();
        
        if (districtResult.success) {
          const fetchedDistricts = districtResult.data || [];
          setDistricts((prev) =>
            JSON.stringify(prev) !== JSON.stringify(fetchedDistricts) ? fetchedDistricts : prev
          );

          const district = fetchedDistricts.find(
            (d) => d.DistrictName.toLowerCase() === initialValues.districtName?.toLowerCase() ||
                   d.DistrictID === initialValues.districtId
          );

          if (district) {
            setSelectedDistrict(district.DistrictID);

            const wardResponse = await fetch(`${API_BASE_URL}/api/ghn/wards/${district.DistrictID}`);
            const wardResult = await wardResponse.json();
            
            if (wardResult.success) {
              const fetchedWards = wardResult.data || [];
              setWards((prev) =>
                JSON.stringify(prev) !== JSON.stringify(fetchedWards) ? fetchedWards : prev
              );

              const ward = fetchedWards.find(
                (w) => w.WardName.toLowerCase() === initialValues.wardName?.toLowerCase() ||
                       w.WardCode === initialValues.wardCode
              );

              if (ward) {
                setSelectedWard(ward.WardCode);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Error initializing address data:", error);
    } finally {
      setIsInitializing(false);
    }
  };

  // Fetch districts when province changes, but only if not initializing
  useEffect(() => {
    if (selectedProvince && !isInitializing) {
      fetchDistricts(selectedProvince);
    }
  }, [selectedProvince, isInitializing]);

  // Fetch wards when district changes, but only if not initializing
  useEffect(() => {
    if (selectedDistrict && !isInitializing) {
      fetchWards(selectedDistrict);
    }
  }, [selectedDistrict, isInitializing]);

  // Memoize address data to prevent unnecessary recomputation
  const addressData = useMemo(() => {
    if (
      !isInitializing &&
      memoizedProvinces.length > 0 &&
      selectedProvince &&
      selectedDistrict &&
      selectedWard
    ) {
      const province = memoizedProvinces.find((p) => String(p.ProvinceID) === String(selectedProvince));
      const district = memoizedDistricts.find((d) => String(d.DistrictID) === String(selectedDistrict));
      const ward = memoizedWards.find((w) => String(w.WardCode) === String(selectedWard));

      return {
        provinceId: selectedProvince,
        provinceName: province?.ProvinceName || "",
        districtId: selectedDistrict,
        districtName: district?.DistrictName || "",
        wardCode: selectedWard,
        wardName: ward?.WardName || "",
      };
    }
    return null;
  }, [
    selectedProvince,
    selectedDistrict,
    selectedWard,
    memoizedProvinces,
    memoizedDistricts,
    memoizedWards,
    isInitializing,
  ]);

  // Call onAddressChange when addressData changes
  useEffect(() => {
    if (addressData && !isInitializing) {
      onAddressChange(addressData);
    }
  }, [addressData, onAddressChange, isInitializing]);

  const fetchProvinces = async () => {
    setLoading((prev) => ({ ...prev, provinces: true }));
    try {
      const response = await fetch(`${API_BASE_URL}/api/ghn/provinces`);
      const result = await response.json();
      
      if (result.success) {
        setProvinces((prev) => (JSON.stringify(prev) !== JSON.stringify(result.data) ? result.data : prev));
      } else {
        console.error("Error fetching provinces:", result.message);
      }
    } catch (error) {
      console.error("Error fetching provinces:", error);
    } finally {
      setLoading((prev) => ({ ...prev, provinces: false }));
    }
  };

  const fetchDistricts = async (provinceId) => {
    setLoading((prev) => ({ ...prev, districts: true }));
    try {
      const response = await fetch(`${API_BASE_URL}/api/ghn/districts/${provinceId}`);
      const result = await response.json();
      
      if (result.success) {
        setDistricts((prev) =>
          JSON.stringify(prev) !== JSON.stringify(result.data) ? result.data : prev
        );
      } else {
        console.error("Error fetching districts:", result.message);
        setDistricts([]);
      }
    } catch (error) {
      console.error("Error fetching districts:", error);
      setDistricts([]);
    } finally {
      setLoading((prev) => ({ ...prev, districts: false }));
    }
  };

  const fetchWards = async (districtId) => {
    setLoading((prev) => ({ ...prev, wards: true }));
    try {
      const response = await fetch(`${API_BASE_URL}/api/ghn/wards/${districtId}`);
      const result = await response.json();
      
      if (result.success) {
        setWards((prev) =>
          JSON.stringify(prev) !== JSON.stringify(result.data) ? result.data : prev
        );
      } else {
        console.error("Error fetching wards:", result.message);
        setWards([]);
      }
    } catch (error) {
      console.error("Error fetching wards:", error);
      setWards([]);
    } finally {
      setLoading((prev) => ({ ...prev, wards: false }));
    }
  };

  const handleProvinceChange = (e) => {
    const newProvince = e.target.value;
    setSelectedProvince(newProvince);
    setSelectedDistrict("");
    setSelectedWard("");
    setDistricts([]);
    setWards([]);
  };

  const handleDistrictChange = (e) => {
    const newDistrict = e.target.value;
    setSelectedDistrict(newDistrict);
    setSelectedWard("");
    setWards([]);
  };

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="province" className="block text-sm font-medium text-gray-700 mb-1">
          Tỉnh/Thành phố: <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <select
            id="province"
            value={selectedProvince}
            onChange={handleProvinceChange}
            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white cursor-pointer"
            disabled={loading.provinces}
            required
          >
            <option value="">Chọn Tỉnh/Thành phố</option>
            {provinces.map((province) => (
              <option key={province.ProvinceID} value={province.ProvinceID}>
                {province.ProvinceName}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg
              className="w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
          {loading.provinces && (
            <div className="absolute inset-y-0 right-8 flex items-center">
              <div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="district" className="block text-sm font-medium text-gray-700 mb-1">
          Quận/Huyện: <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <select
            id="district"
            value={selectedDistrict}
            onChange={handleDistrictChange}
            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white cursor-pointer"
            disabled={!selectedProvince || loading.districts}
            required
          >
            <option value="">Chọn Quận/Huyện</option>
            {districts.map((district) => (
              <option key={district.DistrictID} value={district.DistrictID}>
                {district.DistrictName}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg
              className="w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
          {loading.districts && (
            <div className="absolute inset-y-0 right-8 flex items-center">
              <div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="ward" className="block text-sm font-medium text-gray-700 mb-1">
          Phường/Xã: <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <select
            id="ward"
            value={selectedWard}
            onChange={(e) => setSelectedWard(e.target.value)}
            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white cursor-pointer"
            disabled={!selectedDistrict || loading.wards}
            required
          >
            <option value="">Chọn Phường/Xã</option>
            {wards.map((ward) => (
              <option key={ward.WardCode} value={ward.WardCode}>
                {ward.WardName}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg
              className="w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
          {loading.wards && (
            <div className="absolute inset-y-0 right-8 flex items-center">
              <div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

AddressSelector.propTypes = {
  onAddressChange: PropTypes.func,
  initialValues: PropTypes.object,
};

export default AddressSelector;