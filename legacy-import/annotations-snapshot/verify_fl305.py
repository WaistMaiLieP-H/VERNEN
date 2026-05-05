import json
f = open(r'C:\Users\SagFi\Desktop\VERNEN_IP\Source_Code\annotations\FL-305.json', 'r', encoding='utf-8')
data = json.load(f)
f.close()
print('VALID JSON')
secs = data['sections']
fields = sum(len(s['fields']) for s in secs)
print(f'Sections: {len(secs)}, Fields: {fields}')
for s in secs:
    print(f'  {s["section_id"]}: {len(s["fields"])} fields')
