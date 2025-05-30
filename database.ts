type ItemFunctionRenderer = (type:number, variant:number, subtype:number, edgeSize:number)=>HTMLElement
const PreloadedDatabase :{[entity_id_str:string]:{
    file:string|ItemFunctionRenderer,
    page:string|undefined
}} = {
    "1000.0.0": {file:"Icon_1000.0.png",page:	"石头"},
	"1001.0.0": {file:"Icon_1001.0.png",page:	"石头#炸弹石头"},
	"1002.0.0": {file:"Icon_1002.0.png",page:	"石头#罐子"},
	"1008.0.0": {file:"Tinted_Skull.png",page:	"石头#标记头骨"},
	"1009.0.0": {file:"Icon_1000.0.png",page:	"石头"},
	"1010.0.0": {file:"Spiked Rock.png",page:	"石头#尖刺石头"},
	"1300.0.0": {file:"Icon_1300.0.png",page:	"炸药桶"},
	"1400.0.0": {file:"Icon_1400.0..png",page:	"火堆"},
	"1410.0.0": {file:"Icon_1410.0..png",page:	"火堆"},
	//"1490.0.0": {file:"Icon_1490.0.png",page:	"大便"},
	//"1494.0.0": {file:"Icon_1494.0.png",page:	"大便#彩虹大便"},
	//"1495.0.0": {file:"Icon_1495.0.png",page:	"大便#玉米大便"},
	//"1496.0.0": {file:"Icon_1496.0.png",page:	"大便#金大便"},
	//"1497.0.0": {file:"Icon_1497.0.png",page:	"大便#黑大便"},
	"1490.0.0": {file:"RedPoop.png",page:	"大便#红大便"},
	"1494.0.0": {file:"Poop.png",page:	"大便#彩虹大便"},
	"1495.0.0": {file:"CornPoop.png",page:	"大便#玉米大便"},
	"1496.0.0": {file:"GoldPoop.png",page:	"大便#金大便"},
	"1497.0.0": {file:"BlackPoop.png",page:	"大便#黑大便"},
	"1498.0.0": {file:"白大便.png",page:	"大便#白大便"},
	"1499.0.0": {file:"Giant_Poop.png",page:	"大便#巨型大便"},
	"1500.0.0": {file:"Icon_1500.0.png",page:	"大便"},
	"1501.0.0": {file:"Charming_Poop.png",page:	"大便#友好大便"},
	"1900.0.0": {file:"Icon_1900.0.png",page:	"方块"},
	"1930.0.0": {file:"Icon_1930.0.png",page:	"地刺"},
	"1931.0.0": {file:"Icon_1931.0.png",page:	"地刺#伸缩地刺"},
	"1940.0.0": {file:"Icon_1940.0.png",page:	"蜘蛛网"},
	"3000.0.0": {file:"Icon_3000.0.png",page:	undefined},
	"4000.0.0": {file:"Icon_4000.0.png",page:	"方块#钥匙方块"},
	"4500.0.0": {file:"Icon_4500.0.png",page:	"按钮"},
	"4500.1.0": {file:"Icon_4500.1.png",page:	"按钮"},
	"4500.2.0": {file:"Icon_4500.2.png",page:	"按钮"},
	"5000.0.0": {file:"Icon_5000.0.png",page:	"恶魔雕像"},
	"5001.0.0": {file:"Icon_5001.0.png",page:	"天使雕像"},
	"9000.0.0": {file:"Icon_9000.0.png",page:	"活板门"},
	"999.116.0": {file:"Dirt Patch.png",page:    "碎土块"},
	"5.69.0": {file:"Entity_5.69.1.png",page:    "实体/5/69"},
	"5.10.0": {file:"Icon_5.10.0.png",page:"实体/5/10"},
	"5.20.0": {file:"Icon_5.20.0.png",page:"实体/5/20"},
	"5.30.0": {file:"Icon_5.30.0.png",page:"钥匙"},
	"5.40.0": {file:"Icon_5.40.0.png",page:"炸弹"},
	"5.90.0": {file:"Icon_5.90.0.png",page:"实体/5/90"},
	"5.100.0": {file:"Icon_5.100.0.png",page:"道具"},
	"5.150.0": {file:"Icon_5.150.0.png",page:"商店#商品"},
	"5.350.0": {file:"Icon_5.350.0.png",page:"饰品"},
	"5.300.0": {file:"Icon_5.300.0.png",page:"卡牌"},
	"5.0.0": {file:"Icon_5.0.0.png",page:"掉落物#随机掉落物"},
	"5.70.0": {file:"Pill.gif",page:"胶囊"},

}