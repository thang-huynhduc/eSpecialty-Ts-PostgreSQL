import { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";

// Đảm bảo URL này đúng với file .env của đại ca
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

const AddressSelector = ({ onAddressChange, initialValues }) => {
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

  // --- 1. Fetch Data Functions (Tách rời để tái sử dụng) ---

  const fetchProvinces = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, provinces: true }));
      const res = await fetch(`${API_BASE_URL}/api/ghn/provinces`);
      const data = await res.json();
      if (data.data) setProvinces(data.data);
    } catch (err) {
      console.error("Lỗi lấy danh sách tỉnh:", err);
    } finally {
      setLoading(prev => ({ ...prev, provinces: false }));
    }
  }, []);

  const fetchDistricts = useCallback(async (provinceId) => {
    if (!provinceId) return [];
    try {
      setLoading(prev => ({ ...prev, districts: true }));
      // SỬA: Dùng Query Param ?province_id= cho khớp Backend
      const res = await fetch(`${API_BASE_URL}/api/ghn/districts?province_id=${provinceId}`);
      const data = await res.json();
      if (data.data) {
        setDistricts(data.data);
        return data.data; // Trả về data để dùng cho hàm init
      }
      return [];
    } catch (err) {
      console.error("Lỗi lấy danh sách quận:", err);
      return [];
    } finally {
      setLoading(prev => ({ ...prev, districts: false }));
    }
  }, []);

  const fetchWards = useCallback(async (districtId) => {
    if (!districtId) return [];
    try {
      setLoading(prev => ({ ...prev, wards: true }));
      // SỬA: Dùng Query Param ?district_id= cho khớp Backend
      const res = await fetch(`${API_BASE_URL}/api/ghn/wards?district_id=${districtId}`);
      const data = await res.json();
      if (data.data) {
        setWards(data.data);
        return data.data;
      }
      return [];
    } catch (err) {
      console.error("Lỗi lấy danh sách phường:", err);
      return [];
    } finally {
      setLoading(prev => ({ ...prev, wards: false }));
    }
  }, []);

  // --- 2. Initial Data Loading ---

  // Load Tỉnh khi mount
  useEffect(() => {
    fetchProvinces();
  }, [fetchProvinces]);

  // Load lại dữ liệu cũ (Edit mode)
  useEffect(() => {
    const initData = async () => {
      if (initialValues && provinces.length > 0) {
        // 1. Set Tỉnh
        const provId = Number(initialValues.provinceId);
        setSelectedProvince(provId);

        // 2. Fetch Quận theo Tỉnh đó luôn (không chờ state update)
        const fetchedDistricts = await fetchDistricts(provId);
        
        // 3. Set Quận
        const distId = Number(initialValues.districtId);
        // Kiểm tra xem quận cũ có nằm trong list mới fetch không
        const distExists = fetchedDistricts.find(d => d.DistrictID === distId);
        
        if (distExists) {
           setSelectedDistrict(distId);
           // 4. Fetch Phường theo Quận đó
           const fetchedWards = await fetchWards(distId);
           
           // 5. Set Phường
           const wardCode = String(initialValues.wardCode);
           const wardExists = fetchedWards.find(w => w.WardCode === wardCode);
           if (wardExists) {
             setSelectedWard(wardCode);
           }
        }
      }
    };

    // Chỉ chạy 1 lần khi có provinces và initialValues
    if (initialValues && provinces.length > 0 && !selectedProvince) {
        initData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValues, provinces]); 


  // --- 3. Handle User Actions ---

  const handleProvinceChange = (e) => {
    const val = Number(e.target.value);
    setSelectedProvince(val);
    setDistricts([]); 
    setWards([]);
    setSelectedDistrict("");
    setSelectedWard("");
    fetchDistricts(val); // Gọi fetch luôn
  };

  const handleDistrictChange = (e) => {
    const val = Number(e.target.value);
    setSelectedDistrict(val);
    setWards([]);
    setSelectedWard("");
    fetchWards(val); // Gọi fetch luôn
  };

  const handleWardChange = (e) => {
    setSelectedWard(e.target.value); // WardCode là string
  };

  // --- 4. Return Data to Parent ---
  
  useEffect(() => {
    // Chỉ bắn dữ liệu ra ngoài khi đã chọn đủ 3 cấp
    if (selectedProvince && selectedDistrict && selectedWard) {
      const p = provinces.find(x => x.ProvinceID === selectedProvince);
      const d = districts.find(x => x.DistrictID === selectedDistrict);
      const w = wards.find(x => x.WardCode === selectedWard);

      if (p && d && w) {
        onAddressChange({
          provinceId: selectedProvince,   // Number
          provinceName: p.ProvinceName,
          districtId: selectedDistrict,   // Number (Quan trọng cho GHN)
          districtName: d.DistrictName,
          wardCode: selectedWard,         // String (Quan trọng cho GHN)
          wardName: w.WardName,
          fullAddress: `${w.WardName}, ${d.DistrictName}, ${p.ProvinceName}` // Gợi ý full string
        });
      }
    }
  }, [selectedProvince, selectedDistrict, selectedWard, provinces, districts, wards, onAddressChange]);

  return (
    <div className="space-y-4">
      {/* Chọn Tỉnh */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tỉnh/Thành phố <span className="text-red-500">*</span>
        </label>
        <select
          value={selectedProvince}
          onChange={handleProvinceChange}
          disabled={loading.provinces}
          className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 block p-2 border"
        >
          <option value="">-- Chọn Tỉnh/Thành --</option>
          {provinces.map((p) => (
            <option key={p.ProvinceID} value={p.ProvinceID}>
              {p.ProvinceName}
            </option>
          ))}
        </select>
      </div>

      {/* Chọn Quận */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Quận/Huyện <span className="text-red-500">*</span>
        </label>
        <select
          value={selectedDistrict}
          onChange={handleDistrictChange}
          disabled={!selectedProvince || loading.districts}
          className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 block p-2 border"
        >
          <option value="">-- Chọn Quận/Huyện --</option>
          {districts.map((d) => (
            <option key={d.DistrictID} value={d.DistrictID}>
              {d.DistrictName}
            </option>
          ))}
        </select>
      </div>

      {/* Chọn Phường */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
           Phường/Xã <span className="text-red-500">*</span>
        </label>
        <select
          value={selectedWard}
          onChange={handleWardChange}
          disabled={!selectedDistrict || loading.wards}
          className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 block p-2 border"
        >
          <option value="">-- Chọn Phường/Xã --</option>
          {wards.map((w) => (
            <option key={w.WardCode} value={w.WardCode}>
              {w.WardName}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

AddressSelector.propTypes = {
  onAddressChange: PropTypes.func.isRequired,
  initialValues: PropTypes.shape({
    provinceId: PropTypes.number,
    districtId: PropTypes.number,
    wardCode: PropTypes.string,
  }),
};

export default AddressSelector;
