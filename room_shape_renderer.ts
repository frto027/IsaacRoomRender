function DrawRoomBackground(root:HTMLElement, drawer:RoomDrawer, margin:number){
    if([
        EnumRoomType.ROOM_PLANETARIUM,
        EnumRoomType.ROOM_ERROR,
        EnumRoomType.ROOM_DUNGEON,
        // EnumRoomType.ROOM_LIBRARY,
        // EnumRoomType.ROOM_SHOP,
        // EnumRoomType.ROOM_ISAACS,
        // EnumRoomType.ROOM_BARREN,
        // EnumRoomType.ROOM_ARCADE,
        // EnumRoomType.ROOM_DICE,
        // EnumRoomType.ROOM_SECRET,
        // EnumRoomType.ROOM_SACRIFICE,
    ].indexOf(drawer.roomJson.type) >= 0){
        return false
    }

    let backgroundDiv = document.createElement("canvas")
    backgroundDiv.style.position = "absolute"
    backgroundDiv.style.left = "0"
    backgroundDiv.style.top = "0"
    // backgroundDiv.style.transform = `translate(-${margin*1.5}px,-${margin*1.5}px)`

    let w = drawer.roomJson.width * 52 + margin * 2
    let h = drawer.roomJson.height * 52 + margin * 2
    backgroundDiv.width = w
    backgroundDiv.height = h
    root.appendChild(backgroundDiv)

    let ctx = backgroundDiv.getContext("2d")

    let img = new Image()

    let redraw = ()=>{
        function center(x,y,sx,sy){
            ctx.resetTransform()
            ctx.translate(x*52,y*52)
            ctx.translate(margin,margin)
            ctx.scale(sx*1.5,sy*1.5)
        }
    
        function drawImg(sx,sy,w,h,dx,dy){
            ctx.drawImage(img, sx*52,sy*52,w*52,h*52,dx*52,dy*52,w*52,h*52)
        }
    
        let floor = (x:number,y:number,w:number,h:number )=>{
            drawImg(1.5,1.5,Math.min(3,w), Math.min(1.5,h), x,y)
        }
        //H - 垂直 V- 水平 C - 中间部分
        let wallH = (x:number, y:number, w:number)=>{
            drawImg(0,0,Math.min(4.5,w),1.5,x,y)
        }
        let wallHC = (x:number, y:number, w:number)=>{
            drawImg(1.5,0,Math.min(3,w), 1.5, x,y)
        }
        let wallV = (x:number, y:number, h:number)=>{
            drawImg(0,0,1.5,Math.min(3,h), x,y)
        }
        let wallVC = (x:number, y:number, h:number)=>{
            drawImg(0,1.5,1.5,Math.min(1.5,h),x,y)
        }
        let centerCorner = (x:number, y:number)=>{
            drawImg(9,0,1,1,x,y)
        }
        let F = ()=>{}
        let F_room2X2 = ()=>{
            let narrow = 0.01
            wallH(-1,-1, 4.5)
            wallHC(1.5-narrow,-1,Infinity)
            wallHC(4.5-narrow,-1,Infinity)
            wallHC(4-narrow,-1,Infinity)
            wallHC(6-narrow,-1,Infinity)
            wallV(-1,-1,3)
            wallVC(-1,1-narrow,Infinity)
            wallVC(-1,2-narrow,Infinity)
            wallVC(-1,3-narrow,Infinity)
            
            for(let x = 0.5;x<=6.7;x+=2){
                for(let y=0.5;y<=3.7;y+=1){
                    floor(x*0.99, y*0.99,Infinity, Infinity)
                }
            }      
            wallVC(-1,4-narrow,Infinity)
        }
        let F_room2X2_wider = F_room2X2

        if(drawer.skin.getBackgroundSpriteUrl(drawer.roomJson) == "Anm2_resources_gfx_backdrop_12_darkroom.png" && drawer.roomJson.shape > EnumRoomShape.ROOMSHAPE_2x2){
            F_room2X2 = ()=>{
                let narrow = 0.01
                wallH(-1,-1, 4.5)
                wallHC(3.5-narrow,-1,Infinity)
                wallHC(5.5-narrow,-1,Infinity)
                wallV(-1,-1,3)
                wallVC(-1,2-narrow,Infinity)
                wallVC(-1,3-narrow,Infinity)
                
                for(let x = 0.5;x<=6.7;x+=2){
                    for(let y=0.5;y<=3.7;y+=1){
                        floor(x*0.99, y*0.99,8.5-x,4.5-y)
                    }
                }      
                wallHC(6.5-narrow,-1,2)
            }
            F_room2X2_wider = ()=>{
                let narrow = 0.01
                wallH(-1,-1, 4.5)
                wallHC(3.5-narrow,-1,Infinity)
                wallHC(5.5-narrow,-1,Infinity)
                wallV(-1,-1,3)
                wallVC(-1,2-narrow,Infinity)
                wallVC(-1,3-narrow,Infinity)
                for(let x = 0.5;x<=6.7;x+=2){
                    for(let y=0.5;y<=3.7;y+=1){
                        floor(x*0.99, y*0.99,8.5-x,4.5-y)
                    }
                }      
    
                wallHC(6.5-narrow,-1,Infinity)
                wallVC(-1,4-narrow,1)
                for(let x = 0.5;x<=6.7;x+=2){
                    for(let y=0.5;y<=3.7;y+=1){
                        if(x > 5&& y > 3)
                            continue
                        floor(x*0.99, y*0.99,Infinity,Infinity)
                    }
                }
                floor(6.5*0.99, 3.5*0.99,Infinity,1.15)
                floor(6.5*0.99, 3.5*0.99,2.1,Infinity)
    
    
            }
    
        }
        let F_2x2Corner_Center = ()=>{
            centerCorner(-1,-1)
        }
        let F_2x2Corner_Wall_H = ()=>{
            wallH(-1,-1,Infinity)
            wallHC(3, -1, Infinity)
            wallHC(4, -1, Infinity)
            wallHC(5, -1, Infinity)
            wallHC(5.5, -1, Infinity)
        }
        let F_2x2Corner_Wall_V = ()=>{
            wallV(-1,-1,Infinity)
            wallVC(-1,2,Infinity)
            wallVC(-1,3,Infinity)
        }
        switch(drawer.roomJson.shape){
            case EnumRoomShape.ROOMSHAPE_1x1:
                center(1,1,1,1)
                F = ()=>{
                    let narrow = 0.01
                    wallH(-1,-1, 4.5)
                    wallHC(3.5-narrow,-1,Infinity)
                    wallHC(4-narrow,-1,2)
                    wallV(-1,-1,3)
                    wallVC(-1,2-narrow,Infinity)
                    floor(2.5-narrow,0.5,Infinity,Infinity)
                    floor(2.5-narrow,1.5-narrow,Infinity,Infinity)
                    floor(0.5-narrow,0.5,Infinity,Infinity)
                    floor(0.5-narrow,1.5-narrow,Infinity,Infinity)
                }
                F()
                center(14,1,-1,1)
                F()
                center(1,8,1,-1)
                F()
                center(14,8,-1,-1)
                F()
                break
            case EnumRoomShape.ROOMSHAPE_IH:
                center(1,3,1,1)
                F = ()=>{
                    let narrow = 0.01
                    wallH(-1,-1, 4.5)
                    wallHC(3.5-narrow,-1,Infinity)
                    wallV(-1,-1,2.5)
                    floor(2.5-narrow,0.5,Infinity,Infinity)
                    floor(0.5-narrow,0.5,Infinity,Infinity)
                }
                F()
                center(14,3,-1,1)
                F()
                center(1,6,1,-1)
                F()
                center(14,6,-1,-1)
                F()
                break
            case EnumRoomShape.ROOMSHAPE_IV:
                center(5,1,1,1)
                F = ()=>{
                    let narrow = 0.01
                    wallH(-1,-1, 3.5)
                    wallHC(1.5-narrow,-1,1)
                    wallV(-1,-1,3)
                    wallVC(-1,2-narrow,Infinity)
                    // floor(2.5-narrow,0.5,2.5,Infinity)
                    // floor(2.5-narrow,1.5-narrow,Infinity,Infinity)
                    floor(0.5-narrow,0.5,2,Infinity)
                    floor(0.5-narrow,1.5-narrow,2,Infinity)
                }
                F()
                center(10,1,-1,1)
                F()
                center(5,8,1,-1)
                F()
                center(10,8,-1,-1)
                F()
                break
            case EnumRoomShape.ROOMSHAPE_1x2:
                center(1,1,1,1)
                F = ()=>{
                    let narrow = 0.01
                    wallH(-1,-1, 4.5)
                    wallHC(3.5-narrow,-1,Infinity)
                    wallHC(4-narrow,-1,Infinity)
                    wallV(-1,-1,3)
                    wallVC(-1,1-narrow,Infinity)
                    wallVC(-1,2-narrow,Infinity)
                    wallVC(-1,3-narrow,Infinity)
                    wallVC(-1,4-narrow,Infinity)
                    wallVC(-1,5-narrow,Infinity)
                    floor(2.5-narrow,0.5,Infinity,Infinity)
                    floor(2.5-narrow,1.5-narrow,Infinity,Infinity)
                    floor(2.5-narrow,2.5-narrow,Infinity,Infinity)
                    floor(2.5-narrow,3.5-narrow,Infinity,Infinity)
                    floor(2.5-narrow,4.5-narrow,Infinity,Infinity)
                    floor(0.5-narrow,0.5,Infinity,Infinity)
                    floor(0.5-narrow,1.5-narrow,Infinity,Infinity)
                    floor(0.5-narrow,2.5-narrow,Infinity,Infinity)
                    floor(0.5-narrow,3.5-narrow,Infinity,Infinity)
                    floor(0.5-narrow,4.5-narrow,Infinity,Infinity)
                }
                F()
                center(14,1,-1,1)
                F()
                center(1,15,1,-1)
                F()
                center(14,15,-1,-1)
                F()
                break
            case EnumRoomShape.ROOMSHAPE_IIV:
                center(5,1,1,1)
                F = ()=>{
                    let narrow = 0.01
                    wallH(-1,-1, 3.5)
                    wallHC(1.5,-1,1)
                    wallV(-1,-1,3)
                    wallVC(-1,1-narrow,Infinity)
                    wallVC(-1,2-narrow,Infinity)
                    wallVC(-1,3-narrow,Infinity)
                    wallVC(-1,4-narrow,Infinity)
                    wallVC(-1,5-narrow,Infinity)
                    floor(0.5-narrow,0.5,2,Infinity)
                    floor(0.5-narrow,1.5-narrow,2,Infinity)
                    floor(0.5-narrow,2.5-narrow,2,Infinity)
                    floor(0.5-narrow,3.5-narrow,2,Infinity)
                    floor(0.5-narrow,4.5-narrow,2,Infinity)
                }
                F()
                center(10,1,-1,1)
                F()
                center(5,15,1,-1)
                F()
                center(10,15,-1,-1)
                F()
                break
            case EnumRoomShape.ROOMSHAPE_2x1:
                center(1,1,1,1)
                F = ()=>{
                    let narrow = 0.01
                    wallH(-1,-1, 4.5)
                    wallHC(1.5-narrow,-1,Infinity)
                    wallHC(3.5-narrow,-1,Infinity)
                    wallHC(4.5-narrow,-1,Infinity)
                    wallHC(6.5-narrow,-1,Infinity)
                    wallV(-1,-1,3)
                    wallVC(-1,2-narrow,Infinity)
                    floor(6.5-narrow,0.5,Infinity,Infinity)
                    floor(6.5-narrow,1.5-narrow,Infinity,Infinity)
                    floor(4.5-narrow,0.5,Infinity,Infinity)
                    floor(4.5-narrow,1.5-narrow,Infinity,Infinity)
                    floor(2.5-narrow,0.5,Infinity,Infinity)
                    floor(2.5-narrow,1.5-narrow,Infinity,Infinity)
                    floor(0.5-narrow,0.5,Infinity,Infinity)
                    floor(0.5-narrow,1.5-narrow,Infinity,Infinity)
                }
                F()
                center(27,1,-1,1)
                F()
                center(1,8,1,-1)
                F()
                center(27,8,-1,-1)
                F()
                break
            case EnumRoomShape.ROOMSHAPE_IIH:
                center(1,3,1,1)
                F = ()=>{
                    let narrow = 0.01
                    wallH(-1,-1, 4.5)
                    wallHC(1.5-narrow,-1,Infinity)
                    wallHC(3.5-narrow,-1,Infinity)
                    wallHC(6.5-narrow,-1,Infinity)
                    wallHC(7.5-narrow,-1,Infinity)
                    wallV(-1,-1,2.5)
                    floor(6.5-narrow,0.5,Infinity,Infinity)
                    floor(4.5-narrow,0.5,Infinity,Infinity)
                    floor(2.5-narrow,0.5,Infinity,Infinity)
                    floor(0.5-narrow,0.5,Infinity,Infinity)
                }
                F()
                center(27,3,-1,1)
                F()
                center(1,6,1,-1)
                F()
                center(27,6,-1,-1)
                F()
                break
            case EnumRoomShape.ROOMSHAPE_2x2:
                center(1,1,1,1)
                F = ()=>{F_room2X2();F_room2X2_wider()}
                F()
                center(27,1,-1,1)
                F()
                center(1,15,1,-1)
                F()
                center(27,15,-1,-1)
                F()
                break
            case EnumRoomShape.ROOMSHAPE_LTL:
                center(1,1,1,1)
                F = F_room2X2
                // F()
                center(27,1,-1,1)
                F();
                center(1,15,1,-1)
                F()
                center(27,15,-1,-1)
                // F()
                F_room2X2_wider()

                center(1,8,1,1)
                F_2x2Corner_Wall_H()
                center(14,1,1,1)
                F_2x2Corner_Wall_V()
                center(14,8,1,1)
                F_2x2Corner_Center()
                
                break
            case EnumRoomShape.ROOMSHAPE_LTR:
                center(1,1,1,1)
                F = F_room2X2
                F()
                center(27,1,-1,1)
                // F()
                center(1,15,1,-1)
                // F()
                F_room2X2_wider()
                center(27,15,-1,-1)
                F()

                center(27,8,-1,1)
                F_2x2Corner_Wall_H()
                center(14,1,-1,1)
                F_2x2Corner_Wall_V()
                center(14,8,-1,1)
                F_2x2Corner_Center()
                break
            case EnumRoomShape.ROOMSHAPE_LBL:
                center(1,1,1,1)
                F = F_room2X2
                F()
                center(27,1,-1,1)
                // F()
                F_room2X2_wider()
                center(1,15,1,-1)
                // F()
                center(27,15,-1,-1)
                F()

                center(1,8,1,-1)
                F_2x2Corner_Wall_H()
                center(14,15,1,-1)
                F_2x2Corner_Wall_V()
                center(14,8,1,-1)
                F_2x2Corner_Center()
                break
            case EnumRoomShape.ROOMSHAPE_LBR:
                center(1,1,1,1)
                F = F_room2X2
                // F()
                F_room2X2_wider()
                center(27,1,-1,1)
                F()
                center(1,15,1,-1)
                F()
                center(27,15,-1,-1)
                // F()

                center(27,8,-1,-1)
                F_2x2Corner_Wall_H()
                center(14,15,-1,-1)
                F_2x2Corner_Wall_V()
                center(14,8,-1,-1)
                F_2x2Corner_Center()
                break
        }
    }
    img.onload = ()=>{
        img.onload = undefined
        redraw()
    }
    (backgroundDiv as any).oncontextrestored = redraw
    img.src = huijiImageUrl(drawer.skin.getBackgroundSpriteUrl(drawer.roomJson))
    return true
}
