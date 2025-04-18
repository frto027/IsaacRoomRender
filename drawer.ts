function huijiImageUrl(fileName:string){
    if(fileName.indexOf("/")>= 0){
        fileName = "InvalidFileName.png"
    }
    let hash = md5(fileName)
    return "https://huiji-public.huijistatic.com/isaac/uploads/" + hash[0] + "/" + hash[0] + hash[1] + "/" + fileName
}

function huijiPageUrl(pageName:string){
    return "/index.php?title="+encodeURIComponent(pageName)
}
class EntityDatabaseItem{
    type:number
    variant:number
    subtype:number
    image_url:string | undefined
    page:string | undefined
    func:ItemFunctionRenderer | undefined

    constructor(type:number, variant:number, subtype:number){
        this.type = type
        this.subtype = subtype
        this.variant = variant
    }

    id(){
        return this.type + "." + this.variant + "." + this.subtype
    }
}

function image(src:string, sizeW:number, sizeH:number|undefined = undefined):HTMLImageElement {
    let ret = new Image()
    ret.style.imageRendering = "pixelated"
    ret.onload = ()=>{
        let scaleW = sizeW / ret.width
        if(sizeH != undefined){
            let scaleH = sizeH / ret.height
            if(scaleH < scaleW)
                scaleW = scaleH
        }
        ret.style.transform = "translate(-" + ret.width/2 + "px, -" + ret.height/2 + "px)" + "scale(" + scaleW + ") translate(" + ret.width/2 + "px, " + ret.height/2 + "px)"
        ret.onload = undefined
    }
    ret.src = src
    return ret
}

class HuijiJsonDatabase{
    db = new Map<string, RoomData | undefined>()
    
    addRequestJson(id:string){
        if(!this.db.has(id))
            this.db.set(id, undefined)
    }


    sendRequest(done:()=>void){
        var filter:any = { "$or": [] }
        
        this.db.forEach((v,k,m)=>{
            if(v == undefined){
                filter["$or"].push({
                    "_id": k
                })
            }
        });
        
        (window as any).$.ajax({
            url: "/api/rest_v1/namespace/data",
            method: "GET",
            data: { filter: JSON.stringify(
                filter
            ) },
            dataType: "json"
        }).done((msg:any)=> {
            for (var i = 0; i < msg._embedded.length; i++) {
                let data = msg._embedded[i] as RoomData
                try{
                    if(!data._id.startsWith("Data:")){
                        console.error("can't handle data:", data)
                        continue
                    }
                    let key = data._id
                    this.db.set(key, data)
                }catch(e){
                    console.error("error when handle room json data", data)
                }
            }

            done();
        }).fail(function (jqXHR:any, textStatus:any) {
            console.log("get entity image url failed.", textStatus, jqXHR)
        })
    }
    
}
class EntityImageDatabase{
    db = new Map<string, EntityDatabaseItem>()

    drawers = new Set<RoomDrawer>()

    constructor(){
        for(let ent_id in PreloadedDatabase){
            let ids = ent_id.split(".")
            let e = new EntityDatabaseItem(+ids[0], +ids[1], +ids[2])
            let file = PreloadedDatabase[ent_id].file
            if(typeof(file) == "string"){
                e.image_url = huijiImageUrl(file)
            }else{
                e.func = file
            }
            e.page = PreloadedDatabase[ent_id].page
            this.db.set(e.id(), e)
        }
    }
    requestEntity(type:number, variant:number, subtype:number){
        let str = type + "." + variant + "." + subtype
        if(!this.db.has(str))
            this.db.set(str, new EntityDatabaseItem(type, variant, subtype))
    }

    sendUrlObtainRequest(done:()=>void){
        var filter:any = { "$or": [] }
        
        this.db.forEach((v,k,m)=>{
            if(v.image_url == undefined){
                filter["$or"].push({
                    //FIXME: fix query
                    "Type": v.type,
                    "Variant": v.variant,
                    "Subtype":v.subtype
                })
            }
        });
        
        if(filter["$or"].length == 0){
            done()
            return
        }
        
        (window as any).$.ajax({
            url: "/api/rest_v1/namespace/data",
            method: "GET",
            data: { filter: JSON.stringify({
                "$and":[
                    {
                        "_id":{"$regex":"^Data:Entity\\.tabx"}
                    },
                    filter
                ]
            }) },
            dataType: "json"
        }).done((msg:any)=> {
            for (var i = 0; i < msg._embedded.length; i++) {
                var data = msg._embedded[i]
                //FIXME: fix query
                var type = data.Type
                var variant = data.Variant
                var subtype = data.Subtype

                var str = type + "." + variant + "." + subtype
                let item = this.db.get(str)
                if(item){
                    let imgName = data.Image
                    if(imgName != undefined && typeof(imgName) == "string"){
                        item.image_url = huijiImageUrl(imgName)
                        item.page = data.Page
                    }else{
                        item.image_url = undefined
                    }
                }
            }

            done();
        }).fail(function (jqXHR:any, textStatus:any) {
            console.log("get entity image url failed.", textStatus, jqXHR)
        })
    }
}
class RoomSkin{
    door_img_url:string = "https://huiji-public.huijistatic.com/isaac/uploads/e/e9/Normal_Door.png"
    getBackgroundUrl(roomtype:number, shape:number):string{
        const default_background = [undefined,
        "Rooms_background_shape1_room_01_basement.png",
        "Rooms_background_shape2_room_01_basement.png",
        "Rooms_background_shape3_room_01_basement.png",
        "Rooms_background_shape4_room_01_basement.png",
        "Rooms_background_shape5_room_01_basement.png",
        "Rooms_background_shape6_room_01_basement.png",
        "Rooms_background_shape7_room_01_basement.png",
        "Rooms_background_shape8_room_01_basement.png",
        "Rooms_background_shape9_room_01_basement.png",
        "Rooms_background_shape10_room_01_basement.png",
        "Rooms_background_shape11_room_01_basement.png",
        "Rooms_background_shape12_room_01_basement.png",
        ]
    
        return default_background[shape] || ""
    }
}
class RoomDrawer{

    rootDiv:HTMLElement;
    roomJson: RoomData;


    database:EntityImageDatabase

    mousePosition = {x:0, y:0, enter:false, mouseDown:false}

    blockSize = 52

    skin = new RoomSkin()
    constructor(database:EntityImageDatabase, root:HTMLElement, roomJson:RoomData){
        this.rootDiv = root
        this.roomJson = roomJson

        this.database = database
    
        database.drawers.add(this)

        //entities
        roomJson.spawns.forEach(v=>{
            v.entity.forEach(e=>{
                database.requestEntity(e.type, e.variant, e.subtype)
            })
        })

        root.style.position = "relative"
    }

    startLoadImage(){
        this.render()
    }

    destroy(){
        this.database.drawers.delete(this)
    }

    trySolveDoors(){
        let doors = this.roomJson.doors
        let isDoorSolved = ()=>{
            for(let d of doors){
                if(d.direction == undefined)
                    return false
            }
            return true
        }
        if(isDoorSolved())
            return

        let hasSeenLeft = new Set<number>()//y
        let hasSeenRight = new Set<number>()

        let hasSeenTop = new Set<number>()
        let hasSeenBottom = new Set<number>()

        for(let d of doors){
            if(d.direction != undefined)
                continue
            if(d.x == 0){
                d.direction = DoorDir.LEFT
                hasSeenLeft.add(d.y)
            }
            if(d.x + 1== this.roomJson.width){
                d.direction = DoorDir.RIGHT
                hasSeenRight.add(d.y)
            }
            if(d.y == 0){
                d.direction = DoorDir.TOP
                hasSeenTop.add(d.x)
            }
            if(d.y + 1 == this.roomJson.height){
                d.direction = DoorDir.BOTTOM
                hasSeenBottom.add(d.x)
            }
        }

        for(let d of doors){
            if(d.direction != undefined)
                continue
            if(hasSeenLeft.has(d.y)){
                d.direction = DoorDir.RIGHT
            }else if(hasSeenRight.has(d.y)){
                d.direction = DoorDir.LEFT
            }else if(hasSeenTop.has(d.x)){
                d.direction = DoorDir.BOTTOM
            }else if(hasSeenBottom.has(d.x)){
                d.direction = DoorDir.TOP
            }
        }

        if(!isDoorSolved()){
            console.error("Door not solved!", this)
        }
    }
    
    isMouseInside(x:number, y:number, w:number, h:number){
        if(!this.mousePosition.enter){
            return false
        }
        if(this.mousePosition.x < x || this.mousePosition.x >= x + w || this.mousePosition.y < y || this.mousePosition.y >= y + h)
            return false
        return true
    }

    roomShapeText():string|undefined{
        const shapes = [
            undefined,
            "1x1",
            "IH",
            "IV",
            "1x2",
            "IIV",
            "2x1",
            "IIH",
            "2x2",
            "LTL",
            "LTR",
            "LBL",
        ]
        return shapes[this.roomJson.shape]
    }

    pos(elem:HTMLElement, x:number, y:number){
        elem.style.position = "absolute"
        elem.style.transform = "translate(" + x + "px, " + y + "px)"
    }
    render(){

        let root = this.rootDiv
        root.innerHTML = ""


        //draw background
        let backgroundUrl = this.skin.getBackgroundUrl(this.roomJson.type, this.roomJson.shape)
        if(backgroundUrl != ""){
            let backgroundDiv = new Image()
            backgroundDiv.src = huijiImageUrl(backgroundUrl)
            backgroundDiv.style.userSelect = "none"
            backgroundDiv.setAttribute("draggable", "false")
            root.appendChild(backgroundDiv)
            this.pos(backgroundDiv, 0,0)
        }
        
        // ctx.translate(this.blockSize/2, this.blockSize/2)

        //draw doors
        this.trySolveDoors()
        for(let {x,y,exists, direction} of this.roomJson.doors){
            let img = new Image()
            img.style.position = "absolute"
            if(!exists){
                img.style.filter = "contrast(0.5)"
            }
            switch(direction){
                case DoorDir.TOP:
                    img.onload = ()=>{
                        let w = img.width, h = img.height
                        img.style.transform = "translate(" + 
                            ((x+.5) * this.blockSize) + "px, " +
                            ((y + 1) * this.blockSize) + "px) translate("+(-w/2)+"px," + (-h/2)+ "px) scale(1.5) rotate(0deg) translate(0px," + (-h/2) + "px)"
                    }
                    break;
                case DoorDir.LEFT:
                    img.onload = ()=>{
                        let w = img.width, h = img.height
                        img.style.transform = "translate(" + 
                            ((x + 1) * this.blockSize) + "px, " +
                            ((y + .5) * this.blockSize) + "px) translate("+(-w/2)+"px," + (-h/2)+ "px) scale(1.5) rotate(-90deg) translate(0px," + (-h/2) + "px)"
                    }
                    break;
                case DoorDir.BOTTOM: 
                    img.onload = ()=>{
                        let w = img.width, h = img.height
                        img.style.transform = "translate(" + 
                            ((x + .5) * this.blockSize) + "px, " +
                            ((y) * this.blockSize) + "px) translate("+(-w/2)+"px," + (-h/2)+ "px) scale(1.5) rotate(180deg) translate(0px," + (-h/2) + "px)"
                    }
                break;
                case DoorDir.RIGHT:
                    img.onload = ()=>{
                        let w = img.width, h = img.height
                        img.style.transform = "translate(" + 
                            ((x) * this.blockSize) + "px, " +
                            ((y + .5) * this.blockSize) + "px) translate("+(-w/2)+"px," + (-h/2)+ "px) scale(1.5) rotate(90deg) translate(0px," + (-h/2) + "px)"
                    }
                break;
            }
            img.src = this.skin.door_img_url
            root.appendChild(img)
        }
        

        //draw entity
        for(let {x,y,entity} of this.roomJson.spawns){
            let subCount = 1
            let rowCount = 1
            let subScale = 1
            for(let i=0;i<5;i++){
                subCount = i * i
                subScale = 1 / i
                rowCount = i
                if(subCount >= entity.length)
                    break
            }
            let subIndex = 0


            // let highlight_elems : HTMLElement[] = []
            for(let ent of entity){
                const ent_id_str = ent.type + "." + ent.variant + "." + ent.subtype
                let dbItem = this.database.db.get(ent_id_str)
                const img = dbItem?.image_url
                const func = dbItem.func
                if(!img && !func){
                    let div = document.createElement("div")
                    let span1 = document.createElement("span")
                    let span2 = document.createElement("span")
                    span1.innerText = "实体 " +ent.type + "."
                    span1.style.display = "inline-block"
                    span2.innerText =   ent.variant + "." + ent.subtype
                    div.appendChild(span1)
                    div.appendChild(span2)
                    div.style.fontFamily = "LCDPHONE"
                    div.style.fontSize = "14px"
                    div.style.border = "solid black 1px"
                    div.style.width = this.blockSize + "px"
                    div.style.height = this.blockSize + "px"
            
                    root.appendChild(div)
                    this.pos(div, x*this.blockSize, y*this.blockSize)
                    continue
                }

                let f = func

                let page = dbItem.page
                
                if(f == undefined && img){
                    f = (t,v,s,size)=>{
                        let ret:HTMLElement = image(img, size)
                        // highlight_elems.push(ret)
                        if(page){
                            let a = document.createElement("a")
                            a.href = huijiPageUrl(page)
                            a.appendChild(ret)
                            ret = a
                        }
                        return ret
                    }
                }
                if(f == undefined){
                    f = (t,v,s, size)=>{
                        let div = document.createElement("div")
                        div.innerText = "NF_" + t+"."+v+"."+s
                        div.style.transform = "scale(" + size / 52 + ")"
                        return div
                    }
                }

                let left = (x + (subIndex % rowCount) * subScale ) * this.blockSize
                let top = (y + Math.floor(subIndex / rowCount) * subScale ) * this.blockSize
                let div = f(ent.type,ent.variant,ent.subtype, this.blockSize * subScale) as HTMLElement
                let divParent = document.createElement("div")
                root.appendChild(divParent)
                this.pos(divParent, left, top)
                divParent.appendChild(div)
            }


            // let grid = document.createElement("div")
            // root.appendChild(grid)
            // this.pos(grid, x * this.blockSize, y * this.blockSize)
            // grid.style.width = this.blockSize + "px"
            // grid.style.height = this.blockSize + "px"
            // grid.onmouseenter = ()=>{
            //     console.log("enter")
            //     grid.style.backgroundColor = "#100000a0"
            //     highlight_elems.forEach(e=>{
            //         e.style.filter = "bightness(2)"
            //     })
            // }
            // grid.onmouseleave = ()=>{
            //     console.log("leave")
            //     grid.style.backgroundColor = "#00000000"
            //     highlight_elems.forEach(e=>{
            //         e.style.filter = ""
            //     })
            // }
        }

        //draw text
        let textDiv = document.createElement("div")
        textDiv.style.fontFamily = "LCDPHONE"
        textDiv.style.fontSize = "16px"
        textDiv.style.color = "white"
        textDiv.style.marginLeft = "10px"
        root.appendChild(textDiv)
        this.pos(textDiv, 0,10)
        let displayText = (text:string, marginLeft:number, marginRight:number, click_copy:boolean)=>{
            let tx = document.createElement("span")
            tx.innerText = text
            tx.style.marginLeft = marginLeft + "px"
            tx.style.marginRight = marginRight + "px"
            // tx.style.font = "white 16px LCDPHONE"
            textDiv.appendChild(tx)
        }
        const gotoCommandFirstPart = RoomGoToCommand[this.roomJson.type]
        if(gotoCommandFirstPart){
            const gotoCommand = "goto " + gotoCommandFirstPart + "." + this.roomJson.variant
            displayText(gotoCommand, 5, 5, true)
        }

        displayText("房间名：", 10, 0, false)
        displayText(this.roomJson.name, 0, 0, true)

        const roomShape = this.roomShapeText()
        if(roomShape){
            displayText("房间形状：",10,0,false)
            displayText(roomShape,0,0,true)
        }

        displayText("难度:",10,0,false)
        displayText(this.roomJson.difficulty.toString(),0,0,false)
    }
}


let divs = document.getElementsByClassName("room-renderer")
if(divs.length > 0){
    let huijiJsonDatabase = new HuijiJsonDatabase()
    let imageUrlDatabase = new EntityImageDatabase()

    let pendingDivs = []
    for(let i=0;i<divs.length;i++){
        let div = divs[i] as HTMLElement
        
        let roomJsonPath = div.getAttribute("data-path")
        if(roomJsonPath == undefined){
            continue
        }
        if(!roomJsonPath.startsWith("Data:"))
        {
            roomJsonPath = "Data:" + roomJsonPath
            div.setAttribute("data-path", roomJsonPath)
        }
        huijiJsonDatabase.addRequestJson(roomJsonPath)
        pendingDivs.push(div)
    }

    huijiJsonDatabase.sendRequest(()=>{
        let roomDrawers:RoomDrawer[] = []

        pendingDivs.forEach(div=>{
            let roomJsonPath = div.getAttribute("data-path")
            // let scale = +(div.getAttribute("data-scale") || "1")
            // if(isNaN(scale))
            //     scale = 1
            // if(scale <= 0)
            //     scale = 1
            let roomJson = huijiJsonDatabase.db.get(roomJsonPath)
            if(roomJson == undefined)
            {
                console.log("not found room json ", roomJsonPath)
                return
            }
            
            let drawer = new RoomDrawer(imageUrlDatabase, div, roomJson)
            roomDrawers.push(drawer)

        })

        imageUrlDatabase.sendUrlObtainRequest(()=>{
            roomDrawers.forEach(d=>d.startLoadImage())
        })
    })
}
