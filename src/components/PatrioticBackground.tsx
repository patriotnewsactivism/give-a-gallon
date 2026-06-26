/**
 * PatrioticBackground — A subtle, blended American flag and eagle motif.
 * Designed to be placed as an absolute-positioned layer behind content.
 * Uses very low opacity to remain "smoky" and professional on the deep navy base.
 */
export function PatrioticBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-20 overflow-hidden opacity-[0.05]">
      <svg
        viewBox="0 0 1000 1000"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-full object-cover"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <radialGradient id="patriotic-spotlight" cx="50%" cy="30%" r="70%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </radialGradient>
          <mask id="patriotic-mask">
            <rect width="100%" height="100%" fill="url(#patriotic-spotlight)" />
          </mask>
        </defs>

        <g className="text-foreground" mask="url(#patriotic-mask)">
          {/* Faded American Flag Stripes */}
          <g opacity="0.4">
            {[...Array(13)].map((_, i) => (
              <rect
                key={i}
                x="0"
                y={i * 77}
                width="1000"
                height="32"
                fill="currentColor"
                opacity={i % 2 === 0 ? 0.4 : 0}
              />
            ))}
          </g>

          {/* Stylized Eagle silhouette woven into stripes */}
          <path
            d="M500 100 
               C 350 100, 150 250, 0 500 
               C 100 480, 250 450, 400 450 
               C 300 550, 100 700, 50 850 
               C 200 800, 400 750, 500 750 
               C 600 750, 800 800, 950 850 
               C 900 700, 700 550, 600 450 
               C 750 450, 900 480, 1000 500 
               C 850 250, 650 100, 500 100 Z"
            fill="currentColor"
            opacity="0.8"
            style={{ mixBlendMode: "overlay" }}
          />

          {/* Focal Star / Compass point */}
          <polygon
            points="500,200 515,245 560,245 525,275 540,320 500,295 460,320 475,275 440,245 485,245"
            fill="currentColor"
            opacity="0.5"
          />
        </g>
      </svg>
    </div>
  );
}
