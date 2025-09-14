import { useState, useEffect, useMemo } from "react";
import PropTypes from "prop-types";

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
        (p) => p.name.toLowerCase() === initialValues.provinceName?.toLowerCase()
      );

      if (province) {
        setSelectedProvince(province.code);

        const districtResponse = await fetch(
          `https://provinces.open-api.vn/api/p/${province.code}?depth=2`
        );
        const districtData = await districtResponse.json();
        const fetchedDistricts = districtData.districts || [];
        // Only update districts if different
        setDistricts((prev) =>
          JSON.stringify(prev) !== JSON.stringify(fetchedDistricts) ? fetchedDistricts : prev
        );

        const district = fetchedDistricts.find(
          (d) => d.name.toLowerCase() === initialValues.districtName?.toLowerCase()
        );

        if (district) {
          setSelectedDistrict(district.code);

          const wardResponse = await fetch(
            `https://provinces.open-api.vn/api/d/${district.code}?depth=2`
          );
          const wardData = await wardResponse.json();
          const fetchedWards = wardData.wards || [];
          // Only update wards if different
          setWards((prev) =>
            JSON.stringify(prev) !== JSON.stringify(fetchedWards) ? fetchedWards : prev
          );

          const ward = fetchedWards.find(
            (w) => w.name.toLowerCase() === initialValues.wardName?.toLowerCase()
          );

          if (ward) {
            setSelectedWard(ward.code);
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
      const province = memoizedProvinces.find((p) => String(p.code) === String(selectedProvince));
      const district = memoizedDistricts.find((d) => String(d.code) === String(selectedDistrict));
      const ward = memoizedWards.find((w) => String(w.code) === String(selectedWard));

      return {
        provinceCode: selectedProvince,
        provinceName: province?.name || "",
        districtCode: selectedDistrict,
        districtName: district?.name || "",
        wardCode: selectedWard,
        wardName: ward?.name || "",
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
      const response = await fetch("https://provinces.open-api.vn/api/p/");
      const data = await response.json();
      setProvinces((prev) => (JSON.stringify(prev) !== JSON.stringify(data) ? data : prev));
    } catch (error) {
      console.error("Error fetching provinces:", error);
    } finally {
      setLoading((prev) => ({ ...prev, provinces: false }));
    }
  };

  const fetchDistricts = async (provinceCode) => {
    setLoading((prev) => ({ ...prev, districts: true }));
    try {
      const response = await fetch(
        `https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`
      );
      const data = await response.json();
      setDistricts((prev) =>
        JSON.stringify(prev) !== JSON.stringify(data.districts || []) ? data.districts || [] : prev
      );
    } catch (error) {
      console.error("Error fetching districts:", error);
      setDistricts([]);
    } finally {
      setLoading((prev) => ({ ...prev, districts: false }));
    }
  };

  const fetchWards = async (districtCode) => {
    setLoading((prev) => ({ ...prev, wards: true }));
    try {
      const response = await fetch(
        `https://provinces.open-api.vn/api/d/${districtCode}?depth=2`
      );
      const data = await response.json();
      setWards((prev) =>
        JSON.stringify(prev) !== JSON.stringify(data.wards || []) ? data.wards || [] : prev
      );
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
              <option key={province.code} value={province.code}>
                {province.name}
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
              <option key={district.code} value={district.code}>
                {district.name}
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
              <option key={ward.code} value={ward.code}>
                {ward.name}
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