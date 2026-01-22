# -*- coding: utf-8 -*-
"""
Serveur Web Simple pour FluxInboundDock
Permet l'accès multi-PC sur le réseau local
"""
import http.server
import socketserver
import socket
import webbrowser
import threading
import time

PORT = 8080

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Ajout des headers CORS pour éviter les problèmes
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

def get_local_ip():
    """Obtient l'adresse IP locale de la machine"""
    try:
        # Connexion temporaire pour obtenir l'IP locale
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

def open_browser():
    """Ouvre automatiquement le navigateur après 2 secondes"""
    time.sleep(2)
    webbrowser.open(f'http://localhost:{PORT}')

if __name__ == "__main__":
    # Obtenir l'IP locale
    local_ip = get_local_ip()
    
    print("=" * 60)
    print("🚀 FluxInboundDock - Serveur Web Multi-PC")
    print("=" * 60)
    print(f"📡 Port: {PORT}")
    print(f"🖥️  IP locale: {local_ip}")
    print("")
    print("🔗 URLs d'accès:")
    print(f"   • Local (ce PC): http://localhost:{PORT}")
    print(f"   • Réseau (autres PC): http://{local_ip}:{PORT}")
    print("")
    print("📋 Instructions pour autres PC:")
    print(f"   1. Ouvrir un navigateur")
    print(f"   2. Aller à: http://{local_ip}:{PORT}")
    print(f"   3. Le site FluxInboundDock s'affichera")
    print("")
    print("⚠️  Note: Vérifiez que le firewall Windows autorise Python")
    print("🛑 Pour arrêter: Ctrl+C")
    print("=" * 60)
    
    try:
        # Démarrer le serveur sur toutes les interfaces (0.0.0.0)
        with socketserver.TCPServer(("0.0.0.0", PORT), CustomHTTPRequestHandler) as httpd:
            print(f"✅ Serveur démarré avec succès!")
            print(f"📂 Répertoire servi: {httpd.server_address}")
            
            # Ouvrir le navigateur automatiquement
            browser_thread = threading.Thread(target=open_browser)
            browser_thread.daemon = True
            browser_thread.start()
            
            print(f"🌐 En attente de connexions...")
            httpd.serve_forever()
            
    except PermissionError:
        print(f"❌ Erreur: Permission refusée sur le port {PORT}")
        print(f"💡 Essayez un port différent ou lancez en tant qu'administrateur")
    except OSError as e:
        if "Address already in use" in str(e):
            print(f"❌ Erreur: Le port {PORT} est déjà utilisé")
            print(f"💡 Fermez l'autre application ou changez de port")
        else:
            print(f"❌ Erreur: {e}")
    except KeyboardInterrupt:
        print(f"\n🛑 Serveur arrêté par l'utilisateur")
        print(f"👋 Au revoir!")