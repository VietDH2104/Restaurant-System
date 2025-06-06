const PHIVANCHUYEN = 30000; // This could be fetched from backend settings in a real app
let priceFinal = document.getElementById("checkout-cart-price-final");

// Function to convert to VND, ensure it's available or define it
// function vnd(price) { ... } // Assuming it's globally available from main.js

// Trang thanh toan
async function thanhtoanpage(option, productDetails) {
    const currentUser = ApiService.getCurrentUser();
    if (!currentUser) {
        toast({ title: 'Lỗi', message: 'Vui lòng đăng nhập để thanh toán.', type: 'error' });
        closecheckout();
        if (typeof loginbtn !== 'undefined' && loginbtn.click) {
            loginbtn.click();
        }
        return;
    }

    // Populate user info fields
    try {
        const userProfile = await ApiService.fetchUserProfile();
        document.getElementById('tennguoinhan').value = userProfile.fullname || '';
        document.getElementById('sdtnhan').value = userProfile.phone || '';
        document.getElementById('diachinhan').value = userProfile.address || '';
    } catch (error) {
        console.warn("Could not prefill user info:", error);
    }

    // Handle delivery date selection
    let today = new Date();
    let ngaymai = new Date();
    let ngaykia = new Date();
    ngaymai.setDate(today.getDate() + 1);
    ngaykia.setDate(today.getDate() + 2);
    let dateorderhtml = `
        <a href="javascript:;" class="pick-date active" data-date="${today.toISOString().split('T')[0]}">
            <span class="text">Hôm nay</span>
            <span class="date">${today.getDate()}/${today.getMonth() + 1}</span>
        </a>
        <a href="javascript:;" class="pick-date" data-date="${ngaymai.toISOString().split('T')[0]}">
            <span class="text">Ngày mai</span>
            <span class="date">${ngaymai.getDate()}/${ngaymai.getMonth() + 1}</span>
        </a>
        <a href="javascript:;" class="pick-date" data-date="${ngaykia.toISOString().split('T')[0]}">
            <span class="text">Ngày kia</span>
            <span class="date">${ngaykia.getDate()}/${ngaykia.getMonth() + 1}</span>
        </a>`;
    document.querySelector('.date-order').innerHTML = dateorderhtml;
    let pickdate = document.getElementsByClassName('pick-date');
    for (let i = 0; i < pickdate.length; i++) {
        pickdate[i].onclick = function () {
            const activeDateElement = document.querySelector(".pick-date.active");
            if (activeDateElement) {
                activeDateElement.classList.remove("active");
            }
            this.classList.add('active');
        };
    }

    let totalBillOrder = document.querySelector('.total-bill-order');
    let totalBillOrderHtml;
    let currentCartForCheckout = [];
    let calculatedSubtotal = 0;
    let itemCount = 0;

    // Handle order items
    if (option === 1) { // Cart checkout
        try {
            const cart = await ApiService.fetchCart();
            if (cart.length === 0) {
                toast({ title: "Giỏ hàng trống", message: "Vui lòng thêm sản phẩm vào giỏ hàng.", type: "warning" });
                closecheckout();
                return;
            }
            
            currentCartForCheckout = cart.map(item => ({
                product_id: item.product_id,
                quantity: item.quantity,
                price_at_purchase: item.price,
                item_notes: item.note,
                title: item.title
            }));
            
            showProductCartCheckout(cart);
            // Fetch cart total
            const totalResponse = await ApiService.getCartTotal();
            console.log("getCartTotal response:", totalResponse); // Debug
            // Handle different response formats
            calculatedSubtotal = typeof totalResponse === 'object' && totalResponse.total !== undefined 
                ? parseFloat(totalResponse.total) 
                : parseFloat(totalResponse) || 0;
            if (isNaN(calculatedSubtotal) || calculatedSubtotal < 0) {
                console.error("Invalid cart total:", calculatedSubtotal);
                calculatedSubtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                console.log("Fallback calculatedSubtotal:", calculatedSubtotal); // Debug
            }
            itemCount = await ApiService.getCartItemCount();
            console.log("Cart checkout - Subtotal:", calculatedSubtotal, "Item count:", itemCount); // Debug
        } catch (error) {
            console.error("Error fetching cart:", error);
            toast({ title: 'Error', message: 'Lỗi tải giỏ hàng', type: 'error' });
            return;
        }
    } else if (option === 2 && productDetails) { // Buy now
        currentCartForCheckout = [{
            product_id: productDetails.id,
            quantity: productDetails.soluong,
            price_at_purchase: productDetails.price,
            item_notes: productDetails.note,
            title: productDetails.title
        }];
        showProductBuyNowCheckout(productDetails);
        calculatedSubtotal = productDetails.soluong * productDetails.price;
        itemCount = productDetails.soluong;
        console.log("Buy now - Subtotal:", calculatedSubtotal, "Item count:", itemCount); // Debug
    } else {
        toast({ title: "Lỗi", message: "Không có sản phẩm để thanh toán.", type: "error" });
        closecheckout();
        return;
    }

    // Function to update total price display
    const updateTotalPrice = (subtotal, includeShipping) => {
        const shippingFee = includeShipping ? PHIVANCHUYEN : 0;
        console.log("Updating total price: Subtotal =", subtotal, "Shipping =", shippingFee, "Total =", subtotal + shippingFee); // Debug
        priceFinal.innerText = vnd(subtotal + shippingFee);
    };

    // Update total price display (default: Giao tận nơi)
    totalBillOrderHtml = `
        <div class="priceFlx">
            <div class="text">
                Tiền hàng
                <span class="count">${itemCount} món</span>
            </div>
            <div class="price-detail">
                <span id="checkout-cart-total">${vnd(calculatedSubtotal)}</span>
            </div>
        </div>
        <div class="priceFlx chk-ship">
            <div class="text">Phí vận chuyển</div>
            <div class="price-detail chk-free-ship">
                <span>${vnd(PHIVANCHUYEN)}</span>
            </div>
        </div>`;
    totalBillOrder.innerHTML = totalBillOrderHtml;
    updateTotalPrice(calculatedSubtotal, true); // Include shipping by default

    // Handle delivery type
    let giaotannoi = document.querySelector('#giaotannoi');
    let tudenlay = document.querySelector('#tudenlay');
    let tudenlayGroup = document.querySelector('#tudenlay-group');
    let chkShipElements = document.querySelectorAll(".chk-ship");

    // Default state: Giao tận nơi
    tudenlayGroup.style.display = "none";
    chkShipElements.forEach(item => {
        item.style.display = "flex";
    });
    document.getElementById('diachinhan').classList.remove('hidden-field');

    // Remove existing event listeners to prevent duplicates
    const giaotannoiClone = giaotannoi.cloneNode(true);
    const tudenlayClone = tudenlay.cloneNode(true);
    giaotannoi.parentNode.replaceChild(giaotannoiClone, giaotannoi);
    tudenlay.parentNode.replaceChild(tudenlayClone, tudenlay);
    giaotannoi = giaotannoiClone;
    tudenlay = tudenlayClone;

    tudenlay.addEventListener('click', () => {
        giaotannoi.classList.remove("active");
        tudenlay.classList.add("active");
        chkShipElements.forEach(item => {
            item.style.display = "none";
        });
        tudenlayGroup.style.display = "block";
        document.getElementById('diachinhan').classList.add('hidden-field');
        console.log("Pickup selected - Subtotal:", calculatedSubtotal); // Debug
        updateTotalPrice(calculatedSubtotal, false); // Exclude shipping
    });

    giaotannoi.addEventListener('click', () => {
        tudenlay.classList.remove("active");
        giaotannoi.classList.add("active");
        tudenlayGroup.style.display = "none";
        chkShipElements.forEach(item => {
            item.style.display = "flex";
        });
        document.getElementById('diachinhan').classList.remove('hidden-field');
        console.log("Delivery selected - Subtotal:", calculatedSubtotal, "Total with shipping:", calculatedSubtotal + PHIVANCHUYEN); // Debug
        updateTotalPrice(calculatedSubtotal, true); // Include shipping
    });

    // Handle order submission
    document.querySelector(".complete-checkout-btn").onclick = async () => {
        await xulyDathang(currentCartForCheckout, calculatedSubtotal);
    };
}

// Hien thi hang trong gio cho trang checkout
function showProductCartCheckout(checkoutCart) {
    let listOrder = document.getElementById("list-order-checkout");
    let listOrderHtml = '';
    checkoutCart.forEach(item => {
        listOrderHtml += `<div class="food-total">
        <div class="count">${item.quantity}x</div>
        <div class="info-food">
            <div class="name-food">${item.title}</div>
            ${item.item_notes ? `<div class="food-note-checkout">Ghi chú: ${item.item_notes}</div>` : ''}
        </div>
    </div>`
    })
    listOrder.innerHTML = listOrderHtml;
}

// Hien thi hang mua ngay cho trang checkout
function showProductBuyNowCheckout(product) {
    let listOrder = document.getElementById("list-order-checkout");
    let listOrderHtml = `<div class="food-total">
        <div class="count">${product.soluong}x</div>
        <div class="info-food">
            <div class="name-food">${product.title}</div>
             ${product.note ? `<div class="food-note-checkout">Ghi chú: ${product.note}</div>` : ''}
        </div>
    </div>`;
    listOrder.innerHTML = listOrderHtml;
}

//Open Page Checkout
let nutthanhtoan = document.querySelector('.thanh-toan')
let checkoutpage = document.querySelector('.checkout-page');
nutthanhtoan.addEventListener('click', async () => {
    if (!ApiService.isUserLoggedIn()) {
        toast({ title: 'Yêu cầu đăng nhập', message: 'Vui lòng đăng nhập để tiến hành thanh toán.', type: 'warning' });
        if (typeof loginbtn !== 'undefined' && loginbtn.click) {
            loginbtn.click();
        }
        return;
    }

    try {
        const cart = await ApiService.fetchCart();
        if (cart.length === 0) {
            toast({ title: 'Giỏ hàng trống', message: 'Vui lòng thêm sản phẩm vào giỏ hàng trước khi thanh toán.', type: 'info' });
            return;
        }

        checkoutpage.classList.add('active');
        await thanhtoanpage(1);
        if (typeof closeCart === 'function') closeCart();
        if (typeof body !== 'undefined') body.style.overflow = "hidden";
    } catch (error) {
        console.error("Error fetching cart:", error);
        toast({ title: 'Error', message: 'Lỗi tải giỏ hàng', type: 'error' });
    }
});

// Đặt hàng ngay from product detail
function dathangngay() {
    let productInfoElement = document.getElementById("product-detail-content");
    if (!productInfoElement) return;

    let datHangNgayBtn = productInfoElement.querySelector(".button-dathangngay");
    if (!datHangNgayBtn) return;

    datHangNgayBtn.onclick = async () => {
        if(!ApiService.isUserLoggedIn()) {
            toast({ title: 'Warning', message: 'Chưa đăng nhập tài khoản !', type: 'warning', duration: 3000 });
             if (typeof loginbtn !== 'undefined' && loginbtn.click) loginbtn.click();
            return;
        }
        const productId = datHangNgayBtn.getAttribute("data-product-id");
        const soluong = parseInt(productInfoElement.querySelector(".buttons_added .input-qty").value);
        const notevalue = productInfoElement.querySelector("#popup-detail-note").value;
        const ghichu = notevalue == "" ? "Không có ghi chú" : notevalue;

        try {
            const productFromApi = await ApiService.fetchProductById(productId);
            if (!productFromApi) {
                 toast({ title: 'Lỗi', message: 'Sản phẩm không tồn tại.', type: 'error'});
                 return;
            }

            const productForCheckout = {
                id: productFromApi.id,
                title: productFromApi.title,
                price: productFromApi.price,
                soluong: soluong,
                note: ghichu
            };
            checkoutpage.classList.add('active');
            await thanhtoanpage(2, productForCheckout);
            if (typeof closeModal === 'function') closeModal(); // Close product detail modal from main.js
            if (typeof body !== 'undefined') body.style.overflow = "hidden";
        } catch (error) {
            console.error("Error in dathangngay:", error);
            toast({ title: 'Lỗi', message: 'Không thể xử lý mua ngay.', type: 'error'});
        }
    }
}


// Close Page Checkout
function closecheckout() {
    checkoutpage.classList.remove('active');
    if (typeof body !== 'undefined') body.style.overflow = "auto";
}

// Thong tin cac don hang da mua - Xu ly khi nhan nut dat hang
async function xulyDathang(itemsToCheckout, subtotal) {
    let diachinhan = "";
    let hinhthucgiao = "";
    let thoigiangiao = "";
    let shippingFee = 0;
    const currentUser = await ApiService.getCurrentUser();

    if (!currentUser) {
        toast({ title: 'Error', message: 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.', type: 'error' });
        return;
    }

    const giaotantoi = document.querySelector("#giaotannoi");
    const tudenlay = document.querySelector("#tudenlay");

    if (giaotantoi.classList.contains("active")) {
        diachinhan = document.querySelector("#diachinhan").value;
        hinhthucgiao = giaotantoi.innerText.trim();
        shippingFee = PHIVANCHUYEN;
        if (!diachinhan) {
            toast({ title: 'Chú ý', message: 'Vui lòng nhập địa chỉ nhận hàng!', type: 'warning' });
            document.querySelector("#diachinhan").focus();
            return;
        }
    } else if (tudenlay.classList.contains("active")) {
        const chinhanh1 = document.querySelector("#chinhanh-1");
        const chinhanh2 = document.querySelector("#chinhanh-2");
        if (chinhanh1.checked) {
            diachinhan = chinhanh1.nextElementSibling.innerText.trim();
        } else if (chinhanh2.checked) {
            diachinhan = chinhanh2.nextElementSibling.innerText.trim();
        } else {
            toast({ title: 'Chú ý', message: 'Vui lòng chọn chi nhánh lấy hàng!', type: 'warning' });
            return;
        }
        hinhthucgiao = tudenlay.innerText.trim();
        shippingFee = 0;
    } else {
        toast({ title: 'Chú ý', message: 'Vui lòng chọn hình thức giao nhận!', type: 'warning' });
        return;
    }

    const giaongayCheckbox = document.querySelector("#giaongay");
    const giaovaogioCheckbox = document.querySelector("#deliverytime");

    if (giaotantoi.classList.contains("active")) {
        if (giaongayCheckbox.checked) {
            thoigiangiao = "Giao ngay khi xong";
        } else if (giaovaogioCheckbox.checked) {
            thoigiangiao = document.querySelector(".choise-time").value;
        } else {
            toast({ title: 'Chú ý', message: 'Vui lòng chọn thời gian giao hàng!', type: 'warning' });
            return;
        }
    }

    const tennguoinhan = document.querySelector("#tennguoinhan").value;
    const sdtnhan = document.querySelector("#sdtnhan").value;

    if (!tennguoinhan || !sdtnhan) {
        toast({ title: 'Chú ý', message: 'Vui lòng nhập đầy đủ thông tin người nhận!', type: 'warning' });
        return;
    }
    if (sdtnhan.length !== 10 || !/^\d+$/.test(sdtnhan)) {
        toast({ title: 'Chú ý', message: 'Số điện thoại nhận hàng không hợp lệ!', type: 'warning' });
        document.querySelector("#sdtnhan").focus();
        return;
    }

    const activeDateElement = document.querySelector(".pick-date.active");
    if (!activeDateElement) {
        toast({ title: 'Chú ý', message: 'Vui lòng chọn ngày giao hàng!', type: 'warning' });
        return;
    }
    const deliveryDate = activeDateElement.getAttribute("data-date");

    const orderPayload = {
        customer_name: tennguoinhan,
        customer_phone: sdtnhan,
        delivery_address: diachinhan,
        delivery_type: hinhthucgiao,
        delivery_date: deliveryDate,
        delivery_time_slot: giaotantoi.classList.contains("active") ? (giaongayCheckbox.checked ? "Giao ngay" : thoigiangiao) : null,
        notes: document.querySelector(".note-order").value || "",
        items: itemsToCheckout,
        subtotal: subtotal,
        shipping_fee: shippingFee,
        total: subtotal + shippingFee
    };

    console.log("Order Payload:", orderPayload);

    try {
        const createdOrder = await ApiService.createOrder(orderPayload);
        toast({ title: 'Thành công', message: `Đặt hàng thành công! Mã đơn hàng: ${createdOrder.orderId}`, type: 'success', duration: 4000 });

        // Clear server-side cart for cart-based orders
        if (itemsToCheckout.length > 0 && currentUser && currentUser.id) {
            await ApiService.clearCart();
            // Clear client-side cart
            localStorage.removeItem(`UserCart_${currentUser.id}`);
            // Reset cart UI
            const cartList = document.querySelector('.cart-list');
            if (cartList) cartList.innerHTML = '';
            const cartCount = document.querySelector('.count-product-cart');
            if (cartCount) cartCount.innerText = '0';
            const cartTotal = document.querySelector('.cart-total-price .text-price');
            if (cartTotal) cartTotal.innerText = '0đ';
            const gioHangTrong = document.querySelector('.gio-hang-trong');
            if (gioHangTrong) gioHangTrong.style.display = 'block';
            const thanhToanBtn = document.querySelector('.thanh-toan');
            if (thanhToanBtn) thanhToanBtn.classList.add('disabled');
            // Update cart amount
            if (typeof updateAmount === 'function') await updateAmount();
            if (typeof renderCart === 'function') await renderCart();
        }

        setTimeout(() => {
            closecheckout();
            if (typeof orderHistory === 'function') {
                orderHistory();
            } else {
                window.location.href = '/';
            }
        }, 2000);
    } catch (error) {
        console.error("Error creating order:", error);
        toast({ title: 'Error', message: error.data?.message || 'Đặt hàng thất bại. Vui lòng thử lại.', type: 'error', duration: 4000 });
    }
}

// Assuming global functions from main.js are available:
// vnd(), getCartTotal(), getAmountCart(), loginbtn, closeModal(), body, toast()
// And ApiService is globally available.