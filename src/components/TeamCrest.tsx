/** SVG team crest with club colors and short code — clean, trademark-safe visuals. */
export function TeamCrest({
  code,
  color,
  size = 44,
}: {
  code: string;
  color: string;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      role="img"
      aria-label={code}
      className="shrink-0 drop-shadow-[0_4px_12px_rgba(0,0,0,0.4)]"
    >
      <path
        d="M24 3.5 42 9.5v16c0 9.6-7.4 15.3-18 19C13.4 40.8 6 35.1 6 25.5v-16L24 3.5z"
        fill={color}
        fillOpacity="0.16"
        stroke={color}
        strokeWidth="1.6"
      />
      <path d="M24 7.6 38.4 12.2v13c0 7.6-5.9 12.2-14.4 15.2-8.5-3-14.4-7.6-14.4-15.2v-13L24 7.6z" fill={color} />
      <text
        x="24"
        y="27.5"
        textAnchor="middle"
        fontSize="12"
        fontWeight="800"
        fontFamily="inherit"
        fill="#fff"
        style={{ letterSpacing: "0.06em" }}
      >
        {code.slice(0, 4).toUpperCase()}
      </text>
    </svg>
  );
}
