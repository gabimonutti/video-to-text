# Video to Text

A Next.js application that allows you to upload videos and extract text content through transcription, translation, and more.

## Features

- 🎥 **Video Upload**: Support for various video formats (MP4, WEBM, MOV)
- 🎙️ **Automatic Transcription**: Generate accurate text transcriptions from video audio
- 🔤 **Subtitle Generation**: Export transcriptions as SRT or VTT subtitle files
- 🌐 **Translation**: Translate transcriptions to multiple languages
- ✏️ **Edit Transcriptions**: Modify and correct generated text
- 🎯 **Interactive Timeline**: Click on transcription segments to jump to specific points in the video

## Technology Stack

- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe code
- **Tailwind CSS**: Styling and theme support
- **OpenAI Whisper API**: Audio transcription
- **OpenAI GPT API**: Translation services
- **React Player**: Video playback and controls
- **React Dropzone**: Drag-and-drop file uploads

## Getting Started

### Prerequisites

- Node.js 18.0 or higher
- An OpenAI API key

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd video-to-text
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.local.example` to `.env.local`
   - Add your OpenAI API key to `.env.local`

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Uploading a Video

1. Drag & drop a video file or use the file browser
2. Wait for the upload to complete

### Generating Transcription

1. Select the language of the video content
2. Click "Start Processing"
3. Wait for the extraction and transcription process to complete

### Editing Transcription

1. Click the edit icon next to any segment
2. Make your changes
3. Click "Save" to update the transcription

### Translating Content

1. Select the target language from the dropdown
2. Click "Translate"
3. Toggle between original and translated versions using the view switcher

### Exporting

Use the export buttons to download the transcription as:
- Plain text (.txt)
- SubRip Subtitle format (.srt)
- WebVTT format (.vtt)

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- OpenAI for their Whisper and GPT APIs
- React Player contributors
- Next.js team for the framework

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
