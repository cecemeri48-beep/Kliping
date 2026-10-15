"""Deploy hook remains a secret; never print its value or provider response."""
import os,sys,time
from urllib.parse import urlparse
import requests
url=os.environ.get('VERCEL_DEPLOY_HOOK','');parsed=urlparse(url)
if parsed.scheme!='https' or parsed.hostname!='api.vercel.com' or not parsed.path.startswith('/v1/integrations/deploy/') or parsed.username or parsed.password:
    print('Secret VERCEL_DEPLOY_HOOK bukan deploy hook Vercel yang valid.',file=sys.stderr);sys.exit(1)
for attempt in range(3):
    try:
        r=requests.post(url,timeout=25,allow_redirects=False)
        if 200<=r.status_code<300:
            print('Deployment Vercel diminta. Tunggu status Ready di Vercel.');sys.exit(0)
    except requests.RequestException:pass
    time.sleep(2**attempt)
print('Pemicu deployment gagal. Katalog tersimpan; jalankan redeploy dari Vercel.',file=sys.stderr);sys.exit(1)
