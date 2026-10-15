"""Retry the deployment after a preceding failed workflow; no extra credential."""
import json,os,urllib.request,urllib.parse
repo=os.environ.get('GITHUB_REPOSITORY','');branch=os.environ.get('TARGET_BRANCH','main');retry=False
if repo and len(repo.split('/'))==2:
    url='https://api.github.com/repos/'+repo+'/actions/workflows/hope-library-sync.yml/runs?'+urllib.parse.urlencode({'status':'completed','per_page':1,'branch':branch})
    headers={'Accept':'application/vnd.github+json','User-Agent':'HOPE-Library-Sync'}
    token=os.environ.get('GH_TOKEN')
    if token:headers['Authorization']='Bearer '+token
    try:
        with urllib.request.urlopen(urllib.request.Request(url,headers=headers),timeout=15) as response: data=json.load(response)
        runs=data.get('workflow_runs',[]);retry=bool(runs and runs[0].get('conclusion') in ('failure','timed_out','cancelled'))
    except Exception:pass
if os.environ.get('GITHUB_OUTPUT'):
    with open(os.environ['GITHUB_OUTPUT'],'a') as f:f.write('deploy_retry='+str(retry).lower()+'\n')
print('Percobaan ulang deployment diperlukan.' if retry else 'Tidak ada kegagalan workflow sebelumnya yang memerlukan percobaan ulang.')
