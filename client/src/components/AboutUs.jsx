import React from "react";
import AboutUsVideo from "../assets/videos/AboutUs.mp4";
import { useTranslation, Trans } from "react-i18next";

const AboutUs = () => {
  const { t } = useTranslation();

  return (
    <section className="about px-6 md:px-20" id="about">
      <div className="row">
        {/* Video */}
        <div className="video-container">
          <video src={AboutUsVideo} loop autoPlay muted playsInline />
          <h3>
            <strong>{t("about.videoTitle")}</strong>
          </h3>
        </div>

        {/* Content */}
        <div className="content">
          <h3>{t("about.heading")}</h3>
          <p>
            <Trans i18nKey="about.paragraph1" components={{ strong: <strong /> }} />
          </p>
          <p>{t("about.paragraph2")}</p>
        </div>
      </div>
    </section>
  );
};

export default AboutUs;
