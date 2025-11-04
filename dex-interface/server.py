#!/usr/bin/env python3
"""
NorSwap DEX Interface Server
Serves the web-based swap interface for Nor Chain
"""

import http.server
import socketserver
import os
from pathlib import Path

PORT = 8080
DIRECTORY = Path(__file__).parent

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(DIRECTORY), **kwargs)
    
    def end_headers(self):
        # Add CORS headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

if __name__ == '__main__':
    os.chdir(DIRECTORY)
    
    with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
        print("=" * 80)
        print("🌙 NOORSWAP DEX INTERFACE")
        print("=" * 80)
        print(f"\n✅ Server running at: http://localhost:{PORT}")
        print(f"✅ Interface: http://localhost:{PORT}/index.html")
        print("\n📱 Instructions:")
        print("   1. Open the URL above in your browser")
        print("   2. Connect MetaMask to Nor Chain")
        print("   3. Start swapping tokens!")
        print("\n🔗 Network Details:")
        print("   Chain ID: 65001")
        print("   RPC: http://3.91.50.187:8545")
        print("\n" + "=" * 80)
        print("Press Ctrl+C to stop the server\n")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\n👋 Server stopped")
