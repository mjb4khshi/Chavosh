import React from "react";

interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
  className?: string;
}

// Iconsax Category (Linear) - 24x24
export const IconsaxCategory: React.FC<IconProps> = ({
  size = 20,
  color = "currentColor",
  className,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    <path
      d="M5 10H7C9 10 10 9 10 7V5C10 3 9 2 7 2H5C3 2 2 3 2 5V7C2 9 3 10 5 10Z"
      stroke={color}
      strokeWidth="1.5"
      strokeMiterlimit="10"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M17 10H19C21 10 22 9 22 7V5C22 3 21 2 19 2H17C15 2 14 3 14 5V7C14 9 15 10 17 10Z"
      stroke={color}
      strokeWidth="1.5"
      strokeMiterlimit="10"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M17 22H19C21 22 22 21 22 19V17C22 15 21 14 19 14H17C15 14 14 15 14 17V19C14 21 15 22 17 22Z"
      stroke={color}
      strokeWidth="1.5"
      strokeMiterlimit="10"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M5 22H7C9 22 10 21 10 19V17C10 15 9 14 7 14H5C3 14 2 15 2 17V19C2 21 3 22 5 22Z"
      stroke={color}
      strokeWidth="1.5"
      strokeMiterlimit="10"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Iconsax Music (Linear) - 24x24
export const IconsaxMusic: React.FC<IconProps> = ({
  size = 20,
  color = "currentColor",
  className,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    <path
      d="M6.28 22C8 22 9.4 20.6 9.4 18.88C9.4 17.16 8 15.76 6.28 15.76C4.56 15.76 3.16 17.16 3.16 18.88C3.16 20.6 4.56 22 6.28 22Z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M20.84 7.96V4.6C20.84 2 19.21 1.64 17.56 2.09L11.32 3.79C10.18 4.1 9.4 5 9.4 6.3V18.87"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M20.84 16.8V12"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M17.72 19.92C19.44 19.92 20.84 18.52 20.84 16.8C20.84 15.08 19.44 13.68 17.72 13.68C16 13.68 14.6 15.08 14.6 16.8C14.6 18.52 16 19.92 17.72 19.92Z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9.4 9.52L20.84 6.4"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Iconsax CD / Disc (Linear) - 24x24
export const IconsaxCd: React.FC<IconProps> = ({
  size = 20,
  color = "currentColor",
  className,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    <path
      d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 14C13.1046 14 14 13.1046 14 12C14 10.8954 13.1046 10 12 10C10.8954 10 10 10.8954 10 12C10 13.1046 10.8954 14 12 14Z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Iconsax Profile 2-User (Linear) - 24x24
export const IconsaxUser: React.FC<IconProps> = ({
  size = 20,
  color = "currentColor",
  className,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    <path
      d="M9.16 10.87C9.06 10.86 8.94 10.86 8.83 10.87C6.45 10.79 4.56 8.84 4.56 6.44C4.56 3.99 6.54 2 9 2C11.45 2 13.44 3.99 13.44 6.44C13.43 8.84 11.54 10.79 9.16 10.87Z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      opacity="0.4"
      d="M16.41 4C18.35 4 19.91 5.57 19.91 7.5C19.91 9.39 18.41 10.93 16.54 11C16.46 10.99 16.37 10.99 16.28 11"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M4.16 14.56C1.74 16.18 1.74 18.82 4.16 20.43C6.91 22.27 11.42 22.27 14.17 20.43C16.59 18.81 16.59 16.17 14.17 14.56C11.43 12.73 6.92 12.73 4.16 14.56Z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      opacity="0.4"
      d="M18.34 20C19.06 19.85 19.74 19.56 20.3 19.13C21.86 17.96 21.86 16.03 20.3 14.86C19.75 14.44 19.08 14.16 18.37 14"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Iconsax Folder (Linear) - 24x24
export const IconsaxFolder: React.FC<IconProps> = ({
  size = 20,
  color = "currentColor",
  className,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    <path
      d="M22 11V17C22 21 21 22 17 22H7C3 22 2 21 2 17V7C2 3 3 2 7 2H8.5C10 2 10.33 2.44 10.9 3.2L12.4 5.2C12.78 5.7 13 6 14 6H17C21 6 22 7 22 11Z"
      stroke={color}
      strokeWidth="1.5"
      strokeMiterlimit="10"
    />
  </svg>
);

// Iconsax Setting-2 (Linear) - 24x24
export const IconsaxSetting: React.FC<IconProps> = ({
  size = 20,
  color = "currentColor",
  className,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    <path
      d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
      stroke={color}
      strokeWidth="1.5"
      strokeMiterlimit="10"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M2 12.88V11.12C2 10.08 2.85 9.22 3.9 9.22C5.71 9.22 6.45 7.94 5.54 6.37C5.02 5.47 5.33 4.3 6.24 3.78L7.97 2.79C8.76 2.32 9.78 2.6 10.25 3.39L10.36 3.58C11.26 5.15 12.74 5.15 13.65 3.58L13.76 3.39C14.23 2.6 15.25 2.32 16.04 2.79L17.77 3.78C18.68 4.3 18.99 5.47 18.47 6.37C17.56 7.94 18.3 9.22 20.11 9.22C21.15 9.22 22.01 10.07 22.01 11.12V12.88C22.01 13.92 21.16 14.78 20.11 14.78C18.3 14.78 17.56 16.06 18.47 17.63C18.99 18.54 18.68 19.7 17.77 20.22L16.04 21.21C15.25 21.68 14.23 21.4 13.76 20.61L13.65 20.42C12.75 18.85 11.27 18.85 10.36 20.42L10.25 20.61C9.78 21.4 8.76 21.68 7.97 21.21L6.24 20.22C5.33 19.7 5.02 18.53 5.54 17.63C6.45 16.06 5.71 14.78 3.9 14.78C2.85 14.78 2 13.92 2 12.88Z"
      stroke={color}
      strokeWidth="1.5"
      strokeMiterlimit="10"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Iconsax Search Normal (Linear) - 24x24
export const IconsaxSearch: React.FC<IconProps> = ({
  size = 20,
  color = "currentColor",
  className,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    <path
      d="M11 20C15.9706 20 20 15.9706 20 11C20 6.02944 15.9706 2 11 2C6.02944 2 2 6.02944 2 11C2 15.9706 6.02944 20 11 20Z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M18.8978 20.4629C19.1822 22.1242 20.3546 22.4637 21.4838 21.2188C22.5159 20.0805 22.1195 18.9585 20.5969 18.7278C19.4713 18.5472 18.7052 19.3313 18.8978 20.4629Z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Iconsax Magic Star / Sparkles (Linear) - 24x24
export const IconsaxMagicStar: React.FC<IconProps> = ({
  size = 20,
  color = "currentColor",
  className,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    <path
      d="M17.29 4.14L17.22 7.93C17.21 8.45 17.54 9.14 17.96 9.45L20.44 11.33C22.03 12.53 21.77 14 19.87 14.6L16.64 15.61C16.1 15.78 15.53 16.37 15.39 16.92L14.62 19.86C14.01 22.18 12.49 22.41 11.23 20.37L9.47 17.52C9.15 17 8.39 16.61 7.79 16.64L4.45 16.81C2.06 16.93 1.38 15.55 2.94 13.73L4.92 11.43C5.29 11 5.46 10.2 5.29 9.66L4.28 6.43C3.69 4.53 4.75 3.48 6.64 4.1L9.59 5.07C10.09 5.23 10.84 5.12 11.26 4.81L14.34 2.59C16 1.39 17.33 2.09 17.29 4.14Z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M21.91 22L18.88 18.97"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Iconsax Play (Linear) - 24x24
export const IconsaxPlay: React.FC<IconProps> = ({
  size = 20,
  color = "currentColor",
  className,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    <path
      d="M17.13 7.98C20.96 10.19 20.96 13.81 17.13 16.02L14.04 17.8L10.95 19.58C7.13 21.79 4 19.98 4 15.56V12V8.44C4 4.02 7.13 2.21 10.96 4.42L13.21 5.72"
      stroke={color}
      strokeWidth="1.5"
      strokeMiterlimit="10"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Iconsax Pause (Linear) - 24x24
export const IconsaxPause: React.FC<IconProps> = ({
  size = 20,
  color = "currentColor",
  className,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    <path
      d="M10.65 19.11V4.89C10.65 3.54 10.08 3 8.64 3H5.01C3.57 3 3 3.54 3 4.89V19.11C3 20.46 3.57 21 5.01 21H8.64C10.08 21 10.65 20.46 10.65 19.11Z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M21 19.11V4.89C21 3.54 20.43 3 18.99 3H15.36C13.93 3 13.35 3.54 13.35 4.89V19.11C13.35 20.46 13.92 21 15.36 21H18.99C20.43 21 21 20.46 21 19.11Z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Iconsax Next (Linear) - 24x24
export const IconsaxNext: React.FC<IconProps> = ({
  size = 20,
  color = "currentColor",
  className,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    <path
      d="M11.73 7.39L7.58 5C5.88 4.02 3.75 5.24 3.75 7.21V16.78C3.75 18.74 5.88 19.97 7.58 18.99L11.73 16.6L15.88 14.2C17.58 13.22 17.58 10.77 15.88 9.79"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M20.24 18.18V5.82"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Iconsax Previous (Linear) - 24x24
export const IconsaxPrevious: React.FC<IconProps> = ({
  size = 20,
  color = "currentColor",
  className,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    <path
      d="M12.27 7.39L16.42 5C18.12 4.02 20.25 5.24 20.25 7.21V16.78C20.25 18.74 18.12 19.97 16.42 18.99L12.27 16.6L8.12 14.2C6.42 13.22 6.42 10.77 8.12 9.79"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M3.76 18.18V5.82"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Iconsax Shuffle (Linear) - 24x24
export const IconsaxShuffle: React.FC<IconProps> = ({
  size = 20,
  color = "currentColor",
  className,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    <path
      d="M16.45 6L21 6.02"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M3 17.98L5.55 17.99C6.46 17.99 7.31 17.54 7.81 16.79L8.99 15.02L9.75 13.88L13.67 8"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M19 19.98L21 17.98"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M8.89 8.62L7.81 7.12C7.3 6.41 6.48 5.99 5.61 6L3 6.01"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12.97 15.38L14.19 16.95C14.7 17.61 15.5 18 16.34 18L21.01 17.98"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M21 6.02L19 4.02"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Iconsax Repeat Music (Linear) - 24x24
export const IconsaxRepeat: React.FC<IconProps> = ({
  size = 20,
  color = "currentColor",
  className,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    <path
      d="M10 21L7.56 18.66L15.51 18.68C19.08 18.68 22.01 15.75 22.01 12.16C22.01 10.37 21.28 8.74 20.1 7.56"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9 12H15"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M8.56 4.98C4.99 4.98 2.06 7.91 2.06 11.5C2.06 13.29 2.79 14.92 3.97 16.1"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M14.06 2.66L16.5 5L12.99 4.99"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Iconsax Volume High (Linear) - 24x24
export const IconsaxVolumeHigh: React.FC<IconProps> = ({
  size = 20,
  color = "currentColor",
  className,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    <path
      d="M2 10V14C2 16 3 17 5 17H6.43C6.8 17 7.17 17.11 7.49 17.3L10.41 19.13C12.93 20.71 15 19.56 15 16.59V7.41C15 4.43 12.93 3.29 10.41 4.87L7.49 6.7C7.17 6.89 6.8 7 6.43 7H5C3 7 2 8 2 10Z"
      stroke={color}
      strokeWidth="1.5"
    />
    <path
      d="M18 8C19.33 9.33 20 10.67 20 12C20 13.33 19.33 14.67 18 16"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M19.5 5C21.5 7.33 22.5 9.67 22.5 12C22.5 14.33 21.5 16.67 19.5 19"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Iconsax Volume Low / Medium (Linear, 1 Wave) - 24x24
export const IconsaxVolumeLow: React.FC<IconProps> = ({
  size = 20,
  color = "currentColor",
  className,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    <path
      d="M2 10V14C2 16 3 17 5 17H6.43C6.8 17 7.17 17.11 7.49 17.3L10.41 19.13C12.93 20.71 15 19.56 15 16.59V7.41C15 4.43 12.93 3.29 10.41 4.87L7.49 6.7C7.17 6.89 6.8 7 6.43 7H5C3 7 2 8 2 10Z"
      stroke={color}
      strokeWidth="1.5"
    />
    <path
      d="M18 8C19.33 9.33 20 10.67 20 12C20 13.33 19.33 14.67 18 16"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Iconsax Volume Cross / Mute (Linear) - 24x24
export const IconsaxVolumeCross: React.FC<IconProps> = ({
  size = 20,
  color = "currentColor",
  className,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    <path
      d="M2 10V14C2 16 3 17 5 17H6.43C6.8 17 7.17 17.11 7.49 17.3L10.41 19.13C12.93 20.71 15 19.56 15 16.59V7.41C15 4.43 12.93 3.29 10.41 4.87L7.49 6.7C7.17 6.89 6.8 7 6.43 7H5C3 7 2 8 2 10Z"
      stroke={color}
      strokeWidth="1.5"
    />
    <path
      d="M18.5 9.5L22.5 14.5"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M22.5 9.5L18.5 14.5"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Iconsax Volume Mute / Slash (Linear) - 24x24
export const IconsaxVolumeMute: React.FC<IconProps> = IconsaxVolumeCross;

// Iconsax Repeat One / Single Track (Linear) - 24x24
export const IconsaxRepeatOne: React.FC<IconProps> = ({
  size = 20,
  color = "currentColor",
  className,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    <path
      d="M10 21L7.56 18.66L15.51 18.68C19.08 18.68 22.01 15.75 22.01 12.16C22.01 10.37 21.28 8.74 20.1 7.56"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M8.56 4.98C4.99 4.98 2.06 7.91 2.06 11.5C2.06 13.29 2.79 14.92 3.97 16.1"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M14.06 2.66L16.5 5L12.99 4.99"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M11.25 10.2L12.5 9.25V14.75"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Iconsax Gramophone / Record Circle (Linear) - 24x24
export const IconsaxGramophone: React.FC<IconProps> = ({
  size = 20,
  color = "currentColor",
  className,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.5" />
    <circle cx="12" cy="12" r="6" stroke={color} strokeWidth="1.5" opacity="0.6" />
    <circle cx="12" cy="12" r="2.5" stroke={color} strokeWidth="1.5" />
  </svg>
);

// Iconsax Mini / Small Window (Linear) - 24x24
export const IconsaxMiniWindow: React.FC<IconProps> = ({
  size = 20,
  color = "currentColor",
  className,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    <rect x="3" y="5" width="18" height="14" rx="3" stroke={color} strokeWidth="1.5" />
    <path d="M3 10H21" stroke={color} strokeWidth="1.5" opacity="0.5" />
    <circle cx="6.5" cy="7.5" r="0.75" fill={color} />
    <circle cx="9" cy="7.5" r="0.75" fill={color} />
  </svg>
);
