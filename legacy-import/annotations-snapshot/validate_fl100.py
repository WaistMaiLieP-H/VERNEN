import json
import sys

path = r"C:\Users\SagFi\Desktop\VERNEN_IP\Source_Code\annotations\FL-100.json"
try:
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    sections = [s["section_id"] for s in data["sections"]]
    fields = sum(len(s["fields"]) for s in data["sections"])
    langs = data["meta"]["languages"]
    print("VALID JSON")
    print(f"Form: {data['meta']['form_id']}")
    print(f"Sections ({len(sections)}): {sections}")
    print(f"Total fields: {fields}")
    print(f"Languages: {len(langs)}")
    # Check all fields have all languages
    missing = []
    for s in data["sections"]:
        for fld in s["fields"]:
            for lang in langs:
                if lang not in fld["guidance"]:
                    missing.append(f"{fld['field_id']} missing {lang} in guidance")
                if "check_if" in fld:
                    if lang not in fld["check_if"]:
                        missing.append(f"{fld['field_id']} missing {lang} in check_if")
                if "do_not_check_if" in fld:
                    if lang not in fld["do_not_check_if"]:
                        missing.append(f"{fld['field_id']} missing {lang} in do_not_check_if")
    if missing:
        print(f"WARNINGS ({len(missing)}):")
        for m in missing:
            print(f"  - {m}")
    else:
        print("All fields have all 13 languages in all guidance keys.")
except json.JSONDecodeError as e:
    print(f"INVALID JSON: {e}")
    sys.exit(1)
except Exception as e:
    print(f"ERROR: {e}")
    sys.exit(1)
