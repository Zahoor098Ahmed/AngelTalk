import AsyncStorage from "@react-native-async-storage/async-storage";
import type { SocialStory } from "../types";

const STORIES_STORAGE_KEY = "angeltalk_social_stories";

export const BUILT_IN_STORIES: SocialStory[] = [
  {
    id: "story_dentist",
    title: "Going to the Dentist",
    category: "health",
    icon: "🦷",
    description: "What happens when we visit the dental clinic and keep our teeth sparkling clean.",
    pages: [
      {
        text: "Today I am going to visit the dentist. The dentist is a friendly doctor who counts and cleans my teeth.",
        emoji: "🦷",
      },
      {
        text: "When we arrive, I sit in a special big chair that can move up and down. It feels like a magic ride!",
        emoji: "💺",
      },
      {
        text: "The dentist wears a mask and gloves to keep everything safe and germ-free. They smile with their eyes.",
        emoji: "😷",
      },
      {
        text: "I open my mouth wide like a happy lion! The dentist uses a tiny mirror to look at all my teeth.",
        emoji: "🦁",
      },
      {
        text: "They use a soft electric brush that tickles my teeth with yummy mint toothpaste.",
        emoji: "🪥",
      },
      {
        text: "All done! I rinse with water and spit it out. My teeth are clean and shiny, and I get a reward sticker!",
        emoji: "⭐",
      },
    ],
  },
  {
    id: "story_haircut",
    title: "Getting a Haircut",
    category: "routine",
    icon: "💇",
    description: "A gentle step-by-step guide to sitting in the salon chair and trimming hair safely.",
    pages: [
      {
        text: "Sometimes my hair grows long and gets in my eyes. It is time for a haircut!",
        emoji: "💇",
      },
      {
        text: "We go to the barbershop or salon. I sit in a comfortable booster chair.",
        emoji: "💺",
      },
      {
        text: "The hairstylist puts a light cape over my shoulders like a superhero cape to keep tiny hairs off my clothes.",
        emoji: "🦸",
      },
      {
        text: "They spray a little warm water to make my hair damp. The spray bottle goes spritz-spritz!",
        emoji: "💦",
      },
      {
        text: "They comb my hair gently and trim the tips. Haircuts do not hurt at all because hair has no nerves.",
        emoji: "✂️",
      },
      {
        text: "The cape comes off, they dust my neck with a soft brush, and I look in the mirror looking awesome!",
        emoji: "✨",
      },
    ],
  },
  {
    id: "story_school",
    title: "First Day of School",
    category: "school",
    icon: "🏫",
    description: "Walking into class, meeting kind teachers, and having fun learning with friends.",
    pages: [
      {
        text: "School is a bright place where I learn, draw, and play with other children.",
        emoji: "🏫",
      },
      {
        text: "I pack my backpack with my water bottle, snacks, and favorite communication cards.",
        emoji: "🎒",
      },
      {
        text: "When I arrive at my classroom, my teacher greets me with a kind smile and says 'Good Morning!'",
        emoji: "👩‍🏫",
      },
      {
        text: "We sit on the circle rug for story time. When I want to speak, I raise my hand or tap my Angel Talk card.",
        emoji: "🙋",
      },
      {
        text: "At recess, we play on the swings and slides. I share toys and take turns nicely.",
        emoji: "🛝",
      },
      {
        text: "At the end of the day, my family comes to pick me up. I had a wonderful day at school!",
        emoji: "🏡",
      },
    ],
  },
  {
    id: "story_calm",
    title: "When I Feel Overwhelmed",
    category: "emotions",
    icon: "🧘",
    description: "Calming strategies when sounds get loud or feelings get too big.",
    pages: [
      {
        text: "Sometimes sounds are too loud, lights are too bright, or I feel angry inside. That is okay.",
        emoji: "🌪️",
      },
      {
        text: "When my body feels uncomfortable, I can pause and put on my noise-canceling headphones.",
        emoji: "🎧",
      },
      {
        text: "I take 3 slow balloon breaths. Breathe in through my nose: 1, 2, 3... and breathe out slowly.",
        emoji: "🎈",
      },
      {
        text: "I can tap 'I need a break' or 'Quiet corner' on my Angel Talk board to let everyone know.",
        emoji: "💬",
      },
      {
        text: "I hug my soft sensory blanket or squeeze my stress ball until my heartbeat feels steady.",
        emoji: "🧸",
      },
      {
        text: "Now I feel calm, safe, and ready to play again. My family and teachers are always here to help me.",
        emoji: "🌈",
      },
    ],
  },
  {
    id: "story_sharing",
    title: "Taking Turns & Sharing",
    category: "social",
    icon: "🤝",
    description: "How to wait patiently and share toys happily with others.",
    pages: [
      {
        text: "Playing with toys is lots of fun, especially when we play together with friends and siblings.",
        emoji: "🧩",
      },
      {
        text: "Sometimes someone else is playing with the toy I want. I do not snatch or push.",
        emoji: "⏳",
      },
      {
        text: "I can use my words or tap my card: 'Can I have a turn after you please?'",
        emoji: "💬",
      },
      {
        text: "While I wait, I can count to 10 or play with another fun game.",
        emoji: "🔟",
      },
      {
        text: "When my turn comes, I say 'Thank you!' Playing together makes everyone smile.",
        emoji: "😄",
      },
    ],
  },
  {
    id: "story_doctor",
    title: "Visiting the Doctor",
    category: "health",
    icon: "🩺",
    description: "Doctor checkups, stethoscopes, and staying healthy and strong.",
    pages: [
      {
        text: "Doctors are kind helpers who make sure our bodies grow strong and healthy.",
        emoji: "🩺",
      },
      {
        text: "In the clinic room, the nurse checks my height and weighs me on a big scale.",
        emoji: "📏",
      },
      {
        text: "The doctor listens to my heart with a stethoscope. It sounds like a gentle drum: thud-thud, thud-thud!",
        emoji: "💓",
      },
      {
        text: "They shine a little penlight into my ears and throat. I say 'Aaaah' like a singing bird.",
        emoji: "🔦",
      },
      {
        text: "The checkup is complete! The doctor says I am doing great and gives me a thumbs-up.",
        emoji: "👍",
      },
    ],
  },
  {
    id: "story_supermarket",
    title: "Going to the Supermarket",
    category: "routine",
    icon: "🛒",
    description: "Shopping with a grocery list, staying close to grown-ups, and helping pick foods.",
    pages: [
      {
        text: "Today we are visiting the grocery store to buy delicious food for our family.",
        emoji: "🛒",
      },
      {
        text: "The store has lots of colorful aisles. I hold my parent's hand or walk right next to the shopping cart.",
        emoji: "🤝",
      },
      {
        text: "We check our list: fresh red apples, bananas, milk, and crunchy bread.",
        emoji: "📋",
      },
      {
        text: "I help place items gently into the shopping cart without dropping them.",
        emoji: "🍎",
      },
      {
        text: "At the checkout, the cashier scans the items: beep, beep! Then we pack them into bags and head home.",
        emoji: "🛍️",
      },
    ],
  },
  {
    id: "story_bedtime",
    title: "Bedtime Routine",
    category: "routine",
    icon: "🌙",
    description: "Winding down after a fun day: bath, pajamas, storybook, and sweet dreams.",
    pages: [
      {
        text: "The sun has set and the stars are twinkling in the night sky. It is bedtime.",
        emoji: "🌙",
      },
      {
        text: "I take a warm bath with bubbles, dry off, and put on my cozy pajamas.",
        emoji: "🛁",
      },
      {
        text: "I brush my teeth for two whole minutes to keep my smile sparkling clean.",
        emoji: "🪥",
      },
      {
        text: "I cuddle in my soft bed and read a quiet bedtime storybook with my family.",
        emoji: "📖",
      },
      {
        text: "We turn off the big light and turn on my gentle nightlight. Goodnight, sweet dreams!",
        emoji: "😴",
      },
    ],
  },
];

let customStoriesCache: SocialStory[] = [];
let loaded = false;

export async function loadAllStories(): Promise<SocialStory[]> {
  if (loaded) {
    return [...BUILT_IN_STORIES, ...customStoriesCache];
  }
  try {
    const raw = await AsyncStorage.getItem(STORIES_STORAGE_KEY);
    customStoriesCache = raw ? JSON.parse(raw) : [];
  } catch {
    customStoriesCache = [];
  }
  loaded = true;
  return [...BUILT_IN_STORIES, ...customStoriesCache];
}

export async function addCustomStory(story: SocialStory): Promise<void> {
  await loadAllStories();
  customStoriesCache.unshift(story);
  await AsyncStorage.setItem(STORIES_STORAGE_KEY, JSON.stringify(customStoriesCache));
}

export async function deleteCustomStory(id: string): Promise<void> {
  await loadAllStories();
  customStoriesCache = customStoriesCache.filter((s) => s.id !== id);
  await AsyncStorage.setItem(STORIES_STORAGE_KEY, JSON.stringify(customStoriesCache));
}
