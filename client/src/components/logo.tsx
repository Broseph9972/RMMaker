import { OFFICIAL_RUBIKS_COLORS } from "@/lib/rubiks-colors";

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
}

export function Logo({ size = 'md' }: LogoProps) {
  // Simplified 4x4 logo pattern that's easier to render
  const logoPattern = [
    [1, 1, 2, 2],  // R pattern top
    [1, 0, 2, 0],  // R pattern middle
    [3, 3, 4, 4],  // M pattern top  
    [3, 0, 4, 4],  // M pattern bottom
  ];

  const colors = [
    OFFICIAL_RUBIKS_COLORS.white.hex,    // 0 - background/white
    OFFICIAL_RUBIKS_COLORS.red.hex,      // 1 - red for R
    OFFICIAL_RUBIKS_COLORS.blue.hex,     // 2 - blue for R accent
    OFFICIAL_RUBIKS_COLORS.orange.hex,   // 3 - orange for M
    OFFICIAL_RUBIKS_COLORS.green.hex,    // 4 - green for M accent
  ];

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return { width: '20px', height: '20px' };
      case 'md':
        return { width: '32px', height: '32px' };
      case 'lg':
        return { width: '48px', height: '48px' };
    }
  };

  const sizeStyles = getSizeStyles();
  const cellSize = parseInt(sizeStyles.width) / 4;

  return (
    <div 
      style={{ 
        width: sizeStyles.width, 
        height: sizeStyles.height,
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '1px',
        padding: '2px',
        backgroundColor: '#e5e7eb',
        borderRadius: '4px'
      }}
    >
      {logoPattern.flat().map((colorIndex, index) => (
        <div
          key={index}
          style={{ 
            backgroundColor: colors[colorIndex],
            borderRadius: '1px',
            border: '0.5px solid #d1d5db'
          }}
        />
      ))}
    </div>
  );
}