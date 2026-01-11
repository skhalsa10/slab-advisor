'use client'

interface LevelIndicatorProps {
  /** Front/back tilt in degrees (Y-axis movement) */
  beta: number | null
  /** Left/right tilt in degrees (X-axis movement) */
  gamma: number | null
  /** Whether the device is currently level (within threshold) */
  isLevel: boolean
}

/**
 * Visual level indicator (bubble-level style)
 *
 * Shows a target circle with a moving bubble that responds to phone tilt.
 * Both turn green when the phone is level (within ±3 degrees).
 *
 * Design:
 * - Target: Fixed translucent circle border (w-12 h-12)
 * - Bubble: Smaller solid circle (w-4 h-4) that moves with tilt
 * - Not Level: White target, white bubble
 * - Level: Green target, green bubble
 */
export default function LevelIndicator({
  beta,
  gamma,
  isLevel,
}: LevelIndicatorProps) {
  if (beta === null || gamma === null) return null

  // Clamp tilt values to keep bubble within the target area
  // Map ±15° of tilt to the radius of the target circle
  const maxTilt = 15
  const clampedBeta = Math.max(-maxTilt, Math.min(maxTilt, beta))
  const clampedGamma = Math.max(-maxTilt, Math.min(maxTilt, gamma))

  // Convert to pixel offset (target is 48px = w-12, bubble is 16px = w-4)
  // Max offset = (48 - 16) / 2 = 16px in each direction
  const maxOffset = 16
  const offsetX = (clampedGamma / maxTilt) * maxOffset
  const offsetY = (clampedBeta / maxTilt) * maxOffset

  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
      {/* Target circle */}
      <div
        className={`relative w-12 h-12 rounded-full border-2 transition-colors duration-150 ${
          isLevel ? 'border-green-500' : 'border-white/60'
        }`}
      >
        {/* Bubble */}
        <div
          className={`absolute w-4 h-4 rounded-full transition-colors duration-150 ${
            isLevel ? 'bg-green-500' : 'bg-white'
          }`}
          style={{
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`,
          }}
        />
      </div>
    </div>
  )
}
