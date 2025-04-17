txt = ""
files = [
    "dist/database.js",
    "dist/urlbuilder.js",
    "dist/room_json.js",

    "dist/drawer.js"
]

for f in files:
    with open(f,'r', encoding='utf8') as ff:
        txt += f"/*********** {f} *************/\n\n{ff.read()}\n"
with open("dist/merged.js",'w', encoding='utf8') as f:
    f.write(txt)