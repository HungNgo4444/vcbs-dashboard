# HƯỚNG DẪN QUY TRÌNH UPLOAD DATA & TẠO BÁO CÁO

> Tài liệu dành cho nhân sự phòng Market Research - Hướng dẫn sử dụng hệ thống VCBS Dashboard

## Mục lục

1. [Tổng quan hệ thống](#1-tổng-quan-hệ-thống)
2. [Quy trình Upload Data](#2-quy-trình-upload-data)
3. [Quy trình Tạo Báo cáo Nhận định](#3-quy-trình-tạo-báo-cáo-nhận-định)
4. [Quy trình Tạo Báo cáo Ngành](#4-quy-trình-tạo-báo-cáo-ngành)
5. [Hướng dẫn sử dụng Prompt AI](#5-hướng-dẫn-sử-dụng-prompt-ai)
6. [Xử lý lỗi thường gặp](#6-xử-lý-lỗi-thường-gặp)

---

## 1. Tổng quan hệ thống

### 1.1. Giới thiệu

**VCBS Dashboard** là hệ thống Dashboard phân tích Media Monitoring (theo dõi truyền thông) cho VCBS (Vietcombank Securities). Hệ thống giúp:
- Theo dõi đề cập về VCBS trên báo mạng và mạng xã hội
- Phân tích sentiment (tích cực/tiêu cực) của các bài viết
- Tạo và quản lý báo cáo hàng tháng

### 1.2. Truy cập hệ thống

| Thông tin | Giá trị |
|-----------|---------|
| **URL Production** | https://vcbs-dashboard.vercel.app |
| **Trang Dashboard** | `/dashboard` |
| **Trang Admin Upload** | `/admin/upload` |
| **Trang Quản lý Báo cáo** | `/admin/reports` |
| **Trang Lịch sử Upload** | `/admin/history` |

**Tài khoản Demo:**

| Field | Value |
|-------|-------|
| Email | `user@test.com` hoặc `admin@manhinhcong.com`|
| Password | `test123456@` hoặc `@Manhinhcong1` |

### 1.3. Các loại dữ liệu trong hệ thống

| Loại dữ liệu | Mô tả | Người phụ trách |
|--------------|-------|-----------------|
| **Media Mentions** | Dữ liệu đề cập truyền thông (báo mạng, social media) | Admin |
| **Báo cáo Nhận định** | Báo cáo Social Listening hàng tháng về thương hiệu VCBS | Admin |
| **Báo cáo Ngành** | Báo cáo tổng hợp tin tức ngành chứng khoán | Admin |

### 1.4. Phân quyền

- **Admin**: Upload data, tạo/sửa/xóa báo cáo, xem lịch sử upload
- **User**: Xem dashboard, xem báo cáo, export PDF

### 1.5. Tính năng chính của Dashboard

| Tính năng | Mô tả |
|-----------|-------|
| **Metric Cards** | Tổng đề cập, tương tác, tích cực/tiêu cực, NSR Score |
| **Share of Voice Chart** | Line chart theo dõi xu hướng đề cập/tương tác theo kênh |
| **Channel Distribution** | Donut chart phân bổ theo kênh (Báo mạng, Facebook, Youtube, Tiktok) |
| **Category Chart** | Bar chart xếp hạng categories với rank change |
| **Articles Table** | Danh sách bài viết chi tiết với pagination |
| **Cross-Filter** | Click vào chart để filter dữ liệu (như Power BI) |
| **Monthly Reports** | Xem và export báo cáo PDF |

---

## 2. Quy trình Upload Data

### 2.1. Chuẩn bị file Excel

File Excel cần có đầy đủ các cột sau:

| Cột | Bắt buộc | Mô tả |
|-----|----------|-------|
| `Khách hàng` | Có | Tên thương hiệu (VCBS) |
| `Phương tiện` | Có | Kênh: Báo mạng, Facebook, Youtube, Tiktok |
| `Nguồn phát hành` | Có | Tên báo/page/channel |
| `Ngày phát hành` | Có | Định dạng: DD/MM/YYYY hoặc DD-MM-YYYY |
| `Tiêu đề` | Không | Tiêu đề bài viết (chỉ báo mạng) |
| `Link` | Có | URL bài viết gốc |
| `Nội dung` | Có | Nội dung đầy đủ bài viết |
| `Mức độ nổi bật` | Không | Giá trị: 0.1, 0.5, 1 (chỉ báo mạng) |
| `Giá trị truyền thông` | Không | Số tiền VNĐ (chỉ báo mạng) |
| `Like` | Không | Số lượt like (social media) |
| `Share` | Không | Số lượt share (social media) |
| `Comment` | Không | Số lượt comment (social media) |
| `Tổng tương tác` | Không | Like + Share + Comment |
| `AI_CATEGORY` | Có | Phân loại chủ đề (14 loại) |
| `AI_THELOAINOIDUNG` | Có | Loại nội dung |
| `AI_SACTHAI` | Có | Sentiment: Tích cực, Tiêu cực, Trung tính |
| `AI_NOTE` | Không | Tóm tắt nội dung |

### 2.2. Các bước Upload

```
Bước 1: Đăng nhập với tài khoản Admin
        ↓
Bước 2: Truy cập /admin/upload hoặc click nút "Upload Data" trên Admin Bar
        ↓
Bước 3: Chọn file Excel (.xlsx hoặc .xls)
        ↓
Bước 4: Hệ thống tự động parse và validate dữ liệu
        ↓
Bước 5: Xem preview số lượng record sẽ được import
        ↓
Bước 6: Click "Xác nhận Upload" để hoàn tất
        ↓
Bước 7: Kiểm tra kết quả tại /admin/history
```

### 2.3. Lưu ý quan trọng

- File Excel khuyến nghị dưới **5MB** (giới hạn của server Vercel)
- **Không giới hạn số dòng** - hệ thống xử lý tự động theo batch
- Dữ liệu trùng lặp (cùng Link) sẽ được **skip** tự động
- Nên upload theo **từng tháng** để dễ quản lý
- Nếu file quá lớn, có thể chia thành nhiều lần upload

### 2.4. Kiểm tra sau Upload

1. Truy cập `/admin/history` để xem lịch sử upload
2. Kiểm tra số lượng record đã import
3. Truy cập Dashboard để verify dữ liệu hiển thị đúng

---

## 3. Quy trình Tạo Báo cáo Nhận định

### 3.1. Mục đích

Báo cáo Nhận định (Social Listening Report) phục vụ:
- Đánh giá hiện diện thương hiệu VCBS trên các kênh truyền thông
- Phân tích sentiment và phản hồi của công chúng
- Đề xuất insights cho hoạt động Marketing

### 3.2. Quy trình tạo báo cáo

```
Bước 1: Chuẩn bị dữ liệu
        - Export data từ hệ thống Social Listening
        - File Excel chứa đề cập về VCBS trong tháng
        ↓
Bước 2: Sử dụng AI để tạo nội dung
        - Sử dụng prompt từ file: prompt-vcbs-social-listening.md
        - Upload file Excel vào Gemini/Claude
        - Copy prompt và yêu cầu AI tạo báo cáo
        ↓
Bước 3: Review và chỉnh sửa
        - Kiểm tra số liệu chính xác
        - Bổ sung nhận định từ chuyên gia (nếu cần)
        - Đảm bảo các link bài viết hoạt động
        ↓
Bước 4: Upload lên hệ thống
        - Truy cập /admin/reports
        - Click "Tạo báo cáo mới"
        - Chọn loại: "Nhận định"
        - Chọn tháng/năm
        - Paste nội dung Markdown
        - Click "Lưu"
```

### 3.3. Cấu trúc báo cáo Nhận định

```markdown
# BÁO CÁO SOCIAL LISTENING - VCBS
## Tháng [MM/YYYY]

## 1. TỔNG QUAN (Executive Summary)
- Tổng số đề cập
- Tổng giá trị truyền thông
- Sentiment Score

## 2. PHÂN TÍCH SENTIMENT
- Tin tích cực nổi bật
- Tin tiêu cực cần lưu ý

## 3. TIN NỔI BẬT THEO KÊNH
- Báo mạng
- Social Media

## 4. PHÂN TÍCH THEO CHỦ ĐỀ

## 5. BÀI VIẾT CÓ NHẮC ĐẾN ĐỐI THỦ

## 6. INSIGHTS & KHUYẾN NGHỊ
```

---

## 4. Quy trình Tạo Báo cáo Ngành

### 4.1. Mục đích

Báo cáo Ngành (Industry Report) phục vụ:
- **Đối tượng chính**: CEO, HĐQT, Ban điều hành - nắm nhanh chính sách mới, tổng quan ngành
- **Đối tượng phụ**: Bộ phận Chiến lược, Kinh doanh, Marketing - cập nhật tin tức, lập kế hoạch

### 4.2. Quy trình tạo báo cáo

```
Bước 1: Thu thập dữ liệu
        - File Excel từ hệ thống media monitoring
        - Dữ liệu báo chí ngành chứng khoán trong kỳ
        ↓
Bước 2: Sử dụng AI để phân tích và tạo báo cáo
        - Sử dụng prompt từ file: prompt_baocaonganhck.md
        - Upload file Excel vào Gemini/Claude
        - AI sẽ tự động phân tích và phân loại theo 8 category
        ↓
Bước 3: Review nội dung
        - Kiểm tra số liệu thống kê
        - Đảm bảo tổng % category = 100%
        - Verify các link bài viết
        - Bổ sung đề xuất cho Ban điều hành
        ↓
Bước 4: Upload lên hệ thống
        - Truy cập /admin/reports
        - Click "Tạo báo cáo mới"
        - Chọn loại: "Báo cáo Ngành"
        - Chọn tháng/năm
        - Paste nội dung Markdown
        - Click "Lưu"
```

### 4.3. 8 Category phân loại tin ngành

| # | Category | Mô tả |
|---|----------|-------|
| 1 | Chính sách & Pháp lý | Nghị định, thông tư, nâng hạng thị trường, KRX |
| 2 | Hoạt động Tài chính & Quản trị | Lợi nhuận, doanh thu, margin, chia cổ tức |
| 3 | Thị phần & Giải thưởng | Xếp hạng môi giới, giải thưởng ngành |
| 4 | Nhân sự | Bổ nhiệm, miễn nhiệm cấp cao |
| 5 | Công nghệ & Sản phẩm | eKYC, app giao dịch, sản phẩm mới |
| 6 | Dòng tiền & Xu hướng vĩ mô | Khối ngoại, ETF, VN-Index |
| 7 | Rủi ro & Tuân thủ | Vi phạm, xử phạt, thao túng giá |
| 8 | Khác | Tin không thuộc 7 category trên |

### 4.4. Cấu trúc báo cáo Ngành

```markdown
# BÁO CÁO TỔNG HỢP TIN TỨC NGÀNH CHỨNG KHOÁN

## EXECUTIVE SUMMARY
- Điểm nổi bật trong kỳ
- Đề xuất cho Ban điều hành

## 1. CHÍNH SÁCH & PHÁP LÝ
## 2. HOẠT ĐỘNG TÀI CHÍNH & QUẢN TRỊ
## 3. DÒNG TIỀN & XU HƯỚNG VĨ MÔ
## 4. CÔNG NGHỆ & SẢN PHẨM
## 5. CÁC CHỦ ĐỀ KHÁC

## 6. THỐNG KÊ TRUYỀN THÔNG
- Phân bố theo nguồn tin
- Phân bố theo chủ đề
- Timeline theo tuần

## PHỤ LỤC
```

---

## 5. Hướng dẫn sử dụng Prompt AI

### 5.1. Danh sách Prompt có sẵn

| File | Mục đích | Đối tượng báo cáo |
|------|----------|-------------------|
| `prompt-vcbs-social-listening.md` | Tạo báo cáo Social Listening về thương hiệu VCBS | Marketing, Ban lãnh đạo |
| `prompt_baocaonganhck.md` | Tạo báo cáo tổng hợp tin tức ngành chứng khoán | CEO, HĐQT, Ban điều hành |

### 5.2. Cách sử dụng với Gemini/Claude

#### Bước 1: Mở file prompt

```
Mở file prompt tương ứng trong thư mục dự án:
- F:\vcbs-dashboard\prompt-vcbs-social-listening.md
- F:\vcbs-dashboard\prompt_baocaonganhck.md
```

#### Bước 2: Copy toàn bộ nội dung prompt

#### Bước 3: Tạo conversation mới với AI

**Với Google Gemini:**
1. Truy cập https://gemini.google.com
2. Chọn Gemini Advanced (nếu có)
3. Upload file Excel trước
4. Paste prompt và gửi

**Với Claude:**
1. Truy cập https://claude.ai
2. Upload file Excel
3. Paste prompt và gửi

#### Bước 4: Theo dõi AI xử lý

AI sẽ tự động:
1. Đọc và phân tích file Excel
2. Phân loại tin theo category
3. Tạo báo cáo theo định dạng yêu cầu

#### Bước 5: Review và chỉnh sửa output

Kiểm tra:
- [ ] Số liệu thống kê chính xác
- [ ] Tổng % category = 100%
- [ ] Các link bài viết hoạt động
- [ ] Không có emoji (trừ khi yêu cầu)
- [ ] Định dạng số tiền đúng (triệu/tỷ VNĐ)

### 5.3. Mẹo sử dụng hiệu quả

1. **Luôn upload file trước khi paste prompt** - AI cần đọc dữ liệu thực để tạo báo cáo chính xác

2. **Hỏi lại nếu cần** - Sau khi có báo cáo, có thể hỏi thêm:
   - "Giải thích chi tiết hơn về mục X"
   - "Thêm phân tích về đối thủ Y"
   - "Tạo bảng so sánh Z"

---

## 6. Xử lý lỗi thường gặp

### 6.1. Lỗi Upload Data

| Lỗi | Nguyên nhân | Cách xử lý |
|-----|-------------|------------|
| "File quá lớn" | File > 5MB | Chia nhỏ file thành nhiều phần |
| "Định dạng không hỗ trợ" | Không phải .xlsx/.xls | Convert sang Excel format |
| "Thiếu cột bắt buộc" | Thiếu cột trong file | Bổ sung cột theo template |
| "Ngày không hợp lệ" | Sai định dạng ngày | Đổi sang DD/MM/YYYY |

### 6.2. Lỗi khi dùng AI Prompt

| Lỗi | Nguyên nhân | Cách xử lý |
|-----|-------------|------------|
| "Không đọc được file" | File bị lỗi hoặc quá lớn | Chia nhỏ file hoặc chạy scripts Python xử lý dữ liệu |
| "Số liệu không khớp" | AI đọc sai cột | Yêu cầu AI liệt kê tên các cột trong file |
| "Thiếu category" | AI không nhận diện được chủ đề | Yêu cầu AI phân loại lại |
| "% không bằng 100%" | Lỗi tính toán | Yêu cầu AI tính lại phần trăm |

### 6.3. Lỗi hệ thống Dashboard

| Lỗi | Nguyên nhân | Cách xử lý |
|-----|-------------|------------|
| "403 Forbidden" | Không có quyền Admin | Liên hệ quản trị viên cấp quyền |
| "Không thể export PDF" | Server lỗi | Sử dụng Browser Print (Ctrl+P) |
| "Dữ liệu không hiển thị" | Cache cũ | Refresh trang (Ctrl+Shift+R) |

---

## Liên hệ hỗ trợ

- **Vấn đề kỹ thuật**: Liên hệ team kỹ thuật
- **Vấn đề dữ liệu**: Liên hệ team Data
- **Vấn đề nội dung báo cáo**: Tự xử lý

---

*Tài liệu cập nhật: Tháng 12/2025*
*Phiên bản: 1.0*