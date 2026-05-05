import json, os
path = r'C:\Users\SagFi\Desktop\VERNEN_IP\Source_Code\annotations'
for f in sorted(os.listdir(path)):
    if f.endswith('.json'):
        fp = os.path.join(path, f)
        try:
            data = json.load(open(fp, 'r', encoding='utf-8'))
            secs = data.get('sections', [])
            fields = sum(len(s.get('fields', [])) for s in secs)
            print(f"{f}: VALID | Sections: {len(secs)}, Fields: {fields}")
        except Exception as e:
            print(f"{f}: INVALID | {e}")
