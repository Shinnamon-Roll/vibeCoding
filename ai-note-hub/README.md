# 🚀 AI Note Hub

> **AI-Enhanced Note-Taking Application** with semantic search, intelligent assistant, and meeting transcription.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![React](https://img.shields.io/badge/react-18.3-61dafb.svg)
![Vite](https://img.shields.io/badge/vite-7.2-646cff.svg)

---

## ✨ Features

### 📝 Smart Note Management
- **Rich text editor** with auto-save
- **Tag system** with AI-powered suggestions
- **Favorites** and **archiving**
- **Attachments** support (images, files)
- **Export/Import** notes as JSON

### 🔍 Semantic Search
- **Conceptual matching** using TF-IDF embeddings
- **Vector similarity** with cosine distance
- Search for ideas, not just keywords

### 🤖 AI Assistant
- **Context-aware** responses
- **Summarization** of notes
- **Text rewriting** (professional, casual, concise)
- **Smart search** across your notes

### 🎙️ Meeting Transcription
- **Real-time** speech-to-text
- **Auto-generated summaries**
- **Key points** extraction
- **Action items** detection

### 🎨 Premium Design
- **Glassmorphism** UI with frosted glass effects
- **Vibrant gradients** and smooth animations
- **Dark mode** by default
- **Fully responsive** (desktop to mobile)

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm

### Installation

```bash
# Navigate to project directory
cd ai-note-hub

# Install dependencies (already done)
npm install

# Start development server
npm run dev
```

The app will be available at **http://localhost:5173/**

### Production Build

```bash
npm run build
npm run preview
```

---

## 📖 Usage Guide

### Creating Notes
1. Click **"New Note"** in the sidebar
2. Type your title and content
3. Add tags by typing and pressing Enter
4. Notes auto-save after 1 second

### Semantic Search
1. Type query in search bar at the top
2. Results ranked by conceptual similarity
3. Click any note to open in editor

### AI Assistant
1. Click the **chat icon** (💬) in the header
2. Try commands like:
   - "summarize this note"
   - "find notes about [topic]"
   - "rewrite this professionally"
   - "how many notes do I have?"

### Meeting Recording
1. Click the **microphone icon** (🎤) in the header
2. Allow microphone access
3. Speak naturally - transcription appears in real-time
4. Click "Stop & Save" to create a note with:
   - Full transcript
   - Auto-generated summary
   - Key points and action items

---

## 🏗️ Architecture

```
Frontend:  React 18 + Vite
Storage:   IndexedDB (Dexie.js)
AI:        Local TF-IDF embeddings
Speech:    Web Speech API
Icons:     Lucide React
Dates:     date-fns
```

### Project Structure

```
src/
├── components/
│   ├── Layout/          # Sidebar, Header
│   ├── Notes/           # NoteList, NoteEditor
│   ├── AI/              # AssistantChat
│   └── Meeting/         # RecordingInterface
├── services/
│   ├── storage.js       # IndexedDB operations
│   ├── ai.js            # Semantic search, summarization
│   └── transcription.js # Web Speech API
└── styles/
    └── index.css        # Complete design system
```

---

## 🎨 Design System

### Colors
- **Primary**: Purple (270°) → Pink (330°)
- **Secondary**: Blue (200°) → Purple (280°)
- **Accent**: Orange (30°) → Yellow (45°)
- **Success**: Green (140°)

### Typography
- **Primary**: Inter (300-800)
- **Code**: Fira Code (400-500)

### Effects
- Glassmorphism with `backdrop-filter: blur(20px)`
- Glow effects on focus states
- Smooth transitions (150-350ms)

---

## 🧠 AI Implementation

### Semantic Search
Uses **TF-IDF** (Term Frequency-Inverse Document Frequency) for creating text embeddings:

1. Tokenize text (remove punctuation, lowercase)
2. Calculate word frequencies
3. Create normalized vector
4. Compute cosine similarity between query and notes

**Formula**: `similarity = (A · B) / (||A|| × ||B||)`

### Summarization
**Extractive approach**:
- Score sentences by content word density
- Select highest-scoring sentences
- Maintain max length constraint

### Transcription
Powered by **Web Speech API**:
- Continuous recognition
- Interim results for real-time display
- Final results stored in note

---

## 🔒 Privacy & Security

- ✅ **100% local-first** - all data stored in browser
- ✅ **No cloud services** by default
- ✅ **No API keys required**
- ✅ **No tracking or analytics**
- ✅ **Export your data** anytime

---

## 🌐 Browser Compatibility

| Feature | Chrome | Edge | Safari | Firefox |
|---------|--------|------|--------|---------|
| Notes & Search | ✅ | ✅ | ✅ | ✅ |
| AI Assistant | ✅ | ✅ | ✅ | ✅ |
| Transcription | ✅ | ✅ | ⚠️ | ❌ |

**Note**: Web Speech API works best in Chrome/Edge. Safari has limited support. Firefox doesn't support it yet.

---

## 📱 Responsive Design

- **Desktop** (>1024px): Dual-pane layout with sidebar
- **Tablet** (768-1024px): Collapsed sidebar
- **Mobile** (<768px): Icon-only nav, single-pane view

---

## 🧪 Testing

### Manual Test Checklist

- [ ] Create, edit, delete notes
- [ ] Add/remove tags
- [ ] Toggle favorites
- [ ] Search with semantic matching
- [ ] Chat with AI assistant
- [ ] Record and transcribe meeting
- [ ] Export/import data
- [ ] Test on mobile device

### Known Limitations

1. **Embeddings**: Simple TF-IDF, not context-aware like GPT
2. **Transcription**: Requires microphone permission
3. **Storage**: Limited by browser IndexedDB quota (~50MB typical)

---

## 🛠️ Development

### Available Scripts

```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

### Tech Stack Details

- **React 18.3** - UI library
- **Vite 7.2** - Build tool
- **Dexie 4.x** - IndexedDB wrapper
- **Lucide React** - Icon library
- **date-fns** - Date formatting

---

## 🚧 Future Roadmap

### Planned Features
- [ ] Cloud sync (optional)
- [ ] Markdown rendering
- [ ] Note linking
- [ ] Folders/notebooks
- [ ] Collaborative editing
- [ ] Better AI models (OpenAI integration)
- [ ] PDF export
- [ ] Keyboard shortcuts
- [ ] Themes (light mode, custom colors)

---

## 📄 License

MIT License - feel free to use this project however you'd like!

---

## 🙏 Acknowledgments

Built with modern web technologies and AI-powered features for a premium note-taking experience.

**Key Technologies:**
- React & Vite for blazing-fast development
- IndexedDB for robust local storage
- Web Speech API for transcription
- Custom TF-IDF implementation for semantic search

---

## 📞 Support

For issues or questions:
1. Check the [walkthrough documentation](walkthrough.md)
2. Review the code comments
3. Open an issue on GitHub

---

**Made with ❤️ and AI**
