import xml.etree.ElementTree as ET

GAME_PATH = "D:\\SteamLibrary\\steamapps\\common\\The Binding of Isaac Rebirth\\extracted_resources\\resources\\"

with open(GAME_PATH + r"backdrops.xml","r") as f:
    dom = ET.parse(f).getroot()

backdrop_id_to_png = [None] * 63

for ch in dom:
    if not "door" in ch.attrib:
        continue
    id = ch.attrib["id"]
    door = ch.attrib["door"]
    backdrop_id_to_png[int(id)] = door

with open(GAME_PATH + r"stages.xml","r") as f:
    dom = ET.parse(f).getroot()

d = {}

for stage in dom:
    print(stage)
    if not 'backdrop' in stage.attrib:
        continue
    path = stage.attrib["path"]
    bgId = stage.attrib["backdrop"]

    path = path.lower()
    if path.endswith(".xml"):
        path = path[:-4] + ".stb"
    d[path] = backdrop_id_to_png[int(bgId)]
import json
print(json.dumps(d))