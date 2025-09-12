import { useState, useEffect } from "react";
import PropTypes from "prop-types";

const AddressSelector = ({ onAddressChange }) => {
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

  // Fetch provinces on component mount
  useEffect(() => {
    fetchProvinces();
  }, []);

  // Fetch districts when province changes
  useEffect(() => {
    if (selectedProvince) {
      fetchDistricts(selectedProvince);
      setSelectedDistrict("");
      setSelectedWard("");
      setWards([]);
    } else {
      setDistricts([]);
      setWards([]);
    }
  }, [selectedProvince]);

  // Fetch wards when district changes
  useEffect(() => {
    if (selectedDistrict) {
      fetchWards(selectedDistrict);
      setSelectedWard("");
    } else {
      setWards([]);
    }
  }, [selectedDistrict]);

  // Update parent component when selections change
  useEffect(() => {
    if (onAddressChange) {
      const provinceName = provinces.find(p => p.code === selectedProvince)?.name || "";
      const districtName = districts.find(d => d.code === selectedDistrict)?.name || "";
      const wardName = wards.find(w => w.code === selectedWard)?.name || "";
      
      onAddressChange({
        provinceCode: selectedProvince,
        provinceName,
        districtCode: selectedDistrict,
        districtName,
        wardCode: selectedWard,
        wardName,
      });
    }
  }, [selectedProvince, selectedDistrict, selectedWard, provinces, districts, wards, onAddressChange]);

  const fetchProvinces = async () => {
    setLoading(prev => ({ ...prev, provinces: true }));
    try {
      const response = await fetch("https://provinces.open-api.vn/api/p/");
      const data = await response.json();
      setProvinces(data);
    } catch (error) {
      console.error("Error fetching provinces:", error);
    } finally {
      setLoading(prev => ({ ...prev, provinces: false }));
    }
  };

  const fetchDistricts = async (provinceCode) => {
    setLoading(prev => ({ ...prev, districts: true }));
    try {
      const response = await fetch(`https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`);
      const data = await response.json();
      setDistricts(data.districts || []);
    } catch (error) {
      console.error("Error fetching districts:", error);
    } finally {
      setLoading(prev => ({ ...prev, districts: false }));
    }
  };

  const fetchWards = async (districtCode) => {
    setLoading(prev => ({ ...prev, wards: true }));
    try {
      const response = await fetch(`https://provinces.open-api.vn/api/d/${districtCode}?depth=2`);
      const data = await response.json();
      setWards(data.wards || []);
    } catch (error) {
      console.error("Error fetching wards:", error);
    } finally {
      setLoading(prev => ({ ...prev, wards: false }));
    }
  };

  return (
    <div className="space-y-4">
      {/* Province/City Selector */}
      <div>
        <label htmlFor="province" className="block text-sm font-medium text-gray-700 mb-1">
          Thành phố: <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <select
            id="province"
            value={selectedProvince}
            onChange={(e) => setSelectedProvince(e.target.value)}
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

      {/* District Selector */}
      <div>
        <label htmlFor="district" className="block text-sm font-medium text-gray-700 mb-1">
          Quận/Huyện: <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <select
            id="district"
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
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

      {/* Ward Selector */}
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
};

export default AddressSelector;
