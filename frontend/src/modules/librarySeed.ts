/**
 * Curated starter word list for the picture library.
 *
 * We do NOT ship 5,000 image files inside the app (that would be 100+ MB and
 * bloat the download). Instead the library is seeded from this curated list of
 * common education / daily-life words: on first run each word is fetched once
 * from the free ARASAAC pictogram set (white-background symbols) and saved
 * locally, so from then on the picture comes from the library — instant and
 * offline. The list is easy to extend toward thousands of words over time.
 */

export const SEED_WORDS: string[] = [
  // people & family
  "boy", "girl", "man", "woman", "baby", "mother", "father", "brother", "sister",
  "grandmother", "grandfather", "teacher", "doctor", "nurse", "friend", "family",
  // body
  "head", "hair", "eye", "ear", "nose", "mouth", "tooth", "tongue", "hand", "finger",
  "arm", "leg", "foot", "knee", "stomach", "heart", "face",
  // feelings / needs
  "happy", "sad", "angry", "scared", "tired", "sick", "hungry", "thirsty", "hurt",
  "hot", "cold", "help", "more", "stop", "go", "yes", "no", "please", "thank you",
  // animals
  "cat", "dog", "bird", "fish", "rabbit", "horse", "cow", "sheep", "pig", "duck",
  "chicken", "lion", "tiger", "elephant", "monkey", "bear", "frog", "snake", "spider",
  "bee", "butterfly", "ant", "turtle", "dolphin", "whale", "shark", "penguin", "owl",
  "mouse", "goat", "deer", "fox", "wolf", "giraffe", "zebra", "kangaroo",
  // food & drink
  "apple", "banana", "orange", "grape", "strawberry", "watermelon", "lemon", "peach",
  "bread", "milk", "water", "juice", "egg", "cheese", "rice", "pasta", "pizza",
  "sandwich", "soup", "salad", "chicken meat", "fish food", "carrot", "potato",
  "tomato", "onion", "corn", "peas", "cookie", "cake", "ice cream", "chocolate",
  "candy", "honey", "butter", "sugar", "salt", "tea", "coffee",
  // home & objects
  "house", "door", "window", "wall", "roof", "floor", "stairs", "key", "table",
  "chair", "bed", "sofa", "lamp", "clock", "mirror", "shelf", "cup", "glass",
  "plate", "bowl", "spoon", "fork", "knife", "pot", "pan", "bottle", "box", "bag",
  "book", "pen", "pencil", "paper", "scissors", "glue", "crayon", "ruler",
  "phone", "computer", "television", "radio", "camera", "toothbrush", "soap",
  "towel", "brush", "comb", "blanket", "pillow", "umbrella", "basket", "broom",
  // clothes
  "shirt", "trousers", "dress", "skirt", "jacket", "coat", "sweater", "socks",
  "shoes", "boots", "hat", "cap", "gloves", "scarf", "belt", "glasses", "pajamas",
  // vehicles & travel
  "car", "bus", "train", "bicycle", "motorcycle", "truck", "airplane", "boat",
  "ship", "helicopter", "rocket", "ambulance", "fire truck", "police car",
  "tractor", "wheel", "road", "bridge", "traffic light",
  // nature & weather
  "sun", "moon", "star", "cloud", "rain", "snow", "wind", "rainbow", "lightning",
  "sky", "tree", "flower", "grass", "leaf", "plant", "seed", "root", "forest",
  "mountain", "hill", "river", "lake", "sea", "ocean", "beach", "sand", "rock",
  "stone", "fire", "ice", "island", "desert", "waterfall",
  // school & places
  "school", "classroom", "playground", "park", "hospital", "shop", "market",
  "library", "zoo", "farm", "garden", "kitchen", "bathroom", "bedroom",
  "restaurant", "airport", "station", "church", "museum", "bank", "post office",
  // science / education
  "planet", "earth", "space", "magnet", "battery", "microscope", "telescope",
  "thermometer", "map", "globe", "skeleton", "volcano", "dinosaur", "atom",
  "electricity", "energy", "light", "shadow", "sound", "water cycle",
  // toys & play
  "ball", "doll", "teddy bear", "blocks", "puzzle", "kite", "balloon", "drum",
  "guitar", "piano", "bell", "whistle", "swing", "slide", "bicycle toy",
  // actions (verbs children use)
  "eat", "drink", "sleep", "run", "walk", "jump", "sit", "stand", "play", "read",
  "write", "draw", "sing", "dance", "wash", "brush teeth", "open", "close",
  "push", "pull", "give", "take", "look", "listen", "talk", "cry", "laugh",
  "hug", "clap", "throw", "catch", "climb", "swim", "cook", "clean", "paint",
  // shapes & colours (for combining)
  "circle", "square", "triangle", "star shape", "heart", "rectangle",
  "red", "blue", "green", "yellow", "orange colour", "purple", "pink", "brown",
  "black", "white", "grey",
  // numbers / time
  "one", "two", "three", "four", "five", "clock time", "day", "night", "morning",
  "calendar", "birthday",
  // Islamic education (respectful: places, objects and acts of worship only —
  // never any depiction of Prophets or sacred figures)
  "mosque", "minaret", "prayer mat", "prayer beads", "Koran", "crescent moon",
  "star", "lantern", "pray", "praying", "kneel", "wash hands", "fasting",
  "dates", "moon", "charity", "gift", "family", "book",
];

/** De-duplicated, lower-cased seed list. */
export const SEED_LIST = [...new Set(SEED_WORDS.map((w) => w.toLowerCase().trim()))];
