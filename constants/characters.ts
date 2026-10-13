import type { ImageSourcePropType } from 'react-native';

export interface Character {
  name: string;
  status: string;
  image: ImageSourcePropType;
}

export const CHARACTERS: Character[] = [
  { name: '호시노', status: '낮잠 중 방해금지', image: require('../assets/images/hoshino.jpg') },
  { name: '히나', status: '', image: require('../assets/images/hina.jpg') },
];

const byName = new Map(CHARACTERS.map((c) => [c.name, c]));

export function findCharacter(name: string): Character | undefined {
  return byName.get(name);
}

export function avatarOf(name: string): ImageSourcePropType | undefined {
  return byName.get(name)?.image;
}
