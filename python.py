import requests
import json

r = requests.post('https://www.saramin.co.kr/zf_user/tools/spell-check', data={
            'content': "아버지가방에들어가신다."
        })

print(json.loads(r.text))