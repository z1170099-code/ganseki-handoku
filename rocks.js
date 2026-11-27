window.ROCKS_DB = {
"version": 1,
"note": "岩石判読のデータ。= の右は JSON（注釈・最後のカンマは書けない）。直したら python tools/check_data.py で点検する。岩石の id は記録と結びついているので変えない。p の数字は 2=よくある特徴、1=ありうる特徴、書いていない選択肢=合わない特徴。",
"groups": [
  {"id": "volcanic", "name": "火山岩"},
  {"id": "hypabyssal", "name": "半深成岩"},
  {"id": "plutonic", "name": "深成岩"},
  {"id": "pyroclastic", "name": "火山砕屑岩・火山砕屑物"},
  {"id": "sedimentary", "name": "堆積岩"},
  {"id": "metamorphic", "name": "変成岩"},
  {"id": "fault", "name": "断層岩"}
],
"easy": [
  {"f": "fabric", "q": "近くで見ると、どんなつくり？", "help": "割ったばかりの面を、明るい所で近づいて見る。", "kind": "pics",
   "opts": {"crystalline": ["つぶつぶがぎっしり", "大きさのそろった粒がかみ合う"], "porphyritic": ["地の中に目立つ粒が点々", "細かい地に白や黒の粒"], "clastic": ["砂や小石がくっついている", "粒のすき間を細かい物が埋める"], "massive": ["のっぺりして粒が見えない", "模様もほとんどない"], "vesicular": ["小さな穴がたくさん", "スポンジや軽石のよう"], "pyroclastic": ["灰の中にかけらが混じる", "角ばった軽石や石のかけら"]}},
  {"f": "color", "q": "全体の色は？", "help": "ぬれた面や汚れた面ではなく、割ったばかりの面の色。", "kind": "swatch",
   "opts": {"light": ["白っぽい"], "speckled": ["白と黒のごま塩"], "gray": ["灰色"], "dark": ["黒っぽい"], "green": ["緑っぽい"], "red": ["赤っぽい・茶色"], "blue": ["青っぽい"]}},
  {"f": "grain", "q": "粒の大きさは？", "help": "虫めがね（ルーペ）があると見分けやすい。", "kind": "grain",
   "opts": {"coarse": ["目で1粒ずつ見える", "ゴマ粒くらい以上"], "medium": ["虫めがねで見える", "砂粒くらい"], "fine": ["虫めがねでも見えない", "粘土やガラスのかけらのよう"], "glass": ["ガラスみたい", "割れ口がつるっと光る"]}},
  {"f": "struct", "q": "しま模様や割れ方は？", "help": "横から見たときの縞や、はがれやすさ。", "kind": "pics",
   "opts": {"none": ["しまはない", "どの向きにも同じように割れる"], "bedding": ["地層のようなしま", "層ごとに色や粒が変わる"], "flow": ["流れたような模様", "くねった縞やつぶれた黒いレンズ"], "slaty": ["うすい板に割れる", "表面はつやが少ない"], "phyllitic": ["表面が絹のようにつやつや", "細かいしわがある"], "schistose": ["キラキラして、うすくはがれる", "鉱物が平行に並ぶ"], "gneissic": ["白と黒のしま", "粒が大きく、はがれにくい"], "sheared": ["すりつぶされた筋", "目玉のような粒がある"]}},
  {"f": "luster", "q": "光に当てると？", "help": "スマホのライトを当てて、角度を変えながら見る。", "kind": "plain",
   "opts": {"glassy": ["ガラスのように光る"], "sparkly": ["キラキラ光る"], "silky": ["絹のようなつや"], "waxy": ["ろうのようにすべすべ"], "dull": ["つやがない・ざらざら"], "earthy": ["土っぽい・粉が指につく"]}},
  {"f": "hard", "q": "くぎや鍵でこすると？", "help": "目立たない所を強めにこする。傷か、こすった金属の跡かを指でぬぐって確かめる。", "kind": "plain",
   "opts": {"hard": ["傷がつかない"], "soft": ["傷がつく"], "crumbly": ["爪でも傷がつく・手で崩れる"]}}
],
"features": [
  {"id": "fabric", "label": "つくり（組織）", "w": 3, "group": "photo",
   "help": "割ったばかりの新しい面を見て、いちばん近いものを選ぶ。風化した表面ではわかりにくい。",
   "opts": [
    {"v": "crystalline", "label": "結晶がすき間なくかみ合う", "s": "結晶質（等粒状）", "help": "花こう岩のように、同じくらいの大きさの粒が組み合わさる"},
    {"v": "porphyritic", "label": "大きな結晶が細かい地に散らばる", "s": "斑状", "help": "斑晶と石基。安山岩に多い"},
    {"v": "clastic", "label": "粒やかけらが固められている", "s": "砕屑性", "help": "砂粒や礫のすき間を細かいものが埋める"},
    {"v": "massive", "label": "均質で特徴がない（緻密）", "s": "緻密・塊状", "help": "粒が見えず、模様もない"},
    {"v": "vesicular", "label": "穴（気泡）が多い", "s": "多孔質", "help": "ガスの抜けた穴。軽石・スコリアなど"},
    {"v": "pyroclastic", "label": "火山灰・軽石・岩片が混じる", "s": "火山砕屑性", "help": "角ばった軽石や岩片が火山灰の地に入る"}
   ]},
  {"id": "clast", "label": "礫・かけらの形", "w": 1.5, "group": "photo",
   "help": "2mmより大きい礫やかけらがあるか、あれば角が丸いか角ばっているかを見る。",
   "opts": [
    {"v": "round", "label": "角がとれて丸い", "s": "丸い礫"},
    {"v": "angular", "label": "角ばっている", "s": "角ばったかけら"},
    {"v": "noclast", "label": "礫やかけらはない", "s": "礫・かけらなし"}
   ]},
  {"id": "grain", "label": "粒の大きさ", "w": 2, "group": "photo",
   "help": "斑状のものや礫岩は、地（いちばん面積の多い部分）の粒で答える。",
   "opts": [
    {"v": "coarse", "label": "肉眼で1粒ずつ見える", "s": "粗粒", "help": "だいたい1mm以上"},
    {"v": "medium", "label": "ルーペで粒が見える", "s": "中〜細粒", "help": "だいたい0.1〜1mm"},
    {"v": "fine", "label": "ルーペでも見えない", "s": "極細粒・緻密", "help": "泥岩・チャート・石基など"},
    {"v": "glass", "label": "ガラス（結晶がない）", "s": "ガラス質", "help": "黒曜石・軽石の壁"}
   ]},
  {"id": "struct", "label": "面構造・縞", "w": 3, "group": "photo",
   "help": "いくつかの向きから見て、筋・縞・はがれやすい面があるかを見る。",
   "opts": [
    {"v": "none", "label": "なし", "s": "面構造なし", "help": "どの向きにも同じように割れる"},
    {"v": "bedding", "label": "堆積の縞（層理）", "s": "層理", "help": "粒の大きさや色が層ごとに変わる"},
    {"v": "flow", "label": "流れた模様・つぶれたレンズ", "s": "流理・溶結", "help": "流紋岩の縞、溶結凝灰岩の黒いレンズ"},
    {"v": "slaty", "label": "薄い板に平らに割れる", "s": "スレート劈開", "help": "割れた面のつやは少ない"},
    {"v": "phyllitic", "label": "面が絹のようにつやつや", "s": "千枚岩状", "help": "細かいしわがある"},
    {"v": "schistose", "label": "鉱物が並びキラキラ、薄くはがれる", "s": "片理", "help": "雲母・緑泥石が並ぶ"},
    {"v": "gneissic", "label": "白と黒の鉱物の縞", "s": "片麻状", "help": "粒が粗く、はがれにくい"},
    {"v": "sheared", "label": "すりつぶされた筋・目玉状の粒", "s": "せん断・破砕", "help": "断層岩、蛇紋岩の鏡肌など"}
   ]},
  {"id": "color", "label": "全体の色", "w": 1.5, "group": "photo",
   "help": "風化した表面ではなく、新しい割れ口の色で答える。",
   "opts": [
    {"v": "light", "label": "白・淡い灰・淡いピンク", "s": "白っぽい"},
    {"v": "speckled", "label": "白と黒のごま塩", "s": "ごま塩状"},
    {"v": "gray", "label": "中くらいの灰色", "s": "灰色"},
    {"v": "dark", "label": "黒・暗い灰色", "s": "黒っぽい"},
    {"v": "green", "label": "緑〜暗い緑", "s": "緑色"},
    {"v": "red", "label": "赤・赤褐色・赤紫", "s": "赤っぽい"},
    {"v": "blue", "label": "青みがかった灰〜青紫", "s": "青っぽい"}
   ]},
  {"id": "min", "label": "見える鉱物（いくつでも）", "w": 1.2, "group": "photo", "multi": true,
   "help": "ルーペで割ったばかりの面を見る。自信がないものは選ばない。",
   "opts": [
    {"v": "qtz", "label": "石英", "help": "無色〜灰色でガラスのようなつや。平らな割れ面がない"},
    {"v": "kfs", "label": "カリ長石", "help": "ピンク〜肉色（白もある）。平らな面で光る"},
    {"v": "plag", "label": "斜長石", "help": "白〜灰色の短冊形。平らな面で光る"},
    {"v": "bt", "label": "黒雲母", "help": "黒〜こげ茶の薄い板。爪の先ではがれる"},
    {"v": "ms", "label": "白雲母", "help": "銀白色の薄い板。キラキラ光る"},
    {"v": "hbl", "label": "角閃石", "help": "黒〜暗緑色の細長い柱"},
    {"v": "px", "label": "輝石", "help": "黒〜暗緑色のずんぐりした柱（エクロジャイトでは緑色）"},
    {"v": "ol", "label": "かんらん石", "help": "黄緑色でガラスのような粒"},
    {"v": "grt", "label": "ざくろ石", "help": "赤〜赤褐色の丸い粒"},
    {"v": "cal", "label": "方解石", "help": "白〜透明。ナイフで傷がつき、塩酸で泡が出る"},
    {"v": "chl", "label": "緑泥石・緑れん石", "help": "緑色の細かい鉱物（緑れん石は黄緑）"},
    {"v": "glc", "label": "藍閃石", "help": "青〜青紫色の細い柱"},
    {"v": "fossil", "label": "化石", "help": "貝・サンゴ・ウミユリ・フズリナ・植物など"}
   ]},
  {"id": "luster", "label": "つや・手ざわり", "w": 1.5, "group": "photo",
   "opts": [
    {"v": "glassy", "label": "ガラスのようなつや", "s": "ガラス光沢"},
    {"v": "sparkly", "label": "キラキラ光る（雲母など）", "s": "キラキラ"},
    {"v": "silky", "label": "絹のようなつや", "s": "絹のつや"},
    {"v": "waxy", "label": "ろうのようなつや・すべすべ", "s": "ろう状・すべすべ"},
    {"v": "dull", "label": "つやがない・ざらざら", "s": "つやなし"},
    {"v": "earthy", "label": "土っぽい・粉が指につく", "s": "土状"}
   ]},
  {"id": "hard", "label": "硬さ", "w": 2, "group": "hand",
   "help": "鉄くぎやナイフの先で、目立たない所を強めに引っかく。くぎの金属がこすりついただけの線は、指でこすると消える。",
   "opts": [
    {"v": "hard", "label": "傷がつかない", "s": "くぎで傷つかない"},
    {"v": "soft", "label": "傷がつく", "s": "くぎで傷つく"},
    {"v": "crumbly", "label": "爪で傷つく・手で崩れる", "s": "もろい"}
   ]},
  {"id": "acid", "label": "希塩酸（なければ酢）", "w": 3, "group": "hand",
   "help": "1滴たらして泡が出るか見る。酢は反応が弱いので、ルーペで細かい泡をさがす。塩酸は目や手につけないこと。",
   "opts": [
    {"v": "fizz", "label": "泡が出る", "s": "塩酸で発泡"},
    {"v": "none", "label": "泡が出ない", "s": "発泡しない"}
   ]},
  {"id": "weight", "label": "重さ", "w": 1, "group": "hand",
   "help": "同じくらいの大きさのふつうの石（砂岩など）とくらべる。",
   "opts": [
    {"v": "light", "label": "軽い・水に浮きそう", "s": "軽い"},
    {"v": "normal", "label": "ふつう", "s": "重さはふつう"},
    {"v": "heavy", "label": "ずっしり重い", "s": "重い"}
   ]},
  {"id": "magnet", "label": "磁石", "w": 0.5, "group": "hand",
   "help": "強い磁石（ネオジム磁石）を近づけて、引かれるかを見る。",
   "opts": [
    {"v": "yes", "label": "引かれる", "s": "磁石に反応"},
    {"v": "no", "label": "引かれない", "s": "磁石に反応しない"}
   ]},
  {"id": "setting", "label": "見つけた場所", "w": 1.2, "group": "place",
   "help": "露頭で見つけたときだけ点数に入れる。川原や海岸で拾った石は「転石」を選ぶ。",
   "opts": [
    {"v": "volcano", "label": "火山・溶岩・岩脈", "s": "火山・溶岩"},
    {"v": "pluton", "label": "山全体が同じ岩（岩体）", "s": "深成岩体"},
    {"v": "strata", "label": "縞のある地層の崖", "s": "地層"},
    {"v": "accretion", "label": "付加体（四万十帯・美濃-丹波帯・秩父帯など）", "s": "付加体"},
    {"v": "metamorphic", "label": "変成帯（三波川帯・領家帯・飛騨帯など）", "s": "変成帯"},
    {"v": "contact", "label": "花こう岩などの岩体の近く", "s": "深成岩体の近く"},
    {"v": "fault", "label": "断層・破砕帯の近く", "s": "断層の近く"},
    {"v": "float", "label": "転石（川原・海岸など）", "s": "転石", "skip": true}
   ]}
],
"rocks": [
{
 "id": "basalt", "name": "玄武岩", "kana": "げんぶがん", "en": "basalt", "group": "volcanic", "alias": [],
 "desc": "苦鉄質（SiO2 約45〜52%）のマグマが、地表や地表近くで急に冷えて固まった火山岩。海洋地殻の上部や、伊豆・小笠原弧などの火山をつくる。",
 "keys": ["黒〜暗灰色で緻密。手に持つとやや重い。", "斑晶はかんらん石（黄緑のガラス状の粒）・輝石（黒い短い柱）・斜長石（白い短冊）。", "ガスの抜けた穴（気泡）が多いものがある。穴を二次鉱物が埋めたものは杏仁状組織。", "石英はふつう見えない。"],
 "similar": [
  {"id": "andesite", "how": "安山岩は灰色っぽく、白い斜長石の斑晶が目立つ。かんらん石が見えれば玄武岩の可能性が高い。厳密には SiO2 量（化学分析）で分ける。"},
  {"id": "dolerite", "how": "ドレライトは粒がルーペで見えるほど粗く、斜長石の細長い結晶がかみ合う。"},
  {"id": "hornfels", "how": "ホルンフェルスは斑晶も気泡もなく、割ると鋭く角ばった破片になる。深成岩体の近くに出る。"},
  {"id": "greenstone", "how": "付加体の中で変質して緑色になった玄武岩は、野外では緑色岩とよぶ。"}],
 "japan": "富士山・伊豆大島・三宅島など伊豆・小笠原弧の火山。玄武洞（兵庫県豊岡市）は柱状節理で知られ、玄武岩の名の由来。付加体の中にも海洋性の玄武岩がある。",
 "p": {"fabric": "massive:2 porphyritic:2 vesicular:2", "clast": "noclast:2", "grain": "fine:2 medium:1", "struct": "none:2 flow:1", "color": "dark:2 gray:1 red:1", "min": "plag:2 px:2 ol:2", "minNo": "qtz kfs ms bt", "luster": "dull:2", "hard": "hard:2", "acid": "none:2", "weight": "heavy:2 normal:2", "magnet": "yes:2 no:1", "setting": "volcano:2 accretion:1"}
},
{
 "id": "andesite", "name": "安山岩", "kana": "あんざんがん", "en": "andesite", "group": "volcanic", "alias": ["鉄平石"],
 "desc": "中間質（SiO2 約52〜63%）の火山岩。沈み込み帯の火山に多く、日本の火山岩でいちばん多い。",
 "keys": ["灰色〜暗灰色の細かい石基に、白い斜長石と黒い輝石・角閃石の斑晶が散らばる斑状組織。", "板状節理や柱状節理をつくる溶岩が多い。", "酸化して赤紫〜赤褐色になったものもある。"],
 "similar": [
  {"id": "basalt", "how": "玄武岩はより黒っぽく重く、かんらん石の斑晶を含むことが多い。"},
  {"id": "dacite", "how": "デイサイトは白っぽく、丸い石英の斑晶を含むことが多い。"},
  {"id": "porphyrite", "how": "ひん岩は岩脈などで出て、石基がやや粗くルーペで粒が見える。"}],
 "japan": "浅間山・箱根・桜島など多くの火山。鉄平石（長野県諏訪地方）は板状節理の発達した安山岩。",
 "p": {"fabric": "porphyritic:2 massive:1 vesicular:1", "clast": "noclast:2", "grain": "fine:2 medium:1", "struct": "none:2 flow:1", "color": "gray:2 dark:1 light:1 red:1", "min": "plag:2 px:2 hbl:2 bt:1 ol:1", "minNo": "kfs ms", "luster": "dull:2", "hard": "hard:2", "acid": "none:2", "weight": "normal:2 heavy:1", "magnet": "no:2 yes:1", "setting": "volcano:2"}
},
{
 "id": "dacite", "name": "デイサイト", "kana": "デイサイト", "en": "dacite", "group": "volcanic", "alias": ["石英安山岩"],
 "desc": "やや珪長質（SiO2 約63〜70%）の火山岩。粘りけの強い溶岩で、溶岩ドームをつくりやすい。",
 "keys": ["白〜淡灰色の石基に、斜長石・石英・角閃石・黒雲母の斑晶が散らばる。", "石英の斑晶は、丸みのある無色透明のガラス状の粒で、平らな割れ面がない。"],
 "similar": [
  {"id": "andesite", "how": "安山岩は灰色が濃く、石英の斑晶はふつう含まない。"},
  {"id": "rhyolite", "how": "流紋岩はさらに白〜淡桃色で、流理の縞が目立つものが多い。"}],
 "japan": "雲仙普賢岳（1990〜95年の溶岩ドーム）、昭和新山、有珠山。",
 "p": {"fabric": "porphyritic:2 massive:1", "clast": "noclast:2", "grain": "fine:2", "struct": "none:2 flow:1", "color": "light:2 gray:2", "min": "plag:2 qtz:2 hbl:2 bt:2 px:1", "minNo": "ol ms", "luster": "dull:2", "hard": "hard:2", "acid": "none:2", "weight": "normal:2", "magnet": "no:2", "setting": "volcano:2"}
},
{
 "id": "rhyolite", "name": "流紋岩", "kana": "りゅうもんがん", "en": "rhyolite", "group": "volcanic", "alias": [],
 "desc": "珪長質（SiO2 約70%以上）の火山岩。花こう岩と同じ組成のマグマが、地表近くで急に冷えたもの。",
 "keys": ["白・淡灰・淡桃色で緻密。", "流れた跡の縞（流理）がよく見える。", "斑晶は少なく、石英・カリ長石（サニディン）などが散らばる。球顆（放射状に結晶した丸い粒）をもつことがある。"],
 "similar": [
  {"id": "dacite", "how": "デイサイトは角閃石・黒雲母の斑晶が多く、流理は目立たないことが多い。"},
  {"id": "welded_tuff", "how": "溶結凝灰岩は、つぶれた軽石のレンズ（フィアメ）や岩片を含む。"},
  {"id": "chert", "how": "チャートは斑晶も流理もなく、ろうのようなつやで、層状に出る。"}],
 "japan": "神津島・新島（伊豆諸島）。島根半島の中新統（成相寺層など）にも流紋岩が多い。濃飛流紋岩（岐阜県）は名前と違い、大部分が溶結凝灰岩。",
 "p": {"fabric": "massive:2 porphyritic:2 vesicular:1", "clast": "noclast:2", "grain": "fine:2 glass:1", "struct": "flow:2 none:2", "color": "light:2 red:1 gray:1", "min": "qtz:2 kfs:2 plag:1 bt:1", "minNo": "ol px", "luster": "dull:2 glassy:1", "hard": "hard:2", "acid": "none:2", "weight": "normal:2 light:1", "magnet": "no:2", "setting": "volcano:2"}
},
{
 "id": "obsidian", "name": "黒曜石", "kana": "こくようせき", "en": "obsidian", "group": "volcanic", "alias": ["黒耀石"],
 "desc": "流紋岩質のマグマが急に冷えてできた天然のガラス。",
 "keys": ["黒く、ガラスのようなつや。", "割ると貝殻状の鋭い割れ口になる（旧石器時代から石器に使われた）。", "薄い縁は光にかざすと透ける。白い斑点（球顆）を含むものもある。", "人工のガラス（鉱さい・スラグ）は気泡が多く、重いことが多い。"],
 "similar": [
  {"id": "chert", "how": "チャートはつやがろう状で、薄くしても透けにくい。"},
  {"id": "rhyolite", "how": "流紋岩は細かい結晶でできていて、ガラスのつやはない。"}],
 "japan": "長野県の和田峠・霧ヶ峰、北海道の白滝・十勝、伊豆の神津島、島根県の隠岐（島後）。",
 "p": {"fabric": "massive:2", "clast": "noclast:2", "grain": "glass:2", "struct": "none:2 flow:1", "color": "dark:2 red:1 gray:1", "min": "", "minNo": "ol px hbl kfs plag bt ms qtz cal chl glc grt fossil", "luster": "glassy:2", "hard": "hard:2", "acid": "none:2", "weight": "normal:2", "magnet": "no:2", "setting": "volcano:2"}
},
{
 "id": "dolerite", "name": "ドレライト（粗粒玄武岩）", "kana": "ドレライト", "en": "dolerite (diabase)", "group": "hypabyssal", "alias": ["粗粒玄武岩", "輝緑岩", "diabase"],
 "desc": "玄武岩と同じ組成のマグマが、岩脈や岩床として地下の浅い所で固まった半深成岩。日本では輝緑岩ともよばれてきた。",
 "keys": ["暗灰色〜暗緑色で、やや重い。", "ルーペで、白い短冊状の斜長石のすき間を黒い輝石が埋める組織（オフィティック組織）が見える。", "玄武岩より粒が粗く、はんれい岩より細かい。"],
 "similar": [
  {"id": "basalt", "how": "玄武岩は粒が見えないほど細かい。"},
  {"id": "gabbro", "how": "はんれい岩は粒が肉眼で見えるほど粗い。"},
  {"id": "greenstone", "how": "変質して緑色になると、緑色岩とよばれることがある。"}],
 "japan": "付加体（秩父帯・四万十帯など）の緑色岩に伴うもの、各地の岩脈・岩床。",
 "p": {"fabric": "crystalline:2 porphyritic:1", "clast": "noclast:2", "grain": "medium:2 fine:1 coarse:1", "struct": "none:2", "color": "dark:2 green:1 speckled:1", "min": "plag:2 px:2 ol:1 chl:1", "minNo": "qtz kfs ms", "luster": "dull:2", "hard": "hard:2", "acid": "none:2", "weight": "heavy:2 normal:1", "magnet": "yes:1 no:1", "setting": "accretion:2 strata:1 volcano:1 pluton:1"}
},
{
 "id": "porphyrite", "name": "ひん岩", "kana": "ひんがん", "en": "porphyrite", "group": "hypabyssal", "alias": ["玢岩", "閃緑ひん岩"],
 "desc": "安山岩〜閃緑岩と同じ中間質の組成で、岩脈などとして浅い所で固まった斑状の半深成岩（日本の地質で使われてきた名前）。",
 "keys": ["灰色〜灰緑色の石基に、白い斜長石や黒い角閃石の斑晶がはっきり散らばる。", "石基は安山岩よりやや粗く、ルーペで粒が見える。", "周りの地層や岩体を切る岩脈として出ることが多い。"],
 "similar": [
  {"id": "andesite", "how": "安山岩は石基が細かくガラスを含むことがあり、溶岩として出る。"},
  {"id": "granite_porphyry", "how": "花こう斑岩は白っぽく、石英・カリ長石の斑晶をもつ。"},
  {"id": "diorite", "how": "閃緑岩は全体が粗粒で、斑状にならない。"}],
 "japan": "各地の岩脈。花こう岩体の周りや付加体を切って出る。",
 "p": {"fabric": "porphyritic:2", "clast": "noclast:2", "grain": "medium:2 fine:1", "struct": "none:2", "color": "gray:2 green:1 dark:1", "min": "plag:2 hbl:2 px:1 bt:1", "minNo": "ol kfs ms", "luster": "dull:2", "hard": "hard:2", "acid": "none:2", "weight": "normal:2", "magnet": "no:2 yes:1", "setting": "pluton:1 strata:1 accretion:1 volcano:1"}
},
{
 "id": "granite_porphyry", "name": "花こう斑岩", "kana": "かこうはんがん", "en": "granite porphyry", "group": "hypabyssal", "alias": ["花崗斑岩", "石英斑岩", "quartz porphyry"],
 "desc": "花こう岩と同じ珪長質の組成で、浅い所で固まった斑状の半深成岩。石基がとくに細かいものは石英斑岩とよばれてきた。",
 "keys": ["白〜淡桃色の細かい石基に、石英（丸く無色透明）・カリ長石（ピンク）・斜長石（白）の斑晶が散らばる。", "岩脈や小岩体として出る。"],
 "similar": [
  {"id": "granite", "how": "花こう岩は全部の粒が粗く、ほぼ同じ大きさ。"},
  {"id": "rhyolite", "how": "流紋岩は斑晶が少なく、流理をもつことが多い。"},
  {"id": "dacite", "how": "デイサイトは角閃石・黒雲母の斑晶が多く、カリ長石の斑晶は少ない。"}],
 "japan": "花こう岩体の周りや、カルデラの縁の岩脈。",
 "p": {"fabric": "porphyritic:2", "clast": "noclast:2", "grain": "medium:2 fine:2", "struct": "none:2", "color": "light:2 red:1 gray:1", "min": "qtz:2 kfs:2 plag:2 bt:1", "minNo": "ol px", "luster": "dull:2", "hard": "hard:2", "acid": "none:2", "weight": "normal:2", "magnet": "no:2", "setting": "pluton:1 strata:1 volcano:1 contact:1"}
},
{
 "id": "granite", "name": "花こう岩", "kana": "かこうがん", "en": "granite", "group": "plutonic", "alias": ["花崗岩", "御影石", "みかげ石"],
 "desc": "珪長質のマグマが地下深くでゆっくり冷えて固まった深成岩。大陸地殻の上部をつくる代表的な岩石。",
 "keys": ["白っぽく粗粒。石英（灰色・透明）・カリ長石（ピンク〜白）・斜長石（白）・黒雲母（黒く薄くはがれる）が見える。", "風化するとぼろぼろに崩れて真砂（まさ）土になる。", "山陰側の花こう岩（磁鉄鉱系）は、磁石にわずかに反応することがある。"],
 "similar": [
  {"id": "granodiorite", "how": "花こう閃緑岩はカリ長石が少なく、黒い鉱物（黒雲母・角閃石）がやや多い。"},
  {"id": "gneiss", "how": "片麻岩は鉱物が縞状に並ぶ。"},
  {"id": "granite_porphyry", "how": "花こう斑岩は細かい石基の中に斑晶が浮かぶ。"}],
 "japan": "中国地方（広島花こう岩・山陰の花こう岩類）、領家帯、六甲山、茨城県笠間市の稲田（稲田石）。",
 "p": {"fabric": "crystalline:2 porphyritic:1", "clast": "noclast:2", "grain": "coarse:2 medium:1", "struct": "none:2 gneissic:1", "color": "light:2 speckled:2 red:1", "min": "qtz:2 kfs:2 plag:2 bt:2 ms:1 hbl:1", "minNo": "ol px glc", "luster": "glassy:2 sparkly:1 dull:1", "hard": "hard:2", "acid": "none:2", "weight": "normal:2", "magnet": "no:2 yes:1", "setting": "pluton:2"}
},
{
 "id": "granodiorite", "name": "花こう閃緑岩", "kana": "かこうせんりょくがん", "en": "granodiorite", "group": "plutonic", "alias": ["花崗閃緑岩"],
 "desc": "花こう岩と閃緑岩の中間の組成をもつ深成岩。日本で「花崗岩」とよばれる岩体には、花こう閃緑岩が多い。",
 "keys": ["白と黒のごま塩状。", "斜長石（白）が多く、カリ長石（ピンク）は少ない。", "黒雲母と角閃石の両方が見えることが多い。"],
 "similar": [
  {"id": "granite", "how": "花こう岩はカリ長石（ピンク）が多く、より白っぽい。"},
  {"id": "diorite", "how": "閃緑岩は石英がほとんど見えない。"}],
 "japan": "領家帯・山陽帯の深成岩、北上山地の白亜紀深成岩。",
 "p": {"fabric": "crystalline:2", "clast": "noclast:2", "grain": "coarse:2 medium:1", "struct": "none:2 gneissic:1", "color": "speckled:2 light:1 gray:1", "min": "plag:2 qtz:2 bt:2 hbl:2 kfs:1", "minNo": "ol glc", "luster": "glassy:1 sparkly:1 dull:1", "hard": "hard:2", "acid": "none:2", "weight": "normal:2", "magnet": "no:2 yes:1", "setting": "pluton:2"}
},
{
 "id": "diorite", "name": "閃緑岩", "kana": "せんりょくがん", "en": "diorite", "group": "plutonic", "alias": [],
 "desc": "中間質（安山岩と同じくらいの組成）の深成岩。",
 "keys": ["白い斜長石と黒い角閃石がほぼ半々のごま塩模様。", "石英はほとんど見えない。カリ長石はほとんどない。"],
 "similar": [
  {"id": "granodiorite", "how": "花こう閃緑岩は石英が見える。"},
  {"id": "gabbro", "how": "はんれい岩はより黒っぽく重く、黒い鉱物は輝石。"},
  {"id": "porphyrite", "how": "ひん岩は細かい石基の中に斑晶が浮かぶ。"}],
 "japan": "花こう岩体の縁や、小さな岩体として各地に出る。",
 "p": {"fabric": "crystalline:2", "clast": "noclast:2", "grain": "coarse:2 medium:2", "struct": "none:2", "color": "speckled:2 gray:2 dark:1", "min": "plag:2 hbl:2 bt:1 px:1 qtz:1", "minNo": "kfs ol ms", "luster": "dull:1 sparkly:1 glassy:1", "hard": "hard:2", "acid": "none:2", "weight": "normal:2 heavy:1", "magnet": "no:1 yes:1", "setting": "pluton:2"}
},
{
 "id": "gabbro", "name": "はんれい岩", "kana": "はんれいがん", "en": "gabbro", "group": "plutonic", "alias": ["斑れい岩"],
 "desc": "苦鉄質（玄武岩と同じくらいの組成）のマグマが、地下深くで固まった深成岩。海洋地殻の下部をつくる。",
 "keys": ["黒〜暗緑色で粗粒、重い。", "白〜灰色の斜長石と、黒〜暗緑色の輝石がかみ合う。", "石英はない。"],
 "similar": [
  {"id": "diorite", "how": "閃緑岩は白い斜長石が多く、黒い鉱物は角閃石。"},
  {"id": "peridotite", "how": "かんらん岩は白い斜長石を含まず、緑っぽい。"},
  {"id": "dolerite", "how": "ドレライトは粒が細かく、ルーペで見る大きさ。"},
  {"id": "amphibolite", "how": "角閃岩は黒い鉱物が角閃石で、同じ向きに並ぶことが多い。"}],
 "japan": "筑波山の山頂部、夜久野オフィオライト（京都府・兵庫県）。",
 "p": {"fabric": "crystalline:2", "clast": "noclast:2", "grain": "coarse:2 medium:1", "struct": "none:2", "color": "dark:2 speckled:1 green:1", "min": "plag:2 px:2 ol:1 hbl:1", "minNo": "qtz kfs ms", "luster": "dull:1 glassy:1", "hard": "hard:2", "acid": "none:2", "weight": "heavy:2", "magnet": "yes:1 no:1", "setting": "pluton:2 accretion:1"}
},
{
 "id": "peridotite", "name": "かんらん岩", "kana": "かんらんがん", "en": "peridotite", "group": "plutonic", "alias": ["橄欖岩", "ダナイト", "dunite"],
 "desc": "かんらん石を主とする超苦鉄質の深成岩。上部マントルをつくる岩石で、プレートの運動によって地表に出ている。",
 "keys": ["黄緑〜暗緑色で重い。", "ガラスのようなつやのかんらん石の粒が多い。輝石を含む。", "風化した表面は褐色の皮になる。", "水と反応すると蛇紋岩に変わる。かんらん石だけでできたものはダナイト。"],
 "similar": [
  {"id": "serpentinite", "how": "蛇紋岩はろうのようなつやで、すべすべする。"},
  {"id": "gabbro", "how": "はんれい岩は白い斜長石を含む。"},
  {"id": "eclogite", "how": "エクロジャイトは赤いざくろ石の粒が目立つ。"}],
 "japan": "アポイ岳（北海道様似町、幌満かんらん岩体）、東赤石山（愛媛県、三波川帯）、早池峰山（岩手県）。",
 "p": {"fabric": "crystalline:2", "clast": "noclast:2", "grain": "coarse:2 medium:2", "struct": "none:2", "color": "green:2 dark:1 red:1", "min": "ol:2 px:2", "minNo": "qtz kfs plag ms bt cal", "luster": "glassy:2 dull:1", "hard": "hard:2", "acid": "none:2", "weight": "heavy:2", "magnet": "yes:1 no:1", "setting": "pluton:1 metamorphic:1 accretion:1 fault:1"}
},
{
 "id": "pumice", "name": "軽石", "kana": "かるいし", "en": "pumice", "group": "pyroclastic", "alias": ["浮石"],
 "desc": "珪長質〜中間質のマグマが発泡して固まった、穴だらけの白っぽい火山噴出物。",
 "keys": ["白〜淡灰色で非常に軽く、多くは水に浮く。", "気泡が細長く引き伸ばされ、絹のような光沢をもつものがある。", "斜長石・石英・角閃石などの結晶を含むことがある。"],
 "similar": [
  {"id": "scoria", "how": "スコリアは黒〜赤褐色で重く、多くは水に沈む。"},
  {"id": "tuff", "how": "凝灰岩は火山灰が固まったもので、穴だらけではない。"},
  {"id": "diatomite", "how": "珪藻土は白く軽いが、穴はなく、指に粉がつく。"}],
 "japan": "南九州のシラス（入戸火砕流堆積物）、2021年に沖縄・奄美に漂着した福徳岡ノ場の軽石。",
 "p": {"fabric": "vesicular:2 pyroclastic:1", "clast": "noclast:2 angular:1", "grain": "glass:2 fine:1", "struct": "none:2 flow:1", "color": "light:2 gray:1", "min": "plag:1 qtz:1 hbl:1 bt:1 px:1", "minNo": "ol ms cal grt glc", "luster": "dull:2 silky:1", "hard": "crumbly:2 soft:1", "acid": "none:2", "weight": "light:2", "magnet": "no:2", "setting": "volcano:2 strata:1"}
},
{
 "id": "scoria", "name": "スコリア", "kana": "スコリア", "en": "scoria", "group": "pyroclastic", "alias": ["岩滓"],
 "desc": "玄武岩〜安山岩質のマグマが発泡して固まった、黒〜赤褐色の穴だらけの火山噴出物。",
 "keys": ["黒〜赤褐色で穴だらけ。表面はざらざらでガラス質。", "軽石より重く、多くは水に沈む。", "酸化すると赤褐色になる。"],
 "similar": [
  {"id": "pumice", "how": "軽石は白っぽく、水に浮くものが多い。"},
  {"id": "basalt", "how": "気泡の多い玄武岩の溶岩は、穴の割合が少なく、ずっしり重い。"}],
 "japan": "富士山の宝永火口周辺、伊豆大島・三宅島、伊豆の大室山（スコリア丘）。",
 "p": {"fabric": "vesicular:2 pyroclastic:1", "clast": "noclast:2 angular:1", "grain": "fine:2 glass:1", "struct": "none:2", "color": "dark:2 red:2", "min": "ol:1 px:1 plag:1", "minNo": "qtz kfs ms bt", "luster": "dull:2 glassy:1", "hard": "crumbly:2 hard:1", "acid": "none:2", "weight": "light:2 normal:1", "magnet": "yes:1 no:1", "setting": "volcano:2"}
},
{
 "id": "tuff", "name": "凝灰岩", "kana": "ぎょうかいがん", "en": "tuff", "group": "pyroclastic", "alias": ["グリーンタフ", "緑色凝灰岩", "大谷石"],
 "desc": "火山灰（直径2mm以下の火山砕屑物）が固まった火山砕屑岩。",
 "keys": ["白〜淡緑色で軽く、ナイフで削れるほど軟らかいものが多い。", "ざらざらした手ざわり。軽石・岩片・結晶片を含む。", "緑色凝灰岩（グリーンタフ）は、日本海側の中新統に広く分布する。"],
 "similar": [
  {"id": "mudstone", "how": "泥岩は緻密で重く、軽石や結晶片を含まない。"},
  {"id": "sandstone", "how": "砂岩は砂粒（石英など）がそろい、重さはふつう。"},
  {"id": "lapilli_tuff", "how": "2mm以上の火山礫が多いと火山礫凝灰岩。"},
  {"id": "diatomite", "how": "珪藻土はさらに軽く、結晶片を含まず、指に白い粉がつく。"}],
 "japan": "大谷石（栃木県宇都宮市）、東北・北陸・山陰の日本海側のグリーンタフ地域。",
 "p": {"fabric": "pyroclastic:2 clastic:1 massive:1", "clast": "noclast:2 angular:1", "grain": "fine:2 medium:1", "struct": "bedding:2 none:1", "color": "light:2 green:2 gray:1 red:1", "min": "plag:1 qtz:1 bt:1 hbl:1", "minNo": "ol grt glc", "luster": "dull:2 earthy:1", "hard": "soft:2 crumbly:1 hard:1", "acid": "none:2", "weight": "light:2 normal:1", "magnet": "no:2", "setting": "strata:2 volcano:1"}
},
{
 "id": "lapilli_tuff", "name": "火山礫凝灰岩", "kana": "かざんれきぎょうかいがん", "en": "lapilli tuff", "group": "pyroclastic", "alias": [],
 "desc": "火山礫（直径2〜64mm）が火山灰の中に混じって固まった火山砕屑岩。",
 "keys": ["細かい火山灰の地に、2〜64mmの軽石・スコリア・溶岩のかけらが散らばる。", "かけらは角ばっていることが多い。"],
 "similar": [
  {"id": "tuff_breccia", "how": "64mmより大きい火山岩塊が多いと凝灰角礫岩。"},
  {"id": "conglomerate", "how": "礫岩の礫は丸く、いろいろな種類の岩石が混じる。"},
  {"id": "breccia", "how": "堆積性の角礫岩は、火山灰の地や軽石を含まない。"}],
 "japan": "火山の山体や、日本海側の中新統（グリーンタフ）。",
 "p": {"fabric": "pyroclastic:2 clastic:2", "clast": "angular:2 round:1", "grain": "fine:1 medium:1 coarse:1", "struct": "none:2 bedding:1", "color": "gray:2 light:1 green:1 red:1 dark:1", "min": "plag:1 qtz:1 hbl:1 px:1 bt:1", "minNo": "ol grt glc", "luster": "dull:2", "hard": "soft:1 hard:1 crumbly:1", "acid": "none:2", "weight": "normal:2 light:1", "magnet": "no:2 yes:1", "setting": "volcano:2 strata:2"}
},
{
 "id": "tuff_breccia", "name": "凝灰角礫岩", "kana": "ぎょうかいかくれきがん", "en": "tuff breccia", "group": "pyroclastic", "alias": ["火山角礫岩"],
 "desc": "火山岩塊（直径64mm以上）を多く含み、火山灰で固められた火山砕屑岩。",
 "keys": ["こぶし大以上の角ばった溶岩のかけらが、火山灰の地に詰まる。", "火山岩塊が多く地が少ないものは火山角礫岩とよぶ。"],
 "similar": [
  {"id": "lapilli_tuff", "how": "かけらが2〜64mmなら火山礫凝灰岩。"},
  {"id": "breccia", "how": "堆積性の角礫岩は、火山灰の地や軽石を含まない。"}],
 "japan": "火山の山体、日本海側の中新統（グリーンタフ）。",
 "p": {"fabric": "pyroclastic:2 clastic:2", "clast": "angular:2 round:1", "grain": "coarse:2 medium:1 fine:1", "struct": "none:2 bedding:1", "color": "gray:2 light:1 green:1 red:1 dark:1", "min": "plag:1 qtz:1 hbl:1 px:1 bt:1", "minNo": "ol grt glc", "luster": "dull:2", "hard": "soft:1 hard:1 crumbly:1", "acid": "none:2", "weight": "normal:2 light:1", "magnet": "no:2 yes:1", "setting": "volcano:2 strata:2"}
},
{
 "id": "welded_tuff", "name": "溶結凝灰岩", "kana": "ようけつぎょうかいがん", "en": "welded tuff", "group": "pyroclastic", "alias": ["イグニンブライト", "ignimbrite"],
 "desc": "火砕流の堆積物が、自分の熱と重さでつぶれ、ガラスどうしがくっついて（溶結して）固まった岩石。",
 "keys": ["黒いレンズ状のガラス（つぶれた軽石＝フィアメ）が同じ向きに並ぶ（ユータキシティック組織）。", "硬く、柱状節理をつくることが多い。", "結晶片や岩片を含む。"],
 "similar": [
  {"id": "rhyolite", "how": "流紋岩の流理は連続した縞で、レンズ状のフィアメや岩片はない。"},
  {"id": "andesite", "how": "安山岩は斑晶が形のよい結晶で、割れた結晶片やフィアメはない。"},
  {"id": "tuff", "how": "溶結していない凝灰岩は軟らかく軽い。"}],
 "japan": "阿蘇4火砕流堆積物（高千穂峡など九州中部）、濃飛流紋岩（岐阜県）。",
 "p": {"fabric": "pyroclastic:2 porphyritic:1 massive:1", "clast": "noclast:2 angular:1", "grain": "fine:2 glass:1", "struct": "flow:2 none:1", "color": "gray:2 dark:1 red:1 light:1", "min": "plag:2 qtz:1 kfs:1 bt:1 hbl:1", "minNo": "ol grt glc", "luster": "dull:2", "hard": "hard:2", "acid": "none:2", "weight": "normal:2", "magnet": "no:2", "setting": "volcano:2 strata:1"}
},
{
 "id": "conglomerate", "name": "礫岩", "kana": "れきがん", "en": "conglomerate", "group": "sedimentary", "alias": [],
 "desc": "直径2mm以上の礫が、砂や泥、鉱物（膠結物）で固められた堆積岩。",
 "keys": ["角のとれた丸い礫が、砂や泥の地に詰まる。", "礫の種類（チャート・砂岩・花こう岩など）から、どこから運ばれてきたかがわかる。", "膠結物が方解石だと、地の部分が塩酸で泡を出す。"],
 "similar": [
  {"id": "breccia", "how": "角礫岩は礫が角ばっている。"},
  {"id": "lapilli_tuff", "how": "火山礫凝灰岩のかけらは軽石や溶岩で、地が火山灰。"}],
 "japan": "各地の河成層・海成層。付加体の中にもある。",
 "p": {"fabric": "clastic:2", "clast": "round:2 angular:1", "grain": "coarse:2 medium:1 fine:1", "struct": "none:2 bedding:1", "min": "qtz:1 fossil:1", "minNo": "", "luster": "dull:2", "hard": "hard:2 soft:1", "acid": "none:2 fizz:1", "weight": "normal:2", "magnet": "no:2", "setting": "strata:2 accretion:1"}
},
{
 "id": "breccia", "name": "角礫岩", "kana": "かくれきがん", "en": "breccia", "group": "sedimentary", "alias": [],
 "desc": "角ばった礫（角礫）が固まった岩石。崖錐・土石流などの堆積物や、断層・火山活動でできたものがある。",
 "keys": ["角が鋭い礫が、細かい地に詰まる。", "礫があまり運ばれていない（近くから来た）ことを示す。"],
 "similar": [
  {"id": "conglomerate", "how": "礫岩の礫は角がとれて丸い。"},
  {"id": "cataclasite", "how": "カタクレーサイトは断層で砕かれたもので、地の部分がさらに細かく砕けている。"},
  {"id": "fault_rock", "how": "断層角礫は固まっておらず、手で崩れる。"},
  {"id": "tuff_breccia", "how": "凝灰角礫岩は地が火山灰で、軽石を含む。"}],
 "japan": "崖錐・扇状地の堆積物、断層沿い、火山の周辺。",
 "p": {"fabric": "clastic:2 pyroclastic:1", "clast": "angular:2", "grain": "coarse:2 medium:1 fine:1", "struct": "none:2 bedding:1 sheared:1", "min": "qtz:1", "minNo": "", "luster": "dull:2", "hard": "hard:2 soft:1", "acid": "none:2 fizz:1", "weight": "normal:2", "magnet": "no:2", "setting": "strata:2 fault:1 volcano:1"}
},
{
 "id": "sandstone", "name": "砂岩", "kana": "さがん", "en": "sandstone", "group": "sedimentary", "alias": ["グレイワッケ", "graywacke", "来待石"],
 "desc": "直径1/16〜2mmの砂粒が固まった堆積岩。",
 "keys": ["さわるとざらざらし、ルーペで砂粒（石英・長石・岩片）が見える。", "付加体の砂岩は灰色で硬い（グレイワッケ）。", "級化層理や斜交葉理などの堆積構造が見られることがある。"],
 "similar": [
  {"id": "siltstone", "how": "シルト岩は粒が見えない。"},
  {"id": "tuff", "how": "凝灰岩は軽く、軽石や結晶片を含む。"},
  {"id": "quartzite", "how": "珪岩は粒どうしがかみ合い、割れ目が粒をつらぬく。"},
  {"id": "hornfels", "how": "砂岩が熱で焼かれると、硬く緻密なホルンフェルスになる。"}],
 "japan": "四万十帯・美濃-丹波帯の付加体、和泉層群。来待石（島根県松江市宍道町）は中新世の凝灰質砂岩。",
 "p": {"fabric": "clastic:2", "clast": "noclast:2 round:1", "grain": "medium:2 coarse:1 fine:1", "struct": "bedding:2 none:2", "color": "gray:2 light:1 dark:1 green:1 red:1", "min": "qtz:2 plag:1 kfs:1 ms:1 bt:1 fossil:1", "minNo": "ol glc", "luster": "dull:2", "hard": "hard:2 soft:1", "acid": "none:2 fizz:1", "weight": "normal:2", "magnet": "no:2", "setting": "strata:2 accretion:2"}
},
{
 "id": "siltstone", "name": "シルト岩", "kana": "シルトがん", "en": "siltstone", "group": "sedimentary", "alias": [],
 "desc": "直径1/256〜1/16mmのシルトが固まった堆積岩。",
 "keys": ["粒は見えないが、爪でこする（歯でかむ）とわずかにじゃりじゃりする。", "泥岩と砂岩の中間の性質。"],
 "similar": [
  {"id": "mudstone", "how": "泥岩はなめらかで、じゃりじゃりしない。"},
  {"id": "sandstone", "how": "砂岩はルーペで砂粒が見える。"}],
 "japan": "各地の新第三系・第四系、付加体。",
 "p": {"fabric": "clastic:2 massive:2", "clast": "noclast:2", "grain": "fine:2 medium:1", "struct": "bedding:2 none:2", "color": "gray:2 dark:1 light:1", "min": "ms:1 fossil:1", "minNo": "ol px hbl grt glc kfs", "luster": "dull:2 earthy:1", "hard": "soft:2 hard:1", "acid": "none:2 fizz:1", "weight": "normal:2", "magnet": "no:2", "setting": "strata:2 accretion:1"}
},
{
 "id": "mudstone", "name": "泥岩", "kana": "でいがん", "en": "mudstone", "group": "sedimentary", "alias": [],
 "desc": "直径1/16mm以下の泥（シルト・粘土）が固まった堆積岩。",
 "keys": ["粒がまったく見えず、なめらか。", "乾くと割れ目が入り、ブロック状に割れる。", "貝・有孔虫・植物などの化石を含むことがある。", "新第三系の泥岩には、水につけると崩れる（スレーキングする）ものがある。"],
 "similar": [
  {"id": "shale", "how": "頁岩は層に沿って薄くはがれる。"},
  {"id": "siltstone", "how": "シルト岩はこするとわずかにじゃりじゃりする。"},
  {"id": "tuff", "how": "凝灰岩は軽く、軽石や結晶片を含む。"},
  {"id": "slate", "how": "粘板岩は硬く、劈開で薄い板に割れ、たたくと金属的な音がする。"}],
 "japan": "日本海側の新第三系（島根半島の成相寺層・古江層など）、太平洋側の前弧海盆の地層。",
 "p": {"fabric": "massive:2 clastic:1", "clast": "noclast:2", "grain": "fine:2", "struct": "none:2 bedding:2", "color": "gray:2 dark:2 light:1 green:1 red:1", "min": "fossil:1", "minNo": "kfs hbl px ol grt glc", "luster": "dull:2 earthy:2", "hard": "soft:2 crumbly:1", "acid": "none:2 fizz:1", "weight": "normal:2", "magnet": "no:2", "setting": "strata:2 accretion:1"}
},
{
 "id": "shale", "name": "頁岩", "kana": "けつがん", "en": "shale", "group": "sedimentary", "alias": [],
 "desc": "泥が固まった岩石のうち、層理に平行に薄くはがれやすい性質（はく離性）をもつもの。",
 "keys": ["本のページのように、層に沿って薄くはがれる。", "黒〜灰色が多い。付加体では砂岩と互層する。"],
 "similar": [
  {"id": "mudstone", "how": "泥岩ははがれにくく、ブロック状に割れる。"},
  {"id": "slate", "how": "粘板岩は劈開で割れ、劈開面は層理と斜交することがある。より硬い。"}],
 "japan": "付加体（秩父帯・美濃-丹波帯・四万十帯）の黒色頁岩、砂岩頁岩互層。",
 "p": {"fabric": "massive:2 clastic:1", "clast": "noclast:2", "grain": "fine:2", "struct": "bedding:2 slaty:1", "color": "dark:2 gray:2 red:1", "min": "fossil:1", "minNo": "kfs hbl px ol grt glc", "luster": "dull:2", "hard": "soft:2 hard:1", "acid": "none:2 fizz:1", "weight": "normal:2", "magnet": "no:2", "setting": "strata:2 accretion:2"}
},
{
 "id": "limestone", "name": "石灰岩", "kana": "せっかいがん", "en": "limestone", "group": "sedimentary", "alias": [],
 "desc": "おもに方解石（CaCO3）からなる堆積岩。サンゴ・有孔虫・ウミユリなど、生物の殻や骨格が集まってできたものが多い。",
 "keys": ["白〜灰色。希塩酸をかけると激しく泡が出る。", "鉄くぎやナイフで簡単に傷がつく。", "フズリナ・ウミユリ・サンゴなどの化石を含むことがある。", "雨水にとけてカルスト地形や鍾乳洞をつくる。"],
 "similar": [
  {"id": "marble", "how": "大理石は方解石の結晶が粗く、キラキラ光る。"},
  {"id": "chert", "how": "チャートは傷がつかず、泡も出ない。"},
  {"id": "mudstone", "how": "石灰質の泥岩も泡を出すが、反応は弱い。"}],
 "japan": "秋吉台（山口県）、伊吹山（滋賀県）、武甲山（埼玉県）、平尾台（福岡県）など。付加体の中の、海山に由来するものが多い。",
 "p": {"fabric": "massive:2 clastic:1 crystalline:1", "clast": "noclast:2", "grain": "fine:2 medium:1", "struct": "none:2 bedding:1", "color": "light:2 gray:2 dark:1", "min": "cal:2 fossil:2", "minNo": "qtz kfs plag hbl px ol bt", "luster": "dull:2", "hard": "soft:2", "acid": "fizz:2", "weight": "normal:2", "magnet": "no:2", "setting": "accretion:2 strata:1"}
},
{
 "id": "chert", "name": "チャート", "kana": "チャート", "en": "chert", "group": "sedimentary", "alias": ["層状チャート", "珪質岩"],
 "desc": "放散虫などの珪質の殻が深海底に積もってできた、ほとんど石英（SiO2）だけからなる緻密な堆積岩。",
 "keys": ["非常に硬く、鉄くぎやナイフで傷がつかない（くぎの金属が逆にこすりつく）。", "割れ口は貝殻状〜鋭く角ばり、ろうのようなつや。", "赤・緑・灰・黒・白などの色。数cmごとに薄い泥岩をはさむ層状チャートが多い。"],
 "similar": [
  {"id": "limestone", "how": "石灰岩はくぎで傷がつき、塩酸で泡が出る。"},
  {"id": "quartzite", "how": "珪岩はルーペで粒が見え、砂糖のようにキラキラする。"},
  {"id": "rhyolite", "how": "流紋岩は斑晶や流理をもつことが多い。"},
  {"id": "hornfels", "how": "ホルンフェルスは黒っぽく、つやが少ない。"}],
 "japan": "美濃-丹波帯・秩父帯の付加体。岐阜県・愛知県境の木曽川沿い（犬山）の層状チャートが有名。",
 "p": {"fabric": "massive:2", "clast": "noclast:2", "grain": "fine:2", "struct": "bedding:2 none:2", "color": "red:2 gray:2 dark:2 light:1 green:1", "min": "", "minNo": "cal kfs plag bt hbl px ol ms", "luster": "waxy:2 dull:1 glassy:1", "hard": "hard:2", "acid": "none:2", "weight": "normal:2", "magnet": "no:2", "setting": "accretion:2 strata:1"}
},
{
 "id": "diatomite", "name": "珪藻土（珪藻質泥岩）", "kana": "けいそうど", "en": "diatomite", "group": "sedimentary", "alias": ["珪藻土", "珪藻質泥岩"],
 "desc": "珪藻の殻（オパール）が集まってできた、白くて軽い堆積物・堆積岩。",
 "keys": ["白〜淡黄色で非常に軽い。乾いたものは水に浮くこともある。", "指でこすると白い粉がつき、舌につけると吸いつく。", "植物の葉や魚の化石を含むことがある。"],
 "similar": [
  {"id": "tuff", "how": "凝灰岩は結晶片や岩片を含み、ざらざらする。"},
  {"id": "mudstone", "how": "泥岩は重く、灰色〜黒っぽいものが多い。"},
  {"id": "pumice", "how": "軽石は穴だらけで、ガラス質。"}],
 "japan": "能登半島（石川県珠洲市、七輪の原料）、秋田県、岡山県の蒜山。",
 "p": {"fabric": "massive:2", "clast": "noclast:2", "grain": "fine:2", "struct": "bedding:2 none:1", "color": "light:2", "min": "fossil:1", "minNo": "qtz kfs plag bt hbl px ol grt cal glc", "luster": "earthy:2 dull:1", "hard": "crumbly:2 soft:2", "acid": "none:2", "weight": "light:2", "magnet": "no:2", "setting": "strata:2"}
},
{
 "id": "slate", "name": "粘板岩（スレート）", "kana": "ねんばんがん", "en": "slate", "group": "metamorphic", "alias": ["粘板岩", "スレート", "雄勝石"],
 "desc": "泥岩や頁岩が弱い変成作用を受け、薄い板にきれいに割れる性質（スレート劈開）をもつようになった岩石。",
 "keys": ["黒〜暗灰色で緻密。", "薄く平らな板に割れる。割れた面のつやは少ない。", "たたくとカンカンと金属的な音がする。硯（すずり）や屋根材に使われる。"],
 "similar": [
  {"id": "shale", "how": "頁岩は軟らかく、層理に沿ってはがれる。"},
  {"id": "phyllite", "how": "千枚岩は割れた面に絹のようなつやと、細かいしわがある。"},
  {"id": "hornfels", "how": "ホルンフェルスは板状に割れず、角ばったかたまりに割れる。"}],
 "japan": "宮城県石巻市の雄勝（雄勝硯、東京駅丸の内駅舎の屋根）、北上山地、美濃帯。",
 "p": {"fabric": "massive:2", "clast": "noclast:2", "grain": "fine:2", "struct": "slaty:2 bedding:1", "color": "dark:2 gray:1", "min": "ms:1", "minNo": "kfs hbl px ol cal", "luster": "dull:2 silky:1", "hard": "hard:2 soft:1", "acid": "none:2", "weight": "normal:2", "magnet": "no:2", "setting": "accretion:2 metamorphic:1 contact:1"}
},
{
 "id": "phyllite", "name": "千枚岩", "kana": "せんまいがん", "en": "phyllite", "group": "metamorphic", "alias": [],
 "desc": "粘板岩より少し変成度が高く、細かい白雲母や緑泥石が並んで、面がつやつやした岩石。",
 "keys": ["割れた面に絹のようなつや（千枚岩光沢）がある。", "細かいしわ（クレニュレーション）が見えることが多い。", "鉱物の粒は肉眼では見えない。"],
 "similar": [
  {"id": "slate", "how": "粘板岩は割れた面のつやが少ない。"},
  {"id": "pelitic_schist", "how": "泥質片岩は雲母の粒が見えるほど粗く、キラキラする。"}],
 "japan": "三波川帯の低変成度部、秩父帯・四万十帯の一部。",
 "p": {"fabric": "massive:1 crystalline:1", "clast": "noclast:2", "grain": "fine:2", "struct": "phyllitic:2 slaty:1 schistose:1", "color": "dark:2 gray:2 green:1", "min": "ms:1 chl:1 qtz:1", "minNo": "kfs ol px", "luster": "silky:2 sparkly:1", "hard": "soft:1 hard:1", "acid": "none:2", "weight": "normal:2", "magnet": "no:2", "setting": "metamorphic:2 accretion:1"}
},
{
 "id": "pelitic_schist", "name": "泥質片岩（黒色片岩）", "kana": "でいしつへんがん", "en": "pelitic schist", "group": "metamorphic", "alias": ["黒色片岩", "泥質片岩", "結晶片岩", "schist"],
 "desc": "泥岩が広域変成作用（とくに低温高圧型）を受けてできた片岩。石墨を含んで黒っぽいものが多い。",
 "keys": ["黒〜暗灰色で、白雲母が並んで面がキラキラ光り、薄くはがれる（片理）。", "石英の白い薄層やレンズをはさむ。", "ざくろ石の小さな赤い粒や、曹長石の白い点（点紋）を含むことがある。"],
 "similar": [
  {"id": "phyllite", "how": "千枚岩は粒が見えず、絹のようなつや。"},
  {"id": "mafic_schist", "how": "苦鉄質片岩は緑色。"},
  {"id": "gneiss", "how": "片麻岩は粒が粗く、薄くはがれにくい。"}],
 "japan": "三波川帯（埼玉県の長瀞、徳島県の大歩危、愛媛県の別子など）。",
 "p": {"fabric": "crystalline:1", "clast": "noclast:2", "grain": "medium:2 fine:1", "struct": "schistose:2", "color": "dark:2 gray:2", "min": "ms:2 qtz:2 chl:1 grt:1 bt:1 plag:1", "minNo": "kfs ol px", "luster": "sparkly:2 silky:1", "hard": "soft:1 hard:1", "acid": "none:2", "weight": "normal:2", "magnet": "no:2", "setting": "metamorphic:2"}
},
{
 "id": "mafic_schist", "name": "苦鉄質片岩（緑色片岩）", "kana": "くてつしつへんがん", "en": "mafic schist (greenschist)", "group": "metamorphic", "alias": ["緑色片岩", "苦鉄質片岩", "greenschist", "青石"],
 "desc": "玄武岩や苦鉄質の凝灰岩が広域変成作用を受けてできた、緑色の片岩。",
 "keys": ["緑色で片理が発達し、薄くはがれる。", "緑泥石・緑れん石・アクチノ閃石（緑色の細い柱）を含む。", "白い曹長石の斑点（点紋）が見えるものもある。"],
 "similar": [
  {"id": "greenstone", "how": "緑色岩は片理が弱く、塊状。"},
  {"id": "serpentinite", "how": "蛇紋岩はろうのようなつやで、すべすべする。"},
  {"id": "amphibolite", "how": "角閃岩は黒っぽく重く、角閃石の柱が見える。"},
  {"id": "blueschist", "how": "青色片岩は青みがかる。"}],
 "japan": "三波川帯。紀州青石・伊予青石・秩父青石として庭石に使われる。",
 "p": {"fabric": "crystalline:1", "clast": "noclast:2", "grain": "medium:2 fine:2", "struct": "schistose:2", "color": "green:2", "min": "chl:2 plag:1 hbl:1 cal:1 qtz:1 grt:1 glc:1", "minNo": "kfs ol", "luster": "silky:2 sparkly:1 dull:1", "hard": "hard:2 soft:1", "acid": "none:2 fizz:1", "weight": "normal:2 heavy:1", "magnet": "no:2", "setting": "metamorphic:2"}
},
{
 "id": "blueschist", "name": "青色片岩（藍閃石片岩）", "kana": "せいしょくへんがん", "en": "blueschist", "group": "metamorphic", "alias": ["藍閃石片岩", "青色片岩", "glaucophane schist"],
 "desc": "玄武岩質の岩石が、低温高圧の条件（沈み込み帯の深い所）で変成し、藍閃石を含むようになった片岩。",
 "keys": ["青灰〜青紫色の、細かい柱状の藍閃石が並ぶ。", "緑色片岩と互層したり、ざくろ石を含んだりする。"],
 "similar": [
  {"id": "mafic_schist", "how": "苦鉄質片岩は緑色で、藍閃石を含まないか少ない。"},
  {"id": "eclogite", "how": "エクロジャイトは緑色の輝石と赤いざくろ石からなり、片理は弱い。"}],
 "japan": "三波川帯の一部、新潟県糸魚川市の青海（蓮華帯）、長崎変成岩。",
 "p": {"fabric": "crystalline:1", "clast": "noclast:2", "grain": "medium:2 fine:1", "struct": "schistose:2", "color": "blue:2 green:1 dark:1", "min": "glc:2 chl:1 grt:1 ms:1", "minNo": "kfs ol", "luster": "silky:2 sparkly:1", "hard": "hard:2 soft:1", "acid": "none:2", "weight": "normal:2 heavy:1", "magnet": "no:2", "setting": "metamorphic:2"}
},
{
 "id": "siliceous_schist", "name": "珪質片岩（石英片岩）", "kana": "けいしつへんがん", "en": "siliceous schist (quartz schist)", "group": "metamorphic", "alias": ["石英片岩", "珪質片岩", "紅れん石片岩"],
 "desc": "チャートなど石英の多い岩石が、広域変成作用を受けてできた片岩。",
 "keys": ["白〜淡灰色で石英が多く、硬い。", "白雲母が並んでキラキラ光る。", "赤紫色の紅れん石を含むと紅れん石片岩とよばれる。"],
 "similar": [
  {"id": "quartzite", "how": "珪岩は片理がほとんどない。"},
  {"id": "pelitic_schist", "how": "泥質片岩は黒っぽく、石英が少ない。"}],
 "japan": "三波川帯（埼玉県長瀞の紅れん石片岩、四国中央部）。",
 "p": {"fabric": "crystalline:1", "clast": "noclast:2", "grain": "medium:2 fine:1", "struct": "schistose:2 bedding:1", "color": "light:2 gray:1 red:1", "min": "qtz:2 ms:2", "minNo": "ol px kfs", "luster": "sparkly:2 glassy:1", "hard": "hard:2", "acid": "none:2", "weight": "normal:2", "magnet": "no:2", "setting": "metamorphic:2"}
},
{
 "id": "gneiss", "name": "片麻岩", "kana": "へんまがん", "en": "gneiss", "group": "metamorphic", "alias": [],
 "desc": "高温の広域変成作用でできた粗粒の変成岩。白い鉱物（石英・長石）と黒い鉱物（黒雲母・角閃石）が縞状に分かれて並ぶ（片麻状構造）。",
 "keys": ["白と黒の縞模様（片麻状構造）。", "粒が粗く、片岩のように薄くはがれない。", "ざくろ石や珪線石を含むことがある。"],
 "similar": [
  {"id": "granite", "how": "花こう岩は鉱物が並ばず、縞がない。"},
  {"id": "pelitic_schist", "how": "泥質片岩は粒が細かく、薄くはがれる。"},
  {"id": "mylonite", "how": "マイロナイトは細かくすりつぶされ、目玉状の粒が残る。"}],
 "japan": "領家帯（愛知県三河地方〜長野県、山口県柳井）、飛騨帯（岐阜県・富山県）、日高帯（北海道）。",
 "p": {"fabric": "crystalline:2", "clast": "noclast:2", "grain": "coarse:2 medium:2", "struct": "gneissic:2", "color": "speckled:2 gray:1 light:1 dark:1", "min": "qtz:2 plag:2 kfs:2 bt:2 hbl:1 grt:1", "minNo": "ol glc", "luster": "sparkly:1 glassy:1 dull:1", "hard": "hard:2", "acid": "none:2", "weight": "normal:2", "magnet": "no:2", "setting": "metamorphic:2 pluton:1"}
},
{
 "id": "hornfels", "name": "ホルンフェルス", "kana": "ホルンフェルス", "en": "hornfels", "group": "metamorphic", "alias": [],
 "desc": "泥岩・砂岩などが、マグマ（花こう岩など）の熱で焼かれてできた接触変成岩。",
 "keys": ["黒〜暗灰色で非常に緻密で硬い。", "割ると角ばった鋭い破片になり、たたくと高い音がする。", "元の層理が残ることがある。菫青石や紅柱石の斑点が見えるもの（斑点状ホルンフェルス）もある。"],
 "similar": [
  {"id": "basalt", "how": "玄武岩は斑晶や気泡を含むことが多い。"},
  {"id": "chert", "how": "チャートはろうのようなつやで、色が多様。"},
  {"id": "slate", "how": "粘板岩は薄い板に割れる。"}],
 "japan": "花こう岩体の周り（領家帯、中国地方の花こう岩の周り、六甲山の周りなど）。",
 "p": {"fabric": "massive:2", "clast": "noclast:2", "grain": "fine:2", "struct": "none:2 bedding:1", "color": "dark:2 gray:1", "min": "bt:1 grt:1", "minNo": "ol cal glc", "luster": "dull:2 glassy:1", "hard": "hard:2", "acid": "none:2", "weight": "normal:2 heavy:1", "magnet": "no:2 yes:1", "setting": "contact:2"}
},
{
 "id": "marble", "name": "大理石（結晶質石灰岩）", "kana": "だいりせき", "en": "marble", "group": "metamorphic", "alias": ["大理石", "結晶質石灰岩", "寒水石"],
 "desc": "石灰岩が変成作用を受け、方解石が再結晶して粗くなった岩石。",
 "keys": ["白〜灰色で、方解石の結晶面がキラキラ光る（砂糖状〜粗粒）。", "希塩酸で泡が出て、ナイフで傷がつく。", "化石は再結晶で消えていることが多い。石材の「大理石」には、変成していない石灰岩も含まれる。"],
 "similar": [
  {"id": "limestone", "how": "石灰岩は粒が見えず、化石が残る。"},
  {"id": "quartzite", "how": "珪岩は傷がつかず、泡も出ない。"},
  {"id": "skarn", "how": "スカルンはざくろ石や輝石が多く、重い。"}],
 "japan": "茨城県日立市周辺（寒水石）、花こう岩と石灰岩が接する所。",
 "p": {"fabric": "crystalline:2", "clast": "noclast:2", "grain": "coarse:2 medium:2", "struct": "none:2 bedding:1", "color": "light:2 gray:1", "min": "cal:2 grt:1", "minNo": "qtz kfs ol bt", "luster": "sparkly:2 glassy:1", "hard": "soft:2", "acid": "fizz:2", "weight": "normal:2", "magnet": "no:2", "setting": "contact:2 metamorphic:2"}
},
{
 "id": "quartzite", "name": "珪岩", "kana": "けいがん", "en": "quartzite", "group": "metamorphic", "alias": ["硅岩"],
 "desc": "石英砂岩やチャートが変成して、石英の粒どうしが再結晶してかみ合った岩石。",
 "keys": ["白〜淡灰色で非常に硬い。", "粒がそろい、砂糖のようにキラキラ光る。", "割れ目が粒をつらぬいて走る（砂岩では粒のまわりで割れる）。"],
 "similar": [
  {"id": "chert", "how": "チャートは粒が見えず、ろうのようなつや。"},
  {"id": "sandstone", "how": "砂岩は粒のまわりで割れ、ざらざらする。"},
  {"id": "marble", "how": "大理石はくぎで傷がつき、塩酸で泡が出る。"},
  {"id": "siliceous_schist", "how": "珪質片岩は白雲母が並び、片理がある。"}],
 "japan": "領家帯・飛騨帯、チャートが接触変成を受けた所。",
 "p": {"fabric": "crystalline:2", "clast": "noclast:2", "grain": "medium:2 fine:1 coarse:1", "struct": "none:2 bedding:1 schistose:1", "color": "light:2 gray:1 red:1", "min": "qtz:2 ms:1", "minNo": "cal kfs ol px hbl", "luster": "glassy:2 sparkly:1", "hard": "hard:2", "acid": "none:2", "weight": "normal:2", "magnet": "no:2", "setting": "metamorphic:2 contact:1 accretion:1"}
},
{
 "id": "amphibolite", "name": "角閃岩", "kana": "かくせんがん", "en": "amphibolite", "group": "metamorphic", "alias": [],
 "desc": "玄武岩質の岩石が中〜高温の変成作用を受け、角閃石と斜長石を主とするようになった変成岩。",
 "keys": ["黒〜暗緑色で重い。", "黒い角閃石の柱状結晶が同じ向きに並ぶことが多い（線構造）。", "白い斜長石の層と互層したり、ざくろ石を含んだりする。"],
 "similar": [
  {"id": "gabbro", "how": "はんれい岩の黒い鉱物は輝石で、並ばない。"},
  {"id": "mafic_schist", "how": "苦鉄質片岩は明るい緑色で、薄くはがれる。"},
  {"id": "diorite", "how": "閃緑岩は角閃石が並ばず、白い斜長石が多い。"}],
 "japan": "三波川帯の高変成度部（四国中央部）、飛騨帯、日高帯。",
 "p": {"fabric": "crystalline:2", "clast": "noclast:2", "grain": "medium:2 coarse:2", "struct": "schistose:1 gneissic:1 none:1", "color": "dark:2 green:2 speckled:1", "min": "hbl:2 plag:2 grt:1", "minNo": "kfs ol", "luster": "sparkly:1 glassy:1 silky:1", "hard": "hard:2", "acid": "none:2", "weight": "heavy:2", "magnet": "no:2 yes:1", "setting": "metamorphic:2"}
},
{
 "id": "eclogite", "name": "エクロジャイト", "kana": "エクロジャイト", "en": "eclogite", "group": "metamorphic", "alias": ["榴輝岩"],
 "desc": "玄武岩質の岩石が非常に高い圧力（沈み込むプレートの中、深さ数十km以上）で変成した岩石。斜長石を含まない。",
 "keys": ["緑色のオンファス輝石の地に、赤〜赤褐色のざくろ石の粒が散らばる。", "とても重い（密度 約3.4〜3.5 g/cm³）。"],
 "similar": [
  {"id": "amphibolite", "how": "角閃岩は黒っぽく、斜長石を含む。"},
  {"id": "peridotite", "how": "かんらん岩は黄緑のかんらん石が主で、ざくろ石はふつう目立たない。"},
  {"id": "skarn", "how": "スカルンは石灰岩と深成岩の接触部にでき、方解石を伴うことが多い。"}],
 "japan": "三波川帯の四国中央部（愛媛県の東赤石山・五良津・瀬場谷など）。",
 "p": {"fabric": "crystalline:2", "clast": "noclast:2", "grain": "medium:2 coarse:2", "struct": "none:2 schistose:1 gneissic:1", "color": "green:2 red:1", "min": "grt:2 px:2", "minNo": "kfs plag ol", "luster": "glassy:2", "hard": "hard:2", "acid": "none:2", "weight": "heavy:2", "magnet": "no:2", "setting": "metamorphic:2"}
},
{
 "id": "serpentinite", "name": "蛇紋岩", "kana": "じゃもんがん", "en": "serpentinite", "group": "metamorphic", "alias": [],
 "desc": "かんらん岩が水と反応して（蛇紋石化して）できた岩石。",
 "keys": ["暗緑〜黒緑色で、ろうのようなつやがあり、さわるとすべすべする。", "蛇の皮のような模様や、すべって光る面（鏡肌）が多い。", "磁鉄鉱を含み、磁石に引かれることが多い。", "変形しやすく、地すべりを起こしやすい。"],
 "similar": [
  {"id": "peridotite", "how": "かんらん岩はガラスのようなつやの粒が見え、硬い。"},
  {"id": "mafic_schist", "how": "苦鉄質片岩は片理がはっきりし、すべすべしない。"},
  {"id": "greenstone", "how": "緑色岩はつやがなく、硬い。"}],
 "japan": "構造線・断層沿いに多い（黒瀬川帯、神居古潭帯、三波川帯、早池峰など）。",
 "p": {"fabric": "massive:2", "clast": "noclast:2 angular:1", "grain": "fine:2", "struct": "none:2 sheared:2 schistose:1", "color": "green:2 dark:2", "min": "", "minNo": "qtz kfs plag bt ms", "luster": "waxy:2 silky:1", "hard": "soft:2 hard:1", "acid": "none:2", "weight": "normal:2 heavy:1", "magnet": "yes:2 no:1", "setting": "fault:2 metamorphic:2 accretion:1"}
},
{
 "id": "greenstone", "name": "緑色岩", "kana": "りょくしょくがん", "en": "greenstone", "group": "metamorphic", "alias": ["緑岩"],
 "desc": "海底に噴出した玄武岩などが、低温の変成作用や変質を受けて緑色になった岩石（野外での呼び名）。",
 "keys": ["くすんだ緑色で塊状。片理は弱いか、ない。", "枕状溶岩（まくら形のかたまり）やハイアロクラスタイトとして出ることが多い。", "方解石の白い脈や、赤色のチャート・石灰岩を伴うことがある。"],
 "similar": [
  {"id": "mafic_schist", "how": "苦鉄質片岩は片理が発達し、薄くはがれる。"},
  {"id": "basalt", "how": "変質していない玄武岩は黒〜暗灰色。"},
  {"id": "serpentinite", "how": "蛇紋岩はろうのようなつやで、すべすべする。"}],
 "japan": "秩父帯・美濃-丹波帯・四万十帯など付加体の中（海山や海洋地殻のかけら）。",
 "p": {"fabric": "massive:2 porphyritic:1 vesicular:1", "clast": "noclast:2 angular:1", "grain": "fine:2 medium:1", "struct": "none:2 sheared:1", "color": "green:2 dark:1 red:1", "min": "chl:2 cal:1 px:1 plag:1", "minNo": "qtz kfs ms", "luster": "dull:2", "hard": "hard:2 soft:1", "acid": "none:2 fizz:1", "weight": "heavy:2 normal:1", "magnet": "no:1 yes:1", "setting": "accretion:2 metamorphic:1"}
},
{
 "id": "skarn", "name": "スカルン", "kana": "スカルン", "en": "skarn", "group": "metamorphic", "alias": [],
 "desc": "石灰岩などの炭酸塩岩と、マグマ（花こう岩など）が接してできた、カルシウムに富むケイ酸塩鉱物の集まり（接触交代岩）。鉱床をつくることがある。",
 "keys": ["褐色〜緑色のざくろ石（灰ばんざくろ石など）、緑色の単斜輝石や緑れん石が集まり、重い。", "磁鉄鉱・黄銅鉱・閃亜鉛鉱などの金属鉱物を伴うことがある。"],
 "similar": [
  {"id": "marble", "how": "大理石は方解石が主で、軽く軟らかい。"},
  {"id": "eclogite", "how": "エクロジャイトは変成帯に出て、緑の輝石の地に赤いざくろ石が散らばる。"}],
 "japan": "岐阜県の神岡鉱山、岩手県の釜石鉱山など。",
 "p": {"fabric": "crystalline:2", "clast": "noclast:2", "grain": "coarse:2 medium:2", "struct": "none:2 bedding:1", "color": "green:2 red:1 light:1 dark:1 speckled:1", "min": "grt:2 px:2 cal:1 chl:1 qtz:1", "minNo": "ol", "luster": "glassy:2", "hard": "hard:2", "acid": "none:2 fizz:1", "weight": "heavy:2", "magnet": "yes:1 no:1", "setting": "contact:2"}
},
{
 "id": "mylonite", "name": "マイロナイト", "kana": "マイロナイト", "en": "mylonite", "group": "fault", "alias": ["圧砕岩"],
 "desc": "断層帯の深い所（延性領域）で、岩石が流れるように変形して細粒になった断層岩。",
 "keys": ["細かくすりつぶされた地に、長石などの大きな粒（ポーフィロクラスト）が目玉状に残る。", "強い面構造と線構造があり、縞状。", "目玉の非対称な形から、ずれの向き（せん断センス）が読み取れる。"],
 "similar": [
  {"id": "gneiss", "how": "片麻岩は粒が粗く、すりつぶされた細かい地がない。"},
  {"id": "cataclasite", "how": "カタクレーサイトは方向性がなく、角ばったかけらが散らばる。"},
  {"id": "pelitic_schist", "how": "泥質片岩は白雲母が並んでキラキラし、目玉状の粒は少ない。"}],
 "japan": "中央構造線沿いの領家帯側（長野県大鹿村の鹿塩マイロナイト、三重県松阪市の月出など）。",
 "p": {"fabric": "massive:1 crystalline:1 porphyritic:1", "clast": "noclast:2 round:1", "grain": "fine:2 medium:1", "struct": "sheared:2 gneissic:1 schistose:1", "color": "gray:2 dark:1 light:1 speckled:1", "min": "qtz:1 kfs:1 plag:1 bt:1 ms:1", "minNo": "ol", "luster": "dull:1 silky:1 sparkly:1", "hard": "hard:2", "acid": "none:2", "weight": "normal:2", "magnet": "no:2", "setting": "fault:2 metamorphic:1"}
},
{
 "id": "cataclasite", "name": "カタクレーサイト", "kana": "カタクレーサイト", "en": "cataclasite", "group": "fault", "alias": [],
 "desc": "断層帯の浅い所（脆性領域）で、岩石が砕かれてできた、固結した断層岩。",
 "keys": ["角ばった岩片が、細かく砕けた地の中に方向性なく散らばる。", "マイロナイトのような流れた縞はない。", "固結していて、手では崩れない。"],
 "similar": [
  {"id": "mylonite", "how": "マイロナイトは強い面構造があり、目玉状の粒が並ぶ。"},
  {"id": "breccia", "how": "堆積性の角礫岩は、地が砂や泥で、層理を伴うことがある。"},
  {"id": "fault_rock", "how": "断層角礫・ガウジは固まっておらず、手で崩れる。"}],
 "japan": "中央構造線などの大断層の破砕帯。",
 "p": {"fabric": "clastic:2 massive:1", "clast": "angular:2", "grain": "fine:2 medium:1", "struct": "none:2 sheared:1", "color": "dark:2 gray:1 green:1", "min": "qtz:1 plag:1", "minNo": "", "luster": "dull:2", "hard": "hard:2 soft:1", "acid": "none:2 fizz:1", "weight": "normal:2", "magnet": "no:2", "setting": "fault:2"}
},
{
 "id": "fault_rock", "name": "断層角礫・断層ガウジ", "kana": "だんそうかくれき・だんそうガウジ", "en": "fault breccia / fault gouge", "group": "fault", "alias": ["断層角礫", "断層ガウジ", "断層粘土", "fault gouge", "fault breccia"],
 "desc": "断層のごく浅い所でできた、固まっていない断層岩。角礫が多いものを断層角礫、粘土状のものを断層ガウジ（断層粘土）という。",
 "keys": ["手で崩れるほどもろい。", "ガウジは湿るとねばり、色の違う帯、こすれた筋（条線）、光る面（鏡肌）が見える。", "周りより低い谷や鞍部になりやすい。"],
 "similar": [
  {"id": "cataclasite", "how": "カタクレーサイトは固結していて、手で崩れない。"},
  {"id": "breccia", "how": "角礫岩は固結した堆積岩。"},
  {"id": "mudstone", "how": "泥岩は層理をもち、せん断の筋や鏡肌は少ない。"}],
 "japan": "活断層の露頭（兵庫県淡路市の野島断層保存館など）。",
 "p": {"fabric": "clastic:2 massive:1", "clast": "angular:2 noclast:1", "grain": "fine:2 medium:1 coarse:1", "struct": "sheared:2 none:1", "color": "gray:2 dark:1 light:1 green:1 red:1", "min": "", "minNo": "", "luster": "earthy:2 dull:1 waxy:1", "hard": "crumbly:2 soft:1", "acid": "none:2 fizz:1", "weight": "normal:2 light:1", "magnet": "no:2", "setting": "fault:2"}
}
]
};
