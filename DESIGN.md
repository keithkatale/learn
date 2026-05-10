---
name: Lumina Modern EdTech
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#464652'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#777683'
  outline-variant: '#c7c5d4'
  surface-tint: '#4f54b4'
  primary: '#15157d'
  on-primary: '#ffffff'
  primary-container: '#2e3192'
  on-primary-container: '#9da1ff'
  inverse-primary: '#c0c1ff'
  secondary: '#006b5f'
  on-secondary: '#ffffff'
  secondary-container: '#6df5e1'
  on-secondary-container: '#006f64'
  tertiary: '#35007a'
  on-tertiary: '#ffffff'
  tertiary-container: '#5000b1'
  on-tertiary-container: '#ba98ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e1e0ff'
  primary-fixed-dim: '#c0c1ff'
  on-primary-fixed: '#04006d'
  on-primary-fixed-variant: '#373a9b'
  secondary-fixed: '#71f8e4'
  secondary-fixed-dim: '#4fdbc8'
  on-secondary-fixed: '#00201c'
  on-secondary-fixed-variant: '#005048'
  tertiary-fixed: '#eaddff'
  tertiary-fixed-dim: '#d2bbff'
  on-tertiary-fixed: '#25005a'
  on-tertiary-fixed-variant: '#5a00c6'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  display-lg:
    fontFamily: Montserrat
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Montserrat
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Montserrat
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  headline-md:
    fontFamily: Montserrat
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 30px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  caption:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1280px
  gutter: 24px
  margin-desktop: 48px
  margin-mobile: 16px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style

The brand personality is authoritative yet encouraging, positioning itself as a premium gateway to mastery. This design system bridges the gap between traditional academic rigor and modern digital fluency. The emotional response should be one of "quiet confidence"—where the interface recedes to let the content lead, reducing cognitive load while maintaining a sophisticated, high-end aesthetic.

The visual style is **Corporate / Modern** with a strong emphasis on **Minimalism**. It utilizes expansive white space for discovery and research phases, transitioning into a focused, low-light environment for the actual learning experience. The design avoids unnecessary decorative flourishes, opting instead for structural integrity through precise alignment, generous breathing room, and high-impact visual assets.

## Colors

This design system employs a "Dual-Context" color strategy. 

For **Discovery and Browsing**, the system uses a light-mode foundation with `Neutral White` backgrounds and `Deep Indigo` primary accents to establish trust and professionalism.

For **Learning and Video Playback**, the system shifts to a "Deep Blue" dark mode environment. This transition is functional, designed to minimize eye strain and eliminate peripheral distractions.

- **Primary (Deep Indigo):** Used for navigation, primary branding, and core interactive elements.
- **Secondary (Vibrant Teal):** Reserved for progress indicators, success states, and high-priority Calls to Action (CTAs).
- **Tertiary (Electric Purple):** Used sparingly for secondary highlights or to distinguish between different course tracks.
- **Emerald Green:** Dedicated strictly to completion states, "Correct" feedback, and achievement notifications.

## Typography

The typography hierarchy is designed for maximum legibility during long-form study sessions. 

**Montserrat** is used for headings to provide a geometric, modern, and confident structure. Headlines should utilize tighter letter-spacing and bold weights to create a clear visual anchor on the page.

**Inter** is utilized for all body copy and UI labels. To prevent reader fatigue, the body-text levels feature an increased line height (1.6x) compared to standard applications. This "breathable" text strategy is essential for technical or dense educational content. 

Label styles should be used for metadata (e.g., video duration, difficulty level) and always maintain a higher weight to ensure they remain distinct from body paragraphs.

## Layout & Spacing

This design system follows an **8px grid system** for consistent vertical and horizontal rhythm. 

The layout utilizes a **12-column fluid grid** for the Discovery dashboard, allowing content cards to reflow based on screen width. For the Learning Environment (Video Player), the system switches to a **fixed-center focus layout**. In this mode, the primary content is constrained to a 10-column span to prevent the eye from having to travel too far across wide-screen monitors.

- **Desktop:** 12 columns, 24px gutters, 48px outside margins.
- **Tablet:** 8 columns, 16px gutters, 32px outside margins.
- **Mobile:** 4 columns, 16px gutters, 16px outside margins. Content stacks vertically; sidebars convert to bottom-sheets or overlay menus.

## Elevation & Depth

Visual hierarchy is established through a combination of **Ambient Shadows** and **Tonal Layering**.

In the light discovery mode, cards and primary containers use extra-diffused, low-opacity shadows (10% opacity Deep Indigo tint) to create a subtle lift without appearing dated. This creates a clear "layered" effect where the content feels interactive.

In the dark learning player, depth is created through **Tonal Layering** rather than shadows. The base background is the darkest value (`#0B0E14`), while interactive panels like "Lesson Notes" or "Course Content" use a slightly lighter "Surface" tier. 

Low-contrast outlines (1px solid, 8% opacity) are used on all cards to maintain structural definition even when shadows are subtle.

## Shapes

The shape language is defined by **Subtle Roundedness**. A standard radius of 8px (`0.5rem`) is applied to all standard components like input fields, small buttons, and small thumbnails. 

Larger containers, such as course cards and main video player wrappers, utilize a 16px (`1rem`) radius to soften the professional aesthetic and make the platform feel more approachable. 

Iconography should follow this logic, avoiding sharp 90-degree corners in favor of 2px corner smoothing to match the overall UI character.

## Components

### Buttons
Buttons use a heavy weight of Inter and 8px rounded corners. The **Primary Button** is Deep Indigo with white text. The **Secondary/Action Button** uses the Teal accent to signify progress-related tasks (e.g., "Start Lesson").

### Video Thumbnails
Thumbnails are the most high-impact visual elements. They must feature a 12px corner radius and a subtle inner-glow stroke to ensure they pop against both light and dark backgrounds. A "Duration" badge should sit in the bottom-right corner with a semi-transparent dark background.

### Progress Bars
Used extensively for course tracking. These utilize the **Vibrant Teal** for the filled state and a light grey (light mode) or deep navy (dark mode) for the track. The height should be a thin 4px for subtle tracking or a robust 8px for major milestones.

### Cards
Discovery cards use the `rounded-lg` variable and a soft shadow. Content is organized with a clear hierarchy: Image > Category (Label-md) > Title (Headline-md) > Instructor/Duration (Caption).

### Input Fields
Clean, minimalist design with a 1px border. The border shifts to Deep Indigo on focus. Error states are indicated by a 2px bottom-border in a soft red, maintaining the professional look without overwhelming the user.

### Learning Sidebar
In the video environment, the sidebar uses a "Surface" tier background with active lessons highlighted using a Teal left-border accent and a subtle Indigo background tint.