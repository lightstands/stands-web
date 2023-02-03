#!/bin/python3
import sys
import json

def get_fields_from_schema(schema: dict):
    properties = schema["properties"]
    assert isinstance(properties, dict)
    return set(map(lambda x: x[0], properties.items()))

def filter_object_fields(d: dict, keep_fields: set):
    new_object = {}
    for k, v in d.items():
        if k in keep_fields:
            new_object[k] = v
    return new_object

def read_json_object(path: str):
    with open(path, "r", encoding="utf8") as f:
        val = json.load(f)
        assert isinstance(val, dict)
        return val

def main(argv: list[str]):
    if len(argv) != 3:
        print(f"Help: {argv[0]} <schema-path> <file-path>")
        print("Remove the fields that missing from the schema.")
        return
    schema_path = argv[1]
    file_path = argv[2]
    schema = read_json_object(schema_path)
    fields = get_fields_from_schema(schema)
    fields.add("$schema")
    old_content = read_json_object(file_path)
    assert old_content["$schema"]
    new_content = filter_object_fields(old_content, fields)
    with open(file_path, "w+", encoding="utf8") as f:
        json.dump(new_content, f, indent=4, ensure_ascii=False)
        f.write("\n")

if __name__ == "__main__":
    main(sys.argv)
