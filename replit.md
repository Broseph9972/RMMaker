# Rubik's Cube Mosaic Editor

## Overview

This is a full-stack web application for creating and editing Rubik's cube mosaics. The application allows users to design pixel art-style images using virtual Rubik's cubes of different sizes (2x2, 3x3, 4x4), with each cube face representing a single "pixel" in the mosaic. Users can paint individual cube faces with colors from predefined palettes (GAN, MoYu, or custom), organize their work in layers, and export their creations.

The application features a modern React frontend with a canvas-based editor, comprehensive toolset for mosaic creation, and a Node.js/Express backend for project persistence.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (August 2025)

### Advanced Algorithm Integration
- Integrated sophisticated image processing algorithms from Roman-/mosaic repository
- Added AlgorithmSelector component with 5 processing methods:
  - Gradient method: Perfect for portraits with smooth transitions
  - Error diffusion dithering: Natural color mixing for high detail preservation
  - Ordered dithering: Structured patterns with controlled grain
  - Atkinson dithering: Artistic cross-hatch effects  
  - Direct color matching: Simple replacement without dithering
- Each algorithm includes adjustable parameters and color exclusion options
- Real-time preview generation for algorithm comparison

### Individual Sticker Control System
- Implemented individual sticker painting instead of whole-cube filling
- Added two precision tools:
  - Brush: Paint individual stickers with pixel-level accuracy (B) or Ctrl+click to fill entire cube
  - Eraser: Clear individual stickers to white (E)
- Removed dedicated fill tool - fill functionality now accessible via Ctrl+click with brush tool
- Enhanced canvas interaction to detect sticker-level clicks within cubes
- Supports drag painting for efficient sticker-by-sticker creation

### Official Rubik's Color System
- Updated to use authentic WCA standard Rubik's cube colors based on Pantone specifications:
  - White: #FFFFFF, Red: #B71234, Blue: #0046AD, Orange: #FF5800, Green: #009B48, Yellow: #FFD500
- Removed black from default palette since most people don't have black stickers
- Removed color palette presets (GAN, MoYu, Vibrant) as they were too similar
- Simplified to single official color set with proper color names in tooltips

### Image Preprocessing Features
- Added two-color grayscale conversion with custom color selection
- Users can choose any two colors for grayscale conversion instead of default black/white
- Grayscale uses standard luminance weights (0.299 R + 0.587 G + 0.114 B) for accurate conversion
- Two-color selection appears as sub-option when grayscale mode is enabled
- Works with both basic generation and advanced algorithm processing

### Outline Control Feature
- Added toggleable cube outline color (black/white) for better visibility
- Implemented outline control button in top toolbar
- Updated canvas rendering to use selected outline color for:
  - Grid lines between cubes
  - Individual sticker borders
  - Empty cube outlines

### Comprehensive Undo/Redo System (August 2025)
- Implemented full undo/redo functionality with keyboard shortcuts (Ctrl+Z, Ctrl+Y, Ctrl+Shift+Z)
- Each individual brush stroke creates its own undo state for granular control
- Enhanced keyboard shortcuts with hold-to-repeat functionality - single press for instant undo, hold down for rapid continuous undo
- Added visual indicators showing when undo/redo actions are available
- Integrated keyboard shortcut tooltips throughout the UI for better discoverability
- Added undo/redo buttons to both main toolbar and side panel
- Removed layers system completely for simplified architecture and better performance
- Updated data schema to work with direct cube arrays instead of layer hierarchy

### Algorithm Preview Improvements
- Fixed algorithm selector previews to maintain original image aspect ratio
- Previews now show the complete image without cropping to square
- Increased preview size to 200px max dimension for better visibility
- Used object-contain CSS to preserve aspect ratios in preview cards

### Custom Two-Color Processing (August 2025)
- Implemented custom two-color grayscale with user-selectable color pairs
- Removed square aspect ratio cropping feature for simplified interface
- Reorganized two-color selection as expandable sub-option under grayscale checkbox
- Enhanced algorithm selector to support custom color pairs in two-color algorithm
- Updated algorithm description to "Custom Two-Color" with adjustable threshold
- Streamlined preprocessing options to focus on color conversion functionality

### Image Cropping Feature (August 2025)
- Added interactive image cropping modal after image upload
- Users can drag to reposition crop area before mosaic generation
- Includes "Make Square" button for perfect square crops
- Reset button to restore default crop area
- Visual feedback with overlay and corner handles
- Integrates seamlessly with two-color processing and advanced algorithms

### Sticker-Level Generation Fix (August 2025)  
- Fixed mosaic generation to create individual sticker detail instead of solid-colored cubes
- Each sticker within a cube now samples from corresponding region in source image
- Provides much more detailed and accurate mosaic generation
- Works with all processing modes: basic generation, two-color conversion, and advanced algorithms
- Calculates precise pixel positions for each sticker based on cube type (2x2, 3x3, 4x4)

### UI/UX Enhancements (August 2025)
- Restructured to single sidebar without title, combining all tools and functions
- Created floating settings tab accessible via gear icon for cube type selection
- Enhanced Auto Generator visibility with gradient background and larger buttons
- Improved visual hierarchy with blue color scheme for auto generation features
- Added informational tooltips for cube type changes requiring new project
- Added comprehensive dark theme with simple light/dark toggle in toolbar (dark mode by default)
- Dark theme includes proper color schemes for all UI elements, borders, and text
- Theme preference automatically saved to localStorage with direct "Light" and "Dark" options
- Removed system theme detection for simpler user experience

### Background Color Customization (August 2025)
- Added background color options in settings panel with four preset choices:
  - White: Clean background for professional presentation
  - Main Color: Uses currently selected sticker color as background
  - Black: High contrast background for visibility
  - Default: Standard light gray (#f8f8f8)
- Background color settings accessible through gear icon in toolbar
- Real-time canvas background updates when selecting different options

### Sticker-Level Auto Generation Fix (August 2025)
- Fixed auto generator to create individual sticker detail instead of solid-colored cubes
- Now samples multiple pixels from source image for each cube based on cube type (2x2, 3x3, 4x4)
- Each sticker within a cube gets its own color based on corresponding region in source image
- Provides much more detailed and accurate mosaic generation with proper sticker-level resolution
- Works with all advanced algorithms (gradient, error diffusion, dithering, etc.)

### Algorithm Preview Improvements (August 2025)
- Updated algorithm selector to appear on the right side of the screen for better workflow
- Fixed preview blurriness by using larger preview canvas (400px max) with proper aspect ratio
- Added crisp pixel rendering with imageRendering: 'pixelated' for sharp mosaic previews
- Disabled canvas image smoothing for better preview quality
- Maintains aspect ratio while providing clear visual representation of algorithm effects

### Grid Loading Animation (August 2025)
- Added smooth entrance animations using Framer Motion for enhanced user experience
- Implemented sliding sidebar animation with easing curves for professional feel
- Added canvas container animations with scale and fade effects
- Grid appears with elegant transition when page loads
- Sidebar slides in from left with opacity and position animations

### Advanced Background Customization (August 2025)
- Fixed default selected color to official UE Red (#B90000) matching WCA standards
- Added advanced background options with CSS gradients, patterns, and custom inputs
- Implemented layered canvas approach for complex CSS backgrounds (gradients, stripes, radials)
- Background div layer handles CSS effects while canvas remains transparent for complex patterns
- Custom text input accepts any CSS background property for unlimited customization
- Color picker for quick solid color selection with advanced pattern presets

### Auto Generator Right Panel (August 2025)
- Moved auto generator from left sidebar to dedicated right panel for better workflow
- Added toggle button in main toolbar (wand icon) for easy access
- Enhanced right panel design with gradient header and improved visual hierarchy
- Larger upload area with better visual feedback and hover effects
- Organized content with clear sections: upload, processing options, generation buttons, and tips
- Added helpful tips section explaining different generation modes and best practices
- Maintains all existing functionality while improving user experience and screen space usage

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript, using Vite as the build tool
- **UI Components**: Radix UI primitives with shadcn/ui component library for consistent design
- **Styling**: Tailwind CSS with CSS variables for theming support (light/dark modes)
- **State Management**: TanStack Query for server state management, React hooks for local state
- **Routing**: Wouter for lightweight client-side routing
- **Canvas Rendering**: HTML5 Canvas API for the main mosaic editor interface

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Database ORM**: Drizzle ORM configured for PostgreSQL
- **API Design**: RESTful API with JSON responses
- **File Handling**: Multer for multipart form data, Sharp for image processing
- **Development**: Hot module replacement via Vite middleware in development mode

### Data Storage Solutions
- **Primary Database**: PostgreSQL with Neon serverless driver
- **Schema**: Single `projects` table storing mosaic data as JSONB
- **Backup Storage**: In-memory storage fallback for development
- **Project Data Structure**: 
  - Mosaic dimensions and cube type configuration
  - Layer-based organization with opacity and visibility controls
  - Cube face data stored as 2D color arrays
  - Support for multiple color palettes

### Authentication and Authorization
- **Session Management**: Express sessions with PostgreSQL session store
- **Security**: CORS enabled, JSON body parsing with size limits
- Currently operates without user authentication (single-user mode)

### External Dependencies

- **Database**: Neon PostgreSQL serverless database
- **UI Framework**: Radix UI component primitives
- **Development Tools**: Replit integration with cartographer plugin and runtime error overlay
- **Image Processing**: Sharp library for server-side image manipulation
- **Validation**: Zod schema validation with Drizzle integration
- **Date Handling**: date-fns library for timestamp operations

The application supports real-time mosaic editing with undo/redo functionality, multiple export formats (.rm project files, PNG images), and comprehensive layer management for complex mosaic designs.