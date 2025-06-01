(function() {
    'use strict';

    const API_BASE_URL = 'http://localhost:5000/api';

    function getToken() {
        return localStorage.getItem('UserToken');
    }

    async function request(endpoint, method = 'GET', data = null, requiresAuth = false, isFormData = false) {
        const config = {
            method: method,
            headers: {},
        };

        if (requiresAuth) {
            const token = getToken();
            if (token) {
                config.headers['Authorization'] = `Bearer ${token}`;
            } else {
                console.warn(`Token không tồn tại cho request ${method} ${endpoint} yêu cầu xác thực.`);
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
            const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
            let responseData = {};
            if (response.status !== 204) {
                try {
                    responseData = await response.json();
                } catch (e) {
                    responseData = { message: response.statusText || "Phản hồi không phải JSON" };
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
            console.error(`Lỗi API tại ${method} ${endpoint}:`, error.message, error.data || '');
            throw error;
        }
    }

    window.ApiService = {
        loginUser: async function(credentials) {
            const data = await request('/auth/login', 'POST', credentials);
            if (data.token && data.id && data.fullname && data.phone && data.userType !== undefined) {
                localStorage.setItem('UserToken', data.token);
                localStorage.setItem('UserInfo', JSON.stringify({
                    id: data.id,
                    fullname: data.fullname,
                    phone: data.phone,
                    userType: data.userType
                }));
            } else {
                console.warn("Dữ liệu trả về từ login API không đầy đủ:", data);
            }
            return data;
        },
        registerUser: async function(userData) {
            const data = await request('/auth/register', 'POST', userData);
            if (data.token && data.id && data.fullname && data.phone && data.userType !== undefined) {
                localStorage.setItem('UserToken', data.token);
                localStorage.setItem('UserInfo', JSON.stringify({
                    id: data.id,
                    fullname: data.fullname,
                    phone: data.phone,
                    userType: data.userType
                }));
            }
            return data;
        },
        logoutUser: function() {
            localStorage.removeItem('UserToken');
            localStorage.removeItem('UserInfo');
        },
        getCurrentUser: function() {
            const userInfo = localStorage.getItem('UserInfo');
            return userInfo ? JSON.parse(userInfo) : null;
        },
        isUserLoggedIn: function() {
            return !!getToken();
        },

        fetchProducts: async function(params = {}) {
            const queryParams = new URLSearchParams(params).toString();
            return request(`/products?${queryParams}`);
        },
        fetchProductById: async function(id) {
            return request(`/products/${id}`);
        },
        fetchAdminProducts: async function(params = {}) {
            const queryParams = new URLSearchParams(params).toString();
            return request(`/products/admin/all?${queryParams}`, 'GET', null, true);
        },
        createProduct: async function(formData) {
            return request('/products', 'POST', formData, true, true);
            if (requiresAuth && !token) {
                throw new Error('No authentication token found');
            };
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
        // Add these methods to the ApiService object
        fetchCart: async function() {
        return request('/cart', 'GET', null, true);
        },

        addToCart: async function(itemData) {
        return request('/cart', 'POST', itemData, true);
        },

        updateCartItem: async function(itemId, quantity) {
        return request(`/cart/${itemId}`, 'PUT', { quantity }, true);
        },

        removeCartItem: async function(itemId) {
        return request(`/cart/${itemId}`, 'DELETE', null, true);
        },

        clearCart: async function() {
        return request('/cart', 'DELETE', null, true);
        },

        getCartTotal: async function() {
            try {
                const response = await request('/cart/total', 'GET', null, true);
                console.log("API getCartTotal response:", response); // Debug server response
                return response;
            } catch (error) {
                console.error("API getCartTotal error:", error.message, error.status, error.data);
                throw error;
            }
        },

        getCartItemCount: async function() {
        return request('/cart/count', 'GET', null, true);
        },

        fetchOrdersByProductId: async function(productId, params = {}) {
            const queryParams = new URLSearchParams(params).toString();
            return request(`/orders/product/${productId}?${queryParams}`, 'GET', null, true);
        }
    };
})();