function huijiImageUrl(fileName:string){
    if(fileName.indexOf("/")>= 0){
        fileName = "InvalidFileName.png"
    }
    let hash = md5(fileName)
    return "https://huiji-public.huijistatic.com/isaac/uploads/" + hash[0] + "/" + hash[0] + hash[1] + "/" + fileName
}
class EntityDatabaseItem{
    type:number
    variant:number
    subtype:number
    image_url:string | undefined
    page:string | undefined

    constructor(type:number, variant:number, subtype:number){
        this.type = type
        this.subtype = subtype
        this.variant = variant
    }

    id(){
        return this.type + "." + this.variant + "." + this.subtype
    }
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
            e.image_url = huijiImageUrl(PreloadedDatabase[ent_id].file)
            e.page = PreloadedDatabase[ent_id].page
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
                    if(imgName != undefined){
                        item.image_url = huijiImageUrl(imgName)
                        item.page = data.Page
                    }else{
                        item.image_url = ""
                    }
                }
            }

            done();
        }).fail(function (jqXHR:any, textStatus:any) {
            console.log("get entity image url failed.", textStatus, jqXHR)
        })
    }
}
class EntityData{
    
}
class RoomDrawer{

    rootDiv:HTMLElement;
    roomJson: RoomData;


    database:EntityImageDatabase

    mousePosition = {x:0, y:0, enter:false, mouseDown:false}


    blockSize = 52
    scale = 1

    constructor(database:EntityImageDatabase, root:HTMLElement, roomJson:RoomData, scale = 1){
        this.rootDiv = root
        this.roomJson = roomJson

        this.database = database
        this.scale = scale

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

    pos(elem:HTMLElement, x:number, y:number, extraScale = 1){
        elem.style.position = "absolute"
        elem.style.transform = "translate(" + x + "px, " + y + "px)"
    }
    render(){

        let root = this.rootDiv
        root.innerHTML = ""


        //draw background
        let backgroundDiv = new Image()
        backgroundDiv.src = getBackgroundUrl(0, this.roomJson.shape)
        backgroundDiv.style.userSelect = "none"
        backgroundDiv.setAttribute("draggable", "false")
        root.appendChild(backgroundDiv)
        this.pos(backgroundDiv, 0,0)
        
        // ctx.translate(this.blockSize/2, this.blockSize/2)

        //draw doors
        this.trySolveDoors()
        for(let {x,y,exists, direction} of this.roomJson.doors){
            let img = new Image()
            img.style.position = "absolute"
            switch(direction){
                case DoorDir.TOP:
                    img.onload = ()=>{
                        let w = img.width, h = img.height
                        img.style.transform = "translate(" + 
                            ((x+.5) * this.blockSize) + "px, " +
                            ((y + 1) * this.blockSize) + "px) translate("+(-w/2)+"px," + (-h/2)+ "px) rotate(0deg) translate(0px," + (-h/2) + "px)"
                    }
                    break;
                case DoorDir.LEFT:
                    img.onload = ()=>{
                        let w = img.width, h = img.height
                        img.style.transform = "translate(" + 
                            ((x + 1) * this.blockSize) + "px, " +
                            ((y + .5) * this.blockSize) + "px) translate("+(-w/2)+"px," + (-h/2)+ "px) rotate(-90deg) translate(0px," + (-h/2) + "px)"
                    }
                    break;
                case DoorDir.BOTTOM: 
                    img.onload = ()=>{
                        let w = img.width, h = img.height
                        img.style.transform = "translate(" + 
                            ((x + .5) * this.blockSize) + "px, " +
                            ((y) * this.blockSize) + "px) translate("+(-w/2)+"px," + (-h/2)+ "px) rotate(180deg) translate(0px," + (-h/2) + "px)"
                    }
                break;
                case DoorDir.RIGHT:
                    img.onload = ()=>{
                        let w = img.width, h = img.height
                        img.style.transform = "translate(" + 
                            ((x) * this.blockSize) + "px, " +
                            ((y + .5) * this.blockSize) + "px) translate("+(-w/2)+"px," + (-h/2)+ "px) rotate(90deg) translate(0px," + (-h/2) + "px)"
                    }
                break;
            }
            img.src = "https://huiji-public.huijistatic.com/isaac/uploads/e/e9/Normal_Door.png"
            root.appendChild(img)
        }
        

        //draw entity
        for(let {x,y,entity} of this.roomJson.spawns){

            for(let ent of entity){
                const ent_id_str = ent.type + "." + ent.variant + "." + ent.subtype
                const img = this.database.db.get(ent_id_str)?.image_url
                if(!img){
                    let div = document.createElement("div")
                    let span1 = document.createElement("span")
                    let span2 = document.createElement("span")
                    span1.innerText = ent.type + "." + ent.variant
                    span1.style.display = "inline-block"
                    span2.innerText =  "." + ent.subtype
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

                // ctx.drawImage(img, x * this.blockSize, y * this.blockSize, this.blockSize, this.blockSize)
            }
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
            let scale = +(div.getAttribute("data-scale") || "1")
            if(isNaN(scale))
                scale = 1
            if(scale <= 0)
                scale = 1
            let roomJson = huijiJsonDatabase.db.get(roomJsonPath)
            if(roomJson == undefined)
            {
                console.log("not found room json ", roomJsonPath)
                return
            }
            
            let drawer = new RoomDrawer(imageUrlDatabase, div, roomJson, scale)
            roomDrawers.push(drawer)

        })

        imageUrlDatabase.sendUrlObtainRequest(()=>{
            roomDrawers.forEach(d=>d.startLoadImage())
        })
    })
}
