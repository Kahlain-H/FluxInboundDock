#!/usr/bin/env python3
"""
Serveur proxy simple pour Amazon YMS API
Alternative à Node.js pour contourner les problèmes CORS
"""

import http.server
import socketserver
import json
import urllib.request
import urllib.parse
from urllib.error import HTTPError, URLError
import sys
from datetime import datetime

class YMSProxyHandler(http.server.SimpleHTTPRequestHandler):
    def do_OPTIONS(self):
        """Gérer les requêtes CORS preflight"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()

    def do_POST(self):
        """Gérer les requêtes POST pour le proxy API"""
        if self.path == '/api/yms/locations':
            self.handle_yms_proxy()
        else:
            self.send_error(404, "Endpoint not found")

    def do_GET(self):
        """Gérer les requêtes GET"""
        if self.path == '/api/health':
            self.handle_health_check()
        else:
            self.send_error(404, "Endpoint not found")

    def handle_health_check(self):
        """Point de contrôle de santé"""
        response = {
            'status': 'OK',
            'timestamp': datetime.now().isoformat(),
            'message': 'Amazon YMS Proxy Server is running (Python)'
        }
        
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(response).encode())

    def handle_yms_proxy(self):
        """Proxy pour l'API Amazon YMS"""
        try:
            # Lire les données de la requête
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            request_data = json.loads(post_data.decode('utf-8'))
            
            print(f"🌐 Proxy: Requête reçue du frontend")
            print(f"📦 Payload: {request_data}")
            
            vrids = request_data.get('vrids', [])
            token = request_data.get('token', '')
            facility = request_data.get('facility', 'YOW1')
            
            if not vrids:
                self.send_error_response(400, "VRID array required")
                return
                
            if not token:
                self.send_error_response(400, "Authorization token required")
                return
            
            print(f"🎯 Recherche d'emplacements pour {len(vrids)} VRID")
            
            # Préparer la requête pour Amazon YMS
            api_url = 'https://na.api.amazonlogistics.com/yms/location-lookup'
            api_payload = {
                'vrids': vrids,
                'includeLocationDetails': True,
                'facility': facility
            }
            
            print(f"📡 Appel API Amazon YMS: {api_url}")
            
            # Créer la requête HTTP
            data = json.dumps(api_payload).encode('utf-8')
            req = urllib.request.Request(api_url, data=data)
            req.add_header('Authorization', f'Bearer {token}')
            req.add_header('Content-Type', 'application/json')
            req.add_header('Accept', 'application/json')
            req.add_header('X-API-Version', '2.0')
            req.add_header('X-Facility-Code', facility)
            req.add_header('X-Request-ID', f'python-proxy-{int(datetime.now().timestamp())}')
            
            # Faire l'appel à l'API
            try:
                with urllib.request.urlopen(req, timeout=30) as response:
                    response_data = response.read().decode('utf-8')
                    api_response = json.loads(response_data)
                    
                    print(f"✅ Réponse API reçue: {api_response}")
                    
                    # Extraire les emplacements
                    locations = []
                    if 'locations' in api_response and isinstance(api_response['locations'], list):
                        locations = api_response['locations']
                    elif 'results' in api_response and isinstance(api_response['results'], list):
                        locations = api_response['results']
                    elif 'data' in api_response and isinstance(api_response['data'], list):
                        locations = api_response['data']
                    
                    print(f"📍 {len(locations)} emplacements trouvés")
                    
                    # Préparer la réponse
                    proxy_response = {
                        'success': True,
                        'locations': locations,
                        'totalCount': len(locations),
                        'requestedVrids': len(vrids),
                        'retrievedAt': datetime.now().isoformat(),
                        'rawResponse': api_response
                    }
                    
                    self.send_json_response(200, proxy_response)
                    
            except HTTPError as e:
                error_body = e.read().decode('utf-8') if e.fp else ''
                print(f"❌ Erreur HTTP API: {e.code} {e.reason} - {error_body}")
                self.send_error_response(e.code, f"Amazon YMS API Error: {e.code} {e.reason}", error_body)
                
            except URLError as e:
                print(f"❌ Erreur URL: {e.reason}")
                self.send_error_response(500, f"Network error: {e.reason}")
                
        except json.JSONDecodeError as e:
            print(f"❌ Erreur JSON: {e}")
            self.send_error_response(400, "Invalid JSON in request")
            
        except Exception as e:
            print(f"❌ Erreur proxy: {e}")
            self.send_error_response(500, f"Proxy server error: {str(e)}")

    def send_json_response(self, status_code, data):
        """Envoyer une réponse JSON"""
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    def send_error_response(self, status_code, message, details=None):
        """Envoyer une réponse d'erreur"""
        error_data = {
            'error': message,
            'timestamp': datetime.now().isoformat()
        }
        if details:
            error_data['details'] = details
            
        self.send_json_response(status_code, error_data)

def run_server(port=3001):
    """Démarrer le serveur proxy"""
    try:
        with socketserver.TCPServer(("", port), YMSProxyHandler) as httpd:
            print(f"🚀 Amazon YMS Proxy Server (Python) started on http://localhost:{port}")
            print(f"📡 Ready to proxy requests to Amazon YMS API")
            print(f"🔗 Health check: http://localhost:{port}/api/health")
            print(f"⏹️  Press Ctrl+C to stop")
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except OSError as e:
        if e.errno == 10048:  # Port already in use
            print(f"❌ Port {port} is already in use. Try a different port or stop the other service.")
        else:
            print(f"❌ Error starting server: {e}")

if __name__ == "__main__":
    port = 3001
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            print("Invalid port number. Using default 3001.")
    
    run_server(port)