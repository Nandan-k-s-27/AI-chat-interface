# AI Chat Interface

A modern AI chat interface built with React, TypeScript, and Tailwind CSS featuring a beautiful glassmorphism design.

## Features

- **Glassmorphism UI**: Beautiful glass-like transparent components with blur effects
- **Dark/Light Theme**: Toggle between light and dark modes with smooth transitions
- **Interactive Wave Effect**: Click anywhere on the landing page to create ripple animations
- **AI Chat Interface**: Full-featured chat interface with message history and typing indicators
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Accessibility**: Keyboard navigation and reduced motion support

## Tech Stack

- **React 19** - UI library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Lucide React** - Beautiful icons

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Nandan-k-s-27/AI-chat-interface.git
cd AI-chat-interface
```

2. Install dependencies:
```bash
cd app
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

## Project Structure

```
app/
├── src/
│   ├── components/
│   │   └── ui/           # UI components (buttons, inputs, chat interface)
│   ├── hooks/            # Custom React hooks
│   │   ├── useTheme.tsx  # Theme management
│   │   └── use-auto-resize-textarea.ts
│   ├── lib/
│   │   └── utils.ts      # Utility functions
│   ├── App.tsx           # Main application component
│   ├── App.css           # Application styles
│   ├── index.css         # Global styles
│   └── main.tsx          # Application entry point
├── public/               # Static assets
└── index.html            # HTML entry point
```

## Usage

### Landing Page
The landing page features a centered input field with a beautiful nature background. Click anywhere to see the wave ripple effect. Type a message and press Enter or click the send button to enter chat mode.

### Chat Mode
In chat mode, you can have conversations with the AI assistant. Messages appear with glassmorphism styling, and the AI responds with simulated responses.

### Theme Toggle
Click the sun/moon icon in the top-right corner to switch between light and dark themes.

## Customization

### Colors
Edit the CSS variables in `src/App.css` to customize the color scheme:

```css
:root {
  --accent-color: #818cf8;
  --accent-hover: #6366f1;
  --input-bg: rgba(0, 0, 0, 0.35);
  --border-color: rgba(255, 255, 255, 0.3);
}
```

### Background Images
Replace the Unsplash image URLs in `src/App.tsx` with your own images.

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Author

Nandan K S
