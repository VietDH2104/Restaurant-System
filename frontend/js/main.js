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

        let modal = document.querySelector('.modal.product-detail');
        let modalHtml = `<div class="modal-header">
        <img class="product-image" src="${infoProduct.img_url || './assets/img/blank-image.png'}" alt="">
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
        //Cap nhat gia tien khi tang so luong san pham
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

        // Them san pham vao gio hang
        let productbtn = document.querySelector('.product-detail .button-dat');
        productbtn.addEventListener('click', (e) => {
            if (ApiService.isUserLoggedIn()) {
                addCart(infoProduct.id, infoProduct.price, infoProduct.title, infoProduct.img_url);
            } else {
                toast({ title: 'Warning', message: 'Chưa đăng nhập tài khoản !', type: 'warning', duration: 3000 });
                loginbtn.click(); // Open login modal
            }
        });
        // Mua ngay san pham
        dathangngay(); // This function is defined in checkout.js, ensure it's loaded or move definition
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

// Them SP vao gio hang
function addCart(productId, productPrice, productTitle, productImg) {
    let currentUserInfo = ApiService.getCurrentUser();
    if (!currentUserInfo) {
        toast({ title: 'Warning', message: 'Vui lòng đăng nhập để thêm vào giỏ hàng!', type: 'warning', duration: 3000 });
        return;
    }

    let cart = JSON.parse(localStorage.getItem(`UserCart_${currentUserInfo.id}`)) || [];

    let soluong = document.querySelector('.product-detail .input-qty').value;
    let popupDetailNote = document.querySelector('#popup-detail-note').value;
    let note = popupDetailNote == "" ? "Không có ghi chú" : popupDetailNote;

    let productInCart = {
        id: productId,
        price: productPrice,
        title: productTitle,
        img_url: productImg,
        soluong: parseInt(soluong),
        note: note
    }

    let vitri = cart.findIndex(item => item.id == productInCart.id && item.note == productInCart.note);
    if (vitri == -1) {
        cart.push(productInCart);
    } else {
        cart[vitri].soluong = parseInt(cart[vitri].soluong) + parseInt(productInCart.soluong);
    }
    localStorage.setItem(`UserCart_${currentUserInfo.id}`, JSON.stringify(cart));
    updateAmount();
    closeModal();
    toast({ title: 'Success', message: 'Thêm thành công sản phẩm vào giỏ hàng', type: 'success', duration: 3000 });
}

//Show gio hang
function showCart() {
    const currentUserInfo = ApiService.getCurrentUser();
    if (currentUserInfo) {
        const cart = JSON.parse(localStorage.getItem(`UserCart_${currentUserInfo.id}`)) || [];
        if (cart.length !== 0) {
            document.querySelector('.gio-hang-trong').style.display = 'none';
            document.querySelector('button.thanh-toan').classList.remove('disabled');
            let productcarthtml = '';
            cart.forEach(item => {
                productcarthtml += `<li class="cart-item" data-id="${item.id}" data-note="${item.note}">
                <div class="cart-item-info">
                    <p class="cart-item-title">
                        ${item.title}
                    </p>
                    <span class="cart-item-price price" data-price="${item.price}">
                    ${vnd(parseInt(item.price))}
                    </span>
                </div>
                <p class="product-note"><i class="fa-light fa-pencil"></i><span>${item.note}</span></p>
                <div class="cart-item-control">
                    <button class="cart-item-delete" onclick="deleteCartItem(${item.id},'${item.note}',this)">Xóa</button>
                    <div class="buttons_added">
                        <input class="minus is-form" type="button" value="-" onclick="decreasingNumber(this); updateCartItemQuantity(${item.id},'${item.note}', this)">
                        <input class="input-qty" max="100" min="1" name="" type="number" value="${item.soluong}" onchange="updateCartItemQuantity(${item.id},'${item.note}', this)">
                        <input class="plus is-form" type="button" value="+" onclick="increasingNumber(this); updateCartItemQuantity(${item.id},'${item.note}', this)">
                    </div>
                </div>
            </li>`
            });
            document.querySelector('.cart-list').innerHTML = productcarthtml;
            updateCartTotal();
        } else {
            document.querySelector('.cart-list').innerHTML = '';
            document.querySelector('.gio-hang-trong').style.display = 'flex';
            document.querySelector('button.thanh-toan').classList.add('disabled');
        }
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
    }
    themmon.onclick = function () {
        closeCart();
    }
    containerCart.addEventListener('click', (e) => {
        e.stopPropagation();
    })
}

function updateCartItemQuantity(productId, productNote, element) {
    const currentUserInfo = ApiService.getCurrentUser();
    if (!currentUserInfo) return;

    let cart = JSON.parse(localStorage.getItem(`UserCart_${currentUserInfo.id}`)) || [];
    const itemIndex = cart.findIndex(item => item.id == productId && item.note == productNote);

    if (itemIndex > -1) {
        const qtyInput = element.closest('.buttons_added').querySelector('.input-qty');
        cart[itemIndex].soluong = parseInt(qtyInput.value);
        if (cart[itemIndex].soluong <= 0) {
            cart.splice(itemIndex, 1);
            showCart();
        } else {
            localStorage.setItem(`UserCart_${currentUserInfo.id}`, JSON.stringify(cart));
        }
    }
    updateCartTotal();
    updateAmount();
}


// Delete cart item
function deleteCartItem(productId, productNote, el) {
    const currentUserInfo = ApiService.getCurrentUser();
    if (!currentUserInfo) return;

    let cart = JSON.parse(localStorage.getItem(`UserCart_${currentUserInfo.id}`)) || [];
    const itemIndex = cart.findIndex(item => item.id == productId && item.note == productNote);

    if (itemIndex > -1) {
        cart.splice(itemIndex, 1);
        localStorage.setItem(`UserCart_${currentUserInfo.id}`, JSON.stringify(cart));
    }

    if (el) {
        let cartParent = el.parentNode.parentNode;
        cartParent.remove();
    }

    if (cart.length == 0) {
        document.querySelector('.gio-hang-trong').style.display = 'flex';
        document.querySelector('button.thanh-toan').classList.add('disabled');
    }
    updateCartTotal();
    updateAmount();
}


//Update cart total
function updateCartTotal() {
    document.querySelector('.text-price').innerText = vnd(getCartTotal());
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

//Update Amount Cart
function updateAmount() {
    if (ApiService.isUserLoggedIn()) {
        let amount = getAmountCart();
        document.querySelector('.count-product-cart').innerText = amount;
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
        let orderHtml = "";
        if (!orders || orders.length === 0) {
            orderHtml = `<div class="empty-order-section"><img src="./assets/img/empty-order.jpg" alt="" class="empty-order-img"><p>Chưa có đơn hàng nào</p></div>`;
        } else {
            orders.forEach(item => {
                let productHtml = `<div class="order-history-group">`;
                if (item.items && item.items.length > 0) {
                    item.items.forEach(sp => {
                        productHtml += `<div class="order-history">
                            <div class="order-history-left">
                                <img src="${sp.product_img_url || './assets/img/blank-image.png'}" alt="${sp.product_title}">
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
                detailOrderHtml += `<li class="detail-order-product-item">
                    <img src="${pItem.product_img_url || './assets/img/blank-image.png'}" alt="${pItem.product_title}" class="detail-order-product-image">
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
    if(!showProduct || showProduct.length == 0) {
        document.getElementById("home-title").style.display = "none";
        productHtml = `<div class="no-result"><div class="no-result-h">Tìm kiếm không có kết quả</div><div class="no-result-p">Xin lỗi, chúng tôi không thể tìm được kết quả hợp với tìm kiếm của bạn</div><div class="no-result-i"><i class="fa-light fa-face-sad-cry"></i></div></div>`;
    } else {
        document.getElementById("home-title").style.display = "block";
        showProduct.forEach((product) => {
            productHtml += `<div class="col-product">
            <article class="card-product" >
                <div class="card-header">
                    <a href="javascript:;" class="card-image-link" onclick="detailProduct(${product.id})">
                    <img class="card-image" src="${product.img_url || './assets/img/blank-image.png'}" alt="${product.title}">
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
    let valeSearchInput = document.querySelector('.form-search-input').value;
    let valueCategory = document.getElementById("advanced-search-category-select").value;
    let minPrice = document.getElementById("min-price").value;
    let maxPrice = document.getElementById("max-price").value;

    if (minPrice && maxPrice && parseFloat(minPrice) > parseFloat(maxPrice)) {
        toast({title: "Lỗi", message: "Giá tối thiểu không thể lớn hơn giá tối đa.", type: "error"});
        return;
    }

    let params = {
        search: valeSearchInput || undefined,
        category: valueCategory === "Tất cả" ? undefined : valueCategory,
        minPrice: minPrice || undefined,
        maxPrice: maxPrice || undefined,
        page: 1,
        limit: perPage
    };

    if (sortOption === 1) params.sortBy = 'price_asc';
    if (sortOption === 2) params.sortBy = 'price_desc';
    if (sortOption === 0) {
        document.querySelector('.form-search-input').value = "";
        document.getElementById("advanced-search-category-select").value = "Tất cả";
        document.getElementById("min-price").value = "";
        document.getElementById("max-price").value = "";
        params = { page: 1, limit: perPage };
    }

    currentPage = 1;
    await fetchAndDisplayProducts(params);
    document.getElementById("home-service").scrollIntoView({behavior: 'smooth'});
}

let perPage = 12;
let currentPage = 1;

async function fetchAndDisplayProducts(params = {}) {
    try {
        const { data, pagination } = await ApiService.fetchProducts({
            limit: perPage,
            page: currentPage,
            ...params
        });
        currentProductsCache = data;
        renderProducts(data);
        setupPagination(pagination.totalItems, perPage, pagination.currentPage, params);
    } catch (error) {
        console.error("Error fetching products:", error);
        toast({ title: 'Error', message: 'Lỗi tải sản phẩm!', type: 'error', duration: 3000 });
        document.getElementById('home-products').innerHTML = `<p style="text-align:center;">Không thể tải sản phẩm. Vui lòng thử lại.</p>`;
        document.querySelector('.page-nav-list').innerHTML = '';
    }
}


function setupPagination(totalItems, perPage, activePage, currentParams = {}) {
    const pageNavList = document.querySelector('.page-nav-list');
    pageNavList.innerHTML = '';
    const page_count = Math.ceil(totalItems / perPage);

    for (let i = 1; i <= page_count; i++) {
        let node = document.createElement(`li`);
        node.classList.add('page-nav-item');
        node.innerHTML = `<a href="javascript:;">${i}</a>`;
        if (activePage === i) node.classList.add('active');

        node.addEventListener('click', async function () {
            currentPage = i;
            await fetchAndDisplayProducts({...currentParams, page: currentPage});

            document.querySelectorAll('.page-nav-item.active').forEach(active => active.classList.remove('active'));
            node.classList.add('active');
            document.getElementById("home-title").scrollIntoView({behavior: 'smooth'});
        });
        pageNavList.appendChild(node);
    }
}

async function showCategory(category) {
    document.getElementById('trangchu').classList.remove('hide');
    document.getElementById('account-user').classList.remove('open');
    document.getElementById('order-history').classList.remove('open');

    currentPage = 1;
    const params = { category: category === "Tất cả" ? undefined : category, page: currentPage, limit: perPage };
    await fetchAndDisplayProducts(params);
    document.getElementById("home-title").scrollIntoView({behavior: 'smooth'});
}

document.addEventListener('DOMContentLoaded', () => {
    kiemtradangnhap();
    fetchAndDisplayProducts({ page: currentPage, limit: perPage });
    updateAmount();
});