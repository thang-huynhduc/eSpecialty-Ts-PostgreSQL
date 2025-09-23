import React from "react";
import AboutUsVideo from "../assets/videos/AboutUs.mp4";

const AboutUs = () => {
  return (
    <section className="about px-6 md:px-20" id="about">
      {/* Heading */}

      <div className="row">
        {/* Video */}
        <div className="video-container">
          <video src={AboutUsVideo} loop autoPlay muted playsInline />
          <h3><strong>Đặc Sản Việt Nam</strong></h3>
        </div>

        {/* Content */}
        <div className="content">
          <h3>Vì sao bạn nên chọn eSpecialty?</h3>
          <p>
            eSpecialty là nơi hội tụ những{" "}
            <strong>đặc sản nổi tiếng từ khắp mọi vùng miền Việt Nam</strong>,
            từ nước mắm Phú Quốc, mật ong Tây Nguyên cho đến bánh trung thu
            truyền thống.
          </p>
          <p>
            Chúng tôi cam kết mang đến cho bạn những sản phẩm chất lượng cao,
            được chọn lọc kỹ lưỡng từ các nhà sản xuất uy tín, cùng mức giá hợp
            lý.
          </p>
        </div>
      </div>
    </section>
  );
};

export default AboutUs;
