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
      viewBox="0 0 22 22"
      width="20"
      height="20"
      role="img"
      aria-hidden="true"
    >
      <rect
        x="0.5"
        y="0.5"
        width="10"
        height="10"
        rx="1.5"
        ry="1.5"
        transform="rotate(-45 5.5 5.5)"
        fill="#00689e"
        opacity="0.5"
      />
      <rect
        x="5"
        y="5"
        width="10"
        height="10"
        rx="1.5"
        ry="1.5"
        transform="rotate(-45 10 10)"
        fill="#00689e"
      />
    </svg>
    <span style={{ fontWeight: 600, fontSize: "14px" }}>FreeIPA</span>
  </span>
);

export default IpaLogo;
