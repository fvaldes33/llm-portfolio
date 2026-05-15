import type { ComponentProps } from "react";

export function FrancoLogo(props: ComponentProps<"svg">) {
  return (
    <svg
      aria-label="Franco Valdes"
      viewBox="0 0 50 34"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <defs>
        <clipPath id="franco-logo-clip">
          <rect width="49.5125" height="34" fill="white" />
        </clipPath>
      </defs>
      <g clipPath="url(#franco-logo-clip)">
        <path d="M0 0H32.9375V10.625H0V0Z" fill="currentColor" />
        <path d="M0 11.6875H21.25V22.3125H0V11.6875Z" fill="currentColor" />
        <path d="M0 23.375H10.625V34H0V23.375Z" fill="currentColor" />
        <path
          d="M33.8937 0H49.464L44.5187 10.625H33.8937V0Z"
          className="fill-primary"
        />
        <path
          d="M33.8937 11.6875H44.5187L34.305 34H33.8937V11.6875Z"
          className="fill-primary"
        />
        <path
          d="M32.8312 11.6875H22.2062L32.4199 34H32.8312V11.6875Z"
          className="fill-primary"
        />
      </g>
    </svg>
  );
}
