#!/usr/bin/env python3
import sys
sys.path.insert(0, '/home/angeyannick/.local/lib/python3.12/site-packages')

import pymssql

print("Test de connexion SQL Server...")

try:
    conn = pymssql.connect(
        server='192.168.0.8',
        port=1433,
        user='ARTI\\admin',
        password='tranSPort2021!',
        database='eARTI_DB2',
        timeout=10
    )
    print("✅ Connexion SQL Server OK!")
    cursor = conn.cursor(as_dict=True)
    cursor.execute("SELECT COUNT(*) as total FROM NoteDG")
    result = cursor.fetchone()
    print(f"✅ Notes dans eARTI_DB2: {result['total']}")
    cursor.close()
    conn.close()
except Exception as e:
    print(f"❌ Erreur: {e}")
    sys.exit(1)
