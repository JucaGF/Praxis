import os, time, re, json
try:
    # Try environment first
    secret = os.environ.get('SUPABASE_JWT_SECRET')
    if not secret:
        # Fallback: read backend/.env
        env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '.env'))
        with open(env_path, 'r', encoding='utf-8') as f:
            text = f.read()
        m = re.search(r"SUPABASE_JWT_SECRET\s*=\s*\"?(.*?)\"?\s*$", text, flags=re.M)
        if m:
            secret = m.group(1)
    if not secret:
        raise SystemExit('SUPABASE_JWT_SECRET not found in env or .env')
    import jwt
    payload = {
        'sub': '00000000-0000-0000-0000-000000000001',
        'email': 'test@local',
        'role': 'authenticated',
        'aud': 'authenticated',
        'exp': int(time.time()) + 3600
    }
    token = jwt.encode(payload, secret, algorithm='HS256')
    # PyJWT may return bytes in older versions
    if isinstance(token, bytes):
        token = token.decode('utf-8')
    print(token)
except Exception as e:
    print('ERROR:', e)
    raise
