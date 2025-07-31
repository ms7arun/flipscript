# Chrome Rephraser React Extension

A powerful Chrome extension built with React + Vite that provides intelligent text rephrasing and comprehensive explanation capabilities using the Groq API.

## 🚀 Features

### Smart Rephrase
- **Multiple Tones**: Choose from 12 built-in tones (Professional, Casual, Friendly, Formal, etc.)
- **Custom Tones**: Create and save your own custom tones
- **Creativity Control**: Adjust rephrasing creativity from minimal to maximum changes
- **Auto-Rephrase**: Automatically rephrase selected text from context menu
- **History**: Save and review your rephrasing history

### Explain (Enhanced TL;DR)
Transform simple explanations into a comprehensive explanation assistant with **15 built-in explanation presets**:

#### Built-in Explanation Presets:
- **👶 Explain Like I'm 5** - Simple, childlike explanations using basic words
- **📚 Detailed** - Comprehensive, in-depth explanations covering all aspects
- **⚡ Concise** - Brief, to-the-point explanations with essential points only
- **🔬 Technical** - Expert-level explanations with proper terminology
- **💡 Example-Based** - Explanations using multiple concrete examples
- **📋 Step-by-Step** - Sequential, process-oriented breakdowns
- **🗣️ Layman's Terms** - Simple everyday language, no jargon
- **📝 Summary** - Key points and main takeaways format
- **⚖️ Compare & Contrast** - Comparative analysis with similar concepts
- **🎨 Visual Explanation** - Descriptive, imagery-focused explanations
- **🛠️ Practical Use Case** - Real-world applications and everyday uses
- **📜 History / Origin** - Historical context and development timeline
- **❌ Common Misconceptions** - Addresses myths and misunderstandings
- **📖 Storytelling** - Narrative-style explanations with story structure
- **🔗 Analogy-Based** - Explanations using metaphors and familiar comparisons

#### Advanced Features:
- **Custom Presets**: Create your own explanation styles with custom icons and descriptions
- **Search & Filter**: Quickly find presets with real-time search functionality
- **Grid Layout**: Modern card-based interface for easy preset selection
- **Default Mode**: Set your preferred explanation style in settings
- **Unified Prompt System**: Consistent, high-quality explanations across all presets

### Additional Features
- **Grammar Check**: Check and correct grammar in selected text
- **History Management**: View, search, and manage your rephrasing and explanation history
- **Theme Support**: Light, dark, and auto themes
- **Popover Mode**: Quick access via floating popover on web pages
- **Cross-tab Sync**: Seamless text sharing between tabs
- **Keyboard Shortcuts**: Ctrl/Cmd + Enter to trigger actions

## 🛠️ Installation

### Prerequisites
- Node.js 18+ and npm
- Chrome browser
- Groq API key (get one at [console.groq.com](https://console.groq.com/keys))

### Development Setup
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd chrome-rephraser-react
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the extension:
   ```bash
   npm run build
   ```

4. Load in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder

### Production Build
```bash
npm run build
```

## ⚙️ Configuration

### API Setup
1. Get your Groq API key from [console.groq.com](https://console.groq.com/keys)
2. Open the extension popup
3. Go to Settings → API Configuration
4. Enter your API key
5. Select your preferred AI model

### Settings
- **Default Tone**: Set your preferred rephrasing tone
- **Default Explanation Mode**: Choose your preferred explanation style
- **Auto-Rephrase/Explain**: Enable automatic processing from context menu
- **Theme**: Light, dark, or auto (system preference)
- **History**: Enable/disable history tracking
- **Popover**: Enable floating popover on web pages

## 🎯 Usage

### Rephrase Text
1. Select text on any webpage
2. Right-click and choose "Rephrase with FlipScript" or use the popover
3. Choose your preferred tone and creativity level
4. Click "Rephrase" to get your result

### Explain Text
1. Select text on any webpage
2. Right-click and choose "Explain with FlipScript" or use the popover
3. Choose from 15+ explanation presets or create your own
4. Click "Explain" to get your result

### Custom Presets
1. Open the Explain tab
2. Click the explanation style selector
3. Click "Create Custom Preset"
4. Fill in the details:
   - **Icon**: Choose an emoji or symbol
   - **Name**: Give your preset a name
   - **Description**: Brief description of the preset
   - **Style Description**: How this preset should explain things

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Markdown**: React Markdown with GFM
- **API**: Groq API for AI processing

### Project Structure
```
src/
├── popup/                 # Main extension popup
│   ├── components/        # React components
│   │   ├── RephraseTab.tsx
│   │   ├── TLDRTab.tsx   # Explain tab
│   │   ├── ExplanationPresetSelector.tsx
│   │   └── SettingsModal.tsx
│   └── main.tsx
├── background/            # Service worker
├── content/              # Content scripts
├── utils/                # Utilities and services
├── types/                # TypeScript type definitions
└── config/               # Configuration constants
```

### Key Components

#### ExplanationPresetSelector
Advanced preset selector with:
- Grid layout for 15+ presets
- Real-time search and filtering
- Custom preset creation/editing
- Smooth animations and transitions

#### Unified Prompt System
All explanations use a single, consistent prompt template:
```
"Explain [topic] using the [explanation_style] approach. Keep the explanation clear, helpful, and appropriate for the chosen style."
```

#### Custom Preset Management
- Create, edit, and delete custom presets
- Persistent storage in localStorage
- Integration with built-in presets
- Style description system for consistent results

## 🔧 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test` - Run tests

### Adding New Features
1. **New Explanation Presets**: Add to `EXPLANATION_PRESETS` in `src/config/constants.ts`
2. **New Tones**: Add to `TONES` array in constants
3. **New Components**: Create in `src/popup/components/`
4. **New Types**: Add to `src/types/index.ts`

### Testing
```bash
npm run test
```

## 📝 Changelog

### v2.0.0 - Explain Enhancement
- ✨ **15 Built-in Explanation Presets** - Comprehensive explanation styles
- 🎨 **Advanced Preset Selector** - Grid layout with search and filtering
- 🔧 **Custom Preset System** - Create, edit, and manage custom presets
- ⚙️ **Default Mode Settings** - Set preferred explanation style
- 🔄 **Unified Prompt System** - Consistent, high-quality explanations
- 🎯 **Renamed TL;DR to Explain** - More descriptive naming

### v1.0.0 - Initial Release
- Basic rephrasing functionality
- Grammar checking
- History management
- Theme support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [Groq](https://groq.com/) for providing the AI API
- [React](https://reactjs.org/) for the UI framework
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Lucide](https://lucide.dev/) for icons 