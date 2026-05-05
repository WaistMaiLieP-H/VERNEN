import json
f = open(r'C:\Users\SagFi\Desktop\VERNEN_IP\Source_Code\annotations\FL-300.json', 'r', encoding='utf-8')
data = json.load(f)
f.close()
print('VALID JSON')
secs = data['sections']
total = sum(len(s['fields']) for s in secs)
print(f'Sections: {len(secs)}, Total Fields: {total}')
for s in secs:
    print(f'  {s["section_id"]}: {len(s["fields"])} fields')
