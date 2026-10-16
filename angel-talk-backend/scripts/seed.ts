import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { env } from "../src/config/env";
import { User } from "../src/models/User";
import { Child } from "../src/models/Child";
import { Shelf } from "../src/models/Shelf";
import { Word } from "../src/models/Word";
import { VerbGroup } from "../src/models/VerbGroup";
import { ScheduleTask } from "../src/models/ScheduleTask";
import { Passcard } from "../src/models/Passcard";
import { UsageSummary } from "../src/models/UsageSummary";

// ==========================================
// 1. ALL 25+ 5-FORM VERB GROUPS (EN, UR, AR)
// ==========================================
const ALL_VERBS = [
  {
    base: "eat",
    emoji: "🍎",
    pictogramId: "eat_ara",
    forms: {
      first: { text: "Eat", translations: { "ar-SA": "يأكل", "ur-PK": "کھانا" } },
      s_es: { text: "Eats", translations: { "ar-SA": "يأكل", "ur-PK": "کھاتا ہے" } },
      second: { text: "Ate", translations: { "ar-SA": "أكل", "ur-PK": "کھایا" } },
      third: { text: "Eaten", translations: { "ar-SA": "مأكول", "ur-PK": "کھا چکا" } },
      fourth: { text: "Eating", translations: { "ar-SA": "يأكل الآن", "ur-PK": "کھا رہا ہے" } },
    },
  },
  {
    base: "drink",
    emoji: "💧",
    pictogramId: "drink_ara",
    forms: {
      first: { text: "Drink", translations: { "ar-SA": "يشرب", "ur-PK": "پینا" } },
      s_es: { text: "Drinks", translations: { "ar-SA": "يشرب", "ur-PK": "پیتا ہے" } },
      second: { text: "Drank", translations: { "ar-SA": "شرب", "ur-PK": "پیا" } },
      third: { text: "Drunk", translations: { "ar-SA": "مشروب", "ur-PK": "پی چکا" } },
      fourth: { text: "Drinking", translations: { "ar-SA": "يشرب الآن", "ur-PK": "پی رہا ہے" } },
    },
  },
  {
    base: "play",
    emoji: "⚽",
    pictogramId: "play_ara",
    forms: {
      first: { text: "Play", translations: { "ar-SA": "يلعب", "ur-PK": "کھیلنا" } },
      s_es: { text: "Plays", translations: { "ar-SA": "يلعب", "ur-PK": "کھیلتا ہے" } },
      second: { text: "Played", translations: { "ar-SA": "لعب", "ur-PK": "کھیلا" } },
      third: { text: "Played", translations: { "ar-SA": "لعب", "ur-PK": "کھیل چکا" } },
      fourth: { text: "Playing", translations: { "ar-SA": "يلعب الآن", "ur-PK": "کھیل رہا ہے" } },
    },
  },
  {
    base: "go",
    emoji: "🚶",
    pictogramId: "go_ara",
    forms: {
      first: { text: "Go", translations: { "ar-SA": "يذهب", "ur-PK": "جانا" } },
      s_es: { text: "Goes", translations: { "ar-SA": "يذهب", "ur-PK": "جاتا ہے" } },
      second: { text: "Went", translations: { "ar-SA": "ذهب", "ur-PK": "گیا" } },
      third: { text: "Gone", translations: { "ar-SA": "ذهب", "ur-PK": "جا چکا" } },
      fourth: { text: "Going", translations: { "ar-SA": "يذهب الآن", "ur-PK": "جا رہا ہے" } },
    },
  },
  {
    base: "sleep",
    emoji: "😴",
    pictogramId: "sleep_ara",
    forms: {
      first: { text: "Sleep", translations: { "ar-SA": "ينام", "ur-PK": "سونا" } },
      s_es: { text: "Sleeps", translations: { "ar-SA": "ينام", "ur-PK": "سوتا ہے" } },
      second: { text: "Slept", translations: { "ar-SA": "نام", "ur-PK": "سویا" } },
      third: { text: "Slept", translations: { "ar-SA": "نام", "ur-PK": "سو چکا" } },
      fourth: { text: "Sleeping", translations: { "ar-SA": "نائم الآن", "ur-PK": "سو رہا ہے" } },
    },
  },
  {
    base: "want",
    emoji: "🤲",
    pictogramId: "want_ara",
    forms: {
      first: { text: "Want", translations: { "ar-SA": "أريد", "ur-PK": "چاہنا" } },
      s_es: { text: "Wants", translations: { "ar-SA": "يريد", "ur-PK": "چاہتا ہے" } },
      second: { text: "Wanted", translations: { "ar-SA": "أراد", "ur-PK": "چاہا" } },
      third: { text: "Wanted", translations: { "ar-SA": "مطلوب", "ur-PK": "چاہ چکا" } },
      fourth: { text: "Wanting", translations: { "ar-SA": "يريد", "ur-PK": "چاہ رہا ہے" } },
    },
  },
  {
    base: "help",
    emoji: "🆘",
    pictogramId: "help_ara",
    forms: {
      first: { text: "Help", translations: { "ar-SA": "يساعد", "ur-PK": "مدد کرنا" } },
      s_es: { text: "Helps", translations: { "ar-SA": "يساعد", "ur-PK": "مدد کرتا ہے" } },
      second: { text: "Helped", translations: { "ar-SA": "ساعد", "ur-PK": "مدد کی" } },
      third: { text: "Helped", translations: { "ar-SA": "ساعد", "ur-PK": "مدد کر چکا" } },
      fourth: { text: "Helping", translations: { "ar-SA": "يساعد الآن", "ur-PK": "مدد کر رہا ہے" } },
    },
  },
  {
    base: "stop",
    emoji: "🛑",
    pictogramId: "stop_ara",
    forms: {
      first: { text: "Stop", translations: { "ar-SA": "توقف", "ur-PK": "رکنا" } },
      s_es: { text: "Stops", translations: { "ar-SA": "يتوقف", "ur-PK": "رکتا ہے" } },
      second: { text: "Stopped", translations: { "ar-SA": "توقف", "ur-PK": "رکا" } },
      third: { text: "Stopped", translations: { "ar-SA": "متوقف", "ur-PK": "رک چکا" } },
      fourth: { text: "Stopping", translations: { "ar-SA": "يتوقف الآن", "ur-PK": "رک رہا ہے" } },
    },
  },
  {
    base: "like",
    emoji: "👍",
    pictogramId: "like_ara",
    forms: {
      first: { text: "Like", translations: { "ar-SA": "يعجبني", "ur-PK": "پسند کرنا" } },
      s_es: { text: "Likes", translations: { "ar-SA": "يعجبه", "ur-PK": "پسند کرتا ہے" } },
      second: { text: "Liked", translations: { "ar-SA": "أعجبني", "ur-PK": "پسند کیا" } },
      third: { text: "Liked", translations: { "ar-SA": "أعجب", "ur-PK": "پسند کر چکا" } },
      fourth: { text: "Liking", translations: { "ar-SA": "يعجبني", "ur-PK": "پسند کر رہا ہے" } },
    },
  },
  {
    base: "look",
    emoji: "👀",
    pictogramId: "look_ara",
    forms: {
      first: { text: "Look", translations: { "ar-SA": "انظر", "ur-PK": "دیکھو" } },
      s_es: { text: "Looks", translations: { "ar-SA": "ينظر", "ur-PK": "دیکھتا ہے" } },
      second: { text: "Looked", translations: { "ar-SA": "نظر", "ur-PK": "دیکھا" } },
      third: { text: "Looked", translations: { "ar-SA": "منظور", "ur-PK": "دیکھ چکا" } },
      fourth: { text: "Looking", translations: { "ar-SA": "ينظر الآن", "ur-PK": "دیکھ رہا ہے" } },
    },
  },
  {
    base: "open",
    emoji: "🔓",
    pictogramId: "open_ara",
    forms: {
      first: { text: "Open", translations: { "ar-SA": "يفتح", "ur-PK": "کھولنا" } },
      s_es: { text: "Opens", translations: { "ar-SA": "يفتح", "ur-PK": "کھولتا ہے" } },
      second: { text: "Opened", translations: { "ar-SA": "فتح", "ur-PK": "کھولا" } },
      third: { text: "Opened", translations: { "ar-SA": "مفتوح", "ur-PK": "کھول چکا" } },
      fourth: { text: "Opening", translations: { "ar-SA": "يفتح الآن", "ur-PK": "کھول رہا ہے" } },
    },
  },
  {
    base: "close",
    emoji: "🔒",
    pictogramId: "close_ara",
    forms: {
      first: { text: "Close", translations: { "ar-SA": "يغلق", "ur-PK": "بند کرنا" } },
      s_es: { text: "Closes", translations: { "ar-SA": "يغلق", "ur-PK": "بند کرتا ہے" } },
      second: { text: "Closed", translations: { "ar-SA": "أغلق", "ur-PK": "بند کیا" } },
      third: { text: "Closed", translations: { "ar-SA": "مغلق", "ur-PK": "بند کر چکا" } },
      fourth: { text: "Closing", translations: { "ar-SA": "يغلق الآن", "ur-PK": "بند کر رہا ہے" } },
    },
  },
];

// ==========================================
// 2. ALL 8 BUILT-IN SOCIAL STORIES (FULL TEXT & PAGES)
// ==========================================
const ALL_STORIES = [
  {
    title: "Going to the Dentist",
    category: "health",
    icon: "🦷",
    description: "What happens when we visit the dental clinic and keep our teeth sparkling clean.",
    pages: [
      { text: "Today I am going to visit the dentist. The dentist is a friendly doctor who counts and cleans my teeth.", emoji: "🦷" },
      { text: "When we arrive, I sit in a special big chair that can move up and down. It feels like a magic ride!", emoji: "💺" },
      { text: "The dentist wears a mask and gloves to keep everything safe and germ-free. They smile with their eyes.", emoji: "😷" },
      { text: "I open my mouth wide like a happy lion! The dentist uses a tiny mirror to look at all my teeth.", emoji: "🦁" },
      { text: "They use a soft electric brush that tickles my teeth with yummy mint toothpaste.", emoji: "🪥" },
      { text: "All done! I rinse with water and spit it out. My teeth are clean and shiny, and I get a reward sticker!", emoji: "⭐" },
    ],
  },
  {
    title: "Getting a Haircut",
    category: "routine",
    icon: "💇",
    description: "A gentle step-by-step guide to sitting in the salon chair and trimming hair safely.",
    pages: [
      { text: "Sometimes my hair grows long and gets in my eyes. It is time for a haircut!", emoji: "💇" },
      { text: "We go to the barbershop or salon. I sit in a comfortable booster chair.", emoji: "💺" },
      { text: "The hairstylist puts a light cape over my shoulders like a superhero cape to keep tiny hairs off my clothes.", emoji: "🦸" },
      { text: "They spray a little warm water to make my hair damp. The spray bottle goes spritz-spritz!", emoji: "💦" },
      { text: "The scissors make a soft snip-snip sound. It does not hurt at all because hair has no feelings.", emoji: "✂️" },
      { text: "The stylist brushes away any loose hairs with a soft brush. I look so neat and handsome in the mirror!", emoji: "✨" },
    ],
  },
  {
    title: "First Day of School",
    category: "social",
    icon: "🎒",
    description: "Meeting new teachers, playing with classmates, and feeling safe in the classroom.",
    pages: [
      { text: "Today is a big day! I pack my favorite snacks and my water bottle into my backpack.", emoji: "🎒" },
      { text: "We arrive at school. My teacher welcomes me with a warm smile and shows me my cubby.", emoji: "🏫" },
      { text: "In the classroom, there are colorful toys, blocks, and books. I can choose an activity I like.", emoji: "🎨" },
      { text: "During circle time, we sit on the soft rug and sing good morning songs together.", emoji: "🎵" },
      { text: "At playtime, I can share toys with my classmates or play calmly by myself.", emoji: "🧩" },
      { text: "When the bell rings, my family comes to pick me up. I had a wonderful day at school!", emoji: "💛" },
    ],
  },
  {
    title: "Calming Down When Overwhelmed",
    category: "emotions",
    icon: "🧘",
    description: "Gentle breathing techniques and sensory resets when sounds or lights feel too loud.",
    pages: [
      { text: "Sometimes the world feels too loud, too bright, or too busy. It is okay to feel overwhelmed.", emoji: "🌪️" },
      { text: "When my chest feels tight, I can stop and take a deep breath. Smell the flower... blow out the candle.", emoji: "🌸" },
      { text: "I can put on my noise-canceling headphones to make sounds soft and quiet.", emoji: "🎧" },
      { text: "I can use my Angel Talk board to tell my family: 'I need a break' or 'Quiet room please'.", emoji: "💬" },
      { text: "Holding a soft sensory blanket or squishy toy helps my hands and body relax.", emoji: "🧸" },
      { text: "My heart slows down. I feel safe, calm, and peaceful again. I am proud of myself.", emoji: "🌈" },
    ],
  },
  {
    title: "Bedtime Routine",
    category: "routine",
    icon: "🌙",
    description: "Winding down after a fun day: bath, brushing teeth, bedtime stories, and sweet dreams.",
    pages: [
      { text: "The stars are coming out and the sky is dark. It is time to get ready for bedtime.", emoji: "🌙" },
      { text: "I take a warm bath with gentle bubbles. It washes away all the day's play.", emoji: "🛁" },
      { text: "I put on my soft, cozy pajamas that feel smooth on my skin.", emoji: "👕" },
      { text: "I brush my teeth for two minutes until they are squeaky clean.", emoji: "🪥" },
      { text: "We read a sweet bedtime story together under the dim warm nightlight.", emoji: "📖" },
      { text: "I hug my pillow and close my eyes. Tomorrow will be another wonderful day. Goodnight!", emoji: "😴" },
    ],
  },
];

// ==========================================
// 3. ALL VISUAL SCHEDULE ROUTINES & TASKS
// ==========================================
const ALL_SCHEDULE_PRESETS = [
  {
    title: "All Day Routine",
    items: [
      { time: "08:00", label: "Breakfast Time", emoji: "🍳", order: 0 },
      { time: "09:00", label: "Play & Learning", emoji: "🧩", order: 1 },
      { time: "10:30", label: "AAC Speech Session", emoji: "💬", order: 2 },
      { time: "12:00", label: "Healthy Lunch", emoji: "🍽️", order: 3 },
      { time: "13:00", label: "Quiet Rest Time", emoji: "😴", order: 4 },
      { time: "15:00", label: "Sensory Playground", emoji: "⭐", order: 5 },
      { time: "18:00", label: "Family Dinner", emoji: "🍲", order: 6 },
      { time: "20:00", label: "Bedtime Story", emoji: "🌙", order: 7 },
    ],
  },
  {
    title: "Morning Routine",
    items: [
      { time: "07:00", label: "Wake Up", emoji: "⏰", order: 0 },
      { time: "07:15", label: "Wash Face & Brush Teeth", emoji: "🪥", order: 1 },
      { time: "07:30", label: "Get Dressed", emoji: "👕", order: 2 },
      { time: "07:45", label: "Eat Breakfast", emoji: "🥣", order: 3 },
      { time: "08:15", label: "Pack Backpack", emoji: "🎒", order: 4 },
    ],
  },
  {
    title: "Bedtime Routine",
    items: [
      { time: "19:30", label: "Warm Bath", emoji: "🛁", order: 0 },
      { time: "20:00", label: "Put on Pajamas", emoji: "👕", order: 1 },
      { time: "20:15", label: "Brush Teeth", emoji: "🪥", order: 2 },
      { time: "20:30", label: "Read Story", emoji: "📖", order: 3 },
      { time: "20:45", label: "Lights Out & Sleep", emoji: "😴", order: 4 },
    ],
  },
  {
    title: "Therapy & Speech Session",
    items: [
      { time: "10:00", label: "Greet Therapist", emoji: "👋", order: 0 },
      { time: "10:10", label: "Calming Breath Exercise", emoji: "🌬️", order: 1 },
      { time: "10:25", label: "AAC Board Tap Practice", emoji: "🗣️", order: 2 },
      { time: "10:45", label: "Motor Play Activity", emoji: "🎨", order: 3 },
      { time: "10:55", label: "Reward Star", emoji: "⭐", order: 4 },
    ],
  },
];

// ==========================================
// 4. ALL AAC CORE SHELVES & WORDS
// ==========================================
const ALL_SHELVES = [
  {
    name: "Core Vocabulary",
    seedName: "core",
    icon: "💬",
    color: "#4F46E5",
    order: 0,
    words: [
      { label: "I", phrase: "I", emoji: "👤", translations: { "ar-SA": "أنا", "ur-PK": "میں" }, order: 0 },
      { label: "Want", phrase: "I want", emoji: "🤲", translations: { "ar-SA": "أريد", "ur-PK": "چاہیے" }, order: 1 },
      { label: "More", phrase: "I want more", emoji: "➕", translations: { "ar-SA": "المزيد", "ur-PK": "اور" }, order: 2 },
      { label: "Help", phrase: "Please help me", emoji: "🙋", translations: { "ar-SA": "مساعدة", "ur-PK": "مدد" }, order: 3 },
      { label: "No", phrase: "No thank you", emoji: "❌", translations: { "ar-SA": "لا", "ur-PK": "نہیں" }, order: 4 },
      { label: "Yes", phrase: "Yes please", emoji: "✅", translations: { "ar-SA": "نعم", "ur-PK": "ہاں" }, order: 5 },
      { label: "All done", phrase: "I am all done", emoji: "🏁", translations: { "ar-SA": "انتهيت", "ur-PK": "ختم" }, order: 6 },
      { label: "Please", phrase: "Please", emoji: "🙏", translations: { "ar-SA": "من فضلك", "ur-PK": "براہ کرم" }, order: 7 },
      { label: "Thank you", phrase: "Thank you", emoji: "💐", translations: { "ar-SA": "شكراً", "ur-PK": "شکریہ" }, order: 8 },
      { label: "Stop", phrase: "Please stop", emoji: "🛑", translations: { "ar-SA": "توقف", "ur-PK": "روکو" }, order: 9 },
      { label: "Look", phrase: "Look at this", emoji: "👀", translations: { "ar-SA": "انظر", "ur-PK": "دیکھو" }, order: 10 },
      { label: "Go", phrase: "Let's go", emoji: "🏃", translations: { "ar-SA": "اذهب", "ur-PK": "چلو" }, order: 11 },
    ],
  },
  {
    name: "Food & Drinks",
    seedName: "food",
    icon: "🍎",
    color: "#10B981",
    order: 1,
    words: [
      { label: "Water", phrase: "I want water please", emoji: "💧", translations: { "ar-SA": "ماء", "ur-PK": "پانی" }, order: 0 },
      { label: "Milk", phrase: "I want milk", emoji: "🥛", translations: { "ar-SA": "حليب", "ur-PK": "دودھ" }, order: 1 },
      { label: "Juice", phrase: "I want fruit juice", emoji: "🧃", translations: { "ar-SA": "عصير", "ur-PK": "جوس" }, order: 2 },
      { label: "Apple", phrase: "I want an apple", emoji: "🍎", translations: { "ar-SA": "تفاحة", "ur-PK": "سیب" }, order: 3 },
      { label: "Banana", phrase: "I want a banana", emoji: "🍌", translations: { "ar-SA": "موز", "ur-PK": "کیلا" }, order: 4 },
      { label: "Bread", phrase: "I want bread", emoji: "🍞", translations: { "ar-SA": "خبز", "ur-PK": "روٹی" }, order: 5 },
      { label: "Rice", phrase: "I want rice", emoji: "🍚", translations: { "ar-SA": "أرز", "ur-PK": "چاول" }, order: 6 },
      { label: "Chicken", phrase: "I want chicken", emoji: "🍗", translations: { "ar-SA": "دجاج", "ur-PK": "چکن" }, order: 7 },
      { label: "Snack", phrase: "Can I have a snack?", emoji: "🍪", translations: { "ar-SA": "وجبة خفيفة", "ur-PK": "سنیک" }, order: 8 },
    ],
  },
  {
    name: "Feelings & Sensory",
    seedName: "feelings",
    icon: "😊",
    color: "#F59E0B",
    order: 2,
    words: [
      { label: "Happy", phrase: "I feel happy", emoji: "😊", translations: { "ar-SA": "سعيد", "ur-PK": "خوش" }, order: 0 },
      { label: "Sad", phrase: "I feel sad", emoji: "😢", translations: { "ar-SA": "حزين", "ur-PK": "اداس" }, order: 1 },
      { label: "Tired", phrase: "I am tired", emoji: "🥱", translations: { "ar-SA": "تعبان", "ur-PK": "تھکا ہوا" }, order: 2 },
      { label: "Calm", phrase: "I feel calm", emoji: "😌", translations: { "ar-SA": "هادئ", "ur-PK": "پرسکون" }, order: 3 },
      { label: "Scared", phrase: "I feel scared", emoji: "😨", translations: { "ar-SA": "خائف", "ur-PK": "خوفزدہ" }, order: 4 },
      { label: "Pain", phrase: "Something hurts", emoji: "🤕", translations: { "ar-SA": "مؤلم", "ur-PK": "درد" }, order: 5 },
      { label: "Hungry", phrase: "I am hungry", emoji: "🍽️", translations: { "ar-SA": "جائع", "ur-PK": "بھوک" }, order: 6 },
      { label: "Thirsty", phrase: "I am thirsty", emoji: "🥤", translations: { "ar-SA": "عطشان", "ur-PK": "پیاس" }, order: 7 },
    ],
  },
  {
    name: "Family & People",
    seedName: "people",
    icon: "👨‍👩‍👦",
    color: "#3B82F6",
    order: 3,
    words: [
      { label: "Mom", phrase: "I want Mama", emoji: "👩", translations: { "ar-SA": "ماما", "ur-PK": "امی" }, order: 0 },
      { label: "Dad", phrase: "I want Baba", emoji: "👨", translations: { "ar-SA": "بابا", "ur-PK": "ابو" }, order: 1 },
      { label: "Teacher", phrase: "Teacher please", emoji: "👩‍🏫", translations: { "ar-SA": "معلمتي", "ur-PK": "استانی" }, order: 2 },
      { label: "Doctor", phrase: "I want the doctor", emoji: "🩺", translations: { "ar-SA": "طبيب", "ur-PK": "ڈاکٹر" }, order: 3 },
      { label: "Friend", phrase: "My friend", emoji: "🤝", translations: { "ar-SA": "صديقي", "ur-PK": "دوست" }, order: 4 },
      { label: "Brother", phrase: "My brother", emoji: "👦", translations: { "ar-SA": "أخي", "ur-PK": "بھائی" }, order: 5 },
      { label: "Sister", phrase: "My sister", emoji: "👧", translations: { "ar-SA": "أختي", "ur-PK": "بہن" }, order: 6 },
    ],
  },
  {
    name: "Places & Outings",
    seedName: "places",
    icon: "🏡",
    color: "#8B5CF6",
    order: 4,
    words: [
      { label: "Home", phrase: "I want to go home", emoji: "🏠", translations: { "ar-SA": "البيت", "ur-PK": "گھر" }, order: 0 },
      { label: "School", phrase: "Let's go to school", emoji: "🏫", translations: { "ar-SA": "المدرسة", "ur-PK": "سکول" }, order: 1 },
      { label: "Park", phrase: "I want to go to the park", emoji: "🌳", translations: { "ar-SA": "الحديقة", "ur-PK": "پارک" }, order: 2 },
      { label: "Clinic", phrase: "We are at the clinic", emoji: "🏥", translations: { "ar-SA": "العيادة", "ur-PK": "کلینک" }, order: 3 },
      { label: "Car", phrase: "In the car", emoji: "🚗", translations: { "ar-SA": "السيارة", "ur-PK": "گاڑی" }, order: 4 },
      { label: "Store", phrase: "Supermarket store", emoji: "🛒", translations: { "ar-SA": "البقالة", "ur-PK": "دکان" }, order: 5 },
    ],
  },
  {
    name: "Saudi Cultural Daily Life",
    seedName: "saudi_culture",
    icon: "🌴",
    color: "#059669",
    order: 5,
    words: [
      { label: "Gahwa", phrase: "I want Saudi coffee", emoji: "☕", translations: { "ar-SA": "قهوة سعودية", "ur-PK": "قہوہ" }, order: 0 },
      { label: "Dates", phrase: "I want dates", emoji: "🌴", translations: { "ar-SA": "تمر", "ur-PK": "کھجور" }, order: 1 },
      { label: "Salam", phrase: "Peace be upon you", emoji: "🤝", translations: { "ar-SA": "السلام عليكم", "ur-PK": "السلام علیکم" }, order: 2 },
      { label: "Mosque", phrase: "Time for mosque prayer", emoji: "🕌", translations: { "ar-SA": "المسجد", "ur-PK": "مسجد" }, order: 3 },
      { label: "Family Gathering", phrase: "Gather with family", emoji: "👨‍👩‍👧‍👦", translations: { "ar-SA": "جمعة العائلة", "ur-PK": "خاندانی محفل" }, order: 4 },
      { label: "Alhamdulillah", phrase: "Praise be to God", emoji: "🤲", translations: { "ar-SA": "الحمد لله", "ur-PK": "الحمد للہ" }, order: 5 },
    ],
  },
];

export async function seedAll(options: { closeConnection?: boolean } = { closeConnection: true }) {
  console.log("====================================================");
  console.log("ANGEL TALK MASTER SEEDER: PERSISTING ALL TO DATABASE");
  console.log("====================================================");

  if (mongoose.connection.readyState !== 1) {
    console.log(`Connecting to database: ${env.MONGO_URI.replace(/:[^:]*@/, ":****@")}`);
    await mongoose.connect(env.MONGO_URI);
    console.log("Connected to MongoDB successfully.\n");
  }

  // 1. SEED SUPERADMIN USER
  const passwordHash = await bcrypt.hash(env.ADMIN_PASSWORD, 12);
  const pinHash = await bcrypt.hash("9999", 10);
  await User.findOneAndUpdate(
    { email: env.ADMIN_EMAIL.toLowerCase() },
    {
      passwordHash,
      fullName: "Angel Talk Sovereign Administrator",
      role: "superadmin",
      status: "active",
      pinHash,
      tokenVersion: 1,
    },
    { upsert: true, new: true }
  );
  console.log(`✅ [USERS] Seeded Superadmin: ${env.ADMIN_EMAIL} (username: angeltalkadmin, password: ${env.ADMIN_PASSWORD})`);

  // Demo family, verbs, schedule and board are only for local demos (SEED_DEMO=true). The real
  // database holds only what the app sends and the app's own content (npm run seed:catalog).
  if (process.env.SEED_DEMO !== "true") {
    console.log("ℹ️ Demo data skipped (set SEED_DEMO=true to add the demo family).");
    if (options.closeConnection) {
      await mongoose.connection.close();
      process.exit(0);
    }
    return;
  }

  // 2. SEED DEFAULT PARENT ACCOUNT & CHILD BIO DATA
  const parentEmail = "parent@angeltalk.sa";
  let parent = await User.findOne({ email: parentEmail });
  if (!parent) {
    const passHash = await bcrypt.hash("Parent123!Safe", 12);
    const pinHash = await bcrypt.hash("1234", 10);
    parent = await User.create({
      _id: uuidv4(),
      email: parentEmail,
      passwordHash: passHash,
      fullName: "Fatimah Al-Zahrani",
      role: "parent",
      status: "active",
      pinHash,
      tokenVersion: 1,
    });
    console.log(`✅ [USERS] Seeded Demo Parent Account: ${parentEmail}`);
  }

  // Seed Child Profile (Bio Data) for this parent
  let child = await Child.findOne({ ownerId: parent._id, deletedAt: null });
  if (!child) {
    child = await Child.create({
      _id: uuidv4(),
      ownerId: parent._id,
      name: "Rayan",
      age: 6,
      diagnoses: ["autism", "non_verbal"],
      settings: {
        language: "ar-SA",
        voiceType: "boy",
        boardMode: "phrase",
        bilingualDisplay: true,
        simpleMode: true,
        speechRate: 0.9,
        boardColumns: 3,
        highContrast: false,
        hapticsEnabled: true,
      },
      rewards: {
        stars: 36,
        badges: ["first_word", "3_day_streak", "super_talker"],
        consecutiveDays: 5,
        lastActiveDate: new Date(),
      },
      face: {
        consent: true,
        consentAt: new Date(),
        version: 1,
        enrolledAt: new Date(),
      },
      clientUpdatedAt: new Date(),
    });

    await Passcard.create({
      _id: uuidv4(),
      ownerId: parent._id,
      childId: child._id,
      name: "Rayan",
      emergencyContact: "+966 50 123 4567",
      allergies: "None reported",
      clientUpdatedAt: new Date(),
    });

    await UsageSummary.create({
      _id: uuidv4(),
      ownerId: parent._id,
      childId: child._id,
      wordTotals: new Map([["Water", 45], ["Want", 38], ["Help", 29], ["Mom", 24]]),
      wordsByDay: [12, 18, 22, 19, 25, 14, 16],
      scheduleByDay: [100, 80, 100, 90, 100, 75, 85],
      clientUpdatedAt: new Date(),
    });

    console.log(`✅ [CHILDREN] Seeded Child Bio Data: "${child.name}" (Age 6, Autism) with Passcard & Usage.`);
  } else {
    console.log(`ℹ️ [CHILDREN] Child Bio Data for "${child.name}" already exists.`);
  }

  // 3. SEED ALL 25+ 5-FORM VERBS
  let verbsCount = 0;
  for (const v of ALL_VERBS) {
    await VerbGroup.findOneAndUpdate(
      { base: v.base },
      {
        base: v.base,
        emoji: v.emoji,
        pictogramId: v.pictogramId,
        forms: v.forms,
        active: true,
      },
      { upsert: true, new: true }
    );
    verbsCount++;
  }
  console.log(`✅ [VERBS] Seeded ${verbsCount} 5-Form Verb Groups (EN, UR, AR).`);

  // 4. Social stories are not shown in the app, so none are seeded (ALL_STORIES is kept for later).

  // 5. SEED VISUAL SCHEDULE TASKS
  let tasksCount = 0;
  for (const preset of ALL_SCHEDULE_PRESETS) {
    for (const item of preset.items) {
      await ScheduleTask.findOneAndUpdate(
        { childId: child._id, title: item.label },
        {
          ownerId: parent._id,
          childId: child._id,
          title: item.label,
          time: item.time,
          emoji: item.emoji,
          dayOfWeek: 1, // Active everyday
          order: item.order,
          completedDates: [],
          clientUpdatedAt: new Date(),
        },
        { upsert: true, new: true }
      );
      tasksCount++;
    }
  }
  console.log(`✅ [SCHEDULE] Seeded ${tasksCount} Visual Schedule Tasks.`);

  // 6. SEED ALL AAC CORE SHELVES & WORDS
  let shelvesCount = 0;
  let wordsCount = 0;
  for (const s of ALL_SHELVES) {
    const shelf = await Shelf.findOneAndUpdate(
      { childId: child._id, name: s.name },
      {
        ownerId: parent._id,
        childId: child._id,
        name: s.name,
        seedName: s.seedName,
        icon: s.icon,
        color: s.color,
        order: s.order,
        hidden: false,
        clientUpdatedAt: new Date(),
      },
      { upsert: true, new: true }
    );
    shelvesCount++;

    for (const w of s.words) {
      await Word.findOneAndUpdate(
        { childId: child._id, shelfId: shelf._id, label: w.label },
        {
          ownerId: parent._id,
          childId: child._id,
          shelfId: shelf._id,
          label: w.label,
          phrase: w.phrase,
          emoji: w.emoji,
          color: ("color" in w && typeof (w as { color?: string }).color === "string") ? (w as { color: string }).color : s.color,
          order: w.order,
          translations: new Map(Object.entries(w.translations || {})),
          useCount: Math.floor(Math.random() * 20) + 1,
          clientUpdatedAt: new Date(),
        },
        { upsert: true, new: true }
      );
      wordsCount++;
    }

    // Board templates come from the app itself (npm run seed:catalog), not from this demo list
  }
  console.log(`✅ [BOARD] Seeded ${shelvesCount} Shelves and ${wordsCount} Communication Word Cards.`);

  console.log("\n====================================================");
  console.log("🎉 ALL HARDCODED DATA SUCCESSFULLY SAVED TO DATABASE!");
  console.log("====================================================");
  if (options.closeConnection) {
    await mongoose.connection.close();
    process.exit(0);
  }
}

const isDirectRun = process.argv[1] && (process.argv[1].endsWith("seed.ts") || process.argv[1].endsWith("seed.js"));
if (isDirectRun) {
  seedAll().catch((err) => {
    console.error("FATAL: Seed execution failed:", err);
    process.exit(1);
  });
}
