(function() {
    'use strict';

    const API_BASE_URL = 'http://localhost:5000/api';

    function getAccessToken() {
        return localStorage.getItem('vyFoodUserAccessToken');
    }

    function getRefreshToken() {
        return localStorage.getItem('vyFoodUserRefreshToken');
    }

    function setTokens(accessToken, refreshToken) {
        if (accessToken) localStorage.setItem('vyFoodUserAccessToken', accessToken);
        if (refreshToken) localStorage.setItem('vyFoodUserRefreshToken', refreshToken);
    }

    function clearTokensAndUserInfo() {
        localStorage.removeItem('vyFoodUserAccessToken');
        localStorage.removeItem('vyFoodUserRefreshToken');
        localStorage.removeItem('vyFoodUserInfo');
    }

    let isRefreshing = false;
    let failedQueue = [];

    const processQueue = (error, token = null) => {
        failedQueue.forEach(prom => {
            if (error) {
                prom.reject(error);
            } else {
                prom.resolve(token);
            }
        });
        failedQueue = [];
    };

    async function request(endpoint, method = 'GET', data = null, requiresAuth = true, isFormData = false) {
        const config = {
            method: method,
            headers: {},
        };

        if (requiresAuth) {
            const token = getAccessToken();
            if (token) {
                config.headers['Authorization'] = `Bearer ${token}`;
            } else if (endpoint !== '/auth/login' && endpoint !== '/auth/register' && endpoint !== '/auth/refresh-token') {
                 console.warn(`Không có access token cho request ${method} ${endpoint}`);
            }
        }

        if (data) {
            if (isFormData) {
                config.body = data;
            } else {
                config.headers['Content-Type'] = 'application/json';
                config.body = JSON.stringify(data);
            }
        }

        try {
            let response = await fetch(`${API_BASE_URL}${endpoint}`, config);
            let responseData = {};

            if (response.status === 401 && requiresAuth && endpoint !== '/auth/refresh-token' && !config.headers['X-Retry-With-Refresh']) {
                if (isRefreshing) {
                    return new Promise((resolve, reject) => {
                        failedQueue.push({ resolve, reject });
                    }).then(newAccessToken => {
                        config.headers['Authorization'] = `Bearer ${newAccessToken}`;
                        config.headers['X-Retry-With-Refresh'] = 'true';
                        return fetch(`${API_BASE_URL}${endpoint}`, config).then(async res => {
                            let rData = {}; if (res.status !== 204) { rData = await res.json(); }
                            if (!res.ok) throw { status: res.status, data: rData, message: rData.message || `Lỗi HTTP: ${res.status}` };
                            return rData;
                        });
                    });
                }

                isRefreshing = true;
                const currentRefreshToken = getRefreshToken();

                if (!currentRefreshToken) {
                    isRefreshing = false;
                    ApiService.logoutUser();
                    if (typeof kiemtradangnhap === 'function') kiemtradangnhap();
                    throw new Error("Phiên đăng nhập đã hết hạn (không có refresh token). Vui lòng đăng nhập lại.");
                }

                try {
                    const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ token: currentRefreshToken })
                    });
                    const newTokensData = await refreshResponse.json();

                    if (!refreshResponse.ok || !newTokensData.accessToken) {
                        throw new Error(newTokensData.message || "Không thể làm mới token.");
                    }
                    setTokens(newTokensData.accessToken, newTokensData.refreshToken); // Lưu token mới (nếu có refresh token mới)
                    isRefreshing = false;
                    processQueue(null, newTokensData.accessToken);

                    config.headers['Authorization'] = `Bearer ${newTokensData.accessToken}`;
                    config.headers['X-Retry-With-Refresh'] = 'true';
                    response = await fetch(`${API_BASE_URL}${endpoint}`, config); // Gọi lại request gốc
                    if (response.status !== 204) responseData = await response.json();


                } catch (refreshError) {
                    isRefreshing = false;
                    processQueue(refreshError, null);
                    console.error('Không thể làm mới access token, đăng xuất:', refreshError);
                    ApiService.logoutUser();
                    if (typeof kiemtradangnhap === 'function') kiemtradangnhap();
                    throw new Error(refreshError.message && refreshError.message.includes("hết hạn") ? refreshError.message : "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
                }
            } else { 
                 if (response.status !== 204) {
                    try { responseData = await response.json(); }
                    catch (e) { responseData = { message: response.statusText || "Phản hồi không phải JSON" }; }
                 }
            }


            if (!response.ok) {
                const error = new Error(responseData.message || `Lỗi HTTP: ${response.status}`);
                error.status = response.status;
                error.data = responseData;
                throw error;
            }
            return responseData;
        } catch (error) {
            if (!(error.status === 401 && error.message && (error.message.toLowerCase().includes('token') || error.message.toLowerCase().includes('hết hạn')))) {
                 console.error(`Lỗi API tại ${method} ${endpoint}:`, error.message, error.data || error);
            }
            throw error;
        }
    }

    window.ApiService = {
        loginUser: async function(credentials) {
            const data = await request('/auth/login', 'POST', credentials, false);
            if (data.accessToken && data.id && data.refreshToken) {
                setTokens(data.accessToken, data.refreshToken);
                localStorage.setItem('vyFoodUserInfo', JSON.stringify({
                    id: data.id, fullname: data.fullname, phone: data.phone, userType: data.userType
                  }));
            } else {
                console.warn("Dữ liệu trả về từ login API không đầy đủ:", data);
            }
            return data;
        },
        registerUser: async function(userData) {
            const data = await request('/auth/register', 'POST', userData, false);
             if (data.accessToken && data.id && data.refreshToken) {
                setTokens(data.accessToken, data.refreshToken);
                localStorage.setItem('vyFoodUserInfo', JSON.stringify({
                    id: data.id, fullname: data.fullname, phone: data.phone, userType: data.userType
                  }));
            }
            return data;
        },
        logoutUser: async function() {
            const refreshToken = getRefreshToken();
            clearTokensAndUserInfo();
            if (refreshToken) {
                try {
                    await request('/auth/logout', 'POST', { token: refreshToken }, false);
                } catch (error) {
                    console.warn("Lỗi khi gọi API logout server:", error);
                }
            }
            if (typeof kiemtradangnhap === 'function') {
                kiemtradangnhap();
            }
            if (typeof toast === 'function') {
                toast({ title: "Đã đăng xuất", message: "Bạn đã được đăng xuất.", type: "info", duration: 3000 });
            }
            if (window.location.pathname.includes('admin.html')) {
                window.location.href = '/'; 
            }
        },
        getCurrentUser: function() {
            const userInfo = localStorage.getItem('vyFoodUserInfo');
            return userInfo ? JSON.parse(userInfo) : null;
        },
        isUserLoggedIn: function() {
            return !!getAccessToken();
        },
        fetchProducts: async function(params = {}) {
            const queryParams = new URLSearchParams(params).toString();
            return request(`/products?${queryParams}`, 'GET', null, false);
        },
        fetchProductById: async function(id) {
            return request(`/products/${id}`, 'GET', null, false);
        },
        fetchAdminProducts: async function(params = {}) {
            const queryParams = new URLSearchParams(params).toString();
            return request(`/products/admin/all?${queryParams}`, 'GET', null, true);
        },
        createProduct: async function(formData) {
            return request('/products', 'POST', formData, true, true);
        },
        updateProduct: async function(id, formData) {
            return request(`/products/${id}`, 'PUT', formData, true, true);
        },
        updateProductStatus: async function(id, status) {
            return request(`/products/${id}/status`, 'PUT', { status }, true);
        },
        fetchUserProfile: async function() {
            return request('/users/profile', 'GET', null, true);
        },
        updateUserProfile: async function(profileData) {
            return request('/users/profile', 'PUT', profileData, true);
        },
        updateUserPassword: async function(passwordData) {
            return request('/users/password', 'PUT', passwordData, true);
        },
        fetchAdminUsers: async function(params = {}) {
            const queryParams = new URLSearchParams(params).toString();
            return request(`/users?${queryParams}`, 'GET', null, true);
        },
        fetchAdminUserById: async function(id) {
            return request(`/users/${id}`, 'GET', null, true);
        },
        createUserByAdmin: async function(userData) {
            return request('/users/admin-create', 'POST', userData, true);
        },
        updateUserByAdmin: async function(id, userData) {
            return request(`/users/${id}`, 'PUT', userData, true);
        },
        deleteUserByAdmin: async function(id) {
            return request(`/users/${id}`, 'DELETE', null, true);
        },
        createOrder: async function(orderData) {
            return request('/orders', 'POST', orderData, true);
        },
        fetchMyOrders: async function() {
            return request('/orders/my-orders', 'GET', null, true);
        },
        fetchOrderById: async function(id) {
            return request(`/orders/${id}`, 'GET', null, true);
        },
        fetchAdminOrders: async function(params = {}) {
            const queryParams = new URLSearchParams(params).toString();
            return request(`/orders/admin/all?${queryParams}`, 'GET', null, true);
        },
        updateOrderStatus: async function(id, status) {
            return request(`/orders/${id}/status`, 'PUT', { status }, true);
        },
        fetchAdminStats: async function() {
            return request('/admin/stats', 'GET', null, true);
        },
        fetchAdminSalesReport: async function(params = {}) {
            const queryParams = new URLSearchParams(params).toString();
            return request(`/admin/sales-report?${queryParams}`, 'GET', null, true);
        },
        fetchAdminOrdersByProductId: async function(productId, params = {}) { // HÀM MỚI
            const queryParams = new URLSearchParams(params).toString();
            return request(`/admin/orders-by-product/${productId}?${queryParams}`, 'GET', null, true);
        }
    };
})();