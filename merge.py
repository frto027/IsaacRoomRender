txt = ""
files = [
    "dist/room_skin_db.js",
    "dist/room_shape_renderer.js",
    "dist/database.js",
    "dist/urlbuilder.js",
    "dist/room_json.js",

    "dist/drawer.js"
]

for f in files:
    with open(f,'r', encoding='utf8') as ff:
        txt += f"/*********** {f} *************/\n\n{ff.read()}\n"
with open("dist/merged.js",'w', encoding='utf8') as f:
    f.write("""(function(){ 
if(window.location.href.indexOf("skip_room=1") >= 0) return;

""" +txt + """
})();        
""")

try:
    import clipboard
    clipboard.copy(txt)
    print("the program has been copyed to clipboard")
except:
    print("hint: if you run 'python -m pip install clipboard', the program will automatically copy to your clipboard")
    pass