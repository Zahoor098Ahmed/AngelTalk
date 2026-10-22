/**
 * Vocabulary from the "Pics for PECS® Version 15" word list (Pyramid Educational Consultants),
 * arranged the way the app shows words: shelf -> sub-category -> words.
 *
 * Cleaned on the way in (see buildPecsSubcategories): numbered variants ("bird 1", "bird 2") become one
 * word, "-US" duplicates and British/American spelling pairs are merged, and a word that is already on
 * the board (or earlier in this list) is not added a second time. Alcohol, pork and the gender-specific
 * body-part words are left out.
 */

export type PecsShelf = { name: string; icon: string; color: string };
export type PecsSub = { parent: string; name: string; icon: string; words: string; keepCase?: boolean; keepNumbers?: boolean };

/** New top-level shelves (the others go into shelves the app already has). */
export const PECS_SHELVES: PecsShelf[] = [
  { name: "Alphabet & Numerals", icon: "🔤", color: "#4a7fe6" },
  { name: "Animals", icon: "🐾", color: "#5c9a58" },
  { name: "Attributes", icon: "🎨", color: "#c96b6b" },
  { name: "Body Parts", icon: "🖐️", color: "#c98a3d" },
  { name: "Calendar", icon: "📅", color: "#8a6bc9" },
  { name: "Clothing & Accessories", icon: "👕", color: "#4a7fe6" },
  { name: "Computers & Electronics", icon: "💻", color: "#2f6d62" },
  { name: "Health & Medical", icon: "🩺", color: "#c96b6b" },
  { name: "Holidays & Celebrations", icon: "🎉", color: "#c98a3d" },
  { name: "Home", icon: "🏠", color: "#5c9a58" },
  { name: "Money & Finance", icon: "💰", color: "#2f6d62" },
  { name: "Nature & Outdoors", icon: "🌳", color: "#5c9a58" },
  { name: "Office", icon: "🗂️", color: "#8a6bc9" },
  { name: "Other", icon: "📦", color: "#8a6bc9" },
  { name: "Sentence Starters & Phrases", icon: "💬", color: "#4a7fe6" },
  { name: "Songs & Stories", icon: "🎵", color: "#c98a3d" },
  { name: "Tools & Supplies", icon: "🧰", color: "#8a6bc9" },
  { name: "Toys & Leisure", icon: "🧸", color: "#c96b6b" },
  { name: "Transportation & Travel", icon: "🚗", color: "#4a7fe6" },
];

/** Arabic names of the new shelves and sub-categories. */
export const PECS_FOLDER_NAMES_AR: Record<string, string> = {
  "Alphabet & Numerals": "الحروف والأرقام", Animals: "حيوانات", Attributes: "صفات", "Body Parts": "أجزاء الجسم",
  Calendar: "التقويم", "Clothing & Accessories": "ملابس وإكسسوارات", "Computers & Electronics": "حواسيب وإلكترونيات",
  "Health & Medical": "الصحة والطب", "Holidays & Celebrations": "عطلات واحتفالات", Home: "المنزل", "Money & Finance": "المال",
  "Nature & Outdoors": "الطبيعة والخارج", Office: "المكتب", Other: "أخرى", "Sentence Starters & Phrases": "بدايات الجمل والعبارات",
  "Songs & Stories": "أغاني وقصص", "Tools & Supplies": "أدوات ولوازم", "Toys & Leisure": "ألعاب وترفيه",
  "Transportation & Travel": "المواصلات والسفر",
  "Lower Case": "حروف صغيرة", "Upper Case": "حروف كبيرة", Numerals: "أرقام", General: "عام", Colors: "ألوان",
  Prepositions: "حروف الجر", Shapes: "أشكال", Days: "الأيام", Months: "الأشهر", Breads: "خبز",
  "Condiments, Spreads & Spices": "صلصات ودهون وتوابل", "Dairy & Eggs": "ألبان وبيض", "Fruits, Vegetables & Nuts": "فواكه وخضروات ومكسرات",
  "Meats & Fish": "لحوم وأسماك", Soups: "شوربات", Sweets: "حلويات", Vehicles: "مركبات",
};

const A = "Animals", D = "Attributes", F = "Food";

export const PECS_SUBS: PecsSub[] = [
  // ---------------- Alphabet and numerals ----------------
  { parent: "Alphabet & Numerals", name: "Lower Case", icon: "🔡", keepCase: true, words: "a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z" },
  { parent: "Alphabet & Numerals", name: "Upper Case", icon: "🔠", keepCase: true, words: "A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z" },
  { parent: "Alphabet & Numerals", name: "Numerals", icon: "🔢", keepNumbers: true, words: "0,1,2,3,4,5,6,7,8,9,10,first,second,third,fourth,fifth,sixth,seventh,eighth,ninth,tenth,eleventh,twelfth" },
  { parent: "Alphabet & Numerals", name: "Other", icon: "🔤", words: "alphabet,alphabet song,count,counting,hiragana letters,letters,numbers" },

  // ---------------- Animals ----------------
  {
    parent: A, name: "General", icon: "🐾",
    words:
      "alligator,animals,ankylosaurus,ant,antelope,apatosaurus,armadillo,badger,bat,bear,beaver,bee,beetle,stag beetle,bird,black bird,blue whale,Boston terrier,brachiosaurus,brontosaurus,bug,bugs,bull,bulldog,bunny,butterfly,calf,camel,cat,caterpillar,cheetah,chick,chicken,chihuahua,chimpanzee,chipmunk,cow,crab,cricket,crocodile,crow,dachshund," +
      "dalmatian,deer,dingo,dino,dinosaurs,diplodocus,dog,dolphin,donkey,dragon,dragonfly,duck,duckling,eagle,echidna,elephant,ferret,fish,flamingo,flea,fly,fox,frog,gerbil,giraffe,goat,goldfish,goose,gorilla,grasshopper,groundhog,guinea pig,hamster,hippo,horse,hummingbird,iguanodon,jellyfish,kangaroo,kitten,koala,koi,kookaburra,ladybug,lamb,leopard," +
      "lightning bug,lion,lizard,llama,lobster,monkey,moose,mosquito,moth,mouse,musk ox,octopus,orangutan,ostrich,otter,owl,panda,panther,parrot,peacock,pelican,penguin,pets,pig,pigeon,platypus,polar bear,poodle,porcupine,possum,pterodactyl,puppy,rabbit,raccoon,raptor,reindeer,rhino,roly poly,rooster,sea turtle,seahorse,seal,shark,sheep,skunk,sloth bear," +
      "snail,snake,spider,spinosaurus,squid,squirrel,starfish,stegosaurus,stingray,swan,swordfish,T rex,tadpole,tasmanian devil,tiger,toad,toucan,triceratops,tuna,turkey,turtle,tyrannosaurus rex,unicorn,velociraptor,walrus,whale,wolf,wombat,woodlouse,woodpecker,worm,zebra",
  },
  {
    parent: A, name: "Other", icon: "🦴",
    words:
      "animal brush,aquarium,barn,beak,bird feeder,cat toys,cocoon,cow bell,dog bone,dog collar,dog food,dog leash,dog toys,ears,feather,feed,feed birds,feed ducks,feed fish,feed pet,fly swatter,fossil,nest,pet food,reins,ride camel,ride horse,ride pony,saddle,silo,tail,veterinarian,walk the dog,water bowl,web,zoo keeper",
  },

  // ---------------- Attributes ----------------
  { parent: D, name: "Colors", icon: "🎨", words: "beige,black,blue,dark blue,light blue,brown,colors,gold,gray,green,multi,orange,pink,purple,rainbow,red,silver,tan,white,yellow" },
  {
    parent: D, name: "Other", icon: "✨",
    words:
      "all,bad,better,big,broken,canned,checked,chopped,clean,cold,crunchy,curved,cut,dirty,dotted,down,dry,empty,fast,fat,few,freeze dried,fresh,from,full,good,hard,heavy,high,hot,inside,landscape,left,less,little,long,loud,low,many,minced,more,noise,noisy,off switch,okay,on switch,one,outside,plaid,portrait,right,rough,short,skinny," +
      "sliced,slow,small,smooth,soft,spotted,stinky,straight,striped,sweet,tall,that,thin,to,turn,up,volume down,volume up,wet,wheezy,zig-zags",
  },
  { parent: D, name: "Prepositions", icon: "↔️", words: "after,before,behind,between,bottom,first,in,in front of,last,middle,next to,off,on,second,third,top,under" },
  { parent: D, name: "Shapes", icon: "🔷", words: "bone,circle,diamond,heart,hexagon,moon,octagon,oval,pyramid,rectangle,semi circle,half circle,shapes,square,star,triangle" },

  // ---------------- Body parts ----------------
  {
    parent: "Body Parts", name: "General", icon: "🖐️",
    words:
      "ankle,arm,back,beard,belly button,belly,cheek,chin,ear,elbow,eyebrow,eyes,face,finger,fingernails,foot,hair,hand,head,knee,lap,leg,mouth,mustache,neck,nose,our bodies,shoulder,skeleton,stomach,teeth,throat,thumb,toenails,toes,tongue,tooth,tummy",
  },

  // ---------------- Calendar ----------------
  { parent: "Calendar", name: "Days", icon: "📆", words: "day,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday" },
  { parent: "Calendar", name: "Months", icon: "🗓️", words: "January,February,March,April,May,June,July,August,September,October,November,December,months" },
  { parent: "Calendar", name: "Other", icon: "📅", words: "calendar,today,tomorrow,yesterday,week,weekend,year,what year,zodiac" },

  // ---------------- Clothing and accessories ----------------
  {
    parent: "Clothing & Accessories", name: "General", icon: "👕",
    words:
      "animal hat,apron,art smock,backpack,baseball cap,bathing suit,belt,bib,bikini,bookbag,boots,boxer briefs,boxer shorts,boxers,bra,bracelet,briefs,bum bag,buttons,cape,cardigan,coat,coin purse,crown,diaper,dress,dress shirt,dressing gown,earrings,fire hat,flip-flops,glasses,gloves,gum boots,hairnet,handbag,handkerchief,hanger,hard hat,hat,helmet," +
      "high heels,hooded top,hula skirt,jacket,jeans,jewelry,jogging bottoms,jumper,kimono,knickers,leggings,lei,mask,mittens,monocle,necklace,necktie,nightdress,nightgown,nightie,overalls,pajamas,pant hanger,panties,pants,pull-ups,purse,rain boots,rain poncho,ribbon,ring,robe,rubber boots,running shoes,sandals,scarf,shirt,shoe lace,shoes,shorts,singlet," +
      "ski boots,ski cap,ski hat,skirt hanger,skirt,slippers,smock,sneakers,snow shoes,socks,suitcase,sunglasses,sweater,sweatpants,sweatshirt,swim shirt,swim trunks,swimming costume,swimsuit,tennis shoes,tiara,tie,tights,top hat,track pants,trainers,trouser hanger,trousers,t-shirt,umbrella,underpants,undershirt,underwear,vest,visor,waist pack,waistcoat," +
      "wallet,watch,weighted vest,wellington boots,wind breaker,windcheater,winter boots,woolly cap,work boots,wristband,zipper",
  },

  // ---------------- Computers and electronics ----------------
  {
    parent: "Computers & Electronics", name: "General", icon: "💻",
    words:
      "action camera,alarm clock,answering machine,app,arcade game,batteries,blu-ray,cable,calculator,camera,CD case,CD player,CDs,cell phone,charger,communication aid,communication device,computer,computer game,copier,DVD player,DVDs,DVR,earphones,game controller,gaming console,handheld video game,headphones,headset,hi fi system,image search,instant camera," +
      "internet search,karaoke,keyboard,laminator,laptop computer,laser pointer,media device,microphone,mobile phone,monitor,computer mouse,MP3 player,phone,power cable,power cord,printer,radio,remote control boat,remote control car,remote control helicopter,remote control,robot,smart phone,smart watch,smoke alarm,smoke detector,stereo,tablet,tape player," +
      "telephone,telescope,television,tripod,TV,USB stick,VCR,video camera,video game system,video recorder,video search,video,videogame,videotape,white noise machine",
  },

  // ---------------- Emotions (into the Feelings shelf) ----------------
  { parent: "Feelings", name: "Happy & Calm", icon: "😊", words: "happy,excited,surprised" },
  { parent: "Feelings", name: "Hard Feelings", icon: "😟", words: "afraid,angry,anxious,bored,nervous,sad,worried" },
  { parent: "Feelings", name: "Body Sensations", icon: "🤒", words: "hungry,hurt,sick,thirsty,tired" },

  // ---------------- Foods and drinks (into the Food shelf) ----------------
  {
    parent: F, name: "Breads", icon: "🥖",
    words: "bagel,baguette roll,bap,biscuit,bread,breadsticks,brioche,bun,buns,challah,croissant,croutons,crumpet,english muffin,focaccia,fried dough,malt loaf,matzah,muffin,naan,pastry,pita bread,pita,roll,rolls,roll-sandwich,scones,sourdough bread,toast,tortilla",
  },
  {
    parent: F, name: "Condiments, Spreads & Spices", icon: "🧂",
    words:
      "ketchup packet,mustard packet,mayonnaise packet,hot sauce packet,sugar packet,syrup packet,avocado dip,barbeque sauce,butter,cheese sauce,chocolate spread,cinnamon,cooking spray,corn flour,dip,dulce de leche,flour,food coloring,frosting,ginger,gravy,guacamole,honey,hot sauce,hummus,icing,jam,jelly,ketchup,marmalade,mayonnaise,milk caramel spread,mustard,natillas,oil and vinegar,oil,peanut butter,pepper,pesto sauce,pesto,pickle relish,pickle slices,pizza sauce," +
      "salad dressing,salsa,salt,sauce,soy sauce,spices,spread,sugar,sugar free,sweetener,syrup,tahini,tomato sauce,tzatziki,wasabi paste,whipped cream",
  },
  {
    parent: F, name: "Dairy & Eggs", icon: "🥚",
    words:
      "brie,camembert,cheese,cheese slice,cheese stick,chevre cheese,clotted cream,cottage cheese,cream cheese,cream,dairy,egg,egg on toast,feta cheese,fried egg,fromage,goat cheese,grated cheese,hardboiled egg,mini soft cheese,omelet,poached egg,roquefort cheese,scotch egg,scrambled eggs,squeeze yogurt,string cheese,yogurt",
  },
  {
    parent: F, name: "Drinks", icon: "🥤",
    words:
      "hot tea,babyccino,bottle,bottled water,cappuccino,chocolate milk,coffee,coffee beans,coffee-blended iced,iced coffee,coolade,cordial,drink,drinking fountain,drinks,energy drink,fizzy drink,flavored milk,fruit punch,green tea,ground coffee,horchata,hot chocolate,hot cocoa,ice,iced tea,juice,juice box,juice carton,latte,iced latte,lemonade,pink lemonade," +
      "milk,milkshake,mineral water,mint drink,pop,slush puppie,slushy drink,soda pop,soda,sparkling water,squash,tea,tea selection,water",
  },
  {
    parent: F, name: "Fruits, Vegetables & Nuts", icon: "🍎",
    words:
      "acorn,almonds,apple,apricot,artichoke,asparagus,avocado,banana,bean,beans,blackberry,blueberries,bramble,broccoli,brussels sprouts,cantaloupe,carrot,cashews,cauliflower,celery,cherry,chickpeas,chicory,coconut,corn,craisins,cranberries,cucumber,date,dried cranberries,dried fruit,dried mango,dried papaya,dried seaweed,eggplant,endive,fig,flavored kelp," +
      "fruit cocktail,fruit salad,baby fruit,fruits,garlic,gherkin,grapefruit,grapes,green beans,ground nuts,guava fruit,honeydew,jalapeno,kiwi,lemon,lentil,lentils,lettuce,macadamia nuts,mango,melon,mushrooms,mushy peas,nuts,olive,onion,orange,papaya,passion fruit,peach,peanuts,pear,peas,pecans,pickle,pineapple,pistachios,plum,pomegranate,potato," +
      "baked potato,jacket potato,produce,prunes,pumpkin,radish,raisins,raspberries,ratatouille,runner beans,salad bar,salad,greek salad,seaweed,shiitake mushroom,shredded lettuce,spinach,sprouts,strawberry,sultanas,sunflower seeds,sweet corn,sweet potato,tangerine,tinned fruit,tomato,vegetables,walnut,wasabi,watermelon,yam",
  },
  {
    parent: F, name: "Meats & Fish", icon: "🍗",
    words:
      "ahi tuna,beef burger,boneless,buffalo wings,calamari rings,calamari,cheese steak,cheeseburger,chicken,chicken nuggets,chicken strips,chicken tenders,chili dog,chop,corn dog,cuttlefish,fish and chips,fish fingers,fish sticks,broiled fish,grilled fish,fried chicken,gyro,hamburger,hamburger and gravy,hamburger patty,hot dog,lobster,lox,luncheon meat,lunchmeat,meat," +
      "meatballs,meatloaf,minced beef,mussels,octopus dumplings,oyster,pate,prawn,prawns,rissole,roast dinner,salmon flakes,salmon steak,sausage,sausages and mash,shrimp,sloppy joe,smoked salmon bagel,steak,sushi,tuna,turkey",
  },
  {
    parent: F, name: "Other", icon: "🍽️",
    words:
      "baked beans,banh mi sandwich,bean burger,beans and rice,canned beans,bento,box lunch,breakfast sandwich,breakfast,burrito,calzone,casserole,cassoulet,cereal,cereal bar,cheese crisps,cheesies,Chinese food,chips & salsa,chips,coleslaw,couscous,cracker,creamed potatoes,crepes,crisps,curly fries,dahl,dinner,dolmades,dried food,egg roll,egg sauce over rice," +
      "enchilada,falafel sandwich,falafel,fast food,filled baguette,filled roll,fish cracker,fish crackers,flapjacks,food,food pouch,baby food,french fries,french toast,fried rice,grilled cheese,hashbrowns,healthy bar,kid's meal,kimchi,lasagna,Japanese lunch,mac and cheese,macaroni cheese,mashed potatoes,menu,moussaka,mozzarella sticks,nachos,oatmeal," +
      "okonomiyaki,onion rings,pancake,pasta,pasta tubes,pastitsio,penne,pie,pierogi,pierogies,pizza,pocket food,popcorn cakes,popcorn,porridge,pot pie,potato omelet,roast potato,potato salad,potato wedges,pretzels,quesadilla,quiche,ravioli,rice,rice ball,rice cakes,rice cracker,curry rice,rigatoni,samosas,sandwich,sandwich wrap,sauerkraut," +
      "sausages beans and mash,savory rice seasoning,shish-kebab,snack mix,snack,souvlaki,spaghetti,Spanish omelette,spring roll,stuffed grape leaves,tabouli,taco salad,taco,take away order,takeaway,tapas,taquitos,tater tot,tempura,toad in the hole,toasted sandwich,tofu,tortellini,vegetarian,veggie sticks,vending machine,waffle fries,waffles,wontons,wrap",
  },
  { parent: F, name: "Soups", icon: "🍲", words: "chili,lentil soup,miso soup,noodle soup,Chinese noodles,cup noodles,soba noodles,udon noodles,soup,stew" },
  {
    parent: F, name: "Sweets", icon: "🍰",
    words:
      "chocolate chips,animal crackers,applesauce,astronaut ice cream,baklava,banana split,brownie,iced bun,sheet cake,cake,cake mix,creme filled cake,snack cake,candy,candy apple,candy cane,candy corn,candy floss,candy hearts,cheesecake,cherry pie,candy chips,chocolate,chocolate mousse,chocolate roll,chocolate swiss roll,chouquette,Christmas pudding,churros,cinnamon rolls,cone," +
      "cookie,slice and bake cookies,cotton candy,cream puffs,creme caramel,cupcake,custard,donut holes,donuts,doughnuts,fairy floss,flan,fortune cookie,frozen treats,fruit roll,fruit snack,fruit sweets,fruitcake,fun fruit,gelatin,gum,gummy candy,gummy sweets,heart sweets,ice cream,ice cream bar,ice cream cone,ice cream sandwich,soft serve ice cream," +
      "ice cream sundae,ice cream treat,ice lolly,jellybeans,krispy bars,licorice,lollies,lollipop,lolly,marshmallow candy,marshmallow,mince pie,mini candy,mini gelatin cup,mini sweets,mints,panettone,popsicle,profiteroles,pudding,puffs,pumpkin roll,sherbet,sorbet,spoon sweets,chocolate sprinkles,rainbow sprinkles,sweet buns,sweets,Swiss roll,tart," +
      "toaster pastry,toffee-apple,treacle toffee,Turkish delight,water ice,whoopie pie,Yorkshire pudding,yule log cake",
  },

  // ---------------- Health and medical ----------------
  {
    parent: "Health & Medical", name: "General", icon: "🩺",
    words:
      "ambulance,bandage,blood pressure,bug spray,cane,chemist,consultation,cough drop,cough syrup,cramps,dental tools,dentist chair,dentist office,dentist,doctor,drugstore,eye drops,fever,headache,hearing aid,hospital,hot water bottle,ice pack,I'm bleeding,inhale,inhaler,injection,inoculation,insect-repellent,It hurts,jab,medicine,menstruation,migraine," +
      "needle,nurse,ointment,otoscope,period,pharmacist,pharmacy,plaster,pregnant,puff,rubber gloves,scale,scales,shot,spacer,stethoscope,stomach ache,stretch band,surgical mask,therapy ball,thermometer,tummy ache,use inhaler,vitamins,walker,walking stick,weigh,wheelchair,x-ray",
  },

  // ---------------- Holidays and celebrations ----------------
  {
    parent: "Holidays & Celebrations", name: "General", icon: "🎉",
    words:
      "angel,award ribbon,award,balloons,birthday,candle,cards,carnival,Christmas cracker,Christmas decoration,Christmas tree,Christmas,clown,cornucopia,dance,decorated eggs,dreidel,Easter basket,Easter bunny,Easter eggs,Easter,elf,face painting,father's day,festival,fete,fireworks,flashing disco ball,ghost,gift,graduation,Halloween,Hanukkah,holiday," +
      "Independence Day,jack-o-lantern,Jingle Bells,Memorial Day,menorah,mother's day,my birthday is,Nativity,olympics,ornament,party hat,party,pilgrims,pinata,present,Presidents Day,Santa Claus,scarecrow,seder plate,shamrock,St. Patrick's Day,stocking,surprise,Thanksgiving,tinsel,Tio de Nadal,tooth fairy,trick or treat,trophy,vacation,Valentine," +
      "Valentine's Day,we three kings,wedding,win,witch,Yule log",
  },

  // ---------------- Home ----------------
  {
    parent: "Home", name: "General", icon: "🏠",
    words:
      "air freshener,aluminum foil,baking paper,baking tray,basket,bath,beaters,bed time,bed,bedroom,bidet,bin bags,bin,bird bath,biscuit cutter,blanket,blender,bookshelf,bowl,bread bin,bread box,broom,bucket,camp bed,can opener,can,cushion chair,reclining chair,rocking chair,cheese grater,chest of drawers,child's pen,chopping board,chopsticks,clean bathroom," +
      "cleaning cloth,cleaning fluid,cleaning spray,cleanser,clock,clothes line,clothes pin,coffee cup,coffee filter,coffee maker,coffee pot,colander,container,cook,cookie cutter,cookie sheet,cooking,cot,couch,cubby house,cup,curtain,cutlery,cutting board,deck-chair,den,dining room,dish drainer,dish rack,dish soap,dishpan,dishwasher soap,dishwasher,door," +
      "doorknob,drawer,dresser,driveway,dryer,dryer sheet,dummy,dust pan,dust,egg beater,electric kettle,electric mixer,empty bin,empty dishwasher,empty trash,espresso cup,espresso maker,fabric conditioner,fabric softener,family room,fan,fire place,fold clothes,fold,fork,freezer,fridge,funnel,garage,glass,grease proof paper,hammock,hand held vacuum,hob," +
      "home,hose,hosepipe,hot plate,hourglass,ice cream scoop,iron,ironing board,jar,jug,kettle,key chain,keys,kitchen towel,kitchen,knife,ladle,lamp,laundry basket,laundry detergent,letter box,lid,light,living room,load dishwasher,lounge,mailbox,measuring cups,measuring spoons,microwave,mini mop,mini oven-grill,mop,muffin pan,mug,napkin,night light," +
      "nut cracker,oven,oven glove,oven mitt,pacifier,paper bags,paper sacks,paper towels,parchment paper,photo album,pillow,pitcher,pizza cutter,placemat,plastic wrap,plate,play house,play pen,popcorn popper,pots and pans,recliner,recycle,refrigerator,rice cooker,rolling pin,sand timer,scoop,scrubbing brush,set table,sheets,silverware,sink,sipper cup," +
      "sofa,sort cutlery,sort laundry,sort silverware,sort washing,spatula,spill,splade,sponge,spoon,spork,spray bottle,spray cleaner,spray starch,squeegee,storage bags,storage room,storage shed,stove top,stove,straw,sweep,table,tablespoon,take out rubbish,take out trash,teapot,teaspoon,thermos,tin foil,tin opener,toaster oven,toaster,toilet brush,toilet," +
      "trainer cup,trash bags,trash can,travel mug,tray,tub,urinal,vacuum cleaner,vacuum,vegetable peeler,wash dishes,wash windows,washing line,washing machine,washing powder,washing up bowl,washing up liquid,water plants,watering can,wendy house,whisk,window,wipe table,wok",
  },

  // ---------------- Hygiene and personal care (into the Hygiene shelf) ----------------
  {
    parent: "Hygiene", name: "General", icon: "🧼",
    words:
      "baby wipes,barrettes,bathe,bathroom,blush,blusher,bobble,body wash,braid hair,brush,brush hair,brush teeth,bubble bath,change clothes,clean glasses,comb,compact,cotton balls,cotton swab,cotton wool,cream,creme,curling iron,dental floss,deodorant,dry hair,dry,electric razor,emery board,eye liner,eye shadow,face cloth,flannel,foam soap,gargle,grooming," +
      "hair band,hair clip,hair conditioner,hair dryer,hair elastic,hair gel,hair pick,hair spray,hair tie,hair tongs,haircut,hand cream,hand dryer,hand sanitizer,hand wipes,head massager,lip gloss,lipstick,loofah sponge,lotion,mascara,mirror,mouthwash,nail clippers,nail polish remover,nail polish,nail varnish,nose hair trimmer,perfume,plait hair,potty," +
      "powder,put on,razor,reflection,safety pin,sanitary napkin,sanitary towel,shampoo bubbles,shampoo,shave,shave creme,shower gel,shower,soap,sunscreen,take off,tampon,tissue,tissues,toilet paper,tongs,electric toothbrush,toothbrush,toothpaste,towel,tweezers,wash face,wash hair,wash hands,washcloth",
  },

  // ---------------- Money and finance ----------------
  {
    parent: "Money & Finance", name: "General", icon: "💰",
    words: "ATM,bank,buy,check book,cheque book,coupons,credit card,money,pay cheque,pay slip,pay,paycheck,piggy bank,receipt,shop,shopping",
  },

  // ---------------- Music (into the Music shelf) ----------------
  {
    parent: "Music", name: "General", icon: "🎵",
    words:
      "accordion,amplifier,autoharp,bagpipes,banjo,bass drum,bass guitar,bassoon,bell stick,bongos,bouzouki,bow,brushes,bugle,cajon,capo,castanets,cello,chimes,clarinet,conga,cymbals,didgeridoo,djembe,drum,drumsticks,electric guitar,flute,french horn,grand piano,guitar pick,guitar,hand bell,harmonica,harp,hi-hat,horn,horns,instruments,jingle bands,kazoo," +
      "mallets,mandolin,maracas,music,piano,play instruments,rainmaker,record player,recorder,rhythm stick,saxophone,shaker,sing,smile drum,song,tambourine,tom tom,trombone,trumpet,tuba,tuner,upright bass,vibraslap,vinyl record,violin,wave drum,xylophone",
  },

  // ---------------- Nature and outdoors ----------------
  {
    parent: "Nature & Outdoors", name: "General", icon: "🌳",
    words:
      "outdoor activity,Aquarius,Aries,autumn,beach,bridge,bush,cactus,camping,Cancer,Capricorn,Cassiopeia,Cepheus,cloud,cloudy,crescent moon,Cygnus,daytime,desert,dirt,Draco,Earth,fall,fence,flower,flower pot,foggy,forest,frozen pond,full moon,galaxy,garden,gardening,Gemini,grass,greenhouse,haystack,Hercules,icicle,island,jungle,Jupiter,lake,leaf,Leo,Libra," +
      "lightning,Mars,Mercury,mountain,Neptune,nighttime,ocean,Orion,outback,palm tree,park,pebbles,Pegasus,pine cone,pine tree,Pisces,planets,plants,pond,rain forest,rainy,river,rocks,Sagittarius,Saturn,Scorpio,sea,seashells,season is,seasons,seeds,snowball,snowflake,snowing,snowman,space,spring,stars,stormy,summer,sun,sunflower,sunny,swamp," +
      "Taurus,temperature,tree branch,tree,Uranus,Ursa Major,Ursa Minor,Venus,Virgo,volcano,waterfall,waves,weather is,windmill,windy,winter,woods",
  },

  // ---------------- Office ----------------
  {
    parent: "Office", name: "General", icon: "🗂️",
    words:
      "3-ring binder,book,bulletin board,catalog,clipboard,deliver mail,document file,dry erase board,dry wipe board,easel,envelopes,eraser,felt tip pens,felt tips,file,folder,folding file,globe,glue stick,glue,guillotine,highlighter,hole punch,ID card,ink pad,label,letter,list,magazine,magnifying glass,manila folder,map,markers,meeting room,newtons cradle," +
      "newspaper,notebook,office,office chair,paper,paper clamp,paper clips,paper cutter,pencil sharpener,pencil,pens,photo,reception,receptionist,rubber band,ruler,shred paper,sign-in sheet,sort mail,sort post,staff room,stamp,staple remover,stapler,staples,sticky note,stuff envelopes,tape,tape roll,telephone book,thumbtack,white board",
  },

  // ---------------- Other (into the Things shelf) ----------------
  {
    parent: "Other", name: "General", icon: "📦",
    words:
      "beach chair,beach towel,category,cheers,communication book,elevator,emoji,entrance,escalator,exit,fire hydrant,fireman's pole,flag,Australian flag,Brazilian flag,Canadian flag,Chinese flag,French flag,German flag,Greek flag,Italian flag,Japanese flag,Polish flag,Portuguese flag,Romanian flag,South Korean flag,Spanish flag,UK flag,US flag,Saudi flag," +
      "handshake,hot tub,jacuzzi,jobs,lift,net swing,paper towel dispenser,picnic,picture exchange,sand castle,schedule,selfie,shadow,shopping basket,shopping cart,spa,stairs,tattoo,ticket,time,timetable,tokens,tube,beach umbrella",
  },

  // ---------------- People and characters (into the People shelf) ----------------
  {
    parent: "People", name: "General", icon: "🧑",
    words:
      "alien,astronaut,baby,baker,ballerina,barber,boy,boy scout,boy scouts,brother,Brownies,buddies,butcher,cashier,cheerleader,children,clerk,conductor,cowboy,dad,daughter,dinner lady,dinner person,fairy,family,farmer,father,fire fighter,fireman,friends,girl,girl guide,girl scouts,grand dad,grandad,grandfather,grandma,grandmother,grandpa,grandparents,group," +
      "guides,hair stylist,king,knight,librarian,mail carrier,man,manager,men's,mermaid,mommy,monster,mother,mom,nana,Native American,old lady,old man,pa,parents,pilot,Pinocchio,pirate,police man,police officer,police woman,prince,princess,queen,robot,rolling robot,sailor,scout,scouts,server,shop assistant,sister,son,space hero,super hero,teacher," +
      "train conductor,twins,vampire,waiter,waitress,woman,women's,worker,zombie",
  },

  // ---------------- Places (into the Places shelf) ----------------
  {
    parent: "Places", name: "General", icon: "📍",
    words:
      "accessible toilet,Africa plains,airport,amusement park,aquarium,bakery,bank,barber shop,bear country,book store,butcher shop,cafe,carnival,castle,cemetery,changing room,children's farm,children's zoo,church,circus,city,coffee shop,community,convenience store,corridor,den,dentist office,desert,drive through,factory,fair,farm,female toilet,fire station,funfair," +
      "Gurdwara,hair salon,hotel,ice skating rink,igloo,kinder,kindergarten,library,lighthouse,locker room,locker,main hall,male toilet,mall,market,mobile home,Monkey Junction,mosque,movie,museum,nursery,office,plant room,playground,post office,preschool,reception,restaurant,savannah,school,sensory room,shops,shrine,staff room,store,street market," +
      "supermarket,swimming pool,synagogue,temple,tennis court,train station,woods,zoo",
  },

  // ---------------- School (into the Schools shelf) ----------------
  {
    parent: "Schools", name: "General", icon: "🏫",
    words:
      "activity schedule,art,assembly,beads,counting bears,blocks,board rubber,bolster,bulletin board,cafeteria,centers,chair,chalkboard,circle,class,clay,colored pencils,crafts,crayons,cubby,cupboard,desk,dramatic play,drill,earthquake drill,fire alarm,fire drill,flash cards,folder work,geography,glitter,gross motor game,gross motor,gym,jungle gym,learn,library card," +
      "literacy,lock-down drill,lunch,lunchbox,mainstream,mat,math,meeting,monkey bars,monkey rings,morning circle,music class,notes,OT,paint,PE,peanut ball,peg,pencil case,picture,play area,pointers,PT,queue,quiet time,reading,recess,rice table,school bag,school shop,school store,science,scissors,see saw,sensory table,show and tell,slide,soft play room," +
      "speech,spelling,springer,story time,swing,tornado drill,tunnel,worksheet",
  },

  // ---------------- Sentence starters, phrases and questions ----------------
  {
    parent: "Sentence Starters & Phrases", name: "General", icon: "💬",
    words:
      "Look!,and,answer,break,bye-bye,Can I have,charge my device,choose,come here,equals,give,Good afternoon,Good morning,Good night,goodbye,hello,Hi,How much,I am going,I am,I caught,I don't know,I don't like,I don't understand,I don't want,I drank,I feel,I have,I hear,I like to,I like,I need a break,I need help,I sat with,I see,I smell,I Spy,I think," +
      "I want to leave,I went to,I'll be back,I'll return,I'll see you later,I'm done,I'm finished,-ing,it looked like,it looks like,it's all gone,it's not,it's,leave me alone,let's read,let's sing,let's watch,look,May I have,my address is,my favorite,my name is,my telephone number is,my turn,picture exchange,plus,quiet-shh,take a photo of me,temperature is," +
      "thank you,thanks,that is,this is,thumbs down,thumbs up,wait,what color,what shape,what size,what,when,where,which color,which shape,which size,who,worse,you,your turn,yuck,yum",
  },

  // ---------------- Songs and stories ----------------
  {
    parent: "Songs & Stories", name: "General", icon: "🎵",
    words:
      "Ring Around the Rosie,3 Blind Mice,3 kings,3 little pigs,3 wise men,5 Little Bears,5 Little Ducks,5 Monkeys on the Bed,ants go marching,Baa Baa Black Sheep,Baby Beluga,Bells Over Bethlehem,Bingo,Chicken Dance,Chicken Little,Crocodile Says,dairy cow song,Duck Duck Goose,elephant song,Frere Jacques,frog song,Frosty the Snowman,Giddy Up Donkey,Gingerbread Man,Going on a Picnic," +
      "Goldilocks and the 3 Bears,Green and Speckled Frogs,Hansel and Gretel,Head Shoulders Knees and Toes,Hey Diddle Diddle,Hickory Dickory,Hokey Cokey,Hokey Pokey,Humpty Dumpty,I Have a Doll,If You're Happy,I'm a Little Teapot,Incey Wincey Spider,Itsy Bitsy Spider,Jack and the Beanstalk,Jack and Jill,Johnny Works,Little Palms,Little Red Riding Hood," +
      "London Bridge,Mary Had a Little Lamb,Miller You're Sleeping,musical chairs,Old McDonald,Open and Shut Them,Pat a Cake,peek-a-boo,Pippin Apple song,Ring a Roses,round and round the garden,Row Your Boat,spilt milk,Teddy Bear Song,The Green Mouse,This Little Piggy,Tommy Thumb,Tortoise and Hare,Turn Turn Small Mill,Twinkle Twinkle,Wheels on the Bus," +
      "Where is Thumbkin,You Are My Sunshine",
  },

  // ---------------- Sports and fitness (into the Sports shelf) ----------------
  {
    parent: "Sports", name: "General", icon: "⚽",
    words:
      "air hockey,airplane pose,arrow,Australian Football,backhand,badminton,balance beam,ball,balls,baseball diamond,baseball,basketball hoop,basketball,beach paddles,bear walk,bicycle crunches,bicycle pump,body board,boogie board,boomerang,bow and arrow,bowling ball,bowling pins,bowling,butterfly stroke,butterfly stretch,canoe,carabiner,checkers game,checkers," +
      "chin ups,cone,cones,crab walk,cricket ball,cricket bat,crunch,cycling,dart board,darts game,darts,downward dog pose,dragon pose,draughts game,draughts pieces,dribble,exercise bike,exercise,face mask,figure skates,final cheer,fish hook,fishing pole,fishing,fitness tracker,flippers,floaties,foosball,football,football net,footy,forehand,freestyle," +
      "frisbee,frog pose,gallop,goalpost,golf ball,golf club,golf tee,golf,groin stretch,group warm-up,gymnastics,harness,hike,hit ball over net,hitting balls,hockey goal,hockey puck,hockey skates,hockey stick,hockey,hoop,hoopla,hop ball,horseshoes,ice skates,ice skating,inflatable ring,jet ski,jump rope,jumping jacks,karate,kayak,kickboard,leg extension," +
      "life jacket,lift weights,obstacle course,overhead arm stretch,parachute,ping pong,plank pose,pool ball,pool billiards,pool cue,punch ball,push up,racket,reverse warrior pose,ride bikes,ring toss,rings,rock climbing,roller blades,roller skate,rope net,rubber ring,rugby ball,run in place,running,scooter,score basket,score soccer,seated toe stretch,serve," +
      "side bend,side leg lift,sit-up,skateboard,skateboarding,skee ball,ski boots,ski poles,ski,skipping rope,skis,sled,sledding,sleeping bag,snake crawl,snake pose,snorkel,snowboard,soccer ball,soccer net,soccer,softball,sports,squat,standing side leg lift,step exercise,straight leg stretch,surf,surfboard,swim float,swim noodle,swim ring,swimming goggles," +
      "Tae Kwon Do,T-Ball,tennis ball,tennis court,tent,three legged dog pose,touchdown,trampoline,treadmill,tubing,volleyball,walk,water ski,water wings,weight lifting,wheelbarrow walk,whistle,wrestle,yoga mat,yoga",
  },

  // ---------------- Tools and supplies ----------------
  {
    parent: "Tools & Supplies", name: "General", icon: "🧰",
    words:
      "barrel,bolts,box,bubble wrap,candle,canteen,compass,cotton,crate,fire extinguisher,flashlight,flat-head screwdriver,grate,hammer,knitting needles,ladder,lawnmower,light bulb,lighter,mag mag,magnet,mallet,matches,measuring tape,nails,needle,nuts,paintbrush,Phillips head screwdriver,pliers,pocket knife,rake,ribbon,rope,saw,screwdriver,screws,shovel," +
      "spade,spanner,sprinkler,step ladder,string,tape measure,thermometer,thread,timer,tool box,tools,torch,wheelbarrow,wool,wrench,yarn",
  },

  // ---------------- Toys and leisure (into the Things shelf) ----------------
  {
    parent: "Toys & Leisure", name: "General", icon: "🧸",
    words:
      "bath toys,3D glasses,action toy,activity cube,activity table,ball popper,ball bath,bumpy ball,beach ball,bean bag toss,bean bag,beanbag chair,bendy toy,big wheel,bingo game,board games,bounce horse,bouncy ball,bracelet loom,bricks,bubble machine,bubble tower,bubble wall,bubbles,bucket and shovel,bucket and spade,buggy,buzz toys,carousel,cartoons,caterpillar toy," +
      "sidewalk chalk,chewy tube,chinese yo-yo,clatterpillar,coil toy,color game,comic book,diablo,dice,doll,doll house,domino,draw toy,dress up,DVD,echo mic,expanding ball,eyeball toy,ferris wheel,figure toys,finger puppet,finger trap,fun foam,fun snaps,games,gear toy,gears,giggle pen,giggle sticks,glitter cone,glitter wand,glow ball,gravity tube," +
      "gyroscope,hammer toy,hand clapper,jacks,jewelry box,kaleidoscope,kiddie pool,kite,klacker,koosh,laser fan,laser spin disk,laser sword,LaserTop,lava lamp,leisure,light bright,light pendant,light spinner,light sword,light torch,light toy,light up toy,little people,magnetic tiles,magnetic wand,marble ring,marble run,marbles,merry-go-round,multi-sided dice," +
      "nesting dolls,newton's cradle,noisy book,number puzzle,octopus toy,paddle ball,pail and shovel,pin toy,pinwheel,play clay,play foam,play people,playing cards,poker chips,pom poms,pony doll,pool,pool toys,pop beads,pop tubes,pop up toy,popper,potato toy,pull toy,puppet,push toy,puzzle cube,puzzle piece,puzzle,race track,rec-leisure,Reversi game," +
      "ride-on toy,rocking horse,rollercoaster,roundabout,rubber band loom,rubber duck,sand pit,sand play,sand table,sand tray,sandbox,see and talk toy,shield,sit and spin,sit on spinner,slime,snap blocks,snap bricks,spaghetti toy,sparking spinner,spin toy,fidget spinner,spinner,spinner tube,spinning ball,spinning light,spinning top,spring pen,squishy pyramid," +
      "squishy toys,stacking ring,stick toys,stickers,sticky slinker,story book,stretchy string,string toys,stroller,stuffed animals,stuffed toys,swirlsticks,sword,tangle toy,tea set,tech top,top,tornado bottle,tornado tube,tower toy,toy box,toy cars,toys,train,train track,tri ball spinner,tricycle,turtles,twist game,video game,viewer disk,viewer,wading pool," +
      "wagon,wand,water balloon,water snake,water toy,watertable,wheel toy,whoopee cushion,wiggle pen,wind up toy,yo yo",
  },

  // ---------------- Transportation and travel ----------------
  {
    parent: "Transportation & Travel", name: "Vehicles", icon: "🚗",
    words:
      "18-wheeler truck,airplane,ambulance,ATV,balancing scooter,bicycle,big wheel,boat,bus,caboose,canoe,car,concrete mixer truck,crane,dump truck,dumper truck,dust cart,excavator,ferry boat,fire engine,fire truck,formula one car,helicopter,hot air balloon,ice cream truck,jet fighter,jet,monorail,moped,motor scooter,motorcycle,motorized scooter,pickup truck," +
      "police car,public bus,quad bike,racecar,racing car,rocket,scooter,ship,snowmobile,space shuttle,submarine,subway,SUV,taxi,tractor,train,train car,train engine,bullet train,high speed train,tram,trash truck,trolley,underground,van,vehicles,tractor wagon",
  },
  {
    parent: "Transportation & Travel", name: "Other", icon: "🧳",
    words:
      "arrive,booster car seat,booster seat,bus pass,bus shelter,bus stop,bus ticket,car horn,car seat,conductor,depart,drive,drive-thru,highway,hooter,motorway,passport,ride in bus,ride in car,ride in plane,seatbelt,street sign,siren,stop,suitcase,train track,travel card,tunnel,tyre,wheel",
  },

];

/**
 * The PECS "Verbs" list. A verb the app can conjugate (also "brush teeth", "wash hands") goes into
 * Verbs / Verbs A–Z with its 5 forms; the rest ("back rub", "high five") into Verbs / Other.
 */
export const PECS_VERBS =
  "back rub,back stroke,backhand,bathe,bend,bite,blow bubbles,blow nose,blow,bounce on ball,bounce,braid hair,breast stroke,bring,brush,brush hair,brush teeth,brushing,build,burp,buy,carry,cash out,catch,change clothes,change temperature,chase,choose,chop,chopped,clap hands,clean bathroom,clean,click,climb,close,close container,close door," +
  "collate,color,cook,cooking,count,crack nuts,crash,crawl,cry,cut,cut grass,cycling,dance,deliver mail,deliver message,dig,dive,do,draw,dream,dress,dribble,drill,drink,drive,drop,dry hair,dry,dust,eat,empty bin,empty dishwasher,empty trash,exercise,face painting,feed,feed birds,feed ducks,feed fish,feed pet,feel," +
  "feet on floor,file,fingerpaint,fishing,float on back,flush toilet,fold clothes,fold,food prep,play frisbee,frog kick,gallop,gardening,gargle,get down,get dressed,get off,get up,giggle,go downstairs,go upstairs,go,haircut,hands in lap,hands to yourself,head massage,hide and seek,hide,high five,hike,hit ball over net,hit,hitting balls,hold hands,hop,hose,hug,ice skating,image search,inhale,internet search,iron,jump,jump in pool," +
  "kick,kick water,kiss,knit,knock,laminate,laugh,learn,lick,lift weights,line up,listen,listening,load dishwasher,look out window,meditate,mow lawn,open,open container,open door,paint,party,pat,pay,peel,pick up,picnic,piggyback,pinch,play,play instruments,point,pop,pour,pray,puff,pull,push button,push,put down,put face in water,put on,queue,raise arms,raise hand," +
  "rake,read,recycle,ride bikes,ride camel,ride horse,ride in bus,ride in car,ride in plane,ride pony,ride,roll over,roll,roller skate,rub,run in place,run,running,scratch,scream,send,serve,set table,sew,shake hands,shake,shave,shop,shopping,show and tell,show,shred paper,sing,sit on lap,sit,skateboarding,ski,skip,sledding,sledging,sleep,sliced,smile,snap,snap-unsnap,sneeze,snowboard,sort cutlery," +
  "sort laundry,sort mail,sort post,sort silverware,sort washing,sorting,spill,spin,splash,spray starch,spread,squeeze hand,squeeze head,squeeze,squish with beanbag,stamp feet,stand in circle,stand up,stand,stir,stock shelves,stomp feet,stop,stretch,stuff envelopes,suck,surf,surprise,swallow,sweep,swim,swing,swing in blanket,take off,take out rubbish,take out trash,talk,tantrum,tear,tell,think,throw snowball,throw,tickle,tie,tie shoe," +
  "touch toes,touch,trade in,tubing,turn ceiling fan off,turn ceiling fan on,turn,twirl,unwrap,unzip,up,use inhaler,vacuum,video search,wait,wake up,walk,walk the dog,wash dishes,wash face,wash hair,wash hands,wash windows,washing up bowl,watch,water plants,water play,water ski,wave,weigh,whisper,win,wipe table,work,wrap,wrestle,write,writing,yawn,zip";

// ---------------- cleaning ----------------

const SPELLING: Record<string, string> = {
  colour: "color", colours: "colors", coloured: "colored", grey: "gray", yoghurt: "yogurt", pyjamas: "pajamas",
  flavoured: "flavored", aluminium: "aluminum", catalogue: "catalog", centres: "centers", maths: "math",
  "hand sanitiser": "hand sanitizer", "food colouring": "food coloring", omelette: "omelet", houmous: "hummus",
  "soya sauce": "soy sauce", liquorice: "licorice", nappy: "diaper", racoon: "raccoon", "what colour": "what color",
  "which colour": "which color", digeridoo: "didgeridoo", kaleidescope: "kaleidoscope", mum: "mom", woodlice: "woodlouse",
};
/** Not for this app: alcohol and pork. */
const LEFT_OUT = new Set([
  "beer", "wine", "champagne", "wine stopper", "corkscrew", "bacon", "ham", "pepperoni", "prosciutto", "chorizo",
  "pigs in a blanket", "pork cutlet", "pork schnitzel", "pork and bean casserole", "pork and beans",
]);

export function cleanPecsWord(raw: string, keepNumbers = false): string | null {
  let w = raw.trim().replace(/-US$/i, "").replace(/\s*\([^)]*\)\s*/g, " ").replace(/\s+/g, " ").trim();
  if (!keepNumbers) w = w.replace(/\s*\d+$/, "").trim(); // "bird 2" -> "bird", "under1" -> "under"
  if (!w) return null;
  const lower = w.toLowerCase();
  if (LEFT_OUT.has(lower)) return null;
  return SPELLING[lower] ?? w;
}

export const capFirst = (w: string) => (/^[a-z]/.test(w) ? w.charAt(0).toUpperCase() + w.slice(1) : w);
