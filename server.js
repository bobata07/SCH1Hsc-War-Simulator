const http = require('http');
const fs = require('fs');
const path = require('path');

const host = '127.0.0.1';
const port = Number(process.env.PORT) || 3000;
const rootDir = path.join(__dirname, 'game');

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.ico': 'image/x-icon'
};

function send(res, statusCode, body, contentType = 'text/plain; charset=utf-8') {
  res.writeHead(statusCode, { 'Content-Type': contentType });
  res.end(body);
}

function resolveRequestPath(urlPathname) {
  const requestedPath = urlPathname === '/' ? '/index.html' : urlPathname;
  const normalizedPath = path.normalize(decodeURIComponent(requestedPath)).replace(/^(\.\.[/\\])+/, '');
  const fullPath = path.join(rootDir, normalizedPath);

  if (!fullPath.startsWith(rootDir)) {
    return null;
  }

  return fullPath;
}

const server = http.createServer((req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host || `${host}:${port}`}`);
  const filePath = resolveRequestPath(requestUrl.pathname);

  if (!filePath) {
    send(res, 403, 'Forbidden');
    return;
  }

  fs.stat(filePath, (statError, stats) => {
    if (statError) {
      send(res, 404, 'Not found');
      return;
    }

    const finalPath = stats.isDirectory() ? path.join(filePath, 'index.html') : filePath;
    const extension = path.extname(finalPath).toLowerCase();
    const contentType = mimeTypes[extension] || 'application/octet-stream';

    fs.readFile(finalPath, (readError, data) => {
      if (readError) {
        send(res, 500, 'Server error');
        return;
      }

      send(res, 200, data, contentType);
    });
  });
});

server.listen(port, host, () => {
  console.log(`War Simulator is running at http://${host}:${port}`);
  console.log('Press Ctrl+C to stop the server.');
});

server.on('error', (error) => {
  console.error(`Failed to start server: ${error.message}`);
  process.exit(1);
});
