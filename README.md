# Rerun Viewer for VSCode

[![VS Code Marketplace](https://img.shields.io/badge/VS%20Code-Marketplace-blue)](https://marketplace.visualstudio.com/items?itemName=rerun.rerun-viewer)
[![Version](https://img.shields.io/badge/version-0.0.1-green)](https://github.com/yourusername/rerun-vscode)

View [Rerun](https://rerun.io) recordings (`.rrd` files) directly in Visual Studio Code. The Rerun Viewer extension provides seamless integration of the Rerun visualization platform into your VSCode workflow, allowing you to visualize multimodal data, robotics recordings, and time-series data without leaving your editor.

![Rerun Viewer in Action](https://raw.githubusercontent.com/yourusername/rerun-vscode/main/images/screenshot.png)

## Features

✨ **Click-to-Open RRD Files** - Simply click on any `.rrd` file in your workspace to visualize it

📂 **Drag & Drop Support** - Open the viewer from the command palette and drag `.rrd` files to load them

🎯 **Command Palette Integration** - Quick access via `Rerun: Open Viewer` command

🔄 **Live Data Streaming** - Connect to live Rerun data streams via WebSocket

⚡ **High Performance** - WebGPU-accelerated rendering with automatic WebGL fallback

🎨 **Latest Rerun Features** - Always uses the latest Rerun web viewer with all new features and improvements

🔒 **Read-Only RRD Views** - Files opened by clicking are read-only, preventing accidental modifications

## Installation

### From VS Code Marketplace (Recommended)

1. Open VS Code
2. Go to Extensions (`Cmd+Shift+X` on Mac, `Ctrl+Shift+X` on Windows/Linux)
3. Search for "Rerun Viewer"
4. Click Install

### From VSIX File

1. Download the `.vsix` file from [Releases](https://github.com/yourusername/rerun-vscode/releases)
2. Open VS Code
3. Go to Extensions (`Cmd+Shift+X` on Mac, `Ctrl+Shift+X` on Windows/Linux)
4. Click the `...` menu → "Install from VSIX..."
5. Select the downloaded `.vsix` file

## Usage

### Opening RRD Files by Clicking

The easiest way to view a Rerun recording:

1. Open your workspace containing `.rrd` files
2. Click on any `.rrd` file in the Explorer
3. The Rerun Viewer opens automatically with the file loaded
4. Navigate through time, inspect data, and explore your recording

**Note:** Files opened this way are read-only and do not support drag-and-drop of additional files.

### Using the Interactive Viewer

For an interactive experience where you can load multiple files:

1. Open the Command Palette:
   - Mac: `Cmd+Shift+P`
   - Windows/Linux: `Ctrl+Shift+P`
2. Type "Rerun: Open Viewer" and press Enter
3. Drag and drop `.rrd` files from the Explorer into the viewer window
4. Load different recordings by dropping new files

### Connecting to Live Data

Stream data directly from your application to the viewer:

**Python Example:**
```python
import rerun as rr
import numpy as np

# Initialize and connect to the viewer
rr.init("my_application")
rr.connect()  # Default: ws://localhost:9876

# Log some data
rr.log("points", rr.Points3D(np.random.rand(10, 3)))
rr.log("image", rr.Image(np.random.rand(480, 640, 3)))
```

**Rust Example:**
```rust
use rerun::external::glam;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let rec = rerun::RecordingStreamBuilder::new("my_app").connect()?;

    rec.log(
        "points",
        &rerun::Points3D::new([(0.0, 0.0, 0.0), (1.0, 1.0, 1.0)]),
    )?;

    Ok(())
}
```

The viewer automatically detects incoming connections and displays your data in real-time.

## Requirements

- **VS Code**: Version 1.85.0 or higher
- **Rerun SDK** (for live streaming): Install via `pip install rerun-sdk` or cargo

## Extension Settings

This extension contributes the following commands:

* `rerun.openViewer`: Open an empty Rerun Viewer window

## Keyboard Shortcuts

The Rerun Viewer inherits all keyboard shortcuts from the Rerun web viewer:

- **Space**: Play/pause timeline
- **Arrow Keys**: Navigate through time
- **Scroll**: Zoom timeline
- **Click + Drag**: Pan in 2D/3D views
- **Right Click + Drag**: Rotate in 3D views

For a complete list of shortcuts, see the [Rerun documentation](https://www.rerun.io/docs).

## Known Limitations

- **URDF Support**: Direct URDF file loading is not supported. Convert URDF files to RRD format using the Rerun Python SDK first
- **File Size**: Very large RRD files (>1GB) may take time to load due to browser memory constraints
- **WebGPU**: Some older systems may fall back to WebGL, which has reduced performance

## Troubleshooting

### Viewer shows blank screen

- Check the Developer Console (Help → Toggle Developer Tools) for error messages
- Ensure your VS Code is version 1.85.0 or higher
- Try reloading the window (`Cmd+R` on Mac, `Ctrl+R` on Windows/Linux)

### RRD file won't load

- Verify the file is a valid Rerun recording (`.rrd` extension)
- Check file permissions
- Try opening the file with the standalone Rerun viewer to verify it's not corrupted

### Drag and drop not working

- Make sure you're using the interactive viewer (Command Palette → "Rerun: Open Viewer")
- Drag and drop is disabled for read-only views (files opened by clicking)
- Only `.rrd` files are supported

## Development

### Building from Source

```bash
# Clone the repository
git clone https://github.com/yourusername/rerun-vscode.git
cd rerun-vscode

# Install dependencies
npm install

# Compile TypeScript and bundle webview
npm run compile
npm run compile:webview

# Package the extension
npx @vscode/vsce package

# Install in VS Code
code --install-extension rerun-viewer-0.0.1.vsix
```

### Project Structure

```
rerun-vscode/
├── src/
│   ├── extension.ts           # Main extension entry point
│   └── rerunViewProvider.ts   # Custom editor for .rrd files
├── webview/
│   ├── viewer.ts              # Webview client code
│   └── build.mjs              # Webview bundler
├── package.json               # Extension manifest
├── tsconfig.json              # TypeScript config
└── README.md                  # This file
```

### Running in Debug Mode

1. Open the project in VS Code
2. Press `F5` to launch Extension Development Host
3. Test your changes in the new window

### Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure your code follows the existing style and includes appropriate tests.

## Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/rerun-vscode/issues)
- **Rerun Documentation**: [rerun.io/docs](https://www.rerun.io/docs)
- **Rerun Discord**: [Join the community](https://discord.gg/rerun)

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for release history.

## License

This extension is dual-licensed under MIT OR Apache-2.0, matching Rerun's licensing. See [LICENSE-MIT](LICENSE-MIT) and [LICENSE-APACHE](LICENSE-APACHE) for details.

## Acknowledgments

- Built with [Rerun](https://rerun.io) - The visualization framework for multimodal data
- Powered by the latest Rerun Web Viewer
- Icon and branding courtesy of Rerun.io

---

**Made with ❤️ by the Rerun community**
