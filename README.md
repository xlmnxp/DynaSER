# DynaSER (Dynamic Server-Enhanced Rendering)

DynaSER is a cutting-edge web rendering solution that combines server-side rendering (SSR) with real-time interactivity. It leverages Deno, Puppeteer, and WebSockets to create a seamless, dynamic user experience while maintaining the benefits of server-side rendering.

## Features

- Server-side rendering for improved initial load times and SEO
- Real-time DOM updates via WebSockets
- Client-side interactivity without client-side JavaScript execution
- Secure content delivery with JavaScript and event attributes removed from rendered HTML
- Built with Deno for enhanced security and modern JavaScript features

## Prerequisites

- [Deno](https://deno.land/#installation) (version 1.20 or later)

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/xlmnxp/dynaser.git
   cd dynaser
   ```

2. No additional installation steps are required, as Deno doesn't use a package.json or node_modules.

## Usage

1. Start the server:
   ```
   deno run dev
   ```

2. Open a web browser and navigate to `http://localhost:3000`

## How It Works

1. The server uses Puppeteer to render a web page server-side.
2. When a client connects, the server sends the initial HTML content with all JavaScript and event handlers removed.
3. The server sets up a MutationObserver on the Puppeteer page to watch for DOM changes.
4. When changes occur, the server sends these changes to the client via WebSocket.
5. The client applies these changes to its DOM, keeping it in sync with the server-side render.
6. User interactions on the client are sent back to the server, which applies them to the Puppeteer page.

## Configuration

You can modify the `server.ts` file to change the following:

- Port numbers for the Express server, and WebSocket server
- The initial URL loaded in Puppeteer
- The elements observed for mutations
- The types of events listened for and transmitted

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## Acknowledgments

- [Deno](https://deno.land/) for the runtime environment
- [Puppeteer](https://pptr.dev/) for server-side browser automation
- [Express](https://expressjs.com/) for the web server framework
- [ws](https://github.com/websockets/ws) for WebSocket implementation

## Disclaimer

DynaSER is an experimental technology and may not be suitable for all production environments. Use at your own risk and thoroughly test before deploying to production.
