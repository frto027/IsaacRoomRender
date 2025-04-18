interface RoomData{
    _id : string // key added by huiji wiki, Data:xxx.json

    _type : string, // "ROOM_STB" for huiji database index
    
    _file : string, // "00.special rooms.stb"
    _i : string, // "100"  index inside the file

    name: string,
    type: EnumRoomType, subtype: number, variant: number,
    shape:EnumRoomShape,

    width: number, height: number
    difficulty: number
    weight: number
    doors: DoorInfo[]
    spawns: SpawnInfo[]
}
enum DoorDir{
    LEFT,RIGHT,TOP,BOTTOM // door in the wall
}
interface DoorInfo {
    x:number, y:number, exists:boolean, direction:DoorDir|undefined
}
interface SpawnInfo{
    x:number, y:number,
    entity:EntityListItem[]
}
interface EntityListItem{
    type:number, variant:number, subtype:number, weight:number
}

enum EnumRoomType{
	ROOM_NULL = 0,
	ROOM_DEFAULT = 1,
	ROOM_SHOP = 2,
	ROOM_ERROR = 3,
	ROOM_TREASURE = 4,
	ROOM_BOSS = 5,
	ROOM_MINIBOSS = 6,
	ROOM_SECRET = 7,
	ROOM_SUPERSECRET = 8,
	ROOM_ARCADE = 9,
	ROOM_CURSE = 10,
	ROOM_CHALLENGE = 11,
	ROOM_LIBRARY = 12,
	ROOM_SACRIFICE = 13,
	ROOM_DEVIL = 14,
	ROOM_ANGEL = 15,
	ROOM_DUNGEON = 16,
	ROOM_BOSSRUSH = 17,
	ROOM_ISAACS = 18,
	ROOM_BARREN = 19,
	ROOM_CHEST = 20,
	ROOM_DICE = 21,
	ROOM_BLACK_MARKET = 22,
	ROOM_GREED_EXIT = 23,
	// --NUM_ROOMTYPES = 24
	
	// -- Repentance
	ROOM_PLANETARIUM = 24,
	ROOM_TELEPORTER = 25,		//-- Mausoleum teleporter entrance, currently unused
	ROOM_TELEPORTER_EXIT = 26,	//-- Mausoleum teleporter exit, currently unused
	ROOM_SECRET_EXIT = 27,		//-- Trapdoor room to the alt path floors
	ROOM_BLUE = 28,				//-- Blue Womb rooms spawned by Blue Key
	ROOM_ULTRASECRET = 29,		//-- Red secret rooms
	NUM_ROOMTYPES = 30
}

enum EnumRoomShape {
	ROOMSHAPE_1x1 = 1,
	ROOMSHAPE_IH = 2,
	ROOMSHAPE_IV = 3,
	ROOMSHAPE_1x2 = 4,
	ROOMSHAPE_IIV = 5,
	ROOMSHAPE_2x1 = 6,
	ROOMSHAPE_IIH = 7,
	ROOMSHAPE_2x2 = 8,
	ROOMSHAPE_LTL = 9,
	ROOMSHAPE_LTR = 10,
	ROOMSHAPE_LBL = 11,
	ROOMSHAPE_LBR = 12,
	NUM_ROOMSHAPES = 13
}
 
// enum EnumDoorSlot {
// 	NO_DOOR_SLOT = - 1,
// 	LEFT0 = 0,
// 	UP0 = 1,
// 	RIGHT0 = 2,
// 	DOWN0 = 3,
// 	LEFT1 = 4,
// 	UP1 = 5,
// 	RIGHT1 = 6,
// 	DOWN1 = 7,
// 	NUM_DOOR_SLOTS = 8
// }

const RoomGoToCommand : {[type:number]:string} = {
    [EnumRoomType.ROOM_NULL]         : '???',
    [EnumRoomType.ROOM_DEFAULT]      : 'd',
    [EnumRoomType.ROOM_SHOP]         : 's.shop',
    [EnumRoomType.ROOM_ERROR]        : 's.error',
    [EnumRoomType.ROOM_TREASURE]     : 's.treasure',
    [EnumRoomType.ROOM_BOSS]         : 's.boss',
    [EnumRoomType.ROOM_MINIBOSS]     : 's.miniboss',
    [EnumRoomType.ROOM_SECRET]       : 's.secret',
    [EnumRoomType.ROOM_SUPERSECRET]  : 's.supersecret',
    [EnumRoomType.ROOM_ARCADE]       : 's.arcade',
    [EnumRoomType.ROOM_CURSE]        : 's.curse',
    [EnumRoomType.ROOM_CHALLENGE]    : 's.challenge',
    [EnumRoomType.ROOM_LIBRARY]      : 's.library',
    [EnumRoomType.ROOM_SACRIFICE]    : 's.sacrifice',
    [EnumRoomType.ROOM_DEVIL]        : 's.devil',
    [EnumRoomType.ROOM_ANGEL]        : 's.angel',
    [EnumRoomType.ROOM_DUNGEON]      : 's.itemdungeon',
    [EnumRoomType.ROOM_BOSSRUSH]     : 's.bossrush',
    [EnumRoomType.ROOM_ISAACS]       : 's.isaacs',
    [EnumRoomType.ROOM_BARREN]       : 's.barren',
    [EnumRoomType.ROOM_CHEST]        : 's.chest',
    [EnumRoomType.ROOM_DICE]         : 's.dice',
    [EnumRoomType.ROOM_BLACK_MARKET] : 's.blackmarket',
    [EnumRoomType.ROOM_GREED_EXIT]   : '????',
    
    [EnumRoomType.ROOM_PLANETARIUM]  : "s.planetarium",
    [EnumRoomType.ROOM_SECRET_EXIT]  : "s.secretexit",
    [EnumRoomType.ROOM_BLUE]         : "s.blue"	,
    [EnumRoomType.ROOM_ULTRASECRET]  : "s.ultrasecret",
 
}
function getBackgroundUrl(roomtype:number, shape:number):string{
    const default_background = [undefined,
    "https://huiji-public.huijistatic.com/isaac/uploads/4/48/Rooms_background_shape1_room_01_basement.png",
    "https://huiji-public.huijistatic.com/isaac/uploads/8/87/Rooms_background_shape2_room_01_basement.png",
    "https://huiji-public.huijistatic.com/isaac/uploads/0/06/Rooms_background_shape3_room_01_basement.png",
    "https://huiji-public.huijistatic.com/isaac/uploads/7/7d/Rooms_background_shape4_room_01_basement.png",
    "https://huiji-public.huijistatic.com/isaac/uploads/6/68/Rooms_background_shape5_room_01_basement.png",
    "https://huiji-public.huijistatic.com/isaac/uploads/d/de/Rooms_background_shape6_room_01_basement.png",
    "https://huiji-public.huijistatic.com/isaac/uploads/c/ce/Rooms_background_shape7_room_01_basement.png",
    "https://huiji-public.huijistatic.com/isaac/uploads/1/10/Rooms_background_shape8_room_01_basement.png",
    "https://huiji-public.huijistatic.com/isaac/uploads/8/83/Rooms_background_shape9_room_01_basement.png",
    "https://huiji-public.huijistatic.com/isaac/uploads/5/52/Rooms_background_shape10_room_01_basement.png",
    "https://huiji-public.huijistatic.com/isaac/uploads/9/95/Rooms_background_shape11_room_01_basement.png",
    "https://huiji-public.huijistatic.com/isaac/uploads/5/59/Rooms_background_shape12_room_01_basement.png",
    ]

    return default_background[shape] || ""
}
