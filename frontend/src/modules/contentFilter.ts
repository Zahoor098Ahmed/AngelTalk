import type { ChildProfile, ContentItem, ContentTag } from '../types';

export const ALL_CONTENT: ContentItem[] = [
  { id: 'c1', title: 'Colors', emoji: '🎨', tag: 'colors', minAge: 2, maxAge: 12, color: '#ffb3ba' },
  { id: 'c2', title: 'Count to 10', emoji: '🔢', tag: 'numbers', minAge: 3, maxAge: 10, color: '#ffd93d' },
  { id: 'c3', title: 'Shapes Fun', emoji: '🔷', tag: 'shapes', minAge: 2, maxAge: 8, color: '#a8d8ea' },
  { id: 'c4', title: 'Farm Animals', emoji: '🐄', tag: 'animals', minAge: 2, maxAge: 10, color: '#a8e6cf' },
  { id: 'c5', title: 'Jungle Friends', emoji: '🦁', tag: 'animals', minAge: 3, maxAge: 12, color: '#a8e6cf' },
  { id: 'c6', title: 'Happy Songs', emoji: '🎵', tag: 'music', minAge: 2, maxAge: 12, color: '#c3b1e1' },
  { id: 'c7', title: 'Nursery Rhymes', emoji: '🎶', tag: 'music', minAge: 2, maxAge: 7, color: '#c3b1e1' },
  { id: 'c8', title: 'The Brave Bear', emoji: '📖', tag: 'stories', minAge: 4, maxAge: 10, color: '#ffcba4' },
  { id: 'c9', title: 'My Feelings', emoji: '😊', tag: 'social', minAge: 3, maxAge: 12, color: '#ffd93d' },
  { id: 'c10', title: 'Making Friends', emoji: '👫', tag: 'social', minAge: 4, maxAge: 12, color: '#ffd93d' },
  { id: 'c11', title: 'Art Time', emoji: '🖌️', tag: 'art', minAge: 2, maxAge: 12, color: '#ffb3ba' },
  { id: 'c12', title: 'Nature Walk', emoji: '🌿', tag: 'nature', minAge: 3, maxAge: 12, color: '#a8e6cf' },
  { id: 'c13', title: 'Say It!', emoji: '💬', tag: 'speech', minAge: 2, maxAge: 10, color: '#87ceeb' },
  { id: 'c14', title: 'Let\'s Move!', emoji: '🏃', tag: 'motor', minAge: 3, maxAge: 12, color: '#ffcba4' },
  { id: 'c15', title: 'Big Numbers', emoji: '🔢', tag: 'numbers', minAge: 6, maxAge: 14, color: '#ffd93d' },
  { id: 'c16', title: 'Ocean Life', emoji: '🐠', tag: 'nature', minAge: 4, maxAge: 12, color: '#87ceeb' },
];

export function filterContent(child: ChildProfile): ContentItem[] {
  return ALL_CONTENT.filter(
    item =>
      child.allowedTags.includes(item.tag as ContentTag) &&
      child.age >= item.minAge &&
      child.age <= item.maxAge
  );
}
