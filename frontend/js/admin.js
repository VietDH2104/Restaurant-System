const BACKEND_URL = 'http://localhost:5000';

async function checkLogin() {
    const currentUser = ApiService.getCurrentUser();
    if(currentUser == null || currentUser.userType !== 1) {
        document.querySelector("body").innerHTML = `<div class="access-denied-section" style="display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; text-align: center;">
            <img class="access-denied-img" src="./assets/img/access-denied.webp" alt="" style="max-width: 300px; margin-bottom: 20px;">
             <p style="font-size:1.2rem;">Bạn không có quyền truy cập trang này. <a href="/">Về trang chủ</a></p>
        </div>`;
        return false;
    } else {
        const nameAccEl = document.getElementById("name-acc");
        if (nameAccEl) nameAccEl.innerHTML = currentUser.fullname;
        return true;
    }
}

const menuIconButton = document.querySelector(".menu-icon-btn");
const sidebar = document.querySelector(".sidebar");
if (menuIconButton && sidebar) {
    menuIconButton.addEventListener("click", () => {
        sidebar.classList.toggle("open");
    });
}

const sidebars = document.querySelectorAll(".sidebar-list-item.tab-content");
const sections = document.querySelectorAll(".section");

for(let i = 0; i < sidebars.length; i++) {
    sidebars[i].onclick = function () {
        const currentActiveSidebar = document.querySelector(".sidebar-list-item.active");
        if(currentActiveSidebar) currentActiveSidebar.classList.remove("active");

        const currentActiveSection = document.querySelector(".section.active");
        if(currentActiveSection) currentActiveSection.classList.remove("active");

        sidebars[i].classList.add("active");
        if (sections[i]) sections[i].classList.add("active");
    };
}

const contentContainer = document.querySelector('.content');
if (sidebar && contentContainer) {
    contentContainer.addEventListener('click', (e) => {
        if (window.innerWidth < 1024 && sidebar.classList.contains('open')) {
            if (menuIconButton && !menuIconButton.contains(e.target)) {
                // sidebar.classList.remove('open');
            }
        }
    });
}

async function loadDashboardStats() {
    try {
        const stats = await ApiService.fetchAdminStats();
        const amountUserEl = document.getElementById("amount-user");
        const amountProductEl = document.getElementById("amount-product");
        const doanhThuEl = document.getElementById("doanh-thu");

        if (amountUserEl) amountUserEl.innerHTML = stats.totalCustomers || 0;
        if (amountProductEl) amountProductEl.innerHTML = stats.totalProducts || 0;
        if (doanhThuEl) doanhThuEl.innerHTML = vnd(stats.totalRevenue || 0);
    } catch (error) {
        console.error("Error loading dashboard stats:", error);
        if (typeof toast === 'function') toast({ title: "Lỗi", message: "Không thể tải dữ liệu tổng quan.", type: "error" });
    }
}

function vnd(price) {
    if (typeof price !== 'number') {
        price = parseFloat(price) || 0;
    }
    return price.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
}

let adminCurrentPage = 1;
let adminPerPage = 10;

function setupAdminPagination(totalItems, perPage, activePage, sectionType, currentFilters = {}) {
    let pageNavList;
    if (sectionType === 'product') {
        pageNavList = document.querySelector(".product-all .page-nav-list");
    } else if (sectionType === 'user') {
        const userSection = sections[2];
        if (userSection) pageNavList = userSection.querySelector(".page-nav-list");
    } else if (sectionType === 'order') {
        const orderSection = sections[3];
         if (orderSection) pageNavList = orderSection.querySelector(".page-nav-list");
    } else if (sectionType === 'stats') {
        const statsSection = sections[4];
        if (statsSection) pageNavList = statsSection.querySelector(".page-nav-list");
    }

    if (!pageNavList) {
        if (sectionType !== 'user' && sectionType !== 'dashboard' && sectionType !== 'order' && sectionType !== 'stats') {
            console.warn("Pagination list element not found for section:", sectionType);
        }
        return;
    }
    pageNavList.innerHTML = '';
    const page_count = Math.ceil(totalItems / perPage);

    for (let i = 1; i <= page_count; i++) {
        let node = document.createElement(`li`);
        node.classList.add('page-nav-item');
        node.innerHTML = `<a href="javascript:;">${i}</a>`;
        if (activePage === i) node.classList.add('active');

        node.addEventListener('click', async function () {
            adminCurrentPage = i;
            const newFilters = { ...currentFilters, page: adminCurrentPage };

            if (sectionType === 'product') {
                await showProduct(newFilters);
            } else if (sectionType === 'user') {
                await showUser(newFilters);
            } else if (sectionType === 'order') {
                await findOrder(newFilters);
            } else if (sectionType === 'stats') {
                 const currentSortMode = getCurrentSortModeForStats();
                 await thongKe(currentSortMode, newFilters);
            }

            const currentActivePagItem = pageNavList.querySelector('.page-nav-item.active');
            if(currentActivePagItem) currentActivePagItem.classList.remove('active');
            node.classList.add('active');
        });
        pageNavList.appendChild(node);
    }
}
function getCurrentSortModeForStats() {
    return 0;
}

async function showProductArr(arr) {
    let productHtml = "";
    const productShowElement = document.getElementById("show-product");

    if (!productShowElement) {
        return;
    }

    if(!arr || arr.length == 0) {
        productHtml = `<div class="no-result" style="padding: 20px; text-align: center;"><div class="no-result-i" style="font-size: 48px; margin-bottom: 10px;"><i class="fa-light fa-face-sad-cry"></i></div><div class="no-result-h" style="font-size: 1.2rem;">Không có sản phẩm để hiển thị</div></div>`;
    } else {
        arr.forEach(product => {
            let btnCtl = product.status == 1 ?
            `<button class="btn-delete" onclick="updateProductStatus(${product.id}, 0, this)"><i class="fa-regular fa-trash"></i></button>` :
            `<button class="btn-delete btn-restore" onclick="updateProductStatus(${product.id}, 1, this)"><i class="fa-regular fa-eye"></i></button>`;

            let imageUrl = './assets/img/blank-image.png';

            if (product.img_url && typeof product.img_url === 'string' && product.img_url.trim() !== "") {
                if (product.img_url.startsWith('http://') || product.img_url.startsWith('https://')) {
                    imageUrl = product.img_url;
                } else {
                    let relativePath = product.img_url;
                    if (!relativePath.startsWith('/')) {
                        relativePath = '/' + relativePath;
                    }
                    imageUrl = BACKEND_URL + relativePath;
                }
            }

            productHtml += `
            <div class="list">
                <div class="list-left">
                    <img src="${imageUrl}" alt="${product.title || 'Sản phẩm không tên'}" style="width: 100px; height: 100px; object-fit: cover;">
                    <div class="list-info">
                        <h4>${product.title || '(Chưa có tên)'}</h4>
                        <p class="list-note">${product.description || '(Chưa có mô tả)'}</p>
                        <span class="list-category">${product.category || '(Chưa phân loại)'}</span>
                    </div>
                </div>
                <div class="list-right">
                    <div class="list-price">
                    <span class="list-current-price">${vnd(product.price)}</span>
                    </div>
                    <div class="list-control">
                    <div class="list-tool">
                        <button class="btn-edit" onclick="editProduct(${product.id})"><i class="fa-light fa-pen-to-square"></i></button>
                        ${btnCtl}
                    </div>
                </div>
                </div>
            </div>`;
        });
    }
    productShowElement.innerHTML = productHtml;
}

async function showProduct(externalFilters = {}) {
    let selectOpEl = document.getElementById('the-loai');
    let searchInputEl = document.getElementById('form-search-product');
    let selectOp = selectOpEl ? selectOpEl.value : "Tất cả";
    let valeSearchInput = searchInputEl ? searchInputEl.value : "";


    const params = {
        page: adminCurrentPage,
        limit: adminPerPage,
        ...externalFilters
    };

    if (selectOp && selectOp !== "Tất cả" && selectOp !== "Đã xóa") {
        params.category = selectOp;
    }
    if (valeSearchInput) {
        params.search = valeSearchInput;
    }
    if (selectOp === "Đã xóa") {
        params.status = 0;
    } else if (selectOp !== "Tất cả" && selectOp !== "Đã xóa"){
        params.status = 1;
    }

    try {
        const response = await ApiService.fetchAdminProducts(params);
        showProductArr(response.data);
        if (response.pagination && typeof setupAdminPagination === 'function') {
            setupAdminPagination(response.pagination.totalItems, adminPerPage, response.pagination.currentPage, 'product', params);
        }
    } catch (error) {
        console.error("Error fetching admin products:", error);
        if (typeof toast === 'function') toast({ title: "Lỗi", message: "Không thể tải danh sách sản phẩm.", type: "error" });
        const productShowElement = document.getElementById("show-product");
        if (productShowElement) productShowElement.innerHTML = `<p style="text-align:center;">Lỗi tải sản phẩm.</p>`;
    }
}

async function cancelSearchProduct() {
    const theLoaiEl = document.getElementById('the-loai');
    const formSearchProductEl = document.getElementById('form-search-product');
    if(theLoaiEl) theLoaiEl.value = "Tất cả";
    if(formSearchProductEl) formSearchProductEl.value = "";
    adminCurrentPage = 1;
    await showProduct();
}

async function updateProductStatus(productId, newStatus, element) {
    const actionText = newStatus === 0 ? "xóa (ẩn)" : "khôi phục";
    const confirmAction = confirm(`Bạn có chắc muốn ${actionText} sản phẩm này?`);
    if (confirmAction) {
        try {
            await ApiService.updateProductStatus(productId, newStatus);
            if (typeof toast === 'function') toast({ title: 'Thành công', message: `Sản phẩm đã được ${actionText}.`, type: 'success' });
            await showProduct({page: adminCurrentPage});
        } catch (error) {
            console.error(`Error ${actionText} product:`, error);
            if (typeof toast === 'function') toast({ title: 'Lỗi', message: `Không thể ${actionText} sản phẩm.`, type: 'error' });
        }
    }
}

var currentEditingProductId = null;
async function editProduct(id) {
    try {
        const product = await ApiService.fetchProductById(id);
        if (!product) {
            if (typeof toast === 'function') toast({ title: "Lỗi", message: "Không tìm thấy sản phẩm.", type: "error"});
            return;
        }
        currentEditingProductId = product.id;
        
        const addProductModal = document.querySelector(".modal.add-product");
        if (!addProductModal) return;

        addProductModal.querySelectorAll(".add-product-e").forEach(item => item.style.display = "none");
        addProductModal.querySelectorAll(".edit-product-e").forEach(item => item.style.display = "block");
        addProductModal.classList.add("open");

        const previewImg = addProductModal.querySelector(".upload-image-preview");
        const tenMonInput = addProductModal.querySelector("#ten-mon");
        const giaMoiInput = addProductModal.querySelector("#gia-moi");
        const moTaInput = addProductModal.querySelector("#mo-ta");
        const chonMonSelect = addProductModal.querySelector("#chon-mon");

        if (previewImg) {
            let currentImageUrl = './assets/img/blank-image.png';
            if (product.img_url) {
                 currentImageUrl = BACKEND_URL + product.img_url;
            }
            previewImg.src = currentImageUrl;
            previewImg.dataset.originalUrl = currentImageUrl;
        }
        if (tenMonInput) tenMonInput.value = product.title || "";
        if (giaMoiInput) giaMoiInput.value = product.price || "";
        if (moTaInput) moTaInput.value = product.description || "";
        if (chonMonSelect) chonMonSelect.value = product.category || "";
        
        uploadedFile = null;

    } catch (error) {
        console.error("Error fetching product for edit:", error);
        if (typeof toast === 'function') toast({ title: "Lỗi", message: "Không thể tải thông tin sản phẩm để sửa.", type: "error" });
    }
}

let uploadedFile = null;
function uploadImage(el) {
    if (el.files && el.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const previewImage = document.querySelector(".modal.add-product .upload-image-preview");
            if (previewImage) {
                previewImage.setAttribute("src", e.target.result);
            }
        }
        reader.readAsDataURL(el.files[0]);
        uploadedFile = el.files[0];
    } else {
        uploadedFile = null;
        const previewImage = document.querySelector(".modal.add-product .upload-image-preview");
        if (previewImage) {
            const originalUrl = previewImage.dataset.originalUrl;
            if (originalUrl && originalUrl !== './assets/img/blank-image.png') {
                previewImage.setAttribute("src", originalUrl);
            } else {
                previewImage.setAttribute("src", './assets/img/blank-image.png');
            }
        }
    }
}

const btnUpdateProductIn = document.getElementById("update-product-button");
if(btnUpdateProductIn) {
    btnUpdateProductIn.addEventListener("click", async (e) => {
        e.preventDefault();
        if (!currentEditingProductId) {
            if (typeof toast === 'function') toast({ title: "Lỗi", message: "Không có sản phẩm nào đang được chọn để sửa.", type: "warning" });
            return;
        }
        const modal = document.querySelector(".modal.add-product");
        const title = modal.querySelector("#ten-mon").value;
        const priceStr = modal.querySelector("#gia-moi").value;
        const description = modal.querySelector("#mo-ta").value;
        const category = modal.querySelector("#chon-mon").value;
        const statusInput = modal.querySelector("#product-status-edit"); // Cần input này nếu muốn sửa status
        const status = statusInput ? statusInput.value : undefined;


        if (!title.trim() || !priceStr.trim() || !category) {
            if (typeof toast === 'function') toast({ title: "Chú ý", message: "Tên món, giá và loại món là bắt buộc!", type: "warning" });
            return;
        }
        const priceValue = parseFloat(priceStr);
        if (isNaN(priceValue) || priceValue < 0) {
            if (typeof toast === 'function') toast({ title: "Chú ý", message: "Giá phải là số không âm!", type: "warning" });
            return;
        }

        const formData = new FormData();
        formData.append('title', title.trim());
        formData.append('price', priceValue);
        formData.append('category', category);
        if (description.trim()) formData.append('description', description.trim());
        if (status !== undefined) formData.append('status', status);

        const previewImageSrc = modal.querySelector(".upload-image-preview").src;
        const originalUrlDataSet = modal.querySelector(".upload-image-preview").dataset.originalUrl;


        if (uploadedFile) {
            formData.append('imageFile', uploadedFile);
        } else if (previewImageSrc.includes('blank-image.png') && originalUrlDataSet && originalUrlDataSet !=='./assets/img/blank-image.png' && !originalUrlDataSet.includes('blank-image.png') ) {
             formData.append('remove_image', 'true');
        } else if (originalUrlDataSet && !previewImageSrc.includes('data:image') && originalUrlDataSet !== './assets/img/blank-image.png') {
             formData.append('img_url_hidden', originalUrlDataSet.replace(BACKEND_URL, ''));
        }

        try {
            await ApiService.updateProduct(currentEditingProductId, formData);
            if (typeof toast === 'function') toast({ title: "Success", message: "Sửa sản phẩm thành công!", type: "success" });
            setDefaultProductFormValue();
            modal.classList.remove("open");
            await showProduct({page: adminCurrentPage});
        } catch (error) {
            console.error("Error updating product:", error);
            if (typeof toast === 'function') toast({ title: "Lỗi", message: error.data?.message || "Sửa sản phẩm thất bại.", type: "error" });
        }
    });
}

const btnAddProductInReal = document.querySelector(".modal.add-product .form-submit.btn-add-product-form");
if (btnAddProductInReal) {
    btnAddProductInReal.addEventListener("click", async (e) => {
        e.preventDefault();

        const modal = document.querySelector(".modal.add-product");
        const tenMonInput = modal.querySelector("#ten-mon");
        const tenMon = tenMonInput ? tenMonInput.value.trim() : "";

        const priceStrInput = modal.querySelector("#gia-moi");
        const priceStr = priceStrInput ? priceStrInput.value.trim() : "";

        const moTaInput = modal.querySelector("#mo-ta");
        const moTa = moTaInput ? moTaInput.value.trim() : "";

        const categorySelect = modal.querySelector("#chon-mon");
        const categoryText = categorySelect ? categorySelect.value : "";


        if (tenMon === "") {
            if (typeof toast === 'function') toast({ title: "Chú ý", message: "Vui lòng nhập tên món!", type: "warning" });
            if (tenMonInput) tenMonInput.focus();
            return;
        }
        if (categoryText === "" || categoryText === null) {
            if (typeof toast === 'function') toast({ title: "Chú ý", message: "Vui lòng chọn loại món!", type: "warning" });
            if (categorySelect) categorySelect.focus();
            return;
        }
        if (priceStr === "") {
            if (typeof toast === 'function') toast({ title: "Chú ý", message: "Vui lòng nhập giá bán!", type: "warning" });
            if (priceStrInput) priceStrInput.focus();
            return;
        }

        const priceValue = parseFloat(priceStr);
        if (isNaN(priceValue) || priceValue < 0) {
            if (typeof toast === 'function') toast({ title: "Chú ý", message: "Giá bán không hợp lệ!", type: "warning" });
            if (priceStrInput) priceStrInput.focus();
            return;
        }

        const formData = new FormData();
        formData.append('title', tenMon);
        formData.append('price', priceValue);
        formData.append('category', categoryText);
        if (moTa) {
            formData.append('description', moTa);
        }
        formData.append('status', 1);

        if (uploadedFile) {
            formData.append('imageFile', uploadedFile);
        }

        try {
            await ApiService.createProduct(formData);
            if (typeof toast === 'function') toast({ title: "Success", message: "Thêm sản phẩm thành công!", type: "success"});
            setDefaultProductFormValue();
            modal.classList.remove("open");
            adminCurrentPage = 1;
            await showProduct();
        } catch (error) {
            console.error("Error adding product:", error);
            if (typeof toast === 'function') toast({ title: "Lỗi", message: error.data?.message || "Thêm sản phẩm thất bại.", type: "error" });
        }
    });
}


const productModalCloseButton = document.querySelector(".modal.add-product .modal-close.product-form");
if (productModalCloseButton) {
    productModalCloseButton.addEventListener("click",() => {
        setDefaultProductFormValue();
        document.querySelector(".modal.add-product").classList.remove("open");
    });
}

function setDefaultProductFormValue() {
    const productModal = document.querySelector(".modal.add-product");
    if (!productModal) return;

    const previewImg = productModal.querySelector(".upload-image-preview");
    if(previewImg) {
        previewImg.src = "./assets/img/blank-image.png";
        previewImg.removeAttribute('data-original-url');
    }
    const tenMonInput = productModal.querySelector("#ten-mon");
    if(tenMonInput) tenMonInput.value = "";

    const giaMoiInput = productModal.querySelector("#gia-moi");
    if(giaMoiInput) giaMoiInput.value = "";

    const moTaInput = productModal.querySelector("#mo-ta");
    if(moTaInput) moTaInput.value = "";

    const chonMonSelect = productModal.querySelector("#chon-mon");
    if(chonMonSelect) chonMonSelect.value = "Món chay";

    const fileInput = productModal.querySelector("#up-hinh-anh");
    if(fileInput) fileInput.value = null;

    uploadedFile = null;
    currentEditingProductId = null;
}

const btnAddProduct = document.getElementById("btn-add-product");
if (btnAddProduct){
    btnAddProduct.addEventListener("click", () => {
        setDefaultProductFormValue();
        const addProductModal = document.querySelector(".modal.add-product");
        if(addProductModal){
            addProductModal.querySelectorAll(".add-product-e").forEach(item => item.style.display = "block");
            addProductModal.querySelectorAll(".edit-product-e").forEach(item => item.style.display = "none");
            addProductModal.classList.add("open");
        }
    });
}


let closePopupButtons = document.querySelectorAll(".modal .modal-close");
closePopupButtons.forEach(button => {
    button.onclick = () => {
        const modalToClose = button.closest(".modal");
        if (modalToClose) {
            modalToClose.classList.remove("open");
            if (modalToClose.classList.contains('add-product')) {
                setDefaultProductFormValue();
            }
            if (modalToClose.classList.contains('signup')) {
                signUpFormReset();
            }
             if (modalToClose.classList.contains('detail-order-product')) {
                const tableBody = modalToClose.querySelector("#show-product-order-detail");
                if (tableBody) tableBody.innerHTML = "";
            }
        }
    };
});

async function changeOrderStatusInDetail(orderId, newStatus, el) {
    try {
        await ApiService.updateOrderStatus(orderId, newStatus);
        if (typeof toast === 'function') toast({ title: "Thành công", message: "Cập nhật trạng thái đơn hàng thành công.", type: "success" });
        if (el) {
            const willBeProcessed = newStatus === 1;
            el.textContent = willBeProcessed ? "Hủy xử lý" : "Xử lý đơn";
            el.classList.remove(willBeProcessed ? "btn-chuaxuly" : "btn-daxuly");
            el.classList.add(willBeProcessed ? "btn-daxuly" : "btn-chuaxuly");
            el.onclick = () => changeOrderStatusInDetail(orderId, willBeProcessed ? 0 : 1, el);
        }
        await findOrder({page: adminCurrentPage});
    } catch (error) {
        console.error("Error updating order status:", error);
        if (typeof toast === 'function') toast({ title: "Lỗi", message: "Cập nhật trạng thái thất bại.", type: "error" });
    }
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    let dd = date.getDate();
    let mm = date.getMonth() + 1;
    const yyyy = date.getFullYear();
    if (dd < 10) dd = '0' + dd;
    if (mm < 10) mm = '0' + mm;
    return dd + '/' + mm + '/' + yyyy;
}

async function showOrder(ordersArray) {
    let orderHtml = "";
    const showOrderElement = document.getElementById("showOrder");
    if (!showOrderElement) return;

    if(!ordersArray || ordersArray.length == 0) {
        orderHtml = `<tr><td colspan="6" style="text-align:center;">Không có đơn hàng nào.</td></tr>`;
    } else {
        ordersArray.forEach((item) => {
            let statusText = item.status == 0 ? `<span class="status-no-complete">Chưa xử lý</span>` : `<span class="status-complete">Đã xử lý</span>`;
            let date = formatDate(item.order_timestamp);
            orderHtml += `
            <tr>
            <td>${item.id}</td>
            <td>${item.customer_name} (${item.customer_phone})</td>
            <td>${date}</td>
            <td>${vnd(item.total_amount)}</td>
            <td>${statusText}</td>
            <td class="control">
            <button class="btn-detail" onclick="detailOrderAdmin('${item.id}')"><i class="fa-regular fa-eye"></i> Chi tiết</button>
            </td>
            </tr>
            `;
        });
    }
    showOrderElement.innerHTML = orderHtml;
}

async function detailOrderAdmin(orderId) {
    try {
        const order = await ApiService.fetchOrderById(orderId);
        if (!order) {
            if (typeof toast === 'function') toast({ title: "Lỗi", message: "Không tìm thấy đơn hàng.", type: "error" });
            return;
        }
        const detailOrderModal = document.querySelector(".modal.detail-order");
        if (!detailOrderModal) return;
        detailOrderModal.classList.add("open");

        let spHtml = `<div class="modal-detail-left"><div class="order-item-group">`;

        if (order.items && order.items.length > 0) {
            order.items.forEach((item) => {
                let itemImageUrl = './assets/img/blank-image.png';
                if(item.product_img_url) {
                    itemImageUrl = BACKEND_URL + item.product_img_url;
                }

                spHtml += `<div class="order-product">
                    <div class="order-product-left">
                        <img src="${itemImageUrl}" alt="${item.product_title || 'Sản phẩm'}">
                        <div class="order-product-info">
                            <h4>${item.product_title}</h4>
                            <p class="order-product-note"><i class="fa-light fa-pen"></i> ${item.item_notes || 'Không có ghi chú'}</p>
                            <p class="order-product-quantity">SL: ${item.quantity}<p>
                        </div>
                    </div>
                    <div class="order-product-right">
                        <div class="order-product-price">
                            <span class="order-product-current-price">${vnd(item.price_at_purchase)}</span>
                        </div>
                    </div>
                </div>`;
            });
        } else {
            spHtml += `<p>Đơn hàng không có sản phẩm chi tiết.</p>`;
        }
        spHtml += `</div></div>`;

        let deliveryDateInfo = order.delivery_time_slot ? `${order.delivery_time_slot} - ${formatDate(order.delivery_date)}` : formatDate(order.delivery_date);
        if (order.delivery_type && order.delivery_type.toLowerCase().includes('giao ngay')) {
             deliveryDateInfo = `Giao ngay - ${formatDate(order.delivery_date)}`;
        }

        spHtml += `<div class="modal-detail-right">
            <ul class="detail-order-group">
                 <li class="detail-order-item">
                    <span class="detail-order-item-left"><i class="fa-light fa-hashtag"></i> Mã đơn hàng</span>
                    <span class="detail-order-item-right">${order.id}</span>
                </li>
                <li class="detail-order-item">
                    <span class="detail-order-item-left"><i class="fa-light fa-calendar-days"></i> Ngày đặt hàng</span>
                    <span class="detail-order-item-right">${formatDate(order.order_timestamp)}</span>
                </li>
                <li class="detail-order-item">
                    <span class="detail-order-item-left"><i class="fa-light fa-truck"></i> Hình thức giao</span>
                    <span class="detail-order-item-right">${order.delivery_type}</span>
                </li>
                <li class="detail-order-item">
                <span class="detail-order-item-left"><i class="fa-thin fa-person"></i> Người nhận</span>
                <span class="detail-order-item-right">${order.customer_name}</span>
                </li>
                <li class="detail-order-item">
                <span class="detail-order-item-left"><i class="fa-light fa-phone"></i> Số điện thoại</span>
                <span class="detail-order-item-right">${order.customer_phone}</span>
                </li>
                <li class="detail-order-item tb">
                    <span class="detail-order-item-left"><i class="fa-light fa-clock"></i> Thời gian giao</span>
                    <p class="detail-order-item-b">${deliveryDateInfo}</p>
                </li>
                <li class="detail-order-item tb">
                    <span class="detail-order-item-t"><i class="fa-light fa-location-dot"></i> Địa chỉ nhận</span>
                    <p class="detail-order-item-b">${order.delivery_address}</p>
                </li>
                <li class="detail-order-item tb">
                    <span class="detail-order-item-t"><i class="fa-light fa-note-sticky"></i> Ghi chú</span>
                    <p class="detail-order-item-b">${order.notes || 'Không có ghi chú'}</p>
                </li>
            </ul>
        </div>`;
        const modalDetailOrderContent = detailOrderModal.querySelector(".modal-detail-order");
        if (modalDetailOrderContent) modalDetailOrderContent.innerHTML = spHtml;

        let classDetailBtn = order.status == 0 ? "btn-chuaxuly" : "btn-daxuly";
        let textDetailBtn = order.status == 0 ? "Xử lý đơn" : "Hủy xử lý";
        let nextStatusOnClick = order.status == 0 ? 1 : 0;

        const modalDetailBottom = detailOrderModal.querySelector(".modal-detail-bottom");
        if (modalDetailBottom) {
            modalDetailBottom.innerHTML = `
            <div class="modal-detail-bottom-left">
                <div class="price-total">
                    <span class="thanhtien">Thành tiền</span>
                    <span class="price">${vnd(order.total_amount)}</span>
                </div>
            </div>
            <div class="modal-detail-bottom-right">
                <button class="modal-detail-btn ${classDetailBtn}" onclick="changeOrderStatusInDetail('${order.id}', ${nextStatusOnClick}, this)">${textDetailBtn}</button>
            </div>`;
        }
    } catch (error) {
        console.error("Error fetching order detail for admin:", error);
        if (typeof toast === 'function') toast({ title: "Lỗi", message: "Không thể tải chi tiết đơn hàng.", type: "error" });
    }
}

async function findOrder(externalFilters = {}) {
    let tinhTrangValueEl = document.getElementById("tinh-trang");
    let searchValueEl = document.getElementById("form-search-order");
    let timeStartValueEl = document.getElementById("time-start");
    let timeEndValueEl = document.getElementById("time-end");

    let tinhTrangValue = tinhTrangValueEl ? tinhTrangValueEl.value : "2";
    let searchValue = searchValueEl ? searchValueEl.value : "";
    let timeStartValue = timeStartValueEl ? timeStartValueEl.value : "";
    let timeEndValue = timeEndValueEl ? timeEndValueEl.value : "";


    if (timeEndValue && timeStartValue && new Date(timeEndValue) < new Date(timeStartValue)) {
        alert("Ngày kết thúc không thể trước ngày bắt đầu!");
        return;
    }
    const params = {
        page: adminCurrentPage,
        limit: adminPerPage,
        ...externalFilters
    };

    if (tinhTrangValue && tinhTrangValue !== "2") {
        params.status = parseInt(tinhTrangValue);
    }
    if (searchValue) {
        params.search = searchValue;
    }
    if (timeStartValue) {
        params.dateStart = timeStartValue;
    }
    if (timeEndValue) {
        params.dateEnd = timeEndValue;
    }

    try {
        const ordersData = await ApiService.fetchAdminOrders(params);
        showOrder(ordersData);
         if (ordersData.pagination && typeof setupAdminPagination === 'function') {
            setupAdminPagination(ordersData.pagination.totalItems, adminPerPage, ordersData.pagination.currentPage, 'order', params);
        }
    } catch (error) {
        console.error("Error finding orders:", error);
        if (typeof toast === 'function') toast({ title: "Lỗi", message: "Tìm kiếm đơn hàng thất bại.", type: "error" });
        const showOrderEl = document.getElementById("showOrder");
        if (showOrderEl) showOrderEl.innerHTML = `<tr><td colspan="6" style="text-align:center;">Lỗi tải đơn hàng.</td></tr>`;
    }
}

async function cancelSearchOrder(){
    const tinhTrangEl = document.getElementById("tinh-trang");
    const searchOrderEl = document.getElementById("form-search-order");
    const timeStartEl = document.getElementById("time-start");
    const timeEndEl = document.getElementById("time-end");

    if(tinhTrangEl) tinhTrangEl.value = "2";
    if(searchOrderEl) searchOrderEl.value = "";
    if(timeStartEl) timeStartEl.value = "";
    if(timeEndEl) timeEndEl.value = "";
    adminCurrentPage = 1;
    await findOrder();
}

async function thongKe(sortMode, externalFilters = {}) {
    let categoryTkValueEl = document.getElementById("the-loai-tk");
    let searchValueEl = document.getElementById("form-search-tk");
    let timeStartValueEl = document.getElementById("time-start-tk");
    let timeEndValueEl = document.getElementById("time-end-tk");

    let categoryTkValue = categoryTkValueEl ? categoryTkValueEl.value : "Tất cả";
    let searchValue = searchValueEl ? searchValueEl.value : "";
    let timeStartValue = timeStartValueEl ? timeStartValueEl.value : "";
    let timeEndValue = timeEndValueEl ? timeEndValueEl.value : "";


    if (timeEndValue && timeStartValue && new Date(timeEndValue) < new Date(timeStartValue)) {
        alert("Ngày kết thúc không thể trước ngày bắt đầu!");
        return;
    }

    const params = {
        sortBy: sortMode,
        ...externalFilters
    };

    if (categoryTkValue && categoryTkValue !== "Tất cả") {
        params.category = categoryTkValue;
    }
    if (searchValue) {
        params.search = searchValue;
    }
    if (timeStartValue) {
        params.dateStart = timeStartValue;
    }
    if (timeEndValue) {
        params.dateEnd = timeEndValue;
    }

     if (sortMode === 0 && Object.keys(externalFilters).length === 0) {
        if(categoryTkValueEl) categoryTkValueEl.value = "Tất cả";
        if(searchValueEl) searchValueEl.value = "";
        if(timeStartValueEl) timeStartValueEl.value = "";
        if(timeEndValueEl) timeEndValueEl.value = "";
        delete params.category;
        delete params.search;
        delete params.dateStart;
        delete params.dateEnd;
        params.sortBy = undefined;
    }

    try {
        const salesReport = await ApiService.fetchAdminSalesReport(params);
        showThongKeTable(salesReport);
        updateThongKeOverview(salesReport);
         if (salesReport.pagination && typeof setupAdminPagination === 'function') {
            setupAdminPagination(salesReport.pagination.totalItems, adminPerPage, salesReport.pagination.currentPage, 'stats', params);
        }
    } catch (error) {
        console.error("Error fetching sales report:", error);
        if (typeof toast === 'function') toast({ title: "Lỗi", message: "Không thể tải dữ liệu thống kê.", type: "error" });
    }
}

function updateThongKeOverview(reportData) {
    if (!reportData) return;
    let totalProductsSoldSet = new Set();
    let totalQuantity = 0;
    let totalRevenue = 0;

    reportData.forEach(item => {
        totalProductsSoldSet.add(item.product_id);
        totalQuantity += parseInt(item.total_quantity_sold);
        totalRevenue += parseFloat(item.total_revenue_from_product);
    });
    const quantityProductEl = document.getElementById("quantity-product");
    const quantityOrderEl = document.getElementById("quantity-order");
    const quantitySaleEl = document.getElementById("quantity-sale");

    if(quantityProductEl) quantityProductEl.innerText = totalProductsSoldSet.size;
    if(quantityOrderEl) quantityOrderEl.innerText = totalQuantity;
    if(quantitySaleEl) quantitySaleEl.innerText = vnd(totalRevenue);
}

function showThongKeTable(reportData) {
    let orderHtml = "";
    const showTkElement = document.getElementById("showTk");
    if (!showTkElement) return;

    if (!reportData || reportData.length === 0) {
        orderHtml = `<tr><td colspan="5" style="text-align:center;">Không có dữ liệu thống kê.</td></tr>`;
    } else {
        reportData.forEach((item, index) => {
            let itemImageUrl = './assets/img/blank-image.png';
            if(item.product_img_url) { // product_img_url là /api/products/image/ID
                 itemImageUrl = BACKEND_URL + item.product_img_url;
            }
            orderHtml += `
            <tr>
            <td>${index + 1}</td>
            <td><div class="prod-img-title"><img class="prd-img-tbl" src="${itemImageUrl}" alt="${item.product_title || 'Sản phẩm'}"><p>${item.product_title || '(Chưa có tên)'}</p></div></td>
            <td>${item.total_quantity_sold}</td>
            <td>${vnd(item.total_revenue_from_product)}</td>
            <td><button class="btn-detail product-order-detail" data-product-id="${item.product_id}"><i class="fa-regular fa-eye"></i> Chi tiết đơn</button></td>
            </tr>
            `;
        });
    }
    showTkElement.innerHTML = orderHtml;

    document.querySelectorAll(".product-order-detail").forEach(btn => {
        btn.onclick = () => {
            const prodId = btn.dataset.productId;
            if (typeof toast === 'function') toast({title: "Thông tin", message: `Chi tiết đơn hàng cho sản phẩm ID ${prodId} (chức năng này cần API riêng).`, type: "info"})
        };
    });
}

let currentEditingUserAccountId = null;

function signUpFormReset() {
    const signupModal = document.querySelector(".modal.signup");
    if (!signupModal) return;
    const fullnameInput = signupModal.querySelector('#fullname');
    if (fullnameInput) fullnameInput.value = "";
    const phoneInput = signupModal.querySelector('#phone');
    if (phoneInput) phoneInput.value = "";
    const passwordInput = signupModal.querySelector('#password');
    if (passwordInput) {
        passwordInput.value = "";
        passwordInput.placeholder = "Nhập mật khẩu";
        passwordInput.disabled = false;
    }
    const userStatusCheckbox = signupModal.querySelector('#user-status');
    if (userStatusCheckbox) userStatusCheckbox.checked = true;
    const nameMsg = signupModal.querySelector('.form-message-name');
    if (nameMsg) nameMsg.innerHTML = '';
    const phoneMsg = signupModal.querySelector('.form-message-phone');
    if (phoneMsg) phoneMsg.innerHTML = '';
    const passMsg = signupModal.querySelector('.form-message-password');
    if (passMsg) passMsg.innerHTML = '';
    currentEditingUserAccountId = null;
}

function openCreateAccount() {
    signUpFormReset();
    const signupModal = document.querySelector(".modal.signup");
    if (!signupModal) return;
    signupModal.classList.add("open");
    signupModal.querySelectorAll(".edit-account-e").forEach(item => item.style.display = "none");
    signupModal.querySelectorAll(".add-account-e").forEach(item => item.style.display = "block");
    const passwordField = signupModal.querySelector('#password');
    if (passwordField) passwordField.disabled = false;
}

async function showUserArr(usersArray) {
    let accountHtml = '';
    const showUserElement = document.getElementById('show-user');
    if (!showUserElement) return;

    if(!usersArray || usersArray.length == 0) {
        accountHtml = `<tr><td colspan="6" style="text-align:center;">Không có khách hàng nào.</td></tr>`;
    } else {
        usersArray.forEach((account, index) => {
            let tinhtrang = account.status == 0 ? `<span class="status-no-complete">Bị khóa</span>` : `<span class="status-complete">Hoạt động</span>`;
            accountHtml += ` <tr>
            <td>${index + 1}</td>
            <td>${account.fullname}</td>
            <td>${account.phone} <br/> <small>${account.email || 'N/A'}</small></td>
            <td>${formatDate(account.join_date)}</td>
            <td>${tinhtrang}</td>
            <td class="control control-table">
            <button class="btn-edit" onclick='editAccount(${account.id})'><i class="fa-light fa-pen-to-square"></i></button>
            <button class="btn-delete" onclick="deleteAccount(${account.id})"><i class="fa-regular fa-trash"></i></button>
            </td>
        </tr>`
        })
    }
    showUserElement.innerHTML = accountHtml;
}

async function showUser(externalFilters = {}) {
    let tinhTrangUserEl = document.getElementById("tinh-trang-user");
    let searchUserEl = document.getElementById("form-search-user");
    let timeStartUserEl = document.getElementById("time-start-user");
    let timeEndUserEl = document.getElementById("time-end-user");

    let tinhTrangValue = tinhTrangUserEl ? tinhTrangUserEl.value : "2";
    let searchValue = searchUserEl ? searchUserEl.value : "";
    let timeStartValue = timeStartUserEl ? timeStartUserEl.value : "";
    let timeEndValue = timeEndUserEl ? timeEndUserEl.value : "";


    if (timeEndValue && timeStartValue && new Date(timeEndValue) < new Date(timeStartValue)) {
        alert("Ngày kết thúc không thể trước ngày bắt đầu!");
        return;
    }
    const params = {
        page: adminCurrentPage,
        limit: adminPerPage,
        userType: 0,
        ...externalFilters
    };

    if (tinhTrangValue && tinhTrangValue !== "2") {
        params.status = parseInt(tinhTrangValue);
    }
    if (searchValue) {
        params.search = searchValue;
    }
    if (timeStartValue) {
        params.dateStart = timeStartValue;
    }
    if (timeEndValue) {
        params.dateEnd = timeEndValue;
    }

    try {
        const usersData = await ApiService.fetchAdminUsers(params);
        showUserArr(usersData); // Giả sử API trả về mảng trực tiếp
        if (usersData && usersData.length !== undefined && typeof setupAdminPagination === 'function') { // Đơn giản hóa, nếu là mảng thì dùng length
             setupAdminPagination(usersData.length, adminPerPage, adminCurrentPage, 'user', params);
        }
    } catch (error) {
        console.error("Error fetching users:", error);
        if (typeof toast === 'function') toast({ title: "Lỗi", message: "Không thể tải danh sách khách hàng.", type: "error" });
        const showUserEl = document.getElementById('show-user');
        if(showUserEl) showUserEl.innerHTML = `<tr><td colspan="6" style="text-align:center;">Lỗi tải dữ liệu.</td></tr>`;
    }
}

async function cancelSearchUser() {
    const tinhTrangUserEl = document.getElementById("tinh-trang-user");
    const searchUserEl = document.getElementById("form-search-user");
    const timeStartUserEl = document.getElementById("time-start-user");
    const timeEndUserEl = document.getElementById("time-end-user");

    if(tinhTrangUserEl) tinhTrangUserEl.value = "2";
    if(searchUserEl) searchUserEl.value = "";
    if(timeStartUserEl) timeStartUserEl.value = "";
    if(timeEndUserEl) timeEndUserEl.value = "";
    adminCurrentPage = 1;
    await showUser();
}

async function deleteAccount(userId) {
    if (confirm("Bạn có chắc muốn xóa khách hàng này? Hành động này không thể hoàn tác.")) {
        try {
            await ApiService.deleteUserByAdmin(userId);
            if (typeof toast === 'function') toast({ title: 'Thành công', message: 'Khách hàng đã được xóa.', type: 'success' });
            await showUser({page: adminCurrentPage});
        } catch (error) {
            console.error("Error deleting user:", error);
            if (typeof toast === 'function') toast({ title: 'Lỗi', message: error.data?.message || 'Không thể xóa khách hàng.', type: 'error' });
        }
    }
}

async function editAccount(userId) {
    try {
        const user = await ApiService.fetchAdminUserById(userId);
        if (!user) {
            if (typeof toast === 'function') toast({title: "Lỗi", message: "Không tìm thấy người dùng.", type: "error"});
            return;
        }
        currentEditingUserAccountId = userId;
        signUpFormReset();

        const signupModal = document.querySelector(".modal.signup");
        if (!signupModal) return;

        signupModal.classList.add("open");
        signupModal.querySelectorAll(".add-account-e").forEach(item => item.style.display = "none");
        signupModal.querySelectorAll(".edit-account-e").forEach(item => item.style.display = "block");

        const passwordField = signupModal.querySelector('#password');
        if (passwordField) {
             passwordField.value = "";
             passwordField.placeholder = "Để trống nếu không đổi mật khẩu";
             passwordField.disabled = false;
        }

        const fullnameInput = signupModal.querySelector('#fullname');
        if (fullnameInput) fullnameInput.value = user.fullname;
        const phoneInput = signupModal.querySelector('#phone');
        if (phoneInput) phoneInput.value = user.phone;
        const userStatusCheckbox = signupModal.querySelector('#user-status');
        if (userStatusCheckbox) userStatusCheckbox.checked = user.status === 1;

    } catch (error) {
        console.error("Error fetching user for edit:", error);
        if (typeof toast === 'function') toast({title: "Lỗi", message: "Không thể tải thông tin khách hàng.", type: "error"});
    }
}

const btnUpdateAccount = document.getElementById("btn-update-account");
if (btnUpdateAccount) {
    btnUpdateAccount.addEventListener("click", async (e) => {
        e.preventDefault();
        if (!currentEditingUserAccountId) {
            if (typeof toast === 'function') toast({ title: 'Lỗi', message: 'Không có khách hàng nào được chọn để sửa.', type: 'warning' });
            return;
        }
        const signupModal = document.querySelector(".modal.signup");
        if (!signupModal) return;

        const fullname = signupModal.querySelector('#fullname').value;
        const phone = signupModal.querySelector('#phone').value;
        const password = signupModal.querySelector('#password').value;
        const status = signupModal.querySelector('#user-status').checked ? 1 : 0;

        let isValid = true;
        const nameMsg = signupModal.querySelector('.form-message-name');
        const phoneMsg = signupModal.querySelector('.form-message-phone');
        const passMsg = signupModal.querySelector('.form-message-password');

        if (!fullname) { if(nameMsg) nameMsg.innerHTML = 'Họ tên không được trống.'; isValid = false; }
        else { if(nameMsg) nameMsg.innerHTML = '';}

        if (!phone) { if(phoneMsg) phoneMsg.innerHTML = 'SĐT không được trống.'; isValid = false; }
        else if (phone.length !== 10 || !/^\d+$/.test(phone)) { if(phoneMsg) phoneMsg.innerHTML = 'SĐT không hợp lệ.'; isValid = false; }
        else { if(phoneMsg) phoneMsg.innerHTML = '';}

        if (password && password.length < 6) { if(passMsg) passMsg.innerHTML = 'Mật khẩu mới phải ít nhất 6 ký tự.'; isValid = false; }
        else { if(passMsg) passMsg.innerHTML = '';}

        if (!isValid) return;

        const userData = { fullname, phone, status, user_type: 0 };
        if (password) { userData.password = password; }

        try {
            await ApiService.updateUserByAdmin(currentEditingUserAccountId, userData);
            if (typeof toast === 'function') toast({ title: 'Thành công', message: 'Thông tin khách hàng đã được cập nhật.', type: 'success' });
            signupModal.classList.remove("open");
            signUpFormReset();
            await showUser({page: adminCurrentPage});
        } catch (error) {
            console.error("Error updating user by admin:", error);
            if (typeof toast === 'function') toast({ title: 'Lỗi', message: error.data?.message || 'Cập nhật thất bại.', type: 'error' });
        }
    });
}

const addAccountButtonInModal = document.querySelector('.modal.signup #signup-button');
if (addAccountButtonInModal) {
    addAccountButtonInModal.addEventListener("click", async (e) => {
        e.preventDefault();
        const signupModal = document.querySelector(".modal.signup");
        if (!signupModal) return;

        const fullNameUser = signupModal.querySelector('#fullname').value;
        const phoneUser = signupModal.querySelector('#phone').value;
        const passwordUser = signupModal.querySelector('#password').value;

        let isValid = true;
        const formMessageName = signupModal.querySelector('.form-message-name');
        const formMessagePhone = signupModal.querySelector('.form-message-phone');
        const formMessagePassword = signupModal.querySelector('.form-message-password');

        if (!fullNameUser) { if(formMessageName) formMessageName.innerHTML = 'Vui lòng nhập họ và tên.'; isValid = false; }
        else if (fullNameUser.length < 3) { if(formMessageName) formMessageName.innerHTML = 'Họ tên phải ít nhất 3 ký tự.'; isValid = false; }
        else { if(formMessageName) formMessageName.innerHTML = ''; }

        if (!phoneUser) { if(formMessagePhone) formMessagePhone.innerHTML = 'Vui lòng nhập số điện thoại.'; isValid = false; }
        else if (phoneUser.length !== 10 || !/^\d+$/.test(phoneUser)) { if(formMessagePhone) formMessagePhone.innerHTML = 'Số điện thoại không hợp lệ (10 số).'; isValid = false; }
        else { if(formMessagePhone) formMessagePhone.innerHTML = ''; }

        if (!passwordUser) { if(formMessagePassword) formMessagePassword.innerHTML = 'Vui lòng nhập mật khẩu.'; isValid = false; }
        else if (passwordUser.length < 6) { if(formMessagePassword) formMessagePassword.innerHTML = 'Mật khẩu phải ít nhất 6 ký tự.'; isValid = false; }
        else { if(formMessagePassword) formMessagePassword.innerHTML = ''; }

        if (!isValid) return;

        try {
            const newUser = { fullname: fullNameUser, phone: phoneUser, password: passwordUser, user_type: 0, status: 1 };
            await ApiService.createUserByAdmin(newUser);
            if (typeof toast === 'function') toast({ title: 'Thành công', message: 'Tạo khách hàng mới thành công!', type: 'success' });
            signupModal.classList.remove("open");
            signUpFormReset();
            adminCurrentPage = 1;
            await showUser();
        } catch (error) {
            console.error("Error creating user by admin:", error);
            if (typeof toast === 'function') toast({ title: 'Lỗi', message: error.data?.message || 'Tạo khách hàng thất bại.', type: 'error' });
        }
    });
}

const logoutAccButton = document.getElementById("logout-acc");
if (logoutAccButton) {
    logoutAccButton.addEventListener('click', (e) => {
        e.preventDefault();
        ApiService.logoutUser();
    });
}


document.addEventListener('DOMContentLoaded', async () => {
    const isAdminLoggedIn = await checkLogin();
    if (isAdminLoggedIn) {
        await loadDashboardStats();
        await showProduct();
        await findOrder();
        await thongKe(0);
        await showUser();
        if(typeof testDisplaySingleImage === "function"){
             testDisplaySingleImage();
        }
    }
});