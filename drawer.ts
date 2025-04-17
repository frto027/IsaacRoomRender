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
    canvas: HTMLCanvasElement;
    roomJson: RoomData;

    neededImages = new Map<string, HTMLImageElement|undefined>
    pendingImages = new Set<string>()

    isBackgroundLoaded = false
    backgroundImage:HTMLImageElement
    database:EntityImageDatabase

    doorImageLoaded = false
    doorImage:HTMLImageElement


    blockSize = 52
    scale = 1

    constructor(database:EntityImageDatabase, canvas:HTMLCanvasElement, roomJson:RoomData, scale = 1){
        this.canvas = canvas,
        this.roomJson = roomJson

        this.database = database
        this.scale = scale

        database.drawers.add(this)

        //entities
        roomJson.spawns.forEach(v=>{
            v.entity.forEach(e=>{
                database.requestEntity(e.type, e.variant, e.subtype)
                this.neededImages.set(e.type + "." + e.variant + "." + e.subtype, undefined)
            })
        })

        {
            let img:HTMLImageElement = new Image()
            img.onload = ()=>{
                this.isBackgroundLoaded = true
                this.render()
            }
            img.src = getBackgroundUrl(0, roomJson.shape)
            this.backgroundImage = img    
        }
        {
            let img = new Image()
            img.onload = ()=>{
                this.doorImageLoaded = true
                this.render()
            }
            img.src = "https://huiji-public.huijistatic.com/isaac/uploads/e/e9/Normal_Door.png"
            this.doorImage = img
        }
    }

    startLoadImage(){
        this.neededImages.forEach((v,k)=>{
            if(v == undefined){
                let theImg = k
                let url = this.database.db.get(theImg)?.image_url
                if(url){
                    this.pendingImages.add(theImg)
                    let imgElem = new Image()
                    imgElem.onload = ()=>{
                        this.pendingImages.delete(theImg)
                        imgElem.onload = ()=>{}
                        if(this.pendingImages.size == 0){
                            this.render()
                        }
                    }
                    imgElem.src = url
                }
            }
        })
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
    
    render(){
        const ctx = this.canvas.getContext("2d")
        if(!ctx)
            return

        this.canvas.width = this.blockSize * this.roomJson.width * this.scale
        this.canvas.height = this.blockSize * this.roomJson.height * this.scale

        ctx.resetTransform()
        ctx.scale(this.scale, this.scale)

        ctx.clearRect(0,0,this.blockSize * this.roomJson.width, this.blockSize * this.roomJson.height)

        //draw background
        if(this.isBackgroundLoaded){
            ctx.drawImage(this.backgroundImage, 0,0)
        }
        // ctx.translate(this.blockSize/2, this.blockSize/2)

        //draw doors
        if(this.doorImageLoaded){
            this.trySolveDoors()
            for(let {x,y,exists, direction} of this.roomJson.doors){
                let w = this.doorImage.width
                let h = this.doorImage.height
                ctx.save()

                switch(direction){
                    case DoorDir.TOP:
                        ctx.translate((x+.5)* this.blockSize,(y+1) * this.blockSize)
                        ctx.rotate(0);
                        break;
                    case DoorDir.LEFT:
                        ctx.translate((x+1)* this.blockSize,(y+.5) * this.blockSize)
                        ctx.rotate(-Math.PI / 2);
                        break;
                    case DoorDir.BOTTOM: 
                    ctx.translate((x+.5)* this.blockSize,(y) * this.blockSize)
                    ctx.rotate(Math.PI); 
                    break;
                    case DoorDir.RIGHT:
                        ctx.translate((x)* this.blockSize,(y+.5) * this.blockSize)
                        ctx.rotate(Math.PI/2);
                    break;
                }
                ctx.drawImage(this.doorImage, -w/2, -h)
                ctx.restore()
            }
        }

        //draw entity
        for(let {x,y,entity} of this.roomJson.spawns){
            
            ctx.strokeRect(x*this.blockSize, y*this.blockSize,this.blockSize,this.blockSize)
            
            for(let ent of entity){
                const ent_id_str = ent.type + "." + ent.variant + "." + ent.subtype
                const img = this.neededImages.get(ent_id_str)
                if(!img){
                    const margin = 2
                    ctx.fillText(ent_id_str, x * this.blockSize + margin, (y + 1) * this.blockSize, this.blockSize - 2 * margin)
                    continue
                }

                ctx.drawImage(img, x * this.blockSize, y * this.blockSize, this.blockSize, this.blockSize)
            }
        }
    }
}


let divs = document.getElementsByClassName("room-renderer")
if(divs.length > 0){
    let imageUrlDatabase = new EntityImageDatabase()
    let roomDrawers:RoomDrawer[] = []
    for(let i=0;i<divs.length;i++){
        let div = divs[0]
        
        let roomJsonStr = div.getAttribute("data-json")
        if(roomJsonStr == undefined)
            continue
        let roomJson:RoomData
        try{
            roomJson = JSON.parse(roomJsonStr) as RoomData
        }catch(e){
            console.log(e)
            continue
        }
        
        let canvas = document.createElement("canvas")
        canvas.width = 0
        canvas.height = 0
        let drawer = new RoomDrawer(imageUrlDatabase, canvas, roomJson, 0.5)
        roomDrawers.push(drawer)
        div.innerHTML = ""
        div.appendChild(canvas)
    }

    imageUrlDatabase.sendUrlObtainRequest(()=>{
        roomDrawers.forEach(d=>d.startLoadImage())
    })
}
