import { useState, useEffect } from "react";
import {
  FaChartLine,
  FaUsers,
  FaShoppingCart,
  FaDollarSign,
  FaArrowUp,
  FaArrowDown,
  FaEye,
  FaFireAlt,
  FaClock,
  FaCalendarAlt
} from "react-icons/fa";
import { MdAnalytics } from "react-icons/md";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { motion } from "framer-motion";
import { serverUrl } from "../../config";

const Analytics = () => {
  const [stats, setStats] = useState(null);
  const [quickStats, setQuickStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        };

        const statsRes = await fetch(`${serverUrl}/api/dashboard/stats`, { headers });
        const statsData = await statsRes.json();
        if (!statsData.success) throw new Error(statsData.message);

        const analyticsRes = await fetch(`${serverUrl}/api/dashboard/analytics?period=6months`, { headers });
        const analyticsData = await analyticsRes.json();
        if (!analyticsData.success) throw new Error(analyticsData.message);

        const quickStatsRes = await fetch(`${serverUrl}/api/dashboard/quick-stats`, { headers });
        const quickStatsData = await quickStatsRes.json();
        if (!quickStatsData.success) throw new Error(quickStatsData.message);

        setStats(statsData.stats);
        setAnalytics(analyticsData.analytics);
        setQuickStats(quickStatsData.quickStats);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatVND = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  const monthlyRevenueData = analytics?.monthlyData.map((item) => ({
    name: `${item._id.month}/${item._id.year}`,
    revenue: item.revenue,
    orders: item.orders,
  })) || [];

  const userRegistrationData = analytics?.userRegistrations.map((item) => ({
    name: `${item._id.month}/${item._id.year}`,
    users: item.users,
  })) || [];

  const pieData = stats?.ordersByStatus.map((item, index) => ({
    name: item._id,
    value: item.count,
    color: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'][index % 4]
  })) || [];

  // Định nghĩa danh sách màu để random
  const barColors = ["#EC4899", "#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#6366F1"];
  // Random màu
  const randomColor = barColors[Math.floor(Math.random() * barColors.length)];

  const displayStats = [
    {
      title: "Tổng Doanh Thu",
      value: formatVND(stats?.totalRevenue || 0),
      change: `+${stats?.growth.revenue || 0}%`,
      trend: "up",
      icon: <FaDollarSign />,
    },
    {
      title: "Tổng Đơn Hàng",
      value: (stats?.totalOrders || 0).toLocaleString('vi-VN'),
      change: `+${stats?.growth.orders || 0}%`,
      trend: "up",
      icon: <FaShoppingCart />,
    },
    {
      title: "Tổng Người Dùng",
      value: (stats?.totalUsers || 0).toLocaleString('vi-VN'),
      change: `+${stats?.growth.users || 0}%`,
      trend: "up",
      icon: <FaUsers />,
    },
    {
      title: "Tổng Sản Phẩm",
      value: (stats?.totalProducts || 0).toLocaleString('vi-VN'),
      change: `+${stats?.growth.products || 0}%`,
      trend: "up",
      icon: <FaChartLine />,
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { delayChildren: 0.1, staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-gray-400 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center text-gray-800">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 relative overflow-hidden p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-8"
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-gray-800 rounded-2xl shadow-lg">
            <MdAnalytics className="text-2xl text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-gray-800">
              Analytics Dashboard
            </h1>
            <p className="text-gray-600 text-lg">
              Theo dõi hiệu suất kinh doanh realtime
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-8"
      >
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayStats.map((stat, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ scale: 1.05, rotate: 1 }}
              className="relative overflow-hidden bg-white p-6 rounded-3xl shadow-lg border border-gray-200"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-gray-100 to-transparent"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-4 rounded-2xl bg-gray-800 shadow-lg">
                    <div className="text-2xl text-white">{stat.icon}</div>
                  </div>
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold ${
                    stat.trend === "up" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  }`}>
                    {stat.trend === "up" ? <FaArrowUp /> : <FaArrowDown />}
                    {stat.change}
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-gray-800 mb-2">{stat.value}</h3>
                <p className="text-gray-600 font-medium">{stat.title}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Quick Stats Today */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-800 p-6 rounded-3xl shadow-lg text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-4">
                <FaClock className="text-3xl" />
                <h3 className="text-xl font-bold">Doanh Thu Hôm Nay</h3>
              </div>
              <p className="text-4xl font-bold">{formatVND(quickStats?.todaysSales || 0)}</p>
            </div>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-3xl shadow-lg text-white relative overflow-hidden">
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-16 -translate-x-16"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-4">
                <FaShoppingCart className="text-3xl" />
                <h3 className="text-xl font-bold">Đơn Hàng Hôm Nay</h3>
              </div>
              <p className="text-4xl font-bold">{quickStats?.todaysOrders?.toLocaleString('vi-VN') || 0}</p>
            </div>
          </div>
        </motion.div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Revenue Chart */}
          <motion.div
            variants={itemVariants}
            className="xl:col-span-2 bg-white p-6 rounded-3xl border border-gray-200 shadow-lg"
          >
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <FaChartLine />
              Biểu Đồ Doanh Thu & Đơn Hàng
            </h3>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={monthlyRevenueData}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="ordersGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-gray-800 text-white p-3 rounded-lg shadow-lg">
                        <p className="font-bold">{label}</p>
                        <p>Doanh thu: {formatVND(payload[0].value)}</p>
                        <p>Đơn hàng: {payload[1].value}</p>
                      </div>
                    );
                  }
                  return null;
                }}/>
                <Area type="monotone" dataKey="revenue" stroke="#10B981" fillOpacity={1} fill="url(#revenueGradient)" strokeWidth={3} />
                <Area type="monotone" dataKey="orders" stroke="#3B82F6" fillOpacity={1} fill="url(#ordersGradient)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Orders Status Pie Chart */}
          <motion.div
            variants={itemVariants}
            className="bg-white p-6 rounded-3xl border border-gray-200 shadow-lg"
          >
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <FaEye />
              Trạng Thái Đơn Hàng
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0];
                    const percent = ((item.value / (stats?.totalOrders || 1)) * 100).toFixed(1);
                    return (
                      <div className="bg-white text-gray-800 p-2 rounded-lg shadow-md">
                        <p><b>{item.name.charAt(0).toUpperCase() + item.name.slice(1)}</b></p>
                        <p>Số đơn: {item.value}</p>
                        <p>Tỷ lệ: {percent}%</p>
                      </div>
                    );
                  }
                  return null;
                }}/>
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {pieData.map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-gray-800 capitalize text-sm">{item.name}: {item.value} đơn hàng ({((item.value / (stats?.totalOrders || 1)) * 100).toFixed(1)}%)</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* User Registration Chart */}
        <motion.div
          variants={itemVariants}
          className="bg-white p-6 rounded-3xl border border-gray-200 shadow-lg"
        >
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <FaUsers />
            Biểu Đồ Đăng Ký Người Dùng
          </h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={userRegistrationData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-gray-800 text-white p-3 rounded-lg">
                      <p className="font-bold">Tháng {label}</p>
                      <p>Số người dùng đăng ký: {payload[0].value}</p>
                    </div>
                  );
                }
                return null;
              }}/>
              <Bar dataKey="users" fill={randomColor} radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Orders */}
          <motion.div
            variants={itemVariants}
            className="bg-white p-6 rounded-3xl border border-gray-200 shadow-lg"
          >
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <FaClock />
              Đơn Hàng Gần Đây
            </h3>
            <div className="space-y-4">
              {stats?.recentOrders.map((order, index) => (
                <motion.div
                  key={order._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 bg-gray-100 rounded-2xl border border-gray-200"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center text-white font-bold">
                      {order.userId.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-gray-800 font-semibold">{order.userId.name} ({order.userId.email})</p>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                        order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                      <p className="text-gray-600 text-xs mt-1">Ngày: {new Date(order.date).toLocaleString('vi-VN')}</p>
                    </div>
                  </div>
                  <p className="text-gray-800 font-bold">{formatVND(order.amount)}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Top Products */}
          <motion.div
            variants={itemVariants}
            className="bg-white p-6 rounded-3xl border border-gray-200 shadow-lg"
          >
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <FaFireAlt />
              Sản Phẩm Hàng Đầu
            </h3>
            <div className="space-y-4">
              {stats?.topProducts.map((product, index) => (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-4 p-4 bg-gray-100 rounded-2xl border border-gray-200"
                >
                  <img 
                    src={product.images?.[0] || product.thumbnail || 'https://placehold.co/64x64/png?text=Prod&font=roboto'} 
                    alt={product.name}
                    className="w-16 h-16 object-cover rounded-xl shadow-lg"
                  />
                  <div className="flex-1">
                    <p className="text-gray-800 font-semibold">{product.name}</p>
                    <p className="text-gray-600 text-sm flex items-center gap-2">
                      <FaCalendarAlt />
                      {new Date(product.createdAt).toLocaleString('vi-VN')}
                    </p>
                  </div>
                  <div className="text-2xl font-bold text-gray-800">#{index + 1}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Recent Users */}
          <motion.div
            variants={itemVariants}
            className="bg-white p-6 rounded-3xl border border-gray-200 shadow-lg"
          >
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <FaUsers />
              Người Dùng Gần Đây
            </h3>
            <div className="space-y-4">
              {stats?.recentUsers.map((user, index) => (
                <motion.div
                  key={user._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-4 p-4 bg-gray-100 rounded-2xl border border-gray-200"
                >
                  <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center text-white font-bold">
                    {user.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-800 font-semibold">{user.name}</p>
                    <p className="text-gray-600 text-sm">{user.email}</p>
                    <p className="text-gray-600 text-xs mt-1 flex items-center gap-2">
                      <FaCalendarAlt />
                      {new Date(user.createdAt).toLocaleString('vi-VN')}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default Analytics;