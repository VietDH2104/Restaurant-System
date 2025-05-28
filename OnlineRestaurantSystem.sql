ALTER USER 'ur0lt9v6cz8jejzp'@'bionncrs1ulmhyjsdsud-mysql.services.clever-cloud.com' WITH MAX_USER_CONNECTIONS 20; -- Hoặc một số cao hơn
FLUSH PRIVILEGES;
CREATE DATABASE IF NOT EXISTS bionncrs1ulmhyjsdsud CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE bionncrs1ulmhyjsdsud;
select * from users;
select * from orders;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fullname VARCHAR(255) NOT NULL,
    phone VARCHAR(15) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL, -- Sẽ lưu trữ hash
    email VARCHAR(255) UNIQUE,
    address TEXT,
    status BOOLEAN DEFAULT TRUE, -- 1 = active, 0 = locked/inactive
    join_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    user_type TINYINT DEFAULT 0, -- 0 = customer, 1 = admin
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    img_url VARCHAR(512), -- Đường dẫn tới ảnh
    category VARCHAR(100),
    price DECIMAL(10, 0) NOT NULL, -- Sửa thành DECIMAL(10,0) vì giá của bạn là số nguyên
    description TEXT,
    status BOOLEAN DEFAULT TRUE, -- 1 = active/available, 0 = deleted/unavailable
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(50) PRIMARY KEY,
    user_phone VARCHAR(15),
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(15) NOT NULL,
    delivery_address TEXT NOT NULL,
    delivery_type VARCHAR(100),
    delivery_date DATE,
    delivery_time_slot VARCHAR(100),
    notes TEXT,
    order_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    total_amount DECIMAL(12, 0) NOT NULL, -- Sửa thành DECIMAL(12,0)
    status TINYINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    -- FOREIGN KEY (user_phone) REFERENCES users(phone) ON DELETE SET NULL ON UPDATE CASCADE -- Cân nhắc thêm khóa ngoại
);

CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    price_at_purchase DECIMAL(10, 0) NOT NULL, -- Sửa thành DECIMAL(10,0)
    item_notes TEXT,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT ON UPDATE CASCADE -- Hoặc SET NULL nếu sản phẩm có thể bị xóa mà vẫn muốn giữ đơn hàng
);

CREATE TABLE refresh_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(500) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX idx_refresh_token_user_id ON refresh_tokens(user_id);

INSERT INTO users (fullname, phone, password, user_type, status, email, address)
VALUES ('Admin', '0938719116', 'leminhtuan123', 1, TRUE, 'admin@ẽample.com', '28/1a')
ON DUPLICATE KEY UPDATE fullname = VALUES(fullname), password = VALUES(password), user_type = VALUES(user_type), status = VALUES(status), email = VALUES(email), address = VALUES(address);

INSERT INTO products (title, img_url, category, price, description, status) VALUES
('Nấm đùi gà xào cháy tỏi', './assets/img/products/nam-dui-ga-chay-toi.jpeg', 'Món mặn', 200000, 'Một Món chay ngon miệng với nấm đùi gà thái chân hương, xào săn với lửa và thật nhiều tỏi băm, nêm nếm với mắm và nước tương chay, món ngon đưa cơm và rất dễ ăn cả cho người lớn và trẻ nhỏ.', TRUE),
('Rau xào ngũ sắc', './assets/img/products/rau-xao-ngu-sac.png', 'Món mặn', 180000, 'Rau củ quả theo mùa tươi mới xào với nước mắm chay, gia vị để giữ được hương vị ngọt tươi nguyên thủy của rau củ, một món nhiều vitamin và chất khoáng, rất dễ ăn.', TRUE),
('Bánh lava phô mai nướng', './assets/img/products/banh_lava_pho_mai_nuong.jpeg', 'Món mặn', 180000, 'Rau củ quả theo mùa tươi mới xào với nước mắm chay, gia vị để giữ được hương vị ngọt tươi nguyên thủy của rau củ, một món nhiều vitamin và chất khoáng, rất dễ ăn.', TRUE),
('Set lẩu thái Tomyum', './assets/img/products/lau_thai.jpg', 'Món mặn', 699000, 'Lẩu Thái là món ăn xuất phát từ món canh chua Tom yum nổi tiếng của Thái Lan. Nước lẩu có hương vị chua chua cay cay đặc trưng. Các món nhúng lẩu gồn thịt bò, hải sản, rau xanh và các loại nấm.', TRUE),
('Cơm chiên cua', './assets/img/products/com_chien_cua.png', 'Món mặn', 280000, 'Cơm nấu từ gạo ST25 dẻo, hạt cơm tơi ngon, thịt cua tươi chắc nịch, bếp đảo cho săn hạt cơm, rồi đổ cua đã xào thơm vào, xúc miếng cơm chiên cua đầy đặn có thêm hành phi giòn rụm, món ngon như vậy đảm bảo tranh nhau đến miếng cuối cùng.', TRUE),
('Súp bào ngư hải sâm (1 phần)', './assets/img/products/sup-bao-ngu-hai-sam.jpeg', 'Món mặn', 540000, 'Súp bào ngư Bếp Hoa có bào ngư kết hợp cùng sò điệp, tôm tươi... được hầm trong nhiều giờ với rau củ & nấm đông trùng tạo ra vị ngọt tự nhiên hiếm thấy. Một món ăn khiến cả người ốm cũng thấy ngon miệng đó ạ.', TRUE),
('Tai cuộn lưỡi', './assets/img/products/tai-cuon-luoi.jpeg', 'Món mặn', 340000, 'Tai heo được cuộn bên trong cùng phần thịt lưỡi heo. Phần tai bên ngoài giòn dai, phần thịt lưỡi bên trong vẫn mềm, có độ ngọt tự nhiên của thịt. Tai cuộn lưỡi được chấm với nước mắm và tiêu đen.', TRUE),
('Xíu mại tôm thịt 10 viên', './assets/img/products/xiu_mai_tom_thit_10_vien.jpg', 'Món mặn', 140000, 'Quý khách hấp chín trước khi ăn. Những miếng há cảo, sủi cảo, hoành thánh với phần nhân tôm, sò điệp, hải sản tươi ngon hay nhân thịt heo thơm ngậy chắc chắn sẽ khiến bất kỳ ai thưởng thức đều cảm thấy rất ngon miệng.', TRUE),
('Trà phô mai kem sữa', './assets/img/products/tra-pho-mai-kem-sua.jpg', 'Nước uống', 34000, 'Món Nước uống vừa béo ngậy, chua ngọt đủ cả mà vẫn có vị thanh của trà.', TRUE),
('Trà đào chanh sả', './assets/img/products/tra-dao-chanh-sa.jpg', 'Nước uống', 25000, 'Trà đào chanh sả có vị đậm ngọt thanh của đào, vị chua chua dịu nhẹ của chanh và hương thơm của sả.', TRUE),
('Bánh chuối nướng', './assets/img/products/banh-chuoi-nuong.jpeg', 'Món tráng miệng', 60000, 'Bánh chuối nướng béo ngậy mùi nước cốt dừa cùng miếng chuối mềm ngon sẽ là Món tráng miệng phù hợp với mọi người.', TRUE),
('Há cảo sò điệp (10 viên)', './assets/img/products/ha_cao.jpg', 'Món mặn', 140000, 'Những miếng há cảo, sủi cảo, hoành thánh với phần nhân tôm, sò điệp, hải sản tươi ngon hay nhân thịt heo thơm ngậy chắc chắn sẽ khiến bất kỳ ai thưởng thức đều cảm thấy rất ngon miệng.', TRUE),
('Chả rươi (100gr)', './assets/img/products/thit_nuong.jpg', 'Món mặn', 60000, 'Chả rươi luôn mang đến hương vị khác biệt và "gây thương nhớ" hơn hẳn so với các loại chả khác. Rươi béo càng ăn càng thấy ngậy. Thịt thơm quyện mùi thì là và vỏ quýt rất đặc sắc. Chắc chắn sẽ là một món ăn rất hao cơm', TRUE),
('Nộm gà Hội An (1 phần)', './assets/img/products/nom_ga_hoi_an.png', 'Món mặn', 60000, 'Nộm gà làm từ thịt gà ri thả đồi. Thịt gà ngọt, săn được nêm nếm vừa miệng, bóp thấu với các loại rau tạo thành món nộm thơm ngon, đậm đà, giải ngán hiệu quả.', TRUE),
('Set bún cá (1 set 5 bát)', './assets/img/products/set_bun_ca.jpg', 'Món mặn', 60000, 'Bún cá được làm đặc biệt hơn với cá trắm lọc xương và chiên giòn, miếng cá nhúng vào nước dùng ăn vẫn giòn dai, thơm ngon vô cùng.', TRUE),
('Bún cá (1 phần)', './assets/img/products/set_bun_ca.jpg', 'Món mặn', 60000, 'Bún cá được làm đặc biệt hơn với cá trắm lọc xương và chiên giòn, miếng cá nhúng vào nước dùng ăn vẫn giòn dai, thơm ngon vô cùng', TRUE),
('Xôi trắng hành phi (1 phần)', './assets/img/products/bun_ca_hanh_phi.jpeg', 'Món mặn', 60000, 'Bún cá được làm đặc biệt hơn với cá trắm lọc xương và chiên giòn, miếng cá nhúng vào nước dùng ăn vẫn giòn dai, thơm ngon vô cùng', TRUE),
('Tôm sú lột rang thịt (1 phần)', './assets/img/products/tom_su_luot_ran_thit.png', 'Món mặn', 60000, 'Tôm sú tươi rim với thịt. rim kỹ, vừa lửa nên thịt và tôm săn lại, ngấm vị, càng ăn càng thấy ngon.', TRUE),
('Bánh cookie dừa', './assets/img/products/banh_cookie_dua.jpeg', 'Món mặn', 130000, 'Bánh cookie dừa ngọt vừa miệng, dừa bào tươi nhào bánh nướng giòn tan, cắn vào thơm lừng, giòn rụm', TRUE),
('Cá chiên giòn sốt mắm Thái', './assets/img/products/sot_mam_thai.jpeg', 'Món mặn', 130000, 'Bánh cookie dừa ngọt vừa miệng, dừa bào tươi nhào bánh nướng giòn tan, cắn vào thơm lừng, giòn rụm', TRUE),
('Tôm sú rang muối (1 suất)', './assets/img/products/tom-su-rang-muoi.jpeg', 'Món mặn', 550000, 'Từng chú tôm sú được chọn lựa kĩ càng mỗi ngày, đảm bảo là tôm tươi sống, vẫn còn đang bơi khỏe. Tôm rang muối vừa đậm đà lại vẫn giữ được vị ngọt tự nhiên của tôm sú.', TRUE),
('Tôm sú rang bơ tỏi (1 suất)', './assets/img/products/tom-su-rang-bo-toi.jpeg', 'Món mặn', 550000, 'Tôm được chiên vàng giòn bên ngoài, bên trong thịt tôm vẫn mềm, kết hợp cùng sốt bơ tỏi thơm nức . Tôm tươi được Bếp Hoa chiên theo bí quyết riêng nên phần thịt tôm bên trong sẽ có hương vị thơm ngon đặc biệt, sốt bơ tỏi béo ngậy hấp dẫn. Ăn kèm bánh mỳ rất hợp', TRUE),
('Combo Vịt quay và gỏi vịt', './assets/img/products/combo-vitquay-va-goivit.jpeg', 'Món mặn', 510000, 'Combo vịt quay Bếp Hoa + gỏi vịt bắp cải size đại cực kỳ thích hợp cho những bữa ăn cần nhiều rau, nhiều đạm mà vẫn đảm bảo ngon miệng. Vịt quay chuẩn Macao giòn da thấm thịt, thêm phần gỏi vịt chua chua ngọt ngọt, rau tươi giòn ăn chống ngán, cân bằng dinh dưỡng.', TRUE),
('Set cá cơm tầm', './assets/img/products/set_ca_tam.jpg', 'Món mặn', 950000, 'Một 1 set với 3 món ngon mỹ mãn đủ 4 người ăn no, bếp trưởng tự tay chọn từng con cá tầm tươi đủ chất lượng để chế biến đủ 3 món gỏi, nướng, canh chua 10 điểm cho chất lượng.', TRUE),
('Chả ốc 1 phần', './assets/img/products/cha_oc_1_phan.jpeg', 'Món mặn', 350000, 'Chả ốc với ốc giòn tan, băm rối, trộn với thịt, lá lốt, rau thơm, nêm nếm vừa ăn và viên tròn, chiên cho giòn ngoài mềm trong. Ăn chả ốc kẹp với rau sống và chấm mắm chua ngọt cực kỳ đưa vị.', TRUE),
('Gà ủ muối thảo mộc (1 con)', './assets/img/products/ga-u-muoi-thao-moc.png', 'Món mặn', 450000, 'Gà ủ muối tuyển chọn từ gà ri tươi, ủ muối chín tới với gia vị thảo mộc tự nhiên, da gà mỏng, thịt chắc ngọt.', TRUE),
('Gà không lối thoát (1 con)', './assets/img/products/ga-khong-loi-thoat.png', 'Món mặn', 520000, 'Gà mái ghẹ size 1.4kg sơ chế sạch sẽ, tẩm ướp gia vị đậm đà, bọc vào trong xôi dẻo từ nếp cái hoa vàng, chiên cho giòn mặt ngoài. Khi ăn cắt phần xôi là gà thơm ngon nghi ngút khói, thịt gà ngấm mềm thơm, miếng xôi ngọt tự nhiên từ thịt gà ăn cực kỳ hấp dẫn.', TRUE),
('Cá chiên giòn mắm Thái (1 con)', './assets/img/products/ca-chien-gion-mam-thai.jpeg', 'Món mặn', 350000, 'Cá tươi bếp làm sạch, lạng đôi, ướp cho ngấm và chiên vàng giòn. Thịt cá bên trong óng ánh nước, mềm ngọt, bên ngoài giòn tan hấp dẫn. Thêm sốt mắm Thái đầu bếp làm công thức riêng, vị mắm chua ngọt cay the cực kỳ hợp với cá giòn nóng hổi.', TRUE),
('Chân giò chiên giòn mắm Thái', './assets/img/products/chan-gio-chien-gion-mam-thai.jpeg', 'Món mặn', 420000, 'Chân giò lợn đen chọn loại ngon, tỉ lệ nạc mỡ đều đặn, bếp xâm bì cẩn thận và ướp thật ngon, chiên vàng giòn nổi bóng, khi ăn chấm mắm chua ngọt cay cay cực kỳ ngon miệng.', TRUE),
('Chả cốm (500gr)', './assets/img/products/cha-com.png', 'Món mặn', 175000, 'Cốm mộc làng Vòng hạt dẹt dẻo và thơm đặc biệt, thịt lợn tươi phải chọn phần thịt vai xay vừa mềm lại không bở, trộn đều với cốm, nêm với mắm ngon, gia vị đơn giản và quật hỗn hợp thịt xay và cốm đến khi nào thật chắc và dẻo. Viên mỗi bánh chả phải đều tay, hấp sơ qua cho thành hình, khi ăn mới chiên vàng. Chả cốm khi cắn vào phải giòn và lại thật mềm, tứa nước trong miệng. Cốm dẻo dẻo cuộn trong thịt thơm ngon lạ kỳ.', TRUE),
('Vịt om sấu (1 hộp)', './assets/img/products/vit-om-sau.jpeg', 'Món mặn', 350000, '[Mỗi phần có 1,2kg thịt vịt]. Vịt om sấu với thịt vịt mềm thơm, nấu với trái sấu, sả cây, ớt tươi cho ra phần nước om chua thanh và rất thơm. Dùng vịt om sấu với rau mùi tàu, rau thơm và bún rất ngon.', TRUE),
('Giò xào (1kg)', './assets/img/products/gio-xao.jpeg', 'Món mặn', 460000, 'Giò xào Bếp Hoa đặc biệt được xào khô, ép chặt để tạo độ giòn. Nguyên liệu chính được làm từ tai và lưỡi heo. Khi ăn giò xào, bạn sẽ cảm nhận từng miếng giò vừa giòn vừa thơm lừng mùi tiêu đen và nước mắm.', TRUE),
('Nem tai (1 hộp)', './assets/img/products/nem-tai.jpeg', 'Món mặn', 200000, 'Nem tai giòn sần sật, trộn với thính gạo rang thơm, ăn kèm lá sung bùi bùi, chấm tương ớt hoặc nước chấm đặc điệt, công thức chỉ riêng Bếp Hoa có.', TRUE),
('Canh dưa bò hầm (1 hộp)', './assets/img/products/canh-dua-bo-ham.jpeg', 'Món mặn', 270000, 'Canh dưa chua hầm nhừ với thịt nạm bò và gân bò. Thơm - ngon - ngọt - béo - chua dịu thanh thanh', TRUE),
('Nạc nọng heo nướng kèm xôi trắng (500gr)', './assets/img/products/nac-nong-heo-nuong-kem-xoi-trang.jpeg', 'Món mặn', 300000, 'Nọng heo - phần thịt ngon nhất trên thủ heo, với những dải thịt nạc mỡ đan xen, mỗi thủ chỉ có được 1-2kg thịt nọng ngon mềm như vậy. Bếp trưởng Bếp Hoa tẩm ướp thật ngấm gia vị, nướng thẳng trên than hoa thơm nức, xém cạnh đẹp mắt. Miếng thịt nướng xong gắp khỏi vỉ vẫn thấy mỡ thơm còn sôi trên dải thịt, để thịt nghỉ vài phút khi thái ra óng ánh nước, gắp miếng thịt chấm với nước sốt siêu ngon độc quyền của Bếp, ngon đến tứa nước miếng, tranh nhau gắp sạch đĩa', TRUE),
('Thịt quay (400gr)', './assets/img/products/thit-quay.jpeg', 'Món mặn', 280000, 'Thịt lợn quay thơm mùi lá mắc mật. Ngoài bì giòn rụm, thịt bên trong mềm, hương vị đậm đà. Đặc biệt, bếp có loại sốt chấm thịt được pha bằng công thức riêng biệt chỉ Bếp Hoa mới có.Hướng dẫn sử dụng: Sử dụng ngay trong ngày. Bảo quản trong tủ mát.', TRUE),
('Khâu nhục', './assets/img/products/khau-nhuc.jpeg', 'Món mặn', 280000, 'Khâu nhục - món ăn cầu kỳ mang phong vị phương Bắc. Làm từ thịt lợn ta, khâu khục được hấp cách thủy trong 6 tiếng cùng với rất nhiều loại gia vị. Thịt mềm nhừ, ngọt vị, phần bì trong và dẻo quẹo. Mỡ ngậy ngậy tan chảy ngay khi vừa đưa lên miệng. Hướng dẫn bảo quản: Hâm nóng lại bằng nồi hấp cách thủy hoặc lò vi sóng. Bảo quản trong tủ mát từ 3-5 ngày.', TRUE),
('Xíu mại tôm thịt ( 10 viên)', './assets/img/products/ha_cao_tom_thit.jpg', 'Món mặn', 140000, 'Những miếng há cảo, sủi cảo, hoành thánh với phần nhân tôm, sò điệp, hải sản tươi ngon hay nhân thịt heo thơm ngậy chắc chắn sẽ khiến bất kỳ ai thưởng thức đều cảm thấy rất ngon miệng.', TRUE),
('Chè hương cốm lá dứa', './assets/img/products/che-com-la-dua.jpeg', 'Món tráng miệng', 60000, 'Chè cốm hương lá dứa dẻo thơm, ngọt dịu, từng hạt cốm thoảng thoảng đâu đó hương lá dứa mát lành', TRUE),
('Bánh bông lan chanh dây', './assets/img/products/banh-bong-lan-chanh-day.jpeg', 'Món tráng miệng', 50000, 'Bánh bông lan chanh dây với vị chua nhẹ, không bị ngọt gắt hẳn sẽ là sự lựa chọn hoàn hảo', TRUE),
('Chè bưởi', './assets/img/products/che-buoi.jpeg', 'Món tráng miệng', 50000, 'Chè bưởi rất dễ ăn bởi hương vị ngọt mát, thơm ngon, vị bùi bùi của đậu xanh, giòn sần sật của cùi bưởi mà không hề bị đắng', TRUE),
('Set lẩu Thái tomyum', './assets/img/products/lau-thai-tomyum.jpeg', 'Món lẩu', 699000, 'Lẩu Thái là món ăn xuất phát từ món canh chua Tom yum nổi tiếng của Thái Lan. Nước lẩu có hương vị chua chua cay cay đặc trưng. Các món nhúng lẩu gồn thịt bò, hải sản, rau xanh và các loại nấm.', TRUE),
('Set lẩu Thái nấm chay', './assets/img/products/lau-thai-nam-chay.png', 'Món lẩu', 550000, 'Một set lẩu Thái nấm chay với nước dùng 100% từ rau củ quả tự nhiên, thêm sả cây tươi, riềng miếng, ớt, nước dừa để lên được vị nước lẩu Thái chuẩn vị. Đồ nhúng đa dạng với nhiều loại nấm khác nhau, rau tươi giòn, đậu phụ mềm xốp, váng đậu amla chiên giòn. Kèm bún tươi ăn rất hợp.', TRUE),
('Đậu hũ xào nấm chay', './assets/img/products/dau-hu-xao-nam-chay.png', 'Món chay', 220000, 'Món xào thanh nhẹ ngọt lịm từ rau củ và nấm tươi, thêm chút đậu phụ chiên thái miếng, nêm nếm đậm đà. Ăn kèm cơm trắng hay làm bún trộn rau củ cũng rất hợp.', TRUE),
('Bún trộn chay (1 suất)', './assets/img/products/bun-tron-chay.png', 'Món chay', 75000, 'Bún trộn chay tưởng là quen mà ăn ngon lạ miệng. Với bún tươi được trộn với nước tương và sốt ớt đặc biệt, mắm chay thơm, thêm rau củ tươi, rau thơm bắt vị, nấm xào săn, đậu phụ thái lát, một món thanh nhẹ thích hợp ăn trưa hoặc để dành cho anh chị eat-clean bữa tối.', TRUE),
('Bún riêu chay (1 suất)', './assets/img/products/bun-rieu-chay.png', 'Món chay', 75000, 'Bún riêu chay với phần gạch cua chay từ đậu phụ non mềm đánh với sốt màu thơm ngon. Nước dùng thanh nhẹ từ rau củ quả, được nấu lên vị đậm đà rất ngon miệng. Một phần bún riêu kèm với gạch cua là giò chay, đậu phụ rán, rau sống ngọt giòn và tương ớt chay sánh ngon.', TRUE),
('Miến xào rau củ chay', './assets/img/products/mien-xao-rau-cu-chay.png', 'Món chay', 170000, 'Sợi miến khoai lang bếp ngâm cho mềm, xào kèm rau củ quả tươi theo mùa, nêm cùng nước tương và dầu mè, một món xào chay vừa mát lành lại thơm ngon.', TRUE),
('Cuốn nấm chay (10 cuốn)', './assets/img/products/cuon-nam-chay.png', 'Món chay', 120000, 'Nấm tươi làm chín cuộn với bánh phở và rau bào, thêm đậu phụ chiên giòn thái chân hương đưa vị, chấm mắm chua ngọt chay bếp trưởng pha chế, một món ngon làm món khai vị rất hợp.', TRUE),
('Xôi xéo', './assets/img/products/xoi-xeo.png', 'Món chay', 80000, 'Xôi xéo đậu xanh bếp dùng nếp cái hoa vàng hạt mẩy, ngâm với nước nghệ và đồ 2 lần cho hạt nếp chín mềm và thơm, đậu xanh sên mịn cắt tơi trộn cùng xôi, khi ăn rắc hành phi đưa vị, rất hấp dẫn.', TRUE),
('Chả quế chay', './assets/img/products/cha-que-chay.png', 'Món chay', 70000, '', TRUE),
('Nem chay', './assets/img/products/nem-chay.png', 'Món chay', 160000, 'Nem chay thơm ngon, thanh thuần bếp trưởng sử dụng rau củ bào tươi, đậu xanh, khoai môn, miến, mộc nhĩ và nấm hương, tất cả xào thơm cho lên vị, sau đó cuộn với bánh đa nem mỏng, chiên giòn vỏ, chấm mắm chua ngọt chay ăn kèm rau thơm rất hấp dẫn.', TRUE),
('Bánh tráng trộn', './assets/img/products/banh-trang-tron.jpg', 'Món ăn vặt', 20000, 'Bánh tráng trộn là món ăn ngon không chỉ nổi danh đất Sài Thành mà ngay khi xuất hiện tại Hà Nội, nó cũng đã trở thành món ăn “hot trend” rất được giới trẻ yêu thích. ', TRUE),
('Bánh tráng nướng', './assets/img/products/banh-trang-nuong.jpg', 'Món ăn vặt', 10000, 'Khác với món bánh tráng trộn, bánh tráng nướng được phết một lớp trứng chút lên bề mặt bánh tráng cùng thịt băm, mỡ hành, nướng đến khi có màu vàng ruộm. ', TRUE),
('Ốc thập cẩm (1 suất)', './assets/img/products/oc-thap-cam.jpg', 'Món ăn vặt', 50000, 'Được chế biến đủ các món ốc ngon khác nhau, như: ốc hấp, ốc luộc, ốc xào, ốc bỏ lò,.. với đủ các gia vị như tỏi, hành, ớt, tiêu, rau răm,…', TRUE),
('Cơm cháy chà bông', './assets/img/products/com-chay-cha-bong.jpg', 'Món ăn vặt', 60000, 'Cơm cháy chà bông có thể bảo quản cả tháng mà ăn vẫn ngon và đóng gói rất tiện.', TRUE),
('Phá lấu (1 suất)', './assets/img/products/pha-lau.jpg', 'Món ăn vặt', 99000, 'Cứ mỗi lần hỏi “Ăn gì ở Sài Gòn ngon, rẻ ?” là người ta nhớ ngay món phá lấu.', TRUE),
('Bột chiên (1 suất)', './assets/img/products/bot-chien.jpg', 'Món ăn vặt', 49000, 'Cùng với nước chấm đặc biệt, bột chiên để lại hương vị khó tả cho thực khách sau khi thưởng thức.', TRUE),
('Gỏi khô bò (1 suất)', './assets/img/products/goi-bo-kho.jpg', 'Món ăn vặt', 60000, 'Thơm ngon đến từng sợi bò.', TRUE),
('Hoành thánh tôm (10 viên)', './assets/img/products/hoanh_thanh.jpg', 'Món mặn', 130000, 'Những miếng há cảo, sủi cảo, hoành thánh với phần nhân tôm, sò điệp, hải sản tươi ngon hay nhân thịt heo thơm ngậy chắc chắn sẽ khiến bất kỳ ai thưởng thức đều cảm thấy rất ngon miệng.', TRUE),
('Nước ép dâu tây', './assets/img/products/nuoc-ep-dau-tay.jpg', 'Nước uống', 100000, 'Dâu tây ăn nguyên quả ngon ngọt, có cả quả dôn dốt chua, màu đỏ mọng trông cực yêu. Không chỉ ngon miệng mà đồ uống từ dâu tây còn có công dụng bảo vệ sức khỏe, sáng mắt, đẹp da, thon gọn vóc dáng. Làm giảm nguy cơ mắc bệnh về mỡ máu, chống viêm,…', TRUE);

DELETE FROM users WHERE phone = '0938719116';
SELECT 'Database setup and data insertion complete.' AS Status;

-- Updated cart table with img_url VARCHAR(512)
CREATE TABLE IF NOT EXISTS cart (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    title VARCHAR(255) NOT NULL,
    img_url VARCHAR(512),
    quantity INT NOT NULL,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);