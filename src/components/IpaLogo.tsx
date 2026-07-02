import React from "react";

interface IpaLogoProps {
  className?: string;
}

const IpaLogo: React.FC<IpaLogoProps> = ({ className }) => (
  <span
    className={className}
    style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="20"
      height="20"
      role="img"
      aria-hidden="true"
    >
      <rect
        x="1"
        y="1"
        width="12"
        height="12"
        rx="2"
        ry="2"
        transform="rotate(-45 7 7)"
        fill="#73ba25"
      />
      <rect
        x="6"
        y="6"
        width="10"
        height="10"
        rx="2"
        ry="2"
        transform="rotate(-45 11 11)"
        fill="#00689e"
      />
    </svg>
    <span style={{ fontWeight: 600, fontSize: "14px" }}>FreeIPA</span>
  </span>
);

export default IpaLogo;
