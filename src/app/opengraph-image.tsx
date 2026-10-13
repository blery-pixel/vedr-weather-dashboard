import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'Veðr — Weather Dashboard'

/**
 * Static OG / share-preview image for the dashboard. Renders a moody Scottish
 * Highlands themed card with the brand, tagline, and "Slàinte mhath" sign-off.
 * (Dynamic per-location OG would require a route segment; this static version
 * covers the default share-preview use case.)
 */
export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '60px',
          background: 'linear-gradient(135deg, #1C3125 0%, #121920 60%, #1a2721 100%)',
          color: '#f4f6f5',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Tartan accent stripe */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '8px',
            background: 'linear-gradient(90deg, #1C3125, #E68A2E, #6B4E5B)',
          }}
        />

        {/* Top: brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #1C3125, #121920)',
              border: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
            }}
          >
            ⛰️
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#f4f6f5' }}>Veðr</div>
            <div style={{ fontSize: '15px', color: '#788A87', letterSpacing: '2px', textTransform: 'uppercase' }}>
              Weather Dashboard
            </div>
          </div>
        </div>

        {/* Middle: tagline + feature pills */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ fontSize: '68px', fontWeight: 700, color: '#f4f6f5', lineHeight: 1.05, display: 'flex', flexDirection: 'column' }}>
            <span>Moody. Atmospheric.</span>
            <span>Intelligent.</span>
          </div>
          <div style={{ display: 'flex', gap: '20px', marginTop: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#E68A2E' }} />
              <span style={{ fontSize: '22px', color: '#788A87' }}>Live & sim data</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#6B4E5B' }} />
              <span style={{ fontSize: '22px', color: '#788A87' }}>12 glens · 24 cards</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#4a9e6e' }} />
              <span style={{ fontSize: '22px', color: '#788A87' }}>Keyboard-driven</span>
            </div>
          </div>
        </div>

        {/* Bottom: sign-off */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            paddingTop: '24px',
          }}
        >
          <div style={{ fontSize: '16px', color: '#788A87' }}>
            Deep forest greens · misty loch slates · warm whisky amber · heather purples
          </div>
          <div style={{ fontSize: '18px', color: '#E68A2E', fontStyle: 'italic' }}>Slàinte mhath 🥃</div>
        </div>
      </div>
    ),
    { ...size },
  )
}
