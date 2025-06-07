function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Doi sang dinh dang tien VND
function vnd(price) {
    if (typeof price !== 'number') {
        price = parseFloat(price) || 0;
    }
    return price.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
}

// Close popup
const body = document.querySelector("body");
let modalContainer = document.querySelectorAll('.modal');
let modalBox = document.querySelectorAll('.mdl-cnt');
let formLogSign = document.querySelector('.forms');

// Click vùng ngoài sẽ tắt Popup
modalContainer.forEach(item => {
    item.addEventListener('click', closeModal);
});

modalBox.forEach(item => {
    item.addEventListener('click', function (event) {
        event.stopPropagation();
    })
});

function closeModal() {
    modalContainer.forEach(item => {
        item.classList.remove('open');
    });
    body.style.overflow = "auto";
}

function increasingNumber(e) {
    let qty = e.parentNode.querySelector('.input-qty');
    if (parseInt(qty.value) < parseInt(qty.max)) {
        qty.value = parseInt(qty.value) + 1;
    } else {
        qty.value = qty.max;
    }
}

function decreasingNumber(e) {
    let qty = e.parentNode.querySelector('.input-qty');
    if (parseInt(qty.value) > parseInt(qty.min)) {
        qty.value = parseInt(qty.value) - 1;
    } else {
        qty.value = qty.min;
    }
}

//Xem chi tiet san pham
async function detailProduct(productId) {
    try {
        const infoProduct = await ApiService.fetchProductById(productId);
        if (!infoProduct) {
            toast({ title: 'Error', message: 'Sản phẩm không tồn tại!', type: 'error', duration: 3000 });
            return;
        }

        // Determine the correct image URL based on storage location
        const backendBaseUrl = 'https://restaurant-system-1e3p.onrender.com'; // Adjust based on your backend URL
        let imageUrl;
        if (infoProduct.img_url && infoProduct.img_url.startsWith('/uploads/')) {
            // Image is stored in backend /public/uploads
            imageUrl = `${backendBaseUrl}${infoProduct.img_url}`;
        } else {
            // Image is stored in frontend /assets/img/products or use fallback
            imageUrl = infoProduct.img_url || './assets/img/blank-image.png';
        }

        let modal = document.querySelector('.modal.product-detail');
        let modalHtml = `<div class="modal-header">
            <img class="product-image" src="${imageUrl}" alt="">
        </div>
        <div class="modal-body">
            <h2 class="product-title">${infoProduct.title}</h2>
            <div class="product-control">
                <div class="priceBox">
                    <span class="current-price">${vnd(infoProduct.price)}</span>
                </div>
                <div class="buttons_added">
                    <input class="minus is-form" type="button" value="-" onclick="decreasingNumber(this)">
                    <input class="input-qty" max="100" min="1" name="" type="number" value="1">
                    <input class="plus is-form" type="button" value="+" onclick="increasingNumber(this)">
                </div>
            </div>
            <p class="product-description">${infoProduct.description || ''}</p>
        </div>
        <div class="notebox">
            <p class="notebox-title">Ghi chú</p>
            <textarea class="text-note" id="popup-detail-note" placeholder="Nhập thông tin cần lưu ý..."></textarea>
        </div>
        <div class="modal-footer">
            <div class="price-total">
                <span class="thanhtien">Thành tiền</span>
                <span class="price">${vnd(infoProduct.price)}</span>
            </div>
            <div class="modal-footer-control">
                <button class="button-dathangngay" data-product-id="${infoProduct.id}">Đặt hàng ngay</button>
                <button class="button-dat" id="add-cart" onclick="animationCart()"><i class="fa-light fa-basket-shopping"></i></button>
            </div>
        </div>`;
        document.querySelector('#product-detail-content').innerHTML = modalHtml;
        modal.classList.add('open');
        body.style.overflow = "hidden";

        // Update price when quantity changes
        let tgbtn = document.querySelectorAll('.product-detail .is-form');
        let qty = document.querySelector('.product-detail .input-qty');
        let priceText = document.querySelector('.product-detail .price');
        tgbtn.forEach(element => {
            element.addEventListener('click', () => {
                let price = infoProduct.price * parseInt(qty.value);
                priceText.innerHTML = vnd(price);
            });
        });
        qty.addEventListener('input', () => {
            let price = infoProduct.price * parseInt(qty.value);
            priceText.innerHTML = vnd(price);
        });

        // Add product to cart
        let productbtn = document.querySelector('.product-detail .button-dat');
        productbtn.addEventListener('click', (e) => {
            if (ApiService.isUserLoggedIn()) {
                addCart(infoProduct.id, infoProduct.price, infoProduct.title, imageUrl); // Use updated imageUrl
            } else {
                toast({ title: 'Warning', message: 'Chưa đăng nhập tài khoản !', type: 'warning', duration: 3000 });
                loginbtn.click(); // Open login modal
            }
        });
        // Proceed to checkout
        dathangngay();
    } catch (error) {
        console.error("Error fetching product detail:", error);
        toast({ title: 'Error', message: error.message || 'Lỗi tải chi tiết sản phẩm!', type: 'error', duration: 3000 });
    }
}

function animationCart() {
    document.querySelector(".count-product-cart").style.animation = "slidein ease 1s"
    setTimeout(()=>{
        document.querySelector(".count-product-cart").style.animation = "none"
    },1000)
}

async function addCart(productId, productPrice, productTitle, productImg) {
    try {
        const soluong = document.querySelector('.product-detail .input-qty').value;
        const popupDetailNote = document.querySelector('#popup-detail-note').value;
        const note = popupDetailNote === "" ? "Không có ghi chú" : popupDetailNote;

        await ApiService.addToCart({
            product_id: productId,
            quantity: parseInt(soluong),
            price: productPrice,
            title: productTitle,
            img_url: productImg,
            note
        });
        await showCart(); // Refresh cart UI
        updateAmount();
        updateCartTotal();
        closeModal();
        toast({ title: 'Success', message: 'Thêm thành công sản phẩm vào giỏ hàng', type: 'success', duration: 3000 });
    } catch (error) {
        console.error("Error adding to cart:", error);
        toast({ title: 'Error', message: error.data?.message || 'Lỗi thêm vào giỏ hàng', type: 'error', duration: 3000 });
    }
}

async function showCart() {
    try {
        const cart = await ApiService.fetchCart();
        if (cart.length !== 0) {
            document.querySelector('.gio-hang-trong').style.display = 'none';
            document.querySelector('button.thanh-toan').classList.remove('disabled');
            let productcarthtml = '';
            cart.forEach(item => {
                // Map server fields to client-side fields
                const mappedItem = {
                    id: item.id || item.product_id,
                    title: item.title || item.product_title,
                    price: item.price || item.price_at_purchase,
                    quantity: item.quantity || item.quantity_at_purchase,
                    note: item.note || item.item_notes || 'Không có ghi chú',
                    img_url: item.img_url || item.product_img_url
                };
                productcarthtml += `<li class="cart-item" data-id="${mappedItem.id}" data-note="${mappedItem.note}">
                    <div class="cart-item-info">
                        <p class="cart-item-title">${mappedItem.title}</p>
                        <span class="cart-item-price price" data-price="${mappedItem.price}">
                            ${vnd(parseInt(mappedItem.price))}
                        </span>
                    </div>
                    <p class="product-note"><i class="fa-light fa-pencil"></i><span>${mappedItem.note}</span></p>
                    <div class="cart-item-control">
                        <button class="cart-item-delete" onclick="deleteCartItem(${mappedItem.id})">Xóa</button>
                        <div class="buttons_added">
                            <input class="minus is-form" type="button" value="-" onclick="decreasingNumber(this); updateCartItemQuantity(${mappedItem.id}, this)">
                            <input class="input-qty" max="100" min="1" name="" type="number" value="${mappedItem.quantity}" onchange="updateCartItemQuantity(${mappedItem.id}, this)">
                            <input class="plus is-form" type="button" value="+" onclick="increasingNumber(this); updateCartItemQuantity(${mappedItem.id}, this)">
                        </div>
                    </div>
                </li>`;
            });
            document.querySelector('.cart-list').innerHTML = productcarthtml;
            updateCartTotal();
        } else {
            document.querySelector('.cart-list').innerHTML = '';
            document.querySelector('.gio-hang-trong').style.display = 'flex';
            document.querySelector('button.thanh-toan').classList.add('disabled');
        }

        let modalCart = document.querySelector('.modal-cart');
        let containerCart = document.querySelector('.cart-container');
        let themmon = document.querySelector('.them-mon');
        modalCart.onclick = function () {
            closeCart();
        };
        themmon.onclick = function () {
            closeCart();
        };
        containerCart.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    } catch (error) {
        console.error("Error fetching cart:", error);
        toast({ title: 'Error', message: 'Lỗi tải giỏ hàng', type: 'error', duration: 3000 });
    }
}

async function updateCartItemQuantity(itemId, element) {
    const qtyInput = element.closest('.buttons_added').querySelector('.input-qty');
    const newQuantity = parseInt(qtyInput.value);
    const previousQuantity = parseInt(qtyInput.dataset.previous || qtyInput.value); // Store previous value
    qtyInput.dataset.previous = newQuantity; // Update previous value

    try {
        if (newQuantity <= 0) {
            await deleteCartItem(itemId);
        } else {
            await ApiService.updateCartItem(itemId, newQuantity);
            await showCart(); // Refresh cart UI
            updateCartTotal();
            updateAmount();
        }
    } catch (error) {
        console.error("Error updating cart item:", error);
        qtyInput.value = previousQuantity; // Revert to previous quantity
        toast({ 
            title: 'Error', 
            message: 'Lỗi cập nhật giỏ hàng', 
            type: 'error', 
            duration: 3000 
        });
    }
}

async function deleteCartItem(itemId) {
    try {
        await ApiService.removeCartItem(itemId);
        await showCart(); // Refresh cart UI
        updateCartTotal();
        updateAmount();
    } catch (error) {
        console.error("Error deleting cart item:", error);
        toast({ 
            title: 'Error', 
            message: 'Lỗi xóa khỏi giỏ hàng', 
            type: 'error', 
            duration: 3000 
        });
    }
}

async function updateCartTotal() {
    try {
        const response = await ApiService.getCartTotal();
        console.log("getCartTotal response:", response);
        const total = typeof response === 'object' && response.total !== undefined ? response.total : response;
        document.querySelector('.text-price').innerText = vnd(total || 0);
    } catch (error) {
        console.error("Error getting cart total:", error, error.data); // Log detailed error
        document.querySelector('.text-price').innerText = vnd(0);
        toast({ title: 'Error', message: error.data?.message || 'Lỗi tính tổng giá giỏ hàng', type: 'error', duration: 3000 });
    }
}

// Lay tong tien don hang
function getCartTotal() {
    const currentUserInfo = ApiService.getCurrentUser();
    if (!currentUserInfo) return 0;
    const cart = JSON.parse(localStorage.getItem(`UserCart_${currentUserInfo.id}`)) || [];

    let tongtien = 0;
    cart.forEach(item => {
        tongtien += (parseInt(item.soluong) * parseFloat(item.price));
    });
    return tongtien;
}

async function getProductInfoForCart(productId) {
    try {
        const product = await ApiService.fetchProductById(productId);
        return product;
    } catch (error) {
        console.error("Error fetching product for cart:", error);
        return null;
    }
}

// Lay so luong hang
function getAmountCart() {
    const currentUserInfo = ApiService.getCurrentUser();
    if (!currentUserInfo) return 0;
    const cart = JSON.parse(localStorage.getItem(`UserCart_${currentUserInfo.id}`)) || [];

    let amount = 0;
    cart.forEach(element => {
        amount += parseInt(element.soluong);
    });
    return amount;
}

async function updateAmount() {
    if (ApiService.isUserLoggedIn()) {
        try {
            const response = await ApiService.getCartItemCount();
            // Handle both number and object responses
            const count = typeof response === 'object' && response.count !== undefined ? response.count : response;
            document.querySelector('.count-product-cart').innerText = count || 0;
        } catch (error) {
            console.error("Error getting cart count:", error, error.data);
            document.querySelector('.count-product-cart').innerText = 0;
            toast({ title: 'Error', message: error.data?.message || 'Lỗi tính số lượng giỏ hàng', type: 'error', duration: 3000 });
        }
    } else {
        document.querySelector('.count-product-cart').innerText = 0;
    }
}

// Open & Close Cart
function openCart() {
    showCart();
    document.querySelector('.modal-cart').classList.add('open');
    body.style.overflow = "hidden";
}

function closeCart() {
    document.querySelector('.modal-cart').classList.remove('open');
    body.style.overflow = "auto";
    updateAmount();
}

// Open Search Advanced
document.querySelector(".filter-btn").addEventListener("click",(e) => {
    e.preventDefault();
    console.log('Filter button clicked');
    document.querySelector(".advanced-search").classList.toggle("open");
    document.getElementById("home-service").scrollIntoView({behavior: 'smooth'});
})

document.querySelector(".form-search-input").addEventListener("click",(e) => {
    e.preventDefault();
    document.getElementById("home-service").scrollIntoView({behavior: 'smooth'});
})

function closeSearchAdvanced() {
    document.querySelector(".advanced-search").classList.remove("open");
}

//Open Search Mobile
function openSearchMb() {
    document.querySelector(".header-middle-left").style.display = "none";
    document.querySelector(".header-middle-center").style.display = "block";
    document.querySelector(".header-middle-right-item.close").style.display = "block";
    let liItem = document.querySelectorAll(".header-middle-right-item.open");
    for(let i = 0; i < liItem.length; i++) {
        liItem[i].style.setProperty("display", "none", "important")
    }
}

//Close Search Mobile
function closeSearchMb() {
    document.querySelector(".header-middle-left").style.display = "block";
    document.querySelector(".header-middle-center").style.display = "none";
    document.querySelector(".header-middle-right-item.close").style.display = "none";
    let liItem = document.querySelectorAll(".header-middle-right-item.open");
    for(let i = 0; i < liItem.length; i++) {
        liItem[i].style.setProperty("display", "block", "important")
    }
}

//Signup && Login Form
let signup = document.querySelector('.signup-link');
let login = document.querySelector('.login-link');
let modalAuthContainer = document.querySelector('.signup-login .modal-container');
login.addEventListener('click', () => {
    modalAuthContainer.classList.add('active');
})

signup.addEventListener('click', () => {
    modalAuthContainer.classList.remove('active');
})

let signupbtn = document.getElementById('signup');
let loginbtn = document.getElementById('login');
let formsg = document.querySelector('.modal.signup-login')
signupbtn.addEventListener('click', () => {
    formsg.classList.add('open');
    modalAuthContainer.classList.remove('active');
    body.style.overflow = "hidden";
})

loginbtn.addEventListener('click', () => {
    document.querySelector('.form-message-check-login').innerHTML = '';
    formsg.classList.add('open');
    modalAuthContainer.classList.add('active');
    body.style.overflow = "hidden";
})

// Dang nhap & Dang ky
let signupButton = document.getElementById('signup-button');
let loginButton = document.getElementById('login-button');

signupButton.addEventListener('click', async (event) => {
    event.preventDefault();
    let fullNameUser = document.getElementById('fullname').value;
    let phoneUser = document.getElementById('phone').value;
    let passwordUser = document.getElementById('password').value;
    let passwordConfirmation = document.getElementById('password_confirmation').value;
    let checkSignup = document.getElementById('checkbox-signup').checked;

    let isValid = true;
    if (fullNameUser.length === 0) {
        document.querySelector('.form-message-name').innerHTML = 'Vui lòng nhập họ và tên';
        isValid = false;
    } else if (fullNameUser.length < 3) {
        document.querySelector('.form-message-name').innerHTML = 'Họ và tên phải lớn hơn 3 kí tự';
        isValid = false;
    } else {
        document.querySelector('.form-message-name').innerHTML = '';
    }

    if (phoneUser.length === 0) {
        document.querySelector('.form-message-phone').innerHTML = 'Vui lòng nhập số điện thoại';
        isValid = false;
    } else if (phoneUser.length !== 10 || !/^\d+$/.test(phoneUser)) {
        document.querySelector('.form-message-phone').innerHTML = 'Số điện thoại không hợp lệ (10 số)';
        isValid = false;
    } else {
        document.querySelector('.form-message-phone').innerHTML = '';
    }

    if (passwordUser.length === 0) {
        document.querySelector('.form-message-password').innerHTML = 'Vui lòng nhập mật khẩu';
        isValid = false;
    } else if (passwordUser.length < 6) {
        document.querySelector('.form-message-password').innerHTML = 'Mật khẩu phải lớn hơn 6 kí tự';
        isValid = false;
    } else {
        document.querySelector('.form-message-password').innerHTML = '';
    }

    if (passwordConfirmation.length === 0) {
        document.querySelector('.form-message-password-confi').innerHTML = 'Vui lòng nhập lại mật khẩu';
        isValid = false;
    } else if (passwordConfirmation !== passwordUser) {
        document.querySelector('.form-message-password-confi').innerHTML = 'Mật khẩu không khớp';
        isValid = false;
    } else {
        document.querySelector('.form-message-password-confi').innerHTML = '';
    }

    if (!checkSignup) {
        document.querySelector('.form-message-checkbox').innerHTML = 'Vui lòng đồng ý với chính sách';
        isValid = false;
    } else {
        document.querySelector('.form-message-checkbox').innerHTML = '';
    }

    if (!isValid) return;

    try {
        const userData = {
            fullname: fullNameUser,
            phone: phoneUser,
            password: passwordUser,
        };
        const response = await ApiService.registerUser(userData);
        toast({ title: 'Thành công', message: 'Tạo thành công tài khoản!', type: 'success', duration: 3000 });
        closeModal();
        kiemtradangnhap();
        updateAmount();
    } catch (error) {
        console.error("Registration error:", error);
        toast({ title: 'Thất bại', message: error.data?.message || error.message || 'Tài khoản đã tồn tại hoặc có lỗi xảy ra!', type: 'error', duration: 3000 });
    }
});

loginButton.addEventListener('click', async (event) => {
    event.preventDefault();
    let phonelog = document.getElementById('phone-login').value;
    let passlog = document.getElementById('password-login').value;
    let isValid = true;

    if (phonelog.length === 0) {
        document.querySelector('.form-message.phonelog').innerHTML = 'Vui lòng nhập số điện thoại';
        isValid = false;
    } else if (phonelog.length !== 10 || !/^\d+$/.test(phonelog)) {
        document.querySelector('.form-message.phonelog').innerHTML = 'Số điện thoại không hợp lệ (10 số)';
        isValid = false;
    } else {
        document.querySelector('.form-message.phonelog').innerHTML = '';
    }

    if (passlog.length === 0) {
        document.querySelector('.form-message-check-login').innerHTML = 'Vui lòng nhập mật khẩu';
        isValid = false;
    } else { // No client-side length check for login password as per original code
        document.querySelector('.form-message-check-login').innerHTML = '';
    }

    if (!isValid) return;

    try {
        const credentials = { phone: phonelog, password: passlog };
        const response = await ApiService.loginUser(credentials);
        toast({ title: 'Success', message: 'Đăng nhập thành công', type: 'success', duration: 3000 });
        closeModal();
        kiemtradangnhap();
        checkAdmin();
        updateAmount();
    } catch (error) {
        console.error("Login error:", error);
        toast({ title: 'Error', message: error.data?.message || error.message || 'Sai thông tin đăng nhập hoặc tài khoản bị khóa!', type: 'error', duration: 3000 });
    }
});

function kiemtradangnhap() {
    const currentUser = ApiService.getCurrentUser();
    if (currentUser) {
        document.querySelector('.auth-container').innerHTML = `<span class="text-dndk">Tài khoản</span>
            <span class="text-tk">${currentUser.fullname} <i class="fa-sharp fa-solid fa-caret-down"></i></span>`
        document.querySelector('.header-middle-right-menu').innerHTML = `<li><a href="javascript:;" onclick="myAccount()"><i class="fa-light fa-circle-user"></i> Tài khoản của tôi</a></li>
            <li><a href="javascript:;" onclick="orderHistory()"><i class="fa-regular fa-bags-shopping"></i> Đơn hàng đã mua</a></li>
            <li class="border"><a id="logout" href="javascript:;"><i class="fa-light fa-right-from-bracket"></i> Thoát tài khoản</a></li>`
        document.querySelector('#logout').addEventListener('click', logOut)
        checkAdmin();
    } else {
        document.querySelector('.auth-container').innerHTML = `<span class="text-dndk">Đăng nhập / Đăng ký</span>
                                <span class="text-tk">Tài khoản <i class="fa-sharp fa-solid fa-caret-down"></i></span>`;
        document.querySelector('.header-middle-right-menu').innerHTML = `
            <li><a id="login" href="javascript:;"><i class="fa-light fa-right-to-bracket"></i> Đăng nhập</a></li>
            <li><a id="signup" href="javascript:;"><i class="fa-light fa-user-plus"></i> Đăng ký</a></li>`;

        document.getElementById('signup').addEventListener('click', () => {
            formsg.classList.add('open');
            modalAuthContainer.classList.remove('active');
            body.style.overflow = "hidden";
        });
        document.getElementById('login').addEventListener('click', () => {
            document.querySelector('.form-message-check-login').innerHTML = '';
            formsg.classList.add('open');
            modalAuthContainer.classList.add('active');
            body.style.overflow = "hidden";
        });
    }
    updateAmount();
}


function logOut() {
    const currentUserInfo = ApiService.getCurrentUser();
    if (currentUserInfo) {
        localStorage.removeItem(`UserCart_${currentUserInfo.id}`);
    }
    ApiService.logoutUser();
    toast({ title: 'Thông báo', message: 'Đã đăng xuất tài khoản.', type: 'info', duration: 2000 });
    kiemtradangnhap();
}


function checkAdmin() {
    const user = ApiService.getCurrentUser();
    const menu = document.querySelector('.header-middle-right-menu');
    let adminLink = menu.querySelector('a[href="./admin.html"]');

    if(user && user.userType === 1) {
        if (!adminLink) {
            let node = document.createElement(`li`);
            node.innerHTML = `<a href="./admin.html"><i class="fa-light fa-gear"></i> Quản lý cửa hàng</a>`
            menu.prepend(node);
        }
    } else {
        if (adminLink) {
            adminLink.parentElement.remove();
        }
    }
}

async function myAccount() {
    if (!ApiService.isUserLoggedIn()) {
        loginbtn.click(); return;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.getElementById('trangchu').classList.add('hide');
    document.getElementById('order-history').classList.remove('open');
    document.getElementById('account-user').classList.add('open');
    await userInfo();
}

async function orderHistory() {
    if (!ApiService.isUserLoggedIn()) {
        loginbtn.click(); return;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.getElementById('account-user').classList.remove('open');
    document.getElementById('trangchu').classList.add('hide');
    document.getElementById('order-history').classList.add('open');
    await renderOrderProduct();
}

function emailIsValid(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

async function userInfo() {
    try {
        const user = await ApiService.fetchUserProfile();
        document.getElementById('infoname').value = user.fullname || '';
        document.getElementById('infophone').value = user.phone || '';
        document.getElementById('infoemail').value = user.email || '';
        document.getElementById('infoaddress').value = user.address || '';
    } catch (error) {
        console.error("Error fetching user info:", error);
        toast({ title: 'Error', message: 'Không thể tải thông tin tài khoản.', type: 'error', duration: 3000 });
    }
}

async function changeInformation() {
    let infoname = document.getElementById('infoname').value;
    let infoemail = document.getElementById('infoemail').value;
    let infoaddress = document.getElementById('infoaddress').value;
    let isValid = true;

    document.querySelector('.inforemail-error').innerHTML = '';
    if (infoemail && !emailIsValid(infoemail)) {
        document.querySelector('.inforemail-error').innerHTML = 'Email không hợp lệ!';
        isValid = false;
    }
    if (infoname.trim().length <3) {
         toast({ title: 'Warning', message: 'Họ tên phải có ít nhất 3 ký tự.', type: 'warning', duration: 3000 });
         isValid = false;
    }

    if (!isValid) return;

    try {
        const profileData = {
            fullname: infoname,
            email: infoemail,
            address: infoaddress
        };
        await ApiService.updateUserProfile(profileData);
        toast({ title: 'Success', message: 'Cập nhật thông tin thành công!', type: 'success', duration: 3000 });
        kiemtradangnhap();
    } catch (error) {
        console.error("Error updating information:", error);
        toast({ title: 'Error', message: error.data?.message || 'Lỗi cập nhật thông tin.', type: 'error', duration: 3000 });
    }
}

async function changePassword() {
    let passwordCur = document.getElementById('password-cur-info').value;
    let passwordAfter = document.getElementById('password-after-info').value;
    let passwordConfirm = document.getElementById('password-comfirm-info').value;
    let check = true;

    document.querySelector('.password-cur-info-error').innerHTML = '';
    document.querySelector('.password-after-info-error').innerHTML = '';
    document.querySelector('.password-after-comfirm-error').innerHTML = '';

    if (passwordCur.length === 0) {
        document.querySelector('.password-cur-info-error').innerHTML = 'Vui lòng nhập mật khẩu hiện tại';
        check = false;
    }
    if (passwordAfter.length === 0) {
        document.querySelector('.password-after-info-error').innerHTML = 'Vui lòng nhập mật khẩu mới';
        check = false;
    } else if (passwordAfter.length < 6) {
        document.querySelector('.password-after-info-error').innerHTML = 'Mật khẩu mới phải ít nhất 6 kí tự';
        check = false;
    }
    if (passwordConfirm.length === 0) {
        document.querySelector('.password-after-comfirm-error').innerHTML = 'Vui lòng nhập lại mật khẩu mới';
        check = false;
    } else if (passwordAfter !== passwordConfirm) {
        document.querySelector('.password-after-comfirm-error').innerHTML = 'Mật khẩu xác nhận không khớp';
        check = false;
    }
    if (passwordAfter === passwordCur && passwordAfter.length > 0) {
        document.querySelector('.password-after-info-error').innerHTML = 'Mật khẩu mới phải khác mật khẩu cũ.';
        check = false;
    }

    if (!check) return;

    try {
        const passwordData = {
            currentPassword: passwordCur,
            newPassword: passwordAfter
        };
        await ApiService.updateUserPassword(passwordData);
        toast({ title: 'Success', message: 'Đổi mật khẩu thành công!', type: 'success', duration: 3000 });
        document.getElementById('password-cur-info').value = '';
        document.getElementById('password-after-info').value = '';
        document.getElementById('password-comfirm-info').value = '';
    } catch (error) {
        console.error("Error changing password:", error);
        toast({ title: 'Error', message: error.data?.message || 'Lỗi đổi mật khẩu.', type: 'error', duration: 3000 });
        if (error.data?.message && error.data.message.toLowerCase().includes("hiện tại không chính xác")) {
            document.querySelector('.password-cur-info-error').innerHTML = 'Mật khẩu hiện tại không chính xác.';
        }
    }
}

async function renderOrderProduct() {
    try {
        const orders = await ApiService.fetchMyOrders();
        const backendBaseUrl = 'https://restaurant-system-1e3p.onrender.com'; // Backend URL
        let orderHtml = "";
        if (!orders || orders.length === 0) {
            orderHtml = `<div class="empty-order-section"><img src="./assets/img/empty-order.jpg" alt="" class="empty-order-img"><p>Chưa có đơn hàng nào</p></div>`;
        } else {
            orders.forEach(item => {
                let productHtml = `<div class="order-history-group">`;
                if (item.items && item.items.length > 0) {
                    item.items.forEach(sp => {
                        // Determine the correct image URL
                        let imageUrl = sp.product_img_url || './assets/img/blank-image.png';
                        if (sp.product_img_url && sp.product_img_url.startsWith('/uploads/')) {
                            imageUrl = `${backendBaseUrl}${sp.product_img_url}`;
                        }
                        productHtml += `<div class="order-history">
                            <div class="order-history-left">
                                <img src="${imageUrl}" alt="${sp.product_title}">
                                <div class="order-history-info">
                                    <h4>${sp.product_title}</h4>
                                    <p class="order-history-note"><i class="fa-light fa-pen"></i> ${sp.item_notes || 'Không có ghi chú'}</p>
                                    <p class="order-history-quantity">x${sp.quantity}</p>
                                </div>
                            </div>
                            <div class="order-history-right">
                                <div class="order-history-price">
                                    <span class="order-history-current-price">${vnd(sp.price_at_purchase)}</span>
                                </div>
                            </div>
                        </div>`;
                    });
                } else {
                    productHtml += `<p>Đơn hàng này không có chi tiết sản phẩm.</p>`;
                }

                let textCompl = item.status === 1 ? "Đã xử lý" : "Đang xử lý";
                let classCompl = item.status === 1 ? "complete" : "no-complete";
                productHtml += `<div class="order-history-control">
                    <div class="order-history-status">
                        <span class="order-history-status-sp ${classCompl}">${textCompl}</span>
                        <button id="order-history-detail" onclick="detailOrder('${item.id}')"><i class="fa-regular fa-eye"></i> Xem chi tiết</button>
                    </div>
                    <div class="order-history-total">
                        <span class="order-history-total-desc">Tổng tiền: </span>
                        <span class="order-history-toltal-price">${vnd(item.total_amount)}</span>
                    </div>
                </div>`;
                productHtml += `</div>`;
                orderHtml += productHtml;
            });
        }
        document.querySelector(".order-history-section").innerHTML = orderHtml;
    } catch (error) {
        console.error("Error rendering order history:", error);
        toast({ title: 'Error', message: 'Không thể tải lịch sử đơn hàng.', type: 'error', duration: 3000 });
        document.querySelector(".order-history-section").innerHTML = `<div class="empty-order-section"><p>Lỗi tải lịch sử đơn hàng. Vui lòng thử lại.</p></div>`;
    }
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    let dd = date.getDate();
    let mm = date.getMonth() + 1;
    const yyyy = date.getFullYear();

    if (dd < 10) {
        dd = '0' + dd;
    }
    if (mm < 10) {
        mm = '0' + mm;
    }
    return dd + '/' + mm + '/' + yyyy;
}

async function detailOrder(orderId) {
    try {
        const detail = await ApiService.fetchOrderById(orderId);
        const backendBaseUrl = 'https://restaurant-system-1e3p.onrender.com'; // Backend URL
        if (!detail) {
            toast({ title: 'Error', message: 'Không tìm thấy đơn hàng.', type: 'error', duration: 3000 });
            return;
        }
        document.querySelector(".modal.detail-order").classList.add("open");
        body.style.overflow = "hidden";

        let formattedDeliveryDate = formatDate(detail.delivery_date);
        let deliveryInfo = detail.delivery_time_slot ? `${detail.delivery_time_slot} - ${formattedDeliveryDate}` : formattedDeliveryDate;
        if (detail.delivery_type && detail.delivery_type.toLowerCase().includes('giao ngay')) {
            deliveryInfo = `Giao ngay - ${formattedDeliveryDate}`;
        }

        let detailOrderHtml = `<ul class="detail-order-group">
            <li class="detail-order-item">
                <span class="detail-order-item-left"><i class="fa-light fa-hashtag"></i> Mã đơn hàng</span>
                <span class="detail-order-item-right">${detail.id}</span>
            </li>
            <li class="detail-order-item">
                <span class="detail-order-item-left"><i class="fa-light fa-calendar-days"></i> Ngày đặt hàng</span>
                <span class="detail-order-item-right">${formatDate(detail.order_timestamp)}</span>
            </li>
            <li class="detail-order-item">
                <span class="detail-order-item-left"><i class="fa-light fa-truck"></i> Hình thức giao</span>
                <span class="detail-order-item-right">${detail.delivery_type || 'Chưa xác định'}</span>
            </li>
            <li class="detail-order-item">
                <span class="detail-order-item-left"><i class="fa-light fa-clock"></i> Thời gian nhận hàng</span>
                <span class="detail-order-item-right">${deliveryInfo}</span>
            </li>
            <li class="detail-order-item">
                <span class="detail-order-item-left"><i class="fa-light fa-location-dot"></i> Địa điểm nhận</span>
                <span class="detail-order-item-right">${detail.delivery_address}</span>
            </li>
            <li class="detail-order-item">
                <span class="detail-order-item-left"><i class="fa-thin fa-person"></i> Người nhận</span>
                <span class="detail-order-item-right">${detail.customer_name}</span>
            </li>
            <li class="detail-order-item">
                <span class="detail-order-item-left"><i class="fa-light fa-phone"></i> Số điện thoại nhận</span>
                <span class="detail-order-item-right">${detail.customer_phone}</span>
            </li>
            <li class="detail-order-item">
                <span class="detail-order-item-left"><i class="fa-light fa-money-bill"></i> Tổng tiền</span>
                <span class="detail-order-item-right">${vnd(detail.total_amount)}</span>
            </li>
            <li class="detail-order-item">
                <span class="detail-order-item-left"><i class="fa-light fa-circle-info"></i> Trạng thái</span>
                <span class="detail-order-item-right ${detail.status === 1 ? 'status-complete' : 'status-no-complete'}">${detail.status === 1 ? 'Đã xử lý' : 'Đang xử lý'}</span>
            </li>
            <li class="detail-order-item tb">
                <span class="detail-order-item-t"><i class="fa-light fa-note-sticky"></i> Ghi chú đơn hàng</span>
                <p class="detail-order-item-b">${detail.notes || 'Không có ghi chú'}</p>
            </li>
        </ul>`;

        if (detail.items && detail.items.length > 0) {
            detailOrderHtml += `<h4>Chi tiết sản phẩm:</h4><ul class="detail-order-items-list">`;
            detail.items.forEach(pItem => {
                // Determine the correct image URL
                let imageUrl = pItem.product_img_url || './assets/img/blank-image.png';
                if (pItem.product_img_url && pItem.product_img_url.startsWith('/uploads/')) {
                    imageUrl = `${backendBaseUrl}${pItem.product_img_url}`;
                }
                detailOrderHtml += `<li class="detail-order-product-item">
                    <img src="${imageUrl}" alt="${pItem.product_title}" class="detail-order-product-image">
                    <div class="detail-order-product-info">
                        <p><strong>${pItem.product_title}</strong></p>
                        <p>Số lượng: ${pItem.quantity}</p>
                        <p>Đơn giá: ${vnd(pItem.price_at_purchase)}</p>
                        ${pItem.item_notes ? `<p>Ghi chú món: ${pItem.item_notes}</p>` : ''}
                    </div>
                </li>`;
            });
            detailOrderHtml += `</ul>`;
        }

        document.querySelector(".modal.detail-order .detail-order-content").innerHTML = detailOrderHtml;
    } catch (error) {
        console.error("Error fetching order detail for user:", error);
        toast({ title: 'Error', message: 'Không thể tải chi tiết đơn hàng.', type: 'error', duration: 3000 });
    }
}

window.onscroll = () => {
    let backtopTop = document.querySelector(".back-to-top")
    if (document.documentElement.scrollTop > 100) {
        backtopTop.classList.add("active");
    } else {
        backtopTop.classList.remove("active");
    }
}

const headerNav = document.querySelector(".header-bottom");
let lastScrollY = window.scrollY;

window.addEventListener("scroll", () => {
    if(lastScrollY < window.scrollY && window.scrollY > 100) {
        headerNav.classList.add("hide")
    } else {
        headerNav.classList.remove("hide")
    }
    lastScrollY = window.scrollY;
})

let currentProductsCache = [];
async function renderProducts(showProduct) {
  let productHtml = '';
  if (!showProduct || showProduct.length == 0) {
    document.getElementById("home-title").style.display = "none";
    productHtml = `<div class="no-result"><div class="no-result-h">Tìm kiếm không có kết quả</div><div class="no-result-p">Xin lỗi, chúng tôi không thể tìm được kết quả hợp với tìm kiếm của bạn</div><div class="no-result-i"><i class="fa-light fa-face-sad-cry"></i></div></div>`;
  } else {
    document.getElementById("home-title").style.display = "block";
    showProduct.forEach((product) => {
      let imgSrc = product.img_url || './assets/img/blank-image.png';
      if (imgSrc.startsWith('/uploads')) {
        imgSrc = `https://restaurant-system-1e3p.onrender.com${imgSrc}`;
      }
      productHtml += `<div class="col-product">
        <article class="card-product">
          <div class="card-header">
            <a href="javascript:;" class="card-image-link" onclick="detailProduct(${product.id})">
              <img class="card-image" src="${imgSrc}" alt="${product.title}">
            </a>
          </div>
          <div class="food-info">
            <div class="card-content">
              <div class="card-title">
                <a href="javascript:;" class="card-title-link" onclick="detailProduct(${product.id})">${product.title}</a>
              </div>
            </div>
            <div class="card-footer">
              <div class="product-price">
                <span class="current-price">${vnd(product.price)}</span>
              </div>
              <div class="product-buy">
                <button onclick="detailProduct(${product.id})" class="card-button order-item"><i class="fa-regular fa-cart-shopping-fast"></i> Đặt món</button>
              </div>
            </div>
          </div>
        </article>
      </div>`;
    });
  }
  document.getElementById('home-products').innerHTML = productHtml;
}

async function searchProducts(sortOption) {
    console.log('searchProducts called with sortOption:', sortOption);
    let searchInput = document.querySelector('.form-search-input').value.trim();
    let valueCategory = document.getElementById("advanced-search-category-select").value.trim();
    let minPrice = document.getElementById("min-price").value.trim();
    let maxPrice = document.getElementById("max-price").value.trim();

    // Validate price inputs
    let minPriceNum = minPrice ? parseFloat(minPrice) : undefined;
    let maxPriceNum = maxPrice ? parseFloat(maxPrice) : undefined;

    if (minPriceNum !== undefined && maxPriceNum !== undefined && minPriceNum > maxPriceNum) {
        toast({
            title: 'Error',
            message: 'Giá tối thiểu không được lớn hơn giá tối đa.',
            type: 'error',
            duration: 3000
        });
        return;
    }

    if (minPrice && isNaN(minPriceNum)) {
        toast({
            title: 'Error',
            message: 'Giá tối thiểu không hợp lệ.',
            type: 'error',
            duration: 3000
        });
        return;
    }

    if (maxPrice && isNaN(maxPriceNum)) {
        toast({
            title: 'Error',
            message: 'Giá tối đa không hợp lệ.',
            type: 'error',
            duration: 3000
        });
        return;
    }

    // Prepare parameters
    let params = {
        page: 1,
        limit: perPage
    };

    if (searchInput) {
        params.search = searchInput;
        console.log('Search term:', searchInput);
    }

    if (valueCategory && valueCategory !== 'Tất cả') {
        params.category = valueCategory;
    }

    if (!isNaN(minPriceNum)) {
        params.minPrice = minPriceNum;
    }

    if (!isNaN(maxPriceNum)) {
        params.maxPrice = maxPriceNum;
    }

    if (sortOption === 1) {
        params.sortBy = 'price_asc';
    } else if (sortOption === 2) {
        params.sortBy = 'price_desc';
    } else if (sortOption === 0) {
        // Reset filters
        document.querySelector('.form-search-input').value = "";
        document.getElementById("advanced-search-category-select").value = "Tất cả";
        document.getElementById("min-price").value = "";
        document.getElementById("max-price").value = "";
        params = { page: 1, limit: perPage }; // Fetch all products
    }

    currentPage = 1;
    console.log('Search params:', params); // Debug log

    try {
        console.log('Calling fetchAndDisplayProducts with params:', params);
        await fetchAndDisplayProducts(params);
        document.getElementById("home-service").scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        console.error("Search error:", error);
        toast({
            title: 'Error',
            message: 'Không thể tìm kiếm sản phẩm. Vui lòng thử lại.',
            type: 'error',
            duration: 3000
        });
    }
}

let perPage = 12;
let currentPage = 1;
async function fetchAndDisplayProducts(params = {}) {
    console.log('fetchAndDisplayProducts called with params:', params);
    try {
        console.log('Sending API request to fetch products...');
        const { data, pagination } = await ApiService.fetchProducts({
            limit: perPage,
            page: currentPage,
            ...params
        });
        console.log('API response:', { data, pagination });

        currentProductsCache = data;
        if (data.length === 0) {
            document.getElementById("home-title").style.display = "none";
            document.getElementById('home-products').innerHTML = `
                <div class="no-result">
                    <div class="no-result-h">Tìm kiếm không có kết quả</div>
                    <div class="no-result-p">Xin lỗi, chúng tôi không thể tìm được kết quả hợp với tìm kiếm của bạn</div>
                    <div class="no-result-i"><i class="fa-light fa-face-sad-cry"></i></div>
                </div>`;
            document.querySelector('.page-nav-list').innerHTML = '';
        } else {
            await renderProducts(data);
            setupPagination(pagination.totalItems, perPage, pagination.currentPage, params);
        }
    } catch (error) {
        console.error("Error fetching products:", error);
        toast({
            title: 'Error',
            message: error.data?.message || 'Lỗi tải sản phẩm. Vui lòng thử lại.',
            type: 'error',
            duration: 3000
        });
        document.getElementById('home-products').innerHTML = `<p style="text-align:center;">Không thể tải sản phẩm. Vui lòng thử lại.</p>`;
        document.querySelector('.page-nav-list').innerHTML = '';
    }
}

function setupPagination(totalItems, perPage, activePage, currentParams = {}) {
    const pageNavList = document.querySelector('.page-nav-list');
    pageNavList.innerHTML = ''; // Clear existing pagination
    const page_count = Math.ceil(totalItems / perPage);

    for (let i = 1; i <= page_count; i++) {
        let node = document.createElement('li');
        node.classList.add('page-nav-item');
        node.innerHTML = `<a href="javascript:;">${i}</a>`;
        if (activePage === i) {
            node.classList.add('active'); // Set active class for the current page
        }

        node.addEventListener('click', async function () {
            // Remove active class from all pagination items
            document.querySelectorAll('.page-nav-item').forEach(item => item.classList.remove('active'));
            // Add active class to the clicked item
            node.classList.add('active');
            
            currentPage = i; // Update current page
            await fetchAndDisplayProducts({ ...currentParams, page: currentPage });
            document.getElementById("home-title").scrollIntoView({ behavior: 'smooth' });
        });

        pageNavList.appendChild(node);
    }
}

async function showCategory(category) {
    document.getElementById('trangchu').classList.remove('hide');
    document.getElementById('account-user').classList.remove('open');
    document.getElementById('order-history').classList.remove('open');

    currentPage = 1;
    const params = { 
        category: category === "Tất cả" ? undefined : category.trim(), 
        page: currentPage, 
        limit: perPage 
    };
    try {
        await fetchAndDisplayProducts(params);
        document.getElementById("home-title").scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        console.error("Category filter error:", error);
        toast({
            title: 'Error',
            message: 'Lỗi lọc theo danh mục. Vui lòng thử lại.',
            type: 'error',
            duration: 3000
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.querySelector('.form-search-input');
    if (searchInput) {
        searchInput.addEventListener('input', debouncedSearchProducts);
    }
    kiemtradangnhap();
    fetchAndDisplayProducts({ page: currentPage, limit: perPage });
    updateAmount();
});

const debouncedSearchProducts = debounce(() => {
    console.log('Debounced search triggered');
    searchProducts(); 
}, 500);