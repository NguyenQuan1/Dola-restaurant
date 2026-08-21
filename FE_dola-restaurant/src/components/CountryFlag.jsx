export default function CountryFlag({ code, className = 'w-5 h-5' }) {
  switch (code) {
    case 'vi':
      return (
        <svg
          viewBox="0 0 512 512"
          className={`inline-block shrink-0 rounded-full shadow-xs object-cover ${className}`}
        >
          <rect width="512" height="512" fill="#da251d" />
          <polygon
            fill="#ff0"
            points="256,92 297,219 430,219 323,297 364,424 256,346 148,424 189,297 82,219 215,219"
          />
        </svg>
      )

    case 'en':
      return (
        <svg
          viewBox="0 0 512 512"
          className={`inline-block shrink-0 rounded-full shadow-xs object-cover ${className}`}
        >
          <clipPath id="uk-circle">
            <circle cx="256" cy="256" r="256" />
          </clipPath>
          <g clipPath="url(#uk-circle)">
            {/* Blue background */}
            <rect width="512" height="512" fill="#012169" />
            {/* White diagonals */}
            <path d="M0,0 L512,512 M512,0 L0,512" stroke="#fff" strokeWidth="68" />
            {/* Red diagonals */}
            <path d="M0,0 L512,512" stroke="#c8102e" strokeWidth="24" />
            <path d="M512,0 L0,512" stroke="#c8102e" strokeWidth="24" />
            {/* White cross */}
            <path d="M256,0 v512 M0,256 h512" stroke="#fff" strokeWidth="102" />
            {/* Red cross */}
            <path d="M256,0 v512 M0,256 h512" stroke="#c8102e" strokeWidth="60" />
          </g>
        </svg>
      )

    case 'zh':
      return (
        <svg
          viewBox="0 0 512 512"
          className={`inline-block shrink-0 rounded-full shadow-xs object-cover ${className}`}
        >
          <rect width="512" height="512" fill="#de2910" />
          {/* Main big star */}
          <polygon
            fill="#ffde00"
            points="140,70 152,108 192,108 160,132 172,170 140,146 108,170 120,132 88,108 128,108"
          />
          {/* 4 small stars */}
          <polygon
            fill="#ffde00"
            points="230,55 235,68 248,68 238,76 242,88 230,80 218,88 222,76 212,68 225,68"
          />
          <polygon
            fill="#ffde00"
            points="260,95 265,108 278,108 268,116 272,128 260,120 248,128 252,116 242,108 255,108"
          />
          <polygon
            fill="#ffde00"
            points="260,155 265,168 278,168 268,176 272,188 260,180 248,188 252,176 242,168 255,168"
          />
          <polygon
            fill="#ffde00"
            points="230,195 235,208 248,208 238,216 242,228 230,220 218,228 222,216 212,208 225,208"
          />
        </svg>
      )

    case 'ja':
      return (
        <svg
          viewBox="0 0 512 512"
          className={`inline-block shrink-0 rounded-full shadow-xs border border-jade-700/10 object-cover ${className}`}
        >
          <rect width="512" height="512" fill="#ffffff" />
          <circle cx="256" cy="256" r="145" fill="#bc002d" />
        </svg>
      )

    case 'ko':
      return (
        <svg
          viewBox="0 0 512 512"
          className={`inline-block shrink-0 rounded-full shadow-xs border border-jade-700/10 object-cover ${className}`}
        >
          <rect width="512" height="512" fill="#ffffff" />
          {/* Taegeuk circle (red top, blue bottom) */}
          <g transform="rotate(-34, 256, 256)">
            <path d="M 256 128 A 128 128 0 0 1 256 384 A 64 64 0 0 0 256 256 A 64 64 0 0 1 256 128" fill="#cd2e3a" />
            <path d="M 256 128 A 64 64 0 0 0 256 256 A 64 64 0 0 1 256 384 A 128 128 0 0 1 256 128" fill="#0047a0" />
          </g>
          {/* Top-left trigram (Geon ☰) */}
          <g transform="translate(100, 100) rotate(-45)">
            <rect x="-35" y="-18" width="70" height="7" fill="#000" rx="2" />
            <rect x="-35" y="-4" width="70" height="7" fill="#000" rx="2" />
            <rect x="-35" y="10" width="70" height="7" fill="#000" rx="2" />
          </g>
          {/* Bottom-right trigram (Gon ☷) */}
          <g transform="translate(412, 412) rotate(-45)">
            <rect x="-35" y="-18" width="31" height="7" fill="#000" rx="2" />
            <rect x="4" y="-18" width="31" height="7" fill="#000" rx="2" />
            <rect x="-35" y="-4" width="31" height="7" fill="#000" rx="2" />
            <rect x="4" y="-4" width="31" height="7" fill="#000" rx="2" />
            <rect x="-35" y="10" width="31" height="7" fill="#000" rx="2" />
            <rect x="4" y="10" width="31" height="7" fill="#000" rx="2" />
          </g>
          {/* Top-right trigram (Gam ☵) */}
          <g transform="translate(412, 100) rotate(45)">
            <rect x="-35" y="-18" width="31" height="7" fill="#000" rx="2" />
            <rect x="4" y="-18" width="31" height="7" fill="#000" rx="2" />
            <rect x="-35" y="-4" width="70" height="7" fill="#000" rx="2" />
            <rect x="-35" y="10" width="31" height="7" fill="#000" rx="2" />
            <rect x="4" y="10" width="31" height="7" fill="#000" rx="2" />
          </g>
          {/* Bottom-left trigram (Ri ☲) */}
          <g transform="translate(100, 412) rotate(45)">
            <rect x="-35" y="-18" width="70" height="7" fill="#000" rx="2" />
            <rect x="-35" y="-4" width="31" height="7" fill="#000" rx="2" />
            <rect x="4" y="-4" width="31" height="7" fill="#000" rx="2" />
            <rect x="-35" y="10" width="70" height="7" fill="#000" rx="2" />
          </g>
        </svg>
      )

    default:
      return null
  }
}
