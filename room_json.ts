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
    [EnumRoomType.ROOM_GREED_EXIT]   : 's.greedexit',
    
    [EnumRoomType.ROOM_PLANETARIUM]  : "s.planetarium",
    [EnumRoomType.ROOM_SECRET_EXIT]  : "s.secretexit",
    [EnumRoomType.ROOM_BLUE]         : "s.blue"	,
    [EnumRoomType.ROOM_ULTRASECRET]  : "s.ultrasecret",
 
}

const StageNames = {
	__proto__:null,
	["00.special rooms.stb"]: 				"特殊",
	["01.basement.stb"]: 					"地下室",
	["02.cellar.stb"]: 						"地窖",
	["03.burning basement.stb"]: 			"燃烧地下室",
	["04.caves.stb"]: 						"洞穴",
	["05.catacombs.stb"]: 					"墓穴",
	["06.flooded caves.stb"]: 				"淹水洞穴",
	["07.depths.stb"]: 						"深牢",
	["08.necropolis.stb"]: 					"坟场",
	["09.dank depths.stb"]: 				"阴湿深牢",
	["10.womb.stb"]: 						"子宫",
	["11.utero.stb"]: 						"血宫",
	["12.scarred womb.stb"]: 				"结痂子宫",
	["13.blue womb.stb"]: 					"???",
	["14.sheol.stb"]: 						"阴间",
	["15.cathedral.stb"]: 					"教堂",
	["16.dark room.stb"]: 					"暗室",
	["17.chest.stb"]: 						"玩具箱",
	["26.the void.stb"]: 					"虚空",
	["27.downpour.stb"]: 					"下水道",
	["28.dross.stb"]: 						"污水井",
	["29.mines.stb"]: 						"矿洞",
	["30.ashpit.stb"]: 						"灰坑",
	["31.mausoleum.stb"]: 					"陵墓",
	["32.gehenna.stb"]: 					"炼狱",
	["33.corpse.stb"]: 						"尸宫",
	["34.mortis.stb"]: 						"mortis",
	["35.home.stb"]: 						"家",
	["36.backwards.stb"]: 					"回溯",
	["greed/00.special rooms.stb"]: 		"特殊",
	["greed/01.basement.stb"]: 				"地下室",
	["greed/02.cellar.stb"]: 				"地窖",
	["greed/03.burning basement.stb"]: 		"燃烧地下室",
	["greed/04.caves.stb"]: 				"洞穴",
	["greed/05.catacombs.stb"]: 			"墓穴",
	["greed/06.flooded caves.stb"]: 		"淹水洞穴",
	["greed/07.depths.stb"]: 				"深牢",
	["greed/08.necropolis.stb"]: 			"坟场",
	["greed/09.dank depths.stb"]: 			"阴湿深牢",
	["greed/10.womb.stb"]: 					"子宫",
	["greed/11.utero.stb"]: 				"血宫",
	["greed/12.scarred womb.stb"]: 			"结痂子宫",
	["greed/14.sheol.stb"]: 				"阴间",
	["greed/24.the shop.stb"]: 				"商店",
	["greed/25.ultra greed.stb"]: 			"究极贪婪",
	["greed/27.downpour.stb"]: 				"下水道",
	["greed/28.dross.stb"]: 				"污水井",
	["greed/29.mines.stb"]: 				"矿洞",
	["greed/30.ashpit.stb"]: 				"灰坑",
	["greed/31.mausoleum.stb"]: 			"陵墓",
	["greed/32.gehenna.stb"]: 				"炼狱",
	["greed/33.corpse.stb"]: 				"尸宫",
	["greed/34.mortis.stb"]: 				"mortis",
}
