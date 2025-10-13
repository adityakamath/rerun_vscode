# Change Log

All notable changes to the "Rerun Viewer" extension will be documented in this file.

## [0.0.1] - 2025-01-XX

### Initial Release

#### Features
- **Click-to-Open**: Open `.rrd` files directly by clicking in the VS Code Explorer
- **Interactive Viewer**: Launch empty viewer via Command Palette for drag-and-drop workflow
- **Drag & Drop Support**: Load `.rrd` files by dragging from Explorer (only in interactive mode)
- **Live Data Streaming**: Connect to live Rerun data streams via WebSocket
- **Read-Only Views**: Files opened by clicking are read-only to prevent accidental modifications
- **WebGPU Rendering**: High-performance rendering with automatic WebGL fallback
- **Latest Rerun Viewer**: Always uses the newest Rerun web viewer features

#### Technical Details
- Uses latest Rerun Web Viewer (automatically updated with extension updates)
- Custom editor provider for `.rrd` files
- TypeScript-based extension architecture
- Bundled webview with esbuild for optimal performance
- WASM-based viewer with proper Content Security Policy

#### Known Limitations
- No support for direct URDF file loading (use Rerun Python SDK to convert to RRD)
- Large files (>1GB) may have performance constraints
- Requires VS Code 1.85.0 or higher

---

## Future Plans

### Planned Features
- Additional file format support
- Customizable viewer settings
- Performance improvements for large files
- Enhanced keyboard shortcuts
- Screenshot and export capabilities

### Under Consideration
- Collaborative viewing features
- Custom data overlays
- Integration with Jupyter notebooks
- Timeline annotations

---

**Note**: This extension is in active development. Feature requests and bug reports are welcome on [GitHub Issues](https://github.com/yourusername/rerun-vscode/issues).
