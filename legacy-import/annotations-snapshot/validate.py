import json
path = r"C:\Users\SagFi\Desktop\VERNEN_IP\Source_Code\annotations\FL-100.json"
with open(path, "r", encoding="utf-8") as f:
    data = json.load(f)
print("VALID JSON")
secs = data["sections"]
fields = sum(len(s["fields"]) for s in secs)
print(f"Sections: {len(secs)}, Fields: {fields}")
for s in secs:
    print(f"  {s['section_id']}: {len(s['fields'])} fields")
