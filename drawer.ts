let verbose = window.location.href.indexOf("verbose=1") >= 0

function huijiImageUrl(fileName:string){
    if(fileName.indexOf("/")>= 0){
        fileName = "InvalidFileName.png"
    }
    fileName = fileName.replace(new RegExp(" ", "g"),"_")
    let hash = md5(fileName)
    return "https://huiji-public.huijistatic.com/isaac/uploads/" + hash[0] + "/" + hash[0] + hash[1] + "/" + fileName
}

function huijiPageUrl(pageName:string){
    let sharp_index = pageName.indexOf("#")
    if(sharp_index >= 0){
        return "/index.php?title="+encodeURIComponent(pageName.substring(0,sharp_index)) + "#" + encodeURIComponent(pageName.substring(sharp_index+1))
    }
    return "/index.php?title="+encodeURIComponent(pageName)
}

class EntityDatabaseItem{
    type:number
    variant:number
    subtype:number
    image_url:string | undefined
    page:string | undefined
    func:ItemFunctionRenderer | undefined
    rawScale:number|undefined = undefined

    already_requested = false

    entityTabx:EntityTabxItem|undefined

    constructor(type:number, variant:number, subtype:number){
        this.type = type
        this.subtype = subtype
        this.variant = variant
    }

    id(){
        return this.type + "." + this.variant + "." + this.subtype
    }
}

function image(src:string, sizeW:number, sizeH:number|undefined = undefined, drawer_for_preview_record:RoomDrawer|undefined = undefined, rawScale:number|undefined = undefined):HTMLImageElement {
    let ret = new Image()
    ret.style.imageRendering = "pixelated"
    ret.onload = ()=>{
        let scaleW = sizeW / ret.width
        if(sizeH != undefined){
            let scaleH = sizeH / ret.height
            if(scaleH < scaleW)
                scaleW = scaleH
        }
        if(scaleW > 2)
            scaleW = 2
        const grid_transform = "translate(-" + ret.width/2 + "px, -" + ret.height/2 + "px)" + "scale(" + scaleW + ") translate(" + ret.width/2 + "px, " + ret.height/2 + "px)"
        let preview_transform = grid_transform
        if(rawScale != undefined)
            preview_transform = "translate(-" + ret.width/2 + "px, -" + ret.height/2 + "px)" + "scale(" + rawScale + ") translate(" + sizeW/4 + "px, " + (-ret.height/2 + sizeW/2) + "px)"
        if(drawer_for_preview_record && (ret.width / ret.height) < 1.7 /* 虫子别来凑热闹 */){
            ret.style.transform = drawer_for_preview_record.is_in_preview_mode ? preview_transform : grid_transform
            drawer_for_preview_record.entity_preview_mode_datas.push([ret, preview_transform])
            drawer_for_preview_record.entity_grid_mode_datas.push([ret, grid_transform])
            setTimeout(()=>{
                ret.style.transition = "all 0.2s"
            },1000)
        }else{
            ret.style.transform = grid_transform
        }
        
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
        var filter:any = { "_id": {
            "$in":[]
        } }
        
        this.db.forEach((v,k,m)=>{
            if(v == undefined){
                filter["_id"]["$in"].push(k)
            }
        });
        
        if(filter["_id"]["$in"].length == 0){
            done()
            return
        }

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
            console.log("房间布局工具：无法下载json数据据", textStatus, jqXHR);
            let report_retry = 0
            function reportFailed(){
                try{
                    (window as any).$notification.error({content:"房间布局加载失败（常见可能原因：当前页面内房间布局数量过多）"})
                }catch(e){
                    report_retry++
                    if(report_retry < 20){
                        setTimeout(reportFailed, 1000)
                    }
                }
            }
            reportFailed()
        })
    }
    
}
class EntityImageDatabase{
    db = new Map<string, EntityDatabaseItem>()

    //drawers = new Set<RoomDrawer>()

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
        
        var requesting_items:EntityDatabaseItem[] = []
        //由于数据库接口不能接受过长数据（可能是get请求的url限制），我们对?.0.0以及a.?.c的数据进行合并同类项，以构造更短的请求
        var x_0_0_items = []
        var a_x_c_items = new Map<string, number[]>()
        this.db.forEach((v,k,m)=>{
            if(v.already_requested)
                return
            if(v.image_url == undefined || v.entityTabx == undefined){
                if(v.variant == 0 && v.subtype == 0){
                    x_0_0_items.push(v.type)
                }else{
                    let a_c = v.type + "_" + v.subtype
                    if(!a_x_c_items.has(a_c))
                        a_x_c_items.set(a_c, [])
                    a_x_c_items.get(a_c).push(v.variant)
                }
                requesting_items.push(v)
            }
        });
        if(x_0_0_items.length > 0){
            filter["$or"].push({
                "Type":{"$in":x_0_0_items},
                "Variant":0,
                "Subtype":0
            })
        }
        a_x_c_items.forEach((v,k)=>{
            let split = k.split("_")
            let type = +split[0]
            let subtype = +split[1]
            let query:any = {
                "Type":type,
                "Subtype":subtype,
                "Variant":v[0]
            }
            if(v.length > 1){
                query["Variant"] = {"$in":[]}
                v.forEach(n=>{
                    query["Variant"]["$in"].push(n)
                })
            }
            filter["$or"].push(query)
        })
        
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
                var data = msg._embedded[i] as EntityTabxItem
                //FIXME: fix query
                var type = data.Type
                var variant = data.Variant
                var subtype = data.Subtype

                var str = type + "." + variant + "." + subtype
                let item = this.db.get(str)
                if(item){
                    let imgName = /*data.Icon ||*/ data.Image
                    if(imgName != undefined && typeof(imgName) == "string"){
                        item.image_url = item.image_url || huijiImageUrl(imgName)
                        item.page = item.page || data.Page
                    }else{
                        // item.image_url = undefined
                    }
                    item.entityTabx = data
                    item.rawScale = 2
                }
            }

            for(let i=0;i<requesting_items.length;i++){
                requesting_items[i].already_requested = true
            }
            done();
        }).fail(function (jqXHR:any, textStatus:any) {
            (window as any).$notification.error({content:"房间布局零件：实体数据加载失败（常见可能原因：当前页面内房间布局数量过多）"})
            console.log("get entity image url failed.", textStatus, jqXHR)
        })
    }
}

class PitDrawer{
    roomW:number
    roomH:number

    drawer:RoomDrawer
    hasAnyPit = false

    pitMatrix:boolean[]

    // pitKnowledge描述了pit.png上每一个方块的开口信息
    // 0 1 2 3
    // 4 5 6 7
    // 8 9 10 11
    // ...
    // content: U R D L _ UR RD DL LU, 1 means floor, 0 means pit, 2 means any
    static pitKnowledge:number[] = [
        0x1011_2222,0x1101_2222,0x1110_2222,0x0111_2222,
        0x1010_2222,0x0101_2222,0x1001_2022,0x1100_2202,
        0x0110_2220,0x0011_0222,0x1000_2002,0x0100_2220,
        0x1111_2222,0x1111_2222,0x0001_0222,0x0000_2222,
        0x0010_0220,0x0000_2222,0x0000_2222,0x0110_2221,
        0x0011_1222,0x1001_2122,0x1100_2212,0x0000_2222,
        0x0000_2222,0x0001_1222,0x0100_2221,0x0010_1220,
        0x0010_0221,0x0010_1221,0x1000_2102,0x1000_2012,
        0x1000_2112
    ]

    // 0000 1000 0001 1001 0110
    constructor(roomDrawer:RoomDrawer){
        this.roomW = roomDrawer.roomJson.width
        this.roomH = roomDrawer.roomJson.height
        this.pitMatrix = new Array(this.roomW * this.roomH)
        this.drawer = roomDrawer
    }

    pitIndex(x:number, y:number){
        return x + y * this.roomW
    }

    isPitEntity(type:number,variant:number,subtype:number){
        return type == 3000 && variant == 0 && subtype == 0
    }

    markPit(x:number, y:number, ent:EntityListItem){
        this.hasAnyPit = true
        this.pitMatrix[this.pitIndex(x,y)] = true
    }

    getPitFeature(x:number, y:number){
        if(x < 0 || x >= this.roomW || y < 0 || y >= this.roomH){
            return 1
        }
        if(this.pitMatrix[this.pitIndex(x,y)]){
            return 0
        }
        return 1
    }

    selectImageForFeature(feature:number){
        //全1的沟壑有两个，随机给一个
        if((feature & 0xFFFF0000 )== 0x11110000){
            //12 or 13
            return Math.random() > 0.5 ? 12 : 13
        }
        //全0的沟壑规则不是互斥的，所以独立判断
        if((feature & 0xFFFF0000) == 0x00000000){
            switch(feature){
                case 0x0001:
                    return 17
                case 0x1000:
                    return 18
                case 0x1001:
                    return 23
                case 0x0110:
                    return 24
                default:
                    return 15
            }
        }
        //剩下的规则可以保证互斥唯一
        for(let i=0;i<PitDrawer.pitKnowledge.length;i++){
            let kn = PitDrawer.pitKnowledge[i]
            if((feature & 0xFFFF0000) != (kn & 0xFFFF0000)){
                continue
            }
            if((kn & 0xF000) != 0x2000 && (feature & 0xF000) != (kn & 0xF000))
                continue
            if((kn & 0xF00) != 0x200 && (feature & 0xF00) != (kn & 0xF00))
                continue
            if((kn & 0xF0) != 0x20 && (feature & 0xF0) != (kn & 0xF0))
                continue
            if((kn & 0xF) != 0x2 && (feature & 0xF) != (kn & 0xF))
                continue
            return i
        }
        return 0
    }
    drawPits(root:HTMLElement){
        if(!this.hasAnyPit)
            return
        let imgUrl = huijiImageUrl(this.drawer.skin.getPitUrl(this.drawer.roomJson))

        for(let x = 0;x < this.roomW;x++){
            for(let y=0;y<this.roomH;y++){
                if(!this.pitMatrix[this.pitIndex(x,y)])
                    continue
                let feature = this.getPitFeature(x,y-1)
                feature = feature * 0x10 + this.getPitFeature(x+1,y)
                feature = feature * 0x10 + this.getPitFeature(x,y+1)
                feature = feature * 0x10 + this.getPitFeature(x-1,y)

                feature = feature * 0x10 + this.getPitFeature(x+1,y-1)
                feature = feature * 0x10 + this.getPitFeature(x+1,y+1)
                feature = feature * 0x10 + this.getPitFeature(x-1,y+1)
                feature = feature * 0x10 + this.getPitFeature(x-1,y-1)
                let selected_pit_index = this.selectImageForFeature(feature)
                let img = document.createElement("div")
                img.style.imageRendering = "pixelated"
                img.style.width = "26px"
                img.style.height = "26px"
                let tx = (selected_pit_index % 4) * 26
                let ty = Math.floor(selected_pit_index / 4) * 26
                img.style.backgroundPositionX = -tx + "px"
                img.style.backgroundPositionY = -ty + "px"
                img.style.transform = "translate(-13px,-13px) scale(2) translate(26px,26px) translate(" + (x*26) + "px," + (y*26) + "px)"
                img.style.backgroundImage = "url(" + imgUrl + ")"
                img.style.position = "absolute"
                // img.setAttribute("selected-index", feature.toString(16) +"")
                root.appendChild(img)
            }
        }
    }
    
}

class RoomDrawer{

    rootContainer:HTMLElement;
    rootDiv:HTMLElement;

    roomJson: RoomData;


    database:EntityImageDatabase

    mousePosition = {x:0, y:0, enter:false, mouseDown:false}

    blockSize = 52

    floatWindow:HTMLElement|undefined

    skin = new RoomSkin()

    scale = 1 // only used for mouse event align


    click_mode = false // click to set scale 1
    
    click_mask:HTMLElement|undefined

    no_operate_mode = false

    margin = 0

    static documentFloatOverlay:HTMLElement
    static activatingDrawer:RoomDrawer|undefined

    constructor(database:EntityImageDatabase, root:HTMLElement, roomJson:RoomData){
        this.rootContainer = root;
        this.roomJson = roomJson;

        (root as any).roomDrawer = this;

        if(root.hasAttribute("data-scale")){
            this.scale = +root.getAttribute("data-scale")
        }
        if(root.hasAttribute("data-mode")){
            let mode = root.getAttribute("data-mode")
            if(mode == "click"){
                this.click_mode = true
            }
            if(mode == "readonly"){
                this.no_operate_mode = true
            }
        }
        if(root.hasAttribute("data-margin")){
            let margin = +root.getAttribute("data-margin")
            if(isNaN(margin))
                margin = 0
            this.margin=margin
        }

        if(this.scale >= 1)
            this.click_mode = false

        this.database = database
    
        //database.drawers.add(this)

        //entities
        roomJson.spawns.forEach(v=>{
            v.entity.forEach(e=>{
                database.requestEntity(e.type, e.variant, e.subtype)
            })
        })

        root.style.position = "relative"
    }

    setupScaledMode(){
        let w = this.roomJson.width * this.blockSize + this.margin * 2
        let h = this.roomJson.height * this.blockSize + this.margin * 2

        this.rootDiv.style.transform = `translate(-${w/2}px,-${h/2}px) scale(${this.scale}) translate(${w/2}px,${h/2}px)`
        this.rootDiv.style.marginRight = (w * this.scale - w) + "px"
        this.rootDiv.style.marginBottom = (h * this.scale - h) + "px"
    }
    setupNonScaledMode(){
        this.rootDiv.style.transform = ""
        this.rootDiv.style.marginRight = "0"
        this.rootDiv.style.marginBottom = "0"
    }


    startLoadImage(){
        this.render()
    }

    destroy(){
        //this.database.drawers.delete(this)
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

    displayGridInfo(event:MouseEvent, spawns:SpawnInfo|undefined, doors:DoorInfo|undefined){
        if(this.floatWindow.style.display == ""){
            this.floatWindow.style.transition = "transform 0.4s"
        }

        let scale = this.scale

        if(this.click_mode)
            scale = 1

        this.floatWindow.style.display = ""
        this.floatWindow.style.color = "white"
        this.floatWindow.innerHTML = ""
        this.floatWindow.style.zIndex = "90001"

        this.floatWindow.style.backgroundColor = "rgb(0 0 0 / 74%)"
        // this.floatWindow.style.padding = "16px"
        // this.floatWindow.style.border = "4px solid green"
        // this.floatWindow.style.borderRadius = "8px"

        let title_div = document.createElement("div")
        title_div.style.padding = "1px 2px 1px 6px"
        title_div.style.backgroundColor = "#234c9d"
        this.floatWindow.appendChild(title_div)


        let rect = this.rootDiv.getBoundingClientRect()
        
        let x = (event.clientX - rect.x) + 8
        let y = (event.clientY - rect.y)
        x = Math.min(x, (this.roomJson.width - 4.8) * this.blockSize * scale)
        y = Math.min(y, (this.roomJson.height - 1.8) * this.blockSize * scale)
        
        this.pos(this.floatWindow, x / scale, y / scale)
        let title = undefined
        let floatBody = document.createElement("div")
        if(spawns == undefined && doors == undefined){
            title = "空白单元格"
            floatBody.innerText = "这个单元格不会生成任何实体"
        }else if(spawns != undefined){
            title = "坐标：(" + spawns.x + "," + spawns.y + ")"

            if(spawns.entity.length > 1){
                title += "多选一生成"
                let e = document.createElement("p")
                e.innerText = "这个单元格将生成以下内容之一："
                floatBody.appendChild(e)
                spawns.entity.forEach(v=>{
                    let ent_id = v.type + "." + v.variant + "." + v.subtype
                    
                    let w_str = v.weight.toString()
                    if(w_str.indexOf(".") >= 0){
                        w_str = v.weight.toFixed(3)
                    }

                    let text = "权重:" + w_str + " ID:" + ent_id
                    let ent_data = this.database.db.get(ent_id)
                    if(ent_data){
                        let name = ent_data?.entityTabx?.NameZH
                        if(name){
                            text += "(" + name + ")"
                        }else if(ent_data.page){
                            text += "(" + ent_data.page + ")"
                        }
                    }
                    if(ent_data.page != undefined){
                        let a = document.createElement("a")
                        a.innerText = text
                        a.href = huijiPageUrl(ent_data.page)
                        a.target = "_blank"
                        floatBody.appendChild(a)
                        floatBody.appendChild(document.createElement("br"))
                    }else{
                        let a = document.createElement("ap")
                        a.innerText = text
                        floatBody.appendChild(a)
                        floatBody.appendChild(document.createElement("br"))
                    }
                })
            }else if(spawns.entity.length == 1){
                let v = spawns.entity[0]
                let ent_id = v.type + "." + v.variant + "." + v.subtype
                let text = "生成:" + ent_id
                let ent_data = this.database.db.get(ent_id)
                if(ent_data){
                    let name = ent_data?.entityTabx?.NameZH
                    if(name){
                        text += "(" + name + ")"
                    }else if(ent_data.page){
                        text += "(" + ent_data.page + ")"
                    }
                }
                if(ent_data.page != undefined){
                    let a = document.createElement("a")
                    a.innerText = text
                    a.href = huijiPageUrl(ent_data.page)
                    a.target = "_blank"
                    floatBody.appendChild(a)
                    floatBody.appendChild(document.createElement("br"))
                }else{
                    let a = document.createElement("ap")
                    a.innerText = text
                    floatBody.appendChild(a)
                    floatBody.appendChild(document.createElement("br"))
                }

            }else{
                floatBody.innerText = "这个单元格不会生成任何实体"
            }
        }else if(doors != undefined){
            title = "坐标：(" + doors.x + "," + doors.y + ")"
            if(doors.exists){
                floatBody.innerText = "这是一扇门"
            }else{
                floatBody.innerText = "这里不会生成一扇门"
            }
        }

        let close_button = document.createElement("span")
        close_button.innerText = "[关闭]"
        close_button.style.cursor = "pointer"
        close_button.style.userSelect = "none"
        close_button.style.marginRight = "8px"
        close_button.onclick = ()=>{
            this.floatWindow.style.display = "none"
            this.floatWindow.style.transition = ""
        }
        title_div.appendChild(close_button)

        if(title){
            let title_txt_div = document.createElement("span")
            title_txt_div.innerText = title
            close_button.style.userSelect = "none"
            title_div.appendChild(title_txt_div)
        }

        floatBody.style.margin = "8px"

        this.floatWindow.appendChild(floatBody)
    }

    unclickFunction:()=>void

    is_in_preview_mode = true
    entity_preview_mode_datas:Array<[HTMLElement, string]> = []
    entity_grid_mode_datas:Array<[HTMLElement,string]> = []

    toPreviewMode(){
        this.is_in_preview_mode = true
        for(let d of this.entity_preview_mode_datas){
            d[0].style.transform = d[1]
        }
    }
    toGridMode(){
        this.is_in_preview_mode = false
        for(let d of this.entity_grid_mode_datas){
            d[0].style.transform = d[1]
        }
    }

    render(){
        let margin = this.margin
        this.rootContainer.innerHTML = ""
        
        let root = document.createElement("div")
        root.innerHTML = ""
        this.rootDiv = root
        root.style.textAlign = "left"
        this.rootContainer.appendChild(root)
        root.style.width = (2 * margin + this.roomJson.width * this.blockSize)+"px"
        root.style.height = (2*margin + this.roomJson.height * this.blockSize) + "px"
        root.style.position = "relative"
        root.style.display = "inline-block"

        this.setupScaledMode()
        
        //draw background
        if(this.skin.getBackgroundSpriteUrl(this.roomJson) && DrawRoomBackground(root,this, margin)){
            //already draw room background with sprite texture
        }else if(this.roomJson.type == EnumRoomType.ROOM_DUNGEON){
            //draw black background
            let bg = document.createElement("div")
            bg.style.width = this.roomJson.width * this.blockSize + 2 * margin + "px"
            bg.style.height = this.roomJson.height * this.blockSize + 2 * margin + "px"
            bg.style.background = "black"
            root.appendChild(bg)
            this.pos(bg,0,0)
        }else{
            let backgroundInfo = this.skin.getBackgroundUrl(this.roomJson)
            let backgroundUrl = backgroundInfo.file
    
            if(backgroundUrl != ""){
                let backgroundDiv = new Image()
                backgroundDiv.src = huijiImageUrl(backgroundUrl)
                backgroundDiv.style.userSelect = "none"
                backgroundDiv.setAttribute("draggable", "false")
                root.appendChild(backgroundDiv)
                this.pos(backgroundDiv, 0,0)
                backgroundDiv.style.left = margin + "px"
                backgroundDiv.style.top = margin + "px"
                if(backgroundInfo.transform){
                    backgroundDiv.style.transform = backgroundInfo.transform
                }
            }
        }
        
        //draw doors
        this.trySolveDoors()
        let not_exist_door_parent = document.createElement("div")
        not_exist_door_parent.style.width = this.roomJson.width * this.blockSize + "px"
        not_exist_door_parent.style.height = this.roomJson.height * this.blockSize + "px"
        not_exist_door_parent.style.display = "none"
        this.pos(not_exist_door_parent,0,0)
        root.appendChild(not_exist_door_parent)

        let door_url = huijiImageUrl(this.skin.getDoorUrl(this.roomJson))
        let door_width = 64
        let door_height = 42
        for(let {x,y,exists, direction} of this.roomJson.doors){
            let img = document.createElement("div")
            img.style.width = door_width + "px"
            img.style.height = door_height + "px"

            let i1 = document.createElement("div")
            i1.style.background= "url("+ door_url + ")"
            i1.style.width = door_width +"px"
            i1.style.height = door_height+"px"
            i1.style.overflow = "hidden"
            i1.style.backgroundPositionX = -door_width + "px"
            i1.style.position = "absolute"
            img.appendChild(i1)
            i1 = document.createElement("div")
            i1.style.background= "url("+ door_url + ")"
            i1.style.width = door_width +"px"
            i1.style.height = door_height+"px"
            i1.style.overflow = "hidden"
            img.appendChild(i1)
            this.pos(i1,0,0)
            img.style.position = "absolute"
            if(!exists){
                img.style.filter = "opacity(0.5)"
            }
            let w = door_width,h=door_height
            switch(direction){
                case DoorDir.TOP:
                        img.style.transform = "translate(" + 
                            ((x+.5) * this.blockSize + margin) + "px, " +
                            ((y + 1) * this.blockSize + margin) + "px) translate("+(-w/2)+"px," + (-h/2)+ "px) scale(1.5) rotate(0deg) translate(0px," + (-h/2) + "px)"
                    break;
                case DoorDir.LEFT:
                        img.style.transform = "translate(" + 
                            ((x + 1) * this.blockSize + margin) + "px, " +
                            ((y + .5) * this.blockSize + margin) + "px) translate("+(-w/2)+"px," + (-h/2)+ "px) scale(1.5) rotate(-90deg) translate(0px," + (-h/2) + "px)"
                    break;
                case DoorDir.BOTTOM: 
                        img.style.transform = "translate(" + 
                            ((x + .5) * this.blockSize + margin) + "px, " +
                            ((y) * this.blockSize + margin) + "px) translate("+(-w/2)+"px," + (-h/2)+ "px) scale(1.5) rotate(180deg) translate(0px," + (-h/2) + "px)"
                break;
                case DoorDir.RIGHT:
                        img.style.transform = "translate(" + 
                            ((x) * this.blockSize + margin) + "px, " +
                            ((y + .5) * this.blockSize + margin) + "px) translate("+(-w/2)+"px," + (-h/2)+ "px) scale(1.5) rotate(90deg) translate(0px," + (-h/2) + "px)"
                break;
            }
            img.style.zIndex = "60001"
            if(exists){
                root.appendChild(img)
            }else{
                not_exist_door_parent.appendChild(img)
            }
            
        }
        
        const pitDrawer = new PitDrawer(this)

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

            let zIndex = 1000

            // let highlight_elems : HTMLElement[] = []
            for(let ent of entity){
                if(pitDrawer.isPitEntity(ent.type, ent.variant, ent.subtype)){
                    pitDrawer.markPit(x,y,ent)
                    continue
                }
                const ent_id_str = ent.type + "." + ent.variant + "." + ent.subtype
                let dbItem = this.database.db.get(ent_id_str)
                const img = dbItem?.image_url
                let f = dbItem.func

                let page = dbItem.page
                

                if(ent.type == 1931 && ent.variant != 0){
                    f = (t,v,s,size)=>{
                        let r = document.createElement("span")
                        r.classList.add("rooms_spike")
                        r.classList.add("rooms_spike_" + v)
                        r.style.transform = " translate(-12px,-12px) scale(" + 2 * size / 52 + ") translate(12px,12px)"
                        return r
                    }
                }

                if(ent.type == 5 && ent.variant == 100 && ent.subtype != 0){
                    f = (t,v,s,size)=>{
                        let r = document.createElement("span")
                        r.classList.add("icons")
                        r.classList.add("collectibles")
                        r.id = "collectibles_" + s
                        r.style.transform = "scale(" + size / 52 + ")"

                        let a = document.createElement("a")
                        a.href = huijiPageUrl("c" + s)
                        a.target = "_blank"
                        a.appendChild(r)
                        return a
                    }
                }
                
                if(ent.type == 5 && ent.variant == 350 && ent.subtype != 0){
                    f = (t,v,s,size)=>{
                        let r = document.createElement("span")
                        r.classList.add("icons")
                        r.classList.add("trinket")
                        r.id = "trinket_" + s
                        r.style.transform = "scale(" + size / 52 + ")"

                        let a = document.createElement("a")
                        a.href = huijiPageUrl("t" + s)
                        a.target = "_blank"
                        a.appendChild(r)
                        return a
                    }
                }

                if(ent.type == 6000){
                    let x = 0
                    let y = 0
                    let gen_func = ()=>{
                        zIndex = 999
                        let r = document.createElement("div")
                        r.style.width = "26px"
                        r.style.height = "26px"
                        this.pos(r, 0,0)
                        r.style.background = "url(https://huiji-public.huijistatic.com/isaac/uploads/9/9b/Anm2_resources-dlc3_gfx_grid_grid_rails.png)"
                        r.style.backgroundPositionX = x*-26 + "px"
                        r.style.backgroundPositionY = y*-26 + "px"
                        r.style.overflow = "hidden"
                        r.style.transform = "translate(-13px,-13px) scale(2) translate(13px,13px)"
                        return r
                    }
                    switch(ent.variant){
                        case 0:
                            x = 0, y=0, f=gen_func;
                            break
                        case 1:
                            x=1,y=0,f=gen_func
                            break
                        case 2: x=0,y=1,f=gen_func;break;
                        case 3:x=1,y=1,f=gen_func;break;
                        case 4:x=0;y=2;f=gen_func;break;
                        case 5:x=1;y=2;f=gen_func;break;
                        case 6:x=2;y=2;f=gen_func;break;
                        case 7:x=2;y=0;f=gen_func;break;
                        case 8:x=3;y=0;f=gen_func;break;
                        case 9:x=2;y=1;f=gen_func;break;
                        case 10:x=3;y=1;f=gen_func;break;
                    }
                }

                if(ent.type == 0 && ent.variant == 10){
                    f = ()=>{
                        let r = document.createElement("div")
                        r.style.width = "26px"
                        r.style.height = "26px"
                        this.pos(r, 0,0)
                        r.style.background = "url(https://huiji-public.huijistatic.com/isaac/uploads/f/f4/Anm2_resources_gfx_grid_tiles_itemdungeon.png)"
                        r.style.overflow = "hidden"
                        r.style.transform = "translate(-13px,-13px) scale(2) translate(13px,13px)"
                        return r
                    }
                }

                if(ent.type == 0 && ent.variant == 20){
                    f = ()=>{
                        let r = document.createElement("div")
                        r.style.width = "26px"
                        r.style.height = "26px"
                        this.pos(r, 0,0)
                        r.style.background = "url(https://huiji-public.huijistatic.com/isaac/uploads/f/f4/Anm2_resources_gfx_grid_tiles_itemdungeon.png)"
                        r.style.backgroundPositionX = 1*-26 + "px"
                        r.style.backgroundPositionY = 0*-26 + "px"
                        r.style.overflow = "hidden"
                        r.style.transform = "translate(-13px,-13px) scale(2) translate(13px,13px)"
                        return r
                    }
                }
                if(ent.type == 0 && ent.variant == 30){
                    f = ()=>{
                        let r = document.createElement("div")
                        r.style.width = "26px"
                        r.style.height = "26px"
                        this.pos(r, 0,0)
                        r.style.background = "url(https://huiji-public.huijistatic.com/isaac/uploads/f/f4/Anm2_resources_gfx_grid_tiles_itemdungeon.png)"
                        r.style.backgroundPositionX = 1*-26 + "px"
                        r.style.backgroundPositionY = 1*-26 + "px"
                        r.style.overflow = "hidden"
                        r.style.transform = "translate(-13px,-13px) scale(2) translate(13px,13px)"
                        return r
                    }
                }
                if(this.roomJson.type == EnumRoomType.ROOM_DUNGEON && ent.type == 1900 && ent.subtype == 0 && ent.variant == 0){
                    f = ()=>{
                        let r = document.createElement("div")
                        r.style.width = "26px"
                        r.style.height = "52px"
                        this.pos(r, 0,0)
                        r.style.background = "url(https://huiji-public.huijistatic.com/isaac/uploads/f/f4/Anm2_resources_gfx_grid_tiles_itemdungeon.png)"
                        r.style.backgroundPositionX = 2*-26 + "px"
                        r.style.backgroundPositionY = 1*-26 + "px"
                        r.style.overflow = "hidden"
                        r.style.transform = "translate(0,-13px) translate(-13px,-13px) scale(2) translate(13px,13px)"
                        zIndex = 300 - y
                        return r
                    }
                }

                if(f == undefined && img){
                    f = (t,v,s,size)=>{
                        let ret:HTMLElement = image(img, size, undefined, entity.length == 1 ? this : undefined, dbItem?.rawScale)
                        // highlight_elems.push(ret)
                        if(page && !this.no_operate_mode){
                            let a = document.createElement("a")
                            a.href = huijiPageUrl(page)
                            a.target = "_blank"
                            a.appendChild(ret)
                            ret = a
                        }
                        return ret
                    }
                }

                
                if(f == undefined){
                    f = (t,s,v,size)=>{
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
                        div.style.transform = "scale(" + size / 52 + ")"
                        div.style.color = "white"
            
                        return div
                        root.appendChild(div)
                        this.pos(div, x*this.blockSize, y*this.blockSize)
                    }
                    // f = (t,v,s, size)=>{
                    //     let div = document.createElement("div")
                    //     div.innerText = "NF_" + t+"."+v+"."+s
                    //     div.style.transform = "scale(" + size / 52 + ")"
                    //     return div
                    // }
                }

                let left = (x + (subIndex % rowCount) * subScale ) * this.blockSize + margin
                let top = (y + Math.floor(subIndex / rowCount) * subScale ) * this.blockSize + margin
                let div = f(ent.type,ent.variant,ent.subtype, this.blockSize * subScale) as HTMLElement
                let divParent = document.createElement("div")
                root.appendChild(divParent)
                this.pos(divParent, left, top)
                divParent.appendChild(div)
                divParent.style.zIndex = zIndex.toString()
                subIndex += 1
            }
        }

        pitDrawer.drawPits(root)

        //draw grid
        let grid_parent = document.createElement("div")
        root.appendChild(grid_parent)
        grid_parent.style.width = this.roomJson.width * this.blockSize + "px"
        grid_parent.style.height = this.roomJson.height * this.blockSize + "px"
        grid_parent.style.zIndex = "70000"

        let gridInfos = new Map<string, {spawn:SpawnInfo|undefined, door:DoorInfo|undefined}>()
        this.roomJson.spawns.forEach(v=>{
            gridInfos.set(v.x + "_" + v.y, {spawn:v,door:undefined})
        })

        this.roomJson.doors.forEach(d=>{
            let id = d.x + "_" + d.y
            if(gridInfos.has(id))
                return
            gridInfos.set(id, {spawn:undefined, door:d})
        })

        for(let x=0;x<this.roomJson.width;x++){
            for(let y=0;y<this.roomJson.height;y++){
                let grid_div = document.createElement("div")
                grid_div.style.width = this.blockSize + "px"
                grid_div.style.height=  this.blockSize + "px"
                grid_div.classList.add("room-renderer-grid-block")
                grid_div.style.userSelect = "none"
                grid_div.style.cursor = "pointer"
        
                grid_parent.appendChild(grid_div)
                
                this.pos(grid_div, x*this.blockSize, y*this.blockSize)

                let gridInfo = gridInfos.get(x+"_"+y)
                if(gridInfo){
                    grid_div.onclick = (e)=>{
                        this.displayGridInfo(e, gridInfo.spawn, gridInfo.door)
                    }
                }else{
                    grid_div.onclick = (e)=>{
                        this.displayGridInfo(e,undefined, undefined)
                    }
                }
            }
        }
        grid_parent.style.display = "none"
        this.pos(grid_parent,margin,margin)

        let iconNextY = 25
        let iconPos = (e:HTMLElement)=>{
            this.pos(e,8,iconNextY)
            e.style.zIndex = "80000"
            iconNextY += 20
        }
        if(!this.no_operate_mode){
            let GIcon = document.createElement("div")
            let grid_parent_visible = false
            root.appendChild(GIcon)
            iconPos(GIcon)
            GIcon.innerText = "[格]"
            GIcon.style.userSelect = "none"
            GIcon.style.cursor = "pointer"
            GIcon.style.color = "white"
            GIcon.onclick = ()=>{
                grid_parent_visible = !grid_parent_visible
                grid_parent.style.display = grid_parent_visible ? "" : "none"
                GIcon.style.color = grid_parent_visible ? "green" : "white"
                if(this.is_in_preview_mode){
                    this.toGridMode()
                }else{
                    this.toPreviewMode()
                }
            }

            {
                let TemplateIcon = document.createElement("a")
                root.appendChild(TemplateIcon)
                iconPos(TemplateIcon)
                TemplateIcon.style.color = "white"
                TemplateIcon.innerText = "[模]"
                TemplateIcon.style.userSelect = "none"
                TemplateIcon.style.cursor = "pointer"
                TemplateIcon.onclick = ()=>{
                    let txt = `{{布局图标|${this.roomJson._id}}}`
                    let hint = ""
                    try{
                        navigator.clipboard.writeText(txt).then(function(){
                            (window as any).$message.success('wiki模板已复制：' + txt + hint,{duration:2000,keepAliveOnHover:true})}
                        ).catch(function(e){
                            (window as any).$message.error('以下内容复制失败：' + txt + hint);console.error(e)
                        })
                    }catch(e){
                        (window as any).$message.error('以下内容复制失败：' + txt + hint);console.error(e)
                    }
                }
            }

            {
                let SourceIcon = document.createElement("a")
                root.appendChild(SourceIcon)
                iconPos(SourceIcon)
                SourceIcon.style.color = "white"
                SourceIcon.innerText = "[源]"
                SourceIcon.style.userSelect = "none"
                SourceIcon.style.cursor = "pointer"
                SourceIcon.href = huijiPageUrl(this.roomJson._id)
                SourceIcon.target = "_blank"    
            }
    
            if(not_exist_door_parent.children.length > 0){
                let DoorIcon = document.createElement("div")
                let door_visible = false
                root.appendChild(DoorIcon)
                iconPos(DoorIcon)
                DoorIcon.style.color = "white"
                DoorIcon.innerText = "[门]"
                DoorIcon.style.userSelect = "none"
                DoorIcon.style.cursor = "pointer"
                DoorIcon.onclick = ()=>{
                    door_visible = !door_visible
                    not_exist_door_parent.style.display = door_visible ? "" : "none"
                    DoorIcon.style.color = door_visible ? "green" : "white"
                }    
            }
        }

        //draw text
        let textDiv = document.createElement("div")
        textDiv.style.fontFamily = "LCDPHONE"
        textDiv.style.fontSize = "16px"
        textDiv.style.color = "white"
        textDiv.style.marginLeft = "10px"
        textDiv.style.zIndex = "80001"
        root.appendChild(textDiv)
        this.pos(textDiv, 28,16)
        let displayText = (text:string, marginLeft:number, marginRight:number, click_copy:boolean)=>{
            let tx = document.createElement("span")
            tx.innerText = text
            tx.style.marginLeft = marginLeft + "px"
            tx.style.marginRight = marginRight + "px"
            // tx.style.font = "white 16px LCDPHONE"
            textDiv.appendChild(tx)
        }

        const stage_name = StageNames[this.roomJson._file]

        let is_greed = this.roomJson._file.indexOf("greed") >= 0

        if(is_greed){
            displayText("贪婪模式",5,5,false)
        }

        if(stage_name){
            displayText(stage_name, 5,5,false)
        }


        if(this.roomJson.type == EnumRoomType.ROOM_CHALLENGE){
            if(this.roomJson._file.indexOf("special rooms") >= 0){
                displayText("挑战(" + this.roomJson.variant + ")",5,5,false)
            }else{
                displayText("楼层专属挑战(" + this.roomJson.variant + ")",5,5,false)
            }
        }else if(this.roomJson.type == EnumRoomType.ROOM_BOSS && is_greed && this.roomJson.shape == EnumRoomShape.ROOMSHAPE_1x2){
            displayText("贪婪Boss(" + this.roomJson.variant + ")",5,5,false)
        }else{
            let gotoCommandFirstPart = RoomGoToCommand[this.roomJson.type]
            if(gotoCommandFirstPart){
                if(this.roomJson._file.indexOf("special rooms") >= 0){
                    //this is special rooms
                }else if(this.roomJson.type != EnumRoomType.ROOM_DEFAULT && this.roomJson.type != EnumRoomType.ROOM_NULL && gotoCommandFirstPart.startsWith("s.")){
                    gotoCommandFirstPart = "x." + gotoCommandFirstPart.substring(2)
                }
    
                const gotoCommand = "goto " + gotoCommandFirstPart + "." + this.roomJson.variant
                displayText(gotoCommand, 5, 5, true)
            }    
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

        displayText("权重:", 10,0,false)
        displayText(this.roomJson.weight.toString(), 0,0,false)


        if(verbose){
            displayText("type=" + this.roomJson.type + ",shape=" + this.roomJson.shape, 10,0,false)
        }

        this.floatWindow = document.createElement("div")
        root.appendChild(this.floatWindow)
        this.pos(this.floatWindow, 0,0)
        this.floatWindow.style.display = "none"
        // this.floatWindow.style.transition = ""


        if(this.click_mode){

            let mask = document.createElement("div")
            this.click_mask = mask
            mask.style.width = this.roomJson.width * this.blockSize + 2 * margin+ "px"
            mask.style.height = this.roomJson.height * this.blockSize + 2 * margin + "px"
            mask.style.userSelect = "none"
            mask.style.cursor = "pointer"
            mask.classList.add("rooms_click_mask")
            mask.style.textAlign = "center"
            mask.style.overflow = "hidden"
            mask.innerHTML = '<i class="fa fa-expand" style="height:50%;font-size:200px;transform:translateY(100%) translateY(-100px)" aria-hidden="true"></i>'
            mask.style.zIndex = "90000"
            mask.onclick = ()=>{
                RoomDrawer.activatingDrawer = this
                this.rootContainer.removeChild(this.rootDiv)
                RoomDrawer.documentFloatOverlay.appendChild(this.rootDiv)
                RoomDrawer.documentFloatOverlay.style.display = "block"
                // RoomDrawer.documentFloatOverlay.style.opacity = "1"
                this.click_mask.style.display = "none"
                setTimeout(()=>{
                    RoomDrawer.documentFloatOverlay.style.opacity = "1"
                },50)

                this.setupNonScaledMode()
                this.rootDiv.style.transition = "all 0.5s"
                this.rootDiv.style.top = "100px"
            }
            this.pos(mask,0,0)

            let UnclickIcon = document.createElement("div")
            root.appendChild(UnclickIcon)
            this.pos(UnclickIcon,12,4)
            UnclickIcon.style.color = "white"
            UnclickIcon.innerHTML = '<i class="fa fa-compress" aria-hidden="true"></i>'
            UnclickIcon.style.userSelect = "none"
            UnclickIcon.style.cursor = "pointer"
            UnclickIcon.style.zIndex = "80000"
            let pendingClick = false
            this.unclickFunction = ()=>{
                if(pendingClick)
                    return
                RoomDrawer.activatingDrawer = undefined
                pendingClick = true
                this.click_mask.style.display = ""
                RoomDrawer.documentFloatOverlay.removeChild(this.rootDiv)
                // RoomDrawer.documentFloatOverlay.style.display = "none"
                RoomDrawer.documentFloatOverlay.style.opacity = "0"
                setTimeout(()=>{
                    pendingClick = false
                    RoomDrawer.documentFloatOverlay.style.display = "none"
                    this.rootContainer.appendChild(this.rootDiv)
                    this.rootDiv.style.left = ""
                    this.rootDiv.style.top = ""
                    this.setupScaledMode()
                },200)

                // this.rootContainer.style.zIndex = ''
                // this.rootContainer.style.userSelect = "none"
                // this.rootContainer.style.position = "relative"
                // let parent = this.rootContainer.parentElement
                // if(parent && parent.tagName == "span" && parent.style.zIndex == "999987"){
                //     parent.style.zIndex = ''
                // }
                // setTimeout(()=>{
                //     if(this.rootContainer.style.transform == this.initial_transform){
                //         this.rootContainer.style.transition = ""
                //     }
                // }, 1000)
            }
            UnclickIcon.onclick = this.unclickFunction
            this.rootContainer.style.userSelect = "none"

            root.appendChild(mask)
        }
    }
}

RoomDrawer.documentFloatOverlay = document.createElement("div")
RoomDrawer.documentFloatOverlay.style.display = "none"
RoomDrawer.documentFloatOverlay.style.position = "fixed"
RoomDrawer.documentFloatOverlay.style.top = "0"
RoomDrawer.documentFloatOverlay.style.left = "0"
RoomDrawer.documentFloatOverlay.style.right = "0"
RoomDrawer.documentFloatOverlay.style.bottom = "0"
RoomDrawer.documentFloatOverlay.style.zIndex = "1000000"
RoomDrawer.documentFloatOverlay.style.background = "#000000bd"
RoomDrawer.documentFloatOverlay.style.textAlign = "center"
RoomDrawer.documentFloatOverlay.style.overflow = "auto"
RoomDrawer.documentFloatOverlay.style.opacity = "0"
RoomDrawer.documentFloatOverlay.style.transition = "opacity 0.2s"
RoomDrawer.documentFloatOverlay.onclick = function(evt){
    if(evt.target == RoomDrawer.documentFloatOverlay){
        if(RoomDrawer.activatingDrawer?.unclickFunction){
            RoomDrawer.activatingDrawer?.unclickFunction()
        }
    }
}
document.body.appendChild(RoomDrawer.documentFloatOverlay)    

let huijiJsonDatabase = new HuijiJsonDatabase()
let imageUrlDatabase = new EntityImageDatabase()

function renderElements(divs:ArrayLike<Element>){
    if(divs.length > 0){
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
}

renderElements(document.getElementsByClassName("room-renderer"));

(window as any).renderRooms = renderElements;


/////////////////// for Data:xxx.json preview ////////////////////
function initJsonPage(path) {
    let infocard = document.createElement("div");
    (infocard as any).style = "border:1px solid white;border-radius:8px;padding:10px"
    infocard.innerHTML = "<h4>房间布局文件</h4>" +
        '<div class="input-group">' +
        '<span class="input-group-addon" id="basic-addon1">文件路径：</span>' +
        '<input type="text" id="room-previewcard-title" class="form-control" readonly>' +
        '</div>' +
        "<div style='margin:10px 0 10px 0' id='room-previewcard-buttons'><button id='room-previewcard-displayjson' class='btn btn-primary' style='margin-top:10px'>显示原始JSON</button><button id='room-preview-card-load-room' class='btn btn-success' style='margin-left:10px;margin-top:10px'>预览布局</button><a id='huiji-json' class='btn btn-success' style='margin-left:10px;margin-top:10px'>灰机JSON编辑器</a></div>"
    ;
    (infocard.querySelector('#room-previewcard-title') as any).value = path;
    (infocard.querySelector("#huiji-json") as unknown as HTMLHyperlinkElementUtils).href = "/wiki/Data:Rooms.schema?target=" + (window as any).mw.config.get("wgPageName");
    let wiki_content = (window as any).$('#mw-content-text')[0]
    let json_table = wiki_content.querySelector('.mw-jsonconfig');
    (window as any).$(json_table).hide();

    wiki_content.appendChild(infocard);

    (infocard.querySelector('#room-previewcard-displayjson') as any).onclick = function () {
        infocard.remove();
        (window as any).$(json_table).show()
    };

    (infocard.querySelector('#room-preview-card-load-room') as any).onclick = function () {
        infocard.querySelector('#room-previewcard-buttons').remove()
        infocard.appendChild(document.createElement('hr'))

        let preview_root_div = document.createElement("div")
        preview_root_div.setAttribute("data-path", path)
        infocard.appendChild(preview_root_div)
        renderElements([preview_root_div])
    }
}


let pageName = (window as any).mw.config.get("wgPageName")
if (pageName && pageName.startsWith("Data:Rooms/") && pageName.endsWith(".json")) {
    verbose = true;
    initJsonPage(pageName)
}
